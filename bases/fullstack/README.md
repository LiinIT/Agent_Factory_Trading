# project

| | Thư mục | Mô tả |
|---|---|---|
| **App** | [`project_app`](project_app) | Ứng dụng iOS & Android — Flutter, Riverpod |
| **Server** | [`project_server`](project_server) | REST API `/api/v1` — Dart Frog, PostgreSQL |
| **Web** | [`project_web`](project_web) | Website công khai · khu thành viên · trang Admin — Next.js, TypeScript |

```
project_app ──┐
              ├──► project_server (/api/v1) ──► PostgreSQL
project_web ──┘
```

## Nguyên tắc

1. **App và Web không bao giờ nối database** — chỉ gọi `project_server`.
2. **Mọi nghiệp vụ và phân quyền nằm ở server.** Ẩn nút ở giao diện chỉ là trải nghiệm; server kiểm quyền ở từng API.
3. App và Web dùng **chung contract** `project_server/openapi.yaml`, chung **định dạng lỗi** `{ "error": { "code", "message", "details" } }`.
4. Thanh toán, số dư, duyệt rút tiền… **chỉ server xác nhận**.
5. Ba môi trường development / staging / production, mỗi nơi một bộ bí mật. **Không commit `.env`.**
6. API có phiên bản `/api/v1`; đổi phá vỡ tương thích ⇒ `/api/v2`, giữ v1 tới khi app cũ trên store hết dùng.
7. Đăng nhập: access token ngắn hạn + refresh token dùng một lần (xoay vòng; dùng lại token cũ ⇒ thu hồi mọi phiên).
8. Database đổi qua migration có phiên bản trong git (`project_server/db/migrations`).

## Bắt đầu nhanh

### Server

```bash
cd project_server
cp .env.example .env              # DATABASE_URL, JWT_ACCESS_SECRET
dart pub get
dart run tool/migrate.dart && dart run tool/seed.dart
dart_frog dev                     # http://localhost:8080/api/v1/health
```

### App

```bash
cd project_app
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:8080/api/v1     # máy ảo iOS
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8080/api/v1      # máy ảo Android
```

### Web

```bash
cd project_web
cp .env.example .env.local        # SERVER_URL=http://localhost:8080
npm install && npm run dev        # http://localhost:3001
```

Từ gốc repo chạy lệnh của từng phần không cần `cd`: `./dev app flutter test` · `./dev server dart test` · `./dev web npm test`.

## Chạy cả hệ thống bằng Docker

```bash
cp .env.example .env              # đổi POSTGRES_PASSWORD, JWT_ACCESS_SECRET (openssl rand -base64 48)
docker compose up --build -d --wait
```

`migrate` tự áp migration trước khi server khởi động. Cổng chỉ mở cho `127.0.0.1`; lên server thật đặt Nginx + HTTPS phía trước (mẫu `project_server/deploy/nginx.conf`).

## Đổi API

1. Sửa route trong `project_server/routes/api/v1/` **và** `project_server/openapi.yaml` (test kiểm hai bên khớp).
2. `./dev web npm run api:types` — sinh lại type cho web.
3. Sửa model Dart trong `project_app/lib/features/<tính năng>/data/models/`.

## Kiểm tra trước khi commit

| Phần | Lệnh |
|---|---|
| App | `./dev app dart format .` · `./dev app flutter analyze` · `./dev app flutter test` |
| Server | `./dev server dart format .` · `./dev server dart analyze` · `./dev server dart test` |
| Web | `./dev web npm run typecheck` · `./dev web npm test` · `./dev web npm run build` |

Tài liệu nghiệp vụ / đặc tả: [`docs/specs/`](docs/specs) · Tiến độ: [`project-status.md`](project-status.md) · Quy ước cho agent: [`AGENTS.md`](AGENTS.md).
