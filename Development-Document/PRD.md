# PRD — Sistem Manajemen Bimbel "TikaTrack"

**Untuk:** Bimbel Tiki Taka
**Versi:** 1.0
**Tanggal:** 28 Agustus 2026

---

## 0. Nama Sistem

**Nama terpilih: `TikaTrack`**
*(Tiki Taka + Track — menekankan fitur inti: melacak jadwal, absensi, dan progres belajar tiap anak)*

Alternatif lain jika ingin diganti:
- **TikaFlow** — menekankan alur kerja guru (jadwal → absensi → laporan)
- **Tiki Taka Hub** — lebih generik, terasa seperti portal pusat data

Dokumen ini selanjutnya memakai nama **TikaTrack**.

---

## 1. Latar Belakang & Tujuan

Bimbel Tiki Taka saat ini mengelola jadwal, absensi, dan laporan belajar murid secara manual (kertas + WA manual). Dengan makin banyak murid dan guru, proses ini rawan salah, sulit dilacak, dan laporan ke wali murid memakan waktu.

**Tujuan TikaTrack:**
1. Satu sistem terpusat untuk 4 pengguna (admin/owner + guru) dengan hak akses masing-masing.
2. Jadwal & absensi harian per murid per guru, termasuk mekanisme kelas pengganti.
3. Data anak & wali (termasuk nomor WA) tersimpan rapi dan bisa dipakai kirim laporan langsung.
4. Learning path per mata pelajaran per anak, dengan ringkasan agar guru tidak perlu buka-tutup tiap mapel.
5. Laporan belajar mingguan/bulanan yang bisa diinput di sistem lalu dikirim langsung ke WA wali.
6. Rekap & analitik progres per minggu/bulan tersimpan rapi baik di web maupun di Google Sheets.

---

## 2. Tech Stack & Arsitektur

| Layer | Pilihan | Alasan |
|---|---|---|
| Frontend | **React + TypeScript** (Vite), React Router, TanStack Query | sesuai request client |
| Backend/API | **Google Apps Script (Web App)** terhubung ke Google Sheets | tidak perlu server terpisah, bisa langsung baca/tulis Sheets, dan bisa kirim email lewat `GmailApp`/`MailApp` (untuk fitur lupa password) tanpa setup SMTP |
| Database | **Google Sheets** (1 Spreadsheet, multi-sheet/tab sebagai "tabel") | sesuai request client, gratis, mudah diaudit manual oleh owner |
| Autentikasi | Custom login (email + password) → password di-hash (bcrypt via Apps Script library atau hash di client + salt), token session (JWT sederhana atau session token disimpan di sheet `Sessions`) | 4 akun tetap, tidak perlu OAuth kompleks |
| Reset password | Generate token → simpan di sheet `PasswordResets` → kirim link reset via **GmailApp** dari akun Google bimbel | sesuai request "kirim ke gmail masing-masing" |
| Kirim laporan | `wa.me/<no_wali>?text=<pesan>` dibuka di tab baru, isi pesan sudah ter-generate dari data laporan | sesuai request, tanpa perlu WhatsApp Business API berbayar |
| Hosting | Vercel/Netlify untuk frontend, Apps Script auto-hosted sebagai backend | murah/gratis |

**Alur data:**
```
React (TS) SPA  <-- REST-ish JSON via fetch -->  Google Apps Script Web App  <-->  Google Sheets (DB)
                                                        |
                                                        +--> GmailApp (reset password email)
```

> Catatan: karena Google Sheets bukan database relasional sungguhan, semua "relasi" dilakukan lewat kolom ID (mis. `student_id`) yang dicocokkan di frontend/backend. Struktur detail ada di `DATABASE_SCHEMA.md`.

---

## 3. Peran Pengguna (Roles)

Total 4 akun pengguna. Diusulkan 2 peran:

| Role | Contoh | Akses |
|---|---|---|
| **Owner/Admin** | pemilik bimbel / koordinator | Akses penuh: semua siswa, semua guru, semua laporan, kelola akun guru, lihat analitik semua guru |
| **Guru** | Miss Aura, dst. | Hanya melihat/mengelola siswa yang diampu: absensi, learning path, input & kirim laporan, jadwal miliknya sendiri |

Admin bisa membuat/menonaktifkan akun guru (CRUD akun) dari menu **Pengaturan → Kelola Akun**.

---

## 4. Daftar Fitur

