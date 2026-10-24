import 'package:dart_jsonwebtoken/dart_jsonwebtoken.dart';

import 'package:server/core/errors/api_error.dart';
import 'package:server/models/auth_principal.dart';

/// Ký / kiểm access token JWT (HS256) chứa `sub` (userId) và `role`.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
class AccessTokenSigner {
  /// Tạo bộ ký với [secret] và thời hạn [ttl].
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  AccessTokenSigner({required String secret, required this.ttl})
    : _key = SecretKey(secret);

  final SecretKey _key;
  final Duration ttl;

  /// Ký access token cho người dùng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  String sign(AuthPrincipal principal) => JWT({
    'sub': principal.userId,
    'role': principal.role,
  }).sign(_key, algorithm: JWTAlgorithm.HS256, expiresIn: ttl);

  /// Kiểm token, trả người gọi; sai chữ ký / hết hạn / thiếu trường thì ném 401.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  AuthPrincipal verify(String token) {
    try {
      final payload = JWT.verify(token, _key).payload;
      if (payload is! Map ||
          payload['sub'] is! String ||
          payload['role'] is! String) {
        throw ApiError.unauthorized();
      }
      return AuthPrincipal(
        userId: payload['sub'] as String,
        role: payload['role'] as String,
      );
    } on JWTExpiredException {
      throw ApiError.unauthorized('Phiên đã hết hạn');
    } on JWTException {
      throw ApiError.unauthorized();
    }
  }
}
