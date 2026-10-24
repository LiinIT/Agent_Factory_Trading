# Dacvu_zero

> Hệ thống agent cá nhân (repo `agent-factory`). Bấm đúp `Dacvu_zero.command` (macOS) hoặc `Dacvu_zero.bat` (Windows) để chạy.


Đơn vị dev ảo cá nhân chạy local, tổ chức theo biên chế quân đội. **Chỉ huy trưởng** (Thủ trưởng) ra lệnh bằng chữ hoặc giọng nói; **Tham mưu trưởng** (Brain) nhận mọi báo cáo và giao nhiệm vụ đúng ban:

| Ban | Mã | Nhiệm vụ | Duyệt |
|---|---|---|---|
| Ban Tác chiến | `tac-chien` | Phương án tác chiến (PRD, ma trận thiết bị) | ⏸ Chỉ huy trưởng |
| Ban Ngoại giao | `ngoai-giao` | GUI demo — GUI demo bấm được trên iPhone/Android/Web | ⏸ Chỉ huy trưởng — chưa duyệt cấm viết code |
| Ban Công binh | `cong-binh` | Kiến trúc + kế hoạch lát cắt | Tham mưu trưởng soát |
| Đại đội Xung kích | `xung-kich` | Làm từng lát cắt (code + test) | — |
| Ban Kiểm soát | `kiem-soat` | Kiểm soát lát cắt trên từng thiết bị | — |
| Hội đồng Nghiệm thu | `nghiem-thu` | Nghiệm thu bàn giao | ⏸ Chỉ huy trưởng |
| Ban Thông tin · Hậu cần · Bảo mật | (máy) | Chuyển lệnh/báo cáo · đo thiệt hại · xét cấp quyền | không tốn quota |

Mọi ban kết thúc bằng **báo cáo JSON** (nhiệm vụ, kết quả ĐẠT/KHÔNG ĐẠT/CẦN HỎI, bằng chứng, vướng, câu hỏi, đề xuất). Có câu hỏi → nhiệm vụ dừng chờ Chỉ huy trưởng trả lời. Tham mưu trưởng (AI) chỉ được gọi khi cần quyết định (qua cổng duyệt, KHÔNG ĐẠT, lỗi, hết nhiệm vụ). Ban Hậu cần ghi thiệt hại mỗi lần chạy (thời gian, token, % quota, quy đổi USD) và dừng nhiệm vụ ăn quá 10% quota 5 giờ.

```
Web quản trị (localhost:7401, Next.js)        ← chat, giữ-để-nói, bảng task, duyệt/trả lại
   │ /api/* (proxy, gắn token — token không xuống trình duyệt)
Orchestrator (127.0.0.1:7400, Node + SQLite)   ← quản lý, hàng đợi, quota, log
   │ spawn `claude -p` (gói đăng ký, không dùng API key)
~/Documents/StudioMia_workspace/workspace_apps_dv0/<project>/  ← mỗi project một git repo local + brain/ + setups/ (iOS + Android)
```

## Chạy

Yêu cầu: Node ≥ 24 (có sẵn `node:sqlite` và chạy TypeScript trực tiếp), Claude Code đã đăng nhập (`claude auth`), Flutter.

```bash
npm install
npm run orchestrator   # terminal 1
npm run restart        # tắt orchestrator đang chạy (cổng 7400) rồi bật bản mới — dùng sau khi sửa code
npm run web            # terminal 2 → mở http://localhost:7401  (micro chỉ chạy trên localhost / https, KHÔNG dùng IP)
npm run web:https      # tuỳ chọn: https://localhost:7443 — lần đầu chạy ở terminal thường để nhập mật khẩu cài chứng chỉ mkcert
npm test               # test orchestrator
npm run typecheck
```

Lần chạy đầu tạo `data/token` (quyền 600) và `data/factory.db`.

## Giao diện

Phong cách terminal tối, 3 cột theo mẫu theme1 + thế giới isometric theo theme2:

- **Biên chế** (trái): ban nào nhận nhiệm vụ gì, do ai giao, model nào, chạy bao lâu; tiến độ từng project.
- **Sở chỉ huy dã chiến** (giữa, SVG isometric): Tham mưu trưởng (Brain) → Ban Thông tin → kho `brain/` → 6 bệ các ban; Ban Hậu cần, Ban Bảo mật đứng cạnh. Giao lệnh: hạt sáng chạy xuôi; vừa báo cáo: chạy ngược (xanh lá). Đang làm: xanh dương; xin ý kiến: tím; chờ duyệt: vàng; lỗi/bị chặn: đỏ.
- **Điều phối** (phải): chuỗi chỉ huy, Tham mưu trưởng báo cáo, việc cần Chỉ huy trưởng quyết (duyệt / xem GUI demo / trả lời / cấp quyền), ban đang xử lý + model, báo cáo mới, thiệt hại hôm nay.
- **Màn hình phụ** (cửa sổ nổi, kéo được): nút list góc phải, phím `1`–`8` (liên lạc, duyệt, nhật ký, biên chế, quota, báo cáo, thiệt hại, GUI demo), hoặc `⌘K`. `Esc` đóng cửa sổ trên cùng. `⌘K` còn gửi được câu nói thẳng cho quản lý.

