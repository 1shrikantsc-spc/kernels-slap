@echo off
:: Start Backend in a new terminal
echo Starting Backend (FastAPI)...
start "Backend - FastAPI" cmd /k "cd backend && .\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

:: Start Frontend in a new terminal
echo Starting Frontend (Next.js)...
start "Frontend - Next.js" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are starting in separate terminal windows.
echo Close this window or press any key to exit.
pause >nul
