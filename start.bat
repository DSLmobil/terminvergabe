@echo off
title Terminvergabe
cd /d "%~dp0"

echo Terminvergabe wird gestartet...

if not exist "node_modules" (
    echo Ersteinrichtung laeuft, bitte warten...
    npm install --silent
)

start "" http://localhost:5173
npm run dev
