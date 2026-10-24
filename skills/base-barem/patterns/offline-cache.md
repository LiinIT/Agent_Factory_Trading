# Pattern: Cache offline (hiện dữ liệu cũ, làm mới nền)

Stale-while-revalidate: đọc cache ngay → hiện → gọi mạng → ghi cache → cập nhật. Mất mạng thì giữ dữ liệu cũ và báo nhẹ.

```dart
/// Repository có cache: service mạng + kho cục bộ (shared_preferences / sqlite / isar).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: <YYYY-MM-DD>
class CachedItemRepository {
  /// Nhận service mạng và kho cục bộ.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: <YYYY-MM-DD>
  const CachedItemRepository(this._remote, this._local);
  final ItemService _remote;
  final ItemLocalStore _local;

  /// Phát dữ liệu cache (nếu có) rồi dữ liệu mới từ mạng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: <YYYY-MM-DD>
  Stream<List<Item>> watchItems() async* {
    final cached = await _local.readItems();
    if (cached != null) yield cached;
    try {
      final fresh = await _remote.fetchItems();
      await _local.writeItems(fresh);
      yield fresh;
    } catch (error, stackTrace) {
      appLogger.w('[CachedItemRepository] mạng lỗi, dùng cache', error: error, stackTrace: stackTrace);
      if (cached == null) rethrow;
    }
  }
}
```

Provider: `@riverpod Stream<List<Item>> items(Ref ref) => ref.watch(repoProvider).watchItems();`
Test: có cache + mạng lỗi → vẫn ra dữ liệu cache; không cache + mạng lỗi → AsyncError; mạng tốt → ghi cache.
