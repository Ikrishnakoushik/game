import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ── Config ────────────────────────────────────────────────────────────────────
// Change to your machine's IP when testing on a physical device
const String kBaseUrl = 'http://10.0.2.2:3000'; // Android emulator → localhost

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

// ── Payment Service ───────────────────────────────────────────────────────────
class PaymentService {
  static final PaymentService _instance = PaymentService._();
  factory PaymentService() => _instance;
  PaymentService._();

  Razorpay? _razorpay;

  // Callbacks set by the UI before launching payment
  void Function(int coinsAdded, int totalCoins, bool isPro)? onSuccess;
  void Function(String error)? onError;

  void _init() {
    _razorpay = Razorpay();
    _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handleSuccess);
    _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR,   _handleError);
    _razorpay!.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleWallet);
  }

  void dispose() {
    _razorpay?.clear();
    _razorpay = null;
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // ── Step 1: Create order on backend ────────────────────────────────────────
  Future<void> startCoinPurchase(CoinPack pack, String userEmail, String userName) async {
    await _launchPayment(
      type: 'coins',
      packId: pack.id,
      amountPaise: (pack.priceInr * 100).toInt(),
      description: 'KarmaCoins — ${pack.label}',
      email: userEmail,
      name: userName,
    );
  }

  Future<void> startProSubscription(double priceInr, String userEmail, String userName) async {
    await _launchPayment(
      type: 'pro',
      packId: '',
      amountPaise: (priceInr * 100).toInt(),
      description: 'KarmaCoins Pro — Monthly',
      email: userEmail,
      name: userName,
    );
  }

  Future<void> _launchPayment({
    required String type,
    required String packId,
    required int amountPaise,
    required String description,
    required String email,
    required String name,
  }) async {
    _init();
    final token = await _getToken();
    if (token == null) { onError?.call('Not logged in'); return; }

    try {
      final res = await http.post(
        Uri.parse('$kBaseUrl/api/payments/create-order'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({'type': type, 'pack_id': packId}),
      );

      if (res.statusCode != 200) {
        onError?.call('Could not create order. Try again.');
        return;
      }

      final data = jsonDecode(res.body);

      // ── Step 2: Open Razorpay checkout ──────────────────────────────────────
      final options = {
        'key':         data['key_id'],
        'amount':      data['amount'],
        'currency':    'INR',
        'order_id':    data['order_id'],
        'name':        'KarmaCoins',
        'description': description,
        'prefill': {'email': email, 'name': name},
        'theme': {'color': '#6C5CE7'},
        'external': {'wallets': ['paytm', 'phonepe', 'googlepay']},
      };

      _razorpay!.open(options);
    } catch (e) {
      onError?.call('Network error. Check your connection.');
    }
  }

  // ── Step 3: Verify on backend after Razorpay callback ──────────────────────
  Future<void> _handleSuccess(PaymentSuccessResponse response) async {
    final token = await _getToken();
    if (token == null) return;

    try {
      final res = await http.post(
        Uri.parse('$kBaseUrl/api/payments/verify'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: jsonEncode({
          'razorpay_order_id':   response.orderId,
          'razorpay_payment_id': response.paymentId,
          'razorpay_signature':  response.signature,
        }),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        onSuccess?.call(
          data['coins_added'] as int,
          data['coins'] as int,
          data['is_pro'] as bool,
        );
      } else {
        onError?.call('Payment verification failed. Contact support.');
      }
    } catch (e) {
      onError?.call('Verification error. Contact support.');
    }
  }

  void _handleError(PaymentFailureResponse response) {
    onError?.call(response.message ?? 'Payment failed');
  }

  void _handleWallet(ExternalWalletResponse response) {
    // External wallet selected — Razorpay handles the rest
  }

  // ── Fetch packs from backend ────────────────────────────────────────────────
  Future<({List<CoinPack> packs, ProInfo pro})> fetchPacks() async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse('$kBaseUrl/api/payments/packs'),
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = jsonDecode(res.body);
    return (
      packs: (data['coin_packs'] as List).map((e) => CoinPack.fromJson(e)).toList(),
      pro:   ProInfo.fromJson(data['pro']),
    );
  }

  // ── Fetch payment history ───────────────────────────────────────────────────
  Future<List<Map<String, dynamic>>> fetchHistory() async {
    final token = await _getToken();
    final res = await http.get(
      Uri.parse('$kBaseUrl/api/payments/history'),
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = jsonDecode(res.body);
    return List<Map<String, dynamic>>.from(data['payments']);
  }
}
