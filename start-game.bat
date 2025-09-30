@echo off
echo ========================================
echo   Starting Eonwisp Game Server
echo ========================================
echo.
echo Server will start on http://localhost:8080
echo Your browser will open automatically...
echo.
echo Press Ctrl+C to stop the server when done
echo ========================================
echo.

REM Start the server and open browser
start http://localhost:8080
npx http-server -p 8080 -c-1 -o

pause
