import 'dart:io';

import 'package:postgres/postgres.dart';
import 'package:server/core/config/env.dart';
import 'package:server/core/database/database.dart';
import 'package:server/core/utils/app_logger.dart';
import 'package:server/core/utils/password_hasher.dart';

/// Tạo / cập nhật tài khoản ADMIN từ `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` — chỉ dùng khi dev,
/// từ chối chạy ở production. Chạy: `dart run tool/seed.dart`.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Future<void> main() async {
  final env = loadEnvironment();
  if (env['APP_ENV'] == 'production') {
    appLogger.e('[Seed] không chạy seed ở production');
    exit(1);
  }
  final email = env['SEED_ADMIN_EMAIL']?.trim().toLowerCase();
  final password = env['SEED_ADMIN_PASSWORD'];
  final url = env['DATABASE_URL'];
  if (email == null || password == null || url == null) {
    appLogger.e(
      '[Seed] thiếu DATABASE_URL / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD',
    );
    exit(1);
  }
  final connection = await Connection.open(
    endpointFromUrl(url),
    settings: const ConnectionSettings(sslMode: SslMode.disable),
  );
  try {
    await connection.execute(
      Sql.named(
        "INSERT INTO users (email, password_hash, name, role) VALUES (@email, @hash, 'Admin', 'ADMIN') "
        "ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'ADMIN', updated_at = now()",
      ),
      parameters: {
        'email': email,
        'hash': const PasswordHasher().hash(password),
      },
    );
    appLogger.i('[Seed] admin sẵn sàng: $email');
  } finally {
    await connection.close();
  }
}
