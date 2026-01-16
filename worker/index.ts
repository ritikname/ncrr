
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

type D1Database = any;
// type R2Bucket = any; // R2 Disabled

type Bindings = {
  DB: D1Database;
  // IMAGES_BUCKET: R2Bucket; // R2 Disabled
  ASSETS: any;
  JWT_SECRET: string;
  OWNER_EMAIL: string;
  OWNER_PASSWORD_HASH: string;
  GOOGLE_SCRIPT_URL: string;
  TELEGRAM_BOT_TOKEN: string;
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

// --- HELPER: Telegram Notification ---
async function sendTelegramNotification(env: Bindings, message: string) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_OWNER_CHAT_ID) {
    // console.warn('Telegram config missing');
    return;
  }
  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_OWNER_CHAT_ID,
        text: message
      })
    });
  } catch (e) {
    console.error('Telegram Notification Failed:', e);
  }
}

// --- DATABASE INIT ROUTE (Run this once via browser) ---
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
        created_at INTEGER DEFAULT (unixepoch())
      )`),
      c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        payment_qr TEXT,
        hero_slides TEXT,
        updated_at INTEGER DEFAULT (unixepoch())
      )`)
    ]);
    // Insert default settings row if not exists
    await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (id, payment_qr, hero_slides) VALUES (1, '', '[]')`).run();
    
    return c.json({ success: true, message: "Database tables (including Settings) created successfully!" });
  } catch (e: any) {
    return c.json({ error: "Failed to init DB: " + e.message }, 500);
  }
});

// --- SETTINGS ROUTES ---
api.get('/settings', async (c) => {
  if (!c.env.DB) return c.json({});
  try {
    const settings = await c.env.DB.prepare('SELECT * FROM settings WHERE id = 1').first();
    return c.json({
      paymentQr: settings?.payment_qr || '',
      heroSlides: settings?.hero_slides ? JSON.parse(settings.hero_slides) : []
    });
  } catch (e) {
    return c.json({ paymentQr: '', heroSlides: [] });
  }
});

api.post('/settings', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'DB Error' }, 500);
  const { paymentQr, heroSlides } = await c.req.json();
  
  if (paymentQr !== undefined) {
    await c.env.DB.prepare('UPDATE settings SET payment_qr = ? WHERE id = 1').bind(paymentQr).run();
  }
  if (heroSlides !== undefined) {
    await c.env.DB.prepare('UPDATE settings SET hero_slides = ? WHERE id = 1').bind(JSON.stringify(heroSlides)).run();
  }
  return c.json({ success: true });
});

// --- AUTH ROUTES ---
api.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    let user;
    let role = 'customer';

    if (email === c.env.OWNER_EMAIL) {
      // Owner Authentication (Env Vars)
      // DEMO MODE: Allow specific password directly OR check hash
      let validOwner = password === 'ncrdrive@admin321';
      
      if (!validOwner && c.env.OWNER_PASSWORD_HASH) {
         validOwner = await bcrypt.compare(password, c.env.OWNER_PASSWORD_HASH);
      }

      if (!validOwner) return c.json({ error: 'Invalid credentials' }, 401);
      role = 'owner';
      user = { id: 0, name: 'Owner', email, role: 'owner' };
    } else {
      // Customer Authentication (D1 Database)
      if (!c.env.DB) {
        return c.json({ error: 'Database connection failed. Please check D1 configuration.' }, 500);
      }
      user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
      if (!user) return c.json({ error: 'Invalid credentials' }, 401);
      
      const validPass = await bcrypt.compare(password, user.password_hash);
      if (!validPass) return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = await sign({ 
      id: user.id, 
      email: user.email, 
      role: role,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    }, c.env.JWT_SECRET || 'dev-secret-key');

    setCookie(c, 'auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    return c.json({ success: true, user: { name: user.name, email: user.email, role } });
  } catch (e: any) {
    console.error('Login Error:', e);
    return c.json({ error: e.message || 'Login failed' }, 500);
  }
});

api.post('/auth/signup', async (c) => {
  const { name, email, phone, password } = await c.req.json();
  const hash = await bcrypt.hash(password, 10);
  try {
    if (!c.env.DB) {
        return c.json({ error: 'Database connection failed. Please check D1 configuration.' }, 500);
    }
    await c.env.DB.prepare(
      'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)'
    ).bind(name, email, phone, hash).run();
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) return c.json({ error: 'Email already exists' }, 409);
    return c.json({ error: 'Signup failed: ' + e.message }, 500);
  }
});

api.get('/auth/me', authMiddleware, async (c) => {
  return c.json(c.get('user'));
});

api.post('/auth/logout', (c) => {
  deleteCookie(c, 'auth_token');
  return c.json({ success: true });
});

api.post('/auth/forgot-password', async (c) => {
  return c.json({ success: true });
});

api.post('/auth/reset-password', async (c) => {
  return c.json({ success: true });
});

// --- USER ROUTES (Owner Only) ---
api.get('/users', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json([]);
  try {
    const { results } = await c.env.DB.prepare('SELECT id, name, email, phone, created_at as joinedAt FROM users ORDER BY created_at DESC').all();
    return c.json(results || []);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// --- CAR ROUTES ---
api.get('/cars', async (c) => {
  try {
    if (!c.env.DB) {
        return c.json({ error: 'Database connection failed.' }, 500);
    }
    const { results } = await c.env.DB.prepare('SELECT * FROM cars ORDER BY created_at DESC').all();
    return c.json(results || []);
  } catch (e: any) {
    if (e.message.includes('no such table')) return c.json([]);
    return c.json({ error: e.message }, 500);
  }
});

api.get('/images/:key', async (c) => {
  // R2 Disabled
  return c.text('R2 Disabled (Enable Billing to use Images)', 200);
});

api.post('/cars', authMiddleware, ownerMiddleware, async (c) => {
  const formData = await c.req.parseBody();
  if (!c.env.DB) {
      return c.json({ error: 'Database not configured' }, 503);
  }
  // R2 Disabled - Skipping upload
  // const imageFile = formData['image'] as File;
  
  const imageUrl = ''; // Placeholder URL since R2 is disabled
  
  const uuid = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO cars (uuid, name, price_per_day, image_url, fuel_type, transmission, category, seats, rating, total_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(uuid, formData['name'], formData['price'], imageUrl, formData['fuelType'], formData['transmission'], formData['category'], formData['seats'], formData['rating'], formData['totalStock']).run();
  
  return c.json({ success: true, id: uuid });
});

api.patch('/cars/:id/status', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500);
  const id = c.req.param('id');
  const { status } = await c.req.json();
  await c.env.DB.prepare('UPDATE cars SET status = ? WHERE uuid = ? OR id = ?').bind(status, id, id).run();
  return c.json({ success: true });
});

// --- BOOKING ROUTES ---
api.post('/bookings', authMiddleware, async (c) => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500);

    const data = await c.req.json();
    const user = c.get('user');
    
    // R2 Disabled - Skipping Uploads
    const aadharFrontUrl = '';
    const aadharBackUrl = '';
    const licenseUrl = '';
    
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO bookings (id, car_id, car_name, car_image, user_email, customer_name, customer_phone, start_date, end_date, total_cost, advance_amount, transaction_id, aadhar_front, aadhar_back, license_photo, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.carId, data.carName, data.carImage, user.email, data.customerName, data.customerPhone, data.startDate, data.endDate, data.totalCost, data.advanceAmount, data.transactionId, aadharFrontUrl, aadharBackUrl, licenseUrl, data.userLocation).run();
    
    if (c.env.GOOGLE_SCRIPT_URL) {
      c.executionCtx.waitUntil(fetch(c.env.GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ type: 'new_booking', to_email: user.email, customer_name: data.customerName, car_name: data.carName }) }).catch(console.error));
    }

    // --- TELEGRAM NOTIFICATION ---
    const teleMsg = `🚗 New Booking Received!\n\nCustomer: ${data.customerName} (${data.customerPhone})\nCar: ${data.carName}\nDates: ${data.startDate} to ${data.endDate}\nTotal: ₹${data.totalCost}`;
    c.executionCtx.waitUntil(sendTelegramNotification(c.env, teleMsg));

    return c.json({ success: true, bookingId: id });
  } catch (e: any) {
    return c.json({ error: e.message || 'Booking failed' }, 500);
  }
});

api.get('/bookings', authMiddleware, async (c) => {
  try {
    if (!c.env.DB) return c.json([]); 
    const user = c.get('user');
    let query = user.role === 'owner' ? 'SELECT * FROM bookings ORDER BY created_at DESC' : 'SELECT * FROM bookings WHERE user_email = ? ORDER BY created_at DESC';
    const { results } = await c.env.DB.prepare(query).bind(user.role === 'owner' ? undefined : user.email).all();
    return c.json(results || []);
  } catch (e: any) {
    if (e.message.includes('no such table')) return c.json([]);
    return c.json({ error: e.message }, 500);
  }
});

api.patch('/bookings/:id', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500);
  const id = c.req.param('id');
  const { status, isApproved } = await c.req.json();
  
  if (status) await c.env.DB.prepare('UPDATE bookings SET status = ? WHERE id = ?').bind(status, id).run();
  if (isApproved !== undefined) await c.env.DB.prepare('UPDATE bookings SET is_approved = ? WHERE id = ?').bind(isApproved ? 1 : 0, id).run();
  
  // --- TELEGRAM NOTIFICATION ---
  let msg = `🔄 Booking #${id.slice(0, 8)} Updated`;
  if (status) msg += `\nStatus: ${status}`;
  if (isApproved !== undefined) msg += `\nApproved: ${isApproved ? 'Yes' : 'No'}`;
  c.executionCtx.waitUntil(sendTelegramNotification(c.env, msg));

  return c.json({ success: true });
});

// --- MOUNT API ---
app.route('/api', api);

// --- STATIC ASSETS & SPA FALLBACK ---
app.get('/*', async (c) => {
  try {
    const response = await c.env.ASSETS.fetch(c.req.raw);
    if (response.status === 404) {
      return await c.env.ASSETS.fetch(new URL('/index.html', c.req.url));
    }
    return response;
  } catch (e) {
    return c.text("Internal Error", 500);
  }
});

export default app;