### 4.1 Autentikasi & Akun
- Login (email + password)
- Lupa password → input email → sistem generate token reset → email dikirim via Gmail bimbel → user klik link → set password baru (token expired 1 jam)
- Logout, session timeout
- CRUD akun guru (khusus Admin)

### 4.2 Manajemen Data Siswa
- CRUD data siswa: nama, nama panggilan, tanggal lahir, tanggal bergabung, status aktif/nonaktif, foto (opsional), catatan umum
- CRUD data wali murid per siswa (maksimal 2 wali): nama, hubungan (ayah/ibu/wali), **nomor WA**, email (opsional), tandai wali utama (yang menerima laporan)
- Pencarian & filter siswa (per guru, per mapel, per status)

### 4.3 Manajemen Guru
- CRUD data guru: nama, email, no. HP, mapel yang diampu, status aktif

### 4.4 Mapel & Learning Path
- Master data mata pelajaran (mis. Bahasa Inggris, JPA Penjumlahan, Calistung, dll.)
- Setiap siswa bisa punya **beberapa mapel sekaligus**, masing-masing dengan guru pengampu, materi terakhir, dan materi selanjutnya (learning path)
- **Halaman ringkasan learning path per siswa**: satu tabel yang menampilkan semua mapel siswa tsb sekaligus (mapel | guru | materi terakhir | materi selanjutnya | status) — tanpa perlu buka-tutup satu-satu
- Log riwayat materi per mapel (timeline: tanggal, topik, status selesai/berjalan) untuk jadi bahan laporan otomatis (capaian belajar bisa ditarik dari log ini)

### 4.5 Jadwal
- Jadwal mingguan per siswa per mapel per guru (hari + jam)
- Tampilan kalender mingguan per guru dan per siswa
- CRUD jadwal (tambah/edit/nonaktifkan)

### 4.6 Absensi Harian & Kelas Pengganti
- Absensi harian dicatat **per guru, per siswa, per mapel** (karena satu siswa bisa punya guru berbeda untuk mapel berbeda, jadwal & absensi terpisah per mapel)
- Status kehadiran: Hadir / Izin / Sakit / Alpa
- Jika siswa tidak masuk pada jadwal reguler → sistem menandai kelas tsb butuh **kelas pengganti**
- Kelas pengganti bisa dijadwalkan ulang (tanggal & jam baru) dan **durasinya bisa disesuaikan** (mis. ditambah 1 jam atau berapa jam sesuai kesepakatan)
- Riwayat kelas pengganti per siswa (terjadwal/selesai/batal)

### 4.7 Laporan Belajar (Mingguan/Bulanan)
- Form input laporan per siswa per mapel, meniru format existing:
  - Nama murid, program/mapel, guru pembimbing, periode (minggu ke-X s.d ke-Y bulan tahun)
  - **Capaian Belajar** (list poin, bisa ditarik otomatis dari log learning path lalu diedit)
  - **Harapan Progres Selanjutnya** (list poin)
  - **Notes** — **opsional**
- Preview pesan WA sebelum kirim (format meniru contoh laporan yang sudah ada, termasuk emoji 🥰)
- Tombol **Kirim ke WA Wali** → generate link `wa.me/<no_wali>?text=<pesan_encoded>` → buka tab/aplikasi WA
- Status laporan: Draft / Terkirim, tanggal & wali tujuan tercatat
- Riwayat semua laporan per siswa, bisa difilter per periode/mapel

### 4.8 Dashboard & Analitik Mingguan/Bulanan
- Dashboard utama: ringkasan hari ini (jadwal hari ini, absensi yang belum diisi, kelas pengganti yang perlu dijadwalkan, laporan yang belum dikirim minggu ini)
- Analitik per siswa: grafik kehadiran, jumlah kelas pengganti, status laporan per minggu/bulan (mirip grafik "Performance" & "Activity" pada referensi desain)
- Rekap per minggu/bulan **disimpan sebagai snapshot** di sheet `WeeklySummary` agar data historis rapi dan tidak berubah walau data mentah terus bertambah
- Filter analitik per guru (untuk admin) atau otomatis hanya data sendiri (untuk guru)

### 4.9 Notifikasi Internal (opsional, fase 2)
- Reminder di dashboard untuk laporan yang jatuh tempo minggu ke-2 & ke-4 tiap bulan (sesuai pola di contoh catatan tangan: laporan dikirim tiap 2 minggu)

---

## 5. Alur Utama (User Flow)

