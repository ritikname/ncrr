
// ... existing imports ...
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

type D1Database = any;
type R2Bucket = any;

type Bindings = {
  DB: D1Database;
  IMAGES_BUCKET: R2Bucket;
  ASSETS: any;
  JWT_SECRET: string;
  OWNER_EMAIL: string;
  OWNER_PASSWORD: string;      
  OWNER_PASSWORD_HASH: string; 
  GOOGLE_SCRIPT_URL: string;
  TELEGRAM_LEAD_BOT_TOKEN: string;
  TELEGRAM_BOOKING_BOT_TOKEN: string;
  TELEGRAM_OWNER_CHAT_ID: string;
};

type Variables = {
  user: any;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ... (CORS, Middleware, Helper functions remain same) ...
app.use('/*', cors({
  origin: (origin) => origin,
  credentials: true,
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type'],
}));

const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

api.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

const authMiddleware = async (c: any, next: any) => {
  const token = getCookie(c, 'auth_token');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const payload = await verify(token, c.env.JWT_SECRET || 'dev-secret-key', 'HS256');
    c.set('user', payload);
    await next();
  } catch (e) {
    return c.json({ error: 'Invalid Token' }, 401);
  }
};

const ownerMiddleware = async (c: any, next: any) => {
  const user = c.get('user');
  if (user?.role !== 'owner') return c.json({ error: 'Forbidden' }, 403);
  await next();
};

async function uploadToR2(bucket: R2Bucket, file: File, folder: string): Promise<string> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const uniqueKey = `${folder}/${crypto.randomUUID()}-${cleanName}`;
  await bucket.put(uniqueKey, file);
  return `/api/images/${uniqueKey}`;
}

async function sendTelegramNotification(token: string, chatId: string, message: string) {
  if (!token || !chatId) { console.warn("Telegram tokens missing"); return; }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
  } catch (e) { console.error('Telegram Notification Failed:', e); }
}

