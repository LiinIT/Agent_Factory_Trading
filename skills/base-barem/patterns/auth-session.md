# Pattern: Phiên đăng nhập

Token lưu trong **kho bảo mật** (`flutter_secure_storage`; Web: cookie httpOnly do server cấp) — không lưu SharedPreferences. Hết hạn → làm mới một lần; thất bại → đăng xuất sạch.

```dart
/// Trạng thái phiên: null = chưa đăng nhập.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: <YYYY-MM-DD>
@Riverpod(keepAlive: true)
class Session extends _$Session {
  /// Khôi phục phiên đã lưu khi mở app.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: <YYYY-MM-DD>
  @override
  Future<AuthUser?> build() => ref.read(authServiceProvider).restore();

  /// Đăng nhập; lỗi giữ trong state để View hiện thông báo.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: <YYYY-MM-DD>
  Future<void> signIn(String email, String password) async {
    appLogger.i('[Session] signIn');
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref.read(authServiceProvider).signIn(email, password));
  }

  /// Đăng xuất: xoá token, xoá cache người dùng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: <YYYY-MM-DD>
  Future<void> signOut() async {
    appLogger.i('[Session] signOut');
    await ref.read(authServiceProvider).signOut();
    state = const AsyncData(null);
  }
}
```

Điều hướng: màn hình gốc `ref.watch(sessionProvider).when(...)` → loading / đăng nhập / app chính. Lỗi 401 từ service → gọi `refreshToken` một lần; vẫn 401 → `signOut()`.
Bảo mật: không log token/mật khẩu; giới hạn số lần thử; Android bật `android:allowBackup="false"` nếu lưu dữ liệu nhạy cảm.
