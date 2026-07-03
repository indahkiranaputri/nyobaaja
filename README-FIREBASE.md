# Firebase Integration Guide

Panduan lengkap untuk mengintegrasikan Firebase ke aplikasi Indah Beauté Atelier agar data tersinkronisasi di berbagai device.

## 1. Setup Firebase Project

### Step 1: Buat Project Firebase
1. Kunjungi [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add Project"
3. Masukkan nama project: `indah-beaute-atelier`
4. Pilih region: Indonesia (asia-southeast1)
5. Klik "Create Project"

### Step 2: Enable Services
1. Di Firebase Console, klik menu di sisi kiri
2. Enable berikut:
   - **Realtime Database** (Database)
   - **Authentication** (Auth)
   - **Storage** (File Storage untuk gambar produk)

### Step 3: Setup Realtime Database
1. Klik "Realtime Database"
2. Klik "Create Database"
3. Pilih lokasi: `asia-southeast1`
4. Mode awal: "Start in test mode" (untuk development)
5. Klik "Enable"

### Step 4: Setup Authentication
1. Klik "Authentication"
2. Klik "Get Started"
3. Di tab "Sign-in method", enable:
   - Email/Password
   - Google (optional)

### Step 5: Setup Storage
1. Klik "Storage"
2. Klik "Get Started"
3. Pilih lokasi: `asia-southeast1`
4. Mode awal: "Start in test mode"
5. Klik "Enable"

## 2. Dapatkan Credentials

### Untuk Frontend
1. Klik "Project Settings" (⚙️) → General
2. Di bagian "Your apps", klik ikon Web (</>)
3. Daftarkan nama app: "Indah Beauté Atelier"
4. Copy config JavaScript dan paste ke `firebase-config.js`

Contoh config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD_jG5K7mPqRlOpQrS8tVwXyZaBcDeFgHI",
  authDomain: "indah-beaute-atelier.firebaseapp.com",
  databaseURL: "https://indah-beaute-atelier-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "indah-beaute-atelier",
  storageBucket: "indah-beaute-atelier.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890ghij"
};
```

### Untuk Backend (Node.js)
1. Klik "Project Settings" → "Service Accounts"
2. Klik "Generate New Private Key"
3. File `serviceAccountKey.json` akan download
4. Taruh file ini di root project directory (`.gitignore` sudah include)

## 3. Update File HTML

Tambahkan script Firebase di semua file HTML, sebelum closing `</body>` tag:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js"></script>

<!-- Firebase Configuration -->
<script src="firebase-config.js"></script>

<!-- Firebase Client Service -->
<script src="js/firebase-client.js"></script>

<!-- Firebase API Layer -->
<script src="js/firebase-api.js"></script>

<!-- Existing API Client (tetap kompatibel) -->
<script src="js/api_client.js"></script>
```

## 4. Database Structure di Firebase

Struktur data yang akan digunakan:

```
root/
├── users/
│   └── {userId}/
│       ├── uid: string
│       ├── email: string
│       ├── nama: string
│       ├── phone: string
│       ├── address: string
│       ├── createdAt: timestamp
│       └── role: admin/customer
├── products/
│   └── {productId}/
│       ├── id: number
│       ├── nama_produk: string
│       ├── kategori: string
│       ├── harga: number
│       ├── foto_produk: string (Firebase Storage URL)
│       ├── deskripsi: string
│       ├── stock: number
│       ├── emoji: string
│       ├── hot: boolean
│       └── reviews/
│           └── {reviewId}/
│               ├── userId: string
│               ├── rating: number
│               ├── text: string
│               └── createdAt: timestamp
├── carts/
│   └── {userId}/
│       ├── items/
│       │   └── {itemId}/
│       │       ├── productId: string
│       │       ├── quantity: number
│       │       └── price: number
│       └── updatedAt: timestamp
├── orders/
│   └── {orderId}/
│       ├── userId: string
│       ├── customerName: string
│       ├── customerPhone: string
│       ├── customerAddress: string
│       ├── items: array
│       ├── subtotal: number
│       ├── discount: number
│       ├── shipping: number
│       ├── total: number
│       ├── status: pending/processing/shipped/delivered
│       ├── payment: method
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
└── admin/
    └── {adminId}/
        ├── email: string
        ├── role: admin
        ├── createdAt: timestamp
```

## 5. Migrasi Data Existing

Untuk migrasi data dari db.json ke Firebase:

### Script Node.js untuk migrasi:
```bash
node scripts/migrate-to-firebase.js
```

