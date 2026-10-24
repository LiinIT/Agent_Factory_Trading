@echo off
REM DV2 - bam dup de chay tren Windows.
REM Luu y: Keychain (luu API key), iOS Simulator va mot so kiem tra chi co tren macOS.
REM Tren macOS hay dung DV2.command.
chcp 65001 >nul
cd /d "%~dp0"
title DV2

where node >nul 2>nul || (echo [DV2] Chua co Node.js ^(can ^>= 24^) & pause & exit /b 1)
where claude >nul 2>nul || (echo [DV2] Chua co Claude Code CLI & pause & exit /b 1)

if not exist node_modules (
  echo [DV2] Lan dau chay: cai thu vien...
  call npm install || (echo [DV2] npm install that bai & pause & exit /b 1)
)

if not exist data\logs mkdir data\logs
echo [DV2] Bat orchestrator va web quan tri...
start "DV2 - orchestrator" /min cmd /c "npm run orchestrator > data\logs\orchestrator.log 2>&1"
start "DV2 - web" /min cmd /c "npm run web > data\logs\web.log 2>&1"

echo [DV2] Cho web san sang...
set /a tries=0
:wait
set /a tries+=1
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing http://localhost:7411 -TimeoutSec 2) | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel%==0 goto ready
if %tries% geq 90 (echo [DV2] Web chua len sau 90 giay - xem data\logs\web.log & pause & exit /b 1)
timeout /t 1 >nul
goto wait

:ready
echo [DV2] San sang: http://localhost:7411
start "" http://localhost:7411
echo [DV2] Dong 2 cua so "DV2 - orchestrator" va "DV2 - web" de tat.
pause
