
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS cars;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('customer','owner')) DEFAULT 'customer',
  reset_token_hash TEXT,
  reset_token_expires INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE cars (
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
);

CREATE TABLE bookings (
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
);
