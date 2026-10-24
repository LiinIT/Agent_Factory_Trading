// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'sample_items_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Cung cấp SampleDatasource (thay bằng bản giả trong test qua override).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16

@ProviderFor(sampleDatasource)
final sampleDatasourceProvider = SampleDatasourceProvider._();

/// Cung cấp SampleDatasource (thay bằng bản giả trong test qua override).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16

final class SampleDatasourceProvider
    extends
        $FunctionalProvider<
          SampleDatasource,
          SampleDatasource,
          SampleDatasource
        >
    with $Provider<SampleDatasource> {
  /// Cung cấp SampleDatasource (thay bằng bản giả trong test qua override).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  SampleDatasourceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'sampleDatasourceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$sampleDatasourceHash();

  @$internal
  @override
  $ProviderElement<SampleDatasource> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  SampleDatasource create(Ref ref) {
    return sampleDatasource(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(SampleDatasource value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<SampleDatasource>(value),
    );
  }
}

String _$sampleDatasourceHash() => r'9a1eefd79d90878e990b7f1dbfad166b26d9186b';

/// Controller danh sách mẫu: tải qua datasource, đổi model → entity, có thể làm mới.
/// View chỉ watch provider này, không gọi datasource trực tiếp.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16

@ProviderFor(SampleItems)
final sampleItemsProvider = SampleItemsProvider._();

/// Controller danh sách mẫu: tải qua datasource, đổi model → entity, có thể làm mới.
/// View chỉ watch provider này, không gọi datasource trực tiếp.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
final class SampleItemsProvider
    extends $AsyncNotifierProvider<SampleItems, List<SampleItem>> {
  /// Controller danh sách mẫu: tải qua datasource, đổi model → entity, có thể làm mới.
  /// View chỉ watch provider này, không gọi datasource trực tiếp.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  SampleItemsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'sampleItemsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$sampleItemsHash();

  @$internal
  @override
  SampleItems create() => SampleItems();
}

String _$sampleItemsHash() => r'5ef1d2b9b99c57a813faa021b8323cf13d416848';

/// Controller danh sách mẫu: tải qua datasource, đổi model → entity, có thể làm mới.
/// View chỉ watch provider này, không gọi datasource trực tiếp.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16

abstract class _$SampleItems extends $AsyncNotifier<List<SampleItem>> {
  FutureOr<List<SampleItem>> build();
  @$mustCallSuper
  @override
  void runBuild() {
    final ref =
        this.ref as $Ref<AsyncValue<List<SampleItem>>, List<SampleItem>>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<AsyncValue<List<SampleItem>>, List<SampleItem>>,
              AsyncValue<List<SampleItem>>,
              Object?,
              Object?
            >;
    element.handleCreate(ref, build);
  }
}
