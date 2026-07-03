/* ---------- server sync helpers (use API when available) ---------- */
async function syncWithServerData() {
  if (typeof fetchProducts !== 'function' || typeof fetchOrders !== 'function') return false;
  try {
    if (typeof getAdminToken === 'function' && getAdminToken()) {
      const [prodRes, orderRes] = await Promise.allSettled([fetchProducts(), fetchOrders()]);
      if (prodRes.status === 'fulfilled') {
        try { products = mapProducts(prodRes.value || []); saveProducts(); if (typeof renderProdukTable === 'function') renderProdukTable(); } catch(e) { /* ignore */ }
      }
      if (orderRes.status === 'fulfilled') {
        try { allOrders = Array.isArray(orderRes.value) ? orderRes.value : []; saveAllOrders(); } catch(e) { /* ignore */ }
      }
      try { refreshDashboardView(); } catch(e) {}
      try { showToast('🔄 Sinkronisasi dengan server selesai.'); } catch(e) {}
      return true;
    }
  } catch(e) { /* ignore */ }
  return false;
}
/* ============================================================
   admin_script.js — Indah's Beauté Atelier Admin (versi lengkap)
   Developed by Indah Kirana Putri
   ============================================================ */

// Samakan key produk dengan toko (script.js) agar produk admin langsung muncul di index.html
const STORAGE_PRODUCTS_KEY  = "IndahBeauteProducts";
const STORAGE_PRODUCT_KEYS  = [STORAGE_PRODUCTS_KEY, "Indah'sProducts"];

// Key orders admin tidak saya ubah agar tidak mengganggu halaman pesanan yang mungkin sudah kamu set
const STORAGE_ORDERS_KEY    = "IndahBeauteOrders";
const STORAGE_ALL_ORDERS    = "IndahBeauteAllOrders";
const STORAGE_LAST_ORDER_KEY = "IndahBeauteLastOrder";
const STORAGE_ORDER_KEYS    = [STORAGE_ALL_ORDERS, "Indah'sAllOrders", STORAGE_ORDERS_KEY, "Indah'sOrders", STORAGE_LAST_ORDER_KEY];
const ADMIN_SESSION_KEY     = "Indah'sAdminSession";
const ADMIN_PASSWORD        = "admin123";

const IMAGE_ASSETS = [
  "ampoule baru.jpeg",
  "blushon.jpg.jpeg",
  "body wash.jpg.jpeg",
  "claymask baru.jpeg",
  "cleansing foam.jpg.jpeg",
  "conditioner.jpg.jpeg",
  "eyshadow.jpg.jpeg",
  "gel cream.jpg.jpeg",
  "hair oil.jpg.jpeg",
  "highlighter baru.jpeg",
  "lipcream.jpg.jpeg",
  "lipstik.jpg.jpeg",
  "liptint.jpg.jpeg",
  "lotion baru.jpeg",
  "mois.jpg.jpeg",
  "parfum 4.jpg.jpeg",
  "parfum 5.jpg.jpeg",
  "parfum baru 1.jpeg",
  "parfum baru 2.jpeg",
  "parfum baru 3.jpeg",
  "scrub.jpg.jpeg",
  "serum oil.jpg.jpeg",
  "shampo.jpg.jpeg",
  "two way cake.jpg.jpeg"
];
const IMAGE_ASSETS_LOWER = IMAGE_ASSETS.map(n => n.toLowerCase());

let products = [];
let allOrders = [];

/* ---------- helpers ---------- */
function readStorageArray(key) {
  const raw = safeGetItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return [parsed];
    return [];
  } catch (e) {
    return [];
  }
}

function writeStorageArray(keys, value) {
  const payload = JSON.stringify(value || []);
  keys.forEach(key => safeSetItem(key, payload));
}

function inferImageAssetFromName(value) {
  const name = String(value || "").toLowerCase();
  if (/(liptint)/.test(name)) return "image/liptint.jpg.jpeg";
  if (/(lipstik)/.test(name)) return "image/lipstik.jpg.jpeg";
  if (/(blushon)/.test(name)) return "image/blushon.jpg.jpeg";
  if (/(eyeshadow)/.test(name)) return "image/eyshadow.jpg.jpeg";
  if (/(highlighter)/.test(name)) return "image/highlighter baru.jpeg";
  if (/(two way cake|two-way-cake)/.test(name)) return "image/two way cake.jpg.jpeg";
  if (/(parfum|parfume).*(1|2|3|4|5)/.test(name)) return name.includes('4') || name.includes('5') ? "image/parfum 4.jpg.jpeg" : name.includes('2') ? "image/parfum baru 2.jpeg" : name.includes('3') ? "image/parfum baru 3.jpeg" : "image/parfum baru 1.jpeg";
  if (/(ampoule)/.test(name)) return "image/ampoule baru.jpeg";
  if (/(serum)/.test(name)) return "image/serum oil.jpg.jpeg";
  if (/(cleansing|foam)/.test(name)) return "image/cleansing foam.jpg.jpeg";
  if (/(mois|moisturizer)/.test(name)) return "image/mois.jpg.jpeg";
  if (/(claymask|clay mask)/.test(name)) return "image/claymask baru.jpeg";
  if (/(gel cream|gelcream)/.test(name)) return "image/gel cream.jpg.jpeg";
  if (/(shampoo)/.test(name)) return "image/shampo.jpg.jpeg";
  if (/(conditioner)/.test(name)) return "image/conditioner.jpg.jpeg";
  if (/(hair oil)/.test(name)) return "image/hair oil.jpg.jpeg";
  if (/(scrub)/.test(name)) return "image/scrub.jpg.jpeg";
  if (/(body wash|bodywash)/.test(name)) return "image/body wash.jpg.jpeg";
  if (/(lotion)/.test(name)) return "image/lotion baru.jpeg";
  return null;
}

