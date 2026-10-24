/// Thông tin người dùng nhập ở form đăng nhập.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class LoginCredentials {
  /// Tạo thông tin đăng nhập.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  const LoginCredentials({required this.email, required this.password});

  final String email;
  final String password;

  /// Thân yêu cầu `POST /auth/login`.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Map<String, String> toJson() => {'email': email, 'password': password};
}
