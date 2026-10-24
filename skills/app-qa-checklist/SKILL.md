---
name: app-qa-checklist
description: Checklist kiểm thử bắt buộc của Thủ trưởng cho mọi app — giao diện (bố cục, thích ứng, xoay màn hình, dữ liệu dài, trạng thái phần tử, rỗng, chuyển động, bàn phím) và logic (validate đầu vào, luồng chính/ngoại lệ, quyền truy cập, nút Back, mất mạng, tải lại, lưu cục bộ). Dùng khi lập phương án, viết code, kiểm soát và nghiệm thu; mọi mục phải ĐẠT mới được bàn giao.
---

# Checklist kiểm thử app (Thủ trưởng ban hành)

Mỗi mục có nhãn người kiểm: **[MÁY]** test tự động chạy được · **[AI]** ban AI soát code/GUI demo · **[THỦ TRƯỞNG]** cần người thử tay.
Ban Kiểm soát và Hội đồng Nghiệm thu đánh dấu từng mục `ĐẠT / KHÔNG ĐẠT / KHÔNG ÁP DỤNG (lý do)` vào `brain/checklist.md` kèm bằng chứng. **Một mục KHÔNG ĐẠT ⇒ không bàn giao.**

## PHẦN 1 — KIỂM THỬ GIAO DIỆN (GUI)

### 1. Bố cục & trực quan

| # | Mục | Người kiểm | Cách kiểm trong Flutter |
|---|---|---|---|
| G1 | **Nhất quán thiết kế**: màu, font, cỡ chữ, padding/margin đúng GUI demo (hoặc Figma nếu có) | [AI] + [THỦ TRƯỞNG] | Mọi màu/khoảng cách lấy từ `constants/` (cấm số cứng); so ảnh chụp với GUI demo đã duyệt |
| G2 | **Thích ứng màn hình**: điện thoại nhỏ, tràn viền (tai thỏ/Dynamic Island), tablet | [MÁY] | `testWidgetsOnDevices` 9 thiết bị; `SafeArea`; `tester.takeException()` null |
| G3 | **Xoay màn hình**: dọc và ngang không tràn, không vỡ, không mất nút | [MÁY] | Test lại các màn hình với `Size(h, w)` (đảo chiều); nếu app khoá dọc thì ghi rõ trong PRD và `SystemChrome.setPreferredOrientations` |
| G4 | **Dữ liệu quá dài**: văn bản dài bị cắt `…`, xuống dòng hoặc cuộn — không tràn khung | [MÁY] | Test với chuỗi 200 ký tự + tên tiếng Việt dài; `maxLines` + `TextOverflow.ellipsis` cho tiêu đề |

### 2. Tương tác & trạng thái

| # | Mục | Người kiểm | Cách kiểm trong Flutter |
|---|---|---|---|
| G5 | **Trạng thái phần tử**: Normal · Hover (web) · Pressed · Disabled · Loading cho Button, Input, Checkbox | [MÁY] + [AI] | Nút gửi khoá + hiện loading khi đang xử lý; test nút disabled khi form chưa hợp lệ |
| G6 | **Mọi nút đều có hành động**: không nút chết, bấm không lỗi | [MÁY] | `auditTappables(tester)` trong base (chạm hết mọi phần tử bấm được trên từng màn hình) |
| G7 | **Trạng thái rỗng**: có hình minh hoạ + hướng dẫn hành động | [MÁY] | Widget test với danh sách rỗng → thấy icon + câu hướng dẫn + nút hành động (nếu có) |
| G8 | **Chuyển động mượt**: chuyển màn, popup, spinner không giật | [AI] + [THỦ TRƯỞNG] | Không làm việc nặng trên UI thread; danh sách dùng `ListView.builder`; ảnh có `cacheWidth`; chạy `--profile` khi nghi ngờ |
| G9 | **Bàn phím ảo**: không che ô nhập / nút quan trọng, tự cuộn | [MÁY] | Màn có form bọc `SingleChildScrollView`; test với `MediaQuery(viewInsets: EdgeInsets.only(bottom: 300))` trên iPhone SE → không overflow, nút gửi vẫn tìm thấy |

