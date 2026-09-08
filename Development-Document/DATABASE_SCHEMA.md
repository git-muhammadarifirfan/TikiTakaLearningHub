# DATABASE SCHEMA — Google Sheets untuk TikaTrack

Satu **Google Spreadsheet** = 1 database. Setiap **tab/sheet** = 1 "tabel". Baris pertama tiap sheet = header (nama kolom), jangan diubah manual. ID dibuat otomatis oleh Apps Script (format disarankan di bawah tiap sheet).

Nama Spreadsheet disarankan: `TikaTrack_DB`

---

## Daftar Sheet (Tab)

1. `Users`
2. `Students`
3. `Guardians`
4. `Subjects`
5. `StudentSubjects`
6. `LearningPathLog`
7. `Schedule`
8. `Attendance`
9. `MakeupClasses`
10. `Reports`
11. `WeeklySummary`
12. `PasswordResets`
13. `AuditLog`

---

### 1. `Users` — akun login (4 orang)
| Kolom | Tipe | Keterangan |
|---|---|---|
| user_id | string | `U-001`, `U-002`, ... |
| name | string | nama lengkap |
| email | string | login & tujuan reset password |
| password_hash | string | hasil hash, jangan simpan plain text |
| role | enum | `admin` / `guru` |
| phone | string | opsional |
| status | enum | `aktif` / `nonaktif` |
| created_at | datetime | ISO string |

### 2. `Students` — data anak
| Kolom | Tipe | Keterangan |
|---|---|---|
| student_id | string | `S-001`, ... |
| name | string | nama lengkap |
| nickname | string | nama panggilan (dipakai di laporan, mis. "Alula") |
| birthdate | date | opsional |
| join_date | date | tanggal mulai les |
| status | enum | `aktif` / `nonaktif` |
| photo_url | string | opsional |
| notes | string | catatan umum, opsional |

### 3. `Guardians` — wali murid (1–2 per siswa)
| Kolom | Tipe | Keterangan |
|---|---|---|
| guardian_id | string | `G-001`, ... |
| student_id | string | FK → Students |
| name | string | nama wali |
| relation | enum | `Ayah` / `Ibu` / `Wali` |
| wa_number | string | format `62xxxxxxxxxx` (tanpa "+", siap dipakai di `wa.me/`) |
| email | string | opsional |
| is_primary | boolean | `TRUE` = penerima utama laporan |

### 4. `Subjects` — master mata pelajaran
| Kolom | Tipe | Keterangan |
|---|---|---|
| subject_id | string | `MP-001`, ... |
| subject_name | string | mis. "Bahasa Inggris", "JPA Penjumlahan", "Calistung (Catis)", "BIC" |
| category | string | opsional, mis. "Bahasa" / "Matematika" |

### 5. `StudentSubjects` — mapel yang diambil tiap siswa + learning path terkini
Ini sumber utama tampilan **ringkasan learning path** (satu baris per kombinasi siswa+mapel).

| Kolom | Tipe | Keterangan |
|---|---|---|
| student_subject_id | string | `SS-001`, ... |
| student_id | string | FK → Students |
| subject_id | string | FK → Subjects |
| teacher_id | string | FK → Users (guru pengampu mapel ini) |
| start_date | date | mulai ambil mapel ini |
| status | enum | `aktif` / `selesai` / `jeda` |
| current_topic | string | materi terakhir dikuasai (auto-update dari LearningPathLog terbaru) |
| next_topic | string | rencana materi selanjutnya |
| last_updated | datetime | |

### 6. `LearningPathLog` — riwayat materi per mapel per siswa (timeline)
| Kolom | Tipe | Keterangan |
|---|---|---|
| log_id | string | `LOG-001`, ... |
| student_subject_id | string | FK → StudentSubjects |
| date | date | tanggal materi diajarkan |
| topic | string | topik/materi |
| topic_status | enum | `selesai` / `berjalan` |
| notes | string | opsional — ini bahan mentah untuk "Capaian Belajar" di laporan |
| created_by | string | FK → Users |

### 7. `Schedule` — jadwal rutin mingguan
| Kolom | Tipe | Keterangan |
|---|---|---|
| schedule_id | string | `SCH-001`, ... |
| student_subject_id | string | FK → StudentSubjects |
| day_of_week | enum | `Senin`...`Minggu` |
| start_time | string | `HH:mm` |
| end_time | string | `HH:mm` |
| status | enum | `aktif` / `nonaktif` |

### 8. `Attendance` — absensi harian
| Kolom | Tipe | Keterangan |
|---|---|---|
| attendance_id | string | `ABS-001`, ... |
| schedule_id | string | FK → Schedule (kosong jika sesi kelas pengganti murni) |
| student_subject_id | string | FK → StudentSubjects |
| date | date | tanggal sesi |
| status | enum | `Hadir` / `Izin` / `Sakit` / `Alpa` |
| is_makeup_session | boolean | `TRUE` jika ini sesi kelas pengganti |
| makeup_id | string | FK → MakeupClasses, kosong jika bukan pengganti |
| topic_covered | string | opsional, materi hari itu |
| notes | string | opsional |
| recorded_by | string | FK → Users |
| created_at | datetime | |

