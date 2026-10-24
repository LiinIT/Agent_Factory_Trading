import 'package:logger/logger.dart';

/// Logger dùng chung toàn server. Format: `appLogger.d('[Tên] hành động id=$id')`.
/// Lỗi: `appLogger.e('[Tên] mô tả', error: e, stackTrace: st)`. Không dùng print.
final appLogger = Logger(printer: PrettyPrinter(methodCount: 0));
