# Changelog

Semua perubahan yang signifikan pada project Brainblock akan dicatat di dalam file ini. Format yang digunakan berdasarkan pedoman [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.1] - 2026-09-19

### Fixed
- **Shadow Boundary Misclassification:** Memperbaiki sistem *Color Thresholding* pada `GameCanvas.jsx` yang rentan salah menebak orientasi diagonal balok (misal *Face 6* terbaca sebagai *Face 3*). Titik pengambilan sampel (*sampling point*) telah digeser lebih dekat ke titik tengah (dari `25%/75%` menjadi `35%/65%`). Ini membuat sistem kebal terhadap *bounding box* YOLO yang sering kali kurang presisi (terlalu lebar) akibat tercampurnya bayangan gelap (*shadows*) di tepi balok.
- **Vite Dev Server Crash:** Memperbaiki *bug* di mana *Vite HMR Overlay* memunculkan *error* merah di *localhost* karena larangan *dynamic import* dari folder `public`. Solusinya adalah menerapkan *Environment Detection* (`isDev`) di `yoloWorker.js` agar menggunakan `workerDir` saat *Development* dan `/onnx/` saat *Production*.
- **YOLO False Positives:** Menaikkan *Confidence Threshold* model deteksi dari `0.15` (terlalu rendah) menjadi `0.65` di `yoloWorker.js` untuk secara drastis menghilangkan deteksi palsu (*false positives*) terhadap tangan pengguna, jari, atau garis tepi meja.
- **Bounding Box Stacking:** Menurunkan *NMS (Non-Maximum Suppression) IOU Threshold* dari `0.45` menjadi `0.30` di `yoloWorker.js`. Ini menyelesaikan masalah gawat (bug visual) di mana AI menggambar banyak kotak yang saling menumpuk/berkedip ganda (*Double-Double*) pada satu objek balok yang sama.
- **Validation Jitter Tolerance:** Merombak total logika penyangga validasi (*detection buffer*) di `GameCanvas.jsx`. Sebelumnya, satu *frame* kamera yang berkedip akan menghapus memori validasi secara total. Kini, sistem dengan cerdas mengambil 4 balok teratas yang valid dan membiarkan toleransi hingga 3 *frame* cacat per 7 *frame*, sehingga tingkat penyelesaian level jauh lebih stabil dan tidak rawan gagal pada deteksi pola V (Level 6).

## [1.0.0] - 2026-09-09

### Added
- **WebGPU & WASM Acceleration:** Menambahkan kapabilitas WebGPU pada konfigurasi `onnxruntime-web` di `yoloWorker.js` untuk kecepatan deteksi kelas *Native*.
- **Resolution Independent AI:** Mengubah batas deteksi terkecil (bounding box filter) di `GameCanvas.jsx` dari ukuran absolut (80 piksel) menjadi dinamis (8% dari tinggi layar), sehingga kamera beresolusi tinggi (1080p / 4K) dapat terbaca dengan sempurna tanpa mengacaukan batas rasio.
- **WebAssembly Static Assets:** Menambahkan sistem auto-serve untuk file biner ONNX WebGPU dan WASM dengan meletakkannya di `client/public/onnx/`. Ini memecahkan kasus di mana Vite Rollup menolak membundel file biner ke dalam folder rilis produksi (`dist`).
- **export_320.sh Script:** Menambahkan *script* otomatis untuk mengekspor model YOLOv5 `.pt` ke `.onnx` dengan resolusi 320x320. *Script* ini menyertakan trik manipulasi (*mock*) internal Python untuk melewati pengecekan versi usang `pkg_resources` yang gagal di Debian 13 / Python 3.13.
- Dokumentasi `docs/ARCHITECTURE.md` tentang arsitektur *Client-side Inference*.

### Changed
- **Client-Side AI Evolution:** Memigrasikan arsitektur ketergantungan *hybrid* `local_ai.py` sepenuhnya menjadi 100% Client-Side WebWorker agar mendukung skalabilitas turnamen umum (puluhan ribu pengguna).
- **UI Navigation:** Mengubah rute navigasi tombol Buka Perangkat di halaman Dashboard dan Event Detail agar mengarah ke `/setup` untuk meregistrasi Device UUID, bukan melompat langsung ke `/play`.
- **Nginx Headers (Production):** Menyuntikkan header wajib WebAssembly (`Cross-Origin-Opener-Policy` dan `Cross-Origin-Embedder-Policy`) langsung ke dalam routing statis `client/nginx.conf` agar fitur Multi-threading tetap diizinkan saat aplikasi dijalankan di server VPS produksi.
- **YOLO Input Size:** Menurunkan resolusi model YOLO di WebWorker dari 640x640 menjadi 320x320, secara dinamis menyesuaikan perhitungan matriks dari 25200 ke 6300 *anchors* di `yolo.js` untuk lonjakan performa 4x lipat.
- **Uncapped FPS:** Menghapus batas artifisial (`setTimeout 50ms`) pada loop deteksi `GameCanvas.jsx` (`aiLoop`) ke `0ms` untuk merender AI secara *real-time*.
- **Shadow Tolerance:** Mengubah ambang batas deteksi *grayscale* (*white/red threshold*) di `GameCanvas.jsx` dari `175` menjadi `120` untuk mengakomodasi bayangan ruangan pada balok fisik.

