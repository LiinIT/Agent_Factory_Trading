# Pattern: Thử lại có giãn cách (exponential backoff)

Chỉ thử lại lỗi **tạm thời** (timeout, 5xx, mất mạng); lỗi 4xx/validate trả về ngay.

```dart
const kMaxAttempts = 3;
const kBaseDelay = Duration(milliseconds: 400);

/// Chạy [action], lỗi tạm thời thì thử lại tối đa [kMaxAttempts] lần, giãn cách gấp đôi.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: <YYYY-MM-DD>
Future<T> withRetry<T>(Future<T> Function() action, {required bool Function(Object error) isTransient}) async {
  for (var attempt = 1; ; attempt++) {
    try {
      return await action();
    } catch (error) {
      if (!isTransient(error) || attempt >= kMaxAttempts) rethrow;
      final delay = kBaseDelay * (1 << (attempt - 1));
      appLogger.w('[withRetry] lần $attempt lỗi, thử lại sau ${delay.inMilliseconds}ms', error: error);
      await Future<void>.delayed(delay);
    }
  }
}
```

Dùng trong service: `withRetry(() => _client.get(url), isTransient: (e) => e is TimeoutException || e is SocketException)`.
Test: lỗi tạm thời 2 lần rồi thành công → trả kết quả; lỗi 4xx → ném ngay, gọi đúng 1 lần.
