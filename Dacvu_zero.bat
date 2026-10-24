@echo off
REM Dacvu_zero - bam dup de chay tren Windows.
REM Luu y: Keychain (luu API key), iOS Simulator va mot so kiem tra chi co tren macOS.
REM Tren macOS hay dung Dacvu_zero.command.
chcp 65001 >nul
cd /d "%~dp0"
title Dacvu_zero

where node >nul 2>nul || (echo [Dacvu_zero] Chua co Node.js ^(can ^>= 24^) & pause & exit /b 1)
where claude >nul 2>nul || (echo [Dacvu_zero] Chua co Claude Code CLI & pause & exit /b 1)

if not exist node_modules (
  echo [Dacvu_zero] Lan dau chay: cai thu vien...
  call npm install || (echo [Dacvu_zero] npm install that bai & pause & exit /b 1)
)

if not exist data\logs mkdir data\logs
echo [Dacvu_zero] Bat orchestrator va web quan tri...
start "Dacvu_zero - orchestrator" /min cmd /c "npm run orchestrator > data\logs\orchestrator.log 2>&1"
start "Dacvu_zero - web" /min cmd /c "npm run web > data\logs\web.log 2>&1"

echo [Dacvu_zero] Cho web san sang...
set /a tries=0
:wait
set /a tries+=1
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing http://localhost:7401 -TimeoutSec 2) | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel%==0 goto ready
if %tries% geq 90 (echo [Dacvu_zero] Web chua len sau 90 giay - xem data\logs\web.log & pause & exit /b 1)
timeout /t 1 >nul
goto wait

:ready
echo [Dacvu_zero] San sang: http://localhost:7401
start "" http://localhost:7401
echo [Dacvu_zero] Dong 2 cua so "Dacvu_zero - orchestrator" va "Dacvu_zero - web" de tat.
pause
