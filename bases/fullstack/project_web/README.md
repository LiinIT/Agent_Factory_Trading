# web/ — Website người dùng + trang Admin

Next.js (App Router) + TypeScript. **Không nối database, không chứa nghiệp vụ** — mọi dữ liệu lấy từ `project_server` qua `/api/v1`.

## Chạy (development)

```bash
cp .env.example .env.local     # SERVER_URL trỏ tới project_server (mặc định http://localhost:8080)
npm install
npm run dev                    # http://localhost:3001
```

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `src/app/(public)/` | Trang công khai: giới thiệu, `/login`, `/register` |
| `src/app/(member)/` | Trang thành viên (cần đăng nhập): `/dashboard`, `/profile` |
| `src/app/admin/` | Trang quản trị (chỉ ADMIN): `/admin/dashboard`, `/admin/members` |
| `src/app/api/` | Server của web: `session/*` (đăng nhập / đăng ký / đăng xuất), `server/*` (proxy tới server) |
| `src/features/<tính năng>/` | Component + logic theo tính năng (vd `auth/`, `members/`) |
| `src/services/` | Gọi API (`api-client.ts` đọc lỗi theo định dạng chung) |
| `src/components/` · `hooks/` · `stores/` · `lib/` · `styles/` | Dùng chung |
| `src/types/api.d.ts` | **Sinh tự động** từ `../project_server/openapi.yaml` (`npm run api:types`) — không sửa tay |

## Quy ước

- **Token không bao giờ nằm trong JavaScript của trình duyệt**: server Next.js giữ access / refresh token trong cookie httpOnly, `/api/server/*` gắn token và tự làm mới khi hết hạn.
- `middleware.ts` chỉ chặn để điều hướng giao diện; **quyền thật do server kiểm** ở mọi API.
- Đổi API ở `project_server` (route + `openapi.yaml`) ⇒ `npm run api:types` ở đây.
- Mọi trang tải dữ liệu đủ 3 trạng thái: đang tải / lỗi (có thử lại) / rỗng.
