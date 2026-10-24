import 'package:app/app.dart';
import 'package:app/core/constants/app_strings.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import '../../helpers/devices.dart';
import '../../helpers/fakes.dart';
import '../../helpers/ui_audit.dart';

/// iOS đọc lỗi form cho trình đọc màn hình sau 1 giây — chờ qua mốc này để không còn hẹn giờ treo.
const _semanticsAnnounceDelay = Duration(seconds: 1);

const _loginResponse = {
  'accessToken': 'at',
  'refreshToken': 'rt',
  'expiresIn': 900,
  'user': testUserJson,
};

/// Dựng App chưa đăng nhập, be/ giả trả lời bằng [handler].
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
Widget _signedOutApp(Future<http.Response> Function(http.Request) handler) =>
    ProviderScope(
      overrides: fakeBackendOverrides(
        MockClient(handler),
        InMemoryTokenStorage(),
      ),
      child: const App(),
    );

/// Nhập email + mật khẩu rồi bấm Đăng nhập.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
Future<void> _submitLogin(WidgetTester tester) async {
  await tester.enterText(find.byType(TextFormField).first, 'a@example.com');
  await tester.enterText(find.byType(TextFormField).last, 'mat-khau');
  await tester.tap(find.widgetWithText(FilledButton, AppStrings.loginSubmit));
  await tester.pumpAndSettle();
}

/// Màn đăng nhập trên mọi thiết bị + luồng đăng nhập đúng / sai / bỏ trống.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
void main() {
  testWidgetsOnDevices(
    'Màn đăng nhập hiển thị đủ, chạm hết không lỗi (G2, G6)',
    (tester, device) async {
      await tester.pumpWidget(
        _signedOutApp((_) async => jsonResponse(null, 500)),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(
        find.widgetWithText(AppBar, AppStrings.loginTitle),
        findsOneWidget,
      );
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect((await auditTappables(tester)).problems, isEmpty);
      await tester.pump(_semanticsAnnounceDelay);
    },
  );

  testWidgets('bỏ trống → báo lỗi ô nhập, không gọi be/', (tester) async {
    var calls = 0;
    await tester.pumpWidget(
      _signedOutApp((_) async {
        calls++;
        return jsonResponse(null, 500);
      }),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.widgetWithText(FilledButton, AppStrings.loginSubmit));
    await tester.pumpAndSettle();

    expect(find.text(AppStrings.emailInvalid), findsOneWidget);
    expect(find.text(AppStrings.passwordRequired), findsOneWidget);
    expect(calls, 0);
  });

  testWidgets('đăng nhập đúng → vào màn chính', (tester) async {
    await tester.pumpWidget(
      _signedOutApp((_) async => jsonResponse(_loginResponse, 200)),
    );
    await tester.pumpAndSettle();

    await _submitLogin(tester);

    expect(find.text(AppStrings.homeTitle), findsOneWidget);
  });

  testWidgets('sai mật khẩu → báo lỗi, ở lại màn đăng nhập', (tester) async {
    await tester.pumpWidget(
      _signedOutApp(
        (_) async => jsonResponse({
          'error': {'code': 'UNAUTHORIZED', 'message': 'Sai thông tin'},
        }, 401),
      ),
    );
    await tester.pumpAndSettle();

    await _submitLogin(tester);

    expect(find.text(AppStrings.loginFailed), findsOneWidget);
    expect(find.text(AppStrings.homeTitle), findsNothing);
  });

  testWidgets('mất mạng → báo không kết nối được máy chủ', (tester) async {
    await tester.pumpWidget(
      _signedOutApp((_) async => throw http.ClientException('refused')),
    );
    await tester.pumpAndSettle();

    await _submitLogin(tester);

    expect(find.text(AppStrings.networkError), findsOneWidget);
  });
}
