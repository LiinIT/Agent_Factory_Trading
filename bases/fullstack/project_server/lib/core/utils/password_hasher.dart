import 'package:bcrypt/bcrypt.dart';

const _defaultRounds = 12;

/// Băm / kiểm mật khẩu bằng bcrypt (test dùng [rounds] nhỏ cho nhanh).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
class PasswordHasher {
  /// Tạo bộ băm với độ khó [rounds].
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  const PasswordHasher({this.rounds = _defaultRounds});

  final int rounds;

  /// Băm mật khẩu.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  String hash(String password) =>
      BCrypt.hashpw(password, BCrypt.gensalt(logRounds: rounds));

  /// Mật khẩu có khớp bản băm không.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  bool verify(String password, String passwordHash) =>
      BCrypt.checkpw(password, passwordHash);
}
