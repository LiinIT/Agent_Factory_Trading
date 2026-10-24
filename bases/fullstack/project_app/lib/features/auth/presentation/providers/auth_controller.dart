import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:app/core/constants/app_strings.dart';
import 'package:app/core/errors/api_exception.dart';
import 'package:app/core/network/api_providers.dart';
import 'package:app/core/utils/app_logger.dart';
import 'package:app/features/auth/data/datasources/auth_datasource.dart';
import 'package:app/features/auth/domain/entities/login_credentials.dart';
import 'package:app/features/auth/domain/entities/user.dart';

part 'auth_controller.g.dart';

/// Cung cấp AuthDatasource (thay bản giả trong test qua override).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
@Riverpod(keepAlive: true)
AuthDatasource authDatasource(Ref ref) =>
    AuthDatasource(ref.watch(apiClientProvider));

/// Controller phiên đăng nhập: state là người dùng hiện tại, null = chưa đăng nhập.
/// Điều phối datasource (API) và TokenStorage (lưu token trên máy).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
@Riverpod(keepAlive: true)
class AuthController extends _$AuthController {
  /// Khôi phục phiên đã lưu khi mở app; phiên hết hạn thì xoá token, về chưa đăng nhập.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  Future<User?> build() async {
    final tokenStorage = ref.watch(tokenStorageProvider);
    if (await tokenStorage.read() == null) return null;
    try {
      final user = await ref.watch(authDatasourceProvider).fetchMe();
      return user.toEntity();
    } on ApiException catch (error) {
      if (error.code != ApiException.unauthorizedCode) rethrow;
      appLogger.w('[AuthController] phiên hết hạn → xoá token');
      await tokenStorage.clear();
      return null;
    }
  }

  /// Đăng nhập; trả thông báo lỗi cho form, null nếu thành công.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Future<String?> login(LoginCredentials credentials) async {
    try {
      final session = await ref.read(authDatasourceProvider).login(credentials);
      await ref.read(tokenStorageProvider).save(session.tokens);
      appLogger.i('[AuthController] đăng nhập id=${session.user.id}');
      state = AsyncData(session.user.toEntity());
      return null;
    } on ApiException catch (error, stackTrace) {
      appLogger.e(
        '[AuthController] đăng nhập lỗi',
        error: error,
        stackTrace: stackTrace,
      );
      return _loginErrorMessage(error);
    }
  }

  /// Đăng xuất: thu hồi trên server (lỗi mạng vẫn xoá phiên trên máy), về màn đăng nhập.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Future<void> logout() async {
    final tokenStorage = ref.read(tokenStorageProvider);
    final tokens = await tokenStorage.read();
    try {
      if (tokens != null) {
        await ref.read(authDatasourceProvider).logout(tokens.refreshToken);
      }
    } on ApiException catch (error) {
      appLogger.w('[AuthController] logout trên server lỗi: $error');
    } finally {
      await tokenStorage.clear();
    }
    appLogger.i('[AuthController] đăng xuất');
    state = const AsyncData(null);
  }

  /// Đổi lỗi API thành câu báo cho người dùng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  String _loginErrorMessage(ApiException error) {
    if (error.isNetworkIssue) return AppStrings.networkError;
    if (error.code == ApiException.unauthorizedCode) {
      return AppStrings.loginFailed;
    }
    return error.message;
  }
}