Akan dibuat file `migrate-to-firebase.js` untuk otomatis migrasi data.

## 6. Menggunakan Firebase di Client

### Login dengan Firebase:
```javascript
// Login
async function handleLogin(email, password) {
  const result = await firebaseLogin(email, password);
  if (result.success) {
    console.log('Login berhasil');
    // Redirect ke dashboard
    window.location.href = '/index.html';
  } else {
    console.error('Login gagal:', result.error);
  }
}

// Register
async function handleRegister(email, password, nama) {
  const result = await firebaseRegister(email, password, { nama });
  if (result.success) {
    console.log('Register berhasil');
  } else {
    console.error('Register gagal:', result.error);
  }
}

// Logout
async function handleLogout() {
  await firebaseLogout();
  window.location.href = '/login.html';
}
```

### Listen ke data real-time:
```javascript
// Listen ke semua produk (auto-update saat ada perubahan)
listenToData('products', (products) => {
  console.log('Produk updated:', products);
  renderProducts(products);
});

// Listen ke keranjang user
const user = getFirebaseUser();
if (user) {
  listenToData(`carts/${user.uid}`, (cart) => {
    console.log('Keranjang updated:', cart);
    renderCart(cart);
  });
}
```

### Get data sekali:
```javascript
async function getProducts() {
  try {
    const products = await firebaseRequest('products', 'GET');
    console.log('Produk:', products);
    return products;
  } catch(error) {
    console.error('Error:', error);
  }
}
```

### Update data:
```javascript
async function updateCart(userId, cartData) {
  try {
    await firebaseRequest(`carts/${userId}`, 'PATCH', {
      items: cartData.items,
      updatedAt: new Date().toISOString()
    });
    console.log('Keranjang updated');
  } catch(error) {
    console.error('Error:', error);
  }
}
```

### Upload gambar:
```javascript
async function uploadProductImage(file) {
  try {
    const timestamp = Date.now();
    const path = `products/${timestamp}_${file.name}`;
    const result = await uploadToFirebase(path, file);
    if (result.success) {
      console.log('Upload berhasil:', result.url);
      return result.url;
    }
  } catch(error) {
    console.error('Upload error:', error);
  }
}
```

## 7. Rules Security Firebase

### Untuk Development (Test Mode):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

### Untuk Production (Recommended):
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "products": {
      ".read": true,
      ".write": "root.child('admin').child(auth.uid).exists()"
    },
    "carts": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "orders": {
      "$orderId": {
        ".read": "root.child('orders').child($orderId).child('userId').val() === auth.uid || root.child('admin').child(auth.uid).exists()",
        ".write": "root.child('orders').child($orderId).child('userId').val() === auth.uid || root.child('admin').child(auth.uid).exists()"
      }
    }
  }
}
```

## 8. Environment Variables (untuk production)

Buat file `.env` di root:
```
FIREBASE_PROJECT_ID=indah-beaute-atelier
FIREBASE_PRIVATE_KEY_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
FIREBASE_AUTH_URI=...
FIREBASE_TOKEN_URI=...
FIREBASE_DATABASE_URL=https://indah-beaute-atelier-default-rtdb.asia-southeast1.firebasedatabase.app
```

## 9. Install Dependencies

```bash
npm install
```

## 10. Testing

Buka aplikasi di berbagai device:
1. Device 1: Tambah produk ke keranjang
2. Device 2: Refresh halaman - keranjang akan update otomatis
3. Semua device akan sync real-time tanpa perlu reload!

## 11. Troubleshooting

**Firebase SDK tidak load:**
- Pastikan CDN links sudah correct
- Check browser console untuk error messages

**Data tidak tersinkronisasi:**
- Pastikan user sudah login (authenticated)
- Check Firebase console untuk melihat data

**Upload gambar gagal:**
- Check Storage Rules di Firebase Console
- Pastikan file size tidak lebih dari limit

**Performa lambat:**
- Limit jumlah listeners yang aktif
- Use `limitToFirst()` atau `limitToLast()` untuk queries
- Consider menggunakan offline persistence

## 12. File-file yang Ditambahkan

- `firebase-config.js` - Konfigurasi Firebase
- `firebase-service.js` - Backend Firebase Service
- `js/firebase-client.js` - Frontend Firebase Client
- `js/firebase-api.js` - API Layer untuk Firebase
- `scripts/migrate-to-firebase.js` - Script migrasi data (akan dibuat)
- `README-FIREBASE.md` - File ini

Untuk pertanyaan lebih lanjut, lihat dokumentasi resmi Firebase: https://firebase.google.com/docs
