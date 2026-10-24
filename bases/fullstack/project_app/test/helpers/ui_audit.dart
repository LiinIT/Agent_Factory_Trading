import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Thời gian chờ sau mỗi lần chạm (không dùng pumpAndSettle vì spinner chạy mãi).
const _settleStep = Duration(milliseconds: 100);
const _settleSteps = 6;
const _maxPops = 5;

/// Có phải phần tử bấm được "cấp cao" (nút, IconButton, FAB, ListTile có onTap).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
bool _isControl(Widget widget) =>
    widget is ButtonStyleButton ||
    widget is IconButton ||
    widget is FloatingActionButton ||
    (widget is ListTile && widget.onTap != null);

/// Phần tử có nằm bên trong một control khác không (InkWell nội bộ của nút,
/// `_IconButtonM3` bên trong `IconButton`…) — để mỗi nút chỉ đếm một lần.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
bool _isInsideControl(Element element) {
  var isInside = false;
  element.visitAncestorElements((ancestor) {
    isInside = _isControl(ancestor.widget);
    return !isInside;
  });
  return isInside;
}

/// Phần tử bấm được cấp ngoài cùng: control, hoặc InkWell có onTap đứng riêng.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
bool _isOutermostTappable(Element element) {
  final widget = element.widget;
  final isTappable =
      _isControl(widget) || (widget is InkWell && widget.onTap != null);
  return isTappable && !_isInsideControl(element);
}

/// Tìm mọi phần tử bấm được đang hiển thị: nút Material, IconButton, FAB,
/// ListTile / InkWell có onTap (mỗi nút chỉ đếm một lần).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
Finder findTappables() =>
    find.byElementPredicate(_isOutermostTappable).hitTestable();

/// Phần tử có hành động không (nút Material bị `onPressed: null` = nút chết).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
bool _hasAction(Widget widget) => switch (widget) {
  ButtonStyleButton() => widget.onPressed != null || widget.onLongPress != null,
  IconButton() => widget.onPressed != null,
  FloatingActionButton() => widget.onPressed != null,
  _ => true,
};

/// Bơm vài nhịp để hoạt ảnh / điều hướng chạy xong.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
Future<void> _settle(WidgetTester tester) async {
  for (var step = 0; step < _settleSteps; step++) {
    await tester.pump(_settleStep);
  }
}

/// Đóng mọi màn / popup đã mở do lần chạm để quay lại màn đang kiểm.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
Future<void> _returnToScreen(WidgetTester tester) async {
  for (var pops = 0; pops < _maxPops; pops++) {
    final navigators = find.byType(Navigator);
    if (navigators.evaluate().isEmpty) return;
    final navigator = tester.state<NavigatorState>(navigators.last);
    if (!navigator.canPop()) return;
    navigator.pop();
    await _settle(tester);
  }
}

/// Kết quả kiểm "chạm hết": số phần tử đã chạm và danh sách vấn đề (rỗng = ĐẠT).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
class TapAuditReport {
  /// Tạo kết quả kiểm.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-17
  const TapAuditReport({required this.tapped, required this.problems});

  final int tapped;
  final List<String> problems;
}

/// Kiểm "chạm hết" một màn hình (checklist G6): mọi phần tử bấm được phải có hành
/// động (trừ [allowDisabled] — key của nút cố ý khoá), chạm vào không exception,
/// không vỡ bố cục. Sau mỗi lần chạm tự quay lại màn hình.
/// Dùng: `expect((await auditTappables(tester)).problems, isEmpty);`
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
Future<TapAuditReport> auditTappables(
  WidgetTester tester, {
  Set<Key> allowDisabled = const {},
}) async {
  final problems = <String>[];
  var tapped = 0;
  final total = findTappables().evaluate().length;
  for (var index = 0; index < total; index++) {
    final current = findTappables();
    if (index >= current.evaluate().length) break;
    final target = current.at(index);
    final widget = tester.widget(target);
    if (!_hasAction(widget)) {
      if (!allowDisabled.contains(widget.key)) {
        problems.add(
          'Nút chết #$index: ${widget.runtimeType} key=${widget.key}',
        );
      }
      continue;
    }
    await tester.tap(target, warnIfMissed: false);
    await _settle(tester);
    tapped++;
    final error = tester.takeException();
    if (error != null) {
      problems.add('Lỗi khi chạm #$index (${widget.runtimeType}): $error');
    }
    await _returnToScreen(tester);
  }
  return TapAuditReport(tapped: tapped, problems: problems);
}

/// Giả lập bàn phím ảo cao [height] (checklist G9) — tự hoàn tác sau test.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
void showVirtualKeyboard(WidgetTester tester, {double height = 300}) {
  tester.view.viewInsets = FakeViewPadding(bottom: height);
  addTearDown(tester.view.resetViewInsets);
}
