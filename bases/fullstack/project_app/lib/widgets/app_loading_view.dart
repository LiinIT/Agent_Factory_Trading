import 'package:flutter/material.dart';

/// Trạng thái đang tải dùng chung (vòng xoay thích ứng iOS/Android).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
class AppLoadingView extends StatelessWidget {
  /// Khởi tạo view đang tải.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  const AppLoadingView({super.key});

  /// Dựng vòng xoay ở giữa.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator.adaptive());
  }
}
