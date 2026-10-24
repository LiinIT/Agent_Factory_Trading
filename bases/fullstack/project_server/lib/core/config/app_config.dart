import 'package:postgres/postgres.dart';

const _minSecretLength = 32;
const _defaultAccessTtlSeconds = 900;
const _defaultRefreshTtlDays = 30;

/// Cấu hình server đọc từ biến môi trường (`.env` khi dev); thiếu / sai thì dừng ngay kèm lý do.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
class AppConfig {
  /// Tạo cấu hình đã kiểm.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  const AppConfig({
    required this.appEnv,
    required this.databaseUrl,
    required this.dbSslMode,
    required this.jwtAccessSecret,
    required this.accessTokenTtl,
    required this.refreshTokenTtl,
    required this.corsOrigins,
  });

  /// Đọc và kiểm [env]: bắt buộc `DATABASE_URL`, `JWT_ACCESS_SECRET` (≥ 32 ký tự).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  factory AppConfig.fromEnvironment(Map<String, String> env) {
    final missing = [
      'DATABASE_URL',
      'JWT_ACCESS_SECRET',
    ].where((key) => (env[key] ?? '').trim().isEmpty).toList();
    if (missing.isNotEmpty) {
      throw StateError(
        'Thiếu biến môi trường: ${missing.join(', ')} — xem .env.example',
      );
    }
    final secret = env['JWT_ACCESS_SECRET']!;
    if (secret.length < _minSecretLength) {
      throw StateError(
        'JWT_ACCESS_SECRET phải dài ít nhất $_minSecretLength ký tự',
      );
    }
    return AppConfig(
      appEnv: env['APP_ENV'] ?? 'development',
      databaseUrl: env['DATABASE_URL']!,
      dbSslMode: env['DB_SSL_MODE'] == 'require'
          ? SslMode.require
          : SslMode.disable,
      jwtAccessSecret: secret,
      accessTokenTtl: Duration(
        seconds:
            int.tryParse(env['JWT_ACCESS_TTL_SECONDS'] ?? '') ??
            _defaultAccessTtlSeconds,
      ),
      refreshTokenTtl: Duration(
        days:
            int.tryParse(env['REFRESH_TOKEN_TTL_DAYS'] ?? '') ??
            _defaultRefreshTtlDays,
      ),
      corsOrigins: (env['CORS_ORIGINS'] ?? '')
          .split(',')
          .map((origin) => origin.trim())
          .where((origin) => origin.isNotEmpty)
          .toSet(),
    );
  }

  final String appEnv;
  final String databaseUrl;
  final SslMode dbSslMode;
  final String jwtAccessSecret;
  final Duration accessTokenTtl;
  final Duration refreshTokenTtl;
  final Set<String> corsOrigins;

  bool get isProduction => appEnv == 'production';
}
