const API_BASE_URL = (window.API_BASE && String(window.API_BASE).replace(/\/$/, '')) || (window.__API_BASE__ && String(window.__API_BASE__).replace(/\/$/, '')) || (window.location.origin + '/api');
const STORAGE_AUTH_TOKEN = 'IndahBeauteAuthToken';
const STORAGE_ADMIN_TOKEN = 'IndahBeauteAdminToken';
const STORAGE_USERS_KEY = 'IndahBeauteUsers';
const STORAGE_PRODUCTS_KEY = 'IndahBeauteProducts';
const STORAGE_ORDERS_KEY = 'IndahBeauteOrders';
const STORAGE_CARTS_KEY = 'IndahBeauteCarts';
const STORAGE_ADMIN_KEY = 'IndahBeauteAdmin';
const STORAGE_SESSIONS_KEY = 'IndahBeauteSessions';

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

function createToken(prefix = 'tok') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeStoredImageValue(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^(https?:|data:)/i.test(raw)) return raw;

  let cleaned = raw.replace(/\\/g, '/').trim();
  cleaned = cleaned.replace(/^\.\//, '').replace(/^\/+/, '');
  if (!cleaned.includes('/')) {
    cleaned = `image/${cleaned}`;
  } else if (!cleaned.startsWith('image/')) {
    cleaned = `image/${cleaned}`;
  }
  return cleaned;
}

function getDefaultProducts() {
  const list = Array.isArray(window.defaultProducts) ? window.defaultProducts : [];
  return list.map((p, idx) => ({
    id: Number(p.id || idx + 1),
    nama_produk: p.name || p.nama_produk || '',
    kategori: p.category || p.kategori || 'makeup',
    harga: Number(p.price ?? p.harga ?? 0),
    foto_produk: normalizeStoredImageValue(p.foto || p.image || p.foto_produk || ''),
    deskripsi: p.desc || p.deskripsi || '',
    review: Array.isArray(p.review) ? p.review : [],
    stock: Number(p.stock ?? 0),
    emoji: p.emoji || '🎀',
    hot: Boolean(p.hot)
  }));
}

function seedLocalData() {
  if (!safeGetItem(STORAGE_PRODUCTS_KEY)) {
    safeSetItem(STORAGE_PRODUCTS_KEY, JSON.stringify(getDefaultProducts()));
  }
  if (!safeGetItem(STORAGE_USERS_KEY)) {
    safeSetItem(STORAGE_USERS_KEY, JSON.stringify([{ id: 'u_1', nama: 'Indah Kirana', email: 'user@example.com', password: 'user123' }]));
  }
  if (!safeGetItem(STORAGE_ADMIN_KEY)) {
    safeSetItem(STORAGE_ADMIN_KEY, JSON.stringify({ username: 'admin', password: 'admin123' }));
  }
  if (!safeGetItem(STORAGE_ORDERS_KEY)) {
    safeSetItem(STORAGE_ORDERS_KEY, JSON.stringify([]));
  }
  if (!safeGetItem(STORAGE_CARTS_KEY)) {
    safeSetItem(STORAGE_CARTS_KEY, JSON.stringify([]));
  }
  if (!safeGetItem(STORAGE_SESSIONS_KEY)) {
    safeSetItem(STORAGE_SESSIONS_KEY, JSON.stringify([]));
  }
}

function readJson(key, fallback = []) {
  try {
    const raw = safeGetItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    return fallback;
  }
}

function writeJson(key, value) {
  safeSetItem(key, JSON.stringify(value));
}

function getUsers() {
  seedLocalData();
  return readJson(STORAGE_USERS_KEY, []);
}

function saveUsers(users) {
  writeJson(STORAGE_USERS_KEY, users);
}

function getSessions() {
  seedLocalData();
  return readJson(STORAGE_SESSIONS_KEY, []);
}

function saveSessions(sessions) {
  writeJson(STORAGE_SESSIONS_KEY, sessions);
}

function getCurrentSession(useAdmin = false) {
  const token = useAdmin ? getAdminToken() : getAuthToken();
  if (!token) return null;
  return getSessions().find(s => s.token === token) || null;
}

