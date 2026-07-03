/**
 * Firebase Configuration
 * Ganti dengan credentials Firebase Anda
 */

// Untuk Frontend (browser)
const firebaseConfig = {
  apiKey: "AIzaSyD_jG5K7mPqRlOpQrS8tVwXyZaBcDeFgHI",
  authDomain: "indah-beaute-atelier.firebaseapp.com",
  databaseURL: "https://indah-beaute-atelier-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "indah-beaute-atelier",
  storageBucket: "indah-beaute-atelier.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890ghij"
};

// Export untuk Node.js jika diperlukan
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig };
}

// Catatan: Ganti semua nilai di atas dengan credentials Firebase Anda yang sebenarnya
// Dapatkan dari: Firebase Console > Project Settings > General tab
