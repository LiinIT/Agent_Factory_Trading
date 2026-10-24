# Pattern: Tìm kiếm có debounce

Chỉ gọi API khi người dùng ngừng gõ [kSearchDebounce]; truy vấn cũ bị huỷ để không ghi đè kết quả mới.

```dart
const kSearchDebounce = Duration(milliseconds: 350);
const kMinQueryLength = 2;

/// Kết quả tìm kiếm theo [query]: chờ debounce, huỷ nếu query đổi giữa chừng.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: <YYYY-MM-DD>
@riverpod
Future<List<Item>> searchResults(Ref ref, String query) async {
  final trimmed = query.trim();
  if (trimmed.length < kMinQueryLength) return const [];
  var cancelled = false;
  ref.onDispose(() => cancelled = true);
  await Future<void>.delayed(kSearchDebounce);
  if (cancelled) throw StateError('query cũ đã bị huỷ');
  appLogger.d('[searchResults] query=$trimmed');
  return ref.read(itemServiceProvider).search(trimmed);
}
```

View: giữ `query` trong state của màn hình (hoặc Notifier riêng), `ref.watch(searchResultsProvider(query))`; provider family tự dispose truy vấn cũ.
Test: dùng `fakeAsync` — gõ liên tiếp chỉ gọi service 1 lần; query < 2 ký tự → rỗng, không gọi.
