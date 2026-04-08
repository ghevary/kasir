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
  "stock_alert_threshold" integer DEFAULT 5,
  "image_url" text,
  "is_available" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

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

    // Seed default users if none exist
    const result = await pool.query("SELECT COUNT(*) FROM users");
    const userCount = parseInt(result.rows[0].count, 10);

    if (userCount === 0) {
      console.log("🌱 Seeding default users...");
      for (const user of defaultUsers) {
        const passwordHash = await bcrypt.hash(user.password, 12);
        await pool.query(
          `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO NOTHING`,
          [user.name, user.email, passwordHash, user.role]
        );
        console.log(`  ✅ User "${user.name}" (${user.role}) created`);
      }
      console.log("✅ Default users seeded!");
    } else {
      console.log(`ℹ️  ${userCount} users already exist, skipping seed`);
    }

    console.log("🚀 Database setup complete!");
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}
