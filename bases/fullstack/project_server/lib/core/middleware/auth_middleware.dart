import 'package:dart_frog/dart_frog.dart';

import 'package:server/core/errors/api_error.dart';
import 'package:server/core/utils/jwt_utils.dart';
import 'package:server/models/auth_principal.dart';

const _bearerPrefix = 'Bearer ';

/// Bắt buộc đăng nhập: đọc `Authorization: Bearer <access token>`, cấp [AuthPrincipal] cho route; thiếu / sai ⇒ 401.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Middleware requireAuth() {
  return (handler) {
    return (context) {
      final header = context.request.headers['Authorization'] ?? '';
      if (!header.startsWith(_bearerPrefix)) throw ApiError.unauthorized();
      final principal = context.read<AccessTokenSigner>().verify(
        header.substring(_bearerPrefix.length),
      );
      return handler(context.provide<AuthPrincipal>(() => principal));
    };
  };
}

/// Bắt buộc vai trò [role] (đặt sau [requireAuth]); không đủ quyền ⇒ 403.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Middleware requireRole(String role) {
  return (handler) {
    return (context) {
      if (context.read<AuthPrincipal>().role != role) {
        throw ApiError.forbidden();
      }
      return handler(context);
    };
  };
}
