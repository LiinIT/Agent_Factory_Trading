---
name: flutter-mvc-riverpod
description: Chuẩn code Flutter của chủ nhân — kiến trúc MVC + Riverpod codegen, tách widget, header comment 4 dòng, logger, xử lý loading/empty/error, test. Bắt buộc khi viết hoặc review code Dart/Flutter trong project.
---

# Chuẩn Flutter của chủ nhân

## Kiến trúc: core + features 3 lớp (bố cục Now_me, `<tên>_app/lib/`)

| Thư mục | Trách nhiệm |
|---|---|
| `core/` | hạ tầng dùng chung: `constants/` (env, chuỗi, kích thước) · `entities/` · `errors/` · `network/` (`ApiClient`) · `router/` · `services/` (`TokenStorage`, storage) · `theme/` · `utils/` (logger) |
| `widgets/` | widget dùng ở ≥ 2 tính năng |
| `features/<tính năng>/data/datasources/` | **Model** — gọi server qua `ApiClient` / storage, trả model, không giữ state |
| `features/<tính năng>/data/models/` | **Model** — `fromJson` khớp `openapi.yaml` của server + `toEntity()` |
| `features/<tính năng>/domain/entities/` | **Model** — class thuần, không biết JSON / Flutter |
| `features/<tính năng>/presentation/providers/` | **Controller** — Riverpod Notifier: state, gọi datasource, đổi model → entity, điều phối |
| `features/<tính năng>/presentation/screens/` + `widgets/` | **View** — UI, không business logic; widget con mỗi cái một file |

- App **không nối database, không chứa nghiệp vụ / quyền** — mọi thứ đó ở server (skill `fullstack-system`).
- **Không** tạo `domain/repositories` (interface trừu tượng) + `data/repositories` (cài đặt) khi chỉ có một cài đặt — controller gọi thẳng datasource. Chỉ thêm repository khi thật sự có ≥ 2 nguồn (vd API + cache offline) cần gộp.
- View → watch/read provider → provider gọi datasource. View **không** gọi datasource trực tiếp; provider **không** có `BuildContext`.
- Riverpod codegen `@riverpod`; `AsyncNotifier` cho async, `Notifier` cho sync. Không dùng `StateProvider` cho state phức tạp. Sinh code: `./dev app flutter pub run build_runner build`.
- Mỗi widget con một file trong `widgets/` của màn hình; không viết `_PrivateWidget` trong file screen. Tên file khớp tên class.

## Header comment bắt buộc

Ngay trên **mọi** class và function/method (kể cả private):

```dart
/// <Mô tả ngắn chức năng>
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: <YYYY-MM-DD ngày tạo>
```

Bên trong function không viết comment giải thích từng dòng.

## Quy tắc Dart

- `const` khi có thể; không `!` bừa bãi; không nested ternary; function ≤ 4 tham số (nhiều hơn → object); không magic number/string → constant.
- **Không `print`** — dùng package `logger`, có ngữ cảnh: `log.d('[UserService] fetchUser id=$id')`; lỗi dùng `log.e(..., error: e, stackTrace: st)`.
- Không hardcode URL / API key / credential.
- Mọi màn hình có dữ liệu xử lý đủ **loading / empty / error / success**.
- Không import thừa. Function > 50 dòng → tách.

## Test

- Unit test cho provider và datasource; widget test cho màn hình chính (mỗi state ít nhất một test).
- Gọi server trong test bằng `MockClient` (`package:http/testing.dart`) qua `fakeBackendOverrides` — không gọi mạng thật.
- Trước khi báo xong: `./dev app dart format .` → `./dev app flutter analyze` (sạch) → `./dev app flutter test` (pass).

## Checklist review

- [ ] Đúng lớp data / domain / presentation, View không gọi datasource
- [ ] Provider đúng scope, không rebuild thừa (`const`, `select`, Consumer đúng chỗ)
- [ ] Null safety, không `!` bừa bãi
- [ ] Không `print`, không hardcode bí mật
- [ ] Loading / empty / error đủ
- [ ] Header comment đủ cho class/function mới
- [ ] Test cho logic mới
