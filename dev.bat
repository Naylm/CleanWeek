@echo off
echo Lancement CleanWeek (backend + frontend)...
start "Backend" cmd /k "cd backend && npm run dev"
start "Frontend" cmd /k "cd frontend && npm run dev"
