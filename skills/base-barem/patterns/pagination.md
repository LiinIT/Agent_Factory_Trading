# Pattern: Phân trang (tải thêm khi cuộn)

State giữ danh sách đã tải + cờ còn trang; View gọi `loadMore()` khi gần cuối.

```dart
const kPageSize = 20;

/// Trạng thái danh sách phân trang.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: <YYYY-MM-DD>
class PagedItems {
  /// Tạo trạng thái.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: <YYYY-MM-DD>
  const PagedItems({required this.items, required this.hasMore, this.isLoadingMore = false});
  final List<Item> items;
  final bool hasMore;
  final bool isLoadingMore;
}

/// Controller phân trang: trang đầu ở build(), trang sau qua loadMore().
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: <YYYY-MM-DD>
@riverpod
class ItemsPaged extends _$ItemsPaged {
  /// Tải trang đầu.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: <YYYY-MM-DD>
  @override
  Future<PagedItems> build() async {
    final first = await ref.read(itemServiceProvider).fetchPage(offset: 0, limit: kPageSize);
    return PagedItems(items: first, hasMore: first.length == kPageSize);
  }

  /// Tải trang kế; bỏ qua nếu đang tải hoặc hết trang.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: <YYYY-MM-DD>
  Future<void> loadMore() async {
    final current = state.value;
    if (current == null || !current.hasMore || current.isLoadingMore) return;
    state = AsyncData(PagedItems(items: current.items, hasMore: true, isLoadingMore: true));
    try {
      final next = await ref.read(itemServiceProvider).fetchPage(offset: current.items.length, limit: kPageSize);
      state = AsyncData(PagedItems(items: [...current.items, ...next], hasMore: next.length == kPageSize));
    } catch (error, stackTrace) {
      appLogger.e('[ItemsPaged] loadMore lỗi', error: error, stackTrace: stackTrace);
      state = AsyncData(PagedItems(items: current.items, hasMore: current.hasMore));
    }
  }
}
```

View: `NotificationListener<ScrollEndNotification>` hoặc `itemBuilder` gọi `loadMore()` khi `index >= items.length - 5`; hiện vòng xoay cuối danh sách khi `isLoadingMore`.
Test: trang đầu đủ 20 → `hasMore`; trang cuối < 20 → hết; lỗi tải thêm giữ nguyên danh sách.
