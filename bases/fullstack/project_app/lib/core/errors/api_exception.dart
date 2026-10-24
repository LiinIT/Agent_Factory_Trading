/// Lỗi gọi API theo định dạng chung của be/: `{ error: { code, message, details } }`.
/// Lỗi mạng dùng [ApiException.networkError] / [ApiException.timeout].
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class ApiException implements Exception {
  /// Tạo lỗi API.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  const ApiException({
    required this.code,
    required this.message,
    this.statusCode,
    this.details,
  });

  static const unauthorizedCode = 'UNAUTHORIZED';
  static const networkErrorCode = 'NETWORK_ERROR';
  static const timeoutCode = 'NETWORK_TIMEOUT';

  /// Không gửi được yêu cầu (mất mạng, máy chủ không chạy).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  const ApiException.networkError()
    : this(code: networkErrorCode, message: 'Không kết nối được máy chủ');

  /// Máy chủ không trả lời kịp.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  const ApiException.timeout()
    : this(code: timeoutCode, message: 'Máy chủ phản hồi quá lâu');

  final String code;
  final String message;
  final int? statusCode;
  final Object? details;

  bool get isNetworkIssue => code == networkErrorCode || code == timeoutCode;

  /// Chuỗi mô tả lỗi cho log.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  String toString() => 'ApiException($statusCode $code: $message)';
}
