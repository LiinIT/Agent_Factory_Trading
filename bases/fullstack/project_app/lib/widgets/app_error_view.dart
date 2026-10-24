import 'package:flutter/material.dart';

import 'package:app/core/constants/app_sizes.dart';
import 'package:app/core/constants/app_strings.dart';

/// Trạng thái lỗi dùng chung: thông báo + nút thử lại.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
class AppErrorView extends StatelessWidget {
  /// Nhận thông báo lỗi và hàm thử lại.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  const AppErrorView({required this.message, required this.onRetry, super.key});

  final String message;
  final VoidCallback onRetry;

  /// Dựng icon lỗi, thông báo, nút thử lại.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSizes.spaceLg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: AppSizes.iconLg,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: AppSizes.spaceSm),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: AppSizes.spaceMd),
            FilledButton(
              onPressed: onRetry,
              child: const Text(AppStrings.retry),
            ),
          ],
        ),
      ),
    );
  }
}
