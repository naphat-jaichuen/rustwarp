@echo off
REM Windows batch helper for cargo-make commands
REM Usage: make.bat [task] [args...]

REM Check if cargo-make is installed
where cargo-make >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: cargo-make is not installed or not in PATH
    echo Please install it with: cargo install cargo-make
    exit /b 1
)

REM If no arguments provided, show help
if "%1"=="" (
    echo RustWarp Build Helper (Windows)
    echo ================================
    echo.
    echo Usage: make.bat [task]
    echo.
    echo Common tasks:
    echo   info           - Show project information
    echo   build          - Build debug version
    echo   build-release  - Build release version
    echo   dev            - Start development server
    echo   test           - Run tests
    echo   dist           - Create distribution package
    echo   clean          - Clean build artifacts
    echo.
    echo For complete list of tasks:
    echo   make.bat --list-all-steps
    echo.
    echo Examples:
    echo   make.bat build
    echo   make.bat build-release
    echo   make.bat dev
    goto end
)

REM Handle special cases
if "%1"=="--list-all-steps" (
    cargo make --list-all-steps
    goto end
)

if "%1"=="--help" (
    cargo make info
    goto end
)

REM Execute the cargo-make command with all arguments
cargo make %*

:end
