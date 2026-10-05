# Panduan Pengujian Manual MVP BRAINBLOCK

Dokumen ini berisi panduan alur (*flow*) untuk melakukan pengujian manual fitur Minimum Viable Product (MVP) pada sistem BRAINBLOCK (Frontend + Backend).

---

## Tahap 1: Persiapan (Start Services)

Sebelum menguji skenario, pastikan seluruh layanan sudah berjalan di lokal Anda. Buka **tiga terminal berbeda**:

**Terminal 1 (Database & Backend):**
```bash
cd server
make docker-up   # Menyalakan PostgreSQL
make run         # Menyalakan Backend API (berjalan di http://localhost:8080)
```
*(Pastikan Anda sudah pernah menjalankan `make migrate-up` sebelumnya)*

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev      # Menyalakan Frontend React (biasanya di http://localhost:5173)
```

---

## Tahap 2: Skenario Pengujian Alur MVP

Buka browser Anda dan akses `http://localhost:5173`. Ikuti skenario berurutan berikut:

### Skenario 1: Autentikasi Admin
1. Pada halaman utama (Home), cari dan klik navigasi untuk masuk ke mode **Admin / Dashboard**.
2. Anda akan dihadapkan pada form **Login**.
3. Masukkan Username dan Password Admin bawaan sistem (*default credentials*):
   - **Username**: `admin`
   - **Password**: `admin123`
   *(Data ini dibuat otomatis oleh migrasi seeder database).*
4. **Ekspektasi:** Anda berhasil masuk ke halaman **Dashboard** Event. Token JWT akan tersimpan di browser Anda (*localStorage* key: `brainblock_token`).

### Skenario 2: Manajemen Event
1. Di halaman **Dashboard**, klik tombol **"Buat Event Baru"**.
2. Isi formulir nama event, lokasi, dsb. Klik Simpan.
3. **Ekspektasi:** Event baru akan muncul di dalam tabel daftar Event. Tabel ini sudah memiliki data *Event ID* (berupa UUID) yang menempel secara *seamless* di sistem Klien.

### Skenario 3: Pendaftaran Peserta (Registration)
1. Dari halaman Dashboard, klik tombol **Registrasi** pada salah satu *Event* yang ada di tabel.
   *(Ini akan mengarahkan Anda ke URL seperti `/register?eventId=123e4567...`)*
2. Isi form pendaftaran peserta:
   - **Barcode UID**: Buat string acak (misal: `UID-001`) atau lakukan _scan_.
   - **Nama & Umur**: Bebas.
3. Submit form.
4. Klik tombol **Daftar Peserta** di header/tabel untuk masuk ke halaman Participants.
5. **Ekspektasi:** Peserta `UID-001` tersebut muncul di tabel khusus untuk Event tersebut.

### Skenario 4: Proses Gameplay (Kiosk)
1. Pada halaman Dashboard, klik tombol **Play Game** untuk Event yang sama.
   *(Akan membuka URL `/play?eventId=123e4567...`)*
2. Pada pertama kali dibuka, sistem akan melakukan registrasi perangkat Kiosk otomatis secara di *background* menggunakan `POST /api/devices`.
3. Masukkan/Scan UID peserta tadi (contoh: `UID-001`). Klik **Cek**.
4. Sistem akan memvalidasi UID ke backend. Jika valid, klik **Mulai Bermain**.
5. Layar kamera (Webcam) akan menyala. Lakukan simulasi penyusunan pola balok (atau tutup/tunggu *dummy score* berjalan) sampai menyelesaikan 8 level.
6. Pada akhir permainan, skor akan dihitung dan dikirim ke backend secara otomatis.
7. **Ekspektasi:** Muncul notifikasi "Skor berhasil disimpan ke server!".

### Skenario 5: Leaderboard Cerdas (Live Display)
1. Kembali ke Dashboard, lalu klik **Leaderboard Display** untuk Event tersebut.
   *(Akan membuka URL `/event?eventId=123e4567...`)*
2. **Ekspektasi:** Anda akan melihat UI Dark Mode premium. Sistem akan otomatis melakukan polling setiap 5 detik ke endpoint `/api/events/{eventId}/leaderboard`.
3. Peserta `UID-001` yang baru saja menyelesaikan permainan tadi harus muncul di papan peringkat dengan format UI yang sesuai (Emas/Perak/Perunggu jika berada di Top 3).

---
**TIPS:** Buka jendela Gameplay dan Leaderboard bersebelahan (split-screen). Saat Anda menyelesaikan game di layar pertama, Anda bisa langsung melihat nama peserta muncul secara otomatis pada layar Leaderboard setelah siklus polling 5 detik berlalu.
