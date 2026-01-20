
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

type D1Database = any;

type Bindings = {
  DB: D1Database;
  ASSETS: any;
  JWT_SECRET: string;
  OWNER_EMAIL: string;
  OWNER_PASSWORD: string;      
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

// --- HELPER: Notifications ---
async function sendTelegramNotification(env: Bindings, message: string) {
  // Hardcoded Credentials as requested
  const token = "8402658132:AAH7lQcAyF9x3fqa7yAyQqYrP2_PTARa3ts";
  const chatId = "8258614791";

  if (!token || !chatId) {
    return;
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });
  } catch (e) {
    console.error('Telegram Notification Failed:', e);
  }
}

async function sendEmailViaScript(env: Bindings, payload: any) {
  if (!env.GOOGLE_SCRIPT_URL) return;
  try {
    // Using text/plain to match common Google Apps Script web app patterns
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
    // 1. Create Tables
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
    
    // 2. Insert Default Settings
    await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (id, payment_qr, hero_slides) VALUES (1, '', '[]')`).run();

    // 3. Migrations (Try to add columns if they don't exist for existing DBs)
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN security_deposit_type TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN security_deposit_transaction_id TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN signature TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE cars ADD COLUMN gallery_images TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN promo_code TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN discount_amount INTEGER").run(); } catch(e) {}
    
    return c.json({ success: true, message: "Database tables initialized and schemas updated." });
  } catch (e: any) {
    return c.json({ error: "Failed to init DB: " + e.message }, 500);
  }
});

// --- PROMO CODE ROUTES ---

// List Promos (Owner)
api.get('/promos', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json([]);
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC').all();
    return c.json(results || []);
  } catch (e: any) {
    if (e.message.includes('no such table')) return c.json([]);
    return c.json({ error: e.message }, 500);
  }
});

// Add Promo (Owner)
api.post('/promos', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'DB Error' }, 500);
  const { code, percentage } = await c.req.json();
  const upperCode = code.toUpperCase().trim();

  // Lazy Init Table to prevent "no such table" error on first use
  try {
     await c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS promo_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        percentage INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )`).run();
  } catch(e) { console.error("Auto-create promo_codes failed", e); }

  try {
    await c.env.DB.prepare('INSERT INTO promo_codes (code, percentage) VALUES (?, ?)').bind(upperCode, percentage).run();
    return c.json({ success: true });
  } catch (e: any) {
    if (e.message.includes('UNIQUE')) return c.json({ error: 'Promo code already exists' }, 409);
    return c.json({ error: 'Failed to create promo: ' + e.message }, 500);
  }
});

