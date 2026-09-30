@echo off
title CloudOps - Stopping All Services
echo ========================================================
echo        CLOUDOPS SRE OBSERVABILITY PLATFORM
echo               Stopping System...
echo ========================================================

echo.
echo Stopping Backend (Port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

echo.
echo Stopping Frontend (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul

echo.
echo Cleaning up any stray node processes...
npx --yes kill-port 5000 5173 2>nul

echo.
echo ========================================================
echo   All CloudOps services have been STOPPED cleanly.
echo ========================================================
echo.
timeout /t 3
