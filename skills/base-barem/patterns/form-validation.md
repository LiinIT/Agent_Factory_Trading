# Pattern: Form + kiểm tra hợp lệ

Luật kiểm tra là **hàm thuần** trong `utils/validators.dart` (test được không cần widget); View dùng `Form` + `TextFormField(validator:)`; gửi qua provider.

```dart
const kMinPasswordLength = 8;
final _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

/// Kiểm tra email; trả thông báo lỗi hoặc null nếu hợp lệ.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: <YYYY-MM-DD>
String? validateEmail(String? value) {
  final text = value?.trim() ?? '';
  if (text.isEmpty) return AppStrings.emailRequired;
  if (!_emailPattern.hasMatch(text)) return AppStrings.emailInvalid;
  return null;
}

/// Kiểm tra mật khẩu tối thiểu [kMinPasswordLength] ký tự.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: <YYYY-MM-DD>
String? validatePassword(String? value) =>
    (value ?? '').length < kMinPasswordLength ? AppStrings.passwordTooShort : null;
```

Gửi form: `if (!formKey.currentState!.validate()) return;` → `ref.read(xProvider.notifier).submit(...)`; nút gửi khoá khi state `isLoading`; lỗi server hiện SnackBar.
Bàn phím: `textInputAction: TextInputAction.next`, `autofillHints`, cuộn được khi bàn phím che (iPhone SE).
Test: unit test từng validator; widget test bấm gửi khi trống → hiện lỗi.
