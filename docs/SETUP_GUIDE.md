# Panduan Integrasi Database Google Sheets & Apps Script

Dokumen ini memandu Anda melakukan setup database Google Sheets dan mendeploy backend Google Apps Script untuk menghubungkan frontend **TikaTrack** ke spreadsheet Anda.

---

## Langkah 1: Setup Google Spreadsheet Database

1. Buka [Google Sheets](https://sheets.new) untuk membuat Spreadsheet baru.
2. Beri nama spreadsheet Anda, misalnya: `TikaTrack_DB`.
3. Buat **13 Sheet (Tab)** dengan nama persis seperti di bawah ini, lalu isi baris pertama (Header) untuk tiap sheet:

### 1. Tab `Users`
Header kolom (Baris 1):
`user_id` | `name` | `email` | `password_hash` | `role` | `phone` | `status` | `created_at`

### 2. Tab `Students`
Header kolom (Baris 1):
`student_id` | `name` | `nickname` | `birthdate` | `join_date` | `status` | `photo_url` | `notes`

### 3. Tab `Guardians`
Header kolom (Baris 1):
`guardian_id` | `student_id` | `name` | `relation` | `wa_number` | `email` | `is_primary`

### 4. Tab `Subjects`
Header kolom (Baris 1):
`subject_id` | `subject_name` | `category`

### 5. Tab `StudentSubjects`
Header kolom (Baris 1):
`student_subject_id` | `student_id` | `subject_id` | `teacher_id` | `start_date` | `status` | `current_topic` | `next_topic` | `last_updated`

### 6. Tab `LearningPathLog`
Header kolom (Baris 1):
`log_id` | `student_subject_id` | `date` | `topic` | `topic_status` | `notes` | `created_by`

### 7. Tab `Schedule`
Header kolom (Baris 1):
`schedule_id` | `student_subject_id` | `day_of_week` | `start_time` | `end_time` | `status`

### 8. Tab `Attendance`
Header kolom (Baris 1):
`attendance_id` | `schedule_id` | `student_subject_id` | `date` | `status` | `is_makeup_session` | `makeup_id` | `topic_covered` | `notes` | `recorded_by` | `created_at`

### 9. Tab `MakeupClasses`
Header kolom (Baris 1):
`makeup_id` | `original_attendance_id` | `student_subject_id` | `original_date` | `makeup_date` | `makeup_start_time` | `duration_hours` | `status` | `notes` | `created_by`

### 10. Tab `Reports`
Header kolom (Baris 1):
`report_id` | `student_id` | `student_subject_id` | `period_type` | `period_label` | `achievements` | `next_progress` | `notes` | `teacher_id` | `guardian_id` | `status` | `sent_at` | `message_sent` | `created_at`

### 11. Tab `WeeklySummary`
Header kolom (Baris 1):
`summary_id` | `student_id` | `period_type` | `period_label` | `total_sessions` | `attended` | `izin_sakit` | `alpa` | `makeup_scheduled` | `makeup_completed` | `reports_sent` | `generated_at`

### 12. Tab `PasswordResets`
Header kolom (Baris 1):
`token` | `user_id` | `expires_at` | `used` | `created_at`

### 13. Tab `AuditLog`
Header kolom (Baris 1):
`log_id` | `user_id` | `action` | `target_id` | `detail` | `timestamp`

---

## Langkah 2: Inisialisasi Database (Setup Otomatis)

Untuk mempermudah setup, backend Apps Script telah dilengkapi dengan fungsi inisialisasi otomatis:

1. Di Google Sheets Anda, klik menu **Extensions (Ekstensi) > Apps Script**.
2. Di toolbar bagian atas editor, klik dropdown pilihan fungsi dan pilih **`setupDatabase`**.
3. Klik tombol **Run (Jalankan)** di sebelah kiri.
4. Skrip secara otomatis akan membuat seluruh 13 sheet tab, mengatur struktur header kolom, serta mendaftarkan akun administrator pertama:
   * **Email/Username**: `marifirfannn@gmail.com`
   * **Password**: `admin123`
   * **Role**: `admin`

---

## Langkah 3: Deploy Backend Google Apps Script

1. Di Google Sheets Anda, klik menu **Extensions (Ekstensi) > Apps Script**.
2. Hapus kode default `function myFunction() {}` pada editor.
3. Buka file [Code.gs](file:///f:/1.PROJECT/TikiTakaHub/apps-script/Code.gs) di folder proyek Anda. Salin seluruh isi kodenya dan tempel ke dalam editor Apps Script.
4. Salin **ID Spreadsheet** Anda dari URL browser spreadsheet Anda. 
   *(Contoh URL: `https://docs.google.com/spreadsheets/d/1A2B3C4D5E/edit` -> ID-nya adalah `1A2B3C4D5E`)*.
5. Pada baris ke-9 editor Apps Script, ganti `'YOUR_SPREADSHEET_ID_HERE'` dengan ID spreadsheet Anda.
6. Simpan proyek dengan menekan tombol ikon Disket.
7. Di kanan atas halaman Apps Script, klik tombol **Deploy > New Deployment (Penerapan baru)**.
8. Klik ikon roda gigi di sebelah "Select type", pilih **Web App (Aplikasi Web)**.
9. Konfigurasikan:
   * **Description**: `TikaTrack API v1`
   * **Execute as**: `Me (email Anda)`
   * **Who has access**: `Anyone (Siapa saja)`
10. Klik **Deploy**. Google akan meminta otorisasi akses. Setujui dan berikan izin akses ke Akun Google Anda.
11. Salin **Web App URL** yang dihasilkan di akhir deployment. URL ini berakhiran `/exec`.

---

## Langkah 4: Hubungkan Frontend React

1. Buka file `.env` di direktori utama frontend proyek Anda.
2. Ganti nilai `VITE_APPS_SCRIPT_URL` dengan **Web App URL** yang Anda salin dari langkah 3.
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzxxxxxx/exec
   ```
3. Restart development server Anda dengan:
   ```bash
   npm run dev
   ```
4. Buka browser Anda di `http://localhost:3000`. Login dengan email `marifirfannn@gmail.com` dan kata sandi `admin123`.

---

## Troubleshooting & Tips
* **CORS Error**: Pastikan deployment Apps Script dikonfigurasi dengan akses "Anyone". Jika Anda melakukan update kode di Apps Script, lakukan redeploy dengan memilih **Manage Deployments > Edit > Select Version: New Version** untuk memastikan perubahan langsung aktif di URL endpoint.
* **Hash Password Custom**: Untuk membuat password kustom selain `admin123` secara manual di Sheets, Anda dapat menggunakan fungsi `hashPassword("sandiAnda")` dari menu Apps Script Editor dengan membuat fungsi penolong sementara, lalu jalankan fungsi tersebut untuk mendapatkan string hash output.
