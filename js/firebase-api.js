/**
 * Updated API Client untuk Firebase Integration
 * Kompatibel dengan eksisting API dan Firebase
 */

const API_BASE_URL = (window.API_BASE && String(window.API_BASE).replace(/\/$/, '')) || 
                     (window.__API_BASE__ && String(window.__API_BASE__).replace(/\/$/, '')) || 
                     (window.location.origin + '/api');

const STORAGE_AUTH_TOKEN = 'IndahBeauteAuthToken';
const STORAGE_ADMIN_TOKEN = 'IndahBeauteAdminToken';

// Firebase token untuk async operations
let firebaseIdToken = null;

function safeSetItem(k, v) { try { localStorage.setItem(k, v); } catch(e) { } }
function safeGetItem(k) { try { return localStorage.getItem(k); } catch(e) { return null; } }
function safeRemoveItem(k) { try { localStorage.removeItem(k); } catch(e) { } }

function getAuthToken() {
  return (typeof safeGetItem === 'function' ? safeGetItem(STORAGE_AUTH_TOKEN) : localStorage.getItem(STORAGE_AUTH_TOKEN)) || null;
}

function setAuthToken(token) {
  if (!token) return safeRemoveItem(STORAGE_AUTH_TOKEN);
  try { (typeof safeSetItem === 'function' ? safeSetItem(STORAGE_AUTH_TOKEN, token) : localStorage.setItem(STORAGE_AUTH_TOKEN, token)); } catch(e) {}
}

function clearAuthToken() {
  try { (typeof safeRemoveItem === 'function' ? safeRemoveItem(STORAGE_AUTH_TOKEN) : localStorage.removeItem(STORAGE_AUTH_TOKEN)); } catch(e) {}
}

function getAdminToken() {
  return (typeof safeGetItem === 'function' ? safeGetItem(STORAGE_ADMIN_TOKEN) : localStorage.getItem(STORAGE_ADMIN_TOKEN)) || null;
}

function setAdminToken(token) {
  if (!token) return safeRemoveItem(STORAGE_ADMIN_TOKEN);
  try { (typeof safeSetItem === 'function' ? safeSetItem(STORAGE_ADMIN_TOKEN, token) : localStorage.setItem(STORAGE_ADMIN_TOKEN, token)); } catch(e) {}
}

function clearAdminToken() {
  try { (typeof safeRemoveItem === 'function' ? safeRemoveItem(STORAGE_ADMIN_TOKEN) : localStorage.removeItem(STORAGE_ADMIN_TOKEN)); } catch(e) {}
}

/**
 * API Request dengan Firebase support
 */
async function apiRequest(path, method = 'GET', body = null, useAdmin = false) {
  const url = `${API_BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  
  // Gunakan Firebase token jika tersedia
  if (typeof firebaseClient !== 'undefined' && firebaseClient.user) {
    try {
      const fbToken = await firebaseClient.getAuthToken();
      if (fbToken) {
        headers['X-Firebase-Token'] = fbToken;
      }
    } catch(e) {}
  }
  
  const token = useAdmin ? getAdminToken() : getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const opts = { method, headers };
  if (body != null) opts.body = JSON.stringify(body);
  
  try {
    const res = await fetch(url, opts);
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'API request failed');
      err.status = res.status;
      throw err;
    }
    return data;
  } catch(error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Firebase API Request untuk operasi real-time
 */
async function firebaseRequest(path, method = 'GET', data = null) {
  if (typeof firebaseClient === 'undefined' || !firebaseClient.initialized) {
    throw new Error('Firebase Client not initialized');
  }

  if (!firebaseClient.user) {
    throw new Error('User not authenticated');
  }

  try {
    switch (method.toUpperCase()) {
      case 'GET':
        return await firebaseClient.getData(path);
      
      case 'POST':
      case 'PUT':
        if (method.toUpperCase() === 'PUT') {
          await firebaseClient.setData(path, data);
        } else {
          const result = await firebaseClient.addData(path, data);
          return { key: result.key };
        }
        return { success: true };
      
      case 'PATCH':
        await firebaseClient.updateData(path, data);
        return { success: true };
      
      case 'DELETE':
        await firebaseClient.removeData(path);
        return { success: true };
      
      default:
        throw new Error('Unsupported method: ' + method);
    }
  } catch(error) {
    console.error('Firebase request error:', error);
    throw error;
  }
}

/**
 * Listen ke perubahan data real-time dari Firebase
 */
function listenToData(path, callback) {
  if (typeof firebaseClient === 'undefined') {
    console.error('Firebase Client not available');
    return null;
  }
  return firebaseClient.listenToData(path, callback);
}

/**
 * Login dengan email dan password menggunakan Firebase
 */
async function firebaseLogin(email, password) {
  if (typeof firebaseClient === 'undefined') {
    throw new Error('Firebase Client not initialized');
  }
  
  const result = await firebaseClient.loginUser(email, password);
  if (result.success) {
    // Simpan user data ke localStorage
    const user = firebaseClient.getCurrentUser();
    setAuthToken(await user.getIdToken());
  }
  return result;
}

/**
 * Register dengan Firebase
 */
async function firebaseRegister(email, password, userData) {
  if (typeof firebaseClient === 'undefined') {
    throw new Error('Firebase Client not initialized');
  }
  
  return await firebaseClient.registerUser(email, password, userData);
}

/**
 * Logout dari Firebase
 */
async function firebaseLogout() {
  if (typeof firebaseClient === 'undefined') {
    return { success: true };
  }
  
  const result = await firebaseClient.logoutUser();
  if (result.success) {
    clearAuthToken();
  }
  return result;
}

/**
 * Get current Firebase user
 */
function getFirebaseUser() {
  if (typeof firebaseClient === 'undefined') {
    return null;
  }
  return firebaseClient.getCurrentUser();
}

/**
 * Listener untuk perubahan user authentication
 */
function onAuthStateChanged(callback) {
  if (typeof firebaseClient === 'undefined') {
    console.error('Firebase Client not available');
    return;
  }
  
  if (firebaseClient.auth) {
    firebaseClient.auth.onAuthStateChanged((user) => {
      callback(user);
    });
  }
}

/**
 * Upload file ke Firebase Storage
 */
async function uploadToFirebase(path, file) {
  if (typeof firebaseClient === 'undefined') {
    throw new Error('Firebase Client not initialized');
  }
  
  return await firebaseClient.uploadFile(path, file);
}

/**
 * Delete file dari Firebase Storage
 */
async function deleteFromFirebase(path) {
  if (typeof firebaseClient === 'undefined') {
    throw new Error('Firebase Client not initialized');
  }
  
  return await firebaseClient.deleteFile(path);
}
