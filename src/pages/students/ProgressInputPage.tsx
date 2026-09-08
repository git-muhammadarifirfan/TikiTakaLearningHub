import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Student, StudentSubject } from '../../types';
import { Button, Input, Modal, Select } from '../../components/ui';
import { Search, Plus, Calendar, CheckCircle2, Circle, Clock, Sparkles, BookOpen, User, ChevronRight, Edit3 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ActivityRecord {
  id: string;
  studentId: string;
  studentName: string;
  program: string;
  sessionNo: number;
  date: string;
  materi: string;
  hasil: string;
  status: 'Ongoing' | 'Completed';
  notes?: string;
}

export const ProgressInputPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<Record<string, StudentSubject[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dummy / State Activity Log Real sesuai acuan desain gambar (Enrolled Courses List Cards)
  const [activities, setActivities] = useState<ActivityRecord[]>([
    {
      id: 'ACT-001',
      studentId: 'S-001',
      studentName: 'Emma Clark',
      program: 'Bahasa Inggris (English Class)',
      sessionNo: 15,
      date: '2026-09-08',
      materi: 'Vocabulary & Simple Sentence Writing',
      hasil: 'Berhasil membuat 10 kalimat sendiri (Nilai 85/100)',
      status: 'Ongoing',
    },
    {
      id: 'ACT-002',
      studentId: 'S-002',
      studentName: 'Lucas Miller',
      program: 'JPA Penjumlahan (Math Class)',
      sessionNo: 20,
      date: '2026-09-07',
      materi: 'Penjumlahan 3 Digit tanpa Menyimpan',
      hasil: 'Sudah lancar tanpa hitung jari (Nilai 90/100)',
      status: 'Ongoing',
    },
    {
      id: 'ACT-003',
      studentId: 'S-003',
      studentName: 'Sophia Davis',
      program: 'Calistung (Catis Class)',
      sessionNo: 18,
      date: '2026-09-05',
      materi: 'Membaca Suku Kata KV-KVK',
      hasil: 'Tuntas membaca cerita pendek 2 paragraf',
      status: 'Completed',
    },
    {
      id: 'ACT-004',
      studentId: 'S-004',
      studentName: 'Ethan Wilson',
      program: 'Mewarnai & Seni Kreativitas',
      sessionNo: 12,
      date: '2026-09-04',
      materi: 'Gradasi Warna Crayon & Gambar Hewan',
      hasil: 'Pewarnaan rapi tidak keluar garis (Nilai 88/100)',
      status: 'Ongoing',
    },
  ]);

  // Modal Input Activity Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [programName, setProgramName] = useState<string>('');
  const [sessionNo, setSessionNo] = useState<number>(1);
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [materiText, setMateriText] = useState<string>('');
  const [hasilText, setHasilText] = useState<string>('');
  const [statusVal, setStatusVal] = useState<'Ongoing' | 'Completed'>('Ongoing');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchStudents = async () => {
    try {
      const data = await api.request<Student[]>('students/list');
      setStudents(data);
      if (data.length > 0) {
        setSelectedStudentId(data[0].student_id);
      }

      const ssMap: Record<string, StudentSubject[]> = {};
      await Promise.all(
        data.slice(0, 15).map(async (s) => {
          try {
            const details = await api.request<any>('students/get', { studentId: s.student_id });
            if (details && details.subjects) {
              ssMap[s.student_id] = details.subjects;
            }
          } catch (e) {}
        })
      );
      setStudentSubjects(ssMap);
    } catch (e) {
      toast.error('Gagal memuat data murid');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter Activities
  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      act.studentName.toLowerCase().includes(search.toLowerCase()) ||
      act.program.toLowerCase().includes(search.toLowerCase()) ||
      act.materi.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || act.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !materiText || !hasilText) {
      toast.error('Mohon lengkapi murid, materi, dan hasil pembelajaran!');
      return;
    }

    const st = students.find((s) => s.student_id === selectedStudentId);
    const newRecord: ActivityRecord = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      studentId: selectedStudentId,
      studentName: st ? st.name : 'Murid Bimbel',
      program: programName || 'Bimbel Reguler',
      sessionNo: Number(sessionNo),
      date: sessionDate,
      materi: materiText,
      hasil: hasilText,
      status: statusVal,
    };

    // Instant Fast Feedback
    toast.success('Aktivitas RPP berhasil dicatat & masuk ke Laporan! 🌸');
    setActivities([newRecord, ...activities]);
    setIsAddModalOpen(false);

    // Sync to backend Google Sheets LearningPathLog in background
    try {
      api.invalidateCache();
      const subs = studentSubjects[selectedStudentId] || [];
      const ssId = subs.length > 0 ? subs[0].student_subject_id : 'SS-001';
      await api.request('learning-path/create', {
        student_subject_id: ssId,
        date: sessionDate,
        topic: materiText,
        topic_status: statusVal === 'Completed' ? 'selesai' : 'dalam_proses',
        notes: hasilText,
      });
    } catch (err) {}

    // Reset Form
    setMateriText('');
    setHasilText('');
  };

  // Toggle Status Selesai / Ongoing
  const handleToggleStatus = (id: string) => {
    setActivities((prev) =>
      prev.map((act) => {
        if (act.id === id) {
          const nextStatus = act.status === 'Ongoing' ? 'Completed' : 'Ongoing';
          toast.success(`Status aktivitas diubah menjadi ${nextStatus} ✨`);
          return { ...act, status: nextStatus };
        }
        return act;
      })
    );
  };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header & Add Activity Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 600 }}>Activity & RPP Belajar Murid 📝</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Catatan Pertemuan, Materi, & Hasil Pembelajaran (Otomatis direkap untuk Laporan 2 Mingguan / Bulanan)
          </p>
        </div>
        <Button className="btn btn-primary-pink" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} />
          <span>Tambah Activity Pertemuan Baru</span>
        </Button>
      </div>

      {/* Toolbar Search & Status Filters */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="search-input-wrapper" style={{ width: '320px' }}>
            <Search size={16} className="search-input-icon" />
            <input
              type="text"
              placeholder="Cari nama murid, program, atau materi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Select
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'ongoing', label: 'Ongoing' },
                { value: 'completed', label: 'Completed' },
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
            />
          </div>
        </div>
      </div>

      {/* Main List of Activity Cards (Desain 100% Persis Acuan Gambar Enrolled Courses Cards) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredActivities.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Belum ada catatan aktivitas pertemuan yang sesuai.
          </div>
        ) : (
          filteredActivities.map((act, idx) => {
            const isCompleted = act.status === 'Completed';
            const bgIcons = ['#fdf2f8', '#eff6ff', '#fefce8', '#f3e8ff'];
            const iconBg = bgIcons[idx % bgColsLength(bgIcons)];

            return (
              <div
                key={act.id}
                className="card animate-fade-in"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  borderRadius: 'var(--radius-xl)',
                  transition: 'all 0.2s ease',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Left Side: Avatar/Icon + Nama Murid & Program */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flex: 1.2, minWidth: '220px' }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <BookOpen size={24} color="var(--primary-pink)" />
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                      {act.studentName}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#db2777', fontWeight: 500 }}>
                      {act.program}
                    </div>
                  </div>
                </div>

                {/* Middle 1: Sesi Pertemuan & Tanggal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={16} color="var(--text-light)" />
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Pertemuan ke-{act.sessionNo}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={16} color="var(--text-light)" />
                    <span>{act.date}</span>
                  </div>
                </div>

                {/* Middle 2: Materi & Hasil Pembelajaran */}
                <div style={{ flex: 1.5, minWidth: '220px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                    📖 {act.materi}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    🎯 Hasil: <span style={{ color: '#047857', fontWeight: 500 }}>{act.hasil}</span>
                  </div>
                </div>

                {/* Right Side: Status Badge & Interactive Toggle Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: isCompleted ? '#fce7f3' : '#fef9c3',
                      color: isCompleted ? '#9d174d' : '#854d0e',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    {act.status}
                  </span>

                  <Button
                    className={`btn ${isCompleted ? 'btn-secondary' : 'btn-primary-pink'}`}
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem' }}
                    onClick={() => handleToggleStatus(act.id)}
                  >
                    {isCompleted ? 'Set Ongoing' : 'Set Selesai'}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Input Activity Pertemuan Baru */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Input Activity Pertemuan RPP"
      >
        <form onSubmit={handleCreateActivity}>
          <div style={{ background: '#fdf2f8', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)', marginBottom: '0.85rem', fontSize: '0.78rem', color: '#9d174d' }}>
            Isi lembar aktivitas pertemuan di bawah ini. Hasil pembelajaran akan langsung direkap otomatis untuk Laporan Evaluasi Murid.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Pilih Murid Bimbel *</label>
              <select
                className="input-field"
                value={selectedStudentId}
                onChange={(e) => {
                  const sId = e.target.value;
                  setSelectedStudentId(sId);
                  const subs = studentSubjects[sId] || [];
                  if (subs.length > 0) setProgramName(subs[0].subject_name || 'Bimbel Reguler');
                }}
                required
              >
                <option value="">-- Pilih Murid --</option>
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.name} ({s.student_id})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Program / Class *"
              value={programName}
              onChange={(e: any) => setProgramName(e.target.value)}
              placeholder="English Class / Math Class"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Input
              label="Pertemuan Ke- *"
              type="number"
              value={sessionNo}
              onChange={(e: any) => setSessionNo(e.target.value)}
              required
            />
            <Input
              label="Tanggal Pertemuan *"
              type="date"
              value={sessionDate}
              onChange={(e: any) => setSessionDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Materi Pembelajaran (RPP) *"
            value={materiText}
            onChange={(e: any) => setMateriText(e.target.value)}
            placeholder="Vocabulary & Simple Sentence Writing"
            required
          />

          <Input
            label="Hasil Pembelajaran & Nilai *"
            value={hasilText}
            onChange={(e: any) => setHasilText(e.target.value)}
            placeholder="Berhasil membuat 10 kalimat sendiri (Nilai 85/100)"
            required
          />

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Status Pertemuan</label>
            <select
              className="input-field"
              value={statusVal}
              onChange={(e: any) => setStatusVal(e.target.value as any)}
            >
              <option value="Ongoing">Ongoing (Berjalan)</option>
              <option value="Completed">Completed (Selesai Tuntas)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <Button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" className="btn btn-primary-pink" disabled={submitting}>
              Simpan Activity RPP
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

// Helper array length safety
function bgColsLength(arr: string[]) {
  return arr.length;
}

export default ProgressInputPage;
