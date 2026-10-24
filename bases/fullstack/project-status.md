# Tiến độ project

Cập nhật mỗi khi xong một lát cắt. Đánh dấu `[x]` khi đã chạy được và có test.

## Khung (có sẵn từ base)

- [x] Server: health, đăng ký / đăng nhập / làm mới / đăng xuất, `/users/me`, `/admin/users`, migration đầu, seed admin
- [x] App: đăng nhập, khôi phục phiên, đăng xuất, màn mẫu đủ loading / empty / error, test 12 thiết bị
- [x] Web: trang công khai, đăng nhập / đăng ký, dashboard + hồ sơ thành viên, admin dashboard + danh sách thành viên
- [x] docker-compose: db → migrate → server → web

## Tính năng

- [ ] (thêm từ `brain/plan.md` / `docs/specs/`)

## Việc còn lại trước khi lên store / production

- [ ] Đổi Bundle ID / applicationId khỏi `vn.miastudio.app`
- [ ] Bộ bí mật staging / production (JWT, database), HTTPS (`project_server/deploy/nginx.conf`)
