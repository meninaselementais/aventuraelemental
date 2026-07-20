@echo off
title Aventura das ELEMENTAIS - Link publico
cd /d "%~dp0"
if not exist "node_modules\vite\bin\vite.js" call npm install
node "%~dp0compartilhar-jogo.mjs"
if errorlevel 1 pause
