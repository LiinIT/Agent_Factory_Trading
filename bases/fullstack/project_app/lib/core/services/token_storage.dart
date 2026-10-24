import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:app/core/entities/auth_tokens.dart';

const _accessKey = 'auth.accessToken';
const _refreshKey = 'auth.refreshToken';

/// Lưu cặp token trong kho bảo mật của máy (Keychain iOS / Keystore Android),
/// không bao giờ lưu token vào SharedPreferences hay log.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class TokenStorage {
  /// Tạo kho token; truyền [storage] khác khi cần.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  TokenStorage([FlutterSecureStorage? storage])
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  /// Đọc cặp token đã lưu, null nếu chưa đăng nhập.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Future<AuthTokens?> read() async {
    final accessToken = await _storage.read(key: _accessKey);
    final refreshToken = await _storage.read(key: _refreshKey);
    if (accessToken == null || refreshToken == null) return null;
    return AuthTokens(accessToken: accessToken, refreshToken: refreshToken);
  }

  /// Ghi đè cặp token mới.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Future<void> save(AuthTokens tokens) async {
    await _storage.write(key: _accessKey, value: tokens.accessToken);
    await _storage.write(key: _refreshKey, value: tokens.refreshToken);
  }

  /// Xoá phiên đăng nhập khỏi máy.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Future<void> clear() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }
}
