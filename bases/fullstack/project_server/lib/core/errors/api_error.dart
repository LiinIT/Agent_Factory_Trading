import 'dart:io';

import 'package:dart_frog/dart_frog.dart';

const _codes = {
  HttpStatus.badRequest: 'BAD_REQUEST',
  HttpStatus.unauthorized: 'UNAUTHORIZED',
  HttpStatus.forbidden: 'FORBIDDEN',
  HttpStatus.notFound: 'NOT_FOUND',
  HttpStatus.methodNotAllowed: 'METHOD_NOT_ALLOWED',
  HttpStatus.conflict: 'CONFLICT',
  HttpStatus.tooManyRequests: 'TOO_MANY_REQUESTS',
  HttpStatus.internalServerError: 'INTERNAL_ERROR',
  HttpStatus.serviceUnavailable: 'SERVICE_UNAVAILABLE',
};

/// Lỗi API theo định dạng chung (web và app đọc cùng một kiểu):
/// `{ "error": { "code", "message", "details" } }`. Route / service ném lỗi này, middleware gốc trả về.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
class ApiError implements Exception {
  /// Tạo lỗi với mã HTTP [status]; mã chữ suy từ [status] nếu không truyền [code].
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  ApiError(this.status, this.message, {String? code, this.details})
    : code = code ?? _codes[status] ?? 'HTTP_$status';

  /// 400 — dữ liệu gửi lên sai; [details] liệt kê từng lỗi.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  ApiError.badRequest(List<String> details)
    : this(HttpStatus.badRequest, 'Dữ liệu không hợp lệ', details: details);

  /// 401 — chưa đăng nhập / token sai.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  ApiError.unauthorized([
    String message = 'Chưa đăng nhập hoặc phiên đã hết hạn',
  ]) : this(HttpStatus.unauthorized, message);

  /// 403 — đã đăng nhập nhưng không đủ quyền.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  ApiError.forbidden() : this(HttpStatus.forbidden, 'Không đủ quyền');

  /// 404 — không có dữ liệu / đường dẫn.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  ApiError.notFound([String message = 'Không tìm thấy'])
    : this(HttpStatus.notFound, message);

  /// 405 — sai phương thức HTTP.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  ApiError.methodNotAllowed()
    : this(HttpStatus.methodNotAllowed, 'Phương thức không được hỗ trợ');

  /// 409 — trùng dữ liệu.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  ApiError.conflict(String message) : this(HttpStatus.conflict, message);

  final int status;
  final String code;
  final String message;
  final Object? details;

  /// Thân JSON của lỗi.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  Map<String, Object?> toJson() => {
    'error': {
      'code': code,
      'message': message,
      if (details != null) 'details': details,
    },
  };

  /// Response HTTP của lỗi.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  Response toResponse() => Response.json(statusCode: status, body: toJson());

  /// Chuỗi mô tả cho log.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  @override
  String toString() => 'ApiError($status $code: $message)';
}
