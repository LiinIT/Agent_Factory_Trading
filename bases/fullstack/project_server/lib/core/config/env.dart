import 'dart:io';

import 'package:dotenv/dotenv.dart';

/// Biến môi trường của tiến trình, cộng `.env` nếu có (`.env` không ghi đè biến thật).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
Map<String, String> loadEnvironment() {
  final dotenv = DotEnv(includePlatformEnvironment: true, quiet: true);
  if (File('.env').existsSync()) dotenv.load();
  return {
    for (final key in _knownKeys)
      if (dotenv[key] != null) key: dotenv[key]!,
  };
}

const _knownKeys = [
  'APP_ENV',
  'DATABASE_URL',
  'DB_SSL_MODE',
  'JWT_ACCESS_SECRET',
  'JWT_ACCESS_TTL_SECONDS',
  'REFRESH_TOKEN_TTL_DAYS',
  'CORS_ORIGINS',
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD',
];
