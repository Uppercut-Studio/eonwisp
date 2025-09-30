@echo off
echo Starting Android Sensor Debug Module...
echo.
echo Ensure your Android phone is connected with USB debugging enabled.
echo.

REM Stop any running Node server (kill node.exe silently)
taskkill /f /im node.exe >nul 2>&1

REM Start Node server (HTTP + WebSocket)
echo Starting sensor server...
start "" /b cmd /c "node android-sensor-server.js"

REM Wait a moment for server to boot
timeout /t 2 /nobreak >nul

REM Set up ADB reverse so the phone can reach ws/http at localhost:8080 over USB
echo Setting up ADB reverse tcp:8080 > tcp:8080 (if a device is connected)...
adb reverse tcp:8080 tcp:8080 >nul 2>&1

REM Try to open the mobile sender page on the device (Chrome)
echo Attempting to launch Mobile Sensor page on the phone...
adb shell am start -a android.intent.action.VIEW -d "http://localhost:8080/mobile-sensor.html" com.android.chrome >nul 2>&1

REM Open the desktop debug interface
echo Opening desktop debug interface...
start "" http://localhost:8080/android-sensor-debug.html

echo.
echo ========================================
echo  Android Sensor Debug Module Started!
echo ========================================
echo.
echo Server:  http://localhost:8080
echo Mobile:  http://localhost:8080/mobile-sensor.html
echo Desktop: http://localhost:8080/android-sensor-debug.html
echo.
echo Tip: If the phone does not auto-open Chrome, open it manually and visit:
echo       http://localhost:8080/mobile-sensor.html
echo.
echo To stop: Close this window or press Ctrl+C
echo.
pause
