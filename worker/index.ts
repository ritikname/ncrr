
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

// CORS
app.use('/*', cors({
  origin: (origin) => origin,
  credentials: true,
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PATCH', 'DELETE'],
  allowHeaders: ['Content-Type'],
}));

// --- API Router ---
const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

api.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

// Middleware
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

// --- HELPER: R2 Upload ---
async function uploadToR2(bucket: R2Bucket, file: File, folder: string): Promise<string> {
  // Sanitize filename to be URL safe
  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const uniqueKey = `${folder}/${crypto.randomUUID()}-${cleanName}`;
  
  await bucket.put(uniqueKey, file);
  return `/api/images/${uniqueKey}`;
}

// --- HELPER: Notifications ---
async function sendTelegramNotification(token: string, chatId: string, message: string) {
  if (!token || !chatId) {
    console.warn("Telegram tokens missing");
    return;
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Telegram API Error:', errorText);
    }
  } catch (e) {
    console.error('Telegram Notification Failed:', e);
  }
}

async function sendEmailViaScript(env: Bindings, payload: any) {
  if (!env.GOOGLE_SCRIPT_URL) return;
  try {
    await fetch(env.GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('Email Notification Failed:', e);
  }
}

// --- DATABASE INIT ROUTE ---
api.get('/init', async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database connection failed' }, 500);
  try {
    await c.env.DB.batch([
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('customer','owner')) DEFAULT 'customer',
        reset_token_hash TEXT,
        reset_token_expires INTEGER,
        created_at INTEGER DEFAULT (unixepoch())
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS cars (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        price_per_day INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        gallery_images TEXT,
        category TEXT,
        fuel_type TEXT,
        transmission TEXT,
        seats INTEGER,
        rating REAL,
        total_stock INTEGER DEFAULT 1,
        status TEXT CHECK(status IN ('available','sold')) DEFAULT 'available',
        created_at INTEGER DEFAULT (unixepoch())
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        car_id TEXT NOT NULL,
        car_name TEXT,
        car_image TEXT,
        user_email TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        start_date TEXT,
        end_date TEXT,
        total_cost INTEGER,
        advance_amount INTEGER,
        transaction_id TEXT,
        status TEXT DEFAULT 'confirmed',
        is_approved BOOLEAN DEFAULT 0,
        aadhar_front TEXT,
        aadhar_back TEXT,
        license_photo TEXT,
        location TEXT,
        user_gps TEXT,
        security_deposit_type TEXT,
        security_deposit_transaction_id TEXT,
        signature TEXT,
        promo_code TEXT,
        discount_amount INTEGER,
        created_at INTEGER DEFAULT (unixepoch())
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        payment_qr TEXT,
        hero_slides TEXT,
        updated_at INTEGER DEFAULT (unixepoch())
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS promo_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        percentage INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS promo_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        promo_code TEXT NOT NULL,
        user_email TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )`)
    ]);
    
    await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (id, payment_qr, hero_slides) VALUES (1, '', '[]')`).run();

    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN security_deposit_type TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN security_deposit_transaction_id TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN signature TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE cars ADD COLUMN gallery_images TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN promo_code TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN discount_amount INTEGER").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN user_gps TEXT").run(); } catch(e) {}
    
    return c.json({ success: true, message: "Database tables initialized and schemas updated." });
  } catch (e: any) {
    return c.json({ error: "Failed to init DB: " + e.message }, 500);
  }
});