## PHẦN 2 — KIỂM THỬ LOGIC NGHIỆP VỤ

### 1. Xác thực đầu vào

| # | Mục | Người kiểm | Cách kiểm |
|---|---|---|---|
| L1 | **Định dạng**: email, số điện thoại VN, mật khẩu, CCCD (12 số)… | [MÁY] | Validator là hàm thuần trong `utils/validators.dart` + unit test đúng/sai |
| L2 | **Khoảng trắng**: tự `trim()` đầu/cuối (tên đăng nhập, mã giảm giá…) | [MÁY] | Unit test `'  abc  '` → `'abc'` trước khi gửi |
| L3 | **Giới hạn ký tự**: tối thiểu/tối đa (vd mật khẩu 8–50) | [MÁY] | `maxLength` trên field + validator; test biên 7/8/50/51 |
| L4 | **Ký tự đặc biệt**: emoji, tiếng Việt có dấu, chuỗi kiểu SQL injection xử lý an toàn | [MÁY] + [AI] | Test nhập `Nguyễn Văn Á 😀` và `' OR 1=1 --`; không ghép chuỗi SQL, dùng tham số hoá ở server |

### 2. Luồng nghiệp vụ & điều hướng

| # | Mục | Người kiểm | Cách kiểm |
|---|---|---|---|
| L5 | **Luồng chính (happy path)** từ đầu tới cuối đúng kịch bản (vd đăng ký → OTP → đăng nhập → màn chính) | [MÁY] | Integration test trên iOS Simulator (`integration_test/`) |
| L6 | **Ngoại lệ — sai mật khẩu liên tiếp**: cảnh báo / khoá tạm | [MÁY] + [AI] | Test provider: N lần sai → trạng thái khoá + thông báo |
| L7 | **Ngoại lệ — bấm liên tục** (thanh toán, gửi): không tạo bản ghi trùng | [MÁY] | Nút khoá khi `isLoading`; test bấm 2 lần nhanh → service được gọi đúng 1 lần |
| L8 | **Quyền truy cập**: chưa đăng nhập bị chặn ở màn cá nhân / giỏ hàng / cài đặt | [MÁY] | Test điều hướng khi `session == null` → về màn đăng nhập |
| L9 | **Nút Back hệ thống / vuốt quay lại** ở màn quan trọng (thanh toán, đang xử lý) không làm hỏng trạng thái | [MÁY] + [AI] | `PopScope(canPop: …)` ở màn đang xử lý; test `tester.binding.handlePopRoute()` |

### 3. Đồng bộ dữ liệu & mạng

| # | Mục | Người kiểm | Cách kiểm |
|---|---|---|---|
| L10 | **Mất kết nối**: báo lỗi thân thiện (SnackBar/Popup), không crash | [MÁY] | Service giả ném `SocketException` → thấy thông báo, không exception |
| L11 | **Tải lại**: kéo để làm mới / nút Thử lại khi có mạng lại | [MÁY] | Test `RefreshIndicator` + `AppErrorView.onRetry` gọi lại service |
| L12 | **Lưu cục bộ an toàn**: token trong secure storage, cài đặt giữ sau khi mở lại app | [MÁY] + [AI] | Token qua `flutter_secure_storage` (không SharedPreferences); test đọc lại sau khi dựng lại provider |

## Áp dụng theo ban

- **Ban Tác chiến**: PRD ghi rõ mục nào áp dụng / không áp dụng (vd app không có đăng nhập → L6, L8 không áp dụng) và luồng chính cho L5.
- **Ban Ngoại giao**: GUI demo thể hiện G5, G7 (trạng thái rỗng / lỗi / loading) cho mọi màn có dữ liệu.
- **Đại đội Xung kích**: viết test cho mọi mục [MÁY] thuộc lát cắt đang làm.
- **Ban Kiểm soát**: chạy test, điền checklist, mục nào thiếu test ⇒ KHÔNG ĐẠT.
- **Hội đồng Nghiệm thu**: soát lại 100% checklist + skill `store-review` trước khi trình Thủ trưởng.
