import 'package:dart_frog/dart_frog.dart';

import 'package:server/core/utils/app_logger.dart';

const _serverErrorStatus = 500;
const _clientErrorStatus = 400;

/// Log mỗi request: phương thức, đường dẫn, mã trả về, thời gian (không log thân, không log token).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Middleware requestLogMiddleware() {
  return (handler) {
    return (context) async {
      final stopwatch = Stopwatch()..start();
      final response = await handler(context);
      final line =
          '[HTTP] ${context.request.method.value} ${context.request.uri.path} → '
          '${response.statusCode} (${stopwatch.elapsedMilliseconds}ms)';
      if (response.statusCode >= _serverErrorStatus) {
        appLogger.e(line);
      } else if (response.statusCode >= _clientErrorStatus) {
        appLogger.w(line);
      } else {
        appLogger.d(line);
      }
      return response;
    };
  };
}