### Fixed
- **Nginx Cache Busting (.mjs):** Membuat blok `location /onnx/` spesifik di `nginx.conf` dengan aturan paksa `default_type application/javascript;` dan `Cache-Control no-store`. Ini mengesampingkan *cache* agresif dari browser (Chrome) yang sebelumnya terlanjur menyimpan respons tipe file salah, sekaligus menjamin modul WebGPU tereksekusi dengan benar di lingkungan produksi.
- **Nginx MIME Types (.mjs):** Menambahkan aturan `types { application/javascript mjs; }` pada `nginx.conf` agar *server* produksi tidak mengirimkan file modul WebAssembly ONNX sebagai `application/octet-stream`. Hal ini memperbaiki isu di mana browser menolak mengeksekusi file AI di server *Staging/Production* karena pelanggaran *Strict MIME type checking*.
- **Face Mapping Logic:** Memperbaiki logika deteksi *Face* murni Javascript yang sebelumnya terbalik (menukar definisi *Face 3* dan *Face 5* agar selaras dengan orientasi matriks model Python orisinal).
- **Audio Loading Crash:** Memperbaiki kerusakan sesi (*session crash*) di `audio.js` dengan menyematkan perlindungan fungsi `bgm: () => {}` kosong (Dummy).
- **SharedArrayBuffer Lock:** Memulihkan kembali konfigurasi COOP/COEP *headers* di `vite.config.js` dan menyesuaikan tag `script` di `index.html` (menghapus `opencv.js` eksternal CDN) agar mode CPU *Multi-threading* WebAssembly diizinkan kembali oleh kebijakan isolasi Chrome.

## [2026-09-04]

### Added

