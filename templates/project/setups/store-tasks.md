# Việc phải làm trên store

Nhãn: **[THỦ TRƯỞNG]** cần tài khoản developer / quyết định của Chỉ huy trưởng · **[AGENT]** agent soạn sẵn trong `setups/` · **[MÁY]** máy kiểm (`dart run tool/store_check.dart`).
Đánh dấu `[x]` khi xong. Agent chỉ đánh dấu mục [AGENT]/[MÁY] đã có bằng chứng.

## Chuẩn bị chung

- [ ] [THỦ TRƯỞNG] Chốt tên app (mặc định tiếng Anh), bundle ID / applicationId thật (không `com.example`)
- [ ] [THỦ TRƯỞNG] URL chính sách quyền riêng tư công khai (nháp: `privacy/privacy-policy.md`)
- [ ] [THỦ TRƯỞNG] URL hỗ trợ / email liên hệ
- [ ] [AGENT] Nội dung listing đủ ngôn ngữ trong `listing/`
- [ ] [AGENT] Danh sách ảnh chụp cần có trong `screenshots/README.md`; [THỦ TRƯỞNG] chụp / duyệt ảnh
- [ ] [AGENT] Brief icon trong `icon/brief.md`; icon 1024×1024 không nền trong suốt
- [ ] [MÁY] `store_check` ĐẠT, `brain/checklist.md` phần Store ĐẠT 100%

## App Store Connect (iOS)

- [ ] [THỦ TRƯỞNG] Đăng ký Bundle ID trên Apple Developer, tạo app trên App Store Connect
- [ ] [THỦ TRƯỞNG] Chọn team ký (Signing & Capabilities trong Xcode) — repo không chứa team ID
- [ ] [THỦ TRƯỞNG] Build và upload: `flutter build ipa --release` → Transporter / Xcode Organizer
- [ ] [THỦ TRƯỞNG] Thử qua TestFlight trên máy thật
- [ ] [THỦ TRƯỞNG] Điền App Privacy theo nháp `privacy/app-privacy.md`
- [ ] [THỦ TRƯỞNG] Xếp hạng độ tuổi, danh mục, giá / quốc gia
- [ ] [THỦ TRƯỞNG] Tải ảnh chụp (6.9", 6.5"; iPad nếu bật), điền mô tả, từ khoá, URL hỗ trợ
- [ ] [THỦ TRƯỞNG] Ghi chú cho người duyệt + tài khoản demo (theo `review-notes.md`, mật khẩu điền thẳng trên Connect)
- [ ] [THỦ TRƯỞNG] Gửi duyệt

## Google Play Console (Android)

- [ ] [THỦ TRƯỞNG] Tạo app trên Play Console
- [ ] [THỦ TRƯỞNG] Tạo upload key, cấu hình ký release (`key.properties` không commit) — bật Play App Signing
- [ ] [THỦ TRƯỞNG] Build và upload: `flutter build appbundle --release` → kênh Internal testing
- [ ] [THỦ TRƯỞNG] Tài khoản cá nhân mới: chạy closed testing đủ số người thử / số ngày theo yêu cầu hiện hành của Play trước khi lên Production
- [ ] [THỦ TRƯỞNG] Điền Data safety theo nháp `privacy/data-safety.md`
- [ ] [THỦ TRƯỞNG] Content rating, đối tượng mục tiêu, quảng cáo có/không, quyền truy cập app (tài khoản demo)
- [ ] [THỦ TRƯỞNG] Store listing: tên, mô tả ngắn/dài, icon 512×512, ảnh nổi bật 1024×500, ảnh chụp điện thoại / máy tính bảng
- [ ] [THỦ TRƯỞNG] Gửi duyệt lên Production

## Sau khi duyệt

- [ ] [THỦ TRƯỞNG] Ghi số phiên bản đã lên store vào `notes.md`
- [ ] [AGENT] Lý do bị từ chối (nếu có) → ghi vào `notes.md` và `brain/lessons.md`
