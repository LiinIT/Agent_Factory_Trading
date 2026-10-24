/// Cấu hình theo môi trường, truyền lúc build bằng `--dart-define` (không viết cứng vào code).
/// Mặc định trỏ be/ chạy trên máy dev; staging / production luôn truyền `API_BASE_URL` riêng.
/// Máy ảo Android gọi máy dev qua `http://10.0.2.2:8080/api/v1`.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
abstract final class AppEnv {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080/api/v1',
  );
}