async function sendEmailViaScript(env: Bindings, payload: any) {
  if (!env.GOOGLE_SCRIPT_URL) return;
  try {
    await fetch(env.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
  } catch (e) { console.error('Email Notification Failed:', e); }
}

api.get('/init', async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database connection failed' }, 500);
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE NOT NULL, phone TEXT, password_hash TEXT NOT NULL, role TEXT CHECK(role IN ('customer','owner')) DEFAULT 'customer', reset_token_hash TEXT, reset_token_expires INTEGER, created_at INTEGER DEFAULT (unixepoch()))`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS cars (id INTEGER PRIMARY KEY AUTOINCREMENT, uuid TEXT UNIQUE NOT NULL, name TEXT NOT NULL, price_per_day INTEGER NOT NULL, image_url TEXT NOT NULL, gallery_images TEXT, category TEXT, fuel_type TEXT, transmission TEXT, seats INTEGER, rating REAL, total_stock INTEGER DEFAULT 1, status TEXT CHECK(status IN ('available','sold')) DEFAULT 'available', created_at INTEGER DEFAULT (unixepoch()))`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, car_id TEXT NOT NULL, car_name TEXT, car_image TEXT, user_email TEXT NOT NULL, customer_name TEXT, customer_phone TEXT, start_date TEXT, end_date TEXT, total_cost INTEGER, advance_amount INTEGER, transaction_id TEXT, status TEXT DEFAULT 'confirmed', is_approved BOOLEAN DEFAULT 0, aadhar_front TEXT, aadhar_back TEXT, license_photo TEXT, location TEXT, user_gps TEXT, security_deposit_type TEXT, security_deposit_transaction_id TEXT, signature TEXT, promo_code TEXT, discount_amount INTEGER, created_at INTEGER DEFAULT (unixepoch()))`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), payment_qr TEXT, hero_slides TEXT, updated_at INTEGER DEFAULT (unixepoch()))`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS promo_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL, percentage INTEGER NOT NULL, created_at INTEGER DEFAULT (unixepoch()))`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS promo_usage (id INTEGER PRIMARY KEY AUTOINCREMENT, promo_code TEXT NOT NULL, user_email TEXT NOT NULL, created_at INTEGER DEFAULT (unixepoch()))`)
    ]);
    
    await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (id, payment_qr, hero_slides) VALUES (1, '', '[]')`).run();
    return c.json({ success: true, message: "Database tables initialized." });
  } catch (e: any) {
    return c.json({ error: "Failed to init DB: " + e.message }, 500);
  }
});

api.get('/images/:folder/:filename', async (c) => {
  const folder = c.req.param('folder');
  const filename = c.req.param('filename');
  const key = `${folder}/${filename}`;
  if (!c.env.IMAGES_BUCKET) return c.text('Image Bucket Not Configured', 500);
  const object = await c.env.IMAGES_BUCKET.get(key);
  if (!object) return c.text('Image Not Found', 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Content-Disposition', 'inline');
  return new Response(object.body, { headers });
});

// --- UPDATED ANALYTICS ENDPOINT ---
api.get('/owner/sales-report', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'DB Error' }, 500);

  const queryParams = c.req.query();
  const range = queryParams.range || 'monthly';
  const customStart = queryParams.startDate;
  const customEnd = queryParams.endDate;

  const now = new Date();
  
  // 1. Determine Time Window & Grouping
  let startTs: number;
  let endTs: number = Math.floor(now.getTime() / 1000);
  let grouping: 'day' | 'week' | 'month' | 'year' = 'month';

  if (range === 'custom' && customStart && customEnd) {
      startTs = Math.floor(new Date(customStart).getTime() / 1000);
      // Set end of the end date (23:59:59)
      const eDate = new Date(customEnd);
      eDate.setHours(23, 59, 59, 999);
      endTs = Math.floor(eDate.getTime() / 1000);

      const diffDays = (endTs - startTs) / (60 * 60 * 24);
      if (diffDays <= 31) grouping = 'day';
      else if (diffDays <= 180) grouping = 'week';
      else grouping = 'month';
  } else if (range === '7d') {
      startTs = endTs - (7 * 24 * 60 * 60);
      grouping = 'day';
  } else if (range === '8w') {
      startTs = endTs - (8 * 7 * 24 * 60 * 60);
      grouping = 'week';
  } else if (range === 'yearly') {
      startTs = 0; // All time
      grouping = 'year';
  } else {
      // Default: Monthly (Current Year)
      const currentYear = now.getFullYear();
      startTs = Math.floor(new Date(currentYear, 0, 1).getTime() / 1000);
      grouping = 'month';
  }

  const query = async (sql: string, params: any[] = []) => {
      const { results } = await c.env.DB.prepare(sql).bind(...params).all();
      return results;
  };

  try {
      // 2. Generate Time Slots (Zero Filling)
      const labels: string[] = [];
      const values: number[] = [];
      const map = new Map<string, number>();

      if (grouping === 'day') {
          // Loop daily
          for (let t = startTs; t <= endTs; t += 86400) {
              const d = new Date(t * 1000);
              const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
              const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }); // Mon 12
              map.set(key, 0);
              labels.push(label);
              values.push(0);
          }
      } else if (grouping === 'week') {
          // Loop weekly (approximate for display)
          // Align startTs to the beginning of the week if possible, or just step by 7 days
          let t = startTs;
          while (t <= endTs) {
              const d = new Date(t * 1000);
              // Key: ISO Year-Week or just use the date of the week start
              const key = `${d.getFullYear()}-${Math.floor(d.getDate()/7)}`; // Rough unique key
              // Better: use date string of the specific point
              // We'll use SQLite strftime('%Y-%W') for grouping match
              // To align JS and SQL, let's use the date of the label
              const label = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
              labels.push(label);
              values.push(0);
              t += (7 * 24 * 60 * 60);
          }
      } else if (grouping === 'month') {
          const sDate = new Date(startTs * 1000);
          const eDate = new Date(endTs * 1000);
          let curr = new Date(sDate.getFullYear(), sDate.getMonth(), 1);
          
          while (curr <= eDate) {
              const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
              const label = curr.toLocaleString('default', { month: 'short' });
              map.set(key, 0);
              labels.push(label);
              values.push(0);
              curr.setMonth(curr.getMonth() + 1);
          }
      } else if (grouping === 'year') {
          // Check available years in DB or just last 5
          const dbYears = await query(`SELECT DISTINCT strftime('%Y', datetime(created_at, 'unixepoch')) as year FROM bookings ORDER BY year ASC`);
          if (dbYears && dbYears.length > 0) {
              dbYears.forEach((row: any) => {
                  map.set(row.year, 0);
                  labels.push(row.year);
                  values.push(0);
              });
          } else {
              const y = String(new Date().getFullYear());
              map.set(y, 0);
              labels.push(y);
              values.push(0);
          }
      }

      // 3. Query Aggregated Data
      let sql = "";
      if (grouping === 'day') {
          sql = `SELECT strftime('%Y-%m-%d', datetime(created_at, 'unixepoch')) as period, SUM(total_cost) as total FROM bookings WHERE status != 'cancelled' AND created_at >= ? AND created_at <= ? GROUP BY period`;
      } else if (grouping === 'week') {
          // For weekly, matching exact JS buckets is tricky.
          // Simplification: Select raw and bucket in JS for 'week' to ensure alignment
          sql = `SELECT created_at, total_cost FROM bookings WHERE status != 'cancelled' AND created_at >= ? AND created_at <= ?`;
      } else if (grouping === 'month') {
          sql = `SELECT strftime('%Y-%m', datetime(created_at, 'unixepoch')) as period, SUM(total_cost) as total FROM bookings WHERE status != 'cancelled' AND created_at >= ? AND created_at <= ? GROUP BY period`;
      } else if (grouping === 'year') {
          sql = `SELECT strftime('%Y', datetime(created_at, 'unixepoch')) as period, SUM(total_cost) as total FROM bookings WHERE status != 'cancelled' GROUP BY period`;
      }

      const rawData = await query(sql, grouping === 'year' ? [] : [startTs, endTs]);

      // 4. Merge Data
      if (grouping === 'week') {
          // Custom bucket logic for weeks to match JS loop
          // Re-generate labels/values based on actual data distribution or fixed 8 buckets
          // The JS loop above generated labels based on startTs step. 
          // Let's refill values.
          rawData.forEach((row: any) => {
              const rowTs = row.created_at;
              // Find which bin this falls into
              const offset = rowTs - startTs;
              const weekIdx = Math.floor(offset / (7 * 24 * 60 * 60));
              if (weekIdx >= 0 && weekIdx < values.length) {
                  values[weekIdx] += row.total_cost;
              }
          });
      } else {
          // Map based logic
          rawData.forEach((row: any) => {
              if (map.has(row.period)) {
                  // Find index
                  // For years/months/days where map keys are set
                  // We need to update the values array at the correct index
                  // Re-iterate or use index map
                  // Simple approach: map period -> total, then rebuild array? 
                  // No, 'labels' is master.
                  map.set(row.period, row.total);
              }
          });
          // Re-populate values from map, assuming insertion order preserved or we use keys
          // Actually, map iteration order is insertion order.
          // Let's just update values array by finding index
          if (grouping === 'year') {
             // Re-map
             labels.forEach((lbl, idx) => {
                 if (map.has(lbl)) values[idx] = map.get(lbl) || 0;
             });
          } else {
             // For day/month, we constructed map keys carefully
             // Re-construct values based on map keys? 
             // We pushed to labels and values simultaneously. 
             // Let's rely on constructing a fresh values array from map
             // We need to know which label corresponds to which map key. 
             // In the loop above:
             // Day: key=YYYY-MM-DD, label=Mon 12. 
             // We need to store relationship.
             
             // Refined merge strategy:
             const periodToTotal = new Map<string, number>();
             rawData.forEach((r: any) => periodToTotal.set(r.period, r.total));
             
             // Re-loop to fill values
             if (grouping === 'day') {
                 for (let i = 0; i < labels.length; i++) {
                     // Re-calculate key... inefficient. 
                     // Let's assume the loop above is consistent.
                     const t = startTs + (i * 86400);
                     const d = new Date(t * 1000);
                     const key = d.toISOString().split('T')[0];
                     values[i] = periodToTotal.get(key) || 0;
                 }
             } else if (grouping === 'month') {
                 const sDate = new Date(startTs * 1000);
                 for (let i = 0; i < labels.length; i++) {
                     const curr = new Date(sDate.getFullYear(), sDate.getMonth() + i, 1);
                     const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;
                     values[i] = periodToTotal.get(key) || 0;
                 }
             }
          }
      }

      // 5. Global Stats (Lifetime - per UI requirements)
      const stats = await c.env.DB.prepare("SELECT SUM(total_cost) as totalRevenue, COUNT(*) as totalBookings FROM bookings WHERE status != 'cancelled'").first();
      
      // 6. Insights (Filtered by Time Range)
      const topCars = await query(`
        SELECT car_name, COUNT(*) as quantity, SUM(total_cost) as revenue
        FROM bookings
        WHERE status != 'cancelled' AND created_at >= ? AND created_at <= ?
        GROUP BY car_name
        ORDER BY revenue DESC
        LIMIT 5
      `, [startTs, endTs]);

      const typeData = await query(`
        SELECT COALESCE(c.category, 'Other') as category, COUNT(b.id) as quantity, SUM(b.total_cost) as revenue
        FROM bookings b
        LEFT JOIN cars c ON b.car_id = c.uuid
        WHERE b.status != 'cancelled' AND b.created_at >= ? AND b.created_at <= ?
        GROUP BY c.category
        ORDER BY revenue DESC
      `, [startTs, endTs]);

      const weeklyCarData = await query(`
        SELECT car_name, COUNT(*) as quantity, SUM(total_cost) as revenue
        FROM bookings
        WHERE status != 'cancelled' AND created_at >= ? AND created_at <= ?
        GROUP BY car_name
        ORDER BY revenue DESC
      `, [startTs, endTs]);

      return c.json({
          chart: { labels, values },
          stats: {
              totalRevenue: stats?.totalRevenue || 0,
              totalBookings: stats?.totalBookings || 0,
              avgBookingValue: stats?.totalBookings > 0 ? Math.round(stats.totalRevenue / stats.totalBookings) : 0
          },
          insights: {
              weeklySales: { // Re-using name 'weeklySales' but it's now 'filteredSales'
                  labels: weeklyCarData ? weeklyCarData.map((d: any) => d.car_name) : [],
                  revenue: weeklyCarData ? weeklyCarData.map((d: any) => d.revenue) : [],
                  quantity: weeklyCarData ? weeklyCarData.map((d: any) => d.quantity) : []
              },
              topCars: topCars || [],
              typePerformance: typeData || []
          }
      });

  } catch (e: any) {
      console.error('Analytics Error:', e);
      return c.json({
          chart: { labels: [], values: [] },
          stats: { totalRevenue: 0, totalBookings: 0, avgBookingValue: 0 },
          insights: { weeklySales: { labels: [], revenue: [], quantity: [] }, topCars: [], typePerformance: [] }
      });
  }
});

// ... (Rest of the auth/car/booking routes) ...
api.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    let user;
    let role = 'customer';
    const ownerEmail = c.env.OWNER_EMAIL ? c.env.OWNER_EMAIL.trim().toLowerCase() : '';
    const loginEmail = email ? email.trim().toLowerCase() : '';
    const isOwnerEmail = ownerEmail && loginEmail === ownerEmail;
    if (isOwnerEmail) {
      let validOwner = false;
      if (c.env.OWNER_PASSWORD && password === c.env.OWNER_PASSWORD) validOwner = true;
      else if (c.env.OWNER_PASSWORD_HASH) validOwner = await bcrypt.compare(password, c.env.OWNER_PASSWORD_HASH);
      if (!validOwner) return c.json({ error: 'Invalid owner credentials' }, 401);
      role = 'owner';
      user = { id: 0, name: 'Owner', email: c.env.OWNER_EMAIL, role: 'owner' };
    } else {
      if (!c.env.DB) return c.json({ error: 'Database connection failed.' }, 500);
      user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
      if (!user) return c.json({ error: 'Invalid credentials' }, 401);
      const validPass = await bcrypt.compare(password, user.password_hash);
      if (!validPass) return c.json({ error: 'Invalid credentials' }, 401);
      if (user.role) role = user.role;
    }
    const token = await sign({ id: user.id, name: user.name, email: user.email, role: role, exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) }, c.env.JWT_SECRET || 'dev-secret-key', 'HS256');
    setCookie(c, 'auth_token', token, { httpOnly: true, secure: true, sameSite: 'Strict', path: '/', maxAge: 7 * 24 * 60 * 60 });
    return c.json({ success: true, user: { name: user.name, email: user.email, role } });
  } catch (e: any) { return c.json({ error: e.message || 'Login failed' }, 500); }
});

api.post('/auth/signup', async (c) => {
  const { name, email, phone, password } = await c.req.json();
  const hash = await bcrypt.hash(password, 10);
  try {
    if (!c.env.DB) return c.json({ error: 'Database connection failed.' }, 500);
    await c.env.DB.prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)').bind(name, email, phone, hash).run();
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return c.json({ error: 'Email already exists' }, 409);
    return c.json({ error: 'Signup failed: ' + e.message }, 500);
  }
});

api.post('/auth/onboard', async (c) => {
  const { name, phone } = await c.req.json();
  if (!name || !phone) return c.json({ error: 'Missing fields' }, 400);
  try {
    if (!c.env.DB) return c.json({ error: 'Database not ready' }, 500);
    const safePhone = phone.replace(/\D/g, '');
    const dummyEmail = `guest_${safePhone}@ncrdrive.com`.toLowerCase(); 
    const dummyHash = await bcrypt.hash('guest_user_no_login_possible', 10);
    const exists = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(dummyEmail).first();
    let teleMsg = '';
    if (!exists) {
       await c.env.DB.prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)').bind(name, dummyEmail, phone, dummyHash).run();
       teleMsg = `🌟 NEW LEAD RECEIVED\n\nName: ${name}\nPhone: ${phone}`;
    } else {
       await c.env.DB.prepare('UPDATE users SET name = ?, phone = ?, created_at = unixepoch() WHERE email = ?').bind(name, phone, dummyEmail).run();
       teleMsg = `♻️ LEAD RETURNED\n\nName: ${name}\nPhone: ${phone}`;
    }
    c.executionCtx.waitUntil(sendTelegramNotification(c.env.TELEGRAM_LEAD_BOT_TOKEN, c.env.TELEGRAM_OWNER_CHAT_ID, teleMsg));
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }); }
});

api.get('/auth/me', authMiddleware, async (c) => { return c.json(c.get('user')); });
api.post('/auth/logout', (c) => { deleteCookie(c, 'auth_token'); return c.json({ success: true }); });

api.post('/auth/forgot-password', async (c) => {
  const { email } = await c.req.json();
  if (!c.env.DB) return c.json({ error: 'Database connection failed' }, 500);
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return c.json({ success: true }); 
  const token = crypto.randomUUID();
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = Date.now() + (1000 * 60 * 60);
  await c.env.DB.prepare('UPDATE users SET reset_token_hash = ?, reset_token_expires = ? WHERE email = ?').bind(tokenHash, expiresAt, email).run();
  const origin = c.req.header('origin') || new URL(c.req.url).origin;
  const resetLink = `${origin}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
  c.executionCtx.waitUntil(sendEmailViaScript(c.env, { to_email: email, subject: "Action Required: Password Reset", customer_name: user.name, ref_id: "RESET", car_name: "Password Reset Request", start_date: "Reset Link:", end_date: "Below", pickup_location: resetLink, total_cost: "0", advance_amount: "0", owner_phone: "System" }));
  const adminMsg = `🔐 PASSWORD RESET REQUEST\n\nUser: ${email}\nLink: ${resetLink}`;
  c.executionCtx.waitUntil(sendTelegramNotification(c.env.TELEGRAM_BOOKING_BOT_TOKEN, c.env.TELEGRAM_OWNER_CHAT_ID, adminMsg));
  return c.json({ success: true });
});

