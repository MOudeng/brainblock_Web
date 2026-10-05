# Perencanaan Proses Bisnis: BRAINBLOCK Block Design

Berdasarkan diagram alur (flowchart) yang diberikan, berikut adalah penjabaran lengkap dari proses bisnis sistem yang baru:

## 1. Aktor & Hak Akses (Roles)
- **Admin Platform (Super Admin)**: Memiliki hak akses tertinggi. Bertugas mendaftarkan/membuat akun untuk Admin Pelaksana, membuat Event, serta mendaftarkan Peserta.
- **Admin Pelaksana (Organizer)**: Admin tingkat lapangan/acara. Bertugas membuat Event dan mendaftarkan Peserta untuk event yang dikelolanya.
- **Peserta (Participant)**: Pemain yang didaftarkan oleh admin khusus untuk sebuah **Event tertentu**. Mereka bermain di perangkat yang telah disediakan di lokasi secara bergiliran.

## 2. Entitas Utama
- **Event**: Acara kompetisi/permainan. Memiliki atribut:
  - Nama Event
  - Tanggal
  - Tempat
  - Penyelenggara (Terkait dengan Admin Pelaksana)
  - Jumlah Perangkat (*Device Count*)
  - **Status Leaderboard**: *Public* atau *Private* (dilengkapi dengan *Password*).
- **Leaderboard**: Papan peringkat sebuah Event. Jika berstatus **Private**, leaderboard tidak akan muncul di daftar publik dan pengunjung wajib memasukkan ID Event beserta *Password* untuk mengaksesnya.
- **Perangkat (Device)**: Stasiun/laptop bermain (misal: Perangkat 1, Perangkat 2) yang tergabung dalam suatu event. **Setiap perangkat memiliki ID unik**. Satu perangkat melayani antrean banyak peserta.
- **Progress Bermain (Game Session)**: Rekam jejak hasil permainan seorang peserta. Menyimpan data: **Skor, Level, Waktu Mulai, Waktu Selesai, ID Perangkat, dan ID Event**.

## 3. Alur Sistem (System Flow)
1. **Fase Persiapan (Setup)**:
   - Admin Platform mendaftarkan Admin Pelaksana.
   - Admin Platform atau Admin Pelaksana membuat sebuah **Event** dan mengatur detailnya.
   - Admin mendaftarkan **Peserta** dan **mengaitkan mereka secara spesifik ke Event tersebut**.
   - Admin mendaftarkan **Perangkat** ke dalam sistem dan mendapatkan **ID Perangkat**.
   - Di lapangan, staf akan melakukan setup UI dengan memasukkan **ID Perangkat** tersebut ke halaman browser. Jika valid, layar akan terkunci masuk ke mode *Kiosk* khusus untuk melayani peserta di perangkat tersebut.
2. **Fase Pelaksanaan (Execution - "Sebuah Event")**:
   - Di lokasi acara, para peserta mengantre di depan Perangkat yang disediakan (misal: 10 orang antre di Perangkat 1).
   - Melalui antarmuka (UI) di Perangkat tersebut, giliran peserta yang maju harus **menginputkan (mengetik/scan) ID Peserta mereka**. Hal ini sebagai bentuk validasi agar peserta tidak bisa asal memilih nama dan bermain menggunakan identitas orang lain.
   - Setelah ID/Nama dipilih, peserta tersebut memainkan game Block Design. Setelah selesai, giliran peserta selanjutnya melakukan hal yang sama (bermain satu per satu).
3. **Fase Penyelesaian & Klasemen (Completion & Leaderboard)**:
   - Ketika game di sebuah perangkat mencapai kondisi **"Selesai?"**.
   - Sistem akan melakukan **Simpan Progress**. Data yang disimpan meliputi: `[skor, level, waktu selesai, waktu mulai, id perangkat, id event]`.
   - Sistem langsung melakukan **Update Leaderboard Realtime** sehingga klasemen pada layar utama (Leaderboard Event) otomatis terbarui berdasarkan skor dan waktu terbaru.

---
*Dokumen ini akan menjadi landasan untuk merombak arsitektur Database (Backend) dan alur layar (Frontend).*