// Delete Promo (Owner)
api.delete('/promos/:id', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'DB Error' }, 500);
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM promo_codes WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Validate Promo (Customer)
api.post('/promos/validate', authMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'DB Error' }, 500);
  const { code, email } = await c.req.json();
  const upperCode = code.toUpperCase().trim();
  const userEmail = email.toLowerCase().trim();

  // Lazy Init Usage Table
  try {
    await c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS promo_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        promo_code TEXT NOT NULL,
        user_email TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      )`).run();
  } catch(e) { console.error("Auto-create promo_usage failed", e); }

  // 1. Check if code exists
  const promo = await c.env.DB.prepare('SELECT * FROM promo_codes WHERE code = ?').bind(upperCode).first();
  if (!promo) {
    return c.json({ error: 'Invalid Promo Code' }, 404);
  }

  // 2. Check if user already used it
  const usage = await c.env.DB.prepare('SELECT * FROM promo_usage WHERE promo_code = ? AND user_email = ?').bind(upperCode, userEmail).first();
  if (usage) {
    return c.json({ error: 'You have already used this promo code' }, 400);
  }

  return c.json({ success: true, percentage: promo.percentage });
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

// --- PUBLIC AVAILABILITY ROUTE ---
api.get('/public/availability', async (c) => {
  if (!c.env.DB) return c.json([]);
  try {
      // NOTE: We now filter by is_approved = 1 so stock is only consumed when owner approves.
      const { results } = await c.env.DB.prepare(
          "SELECT car_id, start_date, end_date FROM bookings WHERE status != 'cancelled' AND is_approved = 1"
      ).all();
      return c.json(results || []);
  } catch (e) {
      console.error(e);
      return c.json([]);
  }
});

// --- AUTH ROUTES ---
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
      if (c.env.OWNER_PASSWORD && password === c.env.OWNER_PASSWORD) {
        validOwner = true;
      } 
      else if (c.env.OWNER_PASSWORD_HASH) {
        try {
          validOwner = await bcrypt.compare(password, c.env.OWNER_PASSWORD_HASH);
        } catch(e) { console.error("Hash compare failed", e); }
      }

      if (!validOwner) return c.json({ error: 'Invalid owner credentials' }, 401);
      role = 'owner';
      user = { id: 0, name: 'Owner', email: c.env.OWNER_EMAIL, role: 'owner' };
    } else {
      if (!c.env.DB) {
        return c.json({ error: 'Database connection failed. Please check D1 configuration.' }, 500);
      }
      user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
      if (!user) return c.json({ error: 'Invalid credentials' }, 401);
      
      const validPass = await bcrypt.compare(password, user.password_hash);
      if (!validPass) return c.json({ error: 'Invalid credentials' }, 401);

      if (user.role) role = user.role;
    }

    const token = await sign({ 
      id: user.id, 
      name: user.name, 
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
  const { email } = await c.req.json();
  
  if (!c.env.DB) return c.json({ error: 'Database connection failed' }, 500);

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  
  // Return success even if user not found (security practice)
  if (!user) {
    return c.json({ success: true }); 
  }

  // Generate Token
  const token = crypto.randomUUID();
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = Date.now() + (1000 * 60 * 60); // 1 Hour

  // Store in DB
  await c.env.DB.prepare(
    'UPDATE users SET reset_token_hash = ?, reset_token_expires = ? WHERE email = ?'
  ).bind(tokenHash, expiresAt, email).run();

  // Generate Link
  const origin = c.req.header('origin') || new URL(c.req.url).origin;
  const resetLink = `${origin}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

  // 1. Send Email to User (via Google Script)
  // Mapping reset link to "pickup_location" because the Google Script template expects booking fields.
  c.executionCtx.waitUntil(sendEmailViaScript(c.env, {
    to_email: email,
    subject: "Action Required: Password Reset",
    customer_name: user.name,
    ref_id: "RESET",
    car_name: "Password Reset Request",
    start_date: "Reset Link:",
    end_date: "Below",
    pickup_location: resetLink, // Putting the link here ensures it appears in the booking table
    total_cost: "0",
    advance_amount: "0",
    owner_phone: "System"
  }));

  // 2. Send Admin Notification (Telegram)
  const adminMsg = `🔐 *Password Reset Requested*\n\nUser: ${email}\nLink: ${resetLink}`;
  c.executionCtx.waitUntil(sendTelegramNotification(c.env, adminMsg));

  return c.json({ success: true });
});

api.post('/auth/reset-password', async (c) => {
  const { email, token, newPassword } = await c.req.json();
  
  if (!c.env.DB) return c.json({ error: 'Database connection failed' }, 500);

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

  if (!user || !user.reset_token_expires || !user.reset_token_hash) {
    return c.json({ error: 'Invalid or expired reset link' }, 400);
  }

  if (Date.now() > user.reset_token_expires) {
    return c.json({ error: 'Reset link has expired' }, 400);
  }

  const isValid = await bcrypt.compare(token, user.reset_token_hash);
  if (!isValid) {
    return c.json({ error: 'Invalid reset token' }, 400);
  }

  const newPassHash = await bcrypt.hash(newPassword, 10);

  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE email = ?'
  ).bind(newPassHash, email).run();

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
  return c.text('R2 Disabled (Enable Billing to use Images)', 200);
});

