@echo off
echo ========================================================
echo        Starting TradeLens Backend Server (Port 8080)
echo ========================================================
if not exist "bin\com\tradelens\Main.class" (
    echo [INFO] Bin folder not found. Compiling first...
    call compile.bat
)
java -cp "bin;lib/*" com.tradelens.Main 8080
