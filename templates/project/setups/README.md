# setups — hồ sơ lên store

Mọi thứ cần để đưa app lên **App Store** và **Google Play**: nội dung, hình ảnh, ghi chú và danh sách việc phải làm trên store. Ban Ngoại giao soạn sau khi nghiệm thu ĐẠT (skill `store-review`); Chỉ huy trưởng dùng thư mục này khi nộp app.

| Mục | Nội dung |
|---|---|
| [`store-tasks.md`](store-tasks.md) | **Việc phải làm trên store** — App Store Connect và Play Console, theo thứ tự, đánh dấu ai làm |
| [`listing/`](listing/) | Tên app (mặc định tiếng Anh — điều lệnh §0), mô tả ngắn/dài, từ khoá, nội dung bản cập nhật — mỗi ngôn ngữ một file |
| [`screenshots/`](screenshots/) | Ảnh chụp màn hình theo từng cỡ máy + danh sách màn hình cần chụp |
| [`icon/`](icon/) | Icon gốc 1024×1024 + brief thiết kế |
| [`privacy/`](privacy/) | Nháp App Privacy (Apple), Data safety (Google), chính sách quyền riêng tư |
| [`review-notes.md`](review-notes.md) | Ghi chú cho người duyệt app |
| [`notes.md`](notes.md) | Ghi chú tự do: quyết định, link, việc còn treo |

**Không để bí mật ở đây**: mật khẩu tài khoản demo, khoá ký app (keystore, `.p12`), API key — điền thẳng trên App Store Connect / Play Console hoặc lưu trong trình quản lý mật khẩu. Thư mục này được commit cùng source.