api.post('/cars', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) {
      return c.json({ error: 'Database not configured' }, 503);
  }

  const body = await c.req.json();
  const { name, price, image, gallery, fuelType, transmission, category, seats, rating, totalStock } = body;
  
  const uuid = crypto.randomUUID();
  const galleryJson = gallery ? JSON.stringify(gallery) : '[]';

  await c.env.DB.prepare(`
    INSERT INTO cars (uuid, name, price_per_day, image_url, gallery_images, fuel_type, transmission, category, seats, rating, total_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(uuid, name, price, image, galleryJson, fuelType, transmission, category, seats, rating, totalStock).run();
  
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
  
  await c.env.DB.prepare(`
    UPDATE cars 
    SET name = ?, price_per_day = ?, category = ?, fuel_type = ?, transmission = ?, seats = ?, rating = ?, total_stock = ?
    WHERE uuid = ? OR id = ?
  `).bind(name, pricePerDay, category, fuelType, transmission, seats, rating, totalStock, id, id).run();
  
  return c.json({ success: true });
});

api.delete('/cars/:id', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500);
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM cars WHERE uuid = ? OR id = ?').bind(id, id).run();
  return c.json({ success: true });
});

// --- BOOKING ROUTES ---
api.post('/bookings', authMiddleware, async (c) => {
  try {
    if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500);

    const data = await c.req.json();
    const user = c.get('user');
    
    // Fallbacks
    const aadharFrontUrl = data.aadharFront || '';
    const aadharBackUrl = data.aadharBack || '';
    const licenseUrl = data.licensePhoto || '';
    const safeCarName = data.carName || 'Unknown Car';
    const safeCarImage = data.carImage || '';
    const id = crypto.randomUUID();

    // Verify Promo Code Validity Again (Server-side check)
    if (data.promoCode) {
        const upperCode = data.promoCode.toUpperCase().trim();
        const promo = await c.env.DB.prepare('SELECT * FROM promo_codes WHERE code = ?').bind(upperCode).first();
        if (promo) {
           // Ensure Usage Table Exists
           await c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS promo_usage (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             promo_code TEXT NOT NULL,
             user_email TEXT NOT NULL,
             created_at INTEGER DEFAULT (unixepoch())
           )`).run();

           // Check usage
           const usage = await c.env.DB.prepare('SELECT * FROM promo_usage WHERE promo_code = ? AND user_email = ?')
              .bind(upperCode, user.email).first();
           if (usage) {
              return c.json({ error: 'Promo code already used' }, 400);
           }
           // Record Usage
           await c.env.DB.prepare('INSERT INTO promo_usage (promo_code, user_email) VALUES (?, ?)').bind(upperCode, user.email).run();
        }
    }

    // Ensure Tables Exist (Safety)
    await c.env.DB.prepare(`CREATE TABLE IF NOT EXISTS bookings (
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
      security_deposit_type TEXT,
      security_deposit_transaction_id TEXT,
      signature TEXT,
      promo_code TEXT,
      discount_amount INTEGER,
      created_at INTEGER DEFAULT (unixepoch())
    )`).run();

    // Lazy Migration Columns
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN security_deposit_type TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN security_deposit_transaction_id TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN signature TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN promo_code TEXT").run(); } catch(e) {}
    try { await c.env.DB.prepare("ALTER TABLE bookings ADD COLUMN discount_amount INTEGER").run(); } catch(e) {}

    // INSERT: Using "OR NULL" logic to prevent D1 bind errors on undefined values
    await c.env.DB.prepare(`
      INSERT INTO bookings (id, car_id, car_name, car_image, user_email, customer_name, customer_phone, start_date, end_date, total_cost, advance_amount, transaction_id, aadhar_front, aadhar_back, license_photo, location, security_deposit_type, security_deposit_transaction_id, signature, promo_code, discount_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, 
      data.carId, 
      safeCarName, 
      safeCarImage, 
      user.email, 
      data.customerName, 
      data.customerPhone, 
      data.startDate, 
      data.endDate, 
      data.totalCost, 
      data.advanceAmount, 
      data.transactionId, 
      aadharFrontUrl, 
      aadharBackUrl, 
      licenseUrl, 
      data.userLocation, 
      data.securityDepositType || null, 
      data.securityDepositTransactionId || null, 
      data.signature || null,
      data.promoCode || null,
      data.discountAmount || 0
    ).run();
    
    // Notification (Fire & Forget)
    let teleMsg = `🚗 New Booking Received!\n\nCustomer: ${data.customerName} (${data.customerPhone})\nCar: ${safeCarName}\nDates: ${data.startDate} to ${data.endDate}\nTotal: ₹${data.totalCost}`;
    if (data.promoCode) {
        teleMsg += `\nPromo Applied: ${data.promoCode} (-₹${data.discountAmount})`;
    }
    teleMsg += `\nDeposit: ${data.securityDepositType}`;
    
    c.executionCtx.waitUntil(sendTelegramNotification(c.env, teleMsg));

    return c.json({ success: true, bookingId: id });
  } catch (e: any) {
    console.error('Booking Insert Error:', e);
    return c.json({ error: e.message || 'Booking failed during database insert' }, 500);
  }
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
  } catch (e: any) {
    if (e.message.includes('no such table')) return c.json([]);
    return c.json({ error: e.message }, 500);
  }
});

api.patch('/bookings/:id', authMiddleware, ownerMiddleware, async (c) => {
  if (!c.env.DB) return c.json({ error: 'Database not configured' }, 500);
  const id = c.req.param('id');
  const { status, isApproved } = await c.req.json();
  
  if (status) {
    await c.env.DB.prepare('UPDATE bookings SET status = ? WHERE id = ?').bind(status, id).run();
  }

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
               owner_phone: "9870375798" // Hardcoded owner phone as fallback
             };
             
             c.executionCtx.waitUntil(sendEmailViaScript(c.env, emailPayload));
          }
      }
  }
  return c.json({ success: true });
});

app.route('/api', api);

app.all('/api/*', (c) => {
  return c.json({ error: 'API Endpoint Not Found' }, 404);
});

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
