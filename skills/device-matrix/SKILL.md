---
name: device-matrix
description: Ma trận thiết bị bắt buộc — iPhone, Android, Web với các cỡ màn hình, điểm khác biệt phải soát và cách kiểm chứng bằng widget test. Dùng khi lập PRD, dựng GUI demo, viết UI, viết test, kiểm soát hoặc nghiệm thu.
---

# Ma trận thiết bị

| Nền tảng | Cỡ kiểm tra (logical px) | Điểm phải soát riêng |
|---|---|---|
| **iPhone** | 375×667 (SE) · 393×852 (chuẩn) · 430×932 (Pro Max) | Dynamic Island / tai thỏ, safe area trên-dưới, vuốt cạnh để quay lại, bàn phím che ô nhập, phong cách Cupertino |
| **Android** | 360×800 (phổ thông) · 412×915 (Pixel) · 480×1000 (máy lớn) | Nút Back hệ thống, thanh điều hướng, cỡ chữ hệ thống ×1.3, Material 3 |
| **Web** | 390 (mobile web) · 820 (tablet) · 1280 · 1440 (desktop) | Chuột/hover, bàn phím + Tab, nút Back trình duyệt, bố cục rộng không kéo giãn |

## Kiểm chứng bằng widget test

Base barem đã có sẵn `test/helpers/devices.dart`: dùng `testWidgetsOnDevices('Tên', (tester, device) async { ... })` — tự chạy đủ 9 thiết bị (`--dart-define=DEVICE_MATRIX=quick` → 3). Mẫu tự viết nếu không có base:

```dart
/// Chạy [body] ở một cỡ màn hình và nền tảng cụ thể.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: <YYYY-MM-DD>
Future<void> pumpOnDevice(
  WidgetTester tester,
  Widget app, {
  required Size size,
  required TargetPlatform platform,
  double textScale = 1,
}) async {
  tester.view.physicalSize = size * tester.view.devicePixelRatio;
  addTearDown(tester.view.resetPhysicalSize);
  debugDefaultTargetPlatformOverride = platform;
  addTearDown(() => debugDefaultTargetPlatformOverride = null);
  await tester.pumpWidget(MediaQuery(
    data: MediaQueryData(size: size, textScaler: TextScaler.linear(textScale)),
    child: app,
  ));
}
```

- iPhone → `TargetPlatform.iOS`, Android → `TargetPlatform.android`. Web chưa giả lập được bằng TargetPlatform: test ở cỡ Web + chạy `flutter build web` phải thành công.
- Mỗi màn hình chính: không overflow (`tester.takeException()` là null) ở **mọi** cỡ trong bảng; Android thêm 1 lần `textScale: 1.3`.
- Gom test thiết bị vào `test/devices/`.

## Giới hạn hiện tại của máy

- iOS Simulator: có (iPhone 17 / 17 Pro / Pro Max / Air / 17e).
- Android: có SDK nhưng **chưa có máy ảo (AVD)** → chỉ widget test theo cỡ Android; ghi "CHƯA KIỂM CHỨNG trên máy ảo".
- Web: `flutter build web` + widget test cỡ Web.