function normalizeProductRecord(item, fallbackId = null) {
  const id = Number(item?.id ?? fallbackId ?? 0);
  const normalizedId = Number.isFinite(id) && id > 0 ? id : (fallbackId || Date.now());
  const imageValue = item?.foto || item?.image || item?.foto_produk || inferImageAssetFromName(item?.name || item?.nama_produk || item?.title || "");
  const normalizedImage = normalizeImageAssetValue(imageValue);
  const nameValue = item?.name || item?.nama_produk || item?.title || "";
  return {
    ...item,
    id: normalizedId,
    name: nameValue,
    price: Number(item?.price ?? item?.harga ?? 0),
    desc: item?.desc || item?.deskripsi || item?.description || "",
    category: normalizeCategory(item?.category || item?.kategori || ((nameValue && String(nameValue).toLowerCase().includes('parfum')) ? 'parfum' : '')),
    foto: normalizedImage,
    image: normalizedImage,
    emoji: item?.emoji || "🎀",
    stock: Number(item?.stock ?? 0),
    hot: Boolean(item?.hot)
  };
}

function getProductsFromAllStorageSources() {
  const combined = [];
  const seen = new Set();
  STORAGE_PRODUCT_KEYS.forEach(key => {
    readStorageArray(key).forEach(item => {
      const id = Number(item?.id);
      if (!Number.isFinite(id) || id <= 0 || seen.has(id)) return;
      seen.add(id);
      combined.push(item);
    });
  });
  return combined;
}

function getOrdersFromAllStorageSources() {
  const combined = [];
  const seen = new Set();
  STORAGE_ORDER_KEYS.forEach(key => {
    readStorageArray(key).forEach(item => {
      const isOrderLike = item && (item.orderNum || item.createdAt || item.customerName || item.customerPhone || Array.isArray(item.items));
      if (!isOrderLike) return;
      const keyValue = item?.orderNum || item?.id || JSON.stringify(item);
      if (seen.has(keyValue)) return;
      seen.add(keyValue);
      combined.push(item);
    });
  });
  return combined;
}

const CATEGORY_MAP = {
  skincare: "skincare",
  bodycare: "bodycare",
  haircare: "haircare",
  makeup: "makeup",
  perfume: "parfum",
  parfum: "parfum",
  Skincare: "skincare",
  Bodycare: "bodycare",
  Haircare: "haircare",
  Makeup: "makeup",
  Perfume: "parfum",
  Parfum: "parfum",
  "body wash": "bodycare",
  bodywash: "bodycare",
  "body-wash": "bodycare",
  lotion: "bodycare",
  scrub: "bodycare",
  shampoo: "haircare",
  "serum oil": "haircare",
  conditioner: "haircare",
  "hair oil": "haircare",
  ampoule: "skincare",
  serum: "skincare",
  cleansing: "skincare",
  "cleansing foam": "skincare",
  mois: "skincare",
  moisturizer: "skincare",
  claymask: "skincare",
  "clay mask": "skincare",
  "gel cream": "skincare",
  gelcream: "skincare",
  liptint: "makeup",
  lipstik: "makeup",
  blushon: "makeup",
  eyeshadow: "makeup",
  highlighter: "makeup",
  "two way cake": "makeup",
  "two-way-cake": "makeup",
  "parfum 1": "parfum",
  "parfum 2": "parfum",
  "parfum 3": "parfum",
  "parfum 4": "parfum",
  "parfum 5": "parfum",
  "parfume 4": "parfum",
  "parfume 5": "parfum"
};
function normalizeCategory(raw) {
  const key = String(raw || "").trim();
  const normalized = key.toLowerCase();
  return CATEGORY_MAP[key] || CATEGORY_MAP[normalized] || CATEGORY_MAP[normalized.replace(/[_-]+/g, " ")] || normalized;
}
function getCategoryLabel(categoryKey) {
  const k = String(categoryKey || "").toLowerCase();
  if (k === "skincare") return "Skincare";
  if (k === "bodycare") return "Bodycare";
  if (k === "haircare") return "Haircare";
  if (k === "makeup") return "Makeup";
  if (k === "parfum") return "Perfume";
  return "-";
}
function getOrderCustomerName(order) {
  return order.customerName || order.nama || order.name || "-";
}
function getOrderCustomerPhone(order) {
  return order.customerPhone || order.phone || "";
}
function getOrderItemsSummary(order) {
  if (!Array.isArray(order.items) || order.items.length === 0) return "-";
  return order.items.map(item => `${item.name}${item.qty ? ` x${item.qty}` : ""}`).join(", ");
}
function formatOrderDate(order) {
  const iso = order.createdAt || order.date || null;
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
}
function formatPrice(n) { return "Rp " + Number(n).toLocaleString("id-ID"); }