function getProducts() {
  seedLocalData();
  return readJson(STORAGE_PRODUCTS_KEY, []);
}

function saveProducts(products) {
  writeJson(STORAGE_PRODUCTS_KEY, products);
}

function getOrders() {
  seedLocalData();
  return readJson(STORAGE_ORDERS_KEY, []);
}

function saveOrders(orders) {
  writeJson(STORAGE_ORDERS_KEY, orders);
}

function getCarts() {
  seedLocalData();
  return readJson(STORAGE_CARTS_KEY, []);
}

function saveCarts(carts) {
  writeJson(STORAGE_CARTS_KEY, carts);
}

function getAdminRecord() {
  seedLocalData();
  return readJson(STORAGE_ADMIN_KEY, { username: 'admin', password: 'admin123' });
}

function saveAdminRecord(admin) {
  writeJson(STORAGE_ADMIN_KEY, admin);
}

function createLocalSession(role, userId) {
  const sessions = getSessions();
  const token = createToken(role === 'admin' ? 'adm' : 'usr');
  sessions.push({ token, userId, role, createdAt: new Date().toISOString() });
  saveSessions(sessions);
  return token;
}

function normalizeLocalProduct(product) {
  if (!product) return product;
  return {
    ...product,
    id: Number(product.id),
    name: product.nama_produk || product.name,
    price: Number(product.harga ?? product.price ?? 0),
    category: product.kategori || product.category,
    foto: product.foto_produk || product.foto || product.image,
    image: product.foto_produk || product.foto || product.image,
    desc: product.deskripsi || product.desc || product.description,
    review: Array.isArray(product.review) ? product.review : []
  };
}

