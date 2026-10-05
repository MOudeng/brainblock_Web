# Desain Skema Database (Database Design)

Berdasarkan *Business Process* yang telah disepakati, berikut adalah rancangan tabel-tabel database (Entity Relationship) untuk mendukung sistem manajemen event BRAINBLOCK Block Design. Sistem ini akan diimplementasikan menggunakan Golang dengan standard library approach (Chi, SQLC, dan Goose).

---

## 1. Tabel `users`
Tabel ini digunakan untuk menyimpan data autentikasi Admin Platform (Super Admin) dan Admin Pelaksana (Organizer).

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `uint` (PK) | Primary Key, Auto Increment |
| `username` | `varchar` | Username unik untuk login |
| `password_hash`| `varchar` | Password yang sudah di-enkripsi (bcrypt) |
| `role` | `enum` | `'super_admin'` atau `'organizer'` |
| `name` | `varchar` | Nama lengkap admin |
| `created_at` | `timestamp` | Waktu akun dibuat |
| `updated_at` | `timestamp` | Waktu data diupdate |

---

## 2. Tabel `events`
Menyimpan data acara/kompetisi yang dibuat oleh admin.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Primary Key berupa UUID agar aman saat di-share |
| `name` | `varchar` | Nama Event (misal: "Lomba Coding 2026") |
| `date` | `timestamp` | Tanggal pelaksanaan |
| `venue` | `varchar` | Tempat pelaksanaan |
| `organizer_id`| `uint` (FK) | Relasi ke `users.id` (Admin Pelaksana) |
| `device_count`| `int` | Batas/jumlah perangkat yang disediakan |
| `is_private` | `boolean` | `true` jika leaderboard bersifat private |
| `password` | `varchar` | Password untuk mengakses leaderboard (jika private) |
| `created_at` | `timestamp` | - |
| `updated_at` | `timestamp` | - |

---

## 3. Tabel `devices` (Perangkat)
Mewakili stasiun bermain fisik (laptop/komputer) di lokasi event.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | ID unik perangkat (menjadi kode login untuk mode Kiosk) |
| `event_id` | `uuid` (FK) | Relasi ke `events.id` |
| `name` | `varchar` | Nama Perangkat (misal: "Perangkat 1") |
| `status` | `varchar` | `'idle'` (kosong), `'in_use'` (sedang dipakai main) |
| `created_at` | `timestamp` | - |

---

## 4. Tabel `participants` (Peserta)
Menyimpan data pemain yang terikat (*tied*) secara eksklusif ke sebuah event.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `uint` (PK) | Primary Key internal |
| `uid` | `varchar` | **ID unik peserta** (Misal: "PES-123") yang akan di-input saat mau main |
| `event_id` | `uuid` (FK) | Relasi ke `events.id` (mengikat peserta ke event spesifik) |
| `name` | `varchar` | Nama peserta |
| `age` | `int` | Umur |
| `gender` | `varchar` | Jenis Kelamin |
| `created_at` | `timestamp` | - |

---

## 5. Tabel `game_sessions` (Progress Bermain)
Menyimpan hasil atau rekam jejak bermain seorang peserta di sebuah perangkat. Tabel ini akan menjadi sumber data untuk kalkulasi Leaderboard.

| Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Primary Key transaksi bermain |
| `participant_id`| `uint` (FK) | Siapa yang bermain (Relasi ke `participants.id`) |
| `event_id` | `uuid` (FK) | Di event apa dia bermain (Relasi ke `events.id`) |
| `device_id` | `uuid` (FK) | Di laptop mana dia bermain (Relasi ke `devices.id`) |
| `score` | `float` | Skor kumulatif yang didapat |
| `level_reached` | `int` | Level terakhir yang berhasil diselesaikan |
| `start_time` | `timestamp` | Kapan (jam & detik) game dimulai |
| `end_time` | `timestamp` | Kapan (jam & detik) game selesai |
| `created_at` | `timestamp` | - |

---

## Hubungan Antar Tabel (Relasi)
1. **User (1)** memiliki **Banyak Event (N)**.
2. **Event (1)** memiliki **Banyak Perangkat (N)**.
3. **Event (1)** memiliki **Banyak Peserta (N)**.
4. **Game Session** adalah pertemuan antara **Peserta (1)**, **Event (1)**, dan **Perangkat (1)**.
