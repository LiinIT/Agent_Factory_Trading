import 'dart:io';

import 'package:dart_frog/dart_frog.dart';
import 'package:server/core/errors/api_error.dart';
import 'package:server/core/utils/request_body.dart';
import 'package:server/core/utils/validators.dart';
import 'package:server/features/auth/domain/services/auth_service.dart';

const passwordMin = 8;
const passwordMax = 72;
const _nameMax = 100;

/// `POST /api/v1/auth/register` — đăng ký, trả cặp token (201).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<Response> onRequest(RequestContext context) async {
  requireMethod(context, HttpMethod.post);
  final body = await readJsonObject(context);
  final errors = [
    if (!isEmail(body['email'])) 'email phải là email hợp lệ',
    if (!hasLength(body['password'], min: passwordMin, max: passwordMax))
      'password dài từ $passwordMin đến $passwordMax ký tự',
    if (body['name'] != null && !hasLength(body['name'], max: _nameMax))
      'name tối đa $_nameMax ký tự',
  ];
  if (errors.isNotEmpty) throw ApiError.badRequest(errors);
  final tokens = await context.read<AuthService>().register((
    email: body['email'] as String,
    password: body['password'] as String,
    name: body['name'] as String?,
  ));
  return Response.json(statusCode: HttpStatus.created, body: tokens);
}
