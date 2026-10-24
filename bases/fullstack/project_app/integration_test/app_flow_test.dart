import 'package:app/app.dart';
import 'package:app/core/constants/app_strings.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import '../test/helpers/fakes.dart';
import '../test/helpers/ui_audit.dart';

/// Số lần vào/ra lặp lại để dò rò rỉ / suy giảm (checklist H1, T2 rút gọn).
const _repeatRounds = 20;

/// E2E trên máy ảo / máy thật (checklist L5, G6, C2): mở app, chạm hết mọi nút,
/// lặp dựng lại app nhiều lần không lỗi.
/// Chạy: `flutter test integration_test -d <id simulator>`.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('luồng chính: mở app, chạm hết, không lỗi', (tester) async {
    await tester.pumpWidget(
      ProviderScope(overrides: signedInOverrides, child: const App()),
    );
    await tester.pumpAndSettle();

    expect(find.text(AppStrings.homeTitle), findsOneWidget);
    expect((await auditTappables(tester)).problems, isEmpty);
  });

  testWidgets('dựng lại app $_repeatRounds lần không lỗi', (tester) async {
    for (var round = 0; round < _repeatRounds; round++) {
      await tester.pumpWidget(
        ProviderScope(
          key: ValueKey(round),
          overrides: signedInOverrides,
          child: const App(),
        ),
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    }
    expect(find.text(AppStrings.homeTitle), findsOneWidget);
  });
}
