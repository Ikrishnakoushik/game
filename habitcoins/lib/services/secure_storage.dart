import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

/// Wraps flutter_secure_storage with token-aware helpers.
/// Tokens are stored in the OS keychain (Android Keystore / iOS Keychain)
/// instead of plain SharedPreferences.
class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _tokenKey = 'auth_token';
  static const _userKey  = 'auth_user';

  // ── Token ──────────────────────────────────────────────────────────────────

  static Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  static Future<String?> getToken() =>
      _storage.read(key: _tokenKey);

  static Future<void> deleteToken() =>
      _storage.delete(key: _tokenKey);

  /// Returns the token only if it is present and not expired.
  static Future<String?> getValidToken() async {
    final token = await _storage.read(key: _tokenKey);
    if (token == null) return null;
    try {
      if (JwtDecoder.isExpired(token)) {
        await deleteToken(); // clean up expired token
        return null;
      }
      return token;
    } catch (_) {
      return null;
    }
  }

  // ── User data ──────────────────────────────────────────────────────────────

  static Future<void> saveUser(String userJson) =>
      _storage.write(key: _userKey, value: userJson);

  static Future<String?> getUser() =>
      _storage.read(key: _userKey);

  // ── Clear all on logout ────────────────────────────────────────────────────

  static Future<void> clearAll() => _storage.deleteAll();
}
