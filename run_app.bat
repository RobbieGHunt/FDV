@echo off
title Flexible Data Viewer (FDV Desktop Application)
echo Launching Flexible Data Viewer Desktop Application...
set "PATH=C:\Users\robhu413\AppData\Local\anaconda3\Lib\site-packages\nodejs;%PATH%"
cd /d "%~dp0"
npm run start
