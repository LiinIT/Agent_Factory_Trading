---
name: base-barem
description: Base barem — khung app chuẩn có sẵn trong project (MVC + Riverpod, logger, theme, màn hình mẫu, helper test thiết bị) và thư viện pattern dùng lại (phân trang, cache offline, form, tìm kiếm, retry, phiên đăng nhập). Dùng khi thiết kế kiến trúc, viết code, hoặc cần một giải thuật/mẫu thông dụng — chép và chỉnh, không viết lại từ đầu.
---

# Base barem

Project đã được dựng sẵn từ base `fullstack` (bố cục Now_me) ngay khi lập: `<tên>_app` (Flutter, package `app`) + `<tên>_server` (Dart Frog, package `server`) + `<tên>_web` (Next.js) + `docker-compose.yml` + `docs/specs/` + `AGENTS.md` + `project-status.md`. Luật hệ thống và cách làm tính năng xuyên suốt: skill `fullstack-system`. **Không chạy `flutter create`, `dart_frog create`, `create-next-app`.** Lần đầu: `./dev app flutter pub get` · `./dev server dart pub get` · `./dev web npm install`.

## Cấu trúc có sẵn của `<tên>_app`

```
lib/
├── main.dart · app.dart              ProviderScope + MaterialApp (theme sáng/tối) → AuthGate
├── core/
│   ├── constants/ app_env (API_BASE_URL) · app_strings · app_sizes
│   ├── entities/ auth_tokens
│   ├── errors/ api_exception         ← định dạng lỗi chung của server
│   ├── network/ api_client (token, tự làm mới 401) · api_providers
│   ├── router/ auth_gate             ← đang kiểm tra / lỗi / đăng nhập / màn chính
│   ├── services/ token_storage       ← Keychain / Keystore
│   ├── theme/ app_theme
│   └── utils/ app_logger.dart        ← appLogger.d/i/w/e
├── widgets/ app_loading_view · app_error_view    ← dùng chung
└── features/
    ├── auth/
    │   ├── data/ datasources (auth_datasource) · models (user_model, auth_session_model)
    │   ├── domain/ entities (user, login_credentials)
    │   └── presentation/ providers (auth_controller) · screens (login_screen) · widgets (login_form, logout_button)
    └── home/                          ← mẫu, thay bằng nghiệp vụ thật
        ├── data/ datasources (sample_datasource) · models (sample_item_model)
        ├── domain/ entities (sample_item)
        └── presentation/ providers · screens (home_screen) · widgets (list, tile, empty)
test/
├── helpers/devices.dart              ← testWidgetsOnDevices: 12 thiết bị (9 dọc + 3 xoay ngang)
├── helpers/ui_audit.dart             ← auditTappables (chạm hết mọi nút), showVirtualKeyboard
├── helpers/fakes.dart                ← InMemoryTokenStorage, signedInOverrides, fakeBackendOverrides (server giả)
├── core/ · features/auth/ · features/home/
integration_test/app_flow_test.dart   ← E2E trên iOS Simulator (L5, C2)
tool/store_check.dart                 ← máy kiểm Apple/Google + điều lệnh (S2, S7, A1, A2, A5, P1, P5, P6, DL1, DL2)
ios/Runner/PrivacyInfo.xcprivacy      ← đã gắn vào target Runner (A1)
```

## Cấu trúc có sẵn của `<tên>_server`

```
routes/
├── _middleware.dart                  log → CORS → lỗi chung → dựng dịch vụ, provide cho route
└── api/v1/
    ├── health.dart
    ├── auth/ register · login · refresh · logout
    ├── users/ _middleware (cần đăng nhập) · me
    └── admin/ _middleware (đăng nhập + ADMIN) · users/index (phân trang)
lib/
├── core/ config (AppConfig, env) · database · errors (ApiError) · middleware (auth, error, cors, log) · utils (jwt, token_hash, password_hasher, request_body, validators, logger) · app_services.dart
├── features/auth/ data/datasources (refresh_token_datasource) · domain/services (auth_service)
├── features/users/ data/datasources (users_datasource)
└── models/ user (toPublicJson) · auth_principal (UserRole)
db/migrations/20261021_01_init.sql    users + refresh_tokens
tool/ migrate.dart · seed.dart
openapi.yaml                          contract chung (test/routes/openapi_contract_test.dart kiểm khớp routes/)
deploy/nginx.conf · Dockerfile (image ~30 MB)
test/ core · features/auth · routes · support/fakes.dart
```

`<tên>_web` có sẵn: trang công khai, đăng nhập / đăng ký, dashboard + profile thành viên, admin dashboard + danh sách thành viên; proxy `/api/server/*` giữ token trong cookie httpOnly. Chi tiết: README của từng phần.

`main.dart` của app đã bắt lỗi toàn cục (`FlutterError.onError`, `PlatformDispatcher.onError`) — chỗ nối Crashlytics/Sentry (C3).

## Cách dùng (app)

1. Đổi tên `Sample*` thành nghiệp vụ thật (datasource gọi `ApiClient` thay dữ liệu cứng); xoá mẫu không dùng bằng `git rm`.
2. Tính năng mới: chép khuôn `lib/features/home/` (data → domain → presentation; screen chỉ layout + `when(loading/error/data)`, widget con tách file). Dùng ở ≥ 2 tính năng ⇒ đưa vào `lib/widgets/` hoặc `lib/core/`.
3. Test thiết bị: `testWidgetsOnDevices('Tên', (tester, device) async { ... })` — tự chạy đủ 12 thiết bị (Tà môn: 3).
   Dựng App đã đăng nhập: `ProviderScope(overrides: signedInOverrides, child: const App())`; gọi server giả: `fakeBackendOverrides(MockClient(...), InMemoryTokenStorage())`.
   **Mọi màn hình** phải có test `expect((await auditTappables(tester)).problems, isEmpty);` — nút cố ý khoá khai `allowDisabled: {key}`.
   Màn có form: gọi `showVirtualKeyboard(tester)` rồi kiểm không overflow, nút gửi vẫn bấm được (G9).
   E2E: thêm kịch bản vào `integration_test/`, chạy `./dev app flutter test integration_test -d <simulator>`.
   Trước nghiệm thu: `./dev app dart run tool/store_check.dart` phải ra `STORE CHECK: ĐẠT` (đổi Bundle ID / applicationId khỏi `vn.miastudio.app`).
4. Sinh code Riverpod: `./dev app flutter pub run build_runner build` (không dùng `dart run`). Treo không chạy tiếp (CPU 0%) ⇒ còn khoá cũ trong `.dart_tool/build`: dừng lệnh, xoá `.dart_tool/build`, chạy lại.
5. Lệnh máy kiểm của từng phần: `bases/registry.json` → `parts[].commands`.

## Thư viện pattern (`patterns/`)

| File | Dùng khi |
|---|---|
| `pagination.md` | Danh sách dài, tải thêm khi cuộn |
| `offline-cache.md` | Hiện dữ liệu cũ khi mất mạng, làm mới nền |
| `form-validation.md` | Form nhập liệu có kiểm tra |
| `debounce-search.md` | Ô tìm kiếm gọi API khi gõ |
| `retry-backoff.md` | Gọi mạng chập chờn, thử lại có giãn cách |
| `auth-session.md` | Tham khảo thêm về phiên đăng nhập — base đã có sẵn `AuthController` + `ApiClient` tự làm mới token, dùng cái có sẵn trước |

Đọc đúng file cần (không đọc hết), chép khuôn và chỉnh theo nghiệp vụ. Pattern đã tuân thủ điều lệnh (header 4 dòng, logger, không magic number).
