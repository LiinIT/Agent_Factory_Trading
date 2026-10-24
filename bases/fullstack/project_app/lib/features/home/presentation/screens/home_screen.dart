import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:app/core/constants/app_sizes.dart';
import 'package:app/core/constants/app_strings.dart';
import 'package:app/features/auth/presentation/widgets/logout_button.dart';
import 'package:app/features/home/presentation/providers/sample_items_provider.dart';
import 'package:app/widgets/app_error_view.dart';
import 'package:app/widgets/app_loading_view.dart';
import 'package:app/features/home/presentation/widgets/home_empty_view.dart';
import 'package:app/features/home/presentation/widgets/home_item_list.dart';

/// Màn hình mẫu: chỉ layout + chọn view theo state (loading / error / empty /
/// success). Nội dung giới hạn chiều rộng để đẹp trên tablet/web.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
class HomeScreen extends ConsumerWidget {
  /// Khởi tạo màn hình mẫu.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  const HomeScreen({super.key});

  /// Dựng màn hình theo trạng thái của SampleItems.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(sampleItemsProvider);
    final retry = ref.read(sampleItemsProvider.notifier).refresh;
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.homeTitle),
        actions: const [LogoutButton()],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              maxWidth: AppSizes.maxContentWidth,
            ),
            child: items.when(
              loading: () => const AppLoadingView(),
              error: (_, _) => AppErrorView(
                message: AppStrings.errorMessage,
                onRetry: retry,
              ),
              data: (data) => data.isEmpty
                  ? const HomeEmptyView()
                  : HomeItemList(items: data, onRefresh: retry),
            ),
          ),
        ),
      ),
    );
  }
}
