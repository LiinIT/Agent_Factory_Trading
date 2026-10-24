/// Khoảng cách, bo góc, mốc bố cục dùng chung (không dùng magic number).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-16
abstract final class AppSizes {
  static const spaceXs = 4.0;
  static const spaceSm = 8.0;
  static const spaceMd = 16.0;
  static const spaceLg = 24.0;
  static const radiusMd = 12.0;
  static const iconSm = 20.0;
  static const iconLg = 48.0;
  static const listItemHeight = 72.0;

  /// Từ chiều rộng này trở lên dùng bố cục rộng (tablet/web).
  static const wideLayoutBreakpoint = 720.0;

  /// Nội dung không giãn quá rộng trên desktop.
  static const maxContentWidth = 960.0;

  /// Form (đăng nhập, đăng ký…) không rộng quá cỡ này.
  static const maxFormWidth = 420.0;
}
