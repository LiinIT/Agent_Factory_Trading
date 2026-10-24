import 'package:app/app.dart';
import 'package:app/core/constants/app_strings.dart';
import 'package:app/features/home/data/models/sample_item_model.dart';
import 'package:app/features/home/presentation/providers/sample_items_provider.dart';
import 'package:app/features/home/data/datasources/sample_datasource.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../helpers/devices.dart';
import '../../helpers/fakes.dart';
import '../../helpers/ui_audit.dart';

const _longTitle =
    'Nguyễn Văn Á 😀 tiêu đề rất dài để kiểm tra cắt chữ và xuống dòng trên màn hình nhỏ '
    'Nguyễn Văn Á 😀 tiêu đề rất dài để kiểm tra cắt chữ và xuống dòng trên màn hình nhỏ';

/// Service giả trả dữ liệu cố định / rỗng / lỗi cho test giao diện.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
class _FakeService extends SampleDatasource {
  /// Tạo service giả với [items] trả về, hoặc ném [error] nếu có.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-17
  _FakeService(this.items, {this.error});

  final List<SampleItemModel> items;
  final Object? error;

  /// Trả dữ liệu giả hoặc ném lỗi.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-17
  @override
  Future<List<SampleItemModel>> fetchItems() async {
    if (error != null) throw error!;
    return items;
  }
}

/// Dựng app với service giả.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
Widget _appWith(SampleDatasource service) => ProviderScope(
  overrides: [
    ...signedInOverrides,
    sampleDatasourceProvider.overrideWithValue(service),
  ],
  child: const App(),
);

/// Checklist G2/G3/G4/G6/G7 + L10/L11 cho màn hình chính trên mọi thiết bị.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
void main() {
  testWidgetsOnDevices('Màn chính hiển thị đúng (G2, G3)', (
    tester,
    device,
  ) async {
    await tester.pumpWidget(
      ProviderScope(overrides: signedInOverrides, child: const App()),
    );
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text(AppStrings.homeTitle), findsOneWidget);
    expect(find.text('Mục thứ nhất'), findsOneWidget);
  });

  testWidgetsOnDevices('Chạm hết mọi phần tử bấm được (G6)', (
    tester,
    device,
  ) async {
    await tester.pumpWidget(
      ProviderScope(overrides: signedInOverrides, child: const App()),
    );
    await tester.pumpAndSettle();

    expect((await auditTappables(tester)).problems, isEmpty);
    expect(find.text(AppStrings.homeTitle), findsOneWidget);
  });

  testWidgetsOnDevices('Dữ liệu quá dài không tràn khung (G4)', (
    tester,
    device,
  ) async {
    await tester.pumpWidget(
      _appWith(
        _FakeService(const [SampleItemModel(id: '1', title: _longTitle)]),
      ),
    );
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
  });

  testWidgetsOnDevices('Trạng thái rỗng có hướng dẫn (G7)', (
    tester,
    device,
  ) async {
    await tester.pumpWidget(_appWith(_FakeService(const [])));
    await tester.pumpAndSettle();

    expect(find.text(AppStrings.emptyMessage), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgetsOnDevices('Mất mạng báo lỗi thân thiện, có Thử lại (L10, L11)', (
    tester,
    device,
  ) async {
    await tester.pumpWidget(
      _appWith(_FakeService(const [], error: StateError('mất mạng'))),
    );
    await tester.pumpAndSettle();

    expect(find.text(AppStrings.errorMessage), findsOneWidget);
    expect(find.text(AppStrings.retry), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
