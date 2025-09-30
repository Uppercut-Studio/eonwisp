@echo off
echo Starting Android Sensor Debug Module...
echo.
echo Ensure your Android phone is connected with USB debugging enabled.
echo.

REM Stop any running Node server (kill node.exe silently)
echo Stopping any existing servers...
taskkill /f /im node.exe >nul 2>&1

REM Check if device is connected and list them
echo Checking for connected Android devices...
adb devices > device_list.txt 2>nul

REM Show available devices (skip header)
echo.
echo Available devices:
echo =================
type device_list.txt | findstr "device"
echo.

REM Ask user to input device ID (the part that was working)
echo Enter the device ID from the list above (e.g., 0083249899):
set /p "DEVICE_ID=Device ID: "

if "%DEVICE_ID%"=="" (
    echo ❌ No device ID entered!
    echo Please run the script again and enter your device ID.
    echo.
    del device_list.txt 2>nul
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo ✅ Using device: %DEVICE_ID%

REM Start Node server (HTTP + WebSocket)
echo ✅ Starting sensor server...
start "" /b cmd /c "node android-sensor-server.js"

REM Wait a moment for server to boot
echo ⏳ Waiting for server to start...
timeout /t 3 /nobreak >nul

REM Set up ADB reverse so the phone can reach ws/http at localhost:8080 over USB
echo 🔄 Setting up ADB reverse tcp:8080...
adb -s %DEVICE_ID% reverse tcp:8080 tcp:8080
if errorlevel 1 (
    echo ❌ Failed to set up ADB reverse!
    echo Make sure USB debugging is enabled and authorized.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
) else (
    echo ✅ ADB reverse setup successful
)

REM Get device IP for network fallback
for /f "tokens=2" %%i in ('adb -s %DEVICE_ID% shell ip route 2^>nul') do set DEVICE_IP=%%i

REM Try to open the mobile sender page on the device (Chrome)
echo 🚀 Attempting to launch Mobile Sensor page on the phone...
adb -s %DEVICE_ID% shell am start -a android.intent.action.VIEW -d "http://localhost:8080/mobile-sensor.html" com.android.chrome >nul 2>&1

if errorlevel 1 (
    echo ⚠️  Chrome launch failed, trying alternative browser...
    adb -s %DEVICE_ID% shell am start -a android.intent.action.VIEW -d "http://localhost:8080/mobile-sensor.html" >nul 2>&1
) else (
    echo ✅ Chrome launched successfully
)

REM Open the desktop debug interface
echo 🖥️  Opening desktop debug interface...
start "" http://localhost:8080/android-sensor-debug.html

echo.
echo ==================================================
echo     🎮 Android Sensor Debug Module Started!
echo ==================================================
echo.
echo 🌐 Server:      http://localhost:8080
echo 📱 Mobile:      http://localhost:8080/mobile-sensor.html
echo 🖥️  Desktop:     http://localhost:8080/android-sensor-debug.html
echo.
if defined DEVICE_IP (
    echo 🌍 Network URL: http://%DEVICE_IP%:8080/mobile-sensor.html
    echo    (Use this if localhost doesn't work)
    echo.
)

echo 💡 Tips:
echo    • If phone doesn't auto-open, manually visit: http://localhost:8080/mobile-sensor.html
echo    • For better performance, use the Network URL if localhost is laggy
echo    • Make sure your phone and PC are on the same WiFi network
echo.
echo To stop: Close this window or press Ctrl+C
echo.
echo Press any key to continue...
pause >nul
