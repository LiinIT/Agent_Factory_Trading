import 'dart:io';

import 'package:postgres/postgres.dart';
import 'package:server/core/config/env.dart';
import 'package:server/core/database/database.dart';
import 'package:server/core/utils/app_logger.dart';

const _migrationsDir = 'db/migrations';

/// Áp các migration `db/migrations/*.sql` chưa chạy, theo thứ tự tên (YYYYMMDD_NN_mo_ta.sql),
/// mỗi file trong một transaction; đã chạy ghi vào bảng `schema_migrations`. Chạy: `dart run tool/migrate.dart`.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<void> main() async {
  final env = loadEnvironment();
  final url = env['DATABASE_URL'];
  if (url == null || url.isEmpty) {
    appLogger.e('[Migrate] thiếu DATABASE_URL');
    exit(1);
  }
  final connection = await Connection.open(
    endpointFromUrl(url),
    settings: ConnectionSettings(
      sslMode: env['DB_SSL_MODE'] == 'require'
          ? SslMode.require
          : SslMode.disable,
    ),
  );
  try {
    await connection.execute(
      'CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    final applied = (await connection.execute(
      'SELECT version FROM schema_migrations',
    )).map((row) => row.first as String).toSet();
    final files =
        Directory(_migrationsDir)
            .listSync()
            .whereType<File>()
            .where((file) => file.path.endsWith('.sql'))
            .toList()
          ..sort((a, b) => a.path.compareTo(b.path));
    var count = 0;
    for (final file in files) {
      final version = file.uri.pathSegments.last;
      if (applied.contains(version)) continue;
      await connection.runTx((tx) async {
        await tx.execute(file.readAsStringSync(), queryMode: QueryMode.simple);
        await tx.execute(
          Sql.named(
            'INSERT INTO schema_migrations (version) VALUES (@version)',
          ),
          parameters: {'version': version},
        );
      });
      appLogger.i('[Migrate] đã áp $version');
      count++;
    }
    appLogger.i(
      '[Migrate] xong: $count migration mới, ${applied.length} đã có',
    );
  } finally {
    await connection.close();
  }
}
