/// Người dùng của app (entity thuần, không biết JSON hay API).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class User {
  /// Tạo người dùng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  const User({
    required this.id,
    required this.email,
    required this.role,
    this.name,
  });

  final String id;
  final String email;
  final String role;
  final String? name;
}
