import 'package:postgres/postgres.dart';

import 'package:server/core/config/app_config.dart';
import 'package:server/core/database/database.dart';
import 'package:server/core/utils/jwt_utils.dart';
import 'package:server/features/auth/data/datasources/refresh_token_datasource.dart';
import 'package:server/features/auth/domain/services/auth_service.dart';
import 'package:server/features/users/data/datasources/users_datasource.dart';

/// Các đối tượng dùng chung của server, dựng một lần khi có request đầu tiên.
/// Thêm tính năng mới: thêm datasource / service vào đây rồi `provide` ở `routes/_middleware.dart`.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
class AppServices {
  /// Tạo từ cấu hình và pool kết nối.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  AppServices(this.config, this.pool)
    : signer = AccessTokenSigner(
        secret: config.jwtAccessSecret,
        ttl: config.accessTokenTtl,
      ),
      users = UsersDatasource(pool) {
    auth = AuthService(
      users: users,
      refreshTokens: RefreshTokenDatasource(pool),
      signer: signer,
      refreshTokenTtl: config.refreshTokenTtl,
    );
  }

  /// Kiểm cấu hình rồi mở database.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  static Future<AppServices> start(AppConfig config) async =>
      AppServices(config, await createDatabasePool(config));

  final AppConfig config;
  final Pool<void> pool;
  final AccessTokenSigner signer;
  final UsersDatasource users;
  late final AuthService auth;
}