### 9. `MakeupClasses` — kelas pengganti
| Kolom | Tipe | Keterangan |
|---|---|---|
| makeup_id | string | `MK-001`, ... |
| original_attendance_id | string | FK → Attendance (absen yang bolong, mis. Izin/Sakit/Alpa) |
| student_subject_id | string | FK → StudentSubjects |
| original_date | date | tanggal jadwal asli yang terlewat |
| makeup_date | date | tanggal pengganti |
| makeup_start_time | string | `HH:mm` |
| duration_hours | number | durasi kelas pengganti, mis. `1`, `1.5`, `2` |
| status | enum | `terjadwal` / `selesai` / `batal` |
| notes | string | opsional |
| created_by | string | FK → Users |

### 10. `Reports` — laporan belajar mingguan/bulanan
| Kolom | Tipe | Keterangan |
|---|---|---|
| report_id | string | `RPT-001`, ... |
| student_id | string | FK → Students |
| student_subject_id | string | FK → StudentSubjects |
| period_type | enum | `mingguan` / `bulanan` |
| period_label | string | mis. "Minggu ke-1 sampai dengan Minggu ke-4 Bulan Agustus 2026" |
| achievements | string | poin capaian, dipisah `\n` (satu baris = satu poin "- ...") |
| next_progress | string | poin harapan progres, dipisah `\n` |
| notes | string | **opsional**, kosongkan jika tidak diisi |
| teacher_id | string | FK → Users |
| guardian_id | string | FK → Guardians (tujuan kirim) |
| status | enum | `draft` / `terkirim` |
| sent_at | datetime | kosong jika masih draft |
| message_sent | string | isi pesan WA final yang dikirim (arsip) |
| created_at | datetime | |

### 11. `WeeklySummary` — snapshot analitik per periode (agar histori rapi)
| Kolom | Tipe | Keterangan |
|---|---|---|
| summary_id | string | `WS-001`, ... |
| student_id | string | FK → Students |
| period_type | enum | `mingguan` / `bulanan` |
| period_label | string | mis. "Minggu ke-34 2026" atau "Agustus 2026" |
| total_sessions | number | total sesi terjadwal periode ini |
| attended | number | jumlah hadir |
| izin_sakit | number | jumlah izin+sakit |
| alpa | number | jumlah alpa |
| makeup_scheduled | number | jumlah kelas pengganti dibuat |
| makeup_completed | number | jumlah kelas pengganti selesai |
| reports_sent | number | jumlah laporan terkirim periode ini |
| generated_at | datetime | kapan snapshot dibuat (mis. otomatis tiap akhir minggu/bulan via trigger Apps Script) |

> Sheet ini diisi otomatis oleh **Apps Script time-based trigger** (mis. tiap Minggu malam & akhir bulan) yang menghitung dari `Attendance`, `MakeupClasses`, `Reports`, lalu insert baris baru — bukan overwrite, supaya histori tiap periode tetap tersimpan dan bisa dibandingkan antar minggu/bulan.

### 12. `PasswordResets` — token lupa password
| Kolom | Tipe | Keterangan |
|---|---|---|
| token | string | random string unik |
| user_id | string | FK → Users |
| expires_at | datetime | dibuat + 1 jam |
| used | boolean | `TRUE` setelah dipakai |
| created_at | datetime | |

### 13. `AuditLog` — jejak perubahan (opsional tapi disarankan)
| Kolom | Tipe | Keterangan |
|---|---|---|
| log_id | string | `AL-001`, ... |
| user_id | string | siapa yang melakukan aksi |
| action | string | mis. `create_attendance`, `send_report` |
| target_id | string | id row yang diubah |
| detail | string | opsional, ringkas |
| timestamp | datetime | |

---

## Relasi Antar Sheet (ringkasan)

```
Users (guru) ──┬── StudentSubjects.teacher_id
               └── Reports.teacher_id

Students ──┬── Guardians.student_id
           ├── StudentSubjects.student_id
           └── Reports.student_id

Subjects ── StudentSubjects.subject_id

StudentSubjects ──┬── Schedule.student_subject_id
                   ├── LearningPathLog.student_subject_id
                   ├── Attendance.student_subject_id
                   └── Reports.student_subject_id

Attendance ── MakeupClasses.original_attendance_id
```

## Konvensi Penamaan & Kerapian

- Semua ID pakai prefix + nomor urut 3 digit (mis. `S-001`) — mudah dibaca manual & auto-increment lewat Apps Script (`getLastRow()+1`).
- Kolom tanggal/waktu konsisten pakai ISO (`YYYY-MM-DD` untuk date, `YYYY-MM-DDTHH:mm:ssZ` untuk datetime) supaya gampang di-sort/filter di Sheets maupun diparsing di React.
- Kolom `status` selalu pakai daftar nilai tetap (enum) — buat **Data Validation** di Google Sheets untuk kolom-kolom ini supaya tidak ada typo saat ada yang edit manual.
- Freeze row 1 (header) di semua sheet.
- Beri **Conditional Formatting** di `Attendance` (mis. merah untuk Alpa, kuning Izin/Sakit, hijau Hadir) dan di `Reports` (abu-abu untuk draft, hijau untuk terkirim) supaya owner bisa cek cepat langsung dari Sheets tanpa buka web.
- Sheet `WeeklySummary` dan `AuditLog` **append-only** (tidak pernah update/hapus baris lama) agar histori terjaga.
