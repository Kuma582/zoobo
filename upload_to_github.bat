@echo off
echo ==========================================
echo    Uploading Zoobo Code to GitHub...
echo ==========================================
git add .
git commit -m "feat: Added UPIGateway payment integration and Wallet updates"
git push
echo ==========================================
echo    Upload Complete! 
echo    Your live website will update shortly.
echo ==========================================
pause
