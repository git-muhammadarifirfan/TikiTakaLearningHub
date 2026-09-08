// Utility constants
export const APP_NAME = 'TikaTrack';
export const APP_TAGLINE = '';

export const DAYS_OF_WEEK: Array<{ value: string; label: string }> = [
  { value: 'Senin', label: 'Senin' },
  { value: 'Selasa', label: 'Selasa' },
  { value: 'Rabu', label: 'Rabu' },
  { value: 'Kamis', label: 'Kamis' },
  { value: 'Jumat', label: 'Jumat' },
  { value: 'Sabtu', label: 'Sabtu' },
  { value: 'Minggu', label: 'Minggu' },
];

export const ATTENDANCE_STATUS_OPTIONS = [
  { value: 'Hadir', label: 'Hadir', color: 'success' },
  { value: 'Izin', label: 'Izin', color: 'info' },
  { value: 'Sakit', label: 'Sakit', color: 'warning' },
  { value: 'Alpa', label: 'Alpa', color: 'danger' },
] as const;

export const GUARDIAN_RELATIONS = [
  { value: 'Ayah', label: 'Ayah' },
  { value: 'Ibu', label: 'Ibu' },
  { value: 'Wali', label: 'Wali' },
] as const;

export const STUDENT_STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
] as const;

export const SUBJECT_STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'jeda', label: 'Jeda' },
] as const;

export const MAKEUP_STATUS_OPTIONS = [
  { value: 'terjadwal', label: 'Terjadwal' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'batal', label: 'Batal' },
] as const;

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'tikatrack_token',
  AUTH_USER: 'tikatrack_user',
  SESSION_EXPIRES: 'tikatrack_session_expires',
} as const;

// Session TTL: 40 Hari (dalam milidetik)
export const FORTY_DAYS_MS = 40 * 24 * 60 * 60 * 1000;
