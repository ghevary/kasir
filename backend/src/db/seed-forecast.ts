/**
 * Seed script: Insert WMA test data (Extra Avocado) into database
 * 
 * Data from spreadsheet: 34 days of sales data (01/01/2025 - 03/02/2025)
 * Each day = 1 shift (opened 08:00, closed 17:00)
 * Each shift has transactions totaling the daily sales qty
 * 
 * Run: npx tsx src/db/seed-forecast.ts
 */

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const SALES_DATA = [
  { date: "2025-01-01", qty: 44 },
  { date: "2025-01-02", qty: 41 },
  { date: "2025-01-03", qty: 42 },
  { date: "2025-01-04", qty: 44 },
  { date: "2025-01-05", qty: 35 },
  { date: "2025-01-06", qty: 38 },
  { date: "2025-01-07", qty: 44 },
  { date: "2025-01-08", qty: 38 },
  { date: "2025-01-09", qty: 42 },
  { date: "2025-01-10", qty: 41 },
  { date: "2025-01-11", qty: 36 },
  { date: "2025-01-12", qty: 42 },
  { date: "2025-01-13", qty: 43 },
  { date: "2025-01-14", qty: 43 },
  { date: "2025-01-15", qty: 40 },
  { date: "2025-01-16", qty: 37 },
  { date: "2025-01-17", qty: 41 },
  { date: "2025-01-18", qty: 40 },
  { date: "2025-01-19", qty: 37 },
  { date: "2025-01-20", qty: 43 },
  { date: "2025-01-21", qty: 44 },
  { date: "2025-01-22", qty: 40 },
  { date: "2025-01-23", qty: 40 },
  { date: "2025-01-24", qty: 40 },
  { date: "2025-01-25", qty: 38 },
  { date: "2025-01-26", qty: 45 },
  { date: "2025-01-27", qty: 35 },
  { date: "2025-01-28", qty: 44 },
  { date: "2025-01-29", qty: 42 },
  { date: "2025-01-30", qty: 39 },
  { date: "2025-01-31", qty: 44 },
  { date: "2025-02-01", qty: 37 },
  { date: "2025-02-02", qty: 35 },
  { date: "2025-02-03", qty: 45 },
];

const ITEM_NAME = "Extra Avocado";
const ITEM_PRICE = 8000; // Rp 8.000 per pcs

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("🌱 Starting WMA forecast seed data...\n");

    // 1. Get kasir user
    const kasirResult = await pool.query(
      `SELECT id FROM users WHERE role = 'kasir' LIMIT 1`
    );
    if (kasirResult.rows.length === 0) {
      console.error("❌ No kasir user found. Run the app first to create default users.");
      return;
    }
    const kasirId = kasirResult.rows[0].id;
    console.log(`✅ Using kasir user: ${kasirId}`);

    // 2. Ensure category exists
    const catResult = await pool.query(
      `INSERT INTO categories (name, description)
       VALUES ('Minuman', 'Kategori minuman')
       ON CONFLICT DO NOTHING
       RETURNING id`
    );
    let categoryId: string;
    if (catResult.rows.length > 0) {
      categoryId = catResult.rows[0].id;
      console.log(`✅ Created category 'Minuman': ${categoryId}`);
    } else {
      const existing = await pool.query(`SELECT id FROM categories WHERE name = 'Minuman' LIMIT 1`);
      categoryId = existing.rows[0].id;
      console.log(`✅ Using existing category 'Minuman': ${categoryId}`);
    }

    // 3. Create menu item "Extra Avocado"
    const itemResult = await pool.query(
      `INSERT INTO menu_items (category_id, name, description, price, stock_qty, warehouse_qty, outlet_qty, is_available)
       VALUES ($1, $2, 'Extra Avocado topping', $3, 500, 300, 200, true)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [categoryId, ITEM_NAME, ITEM_PRICE.toFixed(2)]
    );
    let menuItemId: string;
    if (itemResult.rows.length > 0) {
      menuItemId = itemResult.rows[0].id;
      console.log(`✅ Created menu item '${ITEM_NAME}': ${menuItemId}`);
    } else {
      const existing = await pool.query(`SELECT id FROM menu_items WHERE name = $1 LIMIT 1`, [ITEM_NAME]);
      if (existing.rows.length > 0) {
        menuItemId = existing.rows[0].id;
        console.log(`✅ Using existing menu item '${ITEM_NAME}': ${menuItemId}`);
      } else {
        // Force insert without ON CONFLICT
        const forced = await pool.query(
          `INSERT INTO menu_items (category_id, name, description, price, stock_qty, warehouse_qty, outlet_qty, is_available)
           VALUES ($1, $2, 'Extra Avocado topping', $3, 500, 300, 200, true)
           RETURNING id`,
          [categoryId, ITEM_NAME, ITEM_PRICE.toFixed(2)]
        );
        menuItemId = forced.rows[0].id;
        console.log(`✅ Created menu item '${ITEM_NAME}': ${menuItemId}`);
      }
    }

    // 4. Create shifts, transactions, and transaction items for each day
    console.log(`\n📊 Inserting ${SALES_DATA.length} days of sales data...\n`);

    for (const day of SALES_DATA) {
      const shiftStart = new Date(`${day.date}T08:00:00+07:00`);
      const shiftEnd = new Date(`${day.date}T17:00:00+07:00`);

      const totalAmount = day.qty * ITEM_PRICE;

      // Create closed shift
      const shiftResult = await pool.query(
        `INSERT INTO shifts (kasir_id, started_at, ended_at, total_cash, total_qris, total_revenue, total_transactions, status)
         VALUES ($1, $2, $3, $4, '0', $4, 1, 'closed')
         RETURNING id`,
        [kasirId, shiftStart, shiftEnd, totalAmount.toFixed(2)]
      );
      const shiftId = shiftResult.rows[0].id;

      // Create transaction
      const txResult = await pool.query(
        `INSERT INTO transactions (kasir_id, shift_id, customer_name, total_amount, paid_amount, change_amount, payment_method, status, created_at)
         VALUES ($1, $2, 'Umum', $3, $3, '0', 'cash', 'completed', $4)
         RETURNING id`,
        [kasirId, shiftId, totalAmount.toFixed(2), shiftStart]
      );
      const txId = txResult.rows[0].id;

      // Create transaction item
      await pool.query(
        `INSERT INTO transaction_items (transaction_id, menu_item_id, qty, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [txId, menuItemId, day.qty, ITEM_PRICE.toFixed(2), totalAmount.toFixed(2)]
      );

      console.log(`  📅 ${day.date}: ${day.qty} pcs × Rp ${ITEM_PRICE.toLocaleString()} = Rp ${totalAmount.toLocaleString()} (shift: ${shiftId.slice(0, 8)})`);
    }

    console.log(`\n✅ Seed complete! ${SALES_DATA.length} shifts with sales data inserted.`);
    console.log(`\n📋 Ringkasan:`);
    console.log(`   - Menu Item: ${ITEM_NAME}`);
    console.log(`   - Periode: 01/01/2025 - 03/02/2025`);
    console.log(`   - Total shift: ${SALES_DATA.length}`);
    console.log(`   - Total penjualan: ${SALES_DATA.reduce((sum, d) => sum + d.qty, 0)} pcs`);
    console.log(`\n🧪 Sekarang bisa test di /kasir/forecast dengan:`);
    console.log(`   - Periode WMA: 7`);
    console.log(`   - Data Historis: 60 hari terakhir`);
    console.log(`   - Hasil MAD/MSE/MAPE harus mendekati: MAD=2.81, MSE=11.30, MAPE=7.11%`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await pool.end();
  }
}

seed();
