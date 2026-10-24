# app/ — Flutter (iOS + Android)

Flutter + Riverpod (codegen) + logger. **Không nối database, không chứa nghiệp vụ** — mọi dữ liệu lấy từ `project_server` qua `/api/v1`.

## Chạy

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:8080/api/v1        # máy ảo iOS
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8080/api/v1         # máy ảo Android
```

Staging / production luôn truyền `API_BASE_URL` của môi trường đó (HTTPS). Bản debug Android cho phép http để gọi server trên máy dev; bản phát hành thì không.

## Cấu trúc `lib/` (theo bố cục Now_me)

| Thư mục | Nội dung |
|---|---|
| `core/constants/` | `AppEnv` (biến `--dart-define`), `AppStrings`, `AppSizes` |
| `core/entities/` | Entity dùng chung nhiều tính năng (`AuthTokens`) |
| `core/errors/` | `ApiException` — đọc định dạng lỗi chung của server |
| `core/network/` | `ApiClient` — gắn token, gặp 401 tự làm mới (gom các yêu cầu đồng thời về một lần làm mới) |
| `core/router/` | `AuthGate` — đang kiểm tra / lỗi / đăng nhập / màn chính |
| `core/services/` | `TokenStorage` — token nằm trong Keychain / Keystore, không bao giờ vào log |
| `core/theme/` · `core/utils/` | Theme, logger |
| `widgets/` | Widget dùng ở ≥ 2 tính năng (`AppLoadingView`, `AppErrorView`) |
| `features/<tính năng>/data/datasources/` | Gọi server qua `ApiClient`, trả model, không giữ state |
| `features/<tính năng>/data/models/` | `fromJson` khớp `openapi.yaml` + `toEntity()` |
| `features/<tính năng>/domain/entities/` | Class thuần, không biết JSON / Flutter |
| `features/<tính năng>/presentation/` | `providers/` (Riverpod controller) · `screens/` · `widgets/` (mỗi widget một file) |

Luồng: `presentation/screens` → watch/read `presentation/providers` → gọi `data/datasources` → `ApiClient` → server; model đổi sang entity trước khi lên giao diện. Không tạo interface repository khi chỉ có một cài đặt.

## Thêm tính năng

1. Tạo `lib/features/<tên>/` với `data/` · `domain/` · `presentation/` như trên.
2. Datasource gọi `ApiClient` (qua `apiClientProvider`), trả model.
3. Controller `@riverpod` gọi datasource, đổi model → entity, đủ loading / error / success.
4. `flutter pub run build_runner build` sau khi sửa provider.
5. Test trong `test/features/<tên>/`: controller với server giả (`MockClient`, `test/helpers/fakes.dart`), màn hình trên mọi thiết bị bằng `testWidgetsOnDevices`.

## Kiểm tra

```bash
dart format . && flutter analyze && flutter test
flutter test --dart-define=DEVICE_MATRIX=quick      # bản nhanh
dart run tool/store_check.dart                      # trước khi lên store
```