api.post('/auth/reset-password', async (c) => {
  const { email, token, newPassword } = await c.req.json();
  if (!c.env.DB) return c.json({ error: 'Database connection failed' }, 500);
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user || !user.reset_token_expires || !user.reset_token_hash) return c.json({ error: 'Invalid or expired reset link' }, 400);
  if (Date.now() > user.reset_token_expires) return c.json({ error: 'Reset link has expired' }, 400);
  const isValid = await bcrypt.compare(token, user.reset_token_hash);
  if (!isValid) return c.json({ error: 'Invalid reset token' }, 400);
  const newPassHash = await bcrypt.hash(newPassword, 10);
  await c.env.DB.prepare('UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE email = ?').bind(newPassHash, email).run();
  return c.json({ success: true });
});

api.get('/users', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json([]);
  try {
    const { results } = await c.env.DB.prepare('SELECT id, name, email, phone, created_at as joinedAt FROM users ORDER BY created_at DESC').all();
    return c.json(results || []);
  } catch (e: any) { return c.json({ error: e.message }, 500); }
});

api.get('/cars', async (c) => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database connection failed.' }, 500);
    const { results } = await c.env.DB.prepare('SELECT * FROM cars ORDER BY created_at DESC').all();
    return c.json(results || []);
  } catch (e: any) { return c.json({ error: e.message }, 500); }
});

