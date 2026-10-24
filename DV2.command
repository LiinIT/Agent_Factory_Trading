#!/bin/bash
# DV2 — bấm đúp trong Finder để chạy (macOS).
# Bật Ollama (nếu có) → orchestrator (127.0.0.1:7410) → web (http://localhost:7411) → mở trình duyệt.
# Đóng cửa sổ Terminal hoặc Ctrl+C để tắt toàn bộ.

set -u
cd "$(dirname "$0")" || exit 1
ROOT="$(pwd)"
LOG_DIR="$ROOT/data/logs"
WEB_URL="http://localhost:7411"
ORCH_HEALTH="http://127.0.0.1:7410/api/health"
mkdir -p "$LOG_DIR"

say_line() { printf '\033[36m[DV2]\033[0m %s\n' "$1"; }
fail() { printf '\033[31m[DV2] %s\033[0m\n' "$1"; read -r -p "Nhấn Enter để đóng…"; exit 1; }

command -v node >/dev/null || fail "Chưa có Node.js (cần ≥ 24): brew install node"
command -v claude >/dev/null || fail "Chưa có Claude Code CLI: https://claude.com/claude-code"
claude auth status >/dev/null 2>&1 || say_line "Cảnh báo: Claude Code chưa đăng nhập — chạy 'claude auth login'."

if [ ! -d "$ROOT/node_modules" ]; then
  say_line "Lần đầu chạy: cài thư viện…"
  npm install || fail "npm install thất bại"
fi

PIDS=()
cleanup() {
  say_line "Đang tắt…"
  for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null; done
  wait 2>/dev/null
  say_line "Đã tắt. Báo cáo Thủ trưởng: hệ thống dừng an toàn."
}
trap cleanup EXIT INT TERM

if command -v ollama >/dev/null && ! curl -sf http://127.0.0.1:11434/api/version >/dev/null; then
  say_line "Bật Ollama (báo cáo tình hình bằng model trên máy)…"
  OLLAMA_HOST=127.0.0.1:11434 ollama serve >"$LOG_DIR/ollama.log" 2>&1 &
  PIDS+=($!)
fi

if curl -sf "$ORCH_HEALTH" >/dev/null; then
  say_line "Orchestrator đã chạy sẵn."
else
  say_line "Bật orchestrator…"
  npm run orchestrator >"$LOG_DIR/orchestrator.log" 2>&1 &
  PIDS+=($!)
fi

if curl -sf -o /dev/null "$WEB_URL"; then
  say_line "Web quản trị đã chạy sẵn."
else
  say_line "Bật web quản trị…"
  npm run web >"$LOG_DIR/web.log" 2>&1 &
  PIDS+=($!)
fi

for _ in $(seq 1 90); do
  curl -sf "$ORCH_HEALTH" >/dev/null && curl -sf -o /dev/null "$WEB_URL" && break
  sleep 1
done
curl -sf -o /dev/null "$WEB_URL" || fail "Web chưa lên sau 90 giây — xem $LOG_DIR/web.log"

say_line "Sẵn sàng: $WEB_URL  (giữ Space để nói · phím \` mở Env · ? xem phím tắt)"
[ "${DACVU_NO_OPEN:-0}" = "1" ] || open "$WEB_URL"
say_line "Log: $LOG_DIR · Ctrl+C hoặc đóng cửa sổ để tắt."
wait
