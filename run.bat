@echo off
echo.
echo ======================================
echo MCP Server Builder - Starting Application
echo ======================================
echo.

REM Check if Maven is installed
where mvn >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Maven is not installed!
    echo.
    echo Please install Maven first:
    echo   Download from https://maven.apache.org/
    echo.
    pause
    exit /b 1
)

REM Check if Java is installed
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Java is not installed!
    echo.
    echo Please install Java 17 or higher:
    echo   Download from https://adoptium.net/
    echo.
    pause
    exit /b 1
)

echo [OK] Maven found
echo [OK] Java found
echo.

REM Build the application if not already built
if not exist "target\mcp-server-builder-1.0.0.jar" (
    echo Building application...
    call mvn clean package -DskipTests
    echo.
)

REM Start the application
echo Starting Spring Boot application on http://localhost:8080
echo Press Ctrl+C to stop
echo.

call mvn spring-boot:run
