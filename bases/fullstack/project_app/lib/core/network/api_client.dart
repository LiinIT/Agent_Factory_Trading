import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'package:app/core/services/token_storage.dart';
import 'package:app/core/constants/app_env.dart';
import 'package:app/core/errors/api_exception.dart';
import 'package:app/core/utils/app_logger.dart';
import 'package:app/core/entities/auth_tokens.dart';

const _requestTimeout = Duration(seconds: 15);
const _statusUnauthorized = 401;
const _refreshPath = '/auth/refresh';

/// Một yêu cầu gửi tới be/.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class _ApiRequest {
  /// Tạo yêu cầu.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  const _ApiRequest(
    this.method,
    this.path, {
    this.body,
    this.isAuthenticated = true,
  });

  final String method;
  final String path;
  final Object? body;
  final bool isAuthenticated;
}

/// Cổng duy nhất để App gọi be/ (`/api/v1`): gắn access token, đọc định dạng lỗi chung,
/// gặp 401 thì làm mới token đúng một lần rồi gửi lại. Refresh token dùng một lần, nên
/// nhiều yêu cầu cùng gặp 401 chỉ chung một lần làm mới (gửi hai lần = be/ coi là token
/// bị đánh cắp và thu hồi mọi phiên).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class ApiClient {
  /// Tạo client; [baseUrl] lấy từ `API_BASE_URL` khi không truyền.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  ApiClient({
    required http.Client httpClient,
    required TokenStorage tokenStorage,
    String baseUrl = AppEnv.apiBaseUrl,
  }) : _httpClient = httpClient,
       _tokenStorage = tokenStorage,
       _baseUrl = baseUrl;

  final http.Client _httpClient;
  final TokenStorage _tokenStorage;
  final String _baseUrl;
  Future<bool>? _refreshing;

  /// Gọi GET, trả JSON đã giải mã (null nếu không có nội dung).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Future<Object?> get(String path) => _send(_ApiRequest('GET', path));

  /// Gọi POST với [body]; `isAuthenticated: false` cho đăng nhập / đăng ký.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Future<Object?> post(
    String path, {
    Object? body,
    bool isAuthenticated = true,
  }) => _send(
    _ApiRequest('POST', path, body: body, isAuthenticated: isAuthenticated),
  );

  /// Gửi yêu cầu; 401 có đăng nhập thì làm mới token rồi gửi lại một lần.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Future<Object?> _send(_ApiRequest request) async {
    final response = await _sendOnce(request);
    if (response.statusCode != _statusUnauthorized ||
        !request.isAuthenticated) {
      return _decode(response);
    }
    appLogger.w('[ApiClient] 401 ${request.path} → làm mới token');
    final isRefreshed = await (_refreshing ??= _refreshTokens().whenComplete(
      () => _refreshing = null,
    ));
    if (!isRefreshed) return _decode(response);
    return _decode(await _sendOnce(request));
  }

  /// Gửi một lần, đổi lỗi mạng / quá giờ thành [ApiException].
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Future<http.Response> _sendOnce(_ApiRequest request) async {
    final httpRequest = http.Request(
      request.method,
      Uri.parse('$_baseUrl${request.path}'),
    )..headers['Accept'] = 'application/json';
    if (request.body != null) {
      httpRequest
        ..headers['Content-Type'] = 'application/json'
        ..body = jsonEncode(request.body);
    }
    if (request.isAuthenticated) {
      final tokens = await _tokenStorage.read();
      if (tokens != null) {
        httpRequest.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
      }
    }
    appLogger.d('[ApiClient] ${request.method} ${request.path}');
    try {
      final streamed = await _httpClient
          .send(httpRequest)
          .timeout(_requestTimeout);
      return await http.Response.fromStream(streamed);
    } on TimeoutException {
      throw const ApiException.timeout();
    } on http.ClientException catch (error) {
      appLogger.w('[ApiClient] lỗi mạng ${request.path}: ${error.message}');
      throw const ApiException.networkError();
    }
  }

  /// Đổi refresh token lấy cặp mới; be/ từ chối thì xoá phiên trên máy.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Future<bool> _refreshTokens() async {
    final tokens = await _tokenStorage.read();
    if (tokens == null) return false;
    final response = await _sendOnce(
      _ApiRequest(
        'POST',
        _refreshPath,
        body: {'refreshToken': tokens.refreshToken},
        isAuthenticated: false,
      ),
    );
    if (response.statusCode >= 300) {
      appLogger.w('[ApiClient] làm mới token bị từ chối → xoá phiên');
      await _tokenStorage.clear();
      return false;
    }
    final json = jsonDecode(response.body) as Map<String, dynamic>;
    await _tokenStorage.save(AuthTokens.fromJson(json));
    appLogger.i('[ApiClient] đã làm mới token');
    return true;
  }

  /// Trả JSON khi thành công; lỗi thì đọc định dạng chung `{ error: {...} }`.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Object? _decode(http.Response response) {
    final isSuccess = response.statusCode >= 200 && response.statusCode < 300;
    if (isSuccess) {
      return response.body.isEmpty ? null : jsonDecode(response.body);
    }
    final error = _readErrorBody(response.body);
    throw ApiException(
      statusCode: response.statusCode,
      code: error['code'] as String? ?? 'HTTP_${response.statusCode}',
      message: error['message'] as String? ?? 'Yêu cầu không thành công',
      details: error['details'],
    );
  }

  /// Lấy phần `error` của thân lỗi; thân không phải JSON thì trả map rỗng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Map<String, dynamic> _readErrorBody(String body) {
    try {
      final json = jsonDecode(body);
      if (json is Map<String, dynamic> &&
          json['error'] is Map<String, dynamic>) {
        return json['error'] as Map<String, dynamic>;
      }
    } on FormatException {
      appLogger.w('[ApiClient] thân lỗi không phải JSON');
    }
    return const {};
  }
}
