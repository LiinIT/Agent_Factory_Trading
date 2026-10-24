import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Một thiết bị trong ma trận kiểm tra (skill device-matrix).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
class TestDevice {
  /// Khai báo thiết bị: tên, cỡ logical px, nền tảng, tỉ lệ chữ.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-16
  const TestDevice(this.name, this.size, this.platform, {this.textScale = 1});

  final String name;
  final Size size;
  final TargetPlatform platform;
  final double textScale;
}

/// Ma trận đầy đủ: iPhone · Android (kèm chữ 1.3) · Web · xoay ngang (checklist G2, G3).
const fullDeviceMatrix = [
  TestDevice('iPhone SE', Size(375, 667), TargetPlatform.iOS),
  TestDevice('iPhone 15', Size(393, 852), TargetPlatform.iOS),
  TestDevice('iPhone Pro Max', Size(430, 932), TargetPlatform.iOS),
  TestDevice('Android phổ thông', Size(360, 800), TargetPlatform.android),
  TestDevice('Pixel', Size(412, 915), TargetPlatform.android),
  TestDevice(
    'Android lớn chữ 1.3',
    Size(480, 1000),
    TargetPlatform.android,
    textScale: 1.3,
  ),
  TestDevice('Web mobile', Size(390, 844), TargetPlatform.android),
  TestDevice('Web tablet', Size(820, 1180), TargetPlatform.android),
  TestDevice('Web desktop', Size(1440, 900), TargetPlatform.android),
  TestDevice('iPhone 15 xoay ngang', Size(852, 393), TargetPlatform.iOS),
  TestDevice('Pixel xoay ngang', Size(915, 412), TargetPlatform.android),
  TestDevice('Tablet xoay ngang', Size(1180, 820), TargetPlatform.android),
];

/// Ma trận rút gọn cho chế độ Tà môn: mỗi nền tảng 1 cỡ.
const quickDeviceMatrix = [
  TestDevice('iPhone 15', Size(393, 852), TargetPlatform.iOS),
  TestDevice('Pixel', Size(412, 915), TargetPlatform.android),
  TestDevice('Web desktop', Size(1440, 900), TargetPlatform.android),
];

/// Ma trận đang dùng: `--dart-define=DEVICE_MATRIX=quick` để chạy bản rút gọn.
const activeDeviceMatrix = String.fromEnvironment('DEVICE_MATRIX') == 'quick'
    ? quickDeviceMatrix
    : fullDeviceMatrix;

/// Chạy [body] thành một widget test riêng cho từng thiết bị trong [devices]:
/// đặt cỡ màn hình, nền tảng, tỉ lệ chữ rồi hoàn tác ngay trong thân test.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
void testWidgetsOnDevices(
  String description,
  Future<void> Function(WidgetTester tester, TestDevice device) body, {
  List<TestDevice> devices = activeDeviceMatrix,
}) {
  for (final device in devices) {
    testWidgets('$description · ${device.name}', (tester) async {
      tester.view.devicePixelRatio = 1;
      tester.view.physicalSize = device.size;
      tester.platformDispatcher.textScaleFactorTestValue = device.textScale;
      debugDefaultTargetPlatformOverride = device.platform;
      try {
        await body(tester, device);
      } finally {
        debugDefaultTargetPlatformOverride = null;
        tester.platformDispatcher.clearTextScaleFactorTestValue();
        tester.view.resetPhysicalSize();
        tester.view.resetDevicePixelRatio();
      }
    });
  }
}
