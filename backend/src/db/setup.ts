import { Pool } from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const setupSQL = `
-- Create enums (IF NOT EXISTS requires PG 9.1+)
DO $$ BEGIN
  CREATE TYPE "role" AS ENUM('admin', 'kasir', 'gudang');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "payment_method" AS ENUM('cash', 'qris');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "transaction_status" AS ENUM('pending', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "shift_status" AS ENUM('active', 'closed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "request_status" AS ENUM('pending', 'approved', 'rejected', 'fulfilled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "role" "role" NOT NULL,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Categories table
CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);

-- Menu Items table
CREATE TABLE IF NOT EXISTS "menu_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "category_id" uuid REFERENCES "categories"("id"),
  "name" text NOT NULL,
  "description" text,
  "price" numeric(12,2) NOT NULL,
  "stock_qty" integer DEFAULT 0,
  "warehouse_qty" integer DEFAULT 0,
  "outlet_qty" integer DEFAULT 0,
  "stock_alert_threshold" integer DEFAULT 5,
  "image_url" text,
  "is_available" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Add new columns if table already exists (migration)
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "warehouse_qty" integer DEFAULT 0;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "outlet_qty" integer DEFAULT 0;

-- Shifts table
CREATE TABLE IF NOT EXISTS "shifts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kasir_id" uuid NOT NULL REFERENCES "users"("id"),
  "started_at" timestamp DEFAULT now(),
  "ended_at" timestamp,
  "total_cash" numeric(12,2) DEFAULT '0',
  "total_qris" numeric(12,2) DEFAULT '0',
  "total_revenue" numeric(12,2) DEFAULT '0',
  "total_transactions" integer DEFAULT 0,
  "physical_cash" numeric(12,2),
  "notes" text,
  "status" "shift_status" DEFAULT 'active'
);

-- Transactions table
CREATE TABLE IF NOT EXISTS "transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kasir_id" uuid NOT NULL REFERENCES "users"("id"),
  "shift_id" uuid REFERENCES "shifts"("id"),
  "customer_name" text DEFAULT 'Umum',
  "total_amount" numeric(12,2) NOT NULL,
  "paid_amount" numeric(12,2) NOT NULL,
  "change_amount" numeric(12,2) DEFAULT '0',
  "payment_method" "payment_method" NOT NULL,
  "status" "transaction_status" DEFAULT 'pending',
  "midtrans_order_id" text,
  "midtrans_token" text,
  "created_at" timestamp DEFAULT now()
);

-- Transaction Items table
CREATE TABLE IF NOT EXISTS "transaction_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "transaction_id" uuid NOT NULL REFERENCES "transactions"("id"),
  "menu_item_id" uuid NOT NULL REFERENCES "menu_items"("id"),
  "qty" integer NOT NULL,
  "unit_price" numeric(12,2) NOT NULL,
  "subtotal" numeric(12,2) NOT NULL
);

-- Stock Requests table
CREATE TABLE IF NOT EXISTS "stock_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kasir_id" uuid NOT NULL REFERENCES "users"("id"),
  "gudang_id" uuid REFERENCES "users"("id"),
  "menu_item_id" uuid NOT NULL REFERENCES "menu_items"("id"),
  "requested_qty" integer NOT NULL,
  "approved_qty" integer,
  "status" "request_status" DEFAULT 'pending',
  "notes" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Stock In table
CREATE TABLE IF NOT EXISTS "stock_in" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "menu_item_id" uuid NOT NULL REFERENCES "menu_items"("id"),
  "admin_id" uuid NOT NULL REFERENCES "users"("id"),
  "qty" integer NOT NULL,
  "notes" text,
  "supplier" text,
  "purchase_price" numeric(12,2),
  "created_at" timestamp DEFAULT now()
);

-- Stock Out table
CREATE TABLE IF NOT EXISTS "stock_out" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "menu_item_id" uuid NOT NULL REFERENCES "menu_items"("id"),
  "gudang_id" uuid NOT NULL REFERENCES "users"("id"),
  "stock_request_id" uuid REFERENCES "stock_requests"("id"),
  "qty" integer NOT NULL,
  "notes" text,
  "nota_number" text,
  "created_at" timestamp DEFAULT now()
);

-- Sync stock_qty = warehouse_qty + outlet_qty for any existing data
UPDATE "menu_items" SET "warehouse_qty" = "stock_qty" WHERE "warehouse_qty" = 0 AND "stock_qty" > 0;
`;

const defaultUsers = [
  {
    name: "Admin",
    email: "admin@pos.com",
    password: "admin123",
    role: "admin",
  },
  {
    name: "Kasir",
    email: "kasir@pos.com",
    password: "kasir123",
    role: "kasir",
  },
  {
    name: "Gudang",
    email: "gudang@pos.com",
    password: "gudang123",
    role: "gudang",
  },
];

