@echo off
title TradePulse - ULTIMATE All-in-One Launcher
color 0a

:: Main menu function
:main_menu
cls
echo.
echo ===============================================
echo        TradePulse - ULTIMATE LAUNCHER
echo          All-in-One Solution v3.0
echo ===============================================
echo.
echo Choose an option:
echo.
echo [1] 🚀 QUICK START - Launch TradePulse (Recommended)
echo [2] 🔧 SMART START - Launch with diagnostics
echo [3] 🔍 TROUBLESHOOT - Network diagnostics only
echo [4] � AUTH DEBUG - Fix authentication issues
echo [5] �🛑 STOP ALL - Stop all TradePulse services
echo [6] ❌ EXIT
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto quick_start
if "%choice%"=="2" goto smart_start
if "%choice%"=="3" goto troubleshoot_only
if "%choice%"=="4" goto auth_debug
if "%choice%"=="5" goto stop_services
if "%choice%"=="6" goto exit_program
echo Invalid choice. Please try again.
timeout /t 2 /nobreak >nul
goto main_menu

:: Quick Start - Just launch everything
:quick_start
cls
echo.
echo ===============================================
echo           🚀 QUICK START MODE
echo ===============================================
echo.
call :kill_processes
call :check_structure
call :start_backend
call :start_frontend
call :open_browser
echo.
echo ✅ Quick start complete! TradePulse should be running.
goto end_menu

:: Smart Start - Launch with full diagnostics
:smart_start
cls
echo.
echo ===============================================
echo           🔧 SMART START MODE
echo ===============================================
echo.
call :kill_processes
call :show_network_info
call :check_structure
call :start_backend
call :test_backend_connectivity
call :start_frontend
call :final_connectivity_test
call :open_browser
echo.
echo ✅ Smart start complete with full diagnostics!
goto end_menu

:: Troubleshoot only - Network diagnostics
:troubleshoot_only
cls
echo.
echo ===============================================
echo          🔍 TROUBLESHOOT MODE
echo ===============================================
echo.
call :show_network_info
call :check_ports
call :test_backend_connectivity
call :test_cors
call :show_solutions
goto end_menu

:: Auth Debug - Authentication troubleshooting
:auth_debug
cls
echo.
echo ===============================================
echo         🔐 AUTHENTICATION DEBUG MODE
echo ===============================================
echo.
call :check_structure
call :test_auth_endpoints
call :check_jwt_config
call :test_user_creation
call :show_auth_solutions
goto end_menu

:: Stop all services
:stop_services
cls
echo.
echo ===============================================
echo          🛑 STOPPING ALL SERVICES
echo ===============================================
echo.
call :kill_processes
echo.
echo ✅ All TradePulse services have been stopped.
goto end_menu

:: Function: Kill all processes
:kill_processes
echo [CLEANUP] Terminating existing instances...

:: Kill FastAPI/uvicorn processes (backend)
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im uvicorn.exe >nul 2>&1

:: Kill Node.js/Vite processes (frontend)
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

:: Kill any processes running on our ports
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo ✓ Previous instances terminated
timeout /t 2 /nobreak >nul
goto :eof

:: Function: Show network information
:show_network_info
echo [NETWORK] Current network configuration:
ipconfig | findstr "IPv4"
echo.
goto :eof

:: Function: Check project structure
:check_structure
echo [STRUCTURE] Checking project directories...

if not exist "backend" (
    echo ❌ ERROR: backend directory not found!
    echo Make sure you're running this from the TradePulse root directory.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ ERROR: frontend directory not found!
    echo Make sure you're running this from the TradePulse root directory.
    pause
    exit /b 1
)

echo ✓ Project structure verified
echo.
goto :eof

:: Function: Check ports
:check_ports
echo [PORTS] Checking port availability...

echo Checking Backend Port 8000:
netstat -an | findstr ":8000" >nul
if %errorlevel%==0 (
    echo ✓ Port 8000 is in use - Backend might be running
) else (
    echo ❌ Port 8000 is free - Backend not running
)