function normalizeImageAssetValue(value) {
  if (!value) return null;
  try {
    const raw = String(value).trim();
    if (!raw) return null;
    if (/^(https?:|data:)/i.test(raw)) return raw;

    let cleaned = raw.replace(/\\/g, '/').trim();
    cleaned = cleaned.replace(/^\.\//, '').replace(/^\/+/, '');
    if (!cleaned.includes('/')) {
      cleaned = `image/${cleaned}`;
    } else if (!cleaned.startsWith('image/')) {
      cleaned = `image/${cleaned}`;
    }
    return cleaned;
  } catch (e) {
    return null;
  }
}

function findBestImageAssetForProduct(product) {
  const name = String(product?.name || product?.title || "").toLowerCase();
  const tokens = name
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) return null;

  const scored = IMAGE_ASSETS
    .map(assetName => {
      const assetBase = stripImageExtension(assetName).toLowerCase();
      const assetTokens = assetBase.replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
      const matchCount = tokens.filter(token => assetTokens.includes(token)).length;
      const containsCount = tokens.filter(token => assetBase.includes(token)).length;
      return { assetName, score: matchCount + containsCount };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  return normalizeImageAssetValue(`image/${scored[0].assetName}`);
}

function syncProductImages() {
  if (!Array.isArray(products)) return false;

  let changed = false;
  const defaultById = new Map((Array.isArray(defaultProducts) ? defaultProducts : []).map(item => [Number(item.id), item]));

  products = products.map(product => {
    const currentValue = normalizeImageAssetValue(product?.foto || product?.image || "");
    const defaultProduct = defaultById.get(Number(product?.id));
    const preferredValue = normalizeImageAssetValue(defaultProduct?.foto || defaultProduct?.image || "") || findBestImageAssetForProduct(product);
    const nextValue = preferredValue || currentValue;
    if (nextValue && currentValue !== nextValue) {
      changed = true;
    }
    return {
      ...product,
      foto: nextValue,
      image: nextValue
    };
  });

  if (changed) saveProducts();
  return changed;
}

function loadData() {
  const defaultList = (typeof defaultProducts !== "undefined" && Array.isArray(defaultProducts)) ? defaultProducts : [];
  const storedProducts = getProductsFromAllStorageSources();
  const normalizedStoredProducts = Array.isArray(storedProducts) && storedProducts.length
    ? storedProducts.map(item => normalizeProductRecord(item, item?.id))
    : [];

  if (!normalizedStoredProducts.length && defaultList.length) {
    products = defaultList.map(item => normalizeProductRecord({ ...item, category: item.category, foto: item.foto || item.image || null }, item.id));
  } else {
    products = normalizedStoredProducts;
  }

  if (defaultList.length) {
    const byId = new Map(products.map(item => [Number(item.id), item]));
    const merged = defaultList.map(defaultItem => {
      const stored = byId.get(Number(defaultItem.id));
      if (!stored) {
        return normalizeProductRecord({ ...defaultItem, category: defaultItem.category, foto: defaultItem.foto || defaultItem.image || null }, defaultItem.id);
      }
      return {
        ...defaultItem,
        ...stored,
        id: Number(stored.id || defaultItem.id),
        category: normalizeCategory(stored.category || defaultItem.category),
        foto: stored.foto || stored.image || defaultItem.foto || defaultItem.image || null,
        emoji: stored.emoji || defaultItem.emoji || "🎀",
        hot: typeof stored.hot === "boolean" ? stored.hot : Boolean(defaultItem.hot),
        stock: Number(stored.stock ?? defaultItem.stock ?? 0),
        price: Number(stored.price ?? defaultItem.price ?? 0)
      };
    });
    const extras = products.filter(item => !defaultList.some(defaultItem => Number(defaultItem.id) === Number(item.id)));
    products = [...merged, ...extras];
  }

  allOrders = getOrdersFromAllStorageSources();
  if (!Array.isArray(allOrders)) allOrders = [];
  saveProducts();
  saveAllOrders();
}

function encodeImgPath(p) {
  if (!p) return "";
  try {
    const raw = String(p).trim();
    if (!raw) return "";
    if (/^(https?:|data:)/i.test(raw)) return raw;

    const cleaned = normalizeImageAssetValue(raw) || raw;
    const currentUrl = window.location.href.split('?')[0];
    const baseUrl = currentUrl.endsWith('/') || currentUrl.endsWith('.html')
      ? (currentUrl.endsWith('.html') ? currentUrl.replace(/[^/]*$/, '') : currentUrl)
      : `${currentUrl}/`;

    const url = new URL(cleaned, baseUrl);
    url.searchParams.set('v', String(Date.now()));
    return url.toString();
  } catch(e) { return String(p); }
}

function safeSetItem(k, v) {
  try { localStorage.setItem(k, v); } catch (e) { }
}
function safeGetItem(k) { try { return localStorage.getItem(k); } catch(e) { return null; } }
function safeRemoveItem(k) { try { localStorage.removeItem(k); } catch(e) { } }

function saveProducts() {
  writeStorageArray(STORAGE_PRODUCT_KEYS, products);
}

function saveAllOrders() {
  writeStorageArray(STORAGE_ORDER_KEYS, allOrders);
}

function refreshDashboardView() {
  const totalProduk   = products.length;
  const totalPesanan  = allOrders.length;
  const totalRevenue  = allOrders.reduce((s, o) => s + (o.total || 0), 0);
  const stokRendah    = products.filter(p => Number(p.stock || 0) <= 3).length;

  document.getElementById("statProduk")  && (document.getElementById("statProduk").textContent  = totalProduk);
  document.getElementById("statPesanan") && (document.getElementById("statPesanan").textContent = totalPesanan);
  document.getElementById("statRevenue") && (document.getElementById("statRevenue").textContent = formatPrice(totalRevenue));
  document.getElementById("statStok")    && (document.getElementById("statStok").textContent    = stokRendah + " produk");

  const recentEl = document.getElementById("dashRecentOrders");
  if (recentEl) {
    const recent = allOrders.slice(0, 5);
    if (!recent.length) {
      recentEl.innerHTML = "<tr><td colspan='5' class='ad-empty'>Belum ada pesanan.</td></tr>";
    } else {
      recentEl.innerHTML = recent.map(o => {
        const statusColor = o.status === "Selesai" ? "var(--ad-green)" : o.status === "Dikirim" ? "#8B5CF6" : "var(--ad-pink)";
        return `<tr>
          <td><strong>#${o.orderNum}</strong></td>
          <td>${o.nama || "-"}</td>
          <td>${formatPrice(o.total)}</td>
          <td><span class="ad-badge" style="background:${statusColor}20;color:${statusColor}">${o.status || "Diproses"}</span></td>
          <td>${new Date(o.createdAt).toLocaleDateString("id-ID")}</td>
        </tr>`;
      }).join("");
    }
  }

  const stokEl = document.getElementById("dashStokRendah");
  if (stokEl) {
    const low = products.filter(p => Number(p.stock || 0) <= 5);
    if (!low.length) {
      stokEl.innerHTML = "<tr><td colspan='3' class='ad-empty'>Semua stok aman ✅</td></tr>";
    } else {
      stokEl.innerHTML = low.map(p => `<tr>
        <td>${p.emoji} ${p.name}</td>
        <td><strong style="color:${Number(p.stock)<=2?'#E8758F':'inherit'}">${p.stock}</strong></td>
        <td><a href="admin_produk.html" class="ad-link">Kelola →</a></td>
      </tr>`).join("");
    }
  }
}

function syncAdminData() {
  loadData();
  const imageChanged = syncProductImages();

  if (typeof renderProdukTable === "function") renderProdukTable();
  if (typeof renderPesananTable === "function") {
    const activeFilter = document.querySelector(".ad-filter-btn.active")?.dataset.filter || "semua";
    renderPesananTable(activeFilter);
  }
  refreshDashboardView();
  const produkCountEl = document.getElementById("produkCount");
  if (produkCountEl) produkCountEl.textContent = products.length + " produk";
  showToast(imageChanged ? "🔄 Data dan foto produk berhasil disinkronkan." : "🔄 Data admin disinkronkan.");
}

let _toastT;
function showToast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(_toastT);
  _toastT = setTimeout(() => el.classList.remove("show"), 2500);
}

/* ---------- auth ---------- */
function isLoggedIn() { return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true"; }

/* ============================================================
   Sidebar active state (berdasarkan URL)
   ============================================================ */
function initAdminSidebarActive() {
  const links = document.querySelectorAll('.ad-nav-link');
  if (!links || !links.length) return;

  const current = (window.location.pathname || '').toLowerCase();

  links.forEach(a => {
    a.classList.remove('active');
    const href = (a.getAttribute('href') || '').toLowerCase();

    // Cocokkan berdasarkan filename halaman
    if (href && current.endsWith(href)) {
      a.classList.add('active');
    }
  });
}


function doLogin(e) {
  e && e.preventDefault();
  const pwd = document.getElementById("adminPwd")?.value.trim();
  if (!pwd) {
    document.getElementById("adminLoginMsg").textContent = "❌ Kata sandi wajib.";
    return;
  }

  function fallbackLocalLogin() {
    if (pwd !== ADMIN_PASSWORD) {
      document.getElementById("adminLoginMsg").textContent = "❌ Kata sandi salah.";
      return;
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    document.getElementById("adminPwd").value = '';
    window.location.href = "admin_dashboard.html";
  }

  // Prefer server admin login when available
  if (typeof loginAdmin === 'function' && typeof setAdminToken === 'function') {
    loginAdmin(pwd).then(res => {
      if (res && res.token) {
        setAdminToken(res.token);
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        document.getElementById("adminPwd").value = '';
        window.location.href = "admin_dashboard.html";
      } else {
        fallbackLocalLogin();
      }
    }).catch(() => {
      fallbackLocalLogin();
    });
    return;
  }

  // legacy fallback
  fallbackLocalLogin();
}

function doLogout() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  try { if (typeof clearAdminToken === 'function') clearAdminToken(); } catch(e) {}
  window.location.href = "admin_login.html";
}

function requireLogin() {
  if (!isLoggedIn()) window.location.href = "admin_login.html";
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function initDashboard() {
  requireLogin();
  loadData();
  refreshDashboardView();
}

/* ============================================================
   PRODUK
   ============================================================ */
function initProduk() {
  requireLogin();
  loadData();
  renderProdukTable();
  try { if (typeof getAdminToken === 'function' && getAdminToken()) syncWithServerData(); } catch(e) {}
  const el = document.getElementById("produkCount");
  if (el) el.textContent = products.length + " produk";
}

function renderProdukTable() {
  const tbody = document.getElementById("produkTableBody");
  if (!tbody) return;
  if (!products.length) {
    tbody.innerHTML = "<tr><td colspan='6' class='ad-empty'>Belum ada produk.</td></tr>";
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:0.6rem;">
          ${(p.foto || p.image)
            ? `<img src="${encodeImgPath(p.foto || p.image)}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--ad-border);" onerror="this.onerror=null; this.style.display='none'; this.parentElement.querySelector('.ad-fallback-emoji').style.display='flex';" />
               <div class="ad-fallback-emoji" style="display:none;width:40px;height:40px;background:var(--ad-pink-lt);border-radius:6px;align-items:center;justify-content:center;font-size:1.3rem;">${p.emoji}</div>`
            : `<div style="width:40px;height:40px;background:var(--ad-pink-lt);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;">${p.emoji}</div>`}
          <span>${p.name}</span>
        </div>
      </td>
      <td>${getCategoryLabel(p.category)}</td>
      <td>${formatPrice(p.price)}</td>
      <td>
        <div class="ad-stok-ctrl">
          <button class="ad-stok-btn" onclick="adjustStock(${p.id}, -1)">−</button>
          <span class="ad-stok-num" style="color:${Number(p.stock)<=3?'#E8758F':'inherit'}">${p.stock}</span>
          <button class="ad-stok-btn" onclick="adjustStock(${p.id}, 1)">+</button>
        </div>
      </td>
      <td><span class="ad-badge ${p.hot ? 'hot' : 'normal'}">${p.hot ? "🔥 Hot" : "Biasa"}</span></td>
      <td class="action-column">
        <div class="action-buttons">
          <a href="admin_edit_produk.html?id=${p.id}" class="ad-btn-edit btn-edit">Edit</a>
          <button class="ad-btn-del btn-delete" onclick="deleteProduk(${p.id})">Hapus</button>
        </div>
      </td>
    </tr>`).join("");
}

function adjustStock(id, delta) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  p.stock = Math.max(0, Number(p.stock || 0) + delta);
  saveProducts();
  renderProdukTable();
  showToast("✅ Stok diperbarui.");
}

function deleteProduk(id) {
  if (!confirm("Hapus produk ini?")) return;
  // prefer server delete when admin token present
  if (typeof getAdminToken === 'function' && getAdminToken() && typeof deleteProduct === 'function') {
    deleteProduct(id).then(() => {
      // refresh local cache from server
      syncWithServerData();
      showToast("🗑️ Produk dihapus (server).");
    }).catch(() => {
      // fallback to local removal
      products = products.filter(p => p.id !== id);
      saveProducts();
      renderProdukTable();
      showToast("🗑️ Produk dihapus (lokal).");
    });
    return;
  }

  products = products.filter(p => p.id !== id);
  saveProducts();
  renderProdukTable();
  showToast("🗑️ Produk dihapus.");
}

/* ============================================================
   TAMBAH PRODUK
   ============================================================ */
function initTambahProduk() {
  requireLogin();
  loadData();
  try { if (typeof getAdminToken === 'function' && getAdminToken()) syncWithServerData(); } catch(e) {}
  const form = document.getElementById("formTambahProduk");
  if (!form) return;

  // Pastikan hanya 1 jalur eksekusi saat klik "Simpan Produk".
  // Jangan biarkan submit default reload halaman.
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    doTambahProduk();
  });

  // Jika ada handler lain dari luar, kita tetap cegah double-submit.
  // tombol submit dibiarkan default (submit handler di atas sudah e.preventDefault)

}


async function doTambahProduk() {
  loadData(); // reload dulu agar data sinkron
  const nama     = document.getElementById("tpNama")?.value.trim();
  const hargaRaw = document.getElementById("tpHarga")?.value;
  const stokRaw  = document.getElementById("tpStok")?.value;
  const kategori = document.getElementById("tpKategori")?.value;
  const desc     = document.getElementById("tpDesc")?.value.trim() || "";
  const hot      = document.getElementById("tpHot")?.checked || false;

  const harga = Number(hargaRaw);
  const stok  = Number(stokRaw);
  const categoryKey = normalizeCategory(kategori);

  if (!nama)     { showToast("⚠️ Nama produk wajib diisi!");  return; }
  if (!harga)    { showToast("⚠️ Harga produk wajib diisi!"); return; }
  if (!stok && stok !== 0) { showToast("⚠️ Stok wajib diisi!"); return; }
  if (!kategori) { showToast("⚠️ Kategori wajib dipilih!");   return; }

  const fotoPath = await getFotoPathFromInput("tpFoto", { baseDir: "image" });
  if (document.getElementById("tpFoto")?.files?.length && !fotoPath) {
    showToast("⚠️ Foto produk harus tersedia di folder image/ agar bisa dilihat semua pelanggan.");
    return;
  }

  const newId = products.length ? Math.max(...products.map(p => Number(p.id))) + 1 : 1;

  // admin_tambah_produk.html tidak punya input emoji,
  // jadi pastikan variabel emoji tidak undefined (biar produk tersimpan & dashboard kebaca)
  const emojiByKategori = {
    Skincare: "🧴",
    Bodycare: "🫧",
    Haircare: "🌿",
    Makeup: "💄",
    Perfume: "🌸"
  };
  const emoji = emojiByKategori[kategori] || "🎀";

  const newProduct = {
    id: newId,
    name: nama,
    price: harga,
    stock: stok,
    category: categoryKey,
    emoji,
    desc,
    hot,
    foto: fotoPath || null
  };
  products.push(newProduct);
  // prefer server create when admin token present
  if (typeof getAdminToken === 'function' && getAdminToken() && typeof createProduct === 'function') {
    createProduct({ nama_produk: newProduct.name, kategori: newProduct.category, harga: newProduct.price, deskripsi: newProduct.desc, foto_produk: newProduct.foto }).then(() => {
      syncWithServerData();
      showToast("✅ Produk berhasil ditambahkan (server).");
      window.location.href = "admin_produk.html";
    }).catch(() => {
      try { saveProducts(); } catch(e) {}
      showToast("✅ Produk ditambahkan (lokal, server gagal).");
      window.location.href = "admin_produk.html";
    });
    return;
  }

  try {
    saveProducts();
    showToast("✅ Produk berhasil ditambahkan!");
    window.location.href = "admin_produk.html";
  } catch(err) {
    showToast("❌ Gagal menyimpan: " + err.message);
  }
}


/* ============================================================
   EDIT PRODUK
   ============================================================ */
function initEditProduk() {
  requireLogin();
  loadData();
  try { if (typeof getAdminToken === 'function' && getAdminToken()) syncWithServerData(); } catch(e) {}
  const params = new URLSearchParams(window.location.search);
  const id     = Number(params.get("id"));
  const p      = products.find(x => x.id === id);
  if (!p) { showToast("❌ Produk tidak ditemukan."); return; }

  document.getElementById("epNama").value     = p.name;
  document.getElementById("epHarga").value    = p.price;
  document.getElementById("epStok").value     = p.stock;
  document.getElementById("epKategori").value = p.category;
  document.getElementById("epDesc").value     = p.desc || "";
  document.getElementById("epHot").checked    = p.hot || false;

  const form = document.getElementById("formEditProduk");
  if (!form) return;

  // Tampilkan foto existing jika ada
  if (p.foto || p.image) {
    const currentWrap = document.getElementById("epFotoCurrent");
    const currentImg  = document.getElementById("epFotoCurrentImg");
    if (currentWrap) currentWrap.style.display = "block";
    if (currentImg)  currentImg.src = encodeImgPath(p.foto || p.image);
  }

  async function doEdit() {
    const newNama = document.getElementById("epNama")?.value.trim();
    if (!newNama) { showToast("⚠️ Nama produk wajib diisi!"); return; }
    p.name     = newNama;
    p.price    = Number(document.getElementById("epHarga")?.value) || p.price;
    p.stock    = Number(document.getElementById("epStok")?.value ?? p.stock);
    p.category = normalizeCategory(document.getElementById("epKategori")?.value || p.category);
    p.desc     = document.getElementById("epDesc")?.value.trim() || "";
    p.hot      = document.getElementById("epHot")?.checked || false;

    // Simpan foto baru jika ada, pertahankan lama jika tidak diganti
    const fotoPath = await getFotoPathFromInput("epFoto", { baseDir: "image" });
    if (document.getElementById("epFoto")?.files?.length && !fotoPath) {
      showToast("⚠️ Foto baru harus tersedia di folder image/ agar bisa dilihat semua pelanggan.");
      return;
    }
    if (fotoPath) p.foto = fotoPath;

    const idx = products.findIndex(x => x.id === p.id);
    if (idx > -1) products[idx] = p;
    // prefer server update when admin token present
    if (typeof getAdminToken === 'function' && getAdminToken() && typeof updateProduct === 'function') {
      updateProduct(p.id, { nama_produk: p.name, kategori: p.category, harga: p.price, deskripsi: p.desc, foto_produk: p.foto }).then(() => {
        syncWithServerData();
        showToast("✅ Produk berhasil diperbarui (server).");
        setTimeout(() => { window.location.href = "admin_produk.html"; }, 1000);
      }).catch(() => {
        try { saveProducts(); } catch(e) {}
        showToast("✅ Produk diperbarui (lokal, server gagal).");
        setTimeout(() => { window.location.href = "admin_produk.html"; }, 1000);
      });
      return;
    }

    try {
      saveProducts();
      showToast("✅ Produk berhasil diperbarui!");
      setTimeout(() => { window.location.href = "admin_produk.html"; }, 1000);
    } catch(err) {
      showToast("❌ Gagal menyimpan: " + err.message);
    }
  }


  // gunakan submit handler saja supaya doEdit tidak terpicu dobel
  form.addEventListener("submit", e => { e.preventDefault(); doEdit(); });
}

/* ============================================================
   PESANAN
   ============================================================ */
function initPesanan() {
  requireLogin();
  loadData();
  try { if (typeof getAdminToken === 'function' && getAdminToken()) syncWithServerData(); } catch(e) {}
  renderPesananTable();
}

window.addEventListener("storage", (event) => {
  const keysToWatch = [...STORAGE_PRODUCT_KEYS, ...STORAGE_ORDER_KEYS, STORAGE_ALL_ORDERS, STORAGE_ORDERS_KEY];
  if (event.key && keysToWatch.includes(event.key)) {
    syncAdminData();
  }
});

function renderPesananTable(filter = "semua") {
  const tbody = document.getElementById("pesananTableBody");
  if (!tbody) return;

  let list = [...allOrders];
  if (filter !== "semua") list = list.filter(o => (o.status || "Diproses") === filter);

  if (!list.length) {
    tbody.innerHTML = "<tr><td colspan='7' class='ad-empty'>Belum ada pesanan.</td></tr>";
    return;
  }

  const statusColor = s => s === "Selesai" ? "var(--ad-green)" : s === "Dikirim" ? "#8B5CF6" : "var(--ad-pink)";
  const statusNext  = s => s === "Diproses" ? "Dikirim" : s === "Dikirim" ? "Selesai" : null;

  tbody.innerHTML = list.map(o => {
    const status = o.status || "Diproses";
    const next   = statusNext(status);
    return `<tr>
      <td><strong>#${o.orderNum}</strong></td>
      <td>${getOrderCustomerName(o)}<br/><small style="color:var(--ad-muted)">${getOrderCustomerPhone(o)}</small></td>
      <td>${getOrderItemsSummary(o)}</td>
      <td>${formatPrice(o.total)}</td>
      <td>${formatOrderDate(o)}</td>
      <td><span class="ad-badge" style="background:${statusColor(status)}20;color:${statusColor(status)}">${status}</span></td>
      <td>${next
        ? `<button class="ad-btn-edit" onclick="adminUpdateOrderStatus('${o.orderNum}','${next}')">→ ${next}</button>`
        : `<span style="color:var(--ad-green);font-size:0.82rem">✓ Selesai</span>`}
      </td>
    </tr>`;
  }).join("");
}

function adminUpdateOrderStatus(orderNum, newStatus) {
  const idx = allOrders.findIndex(o => o.orderNum === orderNum);
  if (idx === -1) return;
  // Prefer server update when admin token exists and API helper available
  if (typeof getAdminToken === 'function' && getAdminToken() && typeof window.updateOrderStatus === 'function') {
    try {
      // call API client helper
      window.updateOrderStatus(orderNum, newStatus).then(() => {
        syncWithServerData();
        showToast('✅ Status pesanan diperbarui (server).');
      }).catch(() => {
        // fallback to local
        allOrders[idx].status = newStatus;
        saveAllOrders();
        const activeFilter = document.querySelector('.ad-filter-btn.active')?.dataset.filter || 'semua';
        renderPesananTable(activeFilter);
        showToast('✅ Status pesanan diperbarui (lokal).');
      });
      return;
    } catch(e) { /* continue to local fallback */ }
  }

  // local-only fallback
  allOrders[idx].status = newStatus;
  saveAllOrders();
  const activeFilter = document.querySelector('.ad-filter-btn.active')?.dataset.filter || 'semua';
  renderPesananTable(activeFilter);
  showToast('✅ Status pesanan diperbarui.');
}


/* ============================================================
   FOTO PRODUK — Upload & Preview
   ============================================================ */

async function previewFoto(inputId, previewWrapId, areaId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewWrapId);
  const area    = document.getElementById(areaId);
  if (!input?.files?.length) return;

  const file = input.files[0];
  if (file.size > 2 * 1024 * 1024) {
    showToast("⚠️ Ukuran foto maksimal 2MB!");
    input.value = "";
    setFotoFeedback(inputId, "", "");
    return;
  }

  const imgId = previewWrapId === "tpFotoPreview" ? "tpFotoImg" : "epFotoImg";
  const imgEl = document.getElementById(imgId);
  const matchedAsset = findImageAssetName(file.name);

  if (matchedAsset) {
    const repoPath = `image/${matchedAsset}`;
    if (await assetExists(repoPath)) {
      if (imgEl) imgEl.src = encodeImgPath(repoPath);
      setFotoFeedback(inputId, "✅ Foto berhasil dimuat dari folder image/.", "success");
    } else {
      const objectUrl = URL.createObjectURL(file);
      if (imgEl) {
        imgEl.onload = () => URL.revokeObjectURL(objectUrl);
        imgEl.src = objectUrl;
      }
      setFotoFeedback(inputId, "⚠️ Foto terdeteksi, tetapi asset image/ tidak dapat diakses.", "warning");
    }
  } else {
    const objectUrl = URL.createObjectURL(file);
    if (imgEl) {
      imgEl.onload = () => URL.revokeObjectURL(objectUrl);
      imgEl.src = objectUrl;
    }
    setFotoFeedback(inputId, "⚠️ Foto belum cocok dengan asset image/ yang tersedia.", "error");
  }

  if (preview) preview.style.display = "block";
  if (area)    area.style.display    = "none";
}

function removeFoto(inputId, previewWrapId, areaId) {
  const input   = document.getElementById(inputId);
  const preview = document.getElementById(previewWrapId);
  const area    = document.getElementById(areaId);
  if (input)   input.value = "";
  if (preview) preview.style.display = "none";
  if (area)    area.style.display    = "block";
  setFotoFeedback(inputId, "", "");
}

function setFotoFeedback(inputId, text, type = "info") {
  const feedback = document.getElementById(`${inputId}Feedback`);
  if (!feedback) return;
  if (!text) {
    feedback.textContent = "";
    feedback.style.display = "none";
    return;
  }
  feedback.textContent = text;
  feedback.style.display = "block";
  feedback.style.color = type === "success" ? "#15803d" : type === "warning" ? "#b45309" : type === "error" ? "#b91c1c" : "#374151";
}

async function getFotoPathFromInput(inputId, options = {}) {
  const input = document.getElementById(inputId);
  if (!input?.files?.length) return null;

  const file = input.files[0];
  const baseDir = options.baseDir || "image";
  const matchedAsset = findImageAssetName(file.name);
  if (!matchedAsset) return null;

  const fotoPath = `${baseDir}/${matchedAsset}`;
  if (await assetExists(fotoPath)) return fotoPath;
  return null;
}

function stripImageExtension(name) {
  const base = String(name || "").replace(/\\/g, "/").split("/").pop().trim();
  return base.replace(/\.(jpe?g|png|webp)$/i, "");
}

function normalizeAssetName(name) {
  const base = String(name || "").replace(/\\/g, "/").split("/").pop().trim();
  return base;
}

function findImageAssetName(fileName) {
  const normalized = normalizeAssetName(fileName);
  if (!normalized) return null;

  const lower = normalized.toLowerCase();
  const exactMatch = IMAGE_ASSETS.find(name => name.toLowerCase() === lower);
  if (exactMatch) return exactMatch;

  const baseName = stripImageExtension(normalized).toLowerCase();
  const fuzzyMatch = IMAGE_ASSETS.find(assetName => stripImageExtension(assetName).toLowerCase() === baseName);
  return fuzzyMatch || null;
}

function renderImageAssetHint(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = `<div class="ad-file-hint">Pilih foto yang sudah tersedia di folder <code>image/</code>. Pastikan file ada di repo agar bisa tampil ke semua pelanggan.</div>`;
}

async function assetExists(url) {
  try {
    const encodedUrl = encodeURI(url);
    const response = await fetch(encodedUrl, { method: 'HEAD' });
    if (response.ok) return true;
    if (response.status === 405 || response.status === 403) {
      const fallback = await fetch(encodedUrl, { method: 'GET' });
      return fallback.ok;
    }
    return false;
  } catch (e) {
    return false;
  }
}

