import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:app/core/constants/app_strings.dart';
import 'package:app/features/auth/presentation/providers/auth_controller.dart';

/// Nút đăng xuất đặt trên AppBar.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class LogoutButton extends ConsumerWidget {
  /// Khởi tạo nút đăng xuất.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  const LogoutButton({super.key});

  /// Dựng IconButton gọi AuthController.logout.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      tooltip: AppStrings.logout,
      icon: const Icon(Icons.logout),
      onPressed: ref.read(authControllerProvider.notifier).logout,
    );
  }
}
