# 🌿 Panduan Lengkap GitFlow

Dokumen ini menjelaskan standardisasi *branching* (percabangan) yang digunakan oleh seluruh tim developer di proyek **Brainblock**. Kita menggunakan strategi **GitFlow**.

---

## 🧐 Apa Itu GitFlow?
GitFlow adalah sebuah model percabangan (branching strategy) terstruktur yang memisahkan kode produksi yang stabil dari kode eksperimental/fitur yang sedang dikembangkan. Dengan GitFlow, pengerjaan fitur secara paralel antar developer menjadi sangat rapi dan bebas konflik.

### Mengapa Kita Menggunakannya?
1. **Stabilitas Terjamin:** Ada satu branch khusus (`main`) yang isinya HANYA kode siap rilis tanpa *bug*.
2. **Kolaborasi Aman:** Setiap orang bekerja di "kamar" (branch) masing-masing tanpa mengganggu kode utama.
3. **Penanganan Darurat:** Mudah memperbaiki *bug* kritis di server production secara langsung (via `hotfix`) tanpa membawa fitur setengah matang yang sedang dikerjakan.

---

## 🌳 Struktur Branch di Proyek Kita

Repositori ini memiliki dua jenis branch utama:

### 1. Branch Jangka Panjang (Tidak Boleh Dihapus)
- **`main`**: Branch tersuci. Isi branch ini adalah kode yang saat ini *running* di server Production pengguna. Hanya menerima *merge* dari `release` atau `hotfix`.
- **`develop`**: Branch "laboratorium". Berisi gabungan dari semua fitur-fitur baru yang sudah selesai dikerjakan developer. Branch ini yang akan di-deploy ke server Development/Staging.

### 2. Branch Pendukung (Akan Dihapus Setelah Selesai)
- **`feature/<nama-fitur>`**: Dibuat dari `develop`. Digunakan saat Anda membuat fitur baru (misal: `feature/login`, `feature/payment`). Akan di-merge kembali ke `develop`.
- **`release/v<versi>`**: Dibuat dari `develop`. Digunakan untuk tahap UAT (User Acceptance Testing) dan *bug-fixing* akhir sebelum dirilis ke `main`.
- **`hotfix/<nama-bug>`**: Dibuat langsung dari `main`. Digunakan HANYA untuk memperbaiki *bug* darurat di production.

---

## 🛠️ Cara Install Library `git-flow`

Untuk mempermudah penggunaan tanpa perlu mengingat perintah *merge* yang rumit, kita menggunakan *extension* CLI `git-flow` (AVH Edition).

### 🐧 Linux (Ubuntu / Debian / Mint)
```bash
sudo apt update
sudo apt install git-flow
```

### 🍎 macOS
```bash
brew install git-flow-avh
```

### 🪟 Windows (Git Bash)
Pengguna Windows biasanya sudah memiliki `git-flow` terinstal secara otomatis jika menginstall Git for Windows. Jika belum:
1. Buka Git Bash
2. Ketik `git flow version`. Jika belum ada, Anda bisa [mengikuti panduan ini](https://github.com/petervanderdoes/gitflow-avh/wiki/Installation).

---

## 🚀 Cara Menggunakannya Sehari-hari

### 0. Inisialisasi Repositori
Setiap kali Anda men-clone repo Brainblock di komputer baru, Anda WAJIB menginisialisasi git-flow.
```bash
git flow init
```
*(Tekan **Enter** terus-menerus untuk menerima semua konfigurasi nama default).*

---

### 1. Membuat Fitur Baru (Daily Routine)
Saat Anda ditugaskan membuat fitur baru, JANGAN membuat branch secara manual. Gunakan:
```bash
git flow feature start <nama-fitur>
# Contoh: git flow feature start payment-gateway
```
*Efek: Anda akan otomatis dibuatkan branch `feature/payment-gateway` (berasal dari `develop`) dan otomatis berpindah ke sana.*

Lalu, silakan *ngoding* seperti biasa:
```bash
git add .
git commit -m "feat: menambah integrasi midtrans"
```

---

### 2. Menyelesaikan Fitur
Jika fitur sudah selesai dan siap digabungkan, JANGAN melakukan `git merge` manual. Gunakan:
```bash
git flow feature finish <nama-fitur>
# Contoh: git flow feature finish payment-gateway
```
*Efek: Kode Anda akan di-merge ke `develop`, branch `feature/payment-gateway` akan dihapus, dan Anda akan dikembalikan ke branch `develop`.*

Tinggal *push* ke server!
```bash
git push origin develop
```

---

### 3. Memperbaiki Bug Darurat di Production
Jika ada laporan error di Production (branch `main`), Anda harus memakai `hotfix`.
```bash
git flow hotfix start <nama-bug>
# Contoh: git flow hotfix start login-crash
```
*Ngoding perbaikan bug...*
```bash
git commit -m "fix: memperbaiki null pointer di login"
git flow hotfix finish <nama-bug>
```
*Efek: Bug ini akan otomatis di-merge ke `main` DAN ke `develop` secara bersamaan, lalu Anda diminta memberi nama/pesan Tag versi barunya.*

Selamat mencoba! Selalu gunakan perintah `git flow` ini agar siklus pengembangan Brainblock tetap standar dan stabil.