async function apiRequest(path, method = 'GET', body = null, useAdmin = false) {
  const url = `${API_BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  const token = useAdmin ? getAdminToken() : getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers };
  if (body != null) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(url, opts);
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'API request failed');
    }
    return data;
  } catch (err) {
    return handleLocalFallback(path, method, body, useAdmin);
  }
}

function handleLocalFallback(path, method = 'GET', body = null, useAdmin = false) {
  seedLocalData();
  const normalizedPath = String(path || '').replace(/\/$/, '');

  if (normalizedPath === '/products' && method === 'GET') {
    return getProducts().map(normalizeLocalProduct);
  }

  if (/^\/products\/\d+$/.test(normalizedPath) && method === 'GET') {
    const id = Number(normalizedPath.split('/').pop());
    const found = getProducts().find(p => Number(p.id) === id);
    return found ? normalizeLocalProduct(found) : null;
  }

  if (normalizedPath === '/products' && method === 'POST') {
    const products = getProducts();
    const product = { ...body, id: Number(body.id) || Date.now(), nama_produk: body.nama_produk || body.name || '', kategori: body.kategori || body.category || 'makeup', harga: Number(body.harga ?? body.price ?? 0), foto_produk: normalizeStoredImageValue(body.foto_produk || body.foto || body.image || ''), deskripsi: body.deskripsi || body.desc || body.description || '', review: Array.isArray(body.review) ? body.review : [], stock: Number(body.stock ?? 0), emoji: body.emoji || '🎀', hot: Boolean(body.hot) };
    products.push(product);
    saveProducts(products);
    return normalizeLocalProduct(product);
  }

  if (/^\/products\/\d+$/.test(normalizedPath) && method === 'PUT') {
    const id = Number(normalizedPath.split('/').pop());
    const products = getProducts();
    const index = products.findIndex(p => Number(p.id) === id);
    if (index === -1) return null;
    const updated = { ...products[index], ...body, id, nama_produk: body.nama_produk || body.name || products[index].nama_produk, kategori: body.kategori || body.category || products[index].kategori, harga: Number(body.harga ?? body.price ?? products[index].harga ?? 0), foto_produk: normalizeStoredImageValue(body.foto_produk || body.foto || body.image || products[index].foto_produk || ''), deskripsi: body.deskripsi || body.desc || body.description || products[index].deskripsi, stock: Number(body.stock ?? products[index].stock ?? 0), emoji: body.emoji || products[index].emoji || '🎀', hot: Boolean(body.hot ?? products[index].hot) };
    products[index] = updated;
    saveProducts(products);
    return normalizeLocalProduct(updated);
  }

  if (/^\/products\/\d+$/.test(normalizedPath) && method === 'DELETE') {
    const id = Number(normalizedPath.split('/').pop());
    const products = getProducts().filter(p => Number(p.id) !== id);
    saveProducts(products);
    return null;
  }

  if (/^\/products\/\d+\/reviews$/.test(normalizedPath) && method === 'GET') {
    const id = Number(normalizedPath.split('/')[2]);
    const found = getProducts().find(p => Number(p.id) === id);
    return Array.isArray(found?.review) ? found.review : [];
  }

  if (/^\/products\/\d+\/reviews$/.test(normalizedPath) && method === 'POST') {
    const id = Number(normalizedPath.split('/')[2]);
    const products = getProducts();
    const product = products.find(p => Number(p.id) === id);
    if (!product) return null;
    const review = { id: createToken('rv'), productId: String(id), userId: getCurrentSession()?.userId || 'guest', name: body?.name || 'Guest', rating: Number(body?.rating || 0), text: body?.text || '', createdAt: new Date().toISOString() };
    product.review = Array.isArray(product.review) ? [review, ...product.review] : [review];
    saveProducts(products);
    return review;
  }

  if (normalizedPath === '/auth/login' && method === 'POST') {
    const user = getUsers().find(u => u.email === body?.email && u.password === body?.password);
    if (!user) throw new Error('Invalid credentials');
    const token = createLocalSession('user', user.id);
    setAuthToken(token);
    return { token, user: { id: user.id, nama: user.nama, email: user.email } };
  }

  if (normalizedPath === '/auth/register' && method === 'POST') {
    const users = getUsers();
    if (users.some(u => u.email === body?.email)) throw new Error('Email already registered');
    const user = { id: createToken('u'), nama: body?.nama || '', email: body?.email || '', password: body?.password || '' };
    users.push(user);
    saveUsers(users);
    return { id: user.id, nama: user.nama, email: user.email };
  }

  if (normalizedPath === '/auth/admin/login' && method === 'POST') {
    const admin = getAdminRecord();
    if (String(body?.password || '') !== String(admin.password)) throw new Error('Invalid admin credentials');
    const token = createLocalSession('admin', 'admin');
    setAdminToken(token);
    return { token, admin: { username: admin.username } };
  }

  if (normalizedPath === '/auth/me' && method === 'GET') {
    const session = getCurrentSession(false);
    if (!session) throw new Error('Unauthorized');
    const user = getUsers().find(u => u.id === session.userId);
    if (!user) throw new Error('Unauthorized');
    return { id: user.id, nama: user.nama, email: user.email };
  }

  if (normalizedPath === '/auth/admin/me' && method === 'GET') {
    const session = getCurrentSession(true);
    if (!session) throw new Error('Unauthorized');
    const admin = getAdminRecord();
    return { username: admin.username };
  }

  if (normalizedPath === '/cart' && method === 'GET') {
    const session = getCurrentSession(false);
    if (!session) return [];
    const carts = getCarts();
    const cart = carts.find(c => c.userId === session.userId);
    return cart ? cart.items : [];
  }

  if (normalizedPath === '/cart' && method === 'PUT') {
    const session = getCurrentSession(false);
    if (!session) return [];
    const carts = getCarts();
    let cart = carts.find(c => c.userId === session.userId);
    if (!cart) { cart = { userId: session.userId, items: [] }; carts.push(cart); }
    cart.items = Array.isArray(body?.items) ? body.items.map(item => ({ id: Number(item.id), qty: Number(item.qty) })) : [];
    saveCarts(carts);
    return cart.items;
  }

  if (normalizedPath === '/cart' && method === 'DELETE') {
    const session = getCurrentSession(false);
    if (!session) return null;
    const carts = getCarts().filter(c => c.userId !== session.userId);
    saveCarts(carts);
    return null;
  }

  if (normalizedPath === '/orders' && method === 'GET') {
    const session = getCurrentSession(false);
    if (!session) return [];
    const orders = getOrders();
    return session.role === 'admin' ? orders : orders.filter(o => o.userId === session.userId);
  }

  if (normalizedPath === '/orders' && method === 'POST') {
    const session = getCurrentSession(false);
    if (!session) throw new Error('Unauthorized');
    const orders = getOrders();
    const order = {
      orderNum: `IBA${Date.now().toString().slice(-6)}`,
      userId: session.userId,
      customerName: body?.customerName || '',
      customerPhone: body?.customerPhone || '',
      customerAddress: body?.customerAddress || '',
      items: Array.isArray(body?.items) ? body.items.map(item => ({ ...item, id: Number(item.id), qty: Number(item.qty) })) : [],
      subtotal: Number(body?.subtotal || 0),
      discount: Number(body?.discount || 0),
      shipping: Number(body?.shipping || 0),
      total: Number(body?.total || 0),
      payment: body?.payment || 'Transfer Bank',
      voucher: body?.voucher || null,
      status: 'Diproses',
      createdAt: new Date().toISOString()
    };
    orders.unshift(order);
    saveOrders(orders);
    return order;
  }

  if (/^\/orders\/[^/]+$/.test(normalizedPath) && method === 'PATCH') {
    const orderNum = normalizedPath.split('/').pop();
    const orders = getOrders();
    const order = orders.find(o => o.orderNum === orderNum);
    if (!order) return null;
    order.status = body?.status || order.status;
    saveOrders(orders);
    return order;
  }

  return null;
}

async function fetchProducts() {
  return apiRequest('/products');
}

async function fetchProduct(id) {
  return apiRequest(`/products/${id}`);
}

async function fetchProductReviews(id) {
  return apiRequest(`/products/${id}/reviews`);
}

async function postProductReview(id, review) {
  return apiRequest(`/products/${id}/reviews`, 'POST', review);
}

async function loginCustomer(email, password) {
  return apiRequest('/auth/login', 'POST', { email, password });
}

async function registerCustomer(nama, email, password) {
  return apiRequest('/auth/register', 'POST', { nama, email, password });
}

async function loginAdmin(password) {
  return apiRequest('/auth/admin/login', 'POST', { password });
}

async function fetchCurrentUser() {
  return apiRequest('/auth/me');
}

async function fetchAdminInfo() {
  return apiRequest('/auth/admin/me', 'GET', null, true);
}

async function fetchCart() {
  return apiRequest('/cart');
}

async function saveCart(items) {
  return apiRequest('/cart', 'PUT', { items });
}

async function clearCartServer() {
  return apiRequest('/cart', 'DELETE');
}

async function fetchOrders() {
  return apiRequest('/orders');
}

async function createOrder(payload) {
  return apiRequest('/orders', 'POST', payload);
}

async function updateOrderStatus(orderNum, status) {
  return apiRequest(`/orders/${orderNum}`, 'PATCH', { status }, true);
}

async function createProduct(product) {
  return apiRequest('/products', 'POST', product, true);
}

async function updateProduct(id, product) {
  return apiRequest(`/products/${id}`, 'PUT', product, true);
}

async function deleteProduct(id) {
  return apiRequest(`/products/${id}`, 'DELETE', null, true);
}

function mapDbProduct(product) {
  if (!product) return product;
  return {
    ...product,
    id: Number(product.id),
    name: product.nama_produk || product.name,
    price: Number(product.harga ?? product.price ?? 0),
    category: product.kategori || product.category,
    foto: product.foto_produk || product.foto || product.image,
    image: product.foto_produk || product.foto || product.image,
    desc: product.deskripsi || product.desc || product.description,
    review: Array.isArray(product.review) ? product.review : []
  };
}

function mapProducts(productList) {
  return Array.isArray(productList) ? productList.map(mapDbProduct) : [];
}
