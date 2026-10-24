# Barem xuất xưởng

Phải ĐẠT 100% (hoặc KHÔNG ÁP DỤNG có lý do) mới được nghiệm thu. Chi tiết từng mục: skill `app-qa-checklist`, `app-qa-advanced`, `store-review`.
Cột **Kết quả**: `ĐẠT` · `KHÔNG ĐẠT` · `N/A — lý do` · `CHỜ THỦ TRƯỞNG`. Cột **Bằng chứng**: lệnh + kết quả, tên test, hoặc `file:dòng`.

## 1. Giao diện (app-qa-checklist phần 1)

| Mục | Nội dung | Kiểm | Kết quả | Bằng chứng |
|---|---|---|---|---|
| G1 | Nhất quán thiết kế với GUI demo | AI + Thủ trưởng | | |
| G2 | Thích ứng mọi cỡ màn hình (9 thiết bị) | Máy | | |
| G3 | Xoay dọc / ngang không vỡ | Máy | | |
| G4 | Dữ liệu dài không tràn khung | Máy | | |
| G5 | Trạng thái phần tử (pressed, disabled, loading…) | Máy + AI | | |
| G6 | Mọi nút có hành động, chạm không lỗi (`auditTappables`) | Máy | | |
| G7 | Trạng thái rỗng có hướng dẫn | Máy | | |
| G8 | Chuyển động mượt | AI + Thủ trưởng | | |
| G9 | Bàn phím không che ô nhập / nút | Máy | | |

## 2. Logic nghiệp vụ (app-qa-checklist phần 2)

| Mục | Nội dung | Kiểm | Kết quả | Bằng chứng |
|---|---|---|---|---|
| L1 | Validate định dạng | Máy | | |
| L2 | Tự trim khoảng trắng | Máy | | |
| L3 | Giới hạn ký tự | Máy | | |
| L4 | Emoji / tiếng Việt / chuỗi kiểu SQL an toàn | Máy + AI | | |
| L5 | Luồng chính E2E (`integration_test` trên iOS Simulator) | Máy | | |
| L6 | Sai mật khẩu liên tiếp | Máy + AI | | |
| L7 | Bấm liên tục không tạo trùng | Máy | | |
| L8 | Chặn màn cần đăng nhập | Máy | | |
| L9 | Nút Back / vuốt quay lại an toàn | Máy + AI | | |
| L10 | Mất mạng báo lỗi thân thiện | Máy | | |
| L11 | Kéo làm mới / Thử lại | Máy | | |
| L12 | Lưu cục bộ an toàn, giữ sau khi mở lại | Máy + AI | | |

## 3. Nâng cao (app-qa-advanced)

| Mục | Nội dung | Kiểm | Kết quả | Bằng chứng |
|---|---|---|---|---|
| H1 | Không rò rỉ bộ nhớ | Máy + Thủ trưởng | | |
| H2 | CPU / pin hợp lý | AI + Thủ trưởng | | |
| H3 | 60/120 fps, cuộn mượt | Máy + AI | | |
| T1 | Stress test backend | Thủ trưởng + AI | | |
| T2 | Chạy dài hạn không OOM | Thủ trưởng | | |
| B1 | Root / jailbreak | AI | | |
| B2 | Giả lập | AI | | |
| B3 | Obfuscate bản release | Máy | | |
| B4 | Token / mật khẩu lưu mã hoá | Máy + AI | | |
| B5 | SSL pinning | AI + Thủ trưởng | | |
| B6 | Refresh token êm | Máy | | |
| R1 | Cuộc gọi / thông báo xen ngang | AI + Thủ trưởng | | |
| R2 | Nền ↔ tiền cảnh | Máy | | |
| R3 | Đổi ngôn ngữ / cỡ chữ / sáng-tối khi đang mở | Máy | | |
| R4 | Mạng chậm không double-click | Máy | | |
| R5 | Mất mạng giữa lúc gửi | Máy | | |
| C1 | Unit + widget test | Máy | | |
| C2 | Integration / E2E | Máy | | |
| C3 | Crash monitoring | AI + Thủ trưởng | | |

## 4. Cửa hàng (store-review — `dart run tool/store_check.dart`)

| Mục | Nội dung | Kiểm | Kết quả | Bằng chứng |
|---|---|---|---|---|
| S1 | Ổn định, mọi nút có hành động | Máy | | |
| S2 | Không nội dung mẫu | Máy | | |
| S3 | Chính sách quyền riêng tư | AI + Thủ trưởng | | |
| S4 | Quyền tối thiểu, xin đúng lúc | AI | | |
| S5 | Xoá tài khoản trong app (nếu có tài khoản) | AI | | |
| S6 | Tài khoản demo cho người duyệt | Thủ trưởng | | |
| S7 | Không lộ khoá, chỉ HTTPS | Máy | | |
| A1 | PrivacyInfo.xcprivacy | Máy + AI | | |
| A2 | Câu giải thích quyền Info.plist | Máy | | |
| A3 | Sign in with Apple (nếu đăng nhập bên thứ ba) | AI | | |
| A4 | In-App Purchase + Khôi phục (nếu bán nội dung số) | AI | | |
| A5 | Bundle ID, version, icon, launch screen | Máy | | |
| A6 | Build iOS release | Máy | | |
| A7 | IPv6 / iPad | AI | | |
| A8 | Không nhắc nền tảng khác | AI | | |
| P1 | targetSdk ≥ mức Play yêu cầu | Máy | | |
| P2 | AAB release | Máy | | |
| P3 | Trang bộ nhớ 16 KB | AI | | |
| P4 | Data safety | Thủ trưởng | | |
| P5 | Quyền nhạy cảm có lý do | Máy + AI | | |
| P6 | applicationId, versionCode, ký release | Máy + Thủ trưởng | | |
| P7 | Content rating | Thủ trưởng | | |

## 5. Điều lệnh

| Mục | Nội dung | Kiểm | Kết quả | Bằng chứng |
|---|---|---|---|---|
| DL1 | Không `print`, dùng logger | Máy | | |
| DL2 | Không emoji làm icon — dùng thư viện icon | Máy | | |
| DL3 | Header 4 dòng cho mọi class / function | AI | | |
| DL4 | `flutter analyze` sạch, `dart format` sạch | Máy | | |

## Việc cần Thủ trưởng làm trước khi nộp

<!-- Hội đồng Nghiệm thu liệt kê mọi mục CHỜ THỦ TRƯỞNG tại đây. -->
