import 'dart:io';

import 'package:dart_frog/dart_frog.dart';
import 'package:server/core/utils/refresh_token_body.dart';
import 'package:server/core/utils/request_body.dart';
import 'package:server/features/auth/domain/services/auth_service.dart';

/// `POST /api/v1/auth/logout` — thu hồi refresh token (204).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<Response> onRequest(RequestContext context) async {
  requireMethod(context, HttpMethod.post);
  await context.read<AuthService>().logout(await readRefreshToken(context));
  return Response(statusCode: HttpStatus.noContent);
}