api.post('/cars', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB || !c.env.IMAGES_BUCKET) return c.json({ error: 'Not configured' }, 503);
  const body = await c.req.parseBody();
  const name = body['name'] as string;
  const price = body['price'] as string;
  const fuelType = body['fuelType'] as string;
  const transmission = body['transmission'] as string;
  const category = body['category'] as string;
  const seats = body['seats'] as string;
  const rating = body['rating'] as string;
  const totalStock = body['totalStock'] as string;
  const mainImage = body['image'];
  const galleryFiles = body['gallery[]']; 
  let imageUrl = '';
  if (mainImage && mainImage instanceof File) { imageUrl = await uploadToR2(c.env.IMAGES_BUCKET, mainImage, 'cars'); }
  const galleryUrls: string[] = [];
  if (galleryFiles) {
     const files = Array.isArray(galleryFiles) ? galleryFiles : [galleryFiles];
     for (const f of files) { if (f instanceof File) { const url = await uploadToR2(c.env.IMAGES_BUCKET, f, 'cars'); galleryUrls.push(url); } }
  }
  const uuid = crypto.randomUUID();
  const galleryJson = JSON.stringify(galleryUrls);
  await c.env.DB.prepare(`INSERT INTO cars (uuid, name, price_per_day, image_url, gallery_images, fuel_type, transmission, category, seats, rating, total_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(uuid, name, price, imageUrl, galleryJson, fuelType, transmission, category, seats, rating, totalStock).run();
  return c.json({ success: true, id: uuid });
});

api.patch('/cars/:id/status', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500);
  const id = c.req.param('id');
  const { status } = await c.req.json();
  await c.env.DB.prepare('UPDATE cars SET status = ? WHERE uuid = ? OR id = ?').bind(status, id, id).run();
  return c.json({ success: true });
});

api.patch('/cars/:id', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500);
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, pricePerDay, category, fuelType, transmission, seats, rating, totalStock } = body;
  await c.env.DB.prepare(`UPDATE cars SET name = ?, price_per_day = ?, category = ?, fuel_type = ?, transmission = ?, seats = ?, rating = ?, total_stock = ? WHERE uuid = ? OR id = ?`).bind(name, pricePerDay, category, fuelType, transmission, seats, rating, totalStock, id, id).run();
  return c.json({ success: true });
});

api.delete('/cars/:id', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500);
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM cars WHERE uuid = ? OR id = ?').bind(id, id).run();
  return c.json({ success: true });
});

api.post('/bookings', authMiddleware, async (c) => {
  try {
    if (!c.env.DB || !c.env.IMAGES_BUCKET) return c.json({ error: 'Not configured' }, 500);
    const body = await c.req.parseBody();
    const user = c.get('user');
    const carId = body['carId'] as string;
    const carName = body['carName'] as string;
    const carImage = body['carImage'] as string; 
    const customerName = body['customerName'] as string;
    const customerPhone = body['customerPhone'] as string;
    const startDate = body['startDate'] as string;
    const endDate = body['endDate'] as string;
    const totalCost = body['totalCost'] as string;
    const advanceAmount = body['advanceAmount'] as string;
    const transactionId = body['transactionId'] as string;
    const location = body['location'] as string;
    const userGps = body['userGps'] as string;
    const securityDepositType = body['securityDepositType'] as string;
    const securityDepositTransactionId = body['securityDepositTransactionId'] as string;
    const signature = body['signature'] as string;
    const promoCode = body['promoCode'] as string;
    const discountAmount = body['discountAmount'] as string;
    const aadharFrontFile = body['aadharFront'];
    const aadharBackFile = body['aadharBack'];
    const licenseFile = body['licensePhoto'];
    const aadharFrontUrl = (aadharFrontFile instanceof File) ? await uploadToR2(c.env.IMAGES_BUCKET, aadharFrontFile, 'docs') : '';
    const aadharBackUrl = (aadharBackFile instanceof File) ? await uploadToR2(c.env.IMAGES_BUCKET, aadharBackFile, 'docs') : '';
    const licenseUrl = (licenseFile instanceof File) ? await uploadToR2(c.env.IMAGES_BUCKET, licenseFile, 'docs') : '';
    const id = crypto.randomUUID();
    if (promoCode) {
        const upperCode = promoCode.toUpperCase().trim();
        const promo = await c.env.DB.prepare('SELECT * FROM promo_codes WHERE code = ?').bind(upperCode).first();
        if (promo) { await c.env.DB.prepare('INSERT INTO promo_usage (promo_code, user_email) VALUES (?, ?)').bind(upperCode, user.email).run(); }
        else { return c.json({ error: 'Invalid Promo Code.' }, 400); }
    }
    await c.env.DB.prepare(`INSERT INTO bookings (id, car_id, car_name, car_image, user_email, customer_name, customer_phone, start_date, end_date, total_cost, advance_amount, transaction_id, aadhar_front, aadhar_back, license_photo, location, user_gps, security_deposit_type, security_deposit_transaction_id, signature, promo_code, discount_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, carId, carName, carImage, user.email, customerName, customerPhone, startDate, endDate, totalCost, advanceAmount, transactionId, aadharFrontUrl, aadharBackUrl, licenseUrl, location, userGps || null, securityDepositType || null, securityDepositTransactionId || null, signature || null, promoCode || null, discountAmount || 0).run();
    let teleMsg = `🚗 NEW BOOKING RECEIVED\n\nCustomer: ${customerName} (${customerPhone})\nCar: ${carName}\nDates: ${startDate} to ${endDate}\nTotal: ₹${totalCost}`;
    if (promoCode) teleMsg += `\nPromo: ${promoCode} (-₹${discountAmount})`;
    teleMsg += `\nDeposit: ${securityDepositType}`;
    c.executionCtx.waitUntil(sendTelegramNotification(c.env.TELEGRAM_BOOKING_BOT_TOKEN, c.env.TELEGRAM_OWNER_CHAT_ID, teleMsg));
    return c.json({ success: true, bookingId: id });
  } catch (e: any) { console.error('Booking Insert Error:', e); return c.json({ error: e.message || 'Booking failed' }, 500); }
});

