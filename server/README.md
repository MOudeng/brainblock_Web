# BRAINBLOCK (Brainblock) - Backend

Backend API untuk aplikasi BRAINBLOCK, dibangun menggunakan arsitektur **Domain-Driven Design (DDD)** dengan **Go (Golang)**, **PostgreSQL**, dan **Chi Router**.

## 🛠 Prasyarat Sistem (Ubuntu / Linux Mint)

Pastikan mesin Anda sudah meng-install _dependencies_ berikut sebelum memulai _development_:

1. **Go (Minimal v1.21)**

    ```bash
    sudo apt update
    wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
    sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
    echo "export PATH=\$PATH:/usr/local/go/bin:~/go/bin" >> ~/.bashrc
    source ~/.bashrc
    ```

2. **Docker & Docker Compose** (Untuk Database Lokal)

    ```bash
    sudo apt install docker.io docker-compose -y
    sudo usermod -aG docker \$USER
    ```

    _(Catatan: Anda mungkin perlu logout & login kembali agar grup docker aktif)_

3. **Make** (Untuk menjalankan skrip Makefile)
    ```bash
    sudo apt install make -y
    ```

## 🚀 Panduan Setup Development

Ikuti langkah-langkah di bawah ini untuk menjalankan server di komputer lokal Anda:

### 1. Konfigurasi Environment

Salin file konfigurasi _environment_ bawaan:

```bash
cp .env.example .env
```

_(Sesuaikan isi `.env` jika Anda menggunakan kredensial database yang berbeda)_

### 2. Install Tools Tambahan

Jalankan perintah ini untuk mengunduh modul Go dan tool CLI seperti `goose` (untuk migrasi), `sqlc` (untuk query database), dan `air` (untuk live-reload):

```bash
make install
```

### 3. Jalankan Database (PostgreSQL)

Nyalakan _container_ database PostgreSQL menggunakan Docker:

```bash
make docker-up
make podman-up
```

### 4. Jalankan Migrasi Database

Buat struktur tabel di database Anda dengan perintah migrasi berikut:

```bash
make migrate-up
```

### 5. Jalankan Server (Live Reload)

Nyalakan server development. Server akan otomatis melakukan _restart_ setiap kali Anda menyimpan perubahan kode (_live-reload_):

```bash
make run
```

Server akan berjalan di `http://localhost:8080`.

---

## 📚 Kumpulan Perintah Makefile (Cheatsheet)

| Perintah                | Deskripsi                                                                   |
| ----------------------- | --------------------------------------------------------------------------- |
| `make install`          | Install Go tools pendukung (`air`, `goose`, `sqlc`) dan download modul.     |
| `make docker-up`        | Menyalakan container database via Docker Compose di _background_.           |
| `make docker-down`      | Mematikan container database.                                               |
| `make migrate-up`       | Menjalankan migrasi database naik ke versi terbaru.                         |
| `make migrate-down`     | Membatalkan migrasi database satu langkah ke belakang.                      |
| `make migrate-status`   | Mengecek status migrasi database saat ini.                                  |
| `make create-migration` | Membuat file migrasi SQL baru secara interaktif.                            |
| `make sqlc`             | Meng-generate ulang kode repository Go dari query SQL.                      |
| `make run`              | Menjalankan server menggunakan `air` (otomatis restart saat ada perubahan). |

## 🏗 Struktur Proyek (Domain-Driven Design)

- `cmd/api` : Titik masuk (_entry point_) aplikasi.
- `db/migrations` : Menyimpan file-file SQL migrasi database.
- `internal/domain` : Mendefinisikan antarmuka (_interface_), model, dan struktur inti aplikasi.
- `internal/<module>/delivery` : Handler HTTP/REST API untuk setiap modul (cth: `auth`, `event`, `participant`).
- `internal/<module>/usecase` : Logika bisnis utama aplikasi.
- `internal/<module>/repository` : Akses basis data langsung (biasanya dihasilkan secara otomatis oleh `sqlc`).
