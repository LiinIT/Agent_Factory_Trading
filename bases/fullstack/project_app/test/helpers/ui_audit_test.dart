import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'ui_audit.dart';

/// Màn thử: một nút mở màn khác, một nút mở popup, thêm nút tuỳ biến [extra].
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
Widget _screen(Widget extra) => MaterialApp(
  home: Builder(
    builder: (context) => Scaffold(
      body: Column(
        children: [
          FilledButton(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const Scaffold(body: Text('Chi tiết')),
              ),
            ),
            child: const Text('Mở chi tiết'),
          ),
          IconButton(
            icon: const Icon(Icons.info),
            onPressed: () => showDialog<void>(
              context: context,
              builder: (_) => const AlertDialog(content: Text('Thông tin')),
            ),
          ),
          extra,
        ],
      ),
    ),
  ),
);

/// Bộ kiểm "chạm hết" phải bắt được nút chết và nút gây lỗi, và tự quay lại màn gốc.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
void main() {
  testWidgets('chạm hết các nút hợp lệ, tự đóng màn/popup đã mở', (
    tester,
  ) async {
    await tester.pumpWidget(_screen(const SizedBox.shrink()));

    final report = await auditTappables(tester);

    expect(report.problems, isEmpty);
    expect(report.tapped, 2);
    expect(find.text('Mở chi tiết'), findsOneWidget);
    expect(find.text('Chi tiết'), findsNothing);
  });

  testWidgets('bắt được nút chết (onPressed: null)', (tester) async {
    await tester.pumpWidget(
      _screen(const TextButton(onPressed: null, child: Text('Chết'))),
    );

    final report = await auditTappables(tester);

    expect(report.problems.single, contains('Nút chết'));
  });

  testWidgets('cho phép nút cố ý khoá nếu khai key', (tester) async {
    const lockedKey = Key('locked');
    await tester.pumpWidget(
      _screen(
        const TextButton(key: lockedKey, onPressed: null, child: Text('Khoá')),
      ),
    );

    final report = await auditTappables(tester, allowDisabled: {lockedKey});

    expect(report.problems, isEmpty);
    expect(report.tapped, 2);
  });

  testWidgets('bắt được nút gây exception khi chạm', (tester) async {
    await tester.pumpWidget(
      _screen(
        ElevatedButton(
          onPressed: () => throw StateError('hỏng'),
          child: const Text('Hỏng'),
        ),
      ),
    );

    final report = await auditTappables(tester);

    expect(report.problems.single, contains('Lỗi khi chạm'));
  });
}
