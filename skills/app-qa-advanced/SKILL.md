---
name: app-qa-advanced
description: Barem kiểm thử nâng cao của Thủ trưởng cho app chất lượng cao — hiệu năng (rò rỉ bộ nhớ, CPU/pin, khung hình), tải & độ bền, bảo mật client (root/jailbreak, giả lập, obfuscate), an toàn dữ liệu (lưu mã hoá, SSL pinning, phiên đăng nhập), khả năng phục hồi (gián đoạn, nền/tiền cảnh, đổi cài đặt hệ thống, mạng chập chờn) và tự động hoá (test, E2E, crash monitoring). Dùng khi lập phương án, kiến trúc, viết code, kiểm soát và nghiệm thu.
---

# Barem kiểm thử nâng cao (Thủ trưởng ban hành)

Bổ sung cho `app-qa-checklist`. Nhãn: **[MÁY]** test/lệnh tự động · **[AI]** soát code/cấu hình · **[THỦ TRƯỞNG]** cần thiết bị thật / công cụ profiling / quyết định.
Mục nào **không áp dụng** phải ghi lý do trong `brain/checklist.md` (vd app không có backend → T1 không áp dụng). Ban Tác chiến quyết mục nào bắt buộc ngay trong PRD.

## PHẦN 1 — HIỆU NĂNG & TẢI

| # | Mục | Người kiểm | Cách làm trong Flutter |
|---|---|---|---|
| H1 | **Rò rỉ bộ nhớ**: RAM không tích tụ khi chuyển màn liên tục / thao tác dài | [MÁY] + [THỦ TRƯỞNG] | Huỷ đủ `StreamSubscription`, `Timer`, `AnimationController`, `TextEditingController` trong `dispose`; provider không cần sống mãi thì không `keepAlive`; integration test lặp vào/ra màn 50 lần; DevTools Memory khi nghi ngờ |
| H2 | **CPU & pin**: chạy nền và animation nặng (Rive/Lottie) không ngốn tài nguyên | [AI] + [THỦ TRƯỞNG] | Dừng animation khi màn không hiển thị (`TickerMode`, `VisibilityDetector`); không polling liên tục — dùng push / backoff; tác vụ nền theo chuẩn hệ điều hành |
| H3 | **Khung hình**: 60/120fps, không jank khi cuộn danh sách dài | [MÁY] + [AI] | `ListView.builder`/`SliverList` + phân trang (pattern `pagination`); ảnh `cacheWidth`; tính toán nặng đưa vào `compute`/isolate; `flutter run --profile` + `integration_test` `traceAction` khi cần số đo |
| T1 | **Stress test backend**: nhiều request đồng thời, UI phản hồi đúng (loading, lỗi, không treo) | [THỦ TRƯỞNG] + [AI] | Server: k6 / autocannon; app: debounce, huỷ request cũ, timeout rõ ràng |
| T2 | **Chạy dài hạn**: vài giờ không OOM, không chậm dần | [THỦ TRƯỞNG] | Chạy app trên máy thật/simulator vài giờ, theo dõi Memory; integration test lặp kịch bản |

## PHẦN 2 — BẢO MẬT NÂNG CAO

