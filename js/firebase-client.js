/**
 * Firebase Client Service untuk Frontend
 * Menyediakan real-time synchronization di berbagai device
 * 
 * Pastikan firebase-config.js sudah dimuat terlebih dahulu
 */

class FirebaseClient {
  constructor() {
    this.initialized = false;
    this.user = null;
    this.unsubscribers = [];
  }

  /**
   * Initialize Firebase SDK
   */
  async initialize() {
    try {
      if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded. Add <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"></script>');
        return false;
      }

      // Check if already initialized
      if (this.initialized) {
        return true;
      }

      // Initialize Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      this.db = firebase.database();
      this.auth = firebase.auth();
      this.storage = firebase.storage();

      // Setup auth state listener
      this.auth.onAuthStateChanged((user) => {
        this.user = user;
        if (user) {
          console.log('User logged in:', user.uid);
          this.syncUserData(user.uid);
        } else {
          console.log('User logged out');
        }
      });

      this.initialized = true;
      console.log('Firebase Client initialized successfully');
      return true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      return false;
    }
  }

  /**
   * Register user dengan email dan password
   */
  async registerUser(email, password, userData) {
    try {
      const credential = await this.auth.createUserWithEmailAndPassword(email, password);
      const userId = credential.user.uid;

      // Simpan user data ke database
      await this.db.ref(`users/${userId}`).set({
        uid: userId,
        email: email,
        nama: userData.nama || '',
        createdAt: new Date().toISOString(),
        ...userData
      });

      return { success: true, uid: userId };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Login user
   */
  async loginUser(email, password) {
    try {
      const credential = await this.auth.signInWithEmailAndPassword(email, password);
      return { success: true, uid: credential.user.uid };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout user
   */
  async logoutUser() {
    try {
      await this.auth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Sync user data from Firebase
   */
  syncUserData(userId) {
    this.db.ref(`users/${userId}`).on('value', (snapshot) => {
      const userData = snapshot.val();
      if (userData) {
        // Dispatch custom event untuk notifikasi perubahan data
        const event = new CustomEvent('userDataUpdated', { detail: userData });
        window.dispatchEvent(event);
      }
    });
  }

  /**
   * Get data real-time dengan listener
   */
  listenToData(path, callback) {
    const unsubscriber = this.db.ref(path).on('value', (snapshot) => {
      const data = snapshot.val();
      callback(data);
    });

    this.unsubscribers.push(() => {
      this.db.ref(path).off('value', unsubscriber);
    });

    return unsubscriber;
  }

  /**
   * Get data sekali
   */
  async getData(path) {
    try {
      const snapshot = await this.db.ref(path).get();
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting data:', error);
      return null;
    }
  }

  /**
   * Set data
   */
  async setData(path, data) {
    try {
      await this.db.ref(path).set(data);
      return { success: true };
    } catch (error) {
      console.error('Error setting data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update data
   */
  async updateData(path, updates) {
    try {
      await this.db.ref(path).update(updates);
      return { success: true };
    } catch (error) {
      console.error('Error updating data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove data
   */
  async removeData(path) {
    try {
      await this.db.ref(path).remove();
      return { success: true };
    } catch (error) {
      console.error('Error removing data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add data (push - auto generate key)
   */
  async addData(path, data) {
    try {
      const ref = await this.db.ref(path).push(data);
      return { success: true, key: ref.key };
    } catch (error) {
      console.error('Error adding data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Query data
   */
  async queryData(path, filters = {}) {
    try {
      let query = this.db.ref(path);

      if (filters.orderBy) {
        query = query.orderByChild(filters.orderBy);
      }

      if (filters.limitToFirst) {
        query = query.limitToFirst(filters.limitToFirst);
      } else if (filters.limitToLast) {
        query = query.limitToLast(filters.limitToLast);
      }

      const snapshot = await query.get();
      return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
      console.error('Error querying data:', error);
      return {};
    }
  }

  /**
   * Upload file ke Firebase Storage
   */
  async uploadFile(path, file) {
    try {
      const storageRef = this.storage.ref(path);
      const snapshot = await storageRef.put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();
      return { success: true, url: downloadURL };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete file dari Firebase Storage
   */
  async deleteFile(path) {
    try {
      await this.storage.ref(path).delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cleanup semua listeners
   */
  cleanup() {
    this.unsubscribers.forEach(unsubscriber => unsubscriber());
    this.unsubscribers = [];
  }

  /**
   * Get auth token untuk API calls
   */
  async getAuthToken() {
    if (this.user) {
      return await this.user.getIdToken();
    }
    return null;
  }
}

// Create singleton instance
const firebaseClient = new FirebaseClient();

// Auto-initialize saat script di-load
document.addEventListener('DOMContentLoaded', () => {
  firebaseClient.initialize();
});
