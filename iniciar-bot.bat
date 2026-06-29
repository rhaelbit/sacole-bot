@echo off
echo.
echo ======================================
echo   SACOLE BOT - Iniciando...
echo ======================================
echo.
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao esta instalado!
    echo Baixe em: https://nodejs.org
    pause
    exit /b
)
if exist ".env" (
    for /f "tokens=1,2 delims==" %%a in (.env) do set %%a=%%b
)
if "%GEMINI_API_KEY%"=="" (
    echo Primeira vez? Configure sua chave do Google.
    echo 1. Acesse: https://aistudio.google.com/apikey
    echo 2. Copie a chave gerada
    echo 3. Cole aqui embaixo:
    echo.
    set /p GEMINI_API_KEY=Cole sua chave aqui: 
    echo GEMINI_API_KEY=%GEMINI_API_KEY%> .env
    echo Chave salva!
    echo.
)
if not exist "node_modules" (
    echo Instalando dependencias...
    npm install
    echo.
)
echo Abrindo o navegador...
start http://localhost:3000
echo Iniciando o bot...
echo Para parar, feche esta janela ou pressione Ctrl+C
echo.
node servidor.js
pause
