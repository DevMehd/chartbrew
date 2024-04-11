@echo off
cls
git pull

start cmd /k "cd server/ && call start.bat || cd server/ && npm run start-dev && cd ../"
cd client/
start cmd /k "call start.bat || npm run start && cd ../"