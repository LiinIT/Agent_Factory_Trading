import 'dart:convert';

import 'package:server/core/config/app_config.dart';
import 'package:server/core/errors/api_error.dart';
import 'package:server/core/utils/jwt_utils.dart';
import 'package:server/core/utils/token_hash.dart';
import 'package:server/models/auth_principal.dart';
import 'package:test/test.dart';

const _secret = 'khoa-bi-mat-chi-dung-cho-test-dai-32-ky-tu';

/// Lõi server: cấu hình, lỗi chung, JWT, băm token.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
void main() {
  test('cấu hình thiếu biến bắt buộc hoặc secret ngắn → dừng kèm lý do', () {
    expect(
      () => AppConfig.fromEnvironment({}),
      throwsA(
        isA<StateError>().having(
          (e) => e.message,
          'message',
          contains('DATABASE_URL, JWT_ACCESS_SECRET'),
        ),
      ),
    );
    expect(
      () => AppConfig.fromEnvironment({
        'DATABASE_URL': 'postgresql://a@b/c',
        'JWT_ACCESS_SECRET': 'ngan',
      }),
      throwsA(
        isA<StateError>().having(
          (e) => e.message,
          'message',
          contains('ít nhất 32'),
        ),
      ),
    );
    final config = AppConfig.fromEnvironment({
      'DATABASE_URL': 'postgresql://a@b/c',
      'JWT_ACCESS_SECRET': _secret,
      'CORS_ORIGINS': 'http://a.test, http://b.test',
    });
    expect(config.corsOrigins, {'http://a.test', 'http://b.test'});
    expect(config.accessTokenTtl, const Duration(seconds: 900));
  });

  test('lỗi chung: { error: { code, message, details } }', () async {
    final response = ApiError.badRequest(['email sai']).toResponse();
    expect(response.statusCode, 400);
    expect(jsonDecode(await response.body()), {
      'error': {
        'code': 'BAD_REQUEST',
        'message': 'Dữ liệu không hợp lệ',
        'details': ['email sai'],
      },
    });
    expect(ApiError.forbidden().code, 'FORBIDDEN');
    expect(ApiError(418, 'tea').code, 'HTTP_418');
  });

  test('JWT: ký rồi kiểm ra đúng người; sai khoá / hết hạn / rác → 401', () {
    final signer = AccessTokenSigner(
      secret: _secret,
      ttl: const Duration(minutes: 15),
    );
    final token = signer.sign(
      const AuthPrincipal(userId: 'u1', role: UserRole.admin),
    );

    expect(signer.verify(token).userId, 'u1');
    expect(signer.verify(token).isAdmin, isTrue);
    final otherKey = AccessTokenSigner(
      secret: '${_secret}khac',
      ttl: const Duration(minutes: 15),
    );
    expect(
      () => otherKey.verify(token),
      throwsA(isA<ApiError>().having((e) => e.status, 'status', 401)),
    );
    final expired = AccessTokenSigner(
      secret: _secret,
      ttl: const Duration(seconds: -1),
    );
    expect(
      () => signer.verify(
        expired.sign(const AuthPrincipal(userId: 'u1', role: UserRole.user)),
      ),
      throwsA(
        isA<ApiError>().having((e) => e.message, 'message', 'Phiên đã hết hạn'),
      ),
    );
    expect(() => signer.verify('rac'), throwsA(isA<ApiError>()));
  });

  test('refresh token ngẫu nhiên, đủ dài; bản băm cố định, không lộ token', () {
    final first = newRefreshToken();
    expect(first.length, greaterThanOrEqualTo(60));
    expect(newRefreshToken(), isNot(first));
    expect(hashToken(first), hashToken(first));
    expect(hashToken(first), isNot(contains(first)));
  });
}
