import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:app/core/constants/app_strings.dart';
import 'package:app/features/auth/presentation/providers/auth_controller.dart';
import 'package:app/features/auth/presentation/screens/login_screen.dart';
import 'package:app/features/home/presentation/screens/home_screen.dart';
import 'package:app/widgets/app_error_view.dart';
import 'package:app/widgets/app_loading_view.dart';

/// Chọn màn theo phiên đăng nhập: đang kiểm tra / lỗi / chưa đăng nhập / đã đăng nhập.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class AuthGate extends ConsumerWidget {
  /// Khởi tạo cổng đăng nhập.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  const AuthGate({super.key});

  /// Dựng màn tương ứng trạng thái AuthController.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return switch (ref.watch(authControllerProvider)) {
      AsyncData(value: _?) => const HomeScreen(),
      AsyncData() => const LoginScreen(),
      AsyncError() => Scaffold(
        body: AppErrorView(
          message: AppStrings.sessionError,
          onRetry: () => ref.invalidate(authControllerProvider),
        ),
      ),
      _ => const Scaffold(body: AppLoadingView()),
    };
  }
}
