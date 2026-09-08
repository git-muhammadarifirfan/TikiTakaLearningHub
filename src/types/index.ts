export type UserRole = 'admin' | 'guru';

export type StatusAktif = 'aktif' | 'nonaktif';
export type StatusAbsensi = 'hadir' | 'izin' | 'sakit' | 'alpa' | 'selesai' | 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';

export interface User {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: StatusAktif;
  created_at?: string;
}

export interface Student {
  student_id: string;
  name: string;
  nickname?: string;
  birthdate?: string;
  join_date: string;
  status: 'aktif' | 'nonaktif' | 'lulus';
  photo_url?: string;
  class_name?: string;
  class?: string;
  notes?: string;
  guardians?: Guardian[];
  subjects?: StudentSubject[];
}

export interface StudentWithDetails extends Student {
  guardians: Guardian[];
  subjects: StudentSubject[];
}

export interface Guardian {
  guardian_id: string;
  student_id: string;
  name: string;
  relation: string;
  wa_number: string;
  email?: string;
  is_primary?: boolean;
}

export interface Subject {
  subject_id: string;
  subject_name: string;
  category?: string;
}

export interface StudentSubject {
  student_subject_id: string;
  student_id: string;
  subject_id: string;
  teacher_id: string;
  start_date: string;
  status: StatusAktif;
  current_topic?: string;
  next_topic?: string;
  last_updated?: string;
  subject_name?: string;
  teacher_name?: string;
}

export interface LearningPathLog {
  log_id: string;
  student_subject_id: string;
  date: string;
  topic: string;
  topic_status: 'dalam_proses' | 'selesai' | 'perlu_mengulang';
  notes?: string;
  created_by?: string;
}

export interface Schedule {
  schedule_id: string;
  student_subject_id: string;
  day_of_week: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  start_time: string;
  end_time: string;
  status: StatusAktif;
  student_name?: string;
  student_nickname?: string;
  teacher_name?: string;
  subject_name?: string;
  teacher_id?: string;
}

export interface Attendance {
  attendance_id: string;
  schedule_id: string;
  student_subject_id: string;
  date: string;
  status: StatusAbsensi;
  is_makeup_session?: boolean;
  makeup_id?: string;
  topic_covered?: string;
  notes?: string;
  recorded_by?: string;
  created_at?: string;
  student_name?: string;
  student_nickname?: string;
  subject_name?: string;
  teacher_name?: string;
}

export interface MakeupClass {
  makeup_id: string;
  original_attendance_id: string;
  student_subject_id: string;
  original_date: string;
  makeup_date: string;
  makeup_start_time: string;
  duration_hours?: number;
  status: 'terjadwal' | 'selesai' | 'batal';
  notes?: string;
  created_by?: string;
  student_name?: string;
  subject_name?: string;
}

export interface Report {
  report_id: string;
  student_id: string;
  student_subject_id: string;
  period_type: 'harian' | 'mingguan' | 'bulanan';
  period_label: string;
  achievements?: string;
  next_progress?: string;
  notes?: string;
  teacher_id: string;
  guardian_id?: string;
  guardian_name?: string;
  status: 'draft' | 'terkirim';
  sent_at?: string;
  message_sent?: string;
  created_at?: string;
  student_name?: string;
  subject_name?: string;
  teacher_name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface DashboardStats {
  totalStudents: number;
  todaySchedules: number;
  pendingAttendance: number;
  pendingMakeup: number;
}