export async function setupDatabase(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🔧 Running database setup...");

    // Create all tables
    await pool.query(setupSQL);
    console.log("✅ Database tables created/verified");

    console.log("🌱 Seeding default users (ensuring all exist)...");
    for (const user of defaultUsers) {
      const passwordHash = await bcrypt.hash(user.password, 12);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET password_hash = $3, name = $1, role = $4`,
        [user.name, user.email, passwordHash, user.role]
      );
      console.log(`  ✅ User "${user.name}" (${user.role}) ensured`);
    }
    console.log("✅ Default users seeded!");

    console.log("🚀 Database setup complete!");

    // ── Auto-seed Extra Avocado (WMA forecast data) ──────────────
    await seedExtraAvocado(pool);

  } catch (error) {
    console.error("❌ Database setup failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function seedExtraAvocado(pool: Pool): Promise<void> {
  // Guard: skip jika data sudah ada
  const check = await pool.query(`SELECT id FROM menu_items WHERE name = 'Extra Avocado' LIMIT 1`);
  if (check.rows.length > 0) {
    console.log("⏭️  Extra Avocado sudah ada, skip seeding.");
    return;
  }

  console.log("🌱 Seeding data Extra Avocado...");

  const SALES_DATA = [
    { date: "2025-01-01", qty: 44 }, { date: "2025-01-02", qty: 41 },
    { date: "2025-01-03", qty: 42 }, { date: "2025-01-04", qty: 44 },
    { date: "2025-01-05", qty: 35 }, { date: "2025-01-06", qty: 38 },
    { date: "2025-01-07", qty: 44 }, { date: "2025-01-08", qty: 38 },
    { date: "2025-01-09", qty: 42 }, { date: "2025-01-10", qty: 41 },
    { date: "2025-01-11", qty: 36 }, { date: "2025-01-12", qty: 42 },
    { date: "2025-01-13", qty: 43 }, { date: "2025-01-14", qty: 43 },
    { date: "2025-01-15", qty: 40 }, { date: "2025-01-16", qty: 37 },
    { date: "2025-01-17", qty: 41 }, { date: "2025-01-18", qty: 40 },
    { date: "2025-01-19", qty: 37 }, { date: "2025-01-20", qty: 43 },
    { date: "2025-01-21", qty: 44 }, { date: "2025-01-22", qty: 40 },
    { date: "2025-01-23", qty: 40 }, { date: "2025-01-24", qty: 40 },
    { date: "2025-01-25", qty: 38 }, { date: "2025-01-26", qty: 45 },
    { date: "2025-01-27", qty: 35 }, { date: "2025-01-28", qty: 44 },
    { date: "2025-01-29", qty: 42 }, { date: "2025-01-30", qty: 39 },
    { date: "2025-01-31", qty: 44 }, { date: "2025-02-01", qty: 37 },
    { date: "2025-02-02", qty: 35 }, { date: "2025-02-03", qty: 45 },
  ];
  const ITEM_PRICE = 8000;

  // 1. Kasir
  const kasirResult = await pool.query(`SELECT id FROM users WHERE role = 'kasir' LIMIT 1`);
  if (kasirResult.rows.length === 0) { console.warn("⚠️  Kasir not found, skip seed."); return; }
  const kasirId = kasirResult.rows[0].id;

  // 2. Kategori Super Popular
  await pool.query(`INSERT INTO categories (name, description) VALUES ('Super Popular', 'Menu paling populer dan laris') ON CONFLICT DO NOTHING`);
  const catResult = await pool.query(`SELECT id FROM categories WHERE name = 'Super Popular' LIMIT 1`);
  const categoryId = catResult.rows[0].id;

  // 3. Menu item
  const itemResult = await pool.query(
    `INSERT INTO menu_items (category_id, name, description, price, stock_qty, warehouse_qty, outlet_qty, is_available)
     VALUES ($1, 'Extra Avocado', 'Extra Avocado topping', $2, 500, 300, 200, true) RETURNING id`,
    [categoryId, ITEM_PRICE.toFixed(2)]
  );
  const menuItemId = itemResult.rows[0].id;

  // 4. Shifts + transactions
  for (const day of SALES_DATA) {
    const shiftStart = new Date(`${day.date}T08:00:00+07:00`);
    const shiftEnd   = new Date(`${day.date}T17:00:00+07:00`);
    const totalAmount = day.qty * ITEM_PRICE;

    const shiftResult = await pool.query(
      `INSERT INTO shifts (kasir_id, started_at, ended_at, total_cash, total_revenue, total_transactions, status)
       VALUES ($1, $2, $3, $4, $4, 1, 'closed') RETURNING id`,
      [kasirId, shiftStart, shiftEnd, totalAmount.toFixed(2)]
    );
    const shiftId = shiftResult.rows[0].id;

    const txResult = await pool.query(
      `INSERT INTO transactions (kasir_id, shift_id, total_amount, paid_amount, payment_method, status, created_at)
       VALUES ($1, $2, $3, $3, 'cash', 'completed', $4) RETURNING id`,
      [kasirId, shiftId, totalAmount.toFixed(2), shiftStart]
    );
    const txId = txResult.rows[0].id;

    await pool.query(
      `INSERT INTO transaction_items (transaction_id, menu_item_id, qty, unit_price, subtotal)
       VALUES ($1, $2, $3, $4, $5)`,
      [txId, menuItemId, day.qty, ITEM_PRICE.toFixed(2), totalAmount.toFixed(2)]
    );
  }

  console.log(`✅ Extra Avocado seeded! 34 hari data historis berhasil dimasukkan.`);
}
