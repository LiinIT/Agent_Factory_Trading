import 'package:dart_frog/dart_frog.dart';
import 'package:server/core/middleware/auth_middleware.dart';

/// Mọi route `/users/*` cần đăng nhập.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Handler middleware(Handler handler) => handler.use(requireAuth());
