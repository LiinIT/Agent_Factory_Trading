import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:app/features/home/domain/entities/sample_item.dart';
import 'package:app/features/home/data/datasources/sample_datasource.dart';
import 'package:app/core/utils/app_logger.dart';

part 'sample_items_provider.g.dart';

/// Cung cấp SampleDatasource (thay bằng bản giả trong test qua override).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
@riverpod
SampleDatasource sampleDatasource(Ref ref) => const SampleDatasource();

/// Controller danh sách mẫu: tải qua datasource, đổi model → entity, có thể làm mới.
/// View chỉ watch provider này, không gọi datasource trực tiếp.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
@riverpod
class SampleItems extends _$SampleItems {
  /// Tải danh sách lần đầu.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  @override
  Future<List<SampleItem>> build() =>
      _fetch(ref.watch(sampleDatasourceProvider));

  /// Tải lại danh sách (nút thử lại / kéo để làm mới).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  Future<void> refresh() async {
    appLogger.i('[SampleItems] refresh');
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => _fetch(ref.read(sampleDatasourceProvider)),
    );
    if (state.hasError) {
      appLogger.e(
        '[SampleItems] refresh lỗi',
        error: state.error,
        stackTrace: state.stackTrace,
      );
    }
  }

  /// Tải model qua [datasource] rồi đổi sang entity.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  Future<List<SampleItem>> _fetch(SampleDatasource datasource) async {
    final models = await datasource.fetchItems();
    return models.map((model) => model.toEntity()).toList();
  }
}
