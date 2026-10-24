import 'dart:io';

import 'package:dart_frog/dart_frog.dart';

import 'package:server/core/errors/api_error.dart';
import 'package:server/core/utils/app_logger.dart';

/// Mọi lỗi ra ngoài đều đúng định dạng chung: [ApiError] → JSON của nó; lỗi không lường trước → 500
/// (không lộ chi tiết); 404 / 405 mặc định của Dart Frog (thân chữ thường) → JSON.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Middleware errorMiddleware() {
  return (handler) {
    return (context) async {
      try {
        final response = await handler(context);
        return _jsonForFrameworkErrors(response);
      } on ApiError catch (error) {
        return error.toResponse();
      } catch (error, stackTrace) {
        appLogger.e(
          '[Error] lỗi không lường trước ${context.request.uri.path}',
          error: error,
          stackTrace: stackTrace,
        );
        return ApiError(
          HttpStatus.internalServerError,
          'Lỗi hệ thống, thử lại sau',
        ).toResponse();
      }
    };
  };
}

/// Đổi response 404 / 405 không phải JSON thành định dạng lỗi chung.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Response _jsonForFrameworkErrors(Response response) {
  final isJson =
      response.headers[HttpHeaders.contentTypeHeader]?.contains('json') ??
      false;
  if (isJson) return response;
  if (response.statusCode == HttpStatus.notFound) {
    return ApiError.notFound('Không có đường dẫn này').toResponse();
  }
  if (response.statusCode == HttpStatus.methodNotAllowed) {
    return ApiError.methodNotAllowed().toResponse();
  }
  return response;
}
