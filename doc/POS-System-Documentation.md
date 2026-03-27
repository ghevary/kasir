# 📋 POS System — Complete Documentation

> **Project:** Web-based POS / Kasir System  
> **Stack:** Next.js 16 + Shadcn UI | Express + Better Auth | PostgreSQL + Drizzle ORM | Redis | Docker  
> **Roles:** Admin · Kasir · Gudang  
> **Version:** 1.0.0  
> **Date:** 2025

---

## TABLE OF CONTENTS

1. [Product Requirements Document (PRD)](#1-product-requirements-document)
2. [System Architecture Diagram](#2-system-architecture-diagram)
3. [Entity Relationship Diagram (ERD)](#3-entity-relationship-diagram)
4. [User Flow Diagrams](#4-user-flow-diagrams)
5. [Navigation Architecture](#5-navigation-architecture)
6. [ASCII Wireframes](#6-ascii-wireframes)
7. [Requirements Document](#7-requirements-document)
8. [API Contract Reference](#8-api-contract-reference)
9. [Docker & Repo Structure](#9-docker--repo-structure)

---

# 1. Product Requirements Document

## 1.1 Overview

**Product Name:** POS System (nama bisa disesuaikan)  
**Goal:** Sistem kasir berbasis web yang mengintegrasikan manajemen menu, stok, transaksi, dan laporan keuangan untuk tiga peran: Admin, Kasir, dan Gudang.

## 1.2 Problem Statement

Banyak bisnis F&B atau retail kecil-menengah masih menggunakan pencatatan manual yang rentan error, tidak real-time, dan tidak transparan antar bagian (kasir ↔ gudang ↔ manajemen). Sistem ini hadir untuk menjawab kebutuhan tersebut.

## 1.3 User Personas

| Persona | Deskripsi | Pain Point |
|---------|-----------|------------|
| **Admin** | Pemilik / manajer bisnis | Tidak bisa monitor stok & penjualan secara real-time |
| **Kasir** | Staf yang melayani transaksi | Input order lambat, struk manual, tidak bisa track shift |
| **Gudang** | Staf penerima & pengelola barang | Request barang tidak terstruktur, laporan barang keluar manual |

## 1.4 Core Features per Role

### 🔴 Admin
| # | Fitur | Prioritas |
|---|-------|-----------|
| A1 | Kelola kategori menu (CRUD) | P0 |
| A2 | Input & kelola menu per kategori | P0 |
| A3 | Input barang masuk (stok bertambah real-time) | P0 |
| A4 | Monitoring persediaan stok real-time | P0 |
| A5 | Laporan penjualan (harian/mingguan/bulanan + range tanggal) | P0 |
| A6 | Laporan barang masuk | P0 |
| A7 | Laporan barang keluar | P0 |
| A8 | Laporan keuangan (harian/minggu/bulan + range tanggal) | P0 |
| A9 | Manajemen user & role | P1 |

### 🟡 Kasir
| # | Fitur | Prioritas |
|---|-------|-----------|
| K1 | POS: input nama pembeli + pesanan | P0 |
| K2 | Cetak struk (print) | P0 |
| K3 | Pembayaran QRIS / Cash | P0 |
| K4 | Riwayat penjualan real-time + filter tanggal | P0 |
| K5 | Riwayat keuangan (cash vs QRIS) untuk balance | P0 |
| K6 | Akhiri shift (tutup toko, reset untuk hari berikutnya) | P0 |
| K7 | Request bahan/stok ke gudang | P1 |
| K8 | Laporan penjualan perhari (barang terjual) | P0 |

### 🟢 Gudang
| # | Fitur | Prioritas |
|---|-------|-----------|
| G1 | Menerima request barang dari kasir | P0 |
| G2 | Input barang keluar (sesuai request) | P0 |
| G3 | Laporan barang keluar | P0 |
| G4 | Nota barang keluar (printable) | P1 |
| G5 | Sinkronisasi stok dengan monitoring admin (real-time) | P0 |

## 1.5 Non-Functional Requirements

- **Availability:** 99.5% uptime untuk jam operasional
- **Performance:** Response time < 500ms untuk operasi transaksi
- **Real-time:** Stok update menggunakan Redis pub/sub + SSE atau polling 5 detik
- **Security:** Session-based auth via Better Auth, role-based access control (RBAC)
- **Scalability:** Monorepo Docker Compose, mudah scale service terpisah
- **Offline Graceful:** Jika koneksi putus, kasir minimal bisa lihat pesanan aktif

## 1.6 Out of Scope (v1.0)

- Mobile app native
- Multi-outlet/cabang
- Integrasi payment gateway QRIS otomatis (v1 = manual konfirmasi)
- Loyalty/point program

---

# 2. System Architecture Diagram

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client Layer (Browser)"]
        A[Admin Dashboard\nNext.js 16]
        K[Kasir POS\nNext.js 16]
        G[Gudang Panel\nNext.js 16]
    end

    subgraph FRONTEND["📦 frontend service (Docker)"]
        NX[Next.js App\nPort 3000]
    end

    subgraph BACKEND["📦 backend service (Docker)"]
        EX[Express API\nPort 4000]
        BA[Better Auth\nSession Manager]
        RD[Redis\nPort 6379\nCache + Pub/Sub]
    end

    subgraph DB["📦 database (Docker)"]
        PG[(PostgreSQL 16\nPort 5432)]
    end

    A --> NX
    K --> NX
    G --> NX
    NX -->|REST API / HTTP| EX
    EX --> BA
    EX --> RD
    EX --> PG
    RD -->|Pub/Sub real-time| EX
    BA --> PG

    subgraph DOCKER_COMPOSE["🐳 docker-compose.yml"]
        FRONTEND
        BACKEND
        DB
    end
```

```mermaid
graph LR
    subgraph REALTIME["Real-time Stock Flow"]
        direction TB
        T1[Transaksi Kasir] -->|Deduct Stock| API
        T2[Barang Masuk Admin] -->|Add Stock| API
        T3[Barang Keluar Gudang] -->|Deduct Stock| API
        API[Express API] -->|Publish Event| REDIS[(Redis\nPub/Sub)]
        REDIS -->|SSE / Polling| DASH[Admin Dashboard\nStock Monitor]
    end
```

---

# 3. Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string name
        string email
        string password_hash
        enum role "admin|kasir|gudang"
        boolean is_active
        timestamp created_at
    }

    CATEGORIES {
        uuid id PK
        string name
        string description
        boolean is_active
        timestamp created_at
    }

    MENU_ITEMS {
        uuid id PK
        uuid category_id FK
        string name
        string description
        decimal price
        integer stock_qty
        integer stock_alert_threshold
        string image_url
        boolean is_available
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTIONS {
        uuid id PK
        uuid kasir_id FK
        string customer_name
        decimal total_amount
        decimal paid_amount
        decimal change_amount
        enum payment_method "cash|qris"
        enum status "pending|completed|cancelled"
        string shift_id
        timestamp created_at
    }

    TRANSACTION_ITEMS {
        uuid id PK
        uuid transaction_id FK
        uuid menu_item_id FK
        integer qty
        decimal unit_price
        decimal subtotal
    }

    STOCK_IN {
        uuid id PK
        uuid menu_item_id FK
        uuid admin_id FK
        integer qty
        string notes
        string supplier
        decimal purchase_price
        timestamp created_at
    }

    STOCK_OUT {
        uuid id PK
        uuid menu_item_id FK
        uuid gudang_id FK
        uuid stock_request_id FK
        integer qty
        string notes
        string nota_number
        timestamp created_at
    }

    STOCK_REQUESTS {
        uuid id PK
        uuid kasir_id FK
        uuid gudang_id FK
        uuid menu_item_id FK
        integer requested_qty
        integer approved_qty
        enum status "pending|approved|rejected|fulfilled"
        string notes
        timestamp created_at
        timestamp updated_at
    }

    SHIFTS {
        uuid id PK
        uuid kasir_id FK
        timestamp started_at
        timestamp ended_at
        decimal total_cash
        decimal total_qris
        decimal total_revenue
        integer total_transactions
        enum status "active|closed"
    }

    CATEGORIES ||--o{ MENU_ITEMS : "has"
    USERS ||--o{ TRANSACTIONS : "kasir creates"
    TRANSACTIONS ||--o{ TRANSACTION_ITEMS : "contains"
    MENU_ITEMS ||--o{ TRANSACTION_ITEMS : "sold in"
    MENU_ITEMS ||--o{ STOCK_IN : "received as"
    MENU_ITEMS ||--o{ STOCK_OUT : "dispatched as"
    MENU_ITEMS ||--o{ STOCK_REQUESTS : "requested as"
    USERS ||--o{ STOCK_IN : "admin records"
    USERS ||--o{ STOCK_OUT : "gudang records"
    USERS ||--o{ STOCK_REQUESTS : "kasir requests"
    STOCK_REQUESTS ||--o| STOCK_OUT : "fulfilled by"
    USERS ||--o{ SHIFTS : "kasir opens"
```

---

# 4. User Flow Diagrams

## 4.1 Kasir — Transaksi POS

```mermaid
flowchart TD
    Start([Kasir Login]) --> ShiftCheck{Shift Aktif?}
    ShiftCheck -->|Tidak| OpenShift[Buka Shift Baru]
    ShiftCheck -->|Ya| POSPage[Halaman POS]
    OpenShift --> POSPage

    POSPage --> InputCustomer[Input Nama Pembeli]
    InputCustomer --> AddItems[Tambah Item Pesanan\nCari/Klik dari Menu]
    AddItems --> MoreItems{Tambah lagi?}
    MoreItems -->|Ya| AddItems
    MoreItems -->|Tidak| ReviewOrder[Review Order & Total]

    ReviewOrder --> SelectPayment{Metode Bayar}
    SelectPayment -->|Cash| InputCash[Input Nominal Cash\nHitung Kembalian]
    SelectPayment -->|QRIS| ShowQR[Tampilkan QR Code\nKonfirmasi Manual]

    InputCash --> Confirm[Konfirmasi Transaksi]
    ShowQR --> Confirm

    Confirm --> SaveTx[Simpan Transaksi\nKurangi Stok]
    SaveTx --> PrintStruk{Cetak Struk?}
    PrintStruk -->|Ya| Print[Buka Print Dialog]
    PrintStruk -->|Tidak| POSPage

    Print --> POSPage
```

## 4.2 Admin — Monitoring Stok & Laporan

```mermaid
flowchart TD
    Login([Admin Login]) --> Dashboard[Dashboard]
    Dashboard --> StockMonitor[Monitor Stok Real-time]
    Dashboard --> Reports[Laporan]
    Dashboard --> MenuMgmt[Kelola Menu & Kategori]
    Dashboard --> StockIn[Input Barang Masuk]

    StockMonitor --> AlertLow{Stok Rendah?}
    AlertLow -->|Ya| Highlight[Highlight Item\nAlert Threshold]
    AlertLow -->|Tidak| StockMonitor

    Reports --> SelectReport{Jenis Laporan}
    SelectReport --> SalesReport[Laporan Penjualan]
    SelectReport --> StockInReport[Laporan Barang Masuk]
    SelectReport --> StockOutReport[Laporan Barang Keluar]
    SelectReport --> FinancialReport[Laporan Keuangan]

    SalesReport --> FilterDate[Filter: Harian/Mingguan/Bulanan\natau Range Tanggal]
    FinancialReport --> FilterDate

    StockIn --> SelectItem[Pilih Item Menu]
    SelectItem --> InputQty[Input Jumlah Masuk]
    InputQty --> SaveStockIn[Simpan → Stok +Qty\nReal-time update]
```

## 4.3 Gudang — Request & Barang Keluar

```mermaid
flowchart TD
    Login([Gudang Login]) --> GudangDash[Dashboard Gudang]
    GudangDash --> RequestList[Daftar Request dari Kasir]
    GudangDash --> StockOutInput[Input Barang Keluar]
    GudangDash --> ReportOut[Laporan Barang Keluar]

    RequestList --> SelectReq[Pilih Request]
    SelectReq --> ReviewReq[Review Item & Qty]
    ReviewReq --> Decision{Keputusan}
    Decision -->|Approve| SetQty[Set Qty Disetujui]
    Decision -->|Reject| RejectReason[Input Alasan Tolak]

    SetQty --> FulfillOut[Input Barang Keluar\nTerkait Request]
    FulfillOut --> GenNota[Generate Nota Barang Keluar]
    GenNota --> UpdateStock[Stok - Qty\nSync ke Admin Monitor]

    ReportOut --> FilterDateOut[Filter Tanggal]
    FilterDateOut --> ExportNota[Lihat / Cetak Nota]
```

## 4.4 Shift Lifecycle

```mermaid
flowchart LR
    OpenShift[Buka Shift\nCatat waktu mulai] --> ActiveShift[Shift Aktif\nTransaksi berjalan]
    ActiveShift --> TxAccumulate[Transaksi terakumulasi\nCash & QRIS terpisah]
    TxAccumulate --> EndShift[Akhiri Shift\nRingkasan Cash & QRIS]
    EndShift --> Reconcile[Kasir Rekonsiliasi\nInput fisik cash]
    Reconcile --> CloseShift[Shift Ditutup\nData tersimpan]
    CloseShift --> NextDay[Siap untuk shift berikutnya]
```

---

# 5. Navigation Architecture

## 5.1 Route Map

```
/                           → Redirect ke /login
/login                      → Halaman login (semua role)

── ADMIN (/admin/*) ───────────────────────────────────────────────
/admin/dashboard            → Overview + key metrics
/admin/menu
  /admin/menu/categories    → Kelola kategori
  /admin/menu/items         → Kelola menu items (per kategori)
  /admin/menu/items/new     → Tambah menu baru
  /admin/menu/items/[id]    → Edit menu
/admin/stock
  /admin/stock/monitor      → Real-time stok semua item
  /admin/stock/in           → Input barang masuk
  /admin/stock/in/history   → Riwayat barang masuk
/admin/reports
  /admin/reports/sales      → Laporan penjualan
  /admin/reports/stock-in   → Laporan barang masuk
  /admin/reports/stock-out  → Laporan barang keluar
  /admin/reports/financial  → Laporan keuangan
/admin/users                → Manajemen user & role

── KASIR (/kasir/*) ────────────────────────────────────────────────
/kasir/pos                  → Halaman POS utama
/kasir/history
  /kasir/history/sales      → Riwayat penjualan + filter tanggal
  /kasir/history/financial  → Riwayat keuangan (cash vs QRIS)
/kasir/shift
  /kasir/shift/open         → Buka shift
  /kasir/shift/close        → Akhiri shift + ringkasan
/kasir/request              → Request bahan ke gudang
/kasir/report/daily         → Laporan penjualan perhari

── GUDANG (/gudang/*) ──────────────────────────────────────────────
/gudang/dashboard           → Overview request & aktivitas
/gudang/requests            → Daftar request dari kasir
/gudang/requests/[id]       → Detail request + approval
/gudang/stock-out
  /gudang/stock-out/input   → Input barang keluar
  /gudang/stock-out/history → Riwayat barang keluar
/gudang/report              → Laporan barang keluar + nota
/gudang/nota/[id]           → Nota barang keluar (printable)
```

## 5.2 Navigation Tree (Visual)

```mermaid
graph TD
    ROOT["/"] --> LOGIN["/login"]
    LOGIN --> ADMIN_DASH["/admin/dashboard"]
    LOGIN --> KASIR_POS["/kasir/pos"]
    LOGIN --> GUDANG_DASH["/gudang/dashboard"]

    ADMIN_DASH --> A_MENU["/admin/menu"]
    ADMIN_DASH --> A_STOCK["/admin/stock"]
    ADMIN_DASH --> A_REPORT["/admin/reports"]
    ADMIN_DASH --> A_USERS["/admin/users"]

    A_MENU --> A_CAT["/admin/menu/categories"]
    A_MENU --> A_ITEMS["/admin/menu/items"]

    A_STOCK --> A_MONITOR["/admin/stock/monitor"]
    A_STOCK --> A_STOCKIN["/admin/stock/in"]

    A_REPORT --> A_RSALES["/admin/reports/sales"]
    A_REPORT --> A_RFIN["/admin/reports/financial"]
    A_REPORT --> A_RSTKIN["/admin/reports/stock-in"]
    A_REPORT --> A_RSTKOUT["/admin/reports/stock-out"]

    KASIR_POS --> K_HIST["/kasir/history"]
    KASIR_POS --> K_SHIFT["/kasir/shift"]
    KASIR_POS --> K_REQ["/kasir/request"]
    KASIR_POS --> K_RPT["/kasir/report/daily"]

    GUDANG_DASH --> G_REQ["/gudang/requests"]
    GUDANG_DASH --> G_OUT["/gudang/stock-out"]
    GUDANG_DASH --> G_RPT["/gudang/report"]
```

---

# 6. ASCII Wireframes

## 6.1 Login Page

```
┌──────────────────────────────────────────┐
│                                          │
│           🏪  POS SYSTEM                 │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  📧  Email                       │   │
│   └──────────────────────────────────┘   │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │  🔒  Password                    │   │
│   └──────────────────────────────────┘   │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │         MASUK                    │   │
│   └──────────────────────────────────┘   │
│                                          │
│   Role akan terdeteksi otomatis          │
│                                          │
└──────────────────────────────────────────┘
```

---

## 6.2 Admin — Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│  🏪 POS System   [Admin]                        👤 Ahmad  [Logout]  │
├────────────┬────────────────────────────────────────────────────────┤
│            │  Dashboard                                              │
│  📊 Dashboard   ├──────────────────────────────────────────────────┤
│  🍽️  Menu      │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│  📦 Stok       │  │ Revenue  │ │Transaksi │ │ Stok Low │ │Items │ │
│  📋 Laporan    │  │ Hari Ini │ │  Hari ini│ │  Alert   │ │ Aktif│ │
│  👥 Users      │  │          │ │          │ │          │ │      │ │
│               │  │ Rp 2.4Jt │ │    47    │ │    3     │ │  24  │ │
│               │  └──────────┘ └──────────┘ └──────────┘ └──────┘ │
│               │                                                     │
│               │  Stok Monitor (Real-time)          [Lihat Semua →] │
│               │  ┌───────────────────────────────────────────────┐ │
│               │  │ Item           Kategori   Stok    Status       │ │
│               │  ├───────────────────────────────────────────────┤ │
│               │  │ Nasi Goreng    Makanan    24      ✅ Aman      │ │
│               │  │ Es Teh         Minuman     5      ⚠️ Rendah   │ │
│               │  │ Ayam Bakar     Makanan     0      🔴 Habis    │ │
│               │  └───────────────────────────────────────────────┘ │
│               │                                                     │
│               │  Penjualan Minggu Ini                               │
│               │  ████████████████░░░  Sen  Sel  Rab  Kam  Jum     │
└────────────┴────────────────────────────────────────────────────────┘
```

---

## 6.3 Admin — Input Barang Masuk

```
┌─────────────────────────────────────────────────────────────────────┐
│  🏪 POS System   [Admin]                        👤 Ahmad  [Logout]  │
├────────────┬────────────────────────────────────────────────────────┤
│  📊 Dashboard   │  Stok > Input Barang Masuk                        │
│  🍽️  Menu      ├──────────────────────────────────────────────────┤
│  📦 Stok   ●   │                                                     │
│    Monitor     │  ┌─────────────────────────────────────────────┐   │
│    Barang Masuk│  │ Pilih Item Menu                     [▼]     │   │
│  📋 Laporan    │  └─────────────────────────────────────────────┘   │
│  👥 Users      │                                                     │
│               │  ┌──────────────────┐  ┌────────────────────────┐  │
│               │  │ Jumlah Masuk     │  │ Harga Beli (opsional)  │  │
│               │  │  [    50       ] │  │  [ Rp ______________ ] │  │
│               │  └──────────────────┘  └────────────────────────┘  │
│               │                                                     │
│               │  ┌──────────────────────────────────────────────┐  │
│               │  │ Supplier (opsional)                           │  │
│               │  │  [___________________________________________]│  │
│               │  └──────────────────────────────────────────────┘  │
│               │                                                     │
│               │  ┌──────────────────────────────────────────────┐  │
│               │  │ Catatan                                       │  │
│               │  │  [___________________________________________]│  │
│               │  └──────────────────────────────────────────────┘  │
│               │                                                     │
│               │  Stok saat ini: 24  →  Setelah input: 74           │
│               │                                                     │
│               │         [Batal]    [💾 Simpan Barang Masuk]        │
│               │                                                     │
└────────────┴────────────────────────────────────────────────────────┘
```

---

## 6.4 Admin — Laporan Keuangan

```
┌─────────────────────────────────────────────────────────────────────┐
│  🏪 POS System   [Admin]                        👤 Ahmad  [Logout]  │
├────────────┬────────────────────────────────────────────────────────┤
│  📊 Dashboard   │  Laporan > Keuangan                               │
│  🍽️  Menu      ├──────────────────────────────────────────────────┤
│  📦 Stok       │                                                     │
│  📋 Laporan ●  │  Filter Periode:                                    │
│    Penjualan   │  [Harian] [Mingguan] [Bulanan] [Custom Range]       │
│    Keuangan ●  │  ┌───────────────┐    ┌───────────────┐            │
│    Stok Masuk  │  │ Dari: ____    │    │ Sampai: _____ │ [Terapkan] │
│    Stok Keluar │  └───────────────┘    └───────────────┘            │
│  👥 Users      │  ─────────────────────────────────────             │
│               │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│               │  │  Cash    │  │  QRIS    │  │  Total Revenue   │  │
│               │  │ Rp 1.8Jt │  │ Rp 0.6Jt │  │    Rp 2.4Jt     │  │
│               │  └──────────┘  └──────────┘  └──────────────────┘  │
│               │                                                     │
│               │  Transaksi Harian                    [📥 Export CSV]│
│               │  ┌───────────────────────────────────────────────┐ │
│               │  │ Tanggal    │ Cash      │ QRIS     │ Total      │ │
│               │  ├───────────────────────────────────────────────┤ │
│               │  │ 15 Mar     │ Rp 850K   │ Rp 300K  │ Rp 1.15Jt │ │
│               │  │ 14 Mar     │ Rp 920K   │ Rp 280K  │ Rp 1.2Jt  │ │
│               │  │ 13 Mar     │ Rp 730K   │ Rp 210K  │ Rp 940K   │ │
│               │  └───────────────────────────────────────────────┘ │
└────────────┴────────────────────────────────────────────────────────┘
```

---

## 6.5 Kasir — POS Page

```
┌──────────────────────────────────────────────────────────────────────┐
│  🏪 POS System  [Kasir]  Shift: #SH-20250315-001  👤 Budi [Logout]  │
├─────────────────────────────────┬────────────────────────────────────┤
│  MENU                           │  PESANAN SAAT INI                  │
│                                 │                                    │
│  Nama Pembeli: [_____________]  │  Pelanggan: Andi                   │
│                                 │  ─────────────────────────────     │
│  🔍 Cari menu... [____________] │  Item          Qty   Harga         │
│                                 │  ─────────────────────────────     │
│  [Semua] [Makanan] [Minuman]    │  Nasi Goreng    1    Rp 25.000     │
│  [Snack] [Lainnya]              │  Es Teh         2    Rp 10.000     │
│                                 │  ─────────────────────────────     │
│  ┌────────┐ ┌────────┐          │                                    │
│  │🍚 Nasi │ │🍗 Ayam │          │  Subtotal:           Rp 45.000     │
│  │Goreng  │ │Bakar   │  [+]     │                                    │
│  │Rp 25K  │ │Rp 35K  │          │  ─────────────────────────────     │
│  └────────┘ └────────┘          │  Pembayaran:                       │
│  ┌────────┐ ┌────────┐          │  [💵 Cash]  [📱 QRIS]             │
│  │🍵 Es  │ │🍜 Mie  │          │                                    │
│  │ Teh   │ │Goreng  │           │  Nominal: [ Rp _____________ ]    │
│  │Rp 5K  │ │Rp 20K  │           │  Kembalian:          Rp 5.000      │
│  └────────┘ └────────┘          │                                    │
│                                 │  ┌──────────┐  ┌────────────────┐ │
│  (scroll untuk lebih)           │  │  🗑️ Batal │  │ ✅ Bayar & Cetak│ │
│                                 │  └──────────┘  └────────────────┘ │
└─────────────────────────────────┴────────────────────────────────────┘
```

---

## 6.6 Kasir — Struk (Print View)

```
     ┌─────────────────────────────┐
     │         🏪 POS SYSTEM       │
     │       Jl. Contoh No. 1      │
     │       Semarang, Jawa Tengah │
     ├─────────────────────────────┤
     │  No: TRX-20250315-0047      │
     │  Kasir : Budi               │
     │  Pelanggan: Andi            │
     │  Tgl: 15 Mar 2025 14:32     │
     ├─────────────────────────────┤
     │  Nasi Goreng  x1            │
     │                   Rp 25.000 │
     │  Es Teh       x2            │
     │                   Rp 10.000 │
     ├─────────────────────────────┤
     │  TOTAL         Rp 35.000    │
     │  Bayar (Cash)  Rp 50.000    │
     │  Kembalian     Rp 15.000    │
     ├─────────────────────────────┤
     │  Metode: CASH               │
     ├─────────────────────────────┤
     │   Terima kasih sudah        │
     │      berkunjung! 🙏         │
     └─────────────────────────────┘
```

---

## 6.7 Kasir — Akhiri Shift

```
┌──────────────────────────────────────────────────────────┐
│  🔒 Akhiri Shift                                          │
│  Shift: #SH-20250315-001 | Mulai: 08:00                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Ringkasan Shift                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Total Transaksi         :    47 transaksi          │ │
│  │  Total Cash (sistem)     :    Rp 1.800.000          │ │
│  │  Total QRIS (sistem)     :    Rp   600.000          │ │
│  │  Total Revenue           :    Rp 2.400.000          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Rekonsiliasi Cash Fisik                                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Jumlah Cash Fisik: [ Rp _________________ ]    │    │
│  └─────────────────────────────────────────────────┘    │
│  Selisih: Rp 0 ✅                                        │
│                                                          │
│  Catatan: [______________________________________]       │
│                                                          │
│       [Batal]     [🔒 Konfirmasi Tutup Shift]           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 6.8 Kasir — Request Bahan ke Gudang

```
┌─────────────────────────────────────────────────────────────────────┐
│  🏪 POS System  [Kasir]                       👤 Budi  [Logout]     │
├────────────┬────────────────────────────────────────────────────────┤
│  🛒 POS    │  Request Bahan ke Gudang                               │
│  📜 Riwayat│  ─────────────────────────────────────────            │
│  📊 Keuangan    │  + Tambah Item Request                            │
│  📦 Request ●  │  ┌──────────────────────────────────────────────┐ │
│  🔒 Shift  │  │ Item          [Nasi Goreng              ▼]   │ │
│           │  │ Jumlah        [  50  ]                       │ │
│           │  │ Catatan       [Untuk besok pagi]             │ │
│           │  │                         [+ Tambah ke List]   │ │
│           │  └──────────────────────────────────────────────┘ │
│           │                                                     │
│           │  List Request:                                      │
│           │  ┌────────────────────────────────────────────────┐│
│           │  │ No │ Item       │ Qty │ Catatan    │ Aksi       ││
│           │  ├────────────────────────────────────────────────┤│
│           │  │ 1  │ Nasi Goreng│  50 │ Besok pagi │ [🗑️]      ││
│           │  │ 2  │ Es Teh     │ 100 │ -          │ [🗑️]      ││
│           │  └────────────────────────────────────────────────┘│
│           │                                                     │
│           │         [Batal]   [📤 Kirim Request ke Gudang]     │
└────────────┴────────────────────────────────────────────────────────┘
```

---

## 6.9 Gudang — Dashboard & Request List

```
┌─────────────────────────────────────────────────────────────────────┐
│  🏪 POS System   [Gudang]                    👤 Candra  [Logout]    │
├────────────┬────────────────────────────────────────────────────────┤
│  📊 Dashboard   │  Dashboard Gudang                                 │
│  📥 Request ●  │  ─────────────────────────────────────────────    │
│  📤 Stok Keluar │  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  📋 Laporan    │  │ Request  │  │ Fulfilled│  │  Total Keluar │  │
│               │  │ Pending  │  │  Hari ini│  │   Hari ini    │  │
│               │  │    3     │  │    8     │  │   Rp 450K     │  │
│               │  └──────────┘  └──────────┘  └───────────────┘  │
│               │                                                     │
│               │  Request Masuk                     [Lihat Semua]   │
│               │  ┌─────────────────────────────────────────────┐  │
│               │  │ ID       │ Kasir │ Item       │ Qty │ Status │  │
│               │  ├─────────────────────────────────────────────┤  │
│               │  │ REQ-001  │ Budi  │ Nasi Goreng│  50 │ ⏳ Pend│  │
│               │  │ REQ-002  │ Sari  │ Es Teh     │ 100 │ ⏳ Pend│  │
│               │  │ REQ-003  │ Budi  │ Ayam Bakar │  30 │ ✅ Done│  │
│               │  └─────────────────────────────────────────────┘  │
│               │                                                     │
│               │  [📦 Input Barang Keluar Manual]                   │
└────────────┴────────────────────────────────────────────────────────┘
```

---

## 6.10 Gudang — Nota Barang Keluar (Print View)

```
     ┌─────────────────────────────────┐
     │        NOTA BARANG KELUAR       │
     │          🏪 POS SYSTEM          │
     ├─────────────────────────────────┤
     │  No Nota : NBO-20250315-012     │
     │  Tanggal : 15 Maret 2025        │
     │  Gudang  : Candra               │
     │  Req By  : Budi (Kasir)         │
     │  Req ID  : REQ-20250315-001     │
     ├─────────────────────────────────┤
     │  No │ Item          │ Qty       │
     │  ───┼───────────────┼─────────  │
     │   1 │ Nasi Goreng   │  50 pcs   │
     │   2 │ Es Teh        │ 100 pcs   │
     ├─────────────────────────────────┤
     │  Total Item : 2                 │
     │  Total Qty  : 150               │
     ├─────────────────────────────────┤
     │  Catatan: Untuk besok pagi      │
     ├─────────────────────────────────┤
     │  TTD Gudang      TTD Kasir      │
     │                                 │
     │  (____________) (_____________) │
     │    Candra           Budi        │
     └─────────────────────────────────┘
```

---

# 7. Requirements Document

## 7.1 Functional Requirements

### FR-AUTH: Autentikasi & Otorisasi
| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | Sistem mendukung login dengan email + password menggunakan Better Auth |
| FR-AUTH-02 | Setiap user memiliki role: `admin`, `kasir`, atau `gudang` |
| FR-AUTH-03 | Middleware RBAC memblokir akses ke route yang tidak sesuai role |
| FR-AUTH-04 | Session disimpan di Redis dengan TTL 8 jam (1 shift) |
| FR-AUTH-05 | Redirect otomatis ke dashboard sesuai role setelah login |

### FR-MENU: Manajemen Menu (Admin)
| ID | Requirement |
|----|-------------|
| FR-MENU-01 | Admin dapat membuat, membaca, mengubah, dan menghapus (soft delete) kategori |
| FR-MENU-02 | Admin dapat CRUD menu item, masing-masing terikat ke satu kategori |
| FR-MENU-03 | Setiap menu item memiliki: nama, deskripsi, harga, stok, threshold alert, gambar, status aktif |
| FR-MENU-04 | Menu item tidak aktif tidak muncul di halaman POS kasir |

### FR-STOCK: Manajemen Stok
| ID | Requirement |
|----|-------------|
| FR-STOCK-01 | Input barang masuk oleh admin menambah `stock_qty` pada menu item secara real-time |
| FR-STOCK-02 | Transaksi kasir mengurangi `stock_qty` setiap item yang terjual |
| FR-STOCK-03 | Barang keluar oleh gudang mengurangi `stock_qty` |
| FR-STOCK-04 | Admin dapat melihat semua item beserta stok saat ini, diurutkan dari yang terendah |
| FR-STOCK-05 | Item dengan stok ≤ `stock_alert_threshold` ditampilkan dengan badge peringatan |
| FR-STOCK-06 | Perubahan stok dipublikasikan ke Redis, admin dashboard polling/SSE update otomatis |

### FR-POS: Transaksi Kasir
| ID | Requirement |
|----|-------------|
| FR-POS-01 | Kasir harus membuka shift sebelum bisa melakukan transaksi |
| FR-POS-02 | Kasir dapat mencari menu berdasarkan nama atau memilih dari grid kategori |
| FR-POS-03 | Kasir memasukkan nama pembeli (opsional, default "Umum") |
| FR-POS-04 | Kasir dapat menambah, mengurangi, atau hapus item dari order sebelum konfirmasi |
| FR-POS-05 | Pembayaran Cash: input nominal, sistem hitung kembalian otomatis |
| FR-POS-06 | Pembayaran QRIS: tampilkan konfirmasi manual, kasir konfirmasi setelah cek bukti |
| FR-POS-07 | Setelah konfirmasi, sistem simpan transaksi dan kurangi stok secara atomik |
| FR-POS-08 | Sistem generate struk yang dapat dicetak via browser print |

### FR-SHIFT: Manajemen Shift
| ID | Requirement |
|----|-------------|
| FR-SHIFT-01 | Satu kasir hanya boleh memiliki satu shift aktif dalam satu waktu |
| FR-SHIFT-02 | Akhiri shift menampilkan ringkasan: total transaksi, total cash, total QRIS |
| FR-SHIFT-03 | Kasir menginput jumlah cash fisik untuk rekonsiliasi |
| FR-SHIFT-04 | Sistem menampilkan selisih antara cash sistem vs cash fisik |
| FR-SHIFT-05 | Setelah shift ditutup, kasir tidak bisa melakukan transaksi baru |

### FR-REPORT: Laporan
| ID | Requirement |
|----|-------------|
| FR-REPORT-01 | Laporan penjualan dapat difilter: harian, mingguan, bulanan, atau range tanggal custom |
| FR-REPORT-02 | Laporan keuangan menampilkan breakdown cash vs QRIS per periode |
| FR-REPORT-03 | Laporan barang masuk mencatat: tanggal, item, qty, supplier, harga beli, admin input |
| FR-REPORT-04 | Laporan barang keluar mencatat: tanggal, item, qty, gudang input, nomor nota, linked request |
| FR-REPORT-05 | Kasir dapat melihat laporan penjualan hari itu: daftar item terjual + qty + total |
| FR-REPORT-06 | Semua laporan dapat diekspor ke CSV |

### FR-REQUEST: Request Bahan (Kasir → Gudang)
| ID | Requirement |
|----|-------------|
| FR-REQ-01 | Kasir dapat membuat request dengan satu atau lebih item + jumlah + catatan |
| FR-REQ-02 | Request dikirim ke gudang dengan status `pending` |
| FR-REQ-03 | Gudang dapat melihat semua request pending, menyetujui atau menolak per request |
| FR-REQ-04 | Saat disetujui, gudang input qty aktual yang dikeluarkan |
| FR-REQ-05 | Sistem generate nota barang keluar yang dapat dicetak |
| FR-REQ-06 | Status request terupdate real-time di sisi kasir |

## 7.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Response time API transaksi (create transaction) | < 500ms P95 |
| NFR-02 | Stock update visible after transaction | < 2 detik |
| NFR-03 | Concurrent users supported | ≥ 10 kasir simultaneous |
| NFR-04 | Database backup | Harian, retensi 30 hari |
| NFR-05 | HTTPS untuk semua komunikasi | Required di production |
| NFR-06 | Semua password di-hash dengan bcrypt | cost factor ≥ 12 |

---

# 8. API Contract Reference

## 8.1 Authentication

```
POST   /api/auth/login          → { email, password } → { session, user }
POST   /api/auth/logout         → Invalidate session
GET    /api/auth/me             → { user, role }
```

## 8.2 Menu & Kategori

```
GET    /api/categories          → List semua kategori
POST   /api/categories          → Buat kategori baru           [Admin]
PUT    /api/categories/:id      → Update kategori               [Admin]
DELETE /api/categories/:id      → Soft delete kategori          [Admin]

GET    /api/menu-items          → List semua item (+ filter by category)
GET    /api/menu-items/active   → Hanya item aktif (untuk POS)
POST   /api/menu-items          → Tambah item baru              [Admin]
PUT    /api/menu-items/:id      → Update item                   [Admin]
DELETE /api/menu-items/:id      → Soft delete item              [Admin]
```

## 8.3 Stok

```
GET    /api/stock/monitor       → Semua item + stok real-time   [Admin]
POST   /api/stock/in            → Input barang masuk            [Admin]
GET    /api/stock/in            → Riwayat barang masuk          [Admin]
GET    /api/stock/out           → Riwayat barang keluar         [Admin, Gudang]
POST   /api/stock/out           → Input barang keluar manual    [Gudang]
```

## 8.4 Transaksi

```
POST   /api/transactions        → Buat transaksi baru           [Kasir]
GET    /api/transactions        → Riwayat transaksi (filter date) [Kasir, Admin]
GET    /api/transactions/:id    → Detail transaksi + items
GET    /api/transactions/:id/receipt → Data struk (untuk print)
```

## 8.5 Shift

```
POST   /api/shifts/open         → Buka shift baru               [Kasir]
GET    /api/shifts/active       → Shift aktif kasir ini         [Kasir]
POST   /api/shifts/close        → Tutup shift + rekonsiliasi    [Kasir]
GET    /api/shifts              → Riwayat semua shift            [Admin]
```

## 8.6 Request Bahan

```
POST   /api/stock-requests      → Buat request bahan            [Kasir]
GET    /api/stock-requests      → List request (filter by status/role)
GET    /api/stock-requests/:id  → Detail request
PUT    /api/stock-requests/:id/approve  → Setujui request       [Gudang]
PUT    /api/stock-requests/:id/reject   → Tolak request         [Gudang]
POST   /api/stock-requests/:id/fulfill  → Penuhi + buat stock out [Gudang]
```

## 8.7 Laporan

```
GET    /api/reports/sales       → Lap penjualan (?from=&to=)   [Admin, Kasir]
GET    /api/reports/financial   → Lap keuangan (?from=&to=)    [Admin]
GET    /api/reports/stock-in    → Lap barang masuk              [Admin]
GET    /api/reports/stock-out   → Lap barang keluar             [Admin, Gudang]
GET    /api/reports/daily-sales → Lap penjualan hari ini        [Kasir]
GET    /api/reports/nota/:id    → Data nota barang keluar       [Gudang]
```

---

# 9. Docker & Repo Structure

## 9.1 Repository Structure

```
pos-system/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── README.md
│
├── frontend/                        ← Next.js 16 + Shadcn UI
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── components.json              ← Shadcn config
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   ├── (admin)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   ├── menu/
│   │   │   │   ├── stock/
│   │   │   │   ├── reports/
│   │   │   │   └── users/
│   │   │   ├── (kasir)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── pos/
│   │   │   │   ├── history/
│   │   │   │   ├── shift/
│   │   │   │   ├── request/
│   │   │   │   └── report/
│   │   │   └── (gudang)/
│   │   │       ├── layout.tsx
│   │   │       ├── dashboard/
│   │   │       ├── requests/
│   │   │       ├── stock-out/
│   │   │       ├── report/
│   │   │       └── nota/
│   │   ├── components/
│   │   │   ├── ui/                  ← Shadcn components
│   │   │   ├── pos/                 ← POS-specific components
│   │   │   ├── reports/
│   │   │   └── shared/
│   │   ├── lib/
│   │   │   ├── api.ts               ← API client wrapper
│   │   │   └── utils.ts
│   │   └── types/
│
├── backend/                         ← Express + Better Auth
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.ts                 ← Entry point
│   │   ├── config/
│   │   │   ├── db.ts                ← Drizzle + pg connection
│   │   │   ├── redis.ts
│   │   │   └── auth.ts              ← Better Auth config
│   │   ├── db/
│   │   │   ├── schema/              ← Drizzle schema per table
│   │   │   │   ├── users.ts
│   │   │   │   ├── menu.ts
│   │   │   │   ├── stock.ts
│   │   │   │   ├── transactions.ts
│   │   │   │   ├── shifts.ts
│   │   │   │   └── requests.ts
│   │   │   └── migrations/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── menu.routes.ts
│   │   │   ├── stock.routes.ts
│   │   │   ├── transactions.routes.ts
│   │   │   ├── shifts.routes.ts
│   │   │   ├── requests.routes.ts
│   │   │   └── reports.routes.ts
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   ← Session validation
│   │   │   └── rbac.middleware.ts   ← Role-based access
│   │   └── utils/
│
└── docs/                            ← Dokumentasi ini
    └── POS-System-Documentation.md
```

## 9.2 docker-compose.yml

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: pos_db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: pos_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    container_name: pos_backend
    env_file: .env
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
      PORT: 4000
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    container_name: pos_frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next

volumes:
  postgres_data:
  redis_data:
```

## 9.3 Environment Variables (.env.example)

```env
# Database
DB_USER=pos_user
DB_PASSWORD=supersecretpassword
DB_NAME=pos_db

# Backend
PORT=4000
JWT_SECRET=your_jwt_secret_here
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:4000

# Redis
REDIS_URL=redis://localhost:6379

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

> **Dokumen ini adalah living document.** Update sesuai perkembangan sprint dan feedback dari stakeholder.  
> Versi 1.0.0 — Maret 2025