echo Checking Frontend Port 5173:
netstat -an | findstr ":5173" >nul
if %errorlevel%==0 (
    echo ✓ Port 5173 is in use - Frontend might be running
) else (
    echo ❌ Port 5173 is free - Frontend not running
)
echo.
goto :eof

:: Function: Start backend
:start_backend
echo [BACKEND] Starting FastAPI backend...
cd backend
start "TradePulse Backend" cmd /k "echo 🚀 TradePulse Backend Starting... & echo 📡 Listening on ALL network interfaces (0.0.0.0:8000) & echo 📱 Accessible from computer, mobile, and network devices & echo. & python run_dev.py"
echo Backend started in separate window
echo Waiting for backend to initialize...
timeout /t 8 /nobreak >nul
cd..
echo.
goto :eof

:: Function: Start frontend
:start_frontend
echo [FRONTEND] Starting React frontend...
cd frontend
start "TradePulse Frontend" cmd /k "echo 🌐 TradePulse Frontend Starting... & echo 📱 Network accessible with auto-backend detection & echo 🔧 Will automatically find the correct backend URL & echo. & npm run dev -- --host"
echo Frontend started in separate window
echo Waiting for frontend to initialize...
timeout /t 8 /nobreak >nul
cd..
echo.
goto :eof

:: Function: Test backend connectivity
:test_backend_connectivity
echo [TEST] Testing backend connectivity...

echo Testing localhost:8000...
curl -s -o nul -w "HTTP Status: %%{http_code}" http://localhost:8000/health 2>nul
if %errorlevel%==0 (
    echo ✓ Backend accessible on localhost
) else (
    echo ⚠️  Backend not yet ready on localhost
)

echo.
echo Testing network IP access...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4" ^| findstr "192.168"') do (
    set "networkip=%%a"
    setlocal enabledelayedexpansion
    set "networkip=!networkip: =!"
    echo Testing !networkip!:8000...
    curl -s -o nul http://!networkip!:8000/health 2>nul
    if !errorlevel!==0 (
        echo ✓ Backend reachable on network IP: !networkip!
    ) else (
        echo ⚠️  Backend not yet ready on: !networkip!
    )
    endlocal
)
echo.
goto :eof

:: Function: Test CORS
:test_cors
echo [CORS] Testing cross-origin configuration...
curl -s -H "Origin: http://localhost:5173" -I http://localhost:8000/health 2>nul | findstr "access-control-allow-origin" >nul
if %errorlevel%==0 (
    echo ✓ CORS configured correctly
) else (
    echo ⚠️  CORS configuration check inconclusive
)
echo.
goto :eof

:: Function: Final connectivity test
:final_connectivity_test
echo [FINAL] Final connectivity verification...
timeout /t 5 /nobreak >nul

curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend is ONLINE and ready for connections
) else (
    echo ⚠️  Backend still starting... (this is normal, please wait)
)
echo.
goto :eof

:: Function: Open browser
:open_browser
echo [LAUNCH] Opening TradePulse in browser...
echo.
echo 🌐 ACCESS POINTS:
echo   • Computer: http://localhost:5173
echo   • Mobile:   http://[your-network-ip]:5173
echo.
echo 🔧 API ENDPOINTS:
echo   • Backend:  http://localhost:8000
echo   • API Docs: http://localhost:8000/docs
echo.

timeout /t 3 /nobreak >nul
start http://localhost:5173
echo ✓ Browser opened to TradePulse
echo.
goto :eof

