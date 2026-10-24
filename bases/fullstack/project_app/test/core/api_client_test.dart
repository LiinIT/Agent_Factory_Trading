import 'dart:async';

import 'package:app/core/network/api_client.dart';
import 'package:app/core/errors/api_exception.dart';
import 'package:app/core/entities/auth_tokens.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

import '../helpers/fakes.dart';

const _oldTokens = AuthTokens(accessToken: 'old-at', refreshToken: 'old-rt');
const _newTokens = {
  'accessToken': 'new-at',
  'refreshToken': 'new-rt',
  'expiresIn': 900,
  'user': testUserJson,
};

/// Tạo ApiClient nối với be/ giả [handler].
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
ApiClient _clientWith(
  InMemoryTokenStorage storage,
  MockClientHandler handler,
) => ApiClient(
  httpClient: MockClient(handler),
  tokenStorage: storage,
  baseUrl: testBaseUrl,
);

/// ApiClient: định dạng lỗi chung, làm mới token khi 401, lỗi mạng.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
void main() {
  test('đọc định dạng lỗi chung { error: { code, message } }', () async {
    final client = _clientWith(
      InMemoryTokenStorage(),
      (_) async => jsonResponse({
        'error': {'code': 'CONFLICT', 'message': 'Email đã được dùng'},
      }, 409),
    );

    await expectLater(
      client.post('/auth/register', body: const {}, isAuthenticated: false),
      throwsA(
        isA<ApiException>()
            .having((error) => error.code, 'code', 'CONFLICT')
            .having((error) => error.statusCode, 'statusCode', 409)
            .having((error) => error.message, 'message', 'Email đã được dùng'),
      ),
    );
  });

  test('gắn access token; 401 → làm mới rồi gửi lại với token mới', () async {
    final storage = InMemoryTokenStorage(_oldTokens);
    final seenTokens = <String?>[];
    final client = _clientWith(storage, (request) async {
      if (request.url.path.endsWith('/auth/refresh')) {
        return jsonResponse(_newTokens, 200);
      }
      seenTokens.add(request.headers['Authorization']);
      return request.headers['Authorization'] == 'Bearer new-at'
          ? jsonResponse(testUserJson, 200)
          : jsonResponse({
              'error': {'code': 'UNAUTHORIZED', 'message': 'Hết hạn'},
            }, 401);
    });

    final json = await client.get('/users/me') as Map<String, dynamic>;

    expect(json['id'], 'u1');
    expect(seenTokens, ['Bearer old-at', 'Bearer new-at']);
    expect(storage.tokens?.refreshToken, 'new-rt');
  });

  test('nhiều yêu cầu cùng gặp 401 chỉ làm mới token một lần', () async {
    final storage = InMemoryTokenStorage(_oldTokens);
    var refreshCalls = 0;
    final refreshGate = Completer<void>();
    final client = _clientWith(storage, (request) async {
      if (request.url.path.endsWith('/auth/refresh')) {
        refreshCalls++;
        await refreshGate.future;
        return jsonResponse(_newTokens, 200);
      }
      return request.headers['Authorization'] == 'Bearer new-at'
          ? jsonResponse(testUserJson, 200)
          : jsonResponse(null, 401);
    });

    final calls = [client.get('/users/me'), client.get('/users/me')];
    await Future<void>.delayed(Duration.zero);
    refreshGate.complete();
    await Future.wait(calls);

    expect(refreshCalls, 1);
  });

  test('làm mới bị từ chối → xoá phiên, báo UNAUTHORIZED', () async {
    final storage = InMemoryTokenStorage(_oldTokens);
    final client = _clientWith(
      storage,
      (_) async => jsonResponse({
        'error': {'code': 'UNAUTHORIZED', 'message': 'Phiên hết hạn'},
      }, 401),
    );

    await expectLater(
      client.get('/users/me'),
      throwsA(
        isA<ApiException>().having(
          (error) => error.code,
          'code',
          ApiException.unauthorizedCode,
        ),
      ),
    );
    expect(storage.tokens, isNull);
  });

  test('mất mạng → NETWORK_ERROR, không xoá phiên', () async {
    final storage = InMemoryTokenStorage(_oldTokens);
    final client = _clientWith(
      storage,
      (_) async => throw http.ClientException('Connection refused'),
    );

    await expectLater(
      client.get('/users/me'),
      throwsA(
        isA<ApiException>().having((e) => e.isNetworkIssue, 'mạng', true),
      ),
    );
    expect(storage.tokens, isNotNull);
  });

  test('thân lỗi không phải JSON vẫn ra mã HTTP_<status>', () async {
    final client = _clientWith(
      InMemoryTokenStorage(),
      (_) async => http.Response('<html>502</html>', 502),
    );

    await expectLater(
      client.get('/health'),
      throwsA(isA<ApiException>().having((e) => e.code, 'code', 'HTTP_502')),
    );
  });
}
