@echo off
title CloudOps - Starting All Services
echo ========================================================
echo        CLOUDOPS SRE OBSERVABILITY PLATFORM
echo               Starting System...
echo ========================================================

echo.
echo [1/3] Starting Backend API Server (Port 5000)...
start "CloudOps Backend" cmd /k "cd server && npm run dev"

echo.
echo [2/3] Starting Frontend Client (Port 5173)...
start "CloudOps Frontend" cmd /k "cd client && npm run dev"

echo.
echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Launching CloudOps in browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo  All CloudOps services are UP and RUNNING!
echo  - Frontend Client:  http://localhost:5173
echo  - Public Status:    http://localhost:5173/status
echo  - Logs Explorer:    http://localhost:5173/logs
echo  - Backend API:      http://localhost:5000
echo ========================================================
echo To stop everything anytime, just run: down.bat (or npm run down)
echo.
pause
