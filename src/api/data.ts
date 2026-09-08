import { api } from './client';
import { 
  Student, 
  StudentWithDetails, 
  Guardian, 
  Subject, 
  StudentSubject, 
  LearningPathLog, 
  Schedule, 
  Attendance, 
  MakeupClass, 
  Report,
  DashboardStats
} from '../types';

export const studentsApi = {
  list: async (filters?: { search?: string; status?: string; teacher_id?: string }): Promise<Student[]> => {
    return api.request<Student[]>('students/list', filters);
  },
  
  get: async (studentId: string): Promise<StudentWithDetails> => {
    return api.request<StudentWithDetails>('students/get', { studentId });
  },
  
  create: async (data: Omit<Student, 'student_id'>): Promise<Student> => {
    return api.request<Student>('students/create', data);
  },
  
  update: async (studentId: string, data: Partial<Student>): Promise<Student> => {
    return api.request<Student>('students/update', { studentId, ...data });
  },
};

export const guardiansApi = {
  create: async (data: Omit<Guardian, 'guardian_id'>): Promise<Guardian> => {
    return api.request<Guardian>('guardians/create', data);
  },
  
  update: async (guardianId: string, data: Partial<Guardian>): Promise<Guardian> => {
    return api.request<Guardian>('guardians/update', { guardianId, ...data });
  },
  
  delete: async (guardianId: string): Promise<void> => {
    return api.request<void>('guardians/delete', { guardianId });
  },
};

export const subjectsApi = {
  list: async (): Promise<Subject[]> => {
    return api.request<Subject[]>('subjects/list');
  },
  
  create: async (data: Omit<Subject, 'subject_id'>): Promise<Subject> => {
    return api.request<Subject>('subjects/create', data);
  },
  
  update: async (subjectId: string, data: Partial<Subject>): Promise<Subject> => {
    return api.request<Subject>('subjects/update', { subjectId, ...data });
  },
  
  assignStudent: async (data: { student_id: string; subject_id: string; teacher_id: string; start_date: string }): Promise<StudentSubject> => {
    return api.request<StudentSubject>('subjects/assign-student', data);
  },
  
  updateStudentSubject: async (studentSubjectId: string, data: Partial<StudentSubject>): Promise<StudentSubject> => {
    return api.request<StudentSubject>('subjects/update-assign', { studentSubjectId, ...data });
  },

  getLearningPathLogs: async (studentSubjectId: string): Promise<LearningPathLog[]> => {
    return api.request<LearningPathLog[]>('learning-path/list', { studentSubjectId });
  },

  addLearningPathLog: async (data: Omit<LearningPathLog, 'log_id' | 'created_by'>): Promise<LearningPathLog> => {
    return api.request<LearningPathLog>('learning-path/create', data);
  }
};

export const scheduleApi = {
  list: async (filters?: { teacher_id?: string; student_id?: string }): Promise<Schedule[]> => {
    return api.request<Schedule[]>('schedules/list', filters);
  },
  
  create: async (data: Omit<Schedule, 'schedule_id'>): Promise<Schedule> => {
    return api.request<Schedule>('schedules/create', data);
  },
  
  update: async (scheduleId: string, data: Partial<Schedule>): Promise<Schedule> => {
    return api.request<Schedule>('schedules/update', { scheduleId, ...data });
  },
};

export const attendanceApi = {
  listToday: async (date?: string): Promise<Attendance[]> => {
    return api.request<Attendance[]>('attendance/today', { date });
  },
  
  record: async (data: { 
    schedule_id?: string; 
    student_subject_id: string; 
    date: string; 
    status: string; 
    is_makeup_session: boolean; 
    makeup_id?: string;
    topic_covered?: string; 
    notes?: string;
  }): Promise<Attendance> => {
    return api.request<Attendance>('attendance/record', data);
  },
  
  getHistory: async (studentSubjectId: string): Promise<Attendance[]> => {
    return api.request<Attendance[]>('attendance/history', { studentSubjectId });
  },
};

export const makeupApi = {
  list: async (filters?: { status?: string }): Promise<MakeupClass[]> => {
    return api.request<MakeupClass[]>('makeup/list', filters);
  },
  
  schedule: async (data: {
    original_attendance_id: string;
    student_subject_id: string;
    original_date: string;
    makeup_date: string;
    makeup_start_time: string;
    duration_hours: number;
    notes?: string;
  }): Promise<MakeupClass> => {
    return api.request<MakeupClass>('makeup/schedule', data);
  },
  
  updateStatus: async (makeupId: string, status: string): Promise<MakeupClass> => {
    return api.request<MakeupClass>('makeup/update-status', { makeupId, status });
  },
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    return api.request<DashboardStats>('dashboard/stats');
  },
};

export const reportsApi = {
  list: async (studentId?: string): Promise<Report[]> => {
    return api.request<Report[]>('reports/list', { studentId });
  },
  
  create: async (data: Omit<Report, 'report_id' | 'status' | 'created_at' | 'sent_at' | 'message_sent' | 'teacher_id'>): Promise<Report> => {
    return api.request<Report>('reports/create', data);
  },
  
  update: async (reportId: string, data: Partial<Report>): Promise<Report> => {
    return api.request<Report>('reports/update', { reportId, ...data });
  },

  markAsSent: async (reportId: string, messageSent: string): Promise<Report> => {
    return api.request<Report>('reports/mark-sent', { reportId, messageSent });
  }
};
