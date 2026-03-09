@echo off
setlocal

echo ==========================================
echo   Setting up EcomAntigravity (Manual Mode)
echo ==========================================
echo.

set PROJECT_ROOT=%~dp0
cd /d %PROJECT_ROOT%

:: STEP 1: Backend Setup
echo [STEP 1/4] Setting up Backend...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
echo Installing backend dependencies...
venv\Scripts\pip install -q -r requirements.txt
echo Seeding database...
venv\Scripts\python seed.py
cd ..

:: STEP 2: Frontend Setup
echo [STEP 2/4] Setting up Frontend...
cd frontend
echo Installing frontend dependencies...
call npm install --no-audit --no-fund
cd ..

:: STEP 3: Building Frontend (Production)
echo [STEP 3/4] Building Frontend assets...
cd frontend
call npm run build
cd ..

:: STEP 4: Starting Single Unified Application
echo [STEP 4/4] Starting Unified Application...
echo.
echo Launching your e-commerce platform...
echo.
echo Access your platform at: http://localhost:8000
echo Backend API Docs: http://localhost:8000/docs
echo.
cd backend
venv\Scripts\uvicorn main:app --port 8000
pause
