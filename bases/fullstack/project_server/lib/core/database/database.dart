import 'package:postgres/postgres.dart';

import 'package:server/core/config/app_config.dart';
import 'package:server/core/utils/app_logger.dart';

const _maxConnections = 10;
const _defaultPort = 5432;

/// Mở pool kết nối PostgreSQL theo `DATABASE_URL` và thử `SELECT 1` ngay.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<Pool<void>> createDatabasePool(AppConfig config) async {
  final endpoint = endpointFromUrl(config.databaseUrl);
  final pool = Pool<void>.withEndpoints(
    [endpoint],
    settings: PoolSettings(
      maxConnectionCount: _maxConnections,
      applicationName: 'server',
      sslMode: config.dbSslMode,
    ),
  );
  await pool.execute('SELECT 1');
  appLogger.i(
    '[DB] kết nối ${endpoint.database}@${endpoint.host}:${endpoint.port}',
  );
  return pool;
}

/// Đọc `postgresql://user:password@host:port/dbname` thành Endpoint.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Endpoint endpointFromUrl(String url) {
  final uri = Uri.parse(url);
  final userInfo = uri.userInfo.split(':');
  return Endpoint(
    host: uri.host,
    port: uri.hasPort ? uri.port : _defaultPort,
    database: uri.path.length > 1 ? uri.path.substring(1) : 'postgres',
    username: Uri.decodeComponent(userInfo.first),
    password: userInfo.length > 1
        ? Uri.decodeComponent(userInfo.sublist(1).join(':'))
        : null,
  );
}
