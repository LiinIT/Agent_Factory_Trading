import 'package:dart_frog/dart_frog.dart';
import 'package:server/core/errors/api_error.dart';
import 'package:server/core/utils/request_body.dart';
import 'package:server/core/utils/validators.dart';
import 'package:server/features/auth/domain/services/auth_service.dart';

const _passwordMax = 72;

/// `POST /api/v1/auth/login` — đăng nhập, trả cặp token.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<Response> onRequest(RequestContext context) async {
  requireMethod(context, HttpMethod.post);
  final body = await readJsonObject(context);
  final errors = [
    if (!isEmail(body['email'])) 'email phải là email hợp lệ',
    if (!hasLength(body['password'], min: 1, max: _passwordMax))
      'password là bắt buộc',
  ];
  if (errors.isNotEmpty) throw ApiError.badRequest(errors);
  final tokens = await context.read<AuthService>().login(
    body['email'] as String,
    body['password'] as String,
  );
  return Response.json(body: tokens);
}
