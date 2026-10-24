import 'dart:convert';
import 'dart:io';

import 'package:dart_frog/dart_frog.dart';
import 'package:mocktail/mocktail.dart';
import 'package:server/core/errors/api_error.dart';
import 'package:server/core/middleware/auth_middleware.dart';
import 'package:server/core/middleware/error_middleware.dart';
import 'package:server/features/auth/domain/services/auth_service.dart';
import 'package:server/models/auth_principal.dart';
import 'package:test/test.dart';

import '../../routes/api/v1/auth/login.dart' as login_route;

class _MockContext extends Mock implements RequestContext {}

class _MockAuthService extends Mock implements AuthService {}

/// Dựng context giả với [request].
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
_MockContext _contextWith(Request request) {
  final context = _MockContext();
  when(() => context.request).thenReturn(request);
  return context;
}

/// Gọi [handler] qua middleware lỗi chung, trả status + JSON.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<(int, Object?)> _call(Handler handler, RequestContext context) async {
  final response = await errorMiddleware()(handler)(context);
  final body = await response.body();
  return (response.statusCode, body.isEmpty ? null : jsonDecode(body));
}

/// Route và middleware: kiểm dữ liệu vào, mã lỗi, quyền.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
void main() {
  final loginUri = Uri.parse('http://localhost/api/v1/auth/login');

  test(
    'đăng nhập thiếu dữ liệu → 400 kèm từng lỗi, không gọi service',
    () async {
      final service = _MockAuthService();
      final context = _contextWith(
        Request.post(loginUri, body: jsonEncode({'email': 'sai'})),
      );
      when(() => context.read<AuthService>()).thenReturn(service);

      final (status, body) = await _call(login_route.onRequest, context);

      expect(status, 400);
      expect(
        (body! as Map)['error'],
        containsPair('details', [
          'email phải là email hợp lệ',
          'password là bắt buộc',
        ]),
      );
      verifyNever(() => service.login(any(), any()));
    },
  );

  test('đăng nhập đúng → 200 trả token; sai phương thức → 405', () async {
    final service = _MockAuthService();
    when(
      () => service.login('a@example.com', 'matkhau-123'),
    ).thenAnswer((_) async => {'accessToken': 'at'});
    final context = _contextWith(
      Request.post(
        loginUri,
        body: jsonEncode({'email': 'a@example.com', 'password': 'matkhau-123'}),
      ),
    );
    when(() => context.read<AuthService>()).thenReturn(service);

    final (status, body) = await _call(login_route.onRequest, context);
    expect(status, 200);
    expect(body, {'accessToken': 'at'});
    expect(
      (await _call(
        login_route.onRequest,
        _contextWith(Request.get(loginUri)),
      )).$1,
      405,
    );
  });

  test(
    'thân không phải JSON → 400; lỗi không lường trước → 500 không lộ chi tiết',
    () async {
      final service = _MockAuthService();
      final context = _contextWith(
        Request.post(loginUri, body: '{khong-phai-json'),
      );
      when(() => context.read<AuthService>()).thenReturn(service);
      expect((await _call(login_route.onRequest, context)).$1, 400);

      final (status, body) = await _call(
        (_) => throw StateError('mật khẩu db lộ'),
        _contextWith(Request.get(loginUri)),
      );
      expect(status, 500);
      expect(jsonEncode(body), isNot(contains('mật khẩu db')));
    },
  );

  test('404 mặc định của framework → định dạng lỗi chung', () async {
    final (status, body) = await _call(
      (_) => Response(statusCode: HttpStatus.notFound, body: 'Route not found'),
      _contextWith(Request.get(loginUri)),
    );
    expect(status, 404);
    expect((body! as Map)['error'], containsPair('code', 'NOT_FOUND'));
  });

  test('admin: thiếu token → 401; USER → 403; ADMIN → qua', () async {
    final uri = Uri.parse('http://localhost/api/v1/admin/users');
    Response ok(RequestContext _) => Response.json(body: {'ok': true});

    expect(
      (await _call(requireAuth()(ok), _contextWith(Request.get(uri)))).$1,
      401,
    );

    final asUser = _contextWith(Request.get(uri));
    when(
      () => asUser.read<AuthPrincipal>(),
    ).thenReturn(const AuthPrincipal(userId: 'u1', role: UserRole.user));
    final (status, body) = await _call(requireRole(UserRole.admin)(ok), asUser);
    expect(status, 403);
    expect(
      (body! as Map)['error'],
      containsPair('code', ApiError.forbidden().code),
    );

    final asAdmin = _contextWith(Request.get(uri));
    when(
      () => asAdmin.read<AuthPrincipal>(),
    ).thenReturn(const AuthPrincipal(userId: 'u2', role: UserRole.admin));
    expect((await _call(requireRole(UserRole.admin)(ok), asAdmin)).$1, 200);
  });
}
