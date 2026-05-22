import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:uuid/uuid.dart';
import 'secure_storage.dart';

// ── Config ────────────────────────────────────────────────────────────────────
// 10.0.2.2  = Android emulator → your PC's localhost
// 192.168.x.x = real device on same WiFi → your PC's local IP
const String kBaseUrl = 'http://192.168.0.4:3000';

// ── Models ────────────────────────────────────────────────────────────────────

class CoinPack {
  final String id;
  final int coins;
  final double priceInr;
  final String label;
  final String tag;

  const CoinPack({
    required this.id,
    required this.coins,
    required this.priceInr,
    required this.label,
    required this.tag,
  });

  factory CoinPack.fromJson(Map<String, dynamic> j) => CoinPack(
    id: j['id'],
    coins: j['coins'],
    priceInr: (j['price_inr'] as num).toDouble(),
    label: j['label'],
    tag: j['tag'] ?? '',
  );
}

class ProInfo {
  final double priceInr;
  final bool isActive;
  final String? expiresAt;
  final List<String> perks;

  const ProInfo({
    required this.priceInr,
    required this.isActive,
    this.expiresAt,
    required this.perks,
  });

  factory ProInfo.fromJson(Map<String, dynamic> j) => ProInfo(
    priceInr: (j['price_inr'] as num).toDouble(),
    isActive: j['is_active'] ?? false,
    expiresAt: j['expires_at'],
    perks: List<String>.from(j['perks'] ?? []),
  );
}

// ── Secure HTTP client ────────────────────────────────────────────────────────
// Enforces HTTPS-only in production and adds a 15-second timeout
http.Client _buildClient() => http.Client();

Future<http.Response> _securePost(
  String path,
  Map<String, dynamic> body, {
  String? idempotencyKey,
}) async {
  final token = await SecureStorage.getValidToken();
  if (token == null) throw const _AuthException('Session expired. Please log in again.');

  // Block plain HTTP in production (allow local IPs for development)
  final uri = Uri.parse('$kBaseUrl$path');
  final host = uri.host;
  final isLocalDev = host == '10.0.2.2' ||
      host == 'localhost' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.');
  if (!isLocalDev && uri.scheme != 'https') {
    throw const _SecurityException('Insecure connection blocked.');
  }

  final headers = <String, String>{
    'Content-Type':  'application/json',
    'Authorization': 'Bearer $token',
  };
  if (idempotencyKey != null) headers['Idempotency-Key'] = idempotencyKey;

  return _buildClient()
      .post(uri, headers: headers, body: jsonEncode(body))
      .timeout(const Duration(seconds: 15));
}

Future<http.Response> _secureGet(String path) async {
  final token = await SecureStorage.getValidToken();
  if (token == null) throw const _AuthException('Session expired. Please log in again.');

  final uri = Uri.parse('$kBaseUrl$path');
  return _buildClient()
      .get(uri, headers: {'Authorization': 'Bearer $token'})
      .timeout(const Duration(seconds: 15));
}

// ── Custom exceptions ─────────────────────────────────────────────────────────
class _AuthException implements Exception {
  final String message;
  const _AuthException(this.message);
}

class _SecurityException implements Exception {
  final String message;
  const _SecurityException(this.message);
}

// ── Payment Service ───────────────────────────────────────────────────────────
class PaymentService {
  static final PaymentService _instance = PaymentService._();
  factory PaymentService() => _instance;
  PaymentService._();

  Razorpay? _razorpay;

  // ── Security: payment lock prevents opening two sheets simultaneously ───────
  bool _paymentInProgress = false;

  void Function(int coinsAdded, int totalCoins, bool isPro)? onSuccess;
  void Function(String error)? onError;

  // ── Idempotency key — unique per payment attempt ───────────────────────────
  String? _currentIdempotencyKey;

