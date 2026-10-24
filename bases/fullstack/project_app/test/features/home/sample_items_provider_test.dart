import 'package:app/features/home/data/models/sample_item_model.dart';
import 'package:app/features/home/presentation/providers/sample_items_provider.dart';
import 'package:app/features/home/data/datasources/sample_datasource.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// Service giả: lần gọi đầu lỗi, các lần sau trả dữ liệu.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
class _FlakyService extends SampleDatasource {
  /// Tạo service giả.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  _FlakyService();

  int calls = 0;

  /// Lần đầu ném lỗi, lần sau trả 1 mục.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  @override
  Future<List<SampleItemModel>> fetchItems() async {
    calls++;
    if (calls == 1) throw StateError('mất mạng');
    return const [SampleItemModel(id: 'x', title: 'Đã tải')];
  }
}

/// Controller mẫu: lỗi được giữ trong state, refresh tải lại thành công.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
void main() {
  test('lỗi lần đầu → AsyncError, refresh → có dữ liệu', () async {
    final service = _FlakyService();
    final container = ProviderContainer(
      overrides: [sampleDatasourceProvider.overrideWithValue(service)],
    );
    addTearDown(container.dispose);

    await expectLater(
      container.read(sampleItemsProvider.future),
      throwsStateError,
    );
    expect(container.read(sampleItemsProvider).hasError, isTrue);

    await container.read(sampleItemsProvider.notifier).refresh();
    expect(container.read(sampleItemsProvider).value?.single.title, 'Đã tải');
  });
}
