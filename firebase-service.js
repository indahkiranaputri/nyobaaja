const admin = require('firebase-admin');
const path = require('path');

/**
 * Firebase Admin Initialization
 * Ganti serviceAccountKey.json dengan kredensial firebase Anda
 */

let db = null;
let auth = null;
let storage = null;

function initializeFirebase() {
  try {
    // Option 1: Menggunakan service account key file
    const serviceAccountPath = process.env.FIREBASE_KEY_PATH || path.join(__dirname, 'serviceAccountKey.json');
    
    // Option 2: Menggunakan environment variables (untuk production)
    if (process.env.FIREBASE_PROJECT_ID) {
      const serviceAccount = {
        type: process.env.FIREBASE_TYPE || "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    } else {
      // Development: gunakan serviceAccountKey.json
      try {
        const serviceAccountKey = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountKey),
          databaseURL: serviceAccountKey.databaseURL || 'https://your-project.firebaseio.com',
        });
      } catch (e) {
        console.warn('Firebase key file not found. Using environment variables or offline mode.');
        admin.initializeApp();
      }
    }
    
    db = admin.database();
    auth = admin.auth();
    storage = admin.storage();
    
    console.log('Firebase initialized successfully');
    return { db, auth, storage };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
}

function getAuth() {
  if (!auth) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return auth;
}

function getStorage() {
  if (!storage) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return storage;
}

// Fungsi helper untuk operasi Realtime Database
const dbHelpers = {
  // Set data
  async setData(path, data) {
    return await getDatabase().ref(path).set(data);
  },

  // Get data
  async getData(path) {
    const snapshot = await getDatabase().ref(path).get();
    return snapshot.exists() ? snapshot.val() : null;
  },

  // Update data
  async updateData(path, updates) {
    return await getDatabase().ref(path).update(updates);
  },

  // Remove data
  async removeData(path) {
    return await getDatabase().ref(path).remove();
  },

  // Listen to data changes (for real-time sync)
  onDataChange(path, callback) {
    return getDatabase().ref(path).on('value', (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
  },

  // Listen to data changes once
  async getDataOnce(path) {
    const snapshot = await getDatabase().ref(path).once('value');
    return snapshot.exists() ? snapshot.val() : null;
  },

  // Push new data (auto-generate key)
  async pushData(path, data) {
    const ref = getDatabase().ref(path).push();
    await ref.set(data);
    return ref.key;
  },

  // Query data
  async queryData(path, orderBy, orderDirection = 'asc', limitToN = null) {
    let query = getDatabase().ref(path);
    
    if (orderBy) {
      if (orderDirection === 'desc') {
        query = query.orderByChild(orderBy);
      } else {
        query = query.orderByChild(orderBy);
      }
    }
    
    if (limitToN) {
      query = query.limitToFirst(limitToN);
    }
    
    const snapshot = await query.once('value');
    return snapshot.exists() ? snapshot.val() : {};
  },
};

module.exports = {
  initializeFirebase,
  getDatabase,
  getAuth,
  getStorage,
  dbHelpers,
};