Thư viện: `lucide-react` (icon), `motion` (cửa sổ), `cmdk` (bảng lệnh), font JetBrains Mono qua `next/font` (tự host sau khi build).

## Phím tắt & bộ đàm

| Phím | Tác dụng |
|---|---|
| **Giữ Space** | Bộ đàm — nói với Tham mưu trưởng, thả ra để gửi |
| `M` | Bật/tắt đọc to (giọng Linh) |
| `P` · `T` · `N` | Tạm dừng hàng đợi · đổi chế độ Tà môn · ẩn/hiện ghi chú chức năng |
| `Shift+A` | Duyệt việc chờ duyệt đầu tiên (có xác nhận) |
| `` ` `` | Màn Env: API key, nguồn model, trần chi tiêu |
| `1`–`8` · `⌘K` · `Esc` · `?` | Màn hình phụ · bảng lệnh · đóng cửa sổ · bảng phím tắt |

Lệnh giọng nói ngắn do máy xử lý (0 token): "mở GUI demo/thiệt hại/nhật ký…", "tạm dừng", "tiếp tục", "đóng", "báo cáo tình hình" (Ollama `hermes3` viết lại; bản viết lại thiếu số liệu thì đọc nguyên dữ kiện máy). Câu khác chuyển nguyên văn cho Tham mưu trưởng.

## Base barem & chế độ Tà môn

- `bases/flutter-mvc-riverpod`: app khung chuẩn (MVC + Riverpod, logger, theme, màn hình mẫu đủ trạng thái, `testWidgetsOnDevices` 12 thiết bị, `auditTappables` bấm thử mọi nút, `tool/store_check.dart`). Project mới được chép sẵn base này (bỏ `build/`, `.dart_tool/`…). `bases/registry.json` khai báo lệnh chuẩn của từng stack — thêm ngôn ngữ = thêm một base.
- `skills/base-barem/patterns/`: phân trang, cache offline, form, tìm kiếm debounce, retry, phiên đăng nhập.
- **Tà môn** (`config/factory.json` → `modes.ta-mon`, phím `T`): Ban Tác chiến/Kiểm soát/Nghiệm thu dùng haiku + effort thấp; **Ban Kiểm soát chạy bằng máy** (pub get → codegen → analyze → test rút gọn), chỉ gọi AI khi có lỗi; ma trận thiết bị 3 cỡ; GUI demo wireframe. Không đổi: cổng duyệt, bảo mật, ngưỡng báo động.
- Skill: 24 skill của Now_me + `dieu-lenh-chi-huy` (điều lệnh riêng của Chỉ huy trưởng); mỗi ban có danh sách skill bắt buộc trong `team/*.md`.

## Env & nguồn model (phím `` ` ``)

- Nguồn: `claude-main` (gói đăng nhập sẵn), `claude-alt` (OAuth token tài khoản Claude khác), `claude-api` (`ANTHROPIC_API_KEY`), `chatgpt-plus` (Codex CLI đăng nhập ChatGPT), `openai-api` (`OPENAI_API_KEY`).
- Key chỉ lưu trong macOS Keychain (service `agent-factory`), web chỉ ghi được, không đọc lại; không đưa vào context agent.
- Gán nguồn theo từng ban; Tham mưu trưởng luôn chạy Claude. Có nguồn dự phòng khi hết quota và trần chi tiêu/ngày (mặc định $5) cho nguồn trả theo token. Nút **Thử** gửi một lệnh ngắn để kiểm tra nguồn.

## Diệt lỗi & checklist phát hành

- Ban Kiểm soát / Hội đồng Nghiệm thu báo **KHÔNG ĐẠT** → Ban Thông tin tự tạo cặp task "Diệt lỗi vòng N" + "Kiểm lại vòng N" (ưu tiên), tối đa 5 vòng (`bugLoop.maxRounds`), quá thì hỏi Thủ trưởng.
- Máy kiểm trước khi gọi AI: pub get → codegen → format → analyze → test; nghiệm thu thêm build web, `store_check`, integration test trên simulator iOS.
- `templates/project/brain/checklist.md`: 66 mục bắt buộc (GUI, logic, hiệu năng, bảo mật, phục hồi, CI, Apple, Google) — nghiệm thu phải điền 100%. Skill: `app-qa-checklist`, `app-qa-advanced`, `store-review`.

## Thư mục

| Thư mục | Nội dung |
|---|---|
| `team/*.md` | Định nghĩa vai: frontmatter (`model`, `gate`, `timeoutMinutes`, `allowedTools`) + system prompt. Thêm vai = thêm file. |
| `skills/` | Skill chép vào `.claude/skills` của mỗi project (điều lệnh, quy trình, chuẩn Flutter, thiết bị, base barem, 24 skill Now_me). |
| `bases/` | Base barem từng stack + `registry.json`. |
| `templates/project/` | Khung project mới: `CLAUDE.md`, `brain/`. |
| `brain/` | Bài học chung cho mọi project. |
| `config/factory.json` | Cổng, số task song song, ngưỡng quota, thời gian chờ. |
| `apps/orchestrator/` | Server điều phối. |
| `apps/web/` | Web quản trị. |

## An toàn

- Server chỉ nghe `127.0.0.1`, web chỉ nghe `localhost` (secure context để dùng micro); mọi API trừ `/api/health` cần token. Muốn dùng từ điện thoại: Tailscale, không mở port ra internet.
- Agent chạy `--strict-mcp-config` (không nạp connector Notion/Drive… của tài khoản — vừa an toàn vừa bớt tới ~100k token/lần) và `--permission-mode dontAsk` + `--allowedTools` theo vai: lệnh ngoài danh sách bị từ chối tự động (đã thử: `curl` bị chặn). Không vai nào được `git push`, `cd`, cài gói toàn cục.
- `--setting-sources project`: quyền cấp user trong `~/.claude/settings.json` không lan sang agent.
- `ANTHROPIC_API_KEY` bị gỡ khỏi môi trường agent để luôn dùng quota gói đăng ký.
- Orchestrator tự commit trong repo của project sau mỗi task; không bao giờ tự push. Push chỉ chạy khi Chỉ huy trưởng bấm nút **Push** (cửa sổ cây hệ thống → bánh răng cạnh project): máy quét key/file cấm trước, git không được hỏi mật khẩu (dùng SSH key / credential sẵn có), URL remote không được chứa token.
- Xoá project: bánh răng cạnh project → gõ đúng tên → **Xoá**. Gỡ project, nhiệm vụ, tin nhắn khỏi DB (giữ lịch sử thiệt hại); thư mục source vào Thùng rác macOS (khôi phục bằng "Put Back"). Bị chặn khi project đang có nhiệm vụ chạy.
- Nơi lưu source từng project: mặc định `~/Documents/StudioMia_workspace/workspace_apps_dv0/<id>` (`config/factory.json` → `workspaceDir`, hỗ trợ `~/`); đổi ở bánh răng cạnh project hoặc nói với Tham mưu trưởng khi lập project ("lưu ở ~/Documents/…"). Không cho lưu vào thư mục hệ thống, thư mục nhà, trong repo agent-factory hay thư mục đã có dữ liệu.
- Nghiêm cấm commit bí mật: `.gitignore` chặn `data/`, `.env*`, khoá/chứng chỉ; pre-commit hook (`.githooks/`, bật tự động khi `npm install`) quét file đã stage bằng `scripts/check-secrets.mts` và chặn commit nếu thấy key/token. Trước khi public chạy `npm run secrets:check` để quét toàn repo.

## Quota

Mỗi lần chạy Claude trả `rate_limit_event` (% khung 5 giờ / 7 ngày + giờ reset). Vượt ngưỡng trong `config/factory.json` hoặc bị từ chối → hàng đợi nghỉ tới giờ reset, task đang dở quay lại hàng đợi. Thanh quota hiển thị trên web.

## Giới hạn hiện tại (giai đoạn 1)

- Giọng nói dùng Web Speech API của trình duyệt (Chrome/Safari) — âm thanh đi qua dịch vụ nhận dạng của trình duyệt. Giai đoạn sau: PhoWhisper/whisper.cpp local.
- Chưa tự khởi động cùng máy (launchd), chưa có web-dev.
- Android: có SDK nhưng chưa có máy ảo (AVD) → Ban Kiểm soát chỉ widget test theo cỡ Android.
- GUI demo phục vụ qua `/api/projects/<id>/prototype/` với CSP `sandbox` (origin rỗng, không gọi mạng, không đọc token).
- 1 task chạy một lúc (`concurrency`), hợp với gói Pro.

## Nguồn tham khảo

Xem `NOTICE.md`.
