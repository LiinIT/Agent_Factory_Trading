# Quy ước làm việc trong repo

Repo gồm 3 phần: `project_app` (Flutter), `project_server` (Dart Frog + PostgreSQL), `project_web` (Next.js). Xem [`README.md`](README.md).

## Luật bất biến

- App / Web **không nối database**, không chứa nghiệp vụ / quyền / tiền — chỉ gọi server qua `/api/v1`.
- Contract chung: `project_server/openapi.yaml`. Đổi route ⇒ sửa file này cùng commit.
- Lỗi luôn theo `{ "error": { "code", "message", "details" } }` — server ném `ApiError`, app đọc `ApiException`, web đọc `ApiError`.
- Token: web giữ trong cookie httpOnly (proxy `/api/server/*`), app giữ trong Keychain / Keystore. Không bao giờ log token, không lưu token bằng SharedPreferences / localStorage.
- Không commit `.env`, khoá, chứng chỉ. Database đổi qua file mới trong `project_server/db/migrations/` — không sửa file đã chạy.

## Bố cục

**App** `project_app/lib/`
- `core/` — `constants` · `entities` · `errors` · `network` (`ApiClient`) · `router` · `services` (`TokenStorage`) · `theme` · `utils`
- `widgets/` — widget dùng ở ≥ 2 tính năng
- `features/<tính năng>/`
  - `data/datasources/` gọi `ApiClient`, trả model · `data/models/` `fromJson` + `toEntity()`
  - `domain/entities/` class thuần, không biết JSON / Flutter
  - `presentation/providers/` Riverpod controller · `presentation/screens/` · `presentation/widgets/`
- Không tạo interface repository trừu tượng khi chỉ có một cài đặt.

**Server** `project_server/`
- `routes/api/v1/...` — handler mỏng: kiểm dữ liệu vào, gọi service, trả JSON; `_middleware.dart` chặn quyền theo nhánh (`admin/` = ADMIN)
- `lib/core/` — `config` · `database` · `errors` · `middleware` · `utils` · `app_services.dart`
- `lib/features/<tính năng>/data/datasources/` (SQL) · `domain/services/` (nghiệp vụ) · `lib/models/`
- `db/migrations/YYYYMMDD_NN_mo_ta.sql` · `tool/migrate.dart` · `tool/seed.dart` · `deploy/`

**Web** `project_web/src/`
- `app/(public)` · `app/(member)` · `app/admin` · `app/api/session/*` · `app/api/server/*` (proxy)
- `features/<tính năng>/` · `services/` · `components/` · `hooks/` · `lib/` · `types/api.d.ts` (sinh từ openapi.yaml, không sửa tay)

## Lệnh (chạy từ gốc, không `cd`)

`./dev <app|server|web> <flutter|dart|dart_frog|npm|npx> ...` — vd `./dev app flutter test`, `./dev server dart test`, `./dev web npm run typecheck`.

## Code

- Header 4 dòng (mô tả · Author · Company · Time) cho mọi class / function, kể cả private.
- Không `print` — dùng logger có ngữ cảnh `[Tên] hành động id=...`.
- Không magic number / string, không nested ternary, không `!` bừa bãi, function > 50 dòng thì tách.
- Mọi màn hình có dữ liệu xử lý đủ loading / empty / error.