// --- R2 IMAGE PROXY ROUTE ---
api.get('/images/:folder/:filename', async (c) => {
  const folder = c.req.param('folder');
  const filename = c.req.param('filename');
  const key = `${folder}/${filename}`;

  if (!c.env.IMAGES_BUCKET) {
    return c.text('Image Bucket Not Configured', 500);
  }

  const object = await c.env.IMAGES_BUCKET.get(key);
  if (!object) {
    return c.text('Image Not Found', 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Content-Disposition', 'inline'); // Important for displaying in browser

  return new Response(object.body, {
    headers,
  });
});

// NEW: Owner Sales Report Endpoint
api.get('/owner/sales-report', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'DB Error' }, 500);

  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = Math.floor(new Date(currentYear, 0, 1).getTime() / 1000);
  
  // 7 days ago (at 00:00:00 of that day, roughly)
  // To be precise with gaps, we will fetch data and map in JS
  const sevenDaysAgo = Math.floor(now.getTime() / 1000) - (7 * 24 * 60 * 60);
  const eightWeeksAgo = Math.floor(now.getTime() / 1000) - (60 * 24 * 60 * 60); // Fetch extra buffer
  const thirtyDaysAgo = Math.floor(now.getTime() / 1000) - (30 * 24 * 60 * 60);

  const query = async (sql: string, params: any[] = []) => {
      const { results } = await c.env.DB.prepare(sql).bind(...params).all();
      return results;
  };

  try {
      // 1. Overall Stats
      const stats = await c.env.DB.prepare("SELECT SUM(total_cost) as totalRevenue, COUNT(*) as totalBookings FROM bookings WHERE status != 'cancelled'").first();
      const totalRevenue = stats?.totalRevenue || 0;
      const totalBookings = stats?.totalBookings || 0;
      const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

      // 2. Monthly (Current Year - All 12 months)
      const monthlyData = await query(`
        SELECT strftime('%m', datetime(created_at, 'unixepoch')) as month, SUM(total_cost) as total
        FROM bookings
        WHERE status != 'cancelled' AND created_at >= ?
        GROUP BY month
      `, [startOfYear]);

      const monthlyLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyValues = new Array(12).fill(0);
      
      if (monthlyData) {
        monthlyData.forEach((row: any) => {
            const mIndex = parseInt(row.month) - 1;
            if (mIndex >= 0 && mIndex < 12) monthlyValues[mIndex] = row.total;
        });
      }

      // 3. Daily (Last 7 Days - Gap filling)
      const dailyData = await query(`
        SELECT strftime('%Y-%m-%d', datetime(created_at, 'unixepoch')) as day, SUM(total_cost) as total
        FROM bookings
        WHERE status != 'cancelled' AND created_at >= ?
        GROUP BY day
      `, [sevenDaysAgo]);

      const dailyMap = new Map();
      if (dailyData) dailyData.forEach((row: any) => dailyMap.set(row.day, row.total));

      const dailyLabels = [];
      const dailyValues = [];
      for(let i=6; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dayStr = String(d.getDate()).padStart(2, '0');
          const key = `${y}-${m}-${dayStr}`;
          
          dailyLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
          dailyValues.push(dailyMap.get(key) || 0);
      }

      // 4. Weekly (Last 8 Weeks - JS Bucket Logic)
      // Fetch raw data for last ~60 days
      const rawRecent = await query(`
         SELECT created_at, total_cost 
         FROM bookings 
         WHERE status != 'cancelled' AND created_at >= ?
      `, [eightWeeksAgo]);
      
      const weeklyValues = new Array(8).fill(0);
      const weeklyLabels = new Array(8).fill('');
      const nowTs = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

      // Initialize labels (e.g., "Oct 25")
      for (let i = 0; i < 8; i++) {
         const d = new Date(nowTs - (i * oneWeekMs));
         weeklyLabels[7-i] = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
      }

      // Bucket data
      if (rawRecent) {
        rawRecent.forEach((b: any) => {
           const bTime = b.created_at * 1000;
           const diff = nowTs - bTime;
           const weekIndex = Math.floor(diff / oneWeekMs);
           if (weekIndex >= 0 && weekIndex < 8) {
               weeklyValues[7-weekIndex] += b.total_cost;
           }
        });
      }

      // 5. Yearly (All time)
      const yearlyData = await query(`
         SELECT strftime('%Y', datetime(created_at, 'unixepoch')) as year, SUM(total_cost) as total
         FROM bookings
         WHERE status != 'cancelled'
         GROUP BY year
         ORDER BY year ASC
      `);
      
      // Ensure at least current year is present if empty
      const yearlyLabels = yearlyData && yearlyData.length ? yearlyData.map((d: any) => d.year) : [String(currentYear)];
      const yearlyValues = yearlyData && yearlyData.length ? yearlyData.map((d: any) => d.total) : [0];

      // --- EXTENDED ANALYTICS: CAR & TYPE INSIGHTS ---

      // 6. Weekly Car Sales (Last 7 Days)
      const weeklyCarData = await query(`
        SELECT car_name, COUNT(*) as quantity, SUM(total_cost) as revenue
        FROM bookings
        WHERE status != 'cancelled' AND created_at >= ?
        GROUP BY car_name
        ORDER BY revenue DESC
      `, [sevenDaysAgo]);

      const weeklySales = {
        labels: weeklyCarData ? weeklyCarData.map((d: any) => d.car_name) : [],
        revenue: weeklyCarData ? weeklyCarData.map((d: any) => d.revenue) : [],
        quantity: weeklyCarData ? weeklyCarData.map((d: any) => d.quantity) : []
      };

      // 7. Top Performing Cars (Last 30 Days) - Limit 5
      const topCars = await query(`
        SELECT car_name, COUNT(*) as quantity, SUM(total_cost) as revenue
        FROM bookings
        WHERE status != 'cancelled' AND created_at >= ?
        GROUP BY car_name
        ORDER BY revenue DESC
        LIMIT 5
      `, [thirtyDaysAgo]);

      // 8. Performance by Car Type (Last 30 Days)
      // Left Join ensures we get booking data even if we strictly group by category from cars
      // If cars are deleted, this might return NULL category, handled by COALESCE
      const typeData = await query(`
        SELECT COALESCE(c.category, 'Other') as category, COUNT(b.id) as quantity, SUM(b.total_cost) as revenue
        FROM bookings b
        LEFT JOIN cars c ON b.car_id = c.uuid
        WHERE b.status != 'cancelled' AND b.created_at >= ?
        GROUP BY c.category
        ORDER BY revenue DESC
      `, [thirtyDaysAgo]);

      return c.json({
          stats: {
              totalRevenue,
              totalBookings,
              avgBookingValue
          },
          charts: {
              daily: { labels: dailyLabels, values: dailyValues },
              weekly: { labels: weeklyLabels, values: weeklyValues },
              monthly: { labels: monthlyLabels, values: monthlyValues },
              yearly: { labels: yearlyLabels, values: yearlyValues }
          },
          insights: {
              weeklySales,
              topCars: topCars || [],
              typePerformance: typeData || []
          }
      });

  } catch (e: any) {
      console.error('Analytics Error:', e);
      // Return safe empty structure on error to prevent UI crash
      return c.json({
          stats: { totalRevenue: 0, totalBookings: 0, avgBookingValue: 0 },
          charts: {
             daily: { labels: [], values: [] },
             weekly: { labels: [], values: [] },
             monthly: { labels: [], values: [] },
             yearly: { labels: [], values: [] }
          },
          insights: {
             weeklySales: { labels: [], revenue: [], quantity: [] },
             topCars: [],
             typePerformance: []
          }
      });
  }
});

// --- AUTH & USER ROUTES ---
api.post('/auth/login', async (c) => {
// ... existing code ...
