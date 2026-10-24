/// Người dùng trong database. `toPublicJson` không bao giờ có `passwordHash`.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
class User {
  /// Tạo người dùng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  const User({
    required this.id,
    required this.email,
    required this.passwordHash,
    required this.role,
    required this.createdAt,
    this.name,
  });

  /// Đọc từ một dòng bảng `users` (tên cột snake_case).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  factory User.fromRow(Map<String, dynamic> row) => User(
    id: row['id'] as String,
    email: row['email'] as String,
    passwordHash: row['password_hash'] as String,
    name: row['name'] as String?,
    role: row['role'] as String,
    createdAt: row['created_at'] as DateTime,
  );

  final String id;
  final String email;
  final String passwordHash;
  final String? name;
  final String role;
  final DateTime createdAt;

  /// Dữ liệu công khai trả ra API (schema `User` trong openapi.yaml).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  Map<String, Object?> toPublicJson() => {
    'id': id,
    'email': email,
    'name': name,
    'role': role,
    'createdAt': createdAt.toUtc().toIso8601String(),
  };
}
