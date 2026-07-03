/**
 * Firebase Integration Helper
 * Utility functions untuk mempermudah integrasi Firebase ke halaman existing
 * 
 * Import di setiap halaman untuk akses helper functions
 */

/**
 * Initialize Firebase dan setup event listeners
 * Call ini di DOMContentLoaded atau awal script
 */
async function initializeFirebaseIntegration() {
  return new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', async () => {
      // Wait for firebaseClient to initialize
      let attempts = 0;
      const checkInterval = setInterval(() => {
        if (typeof firebaseClient !== 'undefined' && firebaseClient.initialized) {
          clearInterval(checkInterval);
          
          // Setup user state listener
          setupUserStateListener();
          
          // Setup connection state listener
          setupConnectionStateListener();
          
          console.log('✅ Firebase integration initialized');
          resolve(true);
        } else if (attempts++ > 50) { // 5 seconds timeout
          clearInterval(checkInterval);
          console.warn('⚠️ Firebase initialization timeout');
          resolve(false);
        }
      }, 100);
    });
  });
}

/**
 * Setup user state listener
 * Update UI dan localStorage saat user login/logout
 */
function setupUserStateListener() {
  onAuthStateChanged((user) => {
    if (user) {
      // User logged in
      console.log('👤 User logged in:', user.email);
      
      // Update UI
      updateUserUIElements(user);
      
      // Save to localStorage
      try {
        localStorage.setItem('currentFirebaseUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        }));
      } catch(e) {}
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('firebaseUserLoggedIn', { 
        detail: user 
      }));
    } else {
      // User logged out
      console.log('👤 User logged out');
      
      // Update UI
      updateUserUIElements(null);
      
      // Clear localStorage
      try {
        localStorage.removeItem('currentFirebaseUser');
      } catch(e) {}
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('firebaseUserLoggedOut'));
    }
  });
}

/**
 * Setup connection state listener
 * Track online/offline status
 */
function setupConnectionStateListener() {
  // Check initial state
  if (typeof firebaseClient !== 'undefined' && firebaseClient.db) {
    firebaseClient.db.ref('.info/connected').on('value', (snapshot) => {
      if (snapshot.val()) {
        console.log('🟢 Firebase connected');
        updateConnectionStatus(true);
      } else {
        console.log('🔴 Firebase disconnected');
        updateConnectionStatus(false);
      }
    });
  }
}

/**
 * Update UI elements saat user state berubah
 */
