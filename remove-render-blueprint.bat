@echo off
echo 🗑️ Removing complex Render Blueprint configuration...
echo.

if exist render.yaml (
    del render.yaml
    echo ✅ render.yaml deleted
) else (
    echo ℹ️ render.yaml not found
)

echo.
echo 🎯 Now you can deploy manually on Render:
echo.
echo 1. Go to https://dashboard.render.com
echo 2. Create PostgreSQL database
echo 3. Create backend web service (Python)
echo 4. Create frontend web service (Node)
echo.
echo 📚 See DEPLOY_ALTERNATIVES.md for detailed steps
echo.
pause