api.get('/bookings', authMiddleware, async (c) => {
  try {
    if (!c.env.DB) return c.json([]); 
    const user = c.get('user');
    let results;
    if (user.role === 'owner') {
       const stmt = await c.env.DB.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
       results = stmt.results;
    } else {
       const stmt = await c.env.DB.prepare('SELECT * FROM bookings WHERE user_email = ? ORDER BY created_at DESC').bind(user.email).all();
       results = stmt.results;
    }
    return c.json(results || []);
  } catch (e: any) { return c.json({ error: e.message }, 500); }
});

api.patch('/bookings/:id', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500);
  const id = c.req.param('id');
  const { status, isApproved } = await c.req.json();
  if (status) await c.env.DB.prepare('UPDATE bookings SET status = ? WHERE id = ?').bind(status, id).run();
  if (isApproved !== undefined) {
      const isApproveVal = isApproved ? 1 : 0;
      await c.env.DB.prepare('UPDATE bookings SET is_approved = ? WHERE id = ?').bind(isApproveVal, id).run();
      if (isApproved && c.env.GOOGLE_SCRIPT_URL) {
          const booking = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
          if (booking) {
             const emailPayload = {
               to_email: booking.user_email,
               customer_name: booking.customer_name,
               ref_id: booking.transaction_id,
               car_name: booking.car_name,
               start_date: booking.start_date,
               end_date: booking.end_date,
               pickup_location: booking.location,
               total_cost: `₹${booking.total_cost || 0}`,
               advance_amount: `₹${booking.advance_amount || 0}`,
               owner_phone: "9870375798"
             };
             c.executionCtx.waitUntil(sendEmailViaScript(c.env, emailPayload));
          }
      }
  }
  return c.json({ success: true });
});

