@echo off
echo ==========================================
echo      Generando version para Internet...
echo ==========================================
echo.

cd /d "%~dp0"

echo 1. Verificando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo Error al instalar dependencias.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Construyendo el proyecto (Build)...
call npm run build
if %errorlevel% neq 0 (
    echo Error al construir el proyecto.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo      !LISTO! Carpeta 'dist' creada.
echo ==========================================
echo.
echo Ahora puedes subir la carpeta 'dist' a Netlify.
echo.
pause
