⚠️Sengaja .env ku upload biar gampang aja⚠️

# 🛒 POS System (Aplikasi Kasir)

Aplikasi kasir ini dibuat agar mudah digunakan. Anda hanya perlu mengikuti beberapa langkah di bawah ini untuk menyalakan, menggunakan, dan mematikan aplikasinya.

---

## 🛠️ Persiapan Awal (Hanya Sekali Saja)

Sebelum menjalankan aplikasi, pastikan komputer/laptop Anda sudah terinstall program bernama **Docker Desktop**. 
1. Jika belum ada, download dan install Docker Desktop dari sini: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Install seperti biasa (Next sampai selesai).
3. Buka aplikasi Docker Desktop dan pastikan ikon paus-nya (di pojok kanan bawah dekat jam) sudah berwarna hijau atau statusnya "Running".

---

## 🚀 Cara Menyalakan Aplikasi

Anda tidak perlu ribet mengetik kode. Cukup ikuti cara ini:

1. Pastikan **Docker Desktop** sudah terbuka dan berjalan.
2. Di dalam folder project ini, cari file bernama **`jalankan.bat`** (atau hanya bernama `jalankan` dengan ikon roda gigi/kotak hitam).
3. **Klik 2x (Double-click)** file tersebut.
4. Tunggu beberapa saat sampai layar hitam (Terminal) selesai memproses.
5. Selesai! Aplikasi sudah berjalan. Buka browser (Chrome/Edge/Firefox) dan ketikkan alamat ini:
   👉 **http://localhost:3000**

---

## 🔑 Akun Login

Aplikasi ini memiliki 3 jenis peran dengan tugas yang berbeda-beda. Berikut adalah email dan password untuk masuk ke dalam aplikasi:

| Posisi / Role | Email | Password | Kegunaan |
|-------------|-----------------|--------------|-----------------|
| **Admin** | `` | `admin123` | Mengatur semua data, tambah menu, cek laporan keuangan penuh. |
| **Kasir** | `kasir@pos.com` | `kasir123` | Melakukan penjualan, cetak struk, melihat rekap hariannya. |
| **Gudang** | `gudang@pos.com`| `gudang123`| Mengatur masuk/keluarnya barang (stok) dapur/gudang. |

*Disarankan untuk mengganti password nanti jika diperlukan.*

---

## 🛑 Cara Mematikan Aplikasi

Jika toko sudah tutup atau Anda ingin mematikan aplikasi kasir:
1. Cari file bernama **`berhentikan.bat`** di dalam folder project ini.
2. **Klik 2x (Double-click)** file tersebut.
3. Tunggu sebentar sampai proses mematikan sistem selesai.

---

## ❓ Bantuan / Kendala

- Jika muncul error di browser ("Site cannot be reached"), pastikan **Docker Desktop** sudah berjalan, dan Anda sudah mengeklik `jalankan.bat`. Tunggu sekitar 1-2 menit setelah di-klik karena mesin butuh waktu pemanasan.
- Jika layar hitam (Terminal) langsung menutup saat `jalankan.bat` di-klik, berarti Docker belum hidup sempurna. Buka lagi Docker Desktop-nya.
