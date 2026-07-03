#!/usr/bin/env node

/**
 * Script untuk migrasi data dari db.json ke Firebase
 * 
 * Usage:
 *   node scripts/migrate-to-firebase.js
 * 
 * Pastikan serviceAccountKey.json sudah ada di root project
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'db.json');
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'serviceAccountKey.json');

// Color codes untuk terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function migrate() {
  try {
    log('\n🔥 Firebase Data Migration Tool', 'blue');
    log('=====================================\n', 'blue');

    // Check if service account key exists
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      log('❌ Error: serviceAccountKey.json not found!', 'red');
      log('Please download it from Firebase Console > Project Settings > Service Accounts', 'yellow');
      process.exit(1);
    }

    // Check if db.json exists
    if (!fs.existsSync(DATA_PATH)) {
      log('❌ Error: data/db.json not found!', 'red');
      process.exit(1);
    }

    log('📁 Loading data from db.json...', 'blue');
    const rawData = fs.readFileSync(DATA_PATH, 'utf8');
    const data = JSON.parse(rawData);
    log('✅ Data loaded successfully\n', 'green');

    // Initialize Firebase
    log('🔐 Initializing Firebase Admin SDK...', 'blue');
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: serviceAccount.databaseURL,
      });
    }
    
    const db = admin.database();
    log('✅ Firebase initialized successfully\n', 'green');

    // Migrate users
    if (data.users && Array.isArray(data.users)) {
      log('👥 Migrating users...', 'blue');
      for (const user of data.users) {
        const userId = user.id || `user_${Date.now()}`;
        await db.ref(`users/${userId}`).set({
          uid: userId,
          email: user.email || '',
          nama: user.nama || '',
          password: user.password || '', // ⚠️ Don't use hashed password from old DB
          createdAt: new Date().toISOString(),
        });
      }
      log(`✅ ${data.users.length} users migrated\n`, 'green');
    }

    // Migrate products
    if (data.products && Array.isArray(data.products)) {
      log('📦 Migrating products...', 'blue');
      for (const product of data.products) {
        const productId = String(product.id);
        await db.ref(`products/${productId}`).set({
          id: product.id,
          nama_produk: product.nama_produk || '',
          kategori: product.kategori || '',
          harga: product.harga || 0,
          foto_produk: product.foto_produk || '',
          deskripsi: product.deskripsi || '',
          stock: product.stock || 0,
          emoji: product.emoji || '',
          hot: product.hot || false,
          reviews: product.review && Array.isArray(product.review)
            ? product.review.reduce((acc, rev) => {
                const revId = rev.id || `review_${Date.now()}`;
                acc[revId] = {
                  id: rev.id,
                  productId: rev.productId,
                  userId: rev.userId,
                  name: rev.name || '',
                  rating: rev.rating || 0,
                  text: rev.text || '',
                  createdAt: rev.createdAt || new Date().toISOString(),
                };
                return acc;
              }, {})
            : {},
        });
      }
      log(`✅ ${data.products.length} products migrated\n`, 'green');
    }

    // Migrate admin
    if (data.admin) {
      log('👨‍💼 Migrating admin credentials...', 'blue');
      await db.ref('admin/superadmin').set({
        username: data.admin.username || 'admin',
        password: data.admin.password || 'admin123',
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
      log('✅ Admin credentials migrated\n', 'green');
    }

    log('🎉 Migration completed successfully!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Update your HTML files to include Firebase SDK', 'yellow');
    log('2. Update firebase-config.js with your Firebase credentials', 'yellow');
    log('3. Test the application in multiple browsers to verify sync', 'yellow');
    log('4. Update Firebase Security Rules for production', 'yellow');
    log('\nFor detailed instructions, see README-FIREBASE.md', 'blue');
    log('', 'reset');

    process.exit(0);
  } catch (error) {
    log(`\n❌ Migration error: ${error.message}`, 'red');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run migration
migrate();
