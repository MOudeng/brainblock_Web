# Arsitektur Backend (Backend Architecture)

Sistem *Backend* untuk manajemen event BRAINBLOCK Block Design ini dirancang menggunakan pendekatan **Standard Library First + Micro-libraries** guna memastikan performa tinggi, perawatan kode yang mudah (*maintainable*), dan keamanan *type-safe* standar industri.

## 1. Tumpukan Teknologi (Tech Stack)

Berbeda dengan proyek *prototipe* yang sering menggunakan framework berat (seperti Gin atau GORM), proyek ini akan menggunakan *micro-libraries* yang lebih dekat dengan pustaka standar bawaan Go:

- **Router / HTTP Mux**: `go-chi/chi`
  - Sangat ringan, cepat, dan 100% kompatibel dengan `net/http` bawaan Golang.
- **Akses Database**: `sqlc`
  - Menulis kueri SQL murni di file `.sql`, lalu meng-generate kode Go yang sangat cepat dan terhindar dari potensi error ORM (*Type-safe SQL query generation*).
- **Database Migration**: `pressly/goose`
  - Migrasi skema (tabel) berbasis file SQL murni, sehingga riwayat perubahan database tercatat rapi layaknya git.
- **Validasi Data**: `go-playground/validator`
  - Melakukan validasi *struct* JSON payload yang kuat via *tags*.

## 2. Struktur Proyek (Domain-Driven / Clean Architecture)

Struktur folder akan dikelompokkan berdasarkan **Domain** (fitur/modul), bukan berdasarkan lapisan teknikal (*horizontal slicing*). Hal ini bertujuan agar sistem **sangat mudah di-test (Testability)** karena tingginya tingkat isolasi antar domain (menggunakan *Interface* dan *Dependency Injection*).

```text
brainblock-backend/
├── cmd/
│   └── api/             # Entry point aplikasi (main.go, inisialisasi DB, menyatukan seluruh dependensi)
├── internal/
│   ├── config/          # Pemuat konfigurasi (env)
│   ├── domain/          # Menyimpan definisi Entitas inti dan Interface (Port) secara global
│   ├── event/           # Modul / Domain "Event"
│   │   ├── delivery/    # HTTP Handler Chi khusus event
│   │   ├── usecase/     # Logika bisnis (Business Rules) spesifik event
│   │   └── repository/  # Implementasi database spesifik event (SQLC Postgres)
│   └── auth/            # Modul / Domain "Auth" (struktur sama: delivery, usecase, repository)
├── db/
│   ├── migrations/      # File-file .sql untuk Goose (CREATE TABLE PostgreSQL)
│   └── queries/         # File-file .sql untuk SQLC (SELECT, INSERT, dll)
└── sqlc.yaml            # Konfigurasi generator SQLC (Engine: PostgreSQL)
```

## 3. Alur Komunikasi Kode (Layering & Dependency Injection)

Berkat *Domain-Driven* dan *Clean Architecture*, alur dan pengujian *(testing)* menjadi sangat terstruktur:

1. **Client (Frontend)** mengirimkan HTTP Request.
2. Request ditangkap oleh **Chi Router** di dalam `delivery` (misal: `internal/event/delivery/http_handler.go`).
3. **Delivery/Handler** menggunakan `go-playground/validator` untuk memvalidasi JSON. Jika valid, diteruskan ke **Usecase**.
4. **Usecase** (`internal/event/usecase`) menjalankan murni *logika bisnis*. Lapisan ini tidak tahu menahu soal HTTP atau SQL. Usecase di-test menggunakan *Mocks* (mudah di-*unit test*).
5. **Usecase** memanggil **Repository** (`internal/event/repository`) via *Interface*.
6. **Repository** ini adalah kode hasil *generate* otomatis dari **SQLC (PostgreSQL)** yang mengeksekusi kueri ke *database* secara aman dan cepat.
7. Data dikembalikan melewati alur yang sama menuju *Client*.
