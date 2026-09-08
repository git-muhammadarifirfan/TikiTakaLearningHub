import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, BookOpen, Plus, Edit2, Trash2, Users, FileText, CheckCircle2 } from 'lucide-react';
import { Button, Input, Modal, Select, MultiSelect, SkeletonBox } from '../../components/ui';
import { api } from '../../api/client';
import { Schedule, User as UserType, StudentSubject, Student, Subject } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const noteStyles = [
  { bg: '#f8fafc', border: '#e2e8f0', headerBg: '#f1f5f9', text: '#334155', badgeBg: '#e2e8f0', badgeColor: '#475569', accent: '#475569' },
  { bg: '#fdf2f8', border: '#fbcfe8', headerBg: '#fce7f3', text: '#831843', badgeBg: '#fbcfe8', badgeColor: '#9d174d', accent: '#db2777' },
  { bg: '#f0fdf4', border: '#bbf7d0', headerBg: '#dcfce7', text: '#14532d', badgeBg: '#d1fae5', badgeColor: '#065f46', accent: '#16a34a' },
  { bg: '#eff6ff', border: '#bfdbfe', headerBg: '#dbeafe', text: '#1e3a8a', badgeBg: '#e0e7ff', badgeColor: '#3730a3', accent: '#2563eb' },
  { bg: '#faf5ff', border: '#e9d5ff', headerBg: '#f3e8ff', text: '#581c87', badgeBg: '#ddd6fe', badgeColor: '#6b21a8', accent: '#9333ea' },
  { bg: '#fff7ed', border: '#fed7aa', headerBg: '#ffedd5', text: '#7c2d12', badgeBg: '#fed7aa', badgeColor: '#9a3412', accent: '#ea580c' },
];

interface TimeGroup {
  key: string;
  day: string;
  start_time: string;
  end_time: string;
  events: Schedule[];
}

function groupByTimeSlot(schedules: Schedule[]): TimeGroup[] {
  const map: Record<string, TimeGroup> = {};
  schedules.forEach((s) => {
    const key = `${s.day_of_week}_${s.start_time}_${s.end_time}`;
    if (!map[key]) {
      map[key] = { key, day: s.day_of_week || '', start_time: s.start_time || '', end_time: s.end_time || '', events: [] };
    }
    map[key].events.push(s);
  });
  return Object.values(map);
}

