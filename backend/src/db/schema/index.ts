import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["admin", "kasir", "gudang"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "qris"]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "cancelled",
]);
export const shiftStatusEnum = pgEnum("shift_status", ["active", "closed"]);
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "approved",
  "rejected",
  "fulfilled",
]);

// ── Users ──────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Categories ─────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Menu Items ─────────────────────────────────────────────
export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  stockQty: integer("stock_qty").default(0),
  stockAlertThreshold: integer("stock_alert_threshold").default(5),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Shifts ─────────────────────────────────────────────────
export const shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  kasirId: uuid("kasir_id")
    .references(() => users.id)
    .notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  totalCash: decimal("total_cash", { precision: 12, scale: 2 }).default("0"),
  totalQris: decimal("total_qris", { precision: 12, scale: 2 }).default("0"),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default(
    "0"
  ),
  totalTransactions: integer("total_transactions").default(0),
  physicalCash: decimal("physical_cash", { precision: 12, scale: 2 }),
  notes: text("notes"),
  status: shiftStatusEnum("status").default("active"),
});

// ── Transactions ───────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  kasirId: uuid("kasir_id")
    .references(() => users.id)
    .notNull(),
  shiftId: uuid("shift_id").references(() => shifts.id),
  customerName: text("customer_name").default("Umum"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).notNull(),
  changeAmount: decimal("change_amount", { precision: 12, scale: 2 }).default(
    "0"
  ),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: transactionStatusEnum("status").default("pending"),
  midtransOrderId: text("midtrans_order_id"),
  midtransToken: text("midtrans_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Transaction Items ──────────────────────────────────────
export const transactionItems = pgTable("transaction_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id")
    .references(() => transactions.id)
    .notNull(),
  menuItemId: uuid("menu_item_id")
    .references(() => menuItems.id)
    .notNull(),
  qty: integer("qty").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
});

// ── Stock In (Admin) ───────────────────────────────────────
export const stockIn = pgTable("stock_in", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuItemId: uuid("menu_item_id")
    .references(() => menuItems.id)
    .notNull(),
  adminId: uuid("admin_id")
    .references(() => users.id)
    .notNull(),
  qty: integer("qty").notNull(),
  notes: text("notes"),
  supplier: text("supplier"),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Stock Out (Gudang) ─────────────────────────────────────
export const stockOut = pgTable("stock_out", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuItemId: uuid("menu_item_id")
    .references(() => menuItems.id)
    .notNull(),
  gudangId: uuid("gudang_id")
    .references(() => users.id)
    .notNull(),
  stockRequestId: uuid("stock_request_id").references(() => stockRequests.id),
  qty: integer("qty").notNull(),
  notes: text("notes"),
  notaNumber: text("nota_number"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Stock Requests (Kasir → Gudang) ────────────────────────
export const stockRequests = pgTable("stock_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  kasirId: uuid("kasir_id")
    .references(() => users.id)
    .notNull(),
  gudangId: uuid("gudang_id").references(() => users.id),
  menuItemId: uuid("menu_item_id")
    .references(() => menuItems.id)
    .notNull(),
  requestedQty: integer("requested_qty").notNull(),
  approvedQty: integer("approved_qty"),
  status: requestStatusEnum("status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Relations ──────────────────────────────────────────────
export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
}));

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    kasir: one(users, {
      fields: [transactions.kasirId],
      references: [users.id],
    }),
    shift: one(shifts, {
      fields: [transactions.shiftId],
      references: [shifts.id],
    }),
    items: many(transactionItems),
  })
);

export const transactionItemsRelations = relations(
  transactionItems,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionItems.transactionId],
      references: [transactions.id],
    }),
    menuItem: one(menuItems, {
      fields: [transactionItems.menuItemId],
      references: [menuItems.id],
    }),
  })
);

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  kasir: one(users, {
    fields: [shifts.kasirId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const stockRequestsRelations = relations(
  stockRequests,
  ({ one }) => ({
    kasir: one(users, {
      fields: [stockRequests.kasirId],
      references: [users.id],
      relationName: "kasirRequests",
    }),
    gudang: one(users, {
      fields: [stockRequests.gudangId],
      references: [users.id],
      relationName: "gudangRequests",
    }),
    menuItem: one(menuItems, {
      fields: [stockRequests.menuItemId],
      references: [menuItems.id],
    }),
  })
);
