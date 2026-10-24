import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';

const _refreshTokenBytes = 48;
final _random = Random.secure();

/// Sinh refresh token ngẫu nhiên (base64url, không padding) — chỉ trả cho client một lần.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
String newRefreshToken() {
  final bytes = List<int>.generate(
    _refreshTokenBytes,
    (_) => _random.nextInt(256),
  );
  return base64Url.encode(bytes).replaceAll('=', '');
}

/// SHA-256 của token — database chỉ lưu bản băm, lộ database cũng không dùng được token.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
String hashToken(String token) => sha256.convert(utf8.encode(token)).toString();