api.get('/promos', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json([]);
  try { const { results } = await c.env.DB.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC').all(); return c.json(results || []); } catch (e: any) { return c.json({ error: e.message }, 500); }
});

api.post('/promos', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'DB Error' }, 500);
  const { code, percentage } = await c.req.json();
  const upperCode = code.toUpperCase().trim();
  try { await c.env.DB.prepare('INSERT INTO promo_codes (code, percentage) VALUES (?, ?)').bind(upperCode, percentage).run(); return c.json({ success: true }); } catch (e: any) { return c.json({ error: 'Failed to create promo: ' + e.message }, 500); }
});

api.delete('/promos/:id', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'DB Error' }, 500);
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM promo_codes WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

api.post('/promos/validate', authMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'DB Error' }, 500);
  const { code } = await c.req.json();
  const user = c.get('user');
  const upperCode = code.toUpperCase().trim();
  const promo = await c.env.DB.prepare('SELECT * FROM promo_codes WHERE code = ?').bind(upperCode).first();
  if (!promo) return c.json({ error: 'Invalid Promo Code' }, 404);
  const usage = await c.env.DB.prepare('SELECT * FROM promo_usage WHERE promo_code = ? AND user_email = ?').bind(upperCode, user.email).first();
  if (usage) return c.json({ error: 'You have already used this promo code' }, 400);
  return c.json({ success: true, percentage: promo.percentage });
});

