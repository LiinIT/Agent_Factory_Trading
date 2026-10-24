import 'package:dart_frog/dart_frog.dart';

import 'package:server/core/errors/api_error.dart';
import 'package:server/core/utils/request_body.dart';

const _tokenMin = 20;

/// Đọc `{ "refreshToken": "..." }` của request làm mới / đăng xuất; sai thì 400.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<String> readRefreshToken(RequestContext context) async {
  final token = (await readJsonObject(context))['refreshToken'];
  if (token is! String || token.length < _tokenMin) {
    throw ApiError.badRequest(['refreshToken là bắt buộc']);
  }
  return token;
}
