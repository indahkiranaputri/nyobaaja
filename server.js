const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Database = require('better-sqlite3');

const DATA_PATH = path.join(__dirname, 'data', 'db.json');
const SQLITE_PATH = path.join(__dirname, 'data', 'db.sqlite');
const STATIC_ROOT = path.join(__dirname, '.');
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(STATIC_ROOT));

// Initialize SQLite DB (synchronous for simplicity)
let dbconn;
function initSqlite() {
  const dir = path.dirname(SQLITE_PATH);
  if (!fs.existsSync) {
    // fallback: fs.existsSync may not be available on some older environments, try-catch
  }
  try { require('fs').mkdirSync(dir, { recursive: true }); } catch(e) {}
  dbconn = new Database(SQLITE_PATH);
  // Create tables
  dbconn.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, nama TEXT, email TEXT, password TEXT);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, userId TEXT, role TEXT, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS admin (username TEXT, password TEXT);
    CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, nama_produk TEXT, kategori TEXT, harga REAL, foto_produk TEXT, deskripsi TEXT, review TEXT, stock INTEGER, emoji TEXT, hot INTEGER);
    CREATE TABLE IF NOT EXISTS orders (orderNum TEXT PRIMARY KEY, userId TEXT, customerName TEXT, customerPhone TEXT, customerAddress TEXT, items TEXT, subtotal REAL, discount REAL, shipping REAL, total REAL, payment TEXT, voucher TEXT, status TEXT, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS carts (userId TEXT PRIMARY KEY, items TEXT);
  `);
}

function sqlRun(stmt, params = {}) {
  return dbconn.prepare(stmt).run(params);
}

function sqlAll(stmt, params = {}) {
  return dbconn.prepare(stmt).all(params);
}

function sqlGet(stmt, params = {}) {
  return dbconn.prepare(stmt).get(params);
}

async function loadDb() {
  // Ensure sqlite initialized
  if (!dbconn) initSqlite();
  // Read rows and assemble JS object
  const users = sqlAll('SELECT * FROM users') || [];
  const sessions = sqlAll('SELECT * FROM sessions') || [];
  const adminRow = sqlGet('SELECT * FROM admin LIMIT 1') || { username: 'admin', password: 'admin123' };
  const productsRaw = sqlAll('SELECT * FROM products') || [];
  const products = (productsRaw || []).map(p => ({
    id: p.id,
    nama_produk: p.nama_produk,
    kategori: p.kategori,
    harga: p.harga,
    foto_produk: p.foto_produk,
    deskripsi: p.deskripsi,
    review: p.review ? JSON.parse(p.review) : [],
    stock: p.stock,
    emoji: p.emoji,
    hot: Boolean(p.hot)
  }));
  const ordersRaw = sqlAll('SELECT * FROM orders') || [];
  const orders = (ordersRaw || []).map(o => ({
    orderNum: o.orderNum,
    userId: o.userId,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerAddress: o.customerAddress,
    items: o.items ? JSON.parse(o.items) : [],
    subtotal: o.subtotal,
    discount: o.discount,
    shipping: o.shipping,
    total: o.total,
    payment: o.payment,
    voucher: o.voucher,
    status: o.status,
    createdAt: o.createdAt
  }));
  const cartsRaw = sqlAll('SELECT * FROM carts') || [];
  const carts = (cartsRaw || []).map(c => ({ userId: c.userId, items: c.items ? JSON.parse(c.items) : [] }));
  return { users, admin: adminRow, products, orders, carts, sessions };
}

async function saveDb(db) {
  if (!dbconn) initSqlite();
  const trx = dbconn.transaction(() => {
    // Clear tables
    dbconn.exec('DELETE FROM users; DELETE FROM sessions; DELETE FROM admin; DELETE FROM products; DELETE FROM orders; DELETE FROM carts;');
    const insertUser = dbconn.prepare('INSERT INTO users (id,nama,email,password) VALUES (@id,@nama,@email,@password)');
    for (const u of db.users || []) insertUser.run(u);
    const insertSession = dbconn.prepare('INSERT INTO sessions (token,userId,role,createdAt) VALUES (@token,@userId,@role,@createdAt)');
    for (const s of db.sessions || []) insertSession.run(s);
    const insertAdmin = dbconn.prepare('INSERT INTO admin (username,password) VALUES (@username,@password)');
    insertAdmin.run(db.admin || { username: 'admin', password: 'admin123' });
    const insertProduct = dbconn.prepare('INSERT INTO products (id,nama_produk,kategori,harga,foto_produk,deskripsi,review,stock,emoji,hot) VALUES (@id,@nama_produk,@kategori,@harga,@foto_produk,@deskripsi,@review,@stock,@emoji,@hot)');
    for (const p of db.products || []) insertProduct.run({ id: p.id, nama_produk: p.nama_produk, kategori: p.kategori, harga: p.harga, foto_produk: p.foto_produk || p.foto, deskripsi: p.deskripsi, review: JSON.stringify(p.review || []), stock: p.stock || 0, emoji: p.emoji || '🎀', hot: p.hot ? 1 : 0 });
    const insertOrder = dbconn.prepare('INSERT INTO orders (orderNum,userId,customerName,customerPhone,customerAddress,items,subtotal,discount,shipping,total,payment,voucher,status,createdAt) VALUES (@orderNum,@userId,@customerName,@customerPhone,@customerAddress,@items,@subtotal,@discount,@shipping,@total,@payment,@voucher,@status,@createdAt)');
    for (const o of db.orders || []) insertOrder.run({ orderNum: o.orderNum, userId: o.userId, customerName: o.customerName, customerPhone: o.customerPhone, customerAddress: o.customerAddress, items: JSON.stringify(o.items || []), subtotal: o.subtotal || 0, discount: o.discount || 0, shipping: o.shipping || 0, total: o.total || 0, payment: o.payment || '', voucher: o.voucher || null, status: o.status || 'Diproses', createdAt: o.createdAt || new Date().toISOString() });
    const insertCart = dbconn.prepare('INSERT INTO carts (userId, items) VALUES (@userId, @items)');
    for (const c of db.carts || []) insertCart.run({ userId: c.userId, items: JSON.stringify(c.items || []) });
  });
  trx();
}

// If sqlite empty, try migrate from db.json
async function migrateIfNeeded() {
  try {
    if (!dbconn) initSqlite();
    const row = sqlGet('SELECT COUNT(*) as c FROM products');
    if (!row || row.c === 0) {
      // load json if exists
      try {
        const raw = await fs.readFile(DATA_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        await saveDb(parsed);
        console.log('Migrated data/db.json → SQLite');
      } catch(e) {
        // create default
        const initial = { users: [], admin: { username: 'admin', password: 'admin123' }, products: [], orders: [], carts: [], sessions: [] };
        await saveDb(initial);
      }
    }
  } catch(e) {
    console.error('Migration error', e.message);
  }
}

function createToken() {
  return uuidv4();
}

function inferCategoryFromName(name) {
  const value = String(name || '').toLowerCase();
  if (/(liptint|lipstik|blushon|eyeshadow|highlighter|two way cake|two-way-cake)/.test(value)) return 'makeup';
  if (/(parfum|parfume).*(1|2|3|4|5)/.test(value) || /(parfum|parfume)/.test(value)) return 'parfum';
  if (/(ampoule|serum|cleansing|mois|moisturizer|claymask|clay mask|gel cream|gelcream)/.test(value)) return 'skincare';
  if (/(shampoo|serum oil|conditioner|hair oil)/.test(value)) return 'haircare';
  if (/(scrub|body wash|bodywash|lotion)/.test(value)) return 'bodycare';
  return 'lainnya';
}

function inferImageFromName(name) {
  const value = String(name || '').toLowerCase();
  if (/(liptint)/.test(value)) return 'image/liptint.jpg.jpeg';
  if (/(lipstik)/.test(value)) return 'image/lipstik.jpg.jpeg';
  if (/(blushon)/.test(value)) return 'image/blushon.jpg.jpeg';
  if (/(eyeshadow)/.test(value)) return 'image/eyshadow.jpg.jpeg';
  if (/(highlighter)/.test(value)) return 'image/highlighter baru.jpeg';
  if (/(two way cake|two-way-cake)/.test(value)) return 'image/two way cake.jpg.jpeg';
  if (/(parfum|parfume).*(1|2|3|4|5)/.test(value)) return value.includes('4') || value.includes('5') ? 'image/parfum 4.jpg.jpeg' : value.includes('2') ? 'image/parfum baru 2.jpeg' : value.includes('3') ? 'image/parfum baru 3.jpeg' : 'image/parfum baru 1.jpeg';
  if (/(ampoule)/.test(value)) return 'image/ampoule baru.jpeg';
  if (/(serum)/.test(value)) return 'image/serum oil.jpg.jpeg';
  if (/(cleansing|foam)/.test(value)) return 'image/cleansing foam.jpg.jpeg';
  if (/(mois|moisturizer)/.test(value)) return 'image/mois.jpg.jpeg';
  if (/(claymask|clay mask)/.test(value)) return 'image/claymask baru.jpeg';
  if (/(gel cream|gelcream)/.test(value)) return 'image/gel cream.jpg.jpeg';
  if (/(shampoo)/.test(value)) return 'image/shampo.jpg.jpeg';
  if (/(conditioner)/.test(value)) return 'image/conditioner.jpg.jpeg';
  if (/(hair oil)/.test(value)) return 'image/hair oil.jpg.jpeg';
  if (/(scrub)/.test(value)) return 'image/scrub.jpg.jpeg';
  if (/(body wash|bodywash)/.test(value)) return 'image/body wash.jpg.jpeg';
  if (/(lotion)/.test(value)) return 'image/lotion baru.jpeg';
  return '';
}

function mapProduct(item) {
  const name = String(item?.nama_produk || item?.name || '').trim();
  const inferredCategory = normalizeCategoryValue(item?.kategori || item?.category || inferCategoryFromName(name));
  const inferredImage = item?.foto_produk || item?.foto || item?.image || inferImageFromName(name);
  return {
    ...item,
    name,
    price: Number(item?.harga ?? item?.price ?? 0),
    category: inferredCategory,
    foto: inferredImage,
    image: inferredImage,
    desc: item?.deskripsi || item?.desc || item?.description || '',
    review: Array.isArray(item.review) ? item.review : [],
    nama_produk: name,
    kategori: inferredCategory,
    harga: Number(item?.harga ?? item?.price ?? 0),
    foto_produk: inferredImage,
    deskripsi: item?.deskripsi || item?.desc || item?.description || ''
  };
}

function normalizeCategoryValue(value) {
  const raw = String(value || '').trim().toLowerCase();
  const mapped = {
    skincare: 'skincare',
    bodycare: 'bodycare',
    haircare: 'haircare',
    makeup: 'makeup',
    perfume: 'parfum',
    parfum: 'parfum',
    'body wash': 'bodycare',
    bodywash: 'bodycare',
    'body-wash': 'bodycare',
    lotion: 'bodycare',
    scrub: 'bodycare',
    shampoo: 'haircare',
    'serum oil': 'haircare',
    conditioner: 'haircare',
    'hair oil': 'haircare',
    ampoule: 'skincare',
    serum: 'skincare',
    cleansing: 'skincare',
    'cleansing foam': 'skincare',
    mois: 'skincare',
    moisturizer: 'skincare',
    claymask: 'skincare',
    'clay mask': 'skincare',
    'gel cream': 'skincare',
    gelcream: 'skincare',
    liptint: 'makeup',
    lipstik: 'makeup',
    blushon: 'makeup',
    eyeshadow: 'makeup',
    highlighter: 'makeup',
    'two way cake': 'makeup',
    'two-way-cake': 'makeup',
    'parfum 1': 'parfum',
    'parfum 2': 'parfum',
    'parfum 3': 'parfum',
    'parfum 4': 'parfum',
    'parfum 5': 'parfum',
    'parfume 4': 'parfum',
    'parfume 5': 'parfum'
  };
  return mapped[raw] || raw || 'lainnya';
}

function normalizeProductBody(body) {
  return {
    id: body.id || Date.now(),
    nama_produk: body.nama_produk || body.name || '',
    kategori: normalizeCategoryValue(body.kategori || body.category || 'lainnya'),
    harga: Number(body.harga || body.price || 0),
    foto_produk: body.foto_produk || body.foto || body.image || '',
    deskripsi: body.deskripsi || body.desc || body.description || '',
    review: Array.isArray(body.review) ? body.review : [],
    stock: Number(body.stock ?? 0),
    emoji: body.emoji || '🎀',
    hot: Boolean(body.hot)
  };
}

function findSession(db, token) {
  if (!token) return null;
  return db.sessions.find(s => s.token === token) || null;
}

function getAuthToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function requireAuth(req, res, next) {
  loadDb().then(db => {
    const token = getAuthToken(req);
    const session = findSession(db, token);
    if (!session || !session.userId) return res.status(401).json({ error: 'Unauthorized' });
    req.user = db.users.find(u => u.id === session.userId);
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    next();
  }).catch(err => res.status(500).json({ error: err.message }));
}

function requireAdmin(req, res, next) {
  loadDb().then(db => {
    const token = getAuthToken(req);
    const session = findSession(db, token);
    if (!session || session.role !== 'admin') return res.status(401).json({ error: 'Unauthorized' });
    req.admin = db.admin;
    next();
  }).catch(err => res.status(500).json({ error: err.message }));
}

app.get('/api/products', async (req, res) => {
  const db = await loadDb();
  const products = (db.products || []).map(mapProduct);
  res.json(products);
});

app.get('/api/health', async (req, res) => {
  try {
    // quick sqlite check
    if (!dbconn) initSqlite();
    const row = sqlGet('SELECT 1 as ok');
    res.json({ ok: true, db: 'sqlite' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  const db = await loadDb();
  const product = db.products.find(p => String(p.id) === String(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(mapProduct(product));
});

app.post('/api/products', requireAdmin, async (req, res) => {
  const db = await loadDb();
  const product = normalizeProductBody(req.body);
  product.id = Number(product.id) || Math.max(0, ...db.products.map(p => Number(p.id))) + 1;
  db.products.push(product);
  await saveDb(db);
  res.status(201).json(mapProduct(product));
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  const db = await loadDb();
  const idx = db.products.findIndex(p => String(p.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  const existing = db.products[idx];
  const updated = normalizeProductBody({ ...existing, ...req.body, id: existing.id });
  db.products[idx] = updated;
  await saveDb(db);
  res.json(mapProduct(updated));
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  const db = await loadDb();
  const idx = db.products.findIndex(p => String(p.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  db.products.splice(idx, 1);
  await saveDb(db);
  res.status(204).end();
});

app.get('/api/products/:id/reviews', async (req, res) => {
  const db = await loadDb();
  const product = db.products.find(p => String(p.id) === String(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(Array.isArray(product.review) ? product.review : []);
});

app.post('/api/products/:id/reviews', requireAuth, async (req, res) => {
  const db = await loadDb();
  const product = db.products.find(p => String(p.id) === String(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const existingReview = Array.isArray(product.review)
    ? product.review.find(r => r.userId === req.user.id)
    : null;
  if (existingReview) return res.status(409).json({ error: 'Duplicate review not allowed' });

  const review = {
    id: `rv_${Date.now()}`,
    productId: String(product.id),
    userId: req.user.id,
    name: req.body.name || req.user.nama,
    rating: Number(req.body.rating || 0),
    text: req.body.text || '',
    createdAt: new Date().toISOString()
  };
  product.review = Array.isArray(product.review) ? product.review : [];
  product.review.unshift(review);
  await saveDb(db);
  res.status(201).json(review);
});

app.post('/api/auth/register', async (req, res) => {
  const db = await loadDb();
  const nama = String(req.body.nama || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!nama || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (db.users.some(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const user = { id: `u_${Date.now()}`, nama, email, password };
  db.users.push(user);
  await saveDb(db);
  res.status(201).json({ id: user.id, nama: user.nama, email: user.email });
});

app.post('/api/auth/login', async (req, res) => {
  const db = await loadDb();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = createToken();
  db.sessions.push({ token, userId: user.id, role: 'user', createdAt: new Date().toISOString() });
  await saveDb(db);
  res.json({ token, user: { id: user.id, nama: user.nama, email: user.email } });
});

app.post('/api/auth/admin/login', async (req, res) => {
  const db = await loadDb();
  const password = String(req.body.password || '');
  if (password !== String(db.admin.password)) return res.status(401).json({ error: 'Invalid admin credentials' });
  const token = createToken();
  db.sessions.push({ token, role: 'admin', createdAt: new Date().toISOString() });
  await saveDb(db);
  res.json({ token, admin: { username: db.admin.username } });
});

app.get('/api/auth/me', async (req, res) => {
  const db = await loadDb();
  const token = getAuthToken(req);
  const session = findSession(db, token);
  if (!session || session.role !== 'user') return res.status(401).json({ error: 'Unauthorized' });
  const user = db.users.find(u => u.id === session.userId);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ id: user.id, nama: user.nama, email: user.email });
});

app.get('/api/auth/admin/me', async (req, res) => {
  const db = await loadDb();
  const token = getAuthToken(req);
  const session = findSession(db, token);
  if (!session || session.role !== 'admin') return res.status(401).json({ error: 'Unauthorized' });
  res.json({ username: db.admin.username });
});

app.get('/api/cart', requireAuth, async (req, res) => {
  const db = await loadDb();
  const cart = db.carts.find(c => c.userId === req.user.id);
  res.json(cart ? cart.items : []);
});

app.put('/api/cart', requireAuth, async (req, res) => {
  const db = await loadDb();
  const items = Array.isArray(req.body.items) ? req.body.items.map(item => ({ id: Number(item.id), qty: Number(item.qty) })) : [];
  let cart = db.carts.find(c => c.userId === req.user.id);
  if (!cart) {
    cart = { userId: req.user.id, items: [] };
    db.carts.push(cart);
  }
  cart.items = items.filter(item => Number(item.qty) > 0);
  await saveDb(db);
  res.json(cart.items);
});

app.delete('/api/cart', requireAuth, async (req, res) => {
  const db = await loadDb();
  const idx = db.carts.findIndex(c => c.userId === req.user.id);
  if (idx !== -1) db.carts.splice(idx, 1);
  await saveDb(db);
  res.status(204).end();
});

app.get('/api/orders', async (req, res) => {
  const db = await loadDb();
  const token = getAuthToken(req);
  const session = findSession(db, token);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  if (session.role === 'admin') {
    return res.json(db.orders || []);
  }
  const orders = (db.orders || []).filter(o => o.userId === session.userId);
  res.json(orders);
});

app.post('/api/orders', requireAuth, async (req, res) => {
  const db = await loadDb();
  const session = findSession(db, getAuthToken(req));
  const items = Array.isArray(req.body.items) ? req.body.items.map(item => ({ ...item, id: Number(item.id), qty: Number(item.qty) })) : [];
  const total = Number(req.body.total || 0);
  const orderNum = `IBA${Date.now().toString().slice(-6)}`;
  const order = {
    orderNum,
    userId: req.user.id,
    customerName: req.body.customerName || req.user.nama,
    customerPhone: req.body.customerPhone || '',
    customerAddress: req.body.customerAddress || '',
    items,
    subtotal: Number(req.body.subtotal || 0),
    discount: Number(req.body.discount || 0),
    shipping: Number(req.body.shipping || 0),
    total,
    payment: req.body.payment || 'Transfer Bank',
    voucher: req.body.voucher || null,
    status: 'Diproses',
    createdAt: new Date().toISOString()
  };
  db.orders.unshift(order);
  const cartIndex = db.carts.findIndex(c => c.userId === req.user.id);
  if (cartIndex !== -1) db.carts.splice(cartIndex, 1);
  await saveDb(db);
  res.status(201).json(order);
});

app.patch('/api/orders/:orderNum', requireAdmin, async (req, res) => {
  const db = await loadDb();
  const order = db.orders.find(o => o.orderNum === req.params.orderNum);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = String(req.body.status || order.status);
  await saveDb(db);
  res.json(order);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize sqlite and migrate if needed, then start server
(async () => {
  try {
    initSqlite();
    await migrateIfNeeded();
  } catch(e) {
    console.error('DB init error', e.message);
  }
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
