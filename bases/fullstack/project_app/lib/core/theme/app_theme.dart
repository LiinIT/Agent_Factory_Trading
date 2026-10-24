import 'package:flutter/material.dart';

/// Màu gốc của thương hiệu — đổi một chỗ là đổi cả app.
const _seedColor = Color(0xFF2F5D50);

/// Theme Material 3 dùng chung; trên iOS Flutter tự áp hành vi Cupertino
/// (cuộn, chuyển trang, vuốt cạnh quay lại).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
abstract final class AppTheme {
  /// Theme sáng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  static ThemeData light() => _build(Brightness.light);

  /// Theme tối.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  static ThemeData dark() => _build(Brightness.dark);

  /// Dựng theme theo độ sáng.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  static ThemeData _build(Brightness brightness) => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: _seedColor,
      brightness: brightness,
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
      },
    ),
  );
}
