import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'package:app/core/utils/app_logger.dart';

/// Điểm khởi động: bắt mọi lỗi chưa xử lý (UI + bất đồng bộ) vào logger — chỗ nối
/// Crashlytics/Sentry khi phát hành (checklist C3), rồi chạy app trong ProviderScope.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  FlutterError.onError = (details) {
    appLogger.e(
      '[Main] lỗi Flutter',
      error: details.exception,
      stackTrace: details.stack,
    );
    FlutterError.presentError(details);
  };
  PlatformDispatcher.instance.onError = (error, stackTrace) {
    appLogger.e('[Main] lỗi chưa xử lý', error: error, stackTrace: stackTrace);
    return true;
  };
  appLogger.i('[Main] khởi động app');
  runApp(const ProviderScope(child: App()));
}
