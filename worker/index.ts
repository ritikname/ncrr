
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
  OWNER_PASSWORD_HASH: string;
  GOOGLE_SCRIPT_URL: string;
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

// --- AUTH ROUTES ---
api.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    let user;
    let role = 'customer';

    if (email === c.env.OWNER_EMAIL) {
      // Owner Authentication (Env Vars)
      const validOwner = await bcrypt.compare(password, c.env.OWNER_PASSWORD_HASH);
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
  // Real implementation requires Email service
  return c.json({ success: true });
});

api.post('/auth/reset-password', async (c) => {
  // Real implementation requires Email service
  return c.json({ success: true });
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
  const key = c.req.param('key');
  if (!c.env.IMAGES_BUCKET) {
      return c.text('R2 Storage Not Configured', 500);
  }
  const object = await c.env.IMAGES_BUCKET.get(key);
  if (!object) return c.text('Not Found', 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  return new Response(object.body, { headers });
});

api.post('/cars', authMiddleware, ownerMiddleware, async (c) => {
  const formData = await c.req.parseBody();
  if (!c.env.DB || !c.env.IMAGES_BUCKET) {
      return c.json({ error: 'Database/Storage not configured' }, 503);
  }
  const imageFile = formData['image'] as File;
  if (!imageFile) return c.json({ error: 'Image required' }, 400);
  const key = `car-${crypto.randomUUID()}-${imageFile.name}`;
  await c.env.IMAGES_BUCKET.put(key, imageFile.stream(), { httpMetadata: { contentType: imageFile.type } });
  const imageUrl = `/api/images/${key}`;
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
    const uploadBase64 = async (base64: string, prefix: string) => {
      if (!base64 || !c.env.IMAGES_BUCKET) return null;
      const binString = atob(base64.split(',')[1]);
      const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
      const key = `${prefix}-${crypto.randomUUID()}.jpg`;
      await c.env.IMAGES_BUCKET.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg' } });
      return `/api/images/${key}`;
    };
    
    // Upload KYC Documents to R2
    const aadharFrontUrl = await uploadBase64(data.aadharFront, 'kyc-front');
    const aadharBackUrl = await uploadBase64(data.aadharBack, 'kyc-back');
    const licenseUrl = await uploadBase64(data.licensePhoto, 'kyc-license');
    
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO bookings (id, car_id, car_name, car_image, user_email, customer_name, customer_phone, start_date, end_date, total_cost, advance_amount, transaction_id, aadhar_front, aadhar_back, license_photo, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, data.carId, data.carName, data.carImage, user.email, data.customerName, data.customerPhone, data.startDate, data.endDate, data.totalCost, data.advanceAmount, data.transactionId, aadharFrontUrl, aadharBackUrl, licenseUrl, data.userLocation).run();
    
    if (c.env.GOOGLE_SCRIPT_URL) {
      // Non-blocking notification
      fetch(c.env.GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ type: 'new_booking', to_email: user.email, customer_name: data.customerName, car_name: data.carName }) }).catch(console.error);
    }
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
  return c.json({ success: true });
});

// --- MOUNT API ---
app.route('/api', api);

// --- STATIC ASSETS & SPA FALLBACK ---
app.get('/*', async (c) => {
  try {
    const response = await c.env.ASSETS.fetch(c.req.raw);
    if (response.status === 404) {
      // SPA Fallback
      return await c.env.ASSETS.fetch(new URL('/index.html', c.req.url));
    }
    return response;
  } catch (e) {
    return c.text("Internal Error", 500);
  }
});

export default app;