  void _init() {
    _razorpay = Razorpay();
    _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handleSuccess);
    _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR,   _handleError);
    _razorpay!.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleWallet);
  }

  void dispose() {
    _razorpay?.clear();
    _razorpay = null;
    _paymentInProgress = false;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  Future<void> startCoinPurchase(
    CoinPack pack,
    String userEmail,
    String userName,
  ) async {
    await _launchPayment(
      type: 'coins',
      packId: pack.id,
      description: 'KarmaCoins — ${pack.label}',
      email: userEmail,
      name: userName,
    );
  }

  Future<void> startProSubscription(
    double priceInr,
    String userEmail,
    String userName,
  ) async {
    await _launchPayment(
      type: 'pro',
      packId: '',
      description: 'KarmaCoins Pro — Monthly',
      email: userEmail,
      name: userName,
    );
  }

  // ── Core launch flow ───────────────────────────────────────────────────────
  Future<void> _launchPayment({
    required String type,
    required String packId,
    required String description,
    required String email,
    required String name,
  }) async {
    // ── Security 1: Payment lock — no concurrent payments ────────────────────
    if (_paymentInProgress) {
      onError?.call('A payment is already in progress.');
      return;
    }
    _paymentInProgress = true;

    // ── Security 2: Jailbreak / root check ───────────────────────────────────
    if (await _isDeviceCompromised()) {
      _paymentInProgress = false;
      onError?.call('Payments are not available on rooted or jailbroken devices.');
      return;
    }

    // ── Security 3: Token validity check (before any network call) ───────────
    final token = await SecureStorage.getValidToken();
    if (token == null) {
      _paymentInProgress = false;
      onError?.call('Session expired. Please log in again.');
      return;
    }

    // ── Security 4: Idempotency key — unique UUID per attempt ────────────────
    _currentIdempotencyKey = const Uuid().v4();

    _init();

    try {
      // ── Step 1: Create order on backend ────────────────────────────────────
      final res = await _securePost(
        '/api/payments/create-order',
        {'type': type, 'pack_id': packId},
        idempotencyKey: _currentIdempotencyKey,
      );

      if (res.statusCode != 200) {
        final err = _parseError(res.body);
        _paymentInProgress = false;
        onError?.call(err);
        return;
      }

      final data = jsonDecode(res.body) as Map<String, dynamic>;

    if (data['order_id'] == null ||
        data['key_id'] == null ||
        data['amount'] == null) {
        _paymentInProgress = false;
        onError?.call('Invalid server response. Please try again.');
        return;
      }

      // ── Step 2: Open Razorpay checkout ─────────────────────────────────────
      final options = <String, dynamic>{
        'key':         data['key_id'],
        'amount':      data['amount'],   // amount from server, not local
        'currency':    'INR',
        'order_id':    data['order_id'],
        'name':        'KarmaCoins',
        'description': description,
        'prefill':     {'email': email, 'name': name},
        'theme':       {'color': '#6C5CE7'},
        'retry':       {'enabled': false}, // disable Razorpay's own retry UI
        'external':    {'wallets': ['paytm', 'phonepe', 'googlepay']},
      };

      _razorpay!.open(options);
    } on SocketException {
      _paymentInProgress = false;
      onError?.call('No internet connection. Please check your network.');
    } on TimeoutException {
      _paymentInProgress = false;
      onError?.call('Request timed out. Please try again.');
    } catch (e) {
      _paymentInProgress = false;
      // Catch _AuthException and _SecurityException here too
      if (e is _AuthException) {
        onError?.call(e.message);
      } else if (e is _SecurityException) {
        onError?.call(e.message);
      } else {
        onError?.call('Something went wrong. Please try again.');
      }
    }
  }

  // ── Step 3: Verify with backend after Razorpay success ────────────────────
  Future<void> _handleSuccess(PaymentSuccessResponse response) async {
    try {
      // ── Security 6: Validate Razorpay response fields are non-empty ─────────
      if ((response.orderId?.isEmpty ?? true) ||
          (response.paymentId?.isEmpty ?? true) ||
          (response.signature?.isEmpty ?? true)) {
        onError?.call('Incomplete payment response. Contact support.');
        return;
      }

      final res = await _securePost(
        '/api/payments/verify',
        {
          'razorpay_order_id':   response.orderId,
          'razorpay_payment_id': response.paymentId,
          'razorpay_signature':  response.signature,
        },
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        onSuccess?.call(
          (data['coins_added'] as num).toInt(),
          (data['coins'] as num).toInt(),
          data['is_pro'] as bool,
        );
      } else {
        onError?.call('Payment verification failed. Contact support with your payment ID: ${response.paymentId}');
      }
    } on _AuthException catch (e) {
      onError?.call(e.message);
    } on SocketException {
      // Payment went through but verify failed — user should contact support
      onError?.call('Payment received but verification failed. Contact support with ID: ${response.paymentId}');
    } catch (_) {
      onError?.call('Verification error. Contact support with ID: ${response.paymentId}');
    } finally {
      _paymentInProgress = false;
      _currentIdempotencyKey = null;
    }
  }

  void _handleError(PaymentFailureResponse response) {
    _paymentInProgress = false;
    _currentIdempotencyKey = null;
    // Don't expose raw Razorpay error codes to users
    final msg = response.message ?? '';
    if (msg.contains('cancel') || msg.contains('Cancel')) {
      onError?.call('Payment cancelled.');
    } else {
      onError?.call('Payment failed. Please try a different payment method.');
    }
  }

  void _handleWallet(ExternalWalletResponse _) {
    // External wallet selected — Razorpay handles the rest
    _paymentInProgress = false;
  }

  // ── Fetch packs ────────────────────────────────────────────────────────────
  Future<({List<CoinPack> packs, ProInfo pro})> fetchPacks() async {
    final res  = await _secureGet('/api/payments/packs');
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return (
      packs: (data['coin_packs'] as List).map((e) => CoinPack.fromJson(e as Map<String, dynamic>)).toList(),
      pro:   ProInfo.fromJson(data['pro'] as Map<String, dynamic>),
    );
  }

  // ── Fetch history ──────────────────────────────────────────────────────────
  Future<List<Map<String, dynamic>>> fetchHistory() async {
    final res  = await _secureGet('/api/payments/history');
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return List<Map<String, dynamic>>.from(data['payments'] as List);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /// Basic jailbreak/root detection.
  /// Not foolproof but blocks casual attacks.
  Future<bool> _isDeviceCompromised() async {
    if (Platform.isAndroid) {
      // Check for common root indicators
      final paths = [
        '/system/app/Superuser.apk',
        '/sbin/su',
        '/system/bin/su',
        '/system/xbin/su',
        '/data/local/xbin/su',
        '/data/local/bin/su',
        '/system/sd/xbin/su',
      ];
      for (final p in paths) {
        if (await File(p).exists()) return true;
      }
    } else if (Platform.isIOS) {
      // Check for common jailbreak indicators
      final paths = [
        '/Applications/Cydia.app',
        '/Library/MobileSubstrate/MobileSubstrate.dylib',
        '/bin/bash',
        '/usr/sbin/sshd',
        '/etc/apt',
      ];
      for (final p in paths) {
        if (await File(p).exists()) return true;
      }
    }
    return false;
  }

  String _parseError(String body) {
    try {
      final data = jsonDecode(body) as Map<String, dynamic>;
      return data['error']?.toString() ?? 'Something went wrong.';
    } catch (_) {
      return 'Something went wrong.';
    }
  }
}
