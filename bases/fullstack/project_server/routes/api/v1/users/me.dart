import 'package:dart_frog/dart_frog.dart';
import 'package:server/core/errors/api_error.dart';
import 'package:server/core/utils/request_body.dart';
import 'package:server/features/users/data/datasources/users_datasource.dart';
import 'package:server/models/auth_principal.dart';

/// `GET /api/v1/users/me` — người dùng đang đăng nhập.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<Response> onRequest(RequestContext context) async {
  requireMethod(context, HttpMethod.get);
  final user = await context.read<UsersDatasource>().findById(
    context.read<AuthPrincipal>().userId,
  );
  if (user == null) throw ApiError.notFound('Không tìm thấy người dùng');
  return Response.json(body: user.toPublicJson());
}
