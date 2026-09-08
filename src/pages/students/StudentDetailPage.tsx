import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import {
  StudentWithDetails,
  StudentSubject,
  Subject,
  User,
  LearningPathLog,
  MakeupClass,
} from '../../types';
import { Button, Input, Modal, Select, SkeletonBox } from '../../components/ui';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Plus,
  RefreshCw,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Bookmark,
  UserCheck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const cachedStudent = api.getCached<StudentWithDetails>(`students/get_${JSON.stringify({ studentId: id })}`);
  const [student, setStudent] = useState<StudentWithDetails | null>(cachedStudent || null);
  const [loading, setLoading] = useState<boolean>(!cachedStudent);
  const [activeTab, setActiveTab] = useState<'subjects' | 'learning_path' | 'makeup'>('subjects');

  // Master Data
  const [subjectsList, setSubjectsList] = useState<Subject[]>(api.getCached<Subject[]>('subjects/list') || []);
  const [teachersList, setTeachersList] = useState<User[]>(api.getCached<User[]>('teachers/list') || []);

  // Relational Logs
  const [learningLogs, setLearningLogs] = useState<LearningPathLog[]>([]);
  const [makeupLogs, setMakeupLogs] = useState<MakeupClass[]>([]);

  // Modals
  const [isAssignSubjectModalOpen, setIsAssignSubjectModalOpen] = useState(false);
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);

  // Form States — Assign Subject
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // Form States — Learning Path Log
  const [lpStudentSubjectId, setLpStudentSubjectId] = useState('');
  const [lpDate, setLpDate] = useState(new Date().toISOString().split('T')[0]);
  const [lpTopic, setLpTopic] = useState('');
  const [lpNextTopic, setLpNextTopic] = useState('');
  const [lpTopicStatus, setLpTopicStatus] = useState<'dalam_proses' | 'selesai' | 'perlu_mengulang'>('dalam_proses');
  const [lpNotes, setLpNotes] = useState('');

  // Form States — Makeup Class
  const [mcStudentSubjectId, setMcStudentSubjectId] = useState('');
  const [mcOriginalDate, setMcOriginalDate] = useState(new Date().toISOString().split('T')[0]);
  const [mcMakeupDate, setMcMakeupDate] = useState(new Date().toISOString().split('T')[0]);
  const [mcStartTime, setMcStartTime] = useState('15:30');
  const [mcDuration, setMcDuration] = useState(1.5);
  const [mcNotes, setMcNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      const data = await api.request<StudentWithDetails>('students/get', { studentId: id });
      setStudent(data);

      if (data.subjects && data.subjects.length > 0) {
        const allLogs: LearningPathLog[] = [];
        for (const sub of data.subjects) {
          try {
            const logs = await api.request<LearningPathLog[]>('learning-path/list', {
              studentSubjectId: sub.student_subject_id,
            });
            if (Array.isArray(logs)) allLogs.push(...logs);
          } catch (e) { }
        }
        setLearningLogs(allLogs);
      }

      try {
        const makeups = await api.request<MakeupClass[]>('makeup/list');
        if (Array.isArray(makeups)) {
          const filtered = makeups.filter((m) =>
            data.subjects?.some((s) => s.student_subject_id === m.student_subject_id)
          );
          setMakeupLogs(filtered);
        }
      } catch (e) { }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat detail murid');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    const fetchMaster = async () => {
      try {
        const subs = await api.request<Subject[]>('subjects/list');
        const tchs = await api.request<User[]>('teachers/list');
        setSubjectsList(subs);
        setTeachersList(tchs);
      } catch (e) { }
    };
    fetchMaster();
  }, [id]);

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedSubjectId || !selectedTeacherId) return;
    setSubmitting(true);
    try {
      await api.request<StudentSubject>('subjects/assign-student', {
        student_id: id,
        subject_id: selectedSubjectId,
        teacher_id: selectedTeacherId,
      });
      toast.success('Mata pelajaran berhasil ditambahkan!');
      setIsAssignSubjectModalOpen(false);
      fetchDetails();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menugaskan mapel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddLearningLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lpStudentSubjectId || !lpTopic) {
      toast.error('Harap pilih mapel dan isi topik materi');
      return;
    }
    setSubmitting(true);
    try {
      await api.request<LearningPathLog>('learning-path/create', {
        student_subject_id: lpStudentSubjectId,
        date: lpDate,
        topic: lpTopic,
        next_topic: lpNextTopic,
        topic_status: lpTopicStatus,
        notes: lpNotes,
      });
      toast.success('Progress materi mingguan berhasil disimpan!');
      setIsLearningModalOpen(false);
      setLpTopic('');
      setLpNextTopic('');
      setLpTopicStatus('dalam_proses');
      setLpNotes('');
      fetchDetails();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan progress materi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleMakeup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcMakeupDate || !mcStartTime) {
      toast.error('Harap lengkapi tanggal dan jam kelas pengganti');
      return;
    }
    const targetSubjectId = mcStudentSubjectId || (student?.subjects?.[0]?.student_subject_id || student?.student_id || 'SS-001');
    setSubmitting(true);
    try {
      await api.request<MakeupClass>('makeup/schedule', {
        student_subject_id: targetSubjectId,
        original_date: mcOriginalDate,
        makeup_date: mcMakeupDate,
        makeup_start_time: mcStartTime,
        duration_hours: mcDuration,
        notes: mcNotes,
      });
      toast.success('Jadwal kelas pengganti berhasil diset!');
      setIsMakeupModalOpen(false);
      setMcNotes('');
      fetchDetails();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat kelas pengganti');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMakeupStatus = async (makeupId: string, newStatus: 'terjadwal' | 'selesai' | 'batal') => {
    try {
      await api.request<MakeupClass>('makeup/update-status', {
        makeupId,
        status: newStatus,
      });
      toast.success(`Status kelas pengganti diubah ke ${newStatus}`);
      fetchDetails();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui status');
    }
  };

  if (loading && !student) {
    return (
      <div className="page-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
        <SkeletonBox width="100%" height="180px" borderRadius="var(--radius-xl)" style={{ marginBottom: '1.5rem' }} />
        <SkeletonBox width="100%" height="300px" borderRadius="var(--radius-xl)" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="page-container text-center" style={{ padding: '3rem' }}>
        <h2>Murid tidak ditemukan</h2>
        <Button className="btn btn-primary-pink" style={{ marginTop: '1rem' }} onClick={() => navigate('/students')}>
          Kembali ke Daftar Murid
        </Button>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Top Header Card */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/students')}
          className="btn btn-secondary"
          style={{
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
          }}
        >
          <ArrowLeft size={16} />
          <span style={{ fontWeight: 600 }}>Kembali ke Data Murid</span>
        </button>

        <div
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 100%)',
            borderRadius: 'var(--radius-xl)',
            padding: '1.5rem 2rem',
            border: '1px solid var(--pink-light)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--pink-light)',
                color: 'var(--primary-pink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 800,
                border: '2px solid #ffffff',
                boxShadow: '0 4px 12px rgba(244, 114, 182, 0.2)',
              }}
            >
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {student.name}
                </h1>
                <span
                  className="badge"
                  style={{
                    backgroundColor: student.status === 'aktif' ? '#d1fae5' : '#fee2e2',
                    color: student.status === 'aktif' ? '#065f46' : '#991b1b',
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.75rem',
                  }}
                >
                  {student.status.toUpperCase()}
                </span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>ID: <strong>{student.student_id}</strong></span>
                <span>•</span>
                <span>Panggilan: <strong>{student.nickname || '-'}</strong></span>
                <span>•</span>
                <span>Bergabung: <strong>{student.join_date}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              className="btn btn-primary-pink"
              size="sm"
              onClick={() => setIsAssignSubjectModalOpen(true)}
              icon={<Plus size={16} />}
            >
              Tambah Mapel
            </Button>
            <Button
              className="btn btn-pink"
              size="sm"
              onClick={() => setIsLearningModalOpen(true)}
              icon={<Sparkles size={16} />}
            >
              Catat Progress
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Dribbble-Style Segmented Pill Nav Bar (Fixed Box-Shadow & Solid Background) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '0.4rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.4rem',
          marginBottom: '1.75rem',
        }}
      >
        {[
          { id: 'subjects', label: 'Mapel Siswa', count: student.subjects?.length || 0, icon: <Bookmark size={17} /> },
          { id: 'learning_path', label: 'Learning Path', count: learningLogs.length, icon: <Sparkles size={17} /> },
          { id: 'makeup', label: 'Kelas Pengganti', count: makeupLogs.length, icon: <RefreshCw size={17} /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                fontWeight: isActive ? 700 : 600,
                fontSize: '0.9rem',
                fontFamily: "'Poppins', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                backgroundColor: isActive ? 'var(--primary-pink)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                boxShadow: isActive ? '0 4px 14px rgba(244, 114, 182, 0.35)' : 'none',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                style={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Mapel Siswa (StudentSubjects) */}
      {activeTab === 'subjects' && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Daftar Mata Pelajaran Terdaftar
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                Mata pelajaran yang diambil siswa dan guru pengampunya
              </p>
            </div>
            <Button className="btn btn-primary-pink" size="sm" onClick={() => setIsAssignSubjectModalOpen(true)} icon={<Plus size={16} />}>
              Assign Mapel Baru
            </Button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Mapel Siswa</th>
                  <th>Mata Pelajaran</th>
                  <th>Guru Pengampu</th>
                  <th>Topik Saat Ini</th>
                  <th>Target Selanjutnya</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: student?.subjects?.length || 3 }).map((_, rIdx) => (
                    <tr key={rIdx}>
                      <td><SkeletonBox width="60px" height="18px" /></td>
                      <td><SkeletonBox width="130px" height="18px" /></td>
                      <td><SkeletonBox width="110px" height="18px" /></td>
                      <td><SkeletonBox width="100px" height="18px" /></td>
                      <td><SkeletonBox width="90px" height="18px" /></td>
                      <td><SkeletonBox width="60px" height="22px" borderRadius="9999px" /></td>
                    </tr>
                  ))
                ) : !student?.subjects || student.subjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Belum ada mata pelajaran yang di-assign untuk murid ini.
                    </td>
                  </tr>
                ) : (
                  student.subjects.map((sub) => (
                    <tr key={sub.student_subject_id}>
                      <td style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub.student_subject_id}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{sub.subject_name || sub.subject_id}</td>
                      <td style={{ fontWeight: 600 }}>{sub.teacher_name || sub.teacher_id}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary-pink)' }}>
                          {sub.current_topic && sub.current_topic !== '-' ? sub.current_topic : 'Belum ada topik'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {sub.next_topic && sub.next_topic !== '-' ? sub.next_topic : 'Belum diset'}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: sub.status === 'aktif' ? '#d1fae5' : '#fee2e2',
                            color: sub.status === 'aktif' ? '#065f46' : '#991b1b',
                          }}
                        >
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Learning Path Log (Modern Fikri Studio Card Grid View) */}
      {activeTab === 'learning_path' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Top Bar Controls (Matching Fikri Studio UI) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              background: '#ffffff',
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {learningLogs.length} Modul Learning Path
              </span>
              <span
                style={{
                  background: '#fdf2f8',
                  color: 'var(--primary-pink)',
                  border: '1px solid #fbcfe8',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span>Prototyping & Curated Topics</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Button
                className="btn btn-primary-pink"
                size="sm"
                onClick={() => setIsLearningModalOpen(true)}
                icon={<Plus size={16} />}
              >
                New Content
              </Button>
            </div>
          </div>

          {/* Card Grid Container (Matching Fikri Studio Cards) */}
          {learningLogs.length === 0 ? (
            <div className="card text-center" style={{ padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                Belum ada modul Learning Path. Klik <strong>+ New Content</strong> untuk membuat modul baru.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {learningLogs.map((log, idx) => {
                const subObj = student.subjects?.find((s) => s.student_subject_id === log.student_subject_id);
                const bgGradients = [
                  'linear-gradient(135deg, #fde68a 0%, #fef08a 50%, #fed7aa 100%)',
                  'linear-gradient(135deg, #bae6fd 0%, #e0f2fe 50%, #bfdbfe 100%)',
                  'linear-gradient(135deg, #ddd6fe 0%, #f3e8ff 50%, #fbcfe8 100%)',
                ];
                const bgGrad = bgGradients[idx % bgGradients.length];

                const isDone = log.topic_status === 'selesai';
                const isOngoing = log.topic_status === 'dalam_proses';
                const pct = isDone ? 100 : isOngoing ? 50 : 25;

                return (
                  <div
                    key={log.log_id}
                    className="card"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      borderRadius: 'var(--radius-xl)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    {/* Top Decorative Illustration Header (Fikri Studio Banner) */}
                    <div
                      style={{
                        height: '140px',
                        background: bgGrad,
                        padding: '1rem',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span
                          style={{
                            background: 'rgba(15, 23, 42, 0.75)',
                            color: '#ffffff',
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {log.date}
                        </span>
                        <span
                          style={{
                            background: '#ffffff',
                            color: 'var(--text-main)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          }}
                        >
                          <Bookmark size={14} color="var(--primary-pink)" />
                        </span>
                      </div>

                      {/* Cute Graphic Vector Elements (20 Predefined Lottie / Cute Illustration Variations) */}
                      {(() => {
                        const illusIndex = (idx + (log.log_id ? log.log_id.charCodeAt(log.log_id.length - 1) : 0)) % 20;
                        const accentColors = ['#ec4899', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#06b6d4', '#84cc16'];
                        const accent = accentColors[illusIndex % accentColors.length];

                        return (
                          <svg width="100%" height="75" viewBox="0 0 240 75" fill="none" style={{ opacity: 0.9 }}>
                            {illusIndex % 4 === 0 && (
                              <>
                                <rect x="25" y="15" width="85" height="52" rx="10" fill="#ffffff" fillOpacity="0.9" />
                                <rect x="35" y="27" width="45" height="6" rx="3" fill={accent} />
                                <rect x="35" y="39" width="65" height="4" rx="2" fill="#cbd5e1" />
                                <rect x="35" y="47" width="50" height="4" rx="2" fill="#cbd5e1" />
                                <circle cx="175" cy="38" r="22" fill="#ffffff" fillOpacity="0.85" />
                                <path d="M 165 38 Q 175 22 185 38" stroke={accent} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                              </>
                            )}
                            {illusIndex % 4 === 1 && (
                              <>
                                <circle cx="50" cy="38" r="24" fill="#ffffff" fillOpacity="0.9" />
                                <path d="M42 38 L48 44 L58 32" stroke={accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                                <rect x="90" y="18" width="125" height="48" rx="12" fill="#ffffff" fillOpacity="0.85" />
                                <rect x="102" y="28" width="70" height="7" rx="3.5" fill={accent} />
                                <rect x="102" y="42" width="100" height="5" rx="2.5" fill="#94a3b8" />
                              </>
                            )}
                            {illusIndex % 4 === 2 && (
                              <>
                                <rect x="20" y="20" width="200" height="42" rx="10" fill="#ffffff" fillOpacity="0.88" />
                                <circle cx="45" cy="41" r="12" fill={accent} fillOpacity="0.2" />
                                <path d="M41 41 L49 41 M45 37 L45 45" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
                                <rect x="70" y="30" width="80" height="6" rx="3" fill="#475569" />
                                <rect x="70" y="42" width="120" height="4" rx="2" fill="#cbd5e1" />
                              </>
                            )}
                            {illusIndex % 4 === 3 && (
                              <>
                                <rect x="30" y="12" width="70" height="56" rx="8" fill="#ffffff" fillOpacity="0.85" transform="rotate(-5 65 40)" />
                                <rect x="140" y="12" width="70" height="56" rx="8" fill="#ffffff" fillOpacity="0.95" transform="rotate(5 175 40)" />
                                <circle cx="175" cy="40" r="16" fill={accent} fillOpacity="0.2" />
                                <path d="M169 40 L181 40" stroke={accent} strokeWidth="3" strokeLinecap="round" />
                              </>
                            )}
                          </svg>
                        );
                      })()}
                    </div>

                    {/* Card Content Body */}
                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-pink)', marginBottom: '0.25rem' }}>
                          {subObj?.subject_name || 'Modul Belajar'}
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.35 }}>
                          {log.topic}
                        </h4>
                      </div>

                      {/* Category Pills & Tags */}
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-md)', fontSize: '0.72rem', fontWeight: 600 }}>
                          Kurikulum Bimbel
                        </span>
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-md)', fontSize: '0.72rem', fontWeight: 600 }}>
                          Evaluasi Mingguan
                        </span>
                      </div>

                      {log.notes && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4, fontStyle: 'italic', background: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                          "{log.notes}"
                        </p>
                      )}

                      {/* Footer Progress Donut & Status Select (Smooth Custom Dropdown) */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '0.85rem',
                          borderTop: '1px solid var(--border)',
                          marginTop: 'auto',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {/* Mini Progress Ring */}
                          <div style={{ position: 'relative', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="28" height="28" viewBox="0 0 36 36">
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="4"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke={isDone ? '#10b981' : isOngoing ? '#f59e0b' : '#ef4444'}
                                strokeWidth="4"
                                strokeDasharray={`${pct}, 100`}
                              />
                            </svg>
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {pct}% Progress
                          </span>
                        </div>

                        {/* Interactive Smooth Custom Dropdown Selector */}
                        <div style={{ minWidth: '135px' }}>
                          <Select
                            value={log.topic_status}
                            onChange={async (newStatus) => {
                              try {
                                toast.success('Status progress diperbarui!');
                                setLearningLogs((prev) =>
                                  prev.map((item) => (item.log_id === log.log_id ? { ...item, topic_status: newStatus as any } : item))
                                );
                                await api.request('learning-path/create', {
                                  student_subject_id: log.student_subject_id,
                                  date: log.date,
                                  topic: log.topic,
                                  topic_status: newStatus,
                                  notes: log.notes || '',
                                });
                              } catch (err) {
                                toast.error('Gagal memperbarui status progress');
                              }
                            }}
                            options={[
                              { value: 'selesai', label: 'Selesai' },
                              { value: 'dalam_proses', label: 'Dalam Proses' },
                              { value: 'perlu_mengulang', label: 'Perlu Mengulang' },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Tab 3: Kelas Pengganti (MakeupClasses) */}
      {activeTab === 'makeup' && (
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Jadwal Kelas Pengganti (Makeup Classes)
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                Set jadwal kelas pengganti dan ubah status bebas sesuai kesepakatan
              </p>
            </div>
            <Button className="btn btn-primary-pink" size="sm" onClick={() => setIsMakeupModalOpen(true)} icon={<Plus size={16} />}>
              Set Kelas Pengganti
            </Button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Pengganti</th>
                  <th>Tgl Asli (Izin/Sakit)</th>
                  <th>Jadwal Pengganti</th>
                  <th>Jam</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi Guru</th>
                </tr>
              </thead>
              <tbody>
                {makeupLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Belum ada jadwal kelas pengganti. Klik 'Set Kelas Pengganti' untuk membuat jadwal baru.
                    </td>
                  </tr>
                ) : (
                  makeupLogs.map((mk) => {
                    return (
                      <tr key={mk.makeup_id}>
                        <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{mk.makeup_id}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{mk.original_date}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-pink)' }}>{mk.makeup_date}</td>
                        <td>{mk.makeup_start_time} ({mk.duration_hours || 1.5} jam)</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor:
                                mk.status === 'selesai'
                                  ? '#d1fae5'
                                  : mk.status === 'terjadwal'
                                    ? '#dbeafe'
                                    : '#fee2e2',
                              color:
                                mk.status === 'selesai'
                                  ? '#065f46'
                                  : mk.status === 'terjadwal'
                                    ? '#1e40af'
                                    : '#991b1b',
                            }}
                          >
                            {mk.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            {mk.status !== 'selesai' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#d1fae5', color: '#065f46', border: 'none' }}
                                onClick={() => handleUpdateMakeupStatus(mk.makeup_id, 'selesai')}
                              >
                                Selesai
                              </button>
                            )}
                            {mk.status !== 'batal' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#fee2e2', color: '#991b1b', border: 'none' }}
                                onClick={() => handleUpdateMakeupStatus(mk.makeup_id, 'batal')}
                              >
                                Batalkan
                              </button>
                            )}
                            {mk.status !== 'terjadwal' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', border: 'none' }}
                                onClick={() => handleUpdateMakeupStatus(mk.makeup_id, 'terjadwal')}
                              >
                                Reset Terjadwal
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Assign Mapel Baru */}
      <Modal isOpen={isAssignSubjectModalOpen} onClose={() => setIsAssignSubjectModalOpen(false)} title="Tambah Mata Pelajaran Siswa">
        <form onSubmit={handleAssignSubject}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Select
              label="Pilih Mata Pelajaran"
              value={selectedSubjectId}
              onChange={(val) => setSelectedSubjectId(val)}
              options={subjectsList.map((s) => ({ value: s.subject_id, label: s.subject_name }))}
              placeholder="-- Pilih Mapel --"
              required
            />
            <Select
              label="Pilih Guru Pengampu"
              value={selectedTeacherId}
              onChange={(val) => setSelectedTeacherId(val)}
              options={teachersList.map((t) => ({ value: t.user_id, label: `${t.name} (${t.role})` }))}
              placeholder="-- Pilih Guru --"
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" className="btn btn-secondary" onClick={() => setIsAssignSubjectModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="btn btn-primary-pink" loading={submitting} loadingText="Menyimpan...">
              Simpan Penugasan Mapel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Catat Progress Learning Path */}
      <Modal isOpen={isLearningModalOpen} onClose={() => setIsLearningModalOpen(false)} title="Catat Progress Materi (Learning Path)">
        <form onSubmit={handleAddLearningLog}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Select
              label="Pilih Mapel Siswa *"
              value={lpStudentSubjectId}
              onChange={(val) => setLpStudentSubjectId(val)}
              options={(student.subjects || []).map((s) => ({
                value: s.student_subject_id,
                label: s.subject_name || s.subject_id,
              }))}
              placeholder="-- Pilih Mapel --"
              required
            />
            <Input label="Tanggal *" type="date" value={lpDate} onChange={(e: any) => setLpDate(e.target.value)} required />
          </div>

          <Input
            label="Topik Materi Yang Dipelajari *"
            value={lpTopic}
            onChange={(e: any) => setLpTopic(e.target.value)}
            required
            placeholder="Contoh: JPA Penjumlahan Ratusan"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              label="Target Topik Selanjutnya"
              value={lpNextTopic}
              onChange={(e: any) => setLpNextTopic(e.target.value)}
              placeholder="Contoh: JPA Pengurangan Ratusan"
            />
            <Select
              label="Status Progress *"
              value={lpTopicStatus}
              onChange={(val) => setLpTopicStatus(val as any)}
              options={[
                { value: 'selesai', label: 'Selesai' },
                { value: 'dalam_proses', label: 'Dalam Proses' },
                { value: 'perlu_mengulang', label: 'Perlu Mengulang' },
              ]}
              required
            />
          </div>

          <Input
            label="Catatan Evaluasi Guru"
            value={lpNotes}
            onChange={(e: any) => setLpNotes(e.target.value)}
            placeholder="Contoh: Siswa sudah sangat memahami konsep dasar."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" className="btn btn-secondary" onClick={() => setIsLearningModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="btn btn-primary-pink" loading={submitting} loadingText="Menyimpan...">
              Simpan Progress
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Set Kelas Pengganti Guru */}
      <Modal isOpen={isMakeupModalOpen} onClose={() => setIsMakeupModalOpen(false)} title="Set Jadwal Kelas Pengganti (Makeup Class)">
        <form onSubmit={handleScheduleMakeup}>
          <div style={{ marginBottom: '1rem' }}>
            <Input
              label="Tanggal Sesi Asli (Izin/Sakit) *"
              type="date"
              value={mcOriginalDate}
              onChange={(e: any) => setMcOriginalDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              label="Tanggal Kelas Pengganti *"
              type="date"
              value={mcMakeupDate}
              onChange={(e: any) => setMcMakeupDate(e.target.value)}
              required
            />
            <Input
              label="Jam Mulai Pengganti *"
              type="time"
              value={mcStartTime}
              onChange={(e: any) => setMcStartTime(e.target.value)}
              required
            />
          </div>

          <Input
            label="Catatan / Alasan Perubahan"
            value={mcNotes}
            onChange={(e: any) => setMcNotes(e.target.value)}
            placeholder="Contoh: Kesepakatan bersama wali murid di hari Sabtu"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" className="btn btn-secondary" onClick={() => setIsMakeupModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="btn btn-primary-pink" loading={submitting} loadingText="Menyimpan...">
              Simpan Kelas Pengganti
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentDetailPage;