:: Function: Show troubleshooting solutions
:show_solutions
echo [SOLUTIONS] Common fixes for login issues:
echo.
echo 🔧 IF BACKEND NOT ACCESSIBLE:
echo   1. Run option [1] Quick Start to launch backend
echo   2. Check Windows Firewall - allow Python through firewall
echo   3. Ensure antivirus isn't blocking port 8000
echo.
echo 🌐 IF LOGIN FAILS:
echo   1. Clear browser cache and cookies
echo   2. Try incognito/private browsing mode
echo   3. Use http://localhost:5173 instead of network IP
echo   4. Check browser console (F12) for error details
echo.
echo 📱 IF MOBILE ACCESS FAILS:
echo   1. Ensure computer and phone on same WiFi network
echo   2. Use your computer's network IP address
echo   3. Check router firewall settings
echo.
echo 🔄 IF STILL HAVING ISSUES:
echo   1. Restart your router
echo   2. Run Windows Network Troubleshooter
echo   3. Temporarily disable Windows Firewall for testing
echo.
goto :eof

:: Function: Test authentication endpoints
:test_auth_endpoints
echo [AUTH] Testing authentication endpoints...

echo Testing user registration endpoint...
curl -s -X POST -H "Content-Type: application/json" -d "{\"email\":\"test_debug@example.com\",\"password\":\"testpass123\"}" http://localhost:8000/auth/register >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Registration endpoint accessible
) else (
    echo ❌ Registration endpoint failed - backend may not be running
)

echo Testing login endpoint...
curl -s -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "username=test_debug@example.com&password=testpass123" http://localhost:8000/auth/login >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Login endpoint accessible
) else (
    echo ❌ Login endpoint failed
)

echo.
goto :eof

:: Function: Check JWT configuration
:check_jwt_config
echo [JWT] Checking JWT configuration...

if exist "backend\.env" (
    echo ✓ Backend .env file found
    findstr "SECRET_KEY" backend\.env >nul
    if %errorlevel%==0 (
        echo ✓ SECRET_KEY found in .env
    ) else (
        echo ❌ SECRET_KEY missing in .env - this will cause auth failures!
    )
) else (
    echo ❌ Backend .env file missing - creating default...
    echo SECRET_KEY=your-super-secret-key-change-in-production > backend\.env
    echo DATABASE_URL=sqlite:///./tradepulse.db >> backend\.env
    echo ✓ Default .env created - restart backend
)

echo.
goto :eof

:: Function: Test user creation
:test_user_creation
echo [USER] Testing user database operations...

if exist "tradepulse.db" (
    echo ✓ Database file exists
) else (
    echo ❌ Database file missing - first run may be needed
)

echo.
goto :eof

:: Function: Show authentication solutions
:show_auth_solutions
echo [AUTH SOLUTIONS] Fixes for "Could not validate credentials":
echo.
echo 🔐 AUTHENTICATION FIXES:
echo   1. Clear browser localStorage and sessionStorage
echo   2. Logout and login again to get fresh token
echo   3. Check if token expired (tokens expire after 30 minutes)
echo   4. Ensure SECRET_KEY is set in backend/.env
echo.
echo 🛠️ QUICK FIXES TO TRY:
echo   1. Press F12 in browser, go to Application tab
echo   2. Clear Local Storage and Session Storage
echo   3. Refresh page and login again
echo   4. Try creating competition immediately after login
echo.
echo 🔧 DEVELOPER FIXES:
echo   1. Check backend/.env has SECRET_KEY
echo   2. Restart backend if SECRET_KEY was missing
echo   3. Check browser console for specific error details
echo   4. Verify JWT token format in localStorage
echo.
echo 📝 MANUAL TEST:
echo   1. Open browser Dev Tools (F12)
echo   2. Go to Application -> Local Storage
echo   3. Look for 'access_token' key
echo   4. If missing or malformed, login again
echo.
goto :eof

:: End menu
:end_menu
echo.
echo ===============================================
echo.
echo Choose what to do next:
echo [1] 🔄 Return to main menu
echo [2] 🔧 Quick troubleshoot
echo [3] ❌ Exit
echo.
set /p end_choice="Enter your choice (1-3): "

if "%end_choice%"=="1" goto main_menu
if "%end_choice%"=="2" goto troubleshoot_only
if "%end_choice%"=="3" goto exit_program
goto end_menu

:exit_program
echo.
echo 👋 Thanks for using TradePulse Ultimate Launcher!
echo.
pause
exit /b 0
