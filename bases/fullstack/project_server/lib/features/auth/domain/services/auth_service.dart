import 'package:server/core/errors/api_error.dart';
import 'package:server/core/utils/app_logger.dart';
import 'package:server/core/utils/jwt_utils.dart';
import 'package:server/core/utils/password_hasher.dart';
import 'package:server/core/utils/token_hash.dart';
import 'package:server/features/auth/data/datasources/refresh_token_datasource.dart';
import 'package:server/features/users/data/datasources/users_datasource.dart';
import 'package:server/models/auth_principal.dart';
import 'package:server/models/user.dart';

const _invalidLogin = 'Email hoặc mật khẩu không đúng';

/// Thông tin đăng ký đã kiểm ở route.
typedef RegisterInput = ({String email, String password, String? name});

/// Nghiệp vụ đăng nhập: đăng ký, đăng nhập, làm mới (refresh token dùng một lần, xoay vòng;
/// dùng lại token cũ ⇒ thu hồi mọi phiên), đăng xuất.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
class AuthService {
  /// Tạo service từ datasource và bộ ký token.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  AuthService({
    required UsersDatasource users,
    required RefreshTokenDatasource refreshTokens,
    required AccessTokenSigner signer,
    required Duration refreshTokenTtl,
    PasswordHasher passwordHasher = const PasswordHasher(),
  }) : _users = users,
       _refreshTokens = refreshTokens,
       _signer = signer,
       _refreshTokenTtl = refreshTokenTtl,
       _passwordHasher = passwordHasher;

  final UsersDatasource _users;
  final RefreshTokenDatasource _refreshTokens;
  final AccessTokenSigner _signer;
  final Duration _refreshTokenTtl;
  final PasswordHasher _passwordHasher;

  /// Đăng ký tài khoản USER mới; email đã có thì 409.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  Future<Map<String, Object?>> register(RegisterInput input) async {
    final email = input.email.trim().toLowerCase();
    if (await _users.findByEmail(email) != null) {
      throw ApiError.conflict('Email đã được dùng');
    }
    final name = input.name?.trim();
    final user = await _users.create(
      email: email,
      passwordHash: _passwordHasher.hash(input.password),
      name: name == null || name.isEmpty ? null : name,
    );
    appLogger.i('[AuthService] đăng ký userId=${user.id}');
    return _issue(user);
  }

  /// Đăng nhập bằng email + mật khẩu; sai thì 401 (không nói rõ sai phần nào).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  Future<Map<String, Object?>> login(String email, String password) async {
    final user = await _users.findByEmail(email.trim().toLowerCase());
    if (user == null || !_passwordHasher.verify(password, user.passwordHash)) {
      throw ApiError.unauthorized(_invalidLogin);
    }
    appLogger.i('[AuthService] đăng nhập userId=${user.id}');
    return _issue(user);
  }

  /// Đổi refresh token lấy cặp mới; token cũ bị thu hồi ngay.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  Future<Map<String, Object?>> refresh(String refreshToken) async {
    final stored = await _refreshTokens.findByHash(hashToken(refreshToken));
    if (stored == null) {
      throw ApiError.unauthorized('Refresh token không hợp lệ');
    }
    if (stored.revokedAt != null) {
      appLogger.w(
        '[AuthService] refresh token bị dùng lại — thu hồi mọi phiên userId=${stored.userId}',
      );
      await _refreshTokens.revokeAll(stored.userId);
      throw ApiError.unauthorized('Refresh token đã bị thu hồi');
    }
    if (!stored.expiresAt.isAfter(DateTime.now())) {
      throw ApiError.unauthorized('Refresh token đã hết hạn');
    }
    final user = await _users.findById(stored.userId);
    if (user == null) throw ApiError.unauthorized('Refresh token không hợp lệ');
    await _refreshTokens.revoke(stored.id);
    return _issue(user);
  }

  /// Thu hồi refresh token (không có thì bỏ qua — đăng xuất luôn thành công).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  Future<void> logout(String refreshToken) async {
    final stored = await _refreshTokens.findByHash(hashToken(refreshToken));
    if (stored != null) await _refreshTokens.revoke(stored.id);
  }

  /// Cấp cặp token mới cho [user] (schema `AuthTokens`).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  Future<Map<String, Object?>> _issue(User user) async {
    final refreshToken = newRefreshToken();
    await _refreshTokens.save(
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: DateTime.now().add(_refreshTokenTtl),
    );
    return {
      'accessToken': _signer.sign(
        AuthPrincipal(userId: user.id, role: user.role),
      ),
      'refreshToken': refreshToken,
      'expiresIn': _signer.ttl.inSeconds,
      'user': user.toPublicJson(),
    };
  }
}
