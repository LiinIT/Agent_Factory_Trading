import 'dart:convert';

import 'package:app/core/services/token_storage.dart';
import 'package:app/core/network/api_client.dart';
import 'package:app/core/network/api_providers.dart';
import 'package:app/features/auth/presentation/providers/auth_controller.dart';
import 'package:app/core/entities/auth_tokens.dart';
import 'package:app/features/auth/domain/entities/user.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:http/http.dart' as http;

const testBaseUrl = 'http://be.test/api/v1';

const testUser = User(id: 'u1', email: 'a@example.com', role: 'USER');

/// JSON người dùng mẫu như be/ trả về.
const testUserJson = {
  'id': 'u1',
  'email': 'a@example.com',
  'name': null,
  'role': 'USER',
  'createdAt': '2026-10-20T00:00:00.000Z',
};

/// Kho token trong bộ nhớ thay Keychain / Keystore khi test.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class InMemoryTokenStorage extends TokenStorage {
  /// Tạo kho, có thể nạp sẵn [tokens].
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  InMemoryTokenStorage([this.tokens]);

  AuthTokens? tokens;

  /// Trả token đang giữ.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  Future<AuthTokens?> read() async => tokens;

  /// Giữ token mới.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  Future<void> save(AuthTokens tokens) async => this.tokens = tokens;

  /// Xoá token.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  Future<void> clear() async => tokens = null;
}

/// Phiên giả đã đăng nhập sẵn; đăng xuất không làm gì để test giao diện ở lại màn chính.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class SignedInAuthController extends AuthController {
  /// Trả người dùng mẫu ngay.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  Future<User?> build() async => testUser;

  /// Bỏ qua đăng xuất.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  Future<void> logout() async {}
}

/// Override để dựng App ở trạng thái đã đăng nhập.
final signedInOverrides = <Override>[
  authControllerProvider.overrideWith(SignedInAuthController.new),
];

/// Override nối App với be/ giả: [client] trả lời thay máy chủ, token nằm trong bộ nhớ.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
List<Override> fakeBackendOverrides(
  http.Client client,
  InMemoryTokenStorage storage,
) => [
  tokenStorageProvider.overrideWithValue(storage),
  apiClientProvider.overrideWith(
    (ref) => ApiClient(
      httpClient: client,
      tokenStorage: storage,
      baseUrl: testBaseUrl,
    ),
  ),
];

/// Tạo phản hồi JSON giả.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
http.Response jsonResponse(Object? body, int status) => http.Response(
  body == null ? '' : jsonEncode(body),
  status,
  headers: {'content-type': 'application/json; charset=utf-8'},
);
