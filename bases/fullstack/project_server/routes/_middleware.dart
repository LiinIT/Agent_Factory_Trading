import 'dart:io';

import 'package:dart_frog/dart_frog.dart';
import 'package:postgres/postgres.dart';
import 'package:server/core/app_services.dart';
import 'package:server/core/config/app_config.dart';
import 'package:server/core/config/env.dart';
import 'package:server/core/errors/api_error.dart';
import 'package:server/core/middleware/cors_middleware.dart';
import 'package:server/core/middleware/error_middleware.dart';
import 'package:server/core/middleware/request_log_middleware.dart';
import 'package:server/core/utils/app_logger.dart';
import 'package:server/core/utils/jwt_utils.dart';
import 'package:server/features/auth/domain/services/auth_service.dart';
import 'package:server/features/users/data/datasources/users_datasource.dart';

Future<AppServices>? _services;
Set<String> _corsOrigins = const {};

/// Middleware gốc: log → CORS → lỗi chung → dựng dịch vụ (lần đầu) và cấp cho mọi route.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Handler middleware(Handler handler) {
  return handler
      .use(_provideServices)
      .use(errorMiddleware())
      .use(corsMiddleware(() => _corsOrigins))
      .use(requestLogMiddleware());
}

/// Dựng [AppServices] một lần; database chưa sẵn sàng thì 503 và thử lại ở request sau.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Handler _provideServices(Handler handler) {
  return (context) async {
    final AppServices services;
    try {
      services = await (_services ??= AppServices.start(
        AppConfig.fromEnvironment(loadEnvironment()),
      ));
    } catch (error, stackTrace) {
      _services = null;
      appLogger.e(
        '[Main] không khởi động được dịch vụ',
        error: error,
        stackTrace: stackTrace,
      );
      throw ApiError(
        HttpStatus.serviceUnavailable,
        'Máy chủ chưa sẵn sàng, thử lại sau',
      );
    }
    _corsOrigins = services.config.corsOrigins;
    return handler(
      context
          .provide<AppConfig>(() => services.config)
          .provide<Pool<void>>(() => services.pool)
          .provide<AccessTokenSigner>(() => services.signer)
          .provide<UsersDatasource>(() => services.users)
          .provide<AuthService>(() => services.auth),
    );
  };
}
