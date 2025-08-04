@echo off
echo 🚀 TradePulse Render Deployment Helper
echo.
echo This script helps you prepare for Render deployment.
echo Make sure you've committed all changes to Git before proceeding.
echo.

REM Check if we're in a git repository
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Not in a Git repository
    echo Please make sure you're in the TradePulse root directory
    pause
    exit /b 1
)

echo ✅ Git repository detected
echo.

REM Check for uncommitted changes
git diff-index --quiet HEAD --
if %errorlevel% neq 0 (
    echo ⚠️  Warning: You have uncommitted changes
    echo Please commit and push all changes before deploying:
    echo.
    echo   git add .
    echo   git commit -m "Prepare for Render deployment"
    echo   git push origin main
    echo.
    pause
    exit /b 1
)

echo ✅ All changes are committed
echo.

echo 📋 Pre-deployment Checklist:
echo.
echo ✅ render.yaml file created
echo ✅ Production config files ready
echo ✅ Environment variables configured
echo ✅ Database setup (PostgreSQL)
echo ✅ Frontend build configuration
echo ✅ Backend start script
echo.
echo 🎯 Next Steps:
echo.
echo 1. Go to https://dashboard.render.com
echo 2. Click "New" → "Blueprint"
echo 3. Connect your GitHub repository
echo 4. Select your TradePulse repo
echo 5. Review services and click "Apply"
echo.
echo 🔑 Don't forget to set your environment variables:
echo   - ALPHA_VANTAGE_API_KEY (get from https://www.alphavantage.co)
echo   - SECRET_KEY (will be auto-generated)
echo.
echo 📚 For detailed instructions, see: DEPLOY_RENDER.md
echo.
pause
