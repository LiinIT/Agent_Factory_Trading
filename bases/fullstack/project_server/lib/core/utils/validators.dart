final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

/// Email đúng dạng cơ bản `a@b.c`.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
bool isEmail(Object? value) =>
    value is String && _emailPattern.hasMatch(value.trim());

/// Chuỗi có độ dài trong khoảng [min]..[max].
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-21
bool hasLength(Object? value, {int min = 0, required int max}) =>
    value is String && value.length >= min && value.length <= max;
