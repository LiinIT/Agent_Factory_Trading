# Server — Dart Frog + PostgreSQL

API `/api/v1` cho app và web. **Mọi nghiệp vụ, phân quyền, tiền nằm ở đây** — app / web chỉ gọi API.

## Chạy (development)

```bash
cp .env.example .env              # DATABASE_URL, JWT_ACCESS_SECRET (≥ 32 ký tự)
dart pub get
dart run tool/migrate.dart        # áp db/migrations chưa chạy
dart run tool/seed.dart           # tạo admin (chỉ development)
dart_frog dev                     # http://localhost:8080/api/v1/health
```

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `routes/` | Handler mỏng theo đúng đường dẫn API: kiểm dữ liệu vào, gọi service, trả JSON. `routes/api/v1/admin/_middleware.dart` chặn mọi route admin (đăng nhập + ADMIN) |
| `lib/core/` | `config` (biến môi trường có kiểm) · `database` (pool PostgreSQL) · `errors` (`ApiError` = định dạng lỗi chung) · `middleware` (auth, lỗi, CORS, log) · `utils` (JWT, băm token / mật khẩu, logger) · `app_services.dart` (dựng datasource + service một lần) |
| `lib/features/<tính năng>/data/datasources/` | Chỉ SQL, trả model |
| `lib/features/<tính năng>/domain/services/` | Nghiệp vụ (vd `AuthService`: refresh token xoay vòng, dùng lại ⇒ thu hồi mọi phiên) |
| `lib/models/` | Model dùng chung (`User.toPublicJson` không bao giờ có `passwordHash`) |
| `db/migrations/` | `YYYYMMDD_NN_mo_ta.sql` — chỉ thêm file mới, không sửa file đã chạy |
| `tool/` | `migrate.dart`, `seed.dart` |
| `openapi.yaml` | Contract chung — sửa route ⇒ sửa file này (test kiểm hai bên khớp) |
| `deploy/` | Mẫu Nginx + HTTPS cho server thật |

## Định dạng lỗi

```json
{ "error": { "code": "BAD_REQUEST", "message": "Dữ liệu không hợp lệ", "details": ["email phải là email hợp lệ"] } }
```

Route / service chỉ cần `throw ApiError.xxx(...)`; middleware gốc trả đúng định dạng, lỗi không lường trước ⇒ 500 không lộ chi tiết.

## Thêm tính năng

1. Migration mới trong `db/migrations/` → `dart run tool/migrate.dart`.
2. `lib/features/<x>/data/datasources/<x>_datasource.dart` (SQL) → `domain/services/<x>_service.dart` (nghiệp vụ, kiểm quyền chủ sở hữu).
3. Thêm vào `lib/core/app_services.dart` và `provide` trong `routes/_middleware.dart`.
4. Route trong `routes/api/v1/...`; cập nhật `openapi.yaml`.
5. Test: service với datasource giả (`test/support/fakes.dart`), route với `RequestContext` giả (mocktail).

## Kiểm tra

```bash
dart format . && dart analyze && dart test
```
