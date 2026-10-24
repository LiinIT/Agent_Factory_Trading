import 'package:flutter/material.dart';

import 'package:app/core/constants/app_sizes.dart';
import 'package:app/core/constants/app_strings.dart';

/// Trạng thái trống của màn hình mẫu.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
class HomeEmptyView extends StatelessWidget {
  /// Khởi tạo view trống.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  const HomeEmptyView({super.key});

  /// Dựng icon + thông báo trống.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.inbox_outlined, size: AppSizes.iconLg),
          SizedBox(height: AppSizes.spaceSm),
          Text(AppStrings.emptyMessage),
        ],
      ),
    );
  }
}
