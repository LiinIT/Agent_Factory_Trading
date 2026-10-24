import 'package:app/core/constants/app_strings.dart';
import 'package:app/features/auth/domain/entities/login_credentials.dart';
import 'package:app/features/auth/presentation/providers/auth_controller.dart';
import 'package:app/core/entities/auth_tokens.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import '../../helpers/fakes.dart';

const _credentials = LoginCredentials(email: 'a@example.com', password: 'pw');
const _loginResponse = {
  'accessToken': 'at',
  'refreshToken': 'rt',
  'expiresIn': 900,
  'user': testUserJson,
};

/// Tạo container nối AuthController với be/ giả.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
ProviderContainer _containerWith(
  InMemoryTokenStorage storage,
  Future<http.Response> Function(http.Request request) handler,
) {
  final container = ProviderContainer(
    overrides: fakeBackendOverrides(MockClient(handler), storage),
  );
  addTearDown(container.dispose);
  return container;
}

/// AuthController: khôi phục phiên, đăng nhập, đăng xuất.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
void main() {
  test('chưa có token → chưa đăng nhập, không gọi be/', () async {
    var calls = 0;
    final container = _containerWith(InMemoryTokenStorage(), (_) async {
      calls++;
      return jsonResponse(null, 500);
    });

    expect(await container.read(authControllerProvider.future), isNull);
    expect(calls, 0);
  });

  test('có token hợp lệ → khôi phục người dùng từ /users/me', () async {
    final container = _containerWith(
      InMemoryTokenStorage(
        const AuthTokens(accessToken: 'at', refreshToken: 'rt'),
      ),
      (_) async => jsonResponse(testUserJson, 200),
    );

    final user = await container.read(authControllerProvider.future);
    expect(user?.email, 'a@example.com');
  });

  test('đăng nhập đúng → lưu token, state là người dùng', () async {
    final storage = InMemoryTokenStorage();
    final container = _containerWith(
      storage,
      (_) async => jsonResponse(_loginResponse, 200),
    );
    await container.read(authControllerProvider.future);

    final error = await container
        .read(authControllerProvider.notifier)
        .login(_credentials);

    expect(error, isNull);
    expect(container.read(authControllerProvider).value?.id, 'u1');
    expect(storage.tokens?.accessToken, 'at');
  });

  test('sai mật khẩu → trả câu báo, vẫn chưa đăng nhập', () async {
    final container = _containerWith(
      InMemoryTokenStorage(),
      (_) async => jsonResponse({
        'error': {'code': 'UNAUTHORIZED', 'message': 'Sai thông tin'},
      }, 401),
    );
    await container.read(authControllerProvider.future);

    final error = await container
        .read(authControllerProvider.notifier)
        .login(_credentials);

    expect(error, AppStrings.loginFailed);
    expect(container.read(authControllerProvider).value, isNull);
  });

  test('đăng xuất → thu hồi trên be/ và xoá token', () async {
    final storage = InMemoryTokenStorage(
      const AuthTokens(accessToken: 'at', refreshToken: 'rt'),
    );
    final paths = <String>[];
    final container = _containerWith(storage, (request) async {
      paths.add(request.url.path);
      return request.url.path.endsWith('/logout')
          ? jsonResponse(null, 204)
          : jsonResponse(testUserJson, 200);
    });
    await container.read(authControllerProvider.future);

    await container.read(authControllerProvider.notifier).logout();

    expect(paths.last, '/api/v1/auth/logout');
    expect(storage.tokens, isNull);
    expect(container.read(authControllerProvider).value, isNull);
  });
}
