#!/bin/bash

# Firebase Integration Setup Script
# Script ini membantu setup Firebase integration

echo "🔥 Firebase Integration Setup"
echo "=============================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Dependencies installed!"
echo ""

# Create .env template if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env template..."
    cat > .env.template << 'EOF'
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
EOF
    echo "✅ Created .env.template"
    echo "⚠️  Please copy .env.template to .env and fill with your Firebase credentials"
fi

echo ""
echo "🚀 Next steps:"
echo "1. Get Firebase credentials from: https://console.firebase.google.com/"
echo "2. Copy firebaseConfig dari Firebase Console ke firebase-config.js"
echo "3. Download serviceAccountKey.json dari Firebase Console"
echo "4. Run migration: node scripts/migrate-to-firebase.js"
echo "5. Test: Open firebase-demo.html in browser"
echo ""
echo "📚 For detailed instructions, see README-FIREBASE.md"
echo ""
