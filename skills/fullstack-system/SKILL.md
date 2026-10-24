---
name: fullstack-system
description: Cấu trúc hệ thống bắt buộc cho mọi app (bố cục Now_me) — <tên>_app (Flutter) + <tên>_server (Dart Frog + PostgreSQL) + <tên>_web (Next.js) dùng chung một server /api/v1. Luật phân lớp, contract openapi.yaml, định dạng lỗi, đăng nhập, migration, cách làm một tính năng xuyên suốt server → app → web, và lệnh chạy từng phần. Dùng khi thiết kế, viết code, kiểm soát hoặc nghiệm thu bất kỳ phần nào.
---

# Hệ thống App · Server · Web

```
<project>/
├── <tên>_app/      Flutter — iOS + Android, KHÔNG nối database
├── <tên>_server/   Dart Frog + PostgreSQL — mọi nghiệp vụ + phân quyền, /api/v1, openapi.yaml
├── <tên>_web/      Next.js + TypeScript — public / member / admin, KHÔNG nối database
├── docs/specs/     đặc tả từng tính năng
├── dev             ./dev <app|server|web> <flutter|dart|dart_frog|npm|npx> ...
└── docker-compose.yml · .env.example · README.md · AGENTS.md · project-status.md
```

`<tên>` = id project, `-` đổi thành `_` (vd `quan_ly_kho_app`). Project cũ có thể còn `app/` · `web/` · `be/` (NestJS) — vẫn chạy bằng `./dev app|web|be ...`.

## Luật bất biến

1. **App và web chỉ gọi server** qua `/api/v1`. Không SDK database, không truy vấn trực tiếp, không "tạm" gọi dịch vụ ngoài thay server.
2. **Nghiệp vụ và phân quyền nằm ở server.** Ẩn nút ở giao diện chỉ là trải nghiệm; server luôn kiểm quyền: `_middleware.dart` theo nhánh (`routes/api/v1/admin/` = ADMIN) + kiểm chủ sở hữu bản ghi trong service.
3. **Chung một contract**: `<tên>_server/openapi.yaml` là nguồn. Thêm / sửa route ⇒ sửa file này cùng commit (`test/routes/openapi_contract_test.dart` kiểm hai bên khớp); web sinh type bằng `./dev web npm run api:types`; app viết model Dart khớp đúng tên trường.
4. **Chung định dạng lỗi**: `{ "error": { "code", "message", "details" } }`. Server chỉ `throw ApiError.xxx(...)` (middleware gốc trả đúng định dạng; lỗi không lường trước ⇒ 500 không lộ chi tiết); app đọc bằng `ApiException`, web đọc bằng `ApiError`. Không tự chế định dạng khác.
5. **Tiền, số dư, thanh toán, duyệt rút tiền: chỉ server xác nhận** (webhook / đối soát phía server, transaction DB). Client không bao giờ gửi "số tiền đã trả" hay "trạng thái đã thanh toán" để server tin theo.
6. **Đăng nhập**: access token JWT ngắn hạn + refresh token dùng một lần (xoay vòng, lưu SHA-256; dùng lại token cũ ⇒ thu hồi mọi phiên). Web giữ token trong cookie httpOnly (proxy `/api/server/*`); app giữ trong Keychain / Keystore (`TokenStorage`). Không bao giờ log token; **không** lưu token bằng SharedPreferences / localStorage.
7. **Môi trường**: development / staging / production, mỗi nơi một bộ bí mật; chỉ commit `*.env.example`. URL server của app truyền bằng `--dart-define=API_BASE_URL=...`, của web bằng `SERVER_URL`.
8. **Database đổi qua migration**: file mới `<tên>_server/db/migrations/YYYYMMDD_NN_mo_ta.sql`, chạy `./dev server dart run tool/migrate.dart`. Không sửa migration đã chạy / đã commit.
9. API đổi phá vỡ tương thích ⇒ thêm `/api/v2`, giữ v1 tới khi app cũ trên store hết dùng.

## Bố cục từng phần

