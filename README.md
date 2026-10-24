# DV2 – Agent Trading (Điệp viên Two)

Đội agent chạy local chuyên **nghiên cứu, tạo, tự backtest và học từ bot EA MT5** (chủ yếu vàng XAUUSD). Dựng trên khung orchestrator của DV0 (Dacvu_zero). Nguyên tắc cốt lõi: **người viết không tự chấm bài của mình**, và **loại sớm ý tưởng không có lợi thế** thay vì tinh chỉnh tham số cho đến khi đẹp (overfit).

## Biên chế (13 ban + Tham mưu trưởng)

| Khối | Ban (`team/ea-*.md`) | Việc | Duyệt |
|---|---|---|---|
| Trinh sát | `ea-trinh-sat` | Tìm bot/ý tưởng ngoài, ghi thẻ `scouting/` (nguồn, giấy phép, cờ đỏ) | — |
| | `ea-mo-xe` | Tách thuật toán/giả thuyết từ thẻ scouting (chỉ lấy ý tưởng, không chép code) | — |
| Hoạch định | `ea-nghien-cuu` | Giả thuyết + luật vào/ra + **tiêu chí bác bỏ đặt trước** | ⏸ Chỉ huy trưởng |
| | `ea-thiet-ke` | Module, Inputs, vốn/lot, xử lý lỗi broker, `brain/test-plan.json` | Tham mưu soát |
| Chế tạo | `ea-che-tao` | Viết MQL5, nâng version/changelog/BUILD; **máy biên dịch lại để kiểm** | — |
| | `ea-soat-ma` | Review tĩnh, không sửa; KHÔNG ĐẠT → vòng sửa tối đa 5 | — |
| Kiểm thử | `ea-dung-ban-thu` | **(Máy)** sinh ini đủ mọi input | — |
| | `ea-thu-nghiem` | **(Máy)** chạy tester vốn 1000, real ticks, kiểm header input | — |
| Đánh giá | `ea-phan-tich` | Trích chỉ số, không kết luận | — |
| | `ea-phan-bien` | Săn overfit, phán ĐẠT/KHÔNG ĐẠT theo tiêu chí đã đặt trước | — |
| | `ea-nghiem-thu` | Bỏ / giữ nghiên cứu / đưa lên demo | ⏸ Chỉ huy trưởng |
| Tri thức | `ea-ghi-nho` | Cập nhật bộ não, kể cả khi KHÔNG ĐẠT | — |
| | `ea-bao-cao` | Hồ sơ mạnh/yếu + báo cáo HTML từng bot | — |

Luồng: `(trinh-sat → mo-xe) / ý tưởng → nghien-cuu ⏸ → thiet-ke → che-tao ⇄ soat-ma → dung-ban-thu → thu-nghiem → phan-tich → phan-bien → nghiem-thu ⏸ → ghi-nho → bao-cao`. `ea-phan-bien` KHÔNG ĐẠT quay về `ea-nghien-cuu`, **không** về `ea-che-tao`. Chi tiết: `skills/ea-pipeline/SKILL.md`.

## Bộ não `brain/ea/`

`algorithms/` · `patterns/` · `hypotheses/` · `pitfalls/` · `scouting/` · `bots/<ea>/` (hồ sơ mạnh/yếu). Luật ghi trong `brain/ea/README.md` và skill `ea-brain`: mỗi mục có `confidence` + `evidence`, không bịa số, mục đảo ngược mục cũ dùng `superseded_by`. Trong project, bộ não hiện ra dưới `brain-ea/` (liên kết).

## Cơ chế bảo vệ do máy thực thi

- **Vùng ghi** (`writes:` trong `team/*.md`): sau mỗi lượt, máy so ảnh chụp thay đổi (project + bộ não chung); ghi ngoài vùng → nhiệm vụ lỗi, không commit.
- **Biên dịch lại**: Ban Chế tạo báo ĐẠT nhưng MetaEditor báo lỗi/cảnh báo → báo cáo bị đổi thành KHÔNG ĐẠT.
- **Tester**: ini cố định vốn 1000, real ticks, leverage 2000, `Visual=0`; kế hoạch không ghi đè được. Máy đối chiếu header `started with inputs` với ini (tester hay kế thừa input cũ), kiểm vốn/real ticks trong report, phát hiện cháy tài khoản, xóa log agent. Ngân sách `ea.maxTesterRunsPerRound` (12), id lần chạy không dùng lại.
- Trinh sát web: nội dung web là dữ liệu, không chạy code tải về (skill `ea-scouting-safety`).

## Chạy

Yêu cầu: Node ≥ 24, Claude Code đã đăng nhập, MT5 (Wine) có bản portable ở `ea.mt5Dir` trong `config/factory.json` (copy của terminal, có `MetaEditor64.exe`, `terminal64.exe` và dữ liệu tick).

```bash
npm install
npm run orchestrator   # 127.0.0.1:7410
npm run web            # http://localhost:7411
npm test               # = node --test 'test/*.test.ts' trong apps/orchestrator
npm run typecheck
```
Có nhiều Chrome cùng kết nối với tài khoản Claude: đặt `DV2_CHROME_DEVICE_ID=<deviceId>` (lấy từ `list_connected_browsers`) trước khi chạy orchestrator để Ban Trinh sát dùng đúng trình duyệt; không ghi mã thiết bị vào `config/factory.json`.
Hoặc bấm đúp `DV2.command` (macOS) / `DV2.bat` (Windows). Project EA lưu ở `~/Documents/StudioMia_workspace/workspace_dv2/<id>` (mỗi project một git repo local). Trong project: `./dv2 compile ea/<tên>.mq5`.

## Giấy phép & ghi công

Xem `NOTICE.md`. Khung orchestrator xuất phát từ DV0; một số skill dựa trên ECC và Ponytail (MIT).