api.get('/settings', async (c) => {
  if (!c.env.DB) return c.json({});
  try {
    const settings = await c.env.DB.prepare('SELECT * FROM settings WHERE id = 1').first();
    return c.json({ paymentQr: settings?.payment_qr || '', heroSlides: settings?.hero_slides ? JSON.parse(settings.hero_slides) : [] });
  } catch (e) { return c.json({ paymentQr: '', heroSlides: [] }); }
});

api.post('/settings', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'DB Error' }, 500);
  const { paymentQr, heroSlides } = await c.req.json();
  if (paymentQr !== undefined) { await c.env.DB.prepare('UPDATE settings SET payment_qr = ? WHERE id = 1').bind(paymentQr).run(); }
  if (heroSlides !== undefined) { await c.env.DB.prepare('UPDATE settings SET hero_slides = ? WHERE id = 1').bind(JSON.stringify(heroSlides)).run(); }
  return c.json({ success: true });
});

api.get('/public/availability', async (c) => {
  if (!c.env.DB) return c.json([]);
  try { const { results } = await c.env.DB.prepare("SELECT car_id, start_date, end_date FROM bookings WHERE status != 'cancelled' AND is_approved = 1").all(); return c.json(results || []); } catch (e) { return c.json([]); }
});

app.route('/api', api);
app.all('/api/*', (c) => { return c.json({ error: 'API Endpoint Not Found' }, 404); });
app.get('/*', async (c) => {
  try {
    const response = await c.env.ASSETS.fetch(c.req.raw);
    if (response.status === 404) { return await c.env.ASSETS.fetch(new URL('/index.html', c.req.url)); }
    return response;
  } catch (e) { return c.text("Internal Error", 500); }
});

export default app;
