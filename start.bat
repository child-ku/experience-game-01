@echo off
echo 启动 Markdown 笔记管理工具...
echo.
echo 请选择启动方式：
echo 1. 使用浏览器直接打开 (推荐)
echo 2. 使用开发服务器 (需要 Node.js)
echo.
set /p choice=请输入选择 (1 或 2): 

if "%choice%"=="1" (
    echo 正在打开浏览器...
    start index-cdn.html
) else if "%choice%"=="2" (
    echo 正在检查 Node.js...
    node --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo 错误: 未安装 Node.js，请先安装 Node.js
        echo 下载地址: https://nodejs.org/
        pause
        exit /b 1
    )
    echo 正在安装依赖...
    npm install
    echo 正在启动开发服务器...
    npm run dev
) else (
    echo 无效的选择
    pause
    exit /b 1
)

pause