export const SchedulePage: React.FC = () => {
  const { user } = useAuth();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<UserType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<StudentSubject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTeacher, setSelectedTeacher] = useState<string>(user?.role === 'guru' ? user.user_id : '');
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Modal CRUD State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // Form State
  const [formSelectedStudents, setFormSelectedStudents] = useState<string[]>([]);
  const [formSelectedSubjects, setFormSelectedSubjects] = useState<string[]>([]);
  const [formDay, setFormDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu'>('Senin');
  const [formStartTime, setFormStartTime] = useState('15:00');
  const [formEndTime, setFormEndTime] = useState('16:30');
  const [submitting, setSubmitting] = useState(false);

  const fetchScheduleData = async (skipCache = false) => {
    try {
      if (skipCache) api.invalidateCache();
      
      const cachedSchs = api.getCached<Schedule[]>('schedules/list');
      if (cachedSchs && !skipCache) {
        setSchedules(cachedSchs);
        setLoading(false);
      }

      const [schs, teacherList, studentList, subjectList] = await Promise.all([
        api.request<Schedule[]>('schedules/list', undefined, { skipCache }),
        api.request<UserType[]>('teachers/list', undefined, { skipCache }),
        api.request<Student[]>('students/list', undefined, { skipCache }),
        api.request<Subject[]>('subjects/list', undefined, { skipCache }),
      ]);

      setSchedules(schs);
      setTeachers(teacherList);
      setStudents(studentList);
      setSubjects(subjectList);

      const allSS: StudentSubject[] = [];
      await Promise.all(
        studentList.slice(0, 30).map(async (s) => {
          try {
            const details = await api.request<any>('students/get', { studentId: s.student_id }, { skipCache });
            if (details && details.subjects) {
              allSS.push(...details.subjects);
            }
          } catch (e) {}
        })
      );
      setStudentSubjects(allSS);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat jadwal les');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

  const daysList: Array<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu'> = [
    'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
  ];

  const filteredSchedules = schedules.filter((s) => {
    const matchesTeacher = !selectedTeacher || s.teacher_id === selectedTeacher || s.teacher_name?.includes(selectedTeacher);
    const matchesDay = !selectedDay || s.day_of_week === selectedDay;
    return matchesTeacher && matchesDay;
  });

  const teacherOptions = [
    { value: '', label: 'Semua Guru' },
    ...teachers.map((t) => ({ value: t.user_id, label: t.name })),
  ];

  const dayOptions = [
    { value: '', label: 'Semua Hari' },
    ...daysList.map((d) => ({ value: d, label: d })),
  ];

  const studentOptions = students.map((s) => ({
    value: s.student_id,
    label: `${s.name}${s.nickname ? ` (${s.nickname})` : ''}`,
  }));

  const subjectOptions = subjects.map((s) => ({
    value: s.subject_id,
    label: s.subject_name,
  }));

  const openAddModal = (defaultDay?: typeof formDay) => {
    setEditingSchedule(null);
    setFormSelectedStudents([]);
    setFormSelectedSubjects([]);
    setFormDay(defaultDay || 'Senin');
    setFormStartTime('15:00');
    setFormEndTime('16:30');
    setIsModalOpen(true);
  };

  const openEditModal = (sch: Schedule) => {
    setEditingSchedule(sch);
    setFormSelectedStudents([]);
    setFormSelectedSubjects([]);
    setFormDay(sch.day_of_week || 'Senin');
    setFormStartTime(sch.start_time || '08:00');
    setFormEndTime(sch.end_time || '09:30');
    setIsModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingSchedule;

    if (isEdit) {
      setSubmitting(true);
      try {
        await api.request('schedules/update', {
          scheduleId: editingSchedule!.schedule_id,
          day_of_week: formDay,
          start_time: formStartTime,
          end_time: formEndTime,
        });
        toast.success('Jadwal berhasil diperbarui!');
        setIsModalOpen(false);
        await fetchScheduleData(true);
      } catch (err: any) {
        toast.error(err.message || 'Gagal memperbarui jadwal');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (formSelectedStudents.length === 0) { toast.error('Pilih minimal 1 murid'); return; }
    if (formSelectedSubjects.length === 0) { toast.error('Pilih minimal 1 mapel'); return; }

    const matchingPairs: string[] = [];
    for (const studentId of formSelectedStudents) {
      for (const subjectId of formSelectedSubjects) {
        const match = studentSubjects.find((ss) => ss.student_id === studentId && ss.subject_id === subjectId);
        if (match) matchingPairs.push(match.student_subject_id);
      }
    }

    if (matchingPairs.length === 0) {
      toast.error('Murid belum di-assign ke mapel yang dipilih. Assign dulu di halaman Detail Murid.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(`Membuat ${matchingPairs.length} jadwal...`);
    try {
      let ok = 0;
      for (const ssId of matchingPairs) {
        try {
          await api.request('schedules/create', { student_subject_id: ssId, day_of_week: formDay, start_time: formStartTime, end_time: formEndTime });
          ok++;
        } catch (e) {}
      }
      if (ok > 0) {
        toast.success(`${ok} jadwal berhasil dibuat!`, { id: toastId });
        setIsModalOpen(false);
        await fetchScheduleData(true);
      } else {
        toast.error('Gagal membuat jadwal.', { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan jadwal', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!window.confirm('Yakin ingin menghapus sesi jadwal ini?')) return;
    try {
      await api.request('schedules/delete', { scheduleId });
      toast.success('Jadwal dihapus!');
      await fetchScheduleData(true);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus jadwal');
    }
  };

  const todayIdx = new Date().getDay();
  const todayMap: Record<number, string> = { 0: 'Minggu', 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu' };
  const todayName = todayMap[todayIdx] || '';

  return (
    <div className="page-container page-transition" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarIcon size={24} style={{ color: 'var(--primary-pink)' }} />
            <span>Jadwal Les</span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Dashboard / <span style={{ color: 'var(--primary-pink)' }}>Jadwal</span>
          </p>
        </div>
        <Button className="btn btn-primary-pink" onClick={() => openAddModal()}>
          <Plus size={16} />
          <span>Tambah Jadwal</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ width: '220px' }}>
            <Select label="Guru" value={selectedTeacher} onChange={setSelectedTeacher} options={teacherOptions} />
          </div>
          <div style={{ width: '180px' }}>
            <Select label="Hari" value={selectedDay} onChange={setSelectedDay} options={dayOptions} />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {loading ? <SkeletonBox width="120px" height="16px" /> : `Total ${filteredSchedules.length} sesi les`}
          </div>
        </div>
      </div>

      {/* Day Columns Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {daysList.map((day) => {
          const dayEvents = filteredSchedules.filter((s) => s.day_of_week === day);
          const groups = groupByTimeSlot(dayEvents);
          const isToday = day === todayName;

          groups.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

          return (
            <div
              key={day}
              style={{
                background: '#ffffff',
                border: `1.5px solid ${isToday ? '#ec4899' : 'var(--border)'}`,
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minHeight: '340px',
                boxShadow: isToday ? '0 4px 12px rgba(236, 72, 153, 0.12)' : 'none',
              }}
            >
              {/* Day Header */}
              <div style={{
                padding: '0.75rem 1rem',
                background: isToday ? 'linear-gradient(135deg, #fdf2f8, #fce7f3)' : '#f8fafc',
                borderBottom: `1px solid ${isToday ? '#fbcfe8' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: isToday ? '#db2777' : 'var(--text-main)' }}>{day}</h4>
                  {isToday && (
                    <span style={{
                      fontSize: '0.62rem', fontWeight: 700, color: '#fff',
                      backgroundColor: '#ec4899', borderRadius: '9999px',
                      padding: '2px 8px', lineHeight: '1.4',
                    }}>
                      Hari Ini
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, color: isToday ? '#9d174d' : 'var(--text-muted)',
                    backgroundColor: isToday ? '#fce7f3' : '#e2e8f0',
                    borderRadius: '9999px', padding: '2px 8px',
                  }}>
                    {dayEvents.length} Sesi
                  </span>
                  <button
                    onClick={() => openAddModal(day)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--primary-pink)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                    title={`Tambah sesi hari ${day}`}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Cards Body */}
              <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#fafafa' }}>
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <SkeletonBox key={i} width="100%" height="90px" borderRadius="var(--radius-lg)" />
                  ))
                ) : groups.length > 0 ? (
                  groups.map((group, gIdx) => {
                    const style = noteStyles[gIdx % noteStyles.length];
                    return (
                      <div
                        key={group.key}
                        style={{
                          background: style.bg,
                          borderRadius: '14px',
                          border: `1.5px solid ${style.border}`,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Time Slot Header */}
                        <div style={{
                          padding: '0.5rem 0.75rem',
                          background: style.headerBg,
                          borderBottom: `1px solid ${style.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: style.text, fontSize: '0.78rem', fontWeight: 800 }}>
                            <Clock size={13} style={{ color: style.accent }} />
                            <span>{group.start_time} - {group.end_time}</span>
                          </div>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700,
                            backgroundColor: style.badgeBg, color: style.badgeColor,
                            borderRadius: '9999px', padding: '1px 7px',
                          }}>
                            {group.events.length} Murid
                          </span>
                        </div>

                        {/* Details Content */}
                        <div style={{ padding: '0.65rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                          {group.events.map((evt, eIdx) => (
                            <div
                              key={evt.schedule_id}
                              style={{
                                background: '#ffffff',
                                borderRadius: '10px',
                                padding: '0.55rem 0.75rem',
                                border: `1px solid ${style.border}`,
                                display: 'flex', flexDirection: 'column', gap: '0.25rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                  <span style={{
                                    fontSize: '0.65rem', fontWeight: 800,
                                    width: 20, height: 20, borderRadius: '50%',
                                    backgroundColor: style.accent, color: '#ffffff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>
                                    {eIdx + 1}
                                  </span>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <User size={13} style={{ color: 'var(--text-muted)' }} />
                                    {evt.student_name || evt.student_nickname || 'Murid'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.2rem' }}>
                                  <button
                                    onClick={() => openEditModal(evt)}
                                    style={{ border: 'none', background: 'transparent', color: style.accent, cursor: 'pointer', padding: '2px' }}
                                    title="Edit Jam"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSchedule(evt.schedule_id)}
                                    style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                                    title="Hapus"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              <div style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '1.65rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <BookOpen size={12} style={{ color: style.accent }} />
                                <span>{evt.subject_name || 'Mapel'}</span>
                              </div>

                              {evt.teacher_name && (
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', paddingLeft: '1.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <User size={11} />
                                  <span>Guru: {evt.teacher_name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{
                    fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center',
                    margin: 'auto', fontStyle: 'italic', padding: '1.5rem 0',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem'
                  }}>
                    <CalendarIcon size={24} style={{ opacity: 0.3 }} />
                    <span>Tidak ada jadwal</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal CRUD */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Edit Jam Sesi' : 'Tambah Sesi Les Baru'}
      >
        <form onSubmit={handleSaveSchedule}>
          {!editingSchedule && (
            <>
              <div style={{ background: '#fdf2f8', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '0.78rem', color: '#9d174d', marginBottom: '1rem' }}>
                Pilih murid dan mata pelajaran untuk membuat jadwal les.
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <MultiSelect
                  label="Pilih Murid"
                  values={formSelectedStudents}
                  onChange={setFormSelectedStudents}
                  options={studentOptions}
                  placeholder="Pilih murid..."
                  selectAllLabel="Semua Murid"
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <MultiSelect
                  label="Pilih Mata Pelajaran"
                  values={formSelectedSubjects}
                  onChange={setFormSelectedSubjects}
                  options={subjectOptions}
                  placeholder="Pilih mapel..."
                  selectAllLabel="Semua Mapel"
                  required
                />
              </div>

              {formSelectedStudents.length > 0 && formSelectedSubjects.length > 0 && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-lg)', fontSize: '0.78rem', color: '#166534',
                  marginBottom: '1rem', fontWeight: 600,
                }}>
                  Total: {formSelectedStudents.length} murid × {formSelectedSubjects.length} mapel
                </div>
              )}
            </>
          )}

          {editingSchedule && (
            <div style={{ background: '#fdf2f8', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '0.78rem', color: '#9d174d', marginBottom: '1rem' }}>
              Edit hari dan waktu jam les untuk sesi murid ini.
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <Select label="Hari Les" value={formDay} onChange={(val) => setFormDay(val as any)} options={daysList.map((d) => ({ value: d, label: d }))} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input label="Jam Mulai" type="time" value={formStartTime} onChange={(e: any) => setFormStartTime(e.target.value)} required />
            <Input label="Jam Selesai" type="time" value={formEndTime} onChange={(e: any) => setFormEndTime(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" className="btn btn-primary-pink" loading={submitting} loadingText="Menyimpan...">
              {editingSchedule ? 'Simpan Perubahan' : 'Simpan Sesi Jadwal'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SchedulePage;
