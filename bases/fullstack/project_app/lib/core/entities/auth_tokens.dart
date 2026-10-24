/// Cặp token phiên đăng nhập: access token ngắn hạn + refresh token dùng một lần.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class AuthTokens {
  /// Tạo cặp token.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  const AuthTokens({required this.accessToken, required this.refreshToken});

  /// Đọc cặp token từ JSON của API (`AuthTokensEntity`).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  factory AuthTokens.fromJson(Map<String, dynamic> json) => AuthTokens(
    accessToken: json['accessToken'] as String,
    refreshToken: json['refreshToken'] as String,
  );

  final String accessToken;
  final String refreshToken;
}
