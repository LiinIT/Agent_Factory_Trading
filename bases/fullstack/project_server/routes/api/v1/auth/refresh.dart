import 'package:dart_frog/dart_frog.dart';
import 'package:server/core/utils/refresh_token_body.dart';
import 'package:server/core/utils/request_body.dart';
import 'package:server/features/auth/domain/services/auth_service.dart';

/// `POST /api/v1/auth/refresh` — đổi refresh token lấy cặp mới (token cũ bị thu hồi).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<Response> onRequest(RequestContext context) async {
  requireMethod(context, HttpMethod.post);
  final tokens = await context.read<AuthService>().refresh(
    await readRefreshToken(context),
  );
  return Response.json(body: tokens);
}