| # | Mục | Người kiểm | Cách làm |
|---|---|---|---|
| B1 | **Root / Jailbreak**: phát hiện và cảnh báo / chặn (khi PRD yêu cầu — app tài chính, thanh toán) | [AI] | Package phát hiện (vd `flutter_jailbreak_detection` hoặc tương đương còn bảo trì); không coi là lớp bảo mật duy nhất |
| B2 | **Giả lập**: nhận diện emulator nếu chính sách yêu cầu chặn | [AI] | Kiểm `device_info_plus` (`isPhysicalDevice`); chỉ bật ở bản release |
| B3 | **Làm rối mã**: build release có obfuscate | [MÁY] | `flutter build apk/appbundle/ipa --release --obfuscate --split-debug-info=build/symbols` (giữ symbols để giải mã crash) |
| B4 | **Lưu trữ mã hoá**: token, mật khẩu, session không lưu plaintext | [MÁY] + [AI] | `flutter_secure_storage` (Keychain / EncryptedSharedPreferences); máy quét cấm lưu token vào SharedPreferences |
| B5 | **SSL pinning**: chống MitM (Burp/Charles) cho API quan trọng | [AI] + [THỦ TRƯỞNG] | Pin public key (SPKI hash) qua `HttpClient.badCertificateCallback` / `SecurityContext` hoặc package pinning; có kế hoạch xoay vòng chứng chỉ; [THỦ TRƯỞNG] thử bằng Charles |
| B6 | **Phiên đăng nhập**: token hết hạn được refresh êm, không văng ra đột ngột | [MÁY] | Pattern `auth-session`: 401 → refresh một lần, giữ hàng đợi request; test refresh thành công / thất bại |

## PHẦN 3 — PHỤC HỒI & BIÊN

| # | Mục | Người kiểm | Cách làm |
|---|---|---|---|
| R1 | **Gián đoạn**: cuộc gọi đến, thông báo heads-up khi đang quay / phát âm thanh / thanh toán | [AI] + [THỦ TRƯỞNG] | Lắng `AppLifecycleState` (`inactive`/`paused`) → tạm dừng media, giữ trạng thái giao dịch; giao dịch xác nhận ở server (idempotent) |
| R2 | **Nền ↔ tiền cảnh**: quay lại sau lâu thì làm mới dữ liệu hoặc giữ đúng trạng thái | [MÁY] | `AppLifecycleListener(onResume: refresh)` khi dữ liệu cũ quá ngưỡng; test giả lập `handleAppLifecycleStateChanged` |
| R3 | **Đổi cài đặt hệ thống khi app đang mở**: ngôn ngữ, cỡ chữ, Dark/Light | [MÁY] | Test thiết bị có chữ ×1.3 (đã có trong ma trận); test đổi `platformBrightness` + `textScaleFactor` giữa chừng không exception |
| R4 | **Mạng chậm** (2G, trễ 3000 ms): không double-click, có loading | [MÁY] | Service giả trễ 3 s; nút khoá khi `isLoading`; bấm 2 lần → gọi 1 lần (trùng checklist L7) |
| R5 | **Mất mạng giữa lúc gửi**: tự thử lại hoặc xếp hàng offline | [MÁY] | Pattern `retry-backoff` + hàng đợi gửi lại khi có mạng; test mất mạng giữa submit → dữ liệu không mất, không gửi trùng |

## PHẦN 4 — TỰ ĐỘNG HOÁ & VẬN HÀNH

| # | Mục | Người kiểm | Cách làm |
|---|---|---|---|
| C1 | **Unit + widget test** cho logic cốt lõi và component | [MÁY] | Bắt buộc theo `flutter-mvc-riverpod`; máy chạy ở mọi lát cắt |
| C2 | **Integration / E2E** toàn luồng người dùng | [MÁY] | `integration_test/` (có sẵn trong base) chạy trên iOS Simulator; Maestro khi cần kịch bản phức tạp |
| C3 | **Crash monitoring** khi phát hành (Crashlytics / Sentry) | [AI] + [THỦ TRƯỞNG] | Bọc `runApp` bằng bắt lỗi toàn cục (`FlutterError.onError`, `PlatformDispatcher.onError`) gửi về dịch vụ đã chọn; Thủ trưởng cấp DSN / project |

## Giới hạn phải nói rõ

- Profiling bộ nhớ / pin / fps chính xác cần **thiết bị thật + DevTools**: máy chỉ chặn được các lỗi cấu trúc (quên dispose, danh sách không lazy) và số đo trên simulator — ghi "CHƯA KIỂM CHỨNG trên máy thật" cho tới khi Thủ trưởng chạy thử.
- B1/B2/B5 tăng độ khó tấn công nhưng **không chống được hoàn toàn** kẻ có quyền root; dữ liệu và giao dịch quan trọng luôn phải được xác thực ở server.
