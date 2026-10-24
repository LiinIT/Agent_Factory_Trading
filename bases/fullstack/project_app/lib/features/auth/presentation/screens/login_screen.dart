import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:app/core/constants/app_strings.dart';
import 'package:app/core/constants/app_sizes.dart';
import 'package:app/features/auth/presentation/providers/auth_controller.dart';
import 'package:app/features/auth/presentation/widgets/login_form.dart';

/// Màn đăng nhập: chỉ layout, gửi form qua AuthController.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class LoginScreen extends ConsumerWidget {
  /// Khởi tạo màn đăng nhập.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  const LoginScreen({super.key});

  /// Dựng form đăng nhập ở giữa, cuộn được khi bàn phím mở.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text(AppStrings.loginTitle)),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(AppSizes.spaceLg),
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                maxWidth: AppSizes.maxFormWidth,
              ),
              child: LoginForm(
                onSubmit: ref.read(authControllerProvider.notifier).login,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
