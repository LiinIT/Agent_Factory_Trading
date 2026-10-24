/// Người gọi API đã xác thực (đọc từ access token): id + vai trò.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
class AuthPrincipal {
  /// Tạo người gọi đã xác thực.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-21
  const AuthPrincipal({required this.userId, required this.role});

  final String userId;
  final String role;

  bool get isAdmin => role == UserRole.admin;
}

/// Vai trò người dùng (khớp CHECK constraint trong database).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
abstract final class UserRole {
  static const user = 'USER';
  static const admin = 'ADMIN';
}
