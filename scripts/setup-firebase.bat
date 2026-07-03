@echo off
REM Firebase Integration Setup Script for Windows
REM Script ini membantu setup Firebase integration

echo.
echo 🔥 Firebase Integration Setup
echo ==============================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
call npm install

echo.
echo ✅ Dependencies installed!
echo.

REM Create .env template if not exists
if not exist .env (
    echo 📝 Creating .env.template...
    (
        echo # Firebase Configuration
        echo FIREBASE_PROJECT_ID=your-project-id
        echo FIREBASE_PRIVATE_KEY_ID=your-key-id
        echo FIREBASE_PRIVATE_KEY=your-private-key
        echo FIREBASE_CLIENT_EMAIL=your-client-email
        echo FIREBASE_CLIENT_ID=your-client-id
        echo FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
        echo FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
        echo FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
    ) > .env.template
    echo ✅ Created .env.template
    echo ⚠️  Please copy .env.template to .env and fill with your Firebase credentials
)

echo.
echo 🚀 Next steps:
echo 1. Get Firebase credentials from: https://console.firebase.google.com/
echo 2. Copy firebaseConfig dari Firebase Console ke firebase-config.js
echo 3. Download serviceAccountKey.json dari Firebase Console
echo 4. Run migration: node scripts/migrate-to-firebase.js
echo 5. Test: Open firebase-demo.html in browser
echo.
echo 📚 For detailed instructions, see README-FIREBASE.md
echo.
pause