- **Computer Vision (Client):** Menambahkan logika _temporal smoothing_ dan _pattern matching_ multi-frame pada `GameCanvas.jsx` (OpenCV) untuk menstabilkan hasil deteksi warna dan mencegah transisi (_flickering_) tak terduga.
- **Database Config (Server):** Menambahkan metode _fallback_ penyusunan koneksi database (DSN) di `server/cmd/api/main.go` menggunakan variabel lingkungan terpisah (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`) jika `DATABASE_URL` kosong.

## [2026-08-31]

### Added

- **Docker Compose (Root):** Membuat `docker-compose.yml` di root direktori untuk menggabungkan container `client` (React/Nginx), `api` (Go), dan `postgres` dalam satu jaringan.
- **Resolution Independent AI:** Mengubah batas deteksi terkecil (bounding box filter) di `GameCanvas.jsx` dari ukuran absolut (80 piksel) menjadi dinamis (8% dari tinggi layar), sehingga kamera beresolusi tinggi (1080p / 4K) dapat terbaca dengan sempurna tanpa mengacaukan batas rasio.
- **WebAssembly Static Assets:** Menambahkan sistem auto-serve untuk file biner ONNX WebGPU dan WASM dengan meletakkannya di `client/public/onnx/`. Ini memecahkan kasus di mana Vite Rollup menolak membundel file biner ke dalam folder rilis produksi (`dist`).
- **CI Pipeline:** Membuat GitHub Actions `.github/workflows/ci.yml` untuk otomatis menjalankan linter dan unit testing.
- **CD Pipeline (Dev):** Membuat GitHub Actions `.github/workflows/deploy-dev.yml` untuk auto-deploy ke server lokal Intel NUC menggunakan _Self-Hosted Runner_.
- **CD Pipeline (Prod):** Menyiapkan kerangka `.github/workflows/deploy-prod.yml` untuk rilis production via SSH ke VPS di masa depan.
- **Auto Migrations:** Menambahkan instalasi `goose` ke `server/Dockerfile` agar backend otomatis menjalankan migrasi dan _seed data_ pada saat container baru menyala.

### Changed

- **Branching Strategy:** Mengadopsi metode **Full GitFlow** secara resmi untuk manajemen repositori.
- **UI Navigation:** Mengubah rute navigasi tombol Buka Perangkat di halaman Dashboard dan Event Detail agar mengarah ke `/setup` untuk meregistrasi Device UUID, bukan melompat langsung ke `/play`.
- **Nginx Headers (Production):** Menyuntikkan header wajib WebAssembly (`Cross-Origin-Opener-Policy` dan `Cross-Origin-Embedder-Policy`) langsung ke dalam routing statis `client/nginx.conf` agar fitur Multi-threading tetap diizinkan saat aplikasi dijalankan di server VPS produksi.
- **Go Version:** Memperbarui versi bahasa Go di `server/Dockerfile` dan `ci.yml` (ke 1.25.x) agar memenuhi standar minimun pada `go.mod`.

### Fixed

- **Nginx Config:** Memperbaiki `client/nginx.conf` pada bagian `proxy_pass` agar mengarah ke hostname `api` sesuai dengan nama service di docker-compose, menghindari error 502 Bad Gateway.

---

## [2026-08-28]

### Added

- **API Expansion:** Menambahkan endpoint `/api/v1/auth/users` melalui fungsi `ListUsers` di layer domain, usecase, dan delivery.
- **Admin UI:** Membangun _layout_ tabel responsif di `/dashboard/users` untuk menampilkan daftar admin dengan indikator _badge_ berdasarkan _role_.
- **Seeder Migration:** Membuat file migrasi `20260828000001_seed_admin.sql` untuk menyuntikkan user Super Admin bawaan (`admin` / `admin123`).
- **Server Tooling:** Membuat `Makefile` komprehensif untuk instalasi dependensi, migrasi database (`goose`), _query generation_ (`sqlc`), dan _hot-reloading_ (`air`).
- **Infrastructure:** Menambahkan konfigurasi lokal `docker-compose.yml` terpisah untuk PostgreSQL.
- **Documentation:** Membuat panduan pengujian E2E (End-to-End) manual di `docs/MANUAL_TESTING_MVP.md`.

### Changed

- **Rebranding:** Mengubah identitas project dari "OAMP" menjadi "BRAINBLOCK" secara masif di seluruh modul Go, variabel lokal, _localstorage_, token JWT, dan teks UI.
- **Backend Architecture (DDD):** Memigrasikan arsitektur backend menjadi standar Domain-Driven Design (DDD) secara ketat (`domain`, `delivery`, `usecase`, `repository`).
- **API Integration:** Memperbarui semua komponen frontend (`Admin`, `Dashboard`, `PlayGame`, dll.) agar langsung terhubung dengan endpoint API DDD yang baru.
- **Gameplay Flow:** Mengubah alur _Kiosk_ agar melakukan _auto-register_ _device_ ke `/api/devices` di awal, dan _submit_ skor ke `/api/games` di akhir permainan.
- **Event Polling:** Mengoptimalkan tampilan _Leaderboard_ dengan mekanisme _HTTP polling_ (setiap 5 detik) untuk menarik sinkronisasi data yang mulus.
- **Workspace Config:** Memperbarui `jsconfig.json` pada client untuk pemetaan _language server_ yang lebih baik dan menghapus konfigurasi usang.
- **Test Suite:** Memperbarui seluruh URL _mocking HTTP request_ pada unit test dari `/api/...` menjadi `/api/v1/...` dan meng-generate ulang Mocks.
- **Event Filtering:** Menerapkan _multi-tenancy_ di frontend di mana Admin Pelaksana (Organizer) hanya akan melihat daftar Event yang dibuatnya sendiri.
- **Event Ownership:** Mengubah proses pembuatan Event agar kepemilikannya (`organizer_id`) terikat secara dinamis kepada Admin yang sedang login (bukan lagi _hardcoded_ ID 1).

### Fixed

- **UI Bug:** Memperbaiki syntax error React JSX pada implementasi form UI Admin.
- **Sidebar Routing:** Menyelesaikan konflik _highlighting_ tombol _active_ antara menu `/dashboard` dan `/dashboard/users` di sidebar Admin.
- **Leaderboard API Routing:** Meluruskan endpoint routing Leaderboard yang sebelumnya salah sasaran sehingga memicu error 404 (Not Found).

### Security

- **Data Privacy (Leaderboard):** Membersihkan tampilan layar proyektor publik dari informasi sensitif dengan menghapus visibilitas `uid` peserta.
- **Data Privacy (Admin Portal):** Mengembangkan dan menerapkan komponen _toggle_ `SecretText` (simbol Mata) di Admin Portal untuk menyembunyikan ID Perangkat (UUID) dan UID Peserta secara _default_, demi mencegah insiden pencurian data secara visual (_shoulder-surfing_).