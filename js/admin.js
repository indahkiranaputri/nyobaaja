/* ============================================================
   admin.js — indah's Beauté Atelier Admin Dashboard (halaman terpisah)
   Menggunakan localStorage yang sama dengan toko (index.html)
   sehingga perubahan stok & data pesanan langsung sinkron.
   ============================================================ */

const STORAGE_PRODUCTS_KEY  = "Indah'sProducts";
const STORAGE_PRODUCTS_SYNC_KEY = "IndahBeauteProducts";
const STORAGE_ORDERS_KEY    = "Indah'sOrders";
const STORAGE_ALL_ORDERS    = "Indah'sAllOrders";
const ADMIN_SESSION_KEY     = "Indah'sAdminSession";
const ADMIN_PASSWORD        = "admin123";

let products = [];
let orders = [];

function safeSetItem(k, v) { try { localStorage.setItem(k, v); } catch(e) {} }
function safeGetItem(k) { try { return localStorage.getItem(k); } catch(e) { return null; } }

function formatPrice(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

function normalizeProductForAdmin(item, fallbackId = null) {
  const id = Number(item?.id ?? fallbackId ?? 0);
  const normalizedId = Number.isFinite(id) && id > 0 ? id : (fallbackId || Date.now());
  return {
    ...item,
    id: normalizedId,
    name: item?.name || item?.nama_produk || item?.title || "",
    price: Number(item?.price ?? item?.harga ?? 0),
    desc: item?.desc || item?.deskripsi || item?.description || "",
    stock: Number(item?.stock ?? 0)
  };
}

function loadState() {
  const storedProducts = safeGetItem(STORAGE_PRODUCTS_KEY);
  const syncedProducts = safeGetItem(STORAGE_PRODUCTS_SYNC_KEY);
  const storedOrders = safeGetItem(STORAGE_ORDERS_KEY);
  const productCandidates = [];
  if (storedProducts) {
    try { const parsed = JSON.parse(storedProducts); if (Array.isArray(parsed)) parsed.forEach(item => productCandidates.push(normalizeProductForAdmin(item, item?.id))); } catch (e) {}
  }
  if (syncedProducts) {
    try { const parsed = JSON.parse(syncedProducts); if (Array.isArray(parsed)) parsed.forEach(item => { if (!productCandidates.some(p => Number(p.id) === Number(item?.id))) productCandidates.push(normalizeProductForAdmin(item, item?.id)); }); } catch (e) {}
  }
  products = productCandidates.length ? productCandidates : [];
  orders = storedOrders ? JSON.parse(storedOrders) : [];
  if (!Array.isArray(products)) products = [];
  if (!Array.isArray(orders)) orders = [];
}

function saveProducts() {
  safeSetItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));
  safeSetItem(STORAGE_PRODUCTS_SYNC_KEY, JSON.stringify(products));
}

let toastTimeout;
function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2500);
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function showDashboard() {
  document.getElementById("loginGate").style.display = "none";
  document.getElementById("adminPanelSection").style.display = "block";
  document.getElementById("logoutBtn").style.display = "inline-flex";
  loadState();
  renderAdminPanel();
}

function showLoginGate() {
  document.getElementById("loginGate").style.display = "flex";
  document.getElementById("adminPanelSection").style.display = "none";
  document.getElementById("logoutBtn").style.display = "none";
}

function submitAdminLogin() {
  const input = document.getElementById("adminPasswordInput");
  const password = input?.value.trim() || "";
  if (!password) { showToast("❌ Kata sandi wajib."); return; }
  // prefer server admin login when available
  if (typeof loginAdmin === 'function' && typeof setAdminToken === 'function') {
    loginAdmin(password).then(res => {
      if (res && res.token) {
        setAdminToken(res.token);
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        if (input) input.value = "";
        showDashboard();
        showToast("✅ Admin berhasil login (server).");
      } else {
        showToast("❌ Kata sandi salah.");
      }
    }).catch(() => showToast("❌ Kata sandi salah."));
    return;
  }
  // legacy fallback
  if (password !== ADMIN_PASSWORD) {
    showToast("❌ Kata sandi salah. Coba lagi.");
    return;
  }
  sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  if (input) input.value = "";
  showDashboard();
  showToast("✅ Admin berhasil login.");
}

function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  showLoginGate();
  showToast("🔒 Admin logout.");
}

function renderAdminPanel() {
  renderAdminProductTable();
  renderAdminOrderList();
}

function renderAdminProductTable() {
  const container = document.getElementById("adminProductTable");
  if (!container) return;
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = `<div class="admin-empty-order">Belum ada produk. Buka halaman toko (index.html) minimal sekali agar data produk awal tersimpan.</div>`;
    return;
  }

  products.forEach(product => {
    const stockCount = Number(product.stock || 0);
    const row = document.createElement("div");
    row.className = "admin-product-row";
    row.innerHTML = `
      <div class="admin-product-info">
        <div class="admin-product-name">${product.emoji} ${product.name}</div>
        <div class="admin-product-stock">Stok: <strong>${stockCount}</strong></div>
      </div>
      <div class="admin-product-actions">
        <button class="btn btn-outline" onclick="adjustStock(${product.id}, -1)">-</button>
        <button class="btn btn-outline" onclick="adjustStock(${product.id}, 1)">+</button>
      </div>`;
    container.appendChild(row);
  });
}

function renderAdminOrderList() {
  const container = document.getElementById("adminOrderList");
  if (!container) return;
  container.innerHTML = "";
  if (orders.length === 0) {
    container.innerHTML = `<div class="admin-empty-order">Belum ada pembeli yang checkout.</div>`;
    return;
  }

  orders.slice().reverse().forEach(order => {
    const card = document.createElement("div");
    card.className = "admin-order-card-item";
    card.innerHTML = `
      <div class="admin-order-header">
        <div><strong>No. Pesanan</strong> #${order.orderNum}</div>
        <div>${order.date} · ${order.time}</div>
      </div>
      <div class="admin-order-customer">
        <strong>${order.customerName}</strong><br />${order.customerPhone}<br />${order.customerAddress}
      </div>
      <div class="admin-order-items">
        ${order.items.map(item => `<div class="admin-order-item">${item.qty} × ${item.name} (${formatPrice(item.price * item.qty)})</div>`).join("")}
      </div>
      <div class="admin-order-summary">Total: <strong>${formatPrice(order.total)}</strong></div>`;
    container.appendChild(card);
  });
}

function adjustStock(productId, delta) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  product.stock = Math.max(0, Number(product.stock || 0) + delta);
  saveProducts();
  renderAdminProductTable();
  showToast("✅ Stok diperbarui.");
}

function initAdminApp() {
  lucide.createIcons();
  if (isAdminLoggedIn()) {
    showDashboard();
  } else {
    showLoginGate();
  }
}

initAdminApp();
