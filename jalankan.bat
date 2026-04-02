@echo off
echo ==================================================
echo MEMULAI APLIKASI KASIR POS SYSTEM...
echo ==================================================
echo.
echo Mohon tunggu sebentar, sedang menyalakan sistem...
docker-compose down
docker-compose up --build -d
echo.
echo ==================================================
echo APLIKASI KASIR BERHASIL DINYALAKAN!
echo ==================================================
echo.
echo Silakan buka browser Anda (Google Chrome / Edge)
echo Dan ketikkan alamat: http://localhost:3000
echo.
pause