**Server** `<tên>_server/`
- `routes/api/v1/<đường dẫn>.dart` — handler mỏng: `requireMethod`, kiểm dữ liệu vào (`readJsonObject` + `ApiError.badRequest([...])`), gọi service / datasource qua `context.read<T>()`, trả `Response.json`.
- `lib/core/` — `config/` (biến môi trường có kiểm) · `database/` · `errors/api_error.dart` · `middleware/` (auth, lỗi, CORS, log) · `utils/` (JWT, băm token / mật khẩu, logger) · `app_services.dart` (dựng datasource + service một lần, `provide` ở `routes/_middleware.dart`).
- `lib/features/<tính năng>/data/datasources/` — chỉ SQL (`Sql.named` + tham số, **không** nối chuỗi giá trị vào SQL) · `domain/services/` — nghiệp vụ, kiểm chủ sở hữu.
- `lib/models/` — model dùng chung, `toPublicJson()` không bao giờ có trường bí mật.

**App** `<tên>_app/lib/` — `core/` · `widgets/` · `features/<tính năng>/{data/{datasources,models}, domain/entities, presentation/{providers,screens,widgets}}` (chi tiết: skill `flutter-mvc-riverpod`). Không tạo interface repository khi chỉ có một cài đặt.

**Web** `<tên>_web/src/` — `app/(public)` · `app/(member)` · `app/admin` · `app/api/session/*` · `app/api/server/*` (proxy) · `features/<tính năng>/` · `services/` · `components/` · `hooks/` · `lib/` · `types/api.d.ts` (sinh tự động).

## Làm một tính năng xuyên suốt (thứ tự bắt buộc)

1. **Server**: migration → `lib/features/<x>/data/datasources/<x>_datasource.dart` → `domain/services/<x>_service.dart` → thêm vào `app_services.dart` + `routes/_middleware.dart` → route trong `routes/api/v1/...` → cập nhật `openapi.yaml`. Test service với datasource giả (`test/support/fakes.dart`), route với `RequestContext` giả (mocktail), test quyền (401 / 403).
2. **App** `lib/features/<x>/`: `data/models` (fromJson khớp openapi + `toEntity`) · `data/datasources` (gọi `ApiClient`) · `domain/entities` · `presentation/providers` (đủ loading / error / success) · `screens` · `widgets`. Test controller với server giả (`MockClient`, `test/helpers/fakes.dart`) + test màn hình trên mọi thiết bị.
3. **Web**: `./dev web npm run api:types` → `src/services/<x>-service.ts` → `src/features/<x>/` → trang trong `(public)` / `(member)` / `admin`. Đủ loading / lỗi có thử lại / rỗng.

## Lệnh từng phần (chạy từ gốc project, không `cd`)

| Phần | Kiểm chứng trước khi báo xong |
|---|---|
| App | `./dev app dart format .` · `./dev app flutter analyze` · `./dev app flutter test --reporter failures-only` |
| Server | `./dev server dart format .` · `./dev server dart analyze` · `./dev server dart test` |
| Web | `./dev web npm run typecheck` · `./dev web npm test` · `./dev web npm run build` |

Sinh code app: `./dev app flutter pub run build_runner build`. Chạy server: `./dev server dart_frog dev` (cần `.env` — việc của Thủ trưởng, agent không tạo `.env` chứa bí mật thật). Thêm gói: `./dev server dart pub add <gói>` · `./dev web npm install <gói>@<phiên bản>` (ghi lý do vào `brain/architecture.md`).
Chạy cả hệ thống: `docker compose up --build -d --wait` (cần `.env` từ `.env.example`).

## Soát nhanh khi kiểm soát / nghiệm thu

- [ ] App hoặc web có chỗ nào tự quyết nghiệp vụ / quyền / tiền? ⇒ KHÔNG ĐẠT
- [ ] Route mới có kiểm quyền ở server + test cho người không đủ quyền (401 / 403)?
- [ ] `openapi.yaml` khớp route (test contract ĐẠT), type web đã sinh lại, model app khớp tên trường?
- [ ] SQL dùng tham số (`Sql.named`), không nối chuỗi dữ liệu người dùng vào câu lệnh
- [ ] Lỗi trả đúng định dạng chung; client hiện câu báo thân thiện, không lộ chi tiết kỹ thuật
- [ ] Đổi database có migration mới; không có `.env` / khoá / token trong git
