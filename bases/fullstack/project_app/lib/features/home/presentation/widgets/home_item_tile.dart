import 'package:flutter/material.dart';

import 'package:app/core/constants/app_sizes.dart';
import 'package:app/features/home/domain/entities/sample_item.dart';

/// Một ô mục trong danh sách.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
class HomeItemTile extends StatelessWidget {
  /// Nhận mục cần hiển thị.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  const HomeItemTile({required this.item, super.key});

  final SampleItem item;

  /// Dựng ô mục.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
      ),
      child: ListTile(
        title: Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis),
      ),
    );
  }
}
