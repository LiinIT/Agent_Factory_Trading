import 'package:flutter/material.dart';

import 'package:app/core/constants/app_strings.dart';
import 'package:app/core/theme/app_theme.dart';
import 'package:app/core/router/auth_gate.dart';

/// Gốc ứng dụng: theme sáng/tối thích ứng iOS/Android/Web, vào màn theo phiên đăng nhập.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
class App extends StatelessWidget {
  /// Khởi tạo gốc ứng dụng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  const App({super.key});

  /// Dựng MaterialApp với theme chung.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppStrings.appTitle,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      home: const AuthGate(),
    );
  }
}
