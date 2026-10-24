import 'package:mocktail/mocktail.dart';
import 'package:server/features/auth/data/datasources/refresh_token_datasource.dart';
import 'package:server/features/users/data/datasources/users_datasource.dart';
import 'package:server/models/user.dart';

/// Bảng `users` giả trong bộ nhớ.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
class InMemoryUsers extends Fake implements UsersDatasource {
  final rows = <User>[];

  /// Tìm theo email.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  @override
  Future<User?> findByEmail(String email) async =>
      rows.where((user) => user.email == email).firstOrNull;

  /// Tìm theo id.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  @override
  Future<User?> findById(String id) async =>
      rows.where((user) => user.id == id).firstOrNull;

  /// Thêm người dùng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  @override
  Future<User> create({
    required String email,
    required String passwordHash,
    String? name,
    String role = 'USER',
  }) async {
    final user = User(
      id: 'u${rows.length + 1}',
      email: email,
      passwordHash: passwordHash,
      name: name,
      role: role,
      createdAt: DateTime.utc(2026, 10, 21),
    );
    rows.add(user);
    return user;
  }
}

/// Bảng `refresh_tokens` giả trong bộ nhớ.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
class InMemoryRefreshTokens extends Fake implements RefreshTokenDatasource {
  final rows = <String, StoredRefreshToken>{};
  final hashes = <String, String>{};

  /// Lưu token.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  @override
  Future<void> save({
    required String userId,
    required String tokenHash,
    required DateTime expiresAt,
  }) async {
    final id = 't${rows.length + 1}';
    rows[id] = (id: id, userId: userId, expiresAt: expiresAt, revokedAt: null);
    hashes[tokenHash] = id;
  }

  /// Tìm theo bản băm.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  @override
  Future<StoredRefreshToken?> findByHash(String tokenHash) async =>
      rows[hashes[tokenHash]];

  /// Thu hồi một token.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  @override
  Future<void> revoke(String id) async {
    final row = rows[id];
    if (row != null && row.revokedAt == null) {
      rows[id] = (
        id: row.id,
        userId: row.userId,
        expiresAt: row.expiresAt,
        revokedAt: DateTime.now(),
      );
    }
  }

  /// Thu hồi mọi token của người dùng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  @override
  Future<void> revokeAll(String userId) async {
    for (final row
        in rows.values.where((row) => row.userId == userId).toList()) {
      await revoke(row.id);
    }
  }

  /// Cho token hết hạn ngay (giả lập thời gian trôi).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  void expireAll() {
    for (final row in rows.values.toList()) {
      rows[row.id] = (
        id: row.id,
        userId: row.userId,
        expiresAt: DateTime(2000),
        revokedAt: row.revokedAt,
      );
    }
  }
}
