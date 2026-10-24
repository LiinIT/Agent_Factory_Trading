import 'package:flutter/material.dart';

import 'package:app/core/constants/app_sizes.dart';
import 'package:app/features/home/domain/entities/sample_item.dart';
import 'home_item_tile.dart';

/// Danh sách mục, kéo để làm mới; bố cục rộng (≥ 720) chuyển sang lưới 2 cột.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
class HomeItemList extends StatelessWidget {
  /// Nhận danh sách và hàm làm mới.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  const HomeItemList({required this.items, required this.onRefresh, super.key});

  final List<SampleItem> items;
  final Future<void> Function() onRefresh;

  /// Dựng danh sách hoặc lưới theo chiều rộng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  @override
  Widget build(BuildContext context) {
    final isWide =
        MediaQuery.sizeOf(context).width >= AppSizes.wideLayoutBreakpoint;
    return RefreshIndicator.adaptive(
      onRefresh: onRefresh,
      child: GridView.builder(
        padding: const EdgeInsets.all(AppSizes.spaceMd),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: isWide ? 2 : 1,
          mainAxisExtent: AppSizes.listItemHeight,
          crossAxisSpacing: AppSizes.spaceSm,
          mainAxisSpacing: AppSizes.spaceSm,
        ),
        itemCount: items.length,
        itemBuilder: (_, index) => HomeItemTile(item: items[index]),
      ),
    );
  }
}
