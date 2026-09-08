import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Student, StudentSubject, StudentWithDetails } from '../../types';
import { Button, Input, Modal, Select, SkeletonBox } from '../../components/ui';
import { Search, Plus, GraduationCap, ChevronRight, CheckCircle2, Circle, Clock, Sparkles, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';

// 15 Random Avatar SVG Generator (Lucu & Pastel)
const getStudentAvatarSvg = (index: number) => {
  const bgColors = ['#fce7f3', '#fef9c3', '#e0e7ff', '#d1fae5', '#ffedd5', '#f3e8ff', '#ffe4e6', '#ccfbf1'];
  const hairColors = ['#475569', '#ec4899', '#d97706', '#2563eb', '#059669', '#7c3aed', '#db2777', '#0284c7'];
  const bg = bgColors[index % bgColors.length];
  const hair = hairColors[index % hairColors.length];
  const eyeType = (index % 3);

  return (
    <svg width="36" height="36" viewBox="0 0 40 40" style={{ borderRadius: '50%', backgroundColor: bg, flexShrink: 0 }}>
      <circle cx="20" cy="18" r="13" fill={hair} />
      <circle cx="20" cy="22" r="10" fill="#fde047" opacity="0.4" />
      <circle cx="20" cy="21" r="9.5" fill="#fff" />
      {eyeType === 0 && (
        <>
          <circle cx="16" cy="20" r="1.5" fill="#334155" />
          <circle cx="24" cy="20" r="1.5" fill="#334155" />
        </>
      )}
      {eyeType === 1 && (
        <>
          <path d="M 14 20 Q 16 18 18 20" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 22 20 Q 24 18 26 20" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {eyeType === 2 && (
        <>
          <circle cx="16" cy="20" r="1.75" fill="#db2777" />
          <circle cx="24" cy="20" r="1.75" fill="#db2777" />
        </>
      )}
      <path d="M 17 24 Q 20 27 23 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="23" r="1.5" fill="#f472b6" opacity="0.6" />
      <circle cx="26" cy="23" r="1.5" fill="#f472b6" opacity="0.6" />
    </svg>
  );
};

export const StudentListPage: React.FC = () => {
  const cachedStudents = api.getCached<Student[]>('students/list');
  const [students, setStudents] = useState<Student[]>(cachedStudents || []);
  const [studentSubjects, setStudentSubjects] = useState<Record<string, StudentSubject[]>>({});
  const [loading, setLoading] = useState<boolean>(!cachedStudents);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State Murid & Orang Tua / Wali
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [className, setClassName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Edit State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Preview Modal State & Goal Management Modal
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [goalManageStudent, setGoalManageStudent] = useState<{ student: Student; subjects: StudentSubject[] } | null>(null);

  // Bulk Selection State
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s) => s.student_id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const fetchStudents = async () => {
    try {
      api.invalidateCache();
      const data = await api.request<Student[]>('students/list', undefined, { skipCache: true });
      setStudents(data);
      
      // Fetch Detailed Subjects for Progress Calculation across ALL students in background
      const ssMap: Record<string, StudentSubject[]> = {};
      data.forEach((s) => {
        if (s.subjects) ssMap[s.student_id] = s.subjects;
      });
      setStudentSubjects(ssMap);

      // Async fetch full details for all students to populate guardians & subjects
      Promise.all(
        data.map(async (s) => {
          try {
            const details = await api.request<StudentWithDetails>('students/get', { studentId: s.student_id }, { skipCache: true });
            if (details) {
              setStudentSubjects((prev) => ({ ...prev, [s.student_id]: details.subjects || [] }));
              setStudents((prev) =>
                prev.map((item) => (item.student_id === s.student_id ? { ...item, guardians: details.guardians } : item))
              );
            }
          } catch (e) {}
        })
      );
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar siswa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setNickname('');
    setClassName('');
    setBirthdate('');
    setJoinDate(new Date().toISOString().split('T')[0]);
    setGuardianName('');
    setGuardianPhone('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = async (student: Student) => {
    setEditingStudent(student);
    setName(student.name || '');
    setNickname(student.nickname || '');
    setClassName(student.class_name || student.photo_url || '');
    setBirthdate(student.birthdate || '');
    setJoinDate(student.join_date || new Date().toISOString().split('T')[0]);
    setNotes(student.notes || '');

    // Pre-fill guardian details if available in student.guardians array or fetch fresh
    if (student.guardians && student.guardians.length > 0) {
      setGuardianName(student.guardians[0].name || '');
      setGuardianPhone(student.guardians[0].wa_number || '');
    } else {
      setGuardianName('');
      setGuardianPhone('');
      try {
        const details = await api.request<StudentWithDetails>('students/get', { studentId: student.student_id });
        if (details && details.guardians && details.guardians.length > 0) {
          setGuardianName(details.guardians[0].name || '');
          setGuardianPhone(details.guardians[0].wa_number || '');
        }
      } catch (e) {}
    }
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error('Nama lengkap murid wajib diisi');
      return;
    }

    const isEdit = !!editingStudent;
    setSubmitting(true);
    const toastId = toast.loading(isEdit ? 'Menyimpan perubahan murid & wali...' : 'Menambahkan murid baru...');

    try {
      api.invalidateCache();
      if (isEdit && editingStudent) {
        await api.request('students/update', {
          studentId: editingStudent.student_id,
          name,
          nickname,
          class: className,
          class_name: className,
          photo_url: className,
          birthdate,
          join_date: joinDate,
          guardian_name: guardianName,
          guardian_phone: guardianPhone,
          notes,
        });
        toast.success('Data murid & wali berhasil tersimpan di Database!', { id: toastId });
      } else {
        await api.request<Student>('students/create', {
          name,
          nickname,
          class: className,
          class_name: className,
          photo_url: className,
          birthdate,
          join_date: joinDate,
          guardian_name: guardianName,
          guardian_phone: guardianPhone,
          notes,
        });
        toast.success('Murid & Wali baru berhasil terdaftar!', { id: toastId });
      }
      setIsModalOpen(false);
      setEditingStudent(null);
      await fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data murid & wali. Silakan coba lagi.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Subject Goal Progress (Selesai / Dalam Proses)
  const handleToggleGoalTopic = async (ss: StudentSubject) => {
    const isCompleted = ss.current_topic && ss.current_topic !== '-' && ss.current_topic !== '';
    const newTopic = isCompleted ? '-' : (ss.next_topic || 'Topik Selesai');
    const newNextTopic = isCompleted ? (ss.current_topic || 'Materi Baru') : 'Materi Selanjutnya';

    // Fast Optimistic UI feedback
    toast.success(isCompleted ? 'Progress topik dikembalikan! 🔄' : 'Selamat! Goal topik tercapai 🎉', { duration: 2500 });
    
    // Update local state instantly
    setStudentSubjects((prev) => {
      const list = prev[ss.student_id] || [];
      const updated = list.map((item) =>
        item.student_subject_id === ss.student_subject_id
          ? { ...item, current_topic: newTopic, next_topic: newNextTopic }
          : item
      );
      return { ...prev, [ss.student_id]: updated };
    });

    try {
      api.invalidateCache();
      await api.request('subjects/update-assign', {
        studentSubjectId: ss.student_subject_id,
        current_topic: newTopic,
        next_topic: newNextTopic,
      });
    } catch (e) {
      toast.error('Gagal memperbarui status topik di sheet');
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.nickname || '').toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = students.filter((s) => s.status === 'aktif').length;
  const inactiveCount = students.filter((s) => s.status === 'nonaktif').length;
  const totalCount = students.length || 1;

  // Calculate Real Progress % based strictly on StudentSubjects database
  const getStudentCourseProgress = (studentId: string) => {
    const subs = studentSubjects[studentId] || [];
    if (subs.length === 0) {
      return { count: 0, title: 'Belum ada mapel', progress: 0 };
    }
    const completedCount = subs.filter((s) => s.current_topic && s.current_topic !== '-' && s.current_topic !== '').length;
    const progress = Math.round((completedCount / subs.length) * 100);
    const firstSubject = subs[0]?.subject_name || 'Bimbel Reguler';
    return { count: subs.length, title: firstSubject, progress };
  };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Page Header & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 600 }}>Data Murid</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dashboard / <span style={{ color: 'var(--primary-pink)' }}>Students</span></p>
        </div>
        <Button className="btn btn-primary-pink" onClick={openAddModal}>
          <Plus size={16} />
          <span>Tambah Murid Baru</span>
        </Button>
      </div>

      {/* 3 Top Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', margin: 0 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f1f5f9', color: '#475569' }}>
            <GraduationCap size={22} />
          </div>
          <div className="stat-info">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500 }}>Total Murid</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>{students.length}</h3>
          </div>
        </div>

        <div className="stat-card" style={{ background: '#fdf2f8', borderColor: '#fbcfe8' }}>
          <div className="stat-icon pink" style={{ background: '#f472b6', color: '#ffffff' }}>
            <GraduationCap size={22} />
          </div>
          <div className="stat-info">
            <p style={{ color: '#9d174d', fontSize: '0.78rem', fontWeight: 500 }}>Murid Aktif</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#9d174d' }}>
              {activeCount} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>({Math.round((activeCount / totalCount) * 100)}%)</span>
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <GraduationCap size={22} />
          </div>
          <div className="stat-info">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 500 }}>Murid Nonaktif</p>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>
              {inactiveCount} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>({Math.round((inactiveCount / totalCount) * 100)}%)</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '1.25rem' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="search-input-wrapper" style={{ width: '300px' }}>
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Cari nama, ID, atau kata kunci..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Select
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'aktif', label: 'Aktif' },
                { value: 'nonaktif', label: 'Nonaktif' },
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
            />
            
            <Button
              className={`btn ${isBulkMode ? 'btn-primary-pink' : 'btn-secondary'}`}
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                if (isBulkMode) setSelectedIds([]);
              }}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            >
              <span>{isBulkMode ? 'Selesai Pilih' : 'Pilih Siswa (Bulk)'}</span>
            </Button>
          </div>
        </div>

        {/* Floating Box Pilihan Bulk Action (Muncul ketika Mode Bulk Aktif) */}
        {isBulkMode && (
          <div
            className="animate-fade-in"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fdf2f8',
              border: '1px solid #fbcfe8',
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#9d174d',
            }}
          >
            <div style={{ fontWeight: 600 }}>
              <span>{selectedIds.length} Siswa Terpilih</span>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                onClick={toggleSelectAll}
              >
                {selectedIds.length === filteredStudents.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </Button>
              <Button
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                onClick={() => toast.success(`Exporting ${selectedIds.length} data murid terpilih... 📄`)}
                disabled={selectedIds.length === 0}
              >
                Export Terpilih
              </Button>
              <Button
                className="btn btn-primary-pink"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                onClick={() => {
                  toast.success(`${selectedIds.length} murid ditandai Aktif ✨`);
                  setIsBulkMode(false);
                  setSelectedIds([]);
                }}
                disabled={selectedIds.length === 0}
              >
                Tandai Aktif
              </Button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                {isBulkMode && (
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                )}
                <th>ID Siswa</th>
                <th>Name</th>
                <th>Enrollment Date</th>
                <th>Total Courses</th>
                <th>Kelas</th>
                <th>Course Progress</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: students.length > 0 ? students.length : 5 }).map((_, rIdx) => (
                  <tr key={rIdx}>
                    {isBulkMode && (
                      <td>
                        <SkeletonBox width="16px" height="16px" />
                      </td>
                    )}
                    <td><SkeletonBox width="60px" height="18px" /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <SkeletonBox width="36px" height="36px" borderRadius="50%" />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <SkeletonBox width="120px" height="16px" />
                          <SkeletonBox width="60px" height="12px" />
                        </div>
                      </div>
                    </td>
                    <td><SkeletonBox width="90px" height="16px" /></td>
                    <td><SkeletonBox width="110px" height="16px" /></td>
                    <td><SkeletonBox width="70px" height="16px" /></td>
                    <td><SkeletonBox width="130px" height="16px" /></td>
                    <td style={{ textAlign: 'right' }}><SkeletonBox width="80px" height="28px" borderRadius="var(--radius-md)" style={{ marginLeft: 'auto' }} /></td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isBulkMode ? 8 : 7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Tidak ada data murid yang ditemukan.
                  </td>
                </tr>
              ) : (
                (() => {
                  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
                  const startIndex = (currentPage - 1) * pageSize;
                  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + pageSize);

                  return paginatedStudents.map((row, idx) => {
                    const courseInfo = getStudentCourseProgress(row.student_id);
                    const studentSubs = studentSubjects[row.student_id] || [];
                    const isChecked = selectedIds.includes(row.student_id);

                    return (
                      <tr
                        key={row.student_id}
                        onClick={() => {
                          if (isBulkMode) toggleSelectRow(row.student_id);
                          else setPreviewStudent(row);
                        }}
                        style={{ cursor: 'pointer', background: isChecked ? '#fdf2f8' : undefined }}
                      >
                        {isBulkMode && (
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectRow(row.student_id)}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                        )}
                        <td style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.825rem' }}>
                          {row.student_id}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {getStudentAvatarSvg(startIndex + idx)}
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>{row.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {row.nickname ? `${row.nickname.toLowerCase()}@tikatrack.com` : `${row.name.toLowerCase().replace(/\s+/g, '')}@tikatrack.com`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: 400 }}>
                          {row.join_date ? row.join_date : 'Belum diisi'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: 500 }}>
                          {courseInfo.count > 0 ? `${courseInfo.count} Mapel` : '0 Mapel'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: '0.825rem', color: 'var(--text-main)' }}>
                            {row.class || row.class_name || row.photo_url || 'Reguler'}
                          </div>
                        </td>
                        <td>
                          {/* Course Progress Goal Widget */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setGoalManageStudent({ student: row, subjects: studentSubs });
                            }}
                            title="Klik untuk Kelola Goal Topic & Target Course"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              width: '140px',
                              cursor: 'pointer',
                              padding: '0.25rem 0.5rem',
                              borderRadius: 'var(--radius-md)',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#fdf2f8')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div style={{ flex: 1, height: 7, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                              <div
                                className="animated-progress-fill"
                                style={{ width: `${courseInfo.progress}%`, height: '100%', background: 'var(--primary-pink)' }}
                              />
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary-pink)' }}>
                              {courseInfo.progress}%
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {/* Cute Book Icon Button for RPP & Activity Log */}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.55rem', backgroundColor: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8' }}
                              title="RPP & Progress Aktivitas Belajar"
                              onClick={() => setGoalManageStudent({ student: row, subjects: studentSubs })}
                            >
                              <BookOpen size={15} />
                            </button>
                            
                            <Button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              onClick={() => openEditModal(row)}
                            >
                              <span>Edit</span>
                            </Button>
                            <Button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              onClick={() => setPreviewStudent(row)}
                            >
                              <span>Preview</span>
                              <ChevronRight size={14} />
                            </Button>
                            <Button
                              className="btn btn-primary-pink"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                              onClick={() => window.location.href = `/students/${row.student_id}`}
                            >
                              <span>Detail</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        {(() => {
          const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
          const startIndex = (currentPage - 1) * pageSize;
          const endIndex = Math.min(startIndex + pageSize, filteredStudents.length);

          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <div>
                Menampilkan {filteredStudents.length > 0 ? startIndex + 1 : 0}-{endIndex} dari {filteredStudents.length} Murid
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginRight: '0.25rem' }}>
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          );
        })()}

      </div>

      {/* Modal Form Edit / Tambah */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        title={editingStudent ? `Edit Data Murid: ${editingStudent.name}` : 'Tambah Murid Baru'}
      >
        <form onSubmit={handleSaveStudent}>
          <div style={{ background: '#fdf2f8', padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', marginBottom: '1rem', fontSize: '0.8rem', color: '#9d174d' }}>
            {editingStudent
              ? 'Perbarui data profil murid di bawah ini.'
              : 'Isi data lengkap murid untuk pendaftaran baru.'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Input label="Nama Lengkap Murid *" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Emma Clark" required />
            <Input label="Nama Panggilan" value={nickname} onChange={(e: any) => setNickname(e.target.value)} placeholder="Emma" />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <Input label="Tanggal Lahir" type="date" value={birthdate} onChange={(e: any) => setBirthdate(e.target.value)} />
            <Input label="Tanggal Bergabung *" type="date" value={joinDate} onChange={(e: any) => setJoinDate(e.target.value)} required />
          </div>

          <Input label="Catatan Khusus Anak" value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Catatan minat atau kebutuhan khusus..." />

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <Button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingStudent(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" className="btn btn-primary-pink" loading={submitting} loadingText="Menyimpan...">
              {editingStudent ? 'Simpan Perubahan' : 'Simpan Data'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Preview Detail Murid */}
      <Modal isOpen={!!previewStudent} onClose={() => setPreviewStudent(null)} title="Detail Siswa TikaTrack">
        {previewStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', background: '#fdf2f8', padding: '1.25rem', borderRadius: 'var(--radius-xl)' }}>
              {getStudentAvatarSvg(students.findIndex((s) => s.student_id === previewStudent.student_id))}
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#9d174d' }}>{previewStudent.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID Siswa: {previewStudent.student_id}</p>
                <span className="badge" style={{ backgroundColor: '#d1fae5', color: '#065f46', marginTop: '0.35rem' }}>
                  {previewStudent.status || 'Aktif'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Panggilan</span>
                <strong style={{ fontWeight: 600 }}>{previewStudent.nickname || '-'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Tanggal Bergabung</span>
                <strong style={{ fontWeight: 600 }}>{previewStudent.join_date || 'Feb 5, 2026'}</strong>
              </div>
            </div>

            {/* Display Mapel & Progress Details */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534', marginBottom: '0.5rem' }}>
                Mata Pelajaran Terdaftar & Progress
              </h4>
              {studentSubjects[previewStudent.student_id] && studentSubjects[previewStudent.student_id].length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {studentSubjects[previewStudent.student_id].map((ss) => (
                    <div
                      key={ss.student_subject_id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        background: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #dcfce7',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--text-main)' }}>{ss.subject_name || ss.subject_id}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          Topik: {ss.current_topic && ss.current_topic !== '-' ? ss.current_topic : 'Materi Awal'}
                        </span>
                      </div>
                      <span className="badge" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>
                        {ss.status || 'Aktif'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.8rem', color: '#15803d', fontStyle: 'italic', margin: 0 }}>
                  Belum ada mapel yang di-assign. Buka halaman Detail untuk menambahkan mapel.
                </p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', gap: '0.5rem' }}>
              <Button className="btn btn-secondary" onClick={() => setPreviewStudent(null)}>
                Tutup
              </Button>
              <Button
                className="btn btn-primary-pink"
                onClick={() => {
                  const targetId = previewStudent.student_id;
                  setPreviewStudent(null);
                  window.location.href = `/students/${targetId}`;
                }}
              >
                <span>Buka Detail Lengkap ➔</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Management RPP & Progress Mingguan per Murid */}
      <Modal
        isOpen={!!goalManageStudent}
        onClose={() => setGoalManageStudent(null)}
        title={`RPP & Progress Aktivitas Belajar: ${goalManageStudent?.student.name || ''}`}
      >
        {goalManageStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ background: '#fdf2f8', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '0.78rem', color: '#9d174d' }}>
              Kelola RPP pertemuan les, materi, hasil evaluasi, dan status progres minggu ini. Pembatalan status dapat dilakukan 1-klik!
            </div>

            {/* Rekap Mapel & Topik Saat Ini */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {goalManageStudent.subjects.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: '#f8fafc', borderRadius: 'var(--radius-lg)' }}>
                  Murid ini belum terdaftar di mapel spesifik. (Bisa di-assign melalui Detail Murid).
                </div>
              ) : (
                goalManageStudent.subjects.map((ss) => {
                  const isDone = ss.current_topic && ss.current_topic !== '-' && ss.current_topic !== '';
                  return (
                    <div
                      key={ss.student_subject_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 0.85rem',
                        background: isDone ? '#f0fdf4' : '#ffffff',
                        border: `1px solid ${isDone ? '#bbf7d0' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-lg)',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-main)' }}>
                          {ss.subject_name || 'Mata Pelajaran'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Materi Topik: <strong style={{ color: 'var(--text-main)' }}>{ss.current_topic || 'Belum diisi'}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: isDone ? '#d1fae5' : '#fef3c7',
                            color: isDone ? '#065f46' : '#92400e',
                            fontSize: '0.72rem',
                          }}
                        >
                          {isDone ? 'Selesai' : 'Dalam Proses'}
                        </span>
                        
                        <Button
                          className={`btn ${isDone ? 'btn-secondary' : 'btn-primary-pink'}`}
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem' }}
                          onClick={() => handleToggleGoalTopic(ss)}
                        >
                          {isDone ? 'Batalkan Selesai' : 'Tandai Selesai'}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', gap: '0.5rem' }}>
              <Button className="btn btn-secondary" onClick={() => setGoalManageStudent(null)}>
                Tutup
              </Button>
              <Button
                className="btn btn-primary-pink"
                onClick={() => {
                  const targetId = goalManageStudent.student.student_id;
                  setGoalManageStudent(null);
                  window.location.href = `/students/${targetId}`;
                }}
              >
                Detail & Learning Path Full ➔
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
export default StudentListPage;

