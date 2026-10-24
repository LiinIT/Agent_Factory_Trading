import 'package:dart_frog/dart_frog.dart';

import 'package:server/core/errors/api_error.dart';

/// Đọc thân JSON dạng object của request; thân rỗng / sai JSON thì ném 400.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<Map<String, dynamic>> readJsonObject(RequestContext context) async {
  try {
    final body = await context.request.json();
    if (body is Map<String, dynamic>) return body;
  } on FormatException {
    throw ApiError.badRequest(['Thân request phải là JSON']);
  }
  throw ApiError.badRequest(['Thân request phải là một object JSON']);
}

/// Bắt phương thức HTTP đúng [method], sai thì ném 405.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
void requireMethod(RequestContext context, HttpMethod method) {
  if (context.request.method != method) throw ApiError.methodNotAllowed();
}
