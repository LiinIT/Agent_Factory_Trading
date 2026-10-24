import 'package:server/core/errors/api_error.dart';
import 'package:server/core/utils/jwt_utils.dart';
import 'package:server/core/utils/password_hasher.dart';
import 'package:server/features/auth/domain/services/auth_service.dart';
import 'package:test/test.dart';

import '../../support/fakes.dart';

const _secret = 'khoa-bi-mat-chi-dung-cho-test-dai-32-ky-tu';

/// AuthService: đăng ký, đăng nhập, làm mới xoay vòng, phát hiện dùng lại, đăng xuất.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
void main() {
  late InMemoryUsers users;
  late InMemoryRefreshTokens refreshTokens;
  late AuthService service;
  final signer = AccessTokenSigner(
    secret: _secret,
    ttl: const Duration(minutes: 15),
  );

  setUp(() {
    users = InMemoryUsers();
    refreshTokens = InMemoryRefreshTokens();
    service = AuthService(
      users: users,
      refreshTokens: refreshTokens,
      signer: signer,
      refreshTokenTtl: const Duration(days: 30),
      passwordHasher: const PasswordHasher(rounds: 4),
    );
  });

  Matcher apiError(int status, String message) => isA<ApiError>()
      .having((error) => error.status, 'status', status)
      .having((error) => error.message, 'message', message);

  test(
    'đăng ký: chuẩn hoá email, không lưu mật khẩu thô, trả token có role USER',
    () async {
      final tokens = await service.register((
        email: '  A@Example.com ',
        password: 'matkhau-123',
        name: ' An ',
      ));

      expect(users.rows.single.email, 'a@example.com');
      expect(users.rows.single.passwordHash, isNot(contains('matkhau-123')));
      expect(users.rows.single.name, 'An');
      expect((tokens['user']! as Map)['email'], 'a@example.com');
      expect(tokens['user'], isNot(contains('passwordHash')));
      expect(signer.verify(tokens['accessToken']! as String).role, 'USER');
    },
  );

  test('đăng ký trùng email → 409', () async {
    await service.register((
      email: 'a@example.com',
      password: 'matkhau-123',
      name: null,
    ));
    await expectLater(
      service.register((
        email: 'A@example.com',
        password: 'khac-1234',
        name: null,
      )),
      throwsA(apiError(409, 'Email đã được dùng')),
    );
  });

  test(
    'đăng nhập sai mật khẩu hoặc không có email → cùng một câu 401',
    () async {
      await service.register((
        email: 'a@example.com',
        password: 'matkhau-123',
        name: null,
      ));
      await expectLater(
        service.login('a@example.com', 'sai-roi-123'),
        throwsA(apiError(401, 'Email hoặc mật khẩu không đúng')),
      );
      await expectLater(
        service.login('khong@example.com', 'matkhau-123'),
        throwsA(apiError(401, 'Email hoặc mật khẩu không đúng')),
      );
    },
  );

  test('làm mới: token cũ bị thu hồi, cấp token mới', () async {
    final first = await service.register((
      email: 'a@example.com',
      password: 'matkhau-123',
      name: null,
    ));
    final second = await service.refresh(first['refreshToken']! as String);

    expect(second['refreshToken'], isNot(first['refreshToken']));
    expect(refreshTokens.rows['t1']?.revokedAt, isNotNull);
    expect(refreshTokens.rows['t2']?.revokedAt, isNull);
  });

  test('dùng lại refresh token đã thu hồi → thu hồi mọi phiên, 401', () async {
    final first = await service.register((
      email: 'a@example.com',
      password: 'matkhau-123',
      name: null,
    ));
    final second = await service.refresh(first['refreshToken']! as String);

    await expectLater(
      service.refresh(first['refreshToken']! as String),
      throwsA(apiError(401, 'Refresh token đã bị thu hồi')),
    );
    await expectLater(
      service.refresh(second['refreshToken']! as String),
      throwsA(apiError(401, 'Refresh token đã bị thu hồi')),
    );
  });

  test('refresh token hết hạn hoặc lạ → 401', () async {
    final tokens = await service.register((
      email: 'a@example.com',
      password: 'matkhau-123',
      name: null,
    ));
    refreshTokens.expireAll();
    await expectLater(
      service.refresh(tokens['refreshToken']! as String),
      throwsA(apiError(401, 'Refresh token đã hết hạn')),
    );
    await expectLater(
      service.refresh('token-khong-ton-tai-trong-db'),
      throwsA(apiError(401, 'Refresh token không hợp lệ')),
    );
  });

  test('đăng xuất thu hồi token; token lạ vẫn thành công', () async {
    final tokens = await service.register((
      email: 'a@example.com',
      password: 'matkhau-123',
      name: null,
    ));
    await service.logout(tokens['refreshToken']! as String);
    await service.logout('token-khong-ton-tai-trong-db');

    expect(refreshTokens.rows['t1']?.revokedAt, isNotNull);
  });
}
