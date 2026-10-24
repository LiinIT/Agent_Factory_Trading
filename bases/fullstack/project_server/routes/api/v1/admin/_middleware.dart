import 'package:dart_frog/dart_frog.dart';
import 'package:server/core/middleware/auth_middleware.dart';
import 'package:server/models/auth_principal.dart';

/// Mọi route `/admin/*` cần đăng nhập và vai trò ADMIN (kiểm ở server, không tin giao diện).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Handler middleware(Handler handler) =>
    handler.use(requireRole(UserRole.admin)).use(requireAuth());
