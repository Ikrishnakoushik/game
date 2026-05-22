@echo off
echo.
echo  Starting KarmaCoins backend + ngrok tunnel...
echo.

REM Start backend server in a new window
start "KarmaCoins Backend" cmd /k "node src/server.js"

REM Wait 2 seconds for server to start
timeout /t 2 /nobreak >nul

REM Start ngrok tunnel in a new window
start "ngrok Tunnel" cmd /k "ngrok http 3000"

echo.
echo  Both windows opened.
echo  Copy the https://xxxx.ngrok-free.app URL from the ngrok window.
echo  Paste it into:
echo    1. Razorpay dashboard webhook URL
echo    2. habitcoins/lib/services/payment_service.dart kBaseUrl
echo.
pause
