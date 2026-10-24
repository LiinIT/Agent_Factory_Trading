import 'package:flutter/material.dart';

import 'package:app/core/constants/app_strings.dart';
import 'package:app/core/constants/app_sizes.dart';
import 'package:app/features/auth/domain/entities/login_credentials.dart';

/// Form đăng nhập: kiểm tra ô nhập, gọi [onSubmit] và hiện lỗi nó trả về.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class LoginForm extends StatefulWidget {
  /// Nhận hàm gửi đăng nhập (trả thông báo lỗi, null nếu thành công).
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  const LoginForm({required this.onSubmit, super.key});

  final Future<String?> Function(LoginCredentials credentials) onSubmit;

  /// Tạo state của form.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  State<LoginForm> createState() => _LoginFormState();
}

/// State form đăng nhập: ô nhập, trạng thái đang gửi, lỗi từ be/.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-20
class _LoginFormState extends State<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isSubmitting = false;
  String? _errorMessage;

  /// Giải phóng controller ô nhập.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  /// Kiểm tra form rồi gửi; bỏ qua khi đang gửi để không gửi hai lần.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  Future<void> _submit() async {
    if (_isSubmitting || !(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    final errorMessage = await widget.onSubmit(
      LoginCredentials(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      ),
    );
    if (!mounted) return;
    setState(() {
      _isSubmitting = false;
      _errorMessage = errorMessage;
    });
  }

  /// Dựng ô email, mật khẩu, lỗi và nút đăng nhập.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-20
  @override
  Widget build(BuildContext context) {
    final errorMessage = _errorMessage;
    return Form(
      key: _formKey,
      child: AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: AppStrings.emailLabel,
              ),
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              textInputAction: TextInputAction.next,
              validator: (value) =>
                  (value ?? '').contains('@') ? null : AppStrings.emailInvalid,
            ),
            const SizedBox(height: AppSizes.spaceMd),
            TextFormField(
              controller: _passwordController,
              decoration: const InputDecoration(
                labelText: AppStrings.passwordLabel,
              ),
              obscureText: true,
              autofillHints: const [AutofillHints.password],
              onFieldSubmitted: (_) => _submit(),
              validator: (value) =>
                  (value ?? '').isEmpty ? AppStrings.passwordRequired : null,
            ),
            if (errorMessage != null) ...[
              const SizedBox(height: AppSizes.spaceMd),
              Text(
                errorMessage,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
            const SizedBox(height: AppSizes.spaceLg),
            FilledButton(
              onPressed: _submit,
              child: _isSubmitting
                  ? const SizedBox.square(
                      dimension: AppSizes.iconSm,
                      child: CircularProgressIndicator.adaptive(),
                    )
                  : const Text(AppStrings.loginSubmit),
            ),
          ],
        ),
      ),
    );
  }
}