function updateUserUIElements(user) {
  // Update user info elements
  const userNameEls = document.querySelectorAll('[data-firebase-username]');
  const userEmailEls = document.querySelectorAll('[data-firebase-email]');
  const loginBtnEls = document.querySelectorAll('[data-firebase-login-btn]');
  const logoutBtnEls = document.querySelectorAll('[data-firebase-logout-btn]');
  const userOnlyEls = document.querySelectorAll('[data-firebase-user-only]');
  const guestOnlyEls = document.querySelectorAll('[data-firebase-guest-only]');

  if (user) {
    // User logged in
    userNameEls.forEach(el => {
      el.textContent = user.displayName || user.email;
    });
    
    userEmailEls.forEach(el => {
      el.textContent = user.email;
    });
    
    loginBtnEls.forEach(el => {
      el.style.display = 'none';
    });
    
    logoutBtnEls.forEach(el => {
      el.style.display = 'block';
    });
    
    userOnlyEls.forEach(el => {
      el.style.display = 'block';
    });
    
    guestOnlyEls.forEach(el => {
      el.style.display = 'none';
    });
  } else {
    // User not logged in
    loginBtnEls.forEach(el => {
      el.style.display = 'block';
    });
    
    logoutBtnEls.forEach(el => {
      el.style.display = 'none';
    });
    
    userOnlyEls.forEach(el => {
      el.style.display = 'none';
    });
    
    guestOnlyEls.forEach(el => {
      el.style.display = 'block';
    });
  }
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(isConnected) {
  const statusEls = document.querySelectorAll('[data-firebase-status]');
  
  statusEls.forEach(el => {
    if (isConnected) {
      el.classList.remove('disconnected');
      el.classList.add('connected');
      el.textContent = '🟢 Connected';
    } else {
      el.classList.remove('connected');
      el.classList.add('disconnected');
      el.textContent = '🔴 Offline';
    }
  });
}

/**
 * Require user login - redirect ke login page jika belum login
 */
function requireLogin() {
  const user = getFirebaseUser();
  if (!user) {
    // Redirect ke login dengan return URL
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `/login.html?returnUrl=${returnUrl}`;
    return false;
  }
  return true;
}

/**
 * Setup auto-logout pada inactivity
 */
function setupAutoLogout(minutesOfInactivity = 30) {
  let inactivityTimer;
  
  const resetTimer = () => {
    clearTimeout(inactivityTimer);
    
    inactivityTimer = setTimeout(async () => {
      const user = getFirebaseUser();
      if (user) {
        console.log('Auto-logout due to inactivity');
        await firebaseLogout();
        alert('Session expired due to inactivity');
        window.location.href = '/login.html';
      }
    }, minutesOfInactivity * 60 * 1000);
  };
  
  // Reset timer on user activity
  document.addEventListener('mousemove', resetTimer);
  document.addEventListener('keypress', resetTimer);
  document.addEventListener('click', resetTimer);
  document.addEventListener('scroll', resetTimer);
  
  // Initial timer
  resetTimer();
}

/**
 * Listen ke user data dan sync ke UI
 */
function listenToUserProfile(userId, callback) {
  listenToData(`users/${userId}`, (userData) => {
    if (userData) {
      // Update UI elements dengan user profile
      const profileNameEls = document.querySelectorAll('[data-user-profile-name]');
      const profilePhoneEls = document.querySelectorAll('[data-user-profile-phone]');
      const profileAddressEls = document.querySelectorAll('[data-user-profile-address]');
      
      profileNameEls.forEach(el => {
        el.textContent = userData.nama || '';
      });
      
      profilePhoneEls.forEach(el => {
        el.textContent = userData.phone || '';
      });
      
      profileAddressEls.forEach(el => {
        el.textContent = userData.address || '';
      });
      
      if (callback) callback(userData);
    }
  });
}

/**
 * Setup real-time cart sync
 */
function setupCartListener(userId, callback) {
  listenToData(`carts/${userId}`, (cart) => {
    if (cart && cart.items) {
      // Update cart count di UI
      const cartCountEls = document.querySelectorAll('[data-cart-count]');
      const itemCount = Object.keys(cart.items).length;
      
      cartCountEls.forEach(el => {
        el.textContent = itemCount;
      });
      
      if (callback) callback(cart);
    } else {
      // Empty cart
      const cartCountEls = document.querySelectorAll('[data-cart-count]');
      cartCountEls.forEach(el => {
        el.textContent = '0';
      });
      
      if (callback) callback(null);
    }
  });
}

/**
 * Setup real-time products listener
 */
function setupProductsListener(callback) {
  listenToData('products', (products) => {
    if (products) {
      // Convert to array
      const productList = Object.entries(products).map(([id, product]) => ({
        id,
        ...product
      }));
      
      if (callback) callback(productList);
    }
  });
}

/**
 * Setup real-time orders listener (for admin)
 */
function setupOrdersListener(callback) {
  listenToData('orders', (orders) => {
    if (orders) {
      // Convert to array
      const orderList = Object.entries(orders).map(([id, order]) => ({
        id,
        ...order
      }));
      
      if (callback) callback(orderList);
    }
  });
}

/**
 * Handle Firebase errors dengan user-friendly messages
 */
function handleFirebaseError(error) {
  console.error('Firebase error:', error);
  
  let userMessage = 'An error occurred';
  
  if (error.code) {
    switch (error.code) {
      case 'auth/user-not-found':
        userMessage = 'User tidak ditemukan';
        break;
      case 'auth/wrong-password':
        userMessage = 'Password salah';
        break;
      case 'auth/email-already-in-use':
        userMessage = 'Email sudah terdaftar';
        break;
      case 'auth/weak-password':
        userMessage = 'Password terlalu lemah (minimal 6 karakter)';
        break;
      case 'auth/invalid-email':
        userMessage = 'Format email tidak valid';
        break;
      case 'permission-denied':
        userMessage = 'Anda tidak punya akses ke data ini';
        break;
      case 'network-request-failed':
        userMessage = 'Koneksi internet gagal';
        break;
      default:
        userMessage = error.message || 'Terjadi kesalahan';
    }
  }
  
  return userMessage;
}

/**
 * Show loading indicator
 */
function showLoading(message = 'Loading...') {
  const loader = document.createElement('div');
  loader.id = 'firebase-loader';
  loader.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  loader.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 8px; text-align: center;">
      <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
      <p>${message}</p>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  document.body.appendChild(loader);
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  const loader = document.getElementById('firebase-loader');
  if (loader) loader.remove();
}

/**
 * Toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Export untuk CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeFirebaseIntegration,
    setupUserStateListener,
    setupConnectionStateListener,
    updateUserUIElements,
    updateConnectionStatus,
    requireLogin,
    setupAutoLogout,
    listenToUserProfile,
    setupCartListener,
    setupProductsListener,
    setupOrdersListener,
    handleFirebaseError,
    showLoading,
    hideLoading,
    showToast,
  };
}
