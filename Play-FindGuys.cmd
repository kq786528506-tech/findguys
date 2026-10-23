@echo off
if exist "%~dp0dist\FindGuys.html" (
  start "Find Guys" "%~dp0dist\FindGuys.html"
  exit /b
)
if exist "%~dp0docs\FindGuys.html" (
  start "Find Guys" "%~dp0docs\FindGuys.html"
  exit /b
)
echo Run npm install and npm run build, then open this launcher again.
pause
