@echo off
echo ========================================================
echo        Compiling TradeLens Java Backend (MySQL & JDBC)
echo ========================================================
if not exist "bin" mkdir bin
javac -cp "lib/*" -d bin src\com\tradelens\model\*.java src\com\tradelens\dao\*.java src\com\tradelens\server\handlers\*.java src\com\tradelens\simulator\*.java src\com\tradelens\util\*.java src\com\tradelens\server\*.java src\com\tradelens\Main.java
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Backend compiled successfully into bin\ directory.
) else (
    echo [ERROR] Compilation failed.
)
