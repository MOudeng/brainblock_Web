# 🎨 Frontend Architecture & Integration Plan (Client)

Dokumen ini memuat rancangan perombakan (*Refactoring* dan *Pruning*) pada sisi *Frontend* (React) agar sejajar dan tersambung dengan API Backend *Domain-Driven Design (DDD)* yang baru saja disederhanakan.

## 🎯 Objektif (MVP)
Memfokuskan fitur pada alur pendaftaran acara (*Event*), bermain dengan verifikasi *Participant ID*, dan penampilan *Leaderboard*. Fitur-fitur lama yang rumit (WebSocket, Midtrans, Turnamen Bracket) akan dipangkas demi performa dan stabilitas.

---

## 🗑️ Fase 1: Pruning (Pembersihan Fitur Legacy)

Berikut adalah daftar halaman/komponen usang yang **akan dihapus** dari direktori `client/src/pages/`:
1. `Paywall.jsx` *(Sudah tidak memakai Midtrans untuk sementara waktu)*
2. `Analytics.jsx` *(Analitik AI yang terpisah akan disederhanakan atau dihapus)*
3. `Tournaments.jsx` & `TournamentDetail.jsx` *(Fokus pada Single Event Leaderboard)*
4. `Competitif.jsx` & `MatchDashboard.jsx` *(Fitur Duel 1v1 ditiadakan)*
5. `Export.jsx` *(Dihapus/ditunda untuk iterasi berikutnya)*

**Perubahan Konfigurasi Utama**:
- **`client/src/lib/axios.js`**: `baseURL` yang sebelumnya menggunakan `/api/v1` diubah menjadi murni `/api`.
- **`client/src/App.jsx`**: *Router* akan dibersihkan untuk hanya menampilkan halaman MVP.

---

## 🔌 Fase 2: Pemetaan API Backend Baru (Integrasi)

Endpoint Backend baru yang digunakan:

| Modul | Method | Endpoint | Kegunaan di Frontend |
|-------|--------|----------|----------------------|
| **Auth** | `POST` | `/api/auth/login` | Form Login untuk Admin / Event Organizer di `Admin.jsx` |
| **Event** | `GET` | `/api/events` | Menampilkan daftar Event aktif di `Dashboard.jsx` |
| **Event** | `POST` | `/api/events` | Membuat event baru (via Dashboard) |
| **Participant**| `GET`| `/api/events/{eventId}/participants/{uid}`| Mengecek keabsahan UID sebelum partisipan main di `PlayGame.jsx` |
| **Participant**| `POST`| `/api/events/{eventId}/participants` | Registrasi manual partisipan oleh Admin di Dashboard |
| **Game** | `POST` | `/api/games` | Menambahkan skor *Game Session* saat Partisipan selesai main |
| **Game** | `GET` | `/api/events/{eventId}/leaderboard` | Ditampilkan di layar besar (`EventDisplay.jsx`) |

---

## 🖥️ Fase 3: Pembaruan Alur Halaman Inti (UI/UX)

### 1. `Admin.jsx` & `Dashboard.jsx` (Manajemen)
Halaman tempat Panitia/Admin masuk.
- Form autentikasi yang memanggil `/api/auth/login`.
- Setelah sukses, Admin akan dibawa ke `Dashboard` untuk mengatur acara (*Event*) yang ia miliki.
- Di Dashboard, Admin bisa membuat sesi Event baru dan mendaftarkan ID (UID) Peserta.

### 2. `PlayGame.jsx` (Sesi Bermain Kios)
Digunakan sebagai antarmuka pada tablet/layar di depan area penyusunan balok.
- **Fase Input**: Tampilan awal meminta scan/input `Participant ID (UID)`.
- **Validasi**: Menembak API `/api/events/{eventId}/participants/{uid}` untuk memastikan pendaftaran.
- **Game Engine**: Menggunakan kamera (*Computer Vision*) seperti sebelumnya.
- **Submit Score**: Setelah level 8 selesai, sistem menembak `/api/games` untuk merekam `event_id`, `participant_id`, `score`, dan `level_reached`.

### 3. `EventDisplay.jsx` (Live Leaderboard TV)
Layar presentasi utama yang dilihat banyak orang.
- Menghapus sepenuhnya *WebSocket* (`/ws`).
- **Data Fetching**: *React Query* akan melakukan *Polling* (pengambilan data otomatis) ke `/api/events/{eventId}/leaderboard` setiap **5 detik**.
- Jika Leaderboard bersifat publik, tak perlu autentikasi. Jika privat, layar harus login terlebih dahulu.

---

## 📈 Alur Kerja Selanjutnya
1. Hapus *file* tak terpakai di folder `client/`.
2. Perbarui `lib/axios.js` dan konfigurasi `App.jsx`.
3. Perbaiki *Hooks* dan API *Calls* di `Dashboard`, `PlayGame`, dan `EventDisplay`.
4. Uji *End-to-End* menyalakan Docker Backend bersama dengan Vite Server (`npm run dev`).