### 5.1 Alur Login & Lupa Password
```
[Login Page] --email+password--> [Cek ke Sheet Users]
     |--- benar ---> [Dashboard sesuai role]
     |--- salah ---> [Pesan error]

[Lupa Password] --email--> [Generate token, simpan di PasswordResets]
     --> [GmailApp kirim email berisi link reset]
     --> [User buka link] --> [Form password baru] --> [Update Users, token invalid]
```

### 5.2 Alur Absensi Harian + Kelas Pengganti
```
Guru buka [Absensi Hari Ini] (auto-filter jadwal miliknya hari itu)
  --> pilih siswa --> pilih status: Hadir/Izin/Sakit/Alpa
  --> jika bukan Hadir --> sistem tandai "perlu kelas pengganti"
        --> Guru/Admin buka [Kelas Pengganti] --> input tanggal, jam, durasi baru
        --> simpan --> tercatat di riwayat siswa
```

### 5.3 Alur Laporan ke Wali
```
Guru buka [Detail Siswa] --> tab [Laporan]
  --> klik "Buat Laporan Baru" --> pilih mapel & periode
  --> sistem tarik draft capaian dari Log Learning Path (bisa diedit)
  --> isi "Harapan Progres Selanjutnya"
  --> Notes (opsional)
  --> Preview pesan (format sama seperti contoh)
  --> klik "Kirim ke WA [Nama Wali]" --> buka wa.me link
  --> status laporan otomatis "Terkirim"
```

### 5.4 Alur Learning Path Ringkasan
```
[Detail Siswa] --> tab [Learning Path]
  --> tabel semua mapel siswa: Mapel | Guru | Materi Terakhir | Materi Selanjutnya | Update terakhir
  --> klik salah satu baris --> expand detail log riwayat mapel tsb (tanpa pindah halaman)
```

---

## 6. Struktur Halaman (Sitemap)

```
/login
/forgot-password
/reset-password/:token
/dashboard
/siswa                      -> daftar siswa
/siswa/:id                  -> detail siswa (profil, jadwal, absensi, learning path, laporan) — lihat DESIGN.md
/guru                       -> daftar guru (admin only)
/guru/:id                   -> detail guru
/jadwal                     -> kalender jadwal
/absensi                    -> absensi harian (default: hari ini)
/kelas-pengganti             -> daftar & kelola kelas pengganti
/mapel                      -> master data mapel (admin only)
/laporan                    -> riwayat semua laporan + buat baru
/analitik                   -> analitik mingguan/bulanan
/pengaturan/akun            -> kelola akun (admin only)
```

---

## 7. Non-Functional Requirements

- **Responsif**: web bisa dibuka dari HP guru saat di kelas (mobile-first untuk halaman Absensi & Laporan).
- **Keamanan**: password di-hash, token reset kadaluarsa 1 jam & sekali pakai, guru hanya bisa lihat data siswa yang diampunya (enforced di backend Apps Script, bukan hanya di UI).
- **Performa**: data Sheets di-cache di frontend (React Query) agar tidak selalu fetch ulang; refresh manual/interval.
- **Auditability**: setiap perubahan penting (absensi, laporan terkirim) mencatat `created_by` & `timestamp` agar bisa ditelusuri di Sheets langsung oleh owner.
- **Bahasa**: UI berbahasa Indonesia.

---

## 8. Referensi Format Laporan (dipakai sebagai template pesan WA)

```
Selamat siang, Bunda🥰
Kami ingin melaporkan hasil belajar Ananda {nama_murid}

Laporan Hasil Belajar Bimbel Tiki Taka
{periode}
Program: {mapel}
Nama Murid: {nama_murid}
Guru Pembimbing: {nama_guru}

Capaian Belajar:
{list capaian, "- " per baris}

Harapan Progres Selanjutnya:
{list harapan, "- " per baris}

Notes:
{catatan, hanya muncul jika diisi}

{kalimat penutup semangat}🥰
```

## 9. Roadmap Bertahap

| Fase | Fokus |
|---|---|
| Fase 1 (MVP) | Auth, CRUD siswa/wali/guru/mapel, jadwal, absensi + kelas pengganti |
| Fase 2 | Learning path + ringkasan, laporan + kirim WA |
| Fase 3 | Dashboard analitik mingguan/bulanan + snapshot ke Sheets |
| Fase 4 | Reminder laporan jatuh tempo, export rekap ke PDF (opsional) |
