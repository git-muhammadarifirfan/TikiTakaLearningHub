import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Report, Student, Subject, User } from '../types';
import { Button, Input, Modal, Select, SkeletonBox } from '../components/ui';
import { FileText, Send, Plus, ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_TARGET_WA = '6285730499063';

export const ReportListPage: React.FC = () => {
  const { user } = useAuth();
  const cachedReports = api.getCached<Report[]>('reports/list');
  const cachedStudents = api.getCached<Student[]>('students/list');
  const cachedSubjects = api.getCached<Subject[]>('subjects/list');
  const cachedTeachers = api.getCached<User[]>('teachers/list');

  const [reports, setReports] = useState<Report[]>(cachedReports || []);
  const [students, setStudents] = useState<Student[]>(cachedStudents || []);
  const [subjects, setSubjects] = useState<Subject[]>(cachedSubjects || []);
  const [teachers, setTeachers] = useState<User[]>(cachedTeachers || []);
  const [loading, setLoading] = useState(!cachedReports);

  // Modal Create Report
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSubjectName, setSelectedSubjectName] = useState('Bahasa Inggris');
  const [teacherName, setTeacherName] = useState(user?.name || 'Miss Aura');
  const [periodLabel, setPeriodLabel] = useState('Minggu ke-3 dan ke-4 Bulan Agustus 2026');
  const [achievements, setAchievements] = useState('-\n-\n-\n-');
  const [nextProgress, setNextProgress] = useState('-\n-\n-\n-');
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchReports = async (skipCache = false) => {
    try {
      const data = await api.request<Report[]>('reports/list', undefined, { skipCache });
      const stds = await api.request<Student[]>('students/list', undefined, { skipCache });
      const subs = await api.request<Subject[]>('subjects/list', undefined, { skipCache });
      const tchs = await api.request<User[]>('teachers/list', undefined, { skipCache });

      setReports(data);
      setStudents(stds);
      setSubjects(subs);
      setTeachers(tchs);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Encodes text properly with emoji 🥰 intact so WhatsApp web doesn't turn it into a question mark (?)
  const formatReportMessage = (rpt: Partial<Report> & { teacher_name_custom?: string; subject_name_custom?: string }) => {
    const student = students.find((s) => s.student_id === rpt.student_id);
    const studentName = student?.name || rpt.student_name || 'Abraham';
    const programName = rpt.subject_name_custom || rpt.subject_name || 'Bahasa Inggris';
    const teacher = rpt.teacher_name_custom || rpt.teacher_name || user?.name || 'Miss Aura';
    const period = rpt.period_label || 'Minggu ke-3 dan ke-4 Bulan Agustus 2026';

    const formatBulletPoints = (text?: string) => {
      if (!text) return '';
      return text
        .split('\n')
        .map((line) => {
          const trimmed = line.trim();
          if (!trimmed) return '';
          if (trimmed.startsWith('-') || trimmed.startsWith('•')) return trimmed;
          return `- ${trimmed}`;
        })
        .filter(Boolean)
        .join('\n');
    };

    const achsFormatted = formatBulletPoints(rpt.achievements);
    const nextFormatted = formatBulletPoints(rpt.next_progress);

    return `Selamat siang, Bunda🥰 Kami ingin melaporkan hasil belajar Ananda ${studentName}

Laporan Hasil Belajar Bimbel Tiki Taka ${period}

Program: ${programName}
Nama Murid: ${studentName}
Guru Pembimbing: ${teacher}

Capaian Belajar:
${achsFormatted}

Harapan Progres Selanjutnya:
${nextFormatted}

Semoga kedepannya Ananda semakin semangat belajar dan percaya diri ya, Bunda🥰`;
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !achievements || !nextProgress) {
      toast.error('Harap lengkapi semua bidang laporan');
      return;
    }

    setSubmitting(true);
    try {
      const newReport: Partial<Report> = {
        student_id: selectedStudentId,
        student_subject_id: 'SS-001',
        period_type: 'mingguan',
        period_label: periodLabel,
        subject_name: selectedSubjectName,
        teacher_name: teacherName,
        achievements,
        next_progress: nextProgress,
      };

      await api.request('reports/create', newReport);
      api.invalidateCache();
      toast.success('Draft laporan belajar berhasil dibuat!');
      setIsModalOpen(false);
      await fetchReports(true);

      const message = formatReportMessage(newReport);
      const encodedText = encodeURIComponent(message);
      const waUrl = `https://api.whatsapp.com/send?phone=${DEFAULT_TARGET_WA}&text=${encodedText}`;
      window.open(waUrl, '_blank');

    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat laporan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWA = (rpt: Report) => {
    const message = formatReportMessage(rpt);
    const encodedText = encodeURIComponent(message);
    // Use api.whatsapp.com for 100% correct UTF-8 emoji preservation across web & app
    const waUrl = `https://api.whatsapp.com/send?phone=${DEFAULT_TARGET_WA}&text=${encodedText}`;

    api.request('reports/mark-sent', { reportId: rpt.report_id, messageSent: message })
      .then(() => fetchReports(true))
      .catch(() => {});

    window.open(waUrl, '_blank');
  };

  const handleCopyReport = (rpt: Report) => {
    const message = formatReportMessage(rpt);
    navigator.clipboard.writeText(message);
    setCopiedId(rpt.report_id);
    toast.success('Teks laporan berhasil disalin!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="page-container page-transition" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={24} style={{ color: 'var(--primary-pink)' }} />
            <span>Laporan Hasil Belajar (WA Direct)</span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Target WA Kirim Otomatis: <strong style={{ color: '#16a34a' }}>+62 857-3049-9063</strong>
          </p>
        </div>
        <Button className="btn btn-primary-pink" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Buat Laporan Baru</span>
        </Button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Laporan</th>
              <th>Nama Murid</th>
              <th>Program Mapel</th>
              <th>Periode Laporan</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Aksi Kirim (+62 857-3049-9063)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  <td><SkeletonBox width="70px" height="18px" /></td>
                  <td><SkeletonBox width="120px" height="18px" /></td>
                  <td><SkeletonBox width="100px" height="18px" /></td>
                  <td><SkeletonBox width="180px" height="18px" /></td>
                  <td><SkeletonBox width="75px" height="22px" borderRadius="9999px" /></td>
                  <td style={{ textAlign: 'right' }}><SkeletonBox width="140px" height="28px" borderRadius="var(--radius-md)" style={{ marginLeft: 'auto' }} /></td>
                </tr>
              ))
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <FileText size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <div>Belum ada laporan belajar yang dibuat. Klik "Buat Laporan Baru" di atas.</div>
                </td>
              </tr>
            ) : (
              reports.map((rpt) => {
                const std = students.find((s) => s.student_id === rpt.student_id);
                return (
                  <tr key={rpt.report_id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary-pink)' }}>{rpt.report_id}</td>
                    <td style={{ fontWeight: 600 }}>{std?.name || rpt.student_name || rpt.student_id}</td>
                    <td><span className="badge badge-info">{rpt.subject_name || 'Bahasa Inggris'}</span></td>
                    <td style={{ fontSize: '0.82rem' }}>{rpt.period_label}</td>
                    <td>
                      <span className={`badge ${rpt.status === 'terkirim' ? 'badge-success' : 'badge-warning'}`}>
                        {rpt.status === 'terkirim' ? 'Terkirim' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <Button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          onClick={() => handleCopyReport(rpt)}
                          title="Salin teks laporan"
                        >
                          {copiedId === rpt.report_id ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                          <span>{copiedId === rpt.report_id ? 'Tersalin' : 'Copy'}</span>
                        </Button>
                        <Button
                          className="btn btn-primary-yellow"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                          onClick={() => handleSendWA(rpt)}
                        >
                          <Send size={13} />
                          <span>Kirim Ke WA</span>
                          <ExternalLink size={11} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Buat Laporan */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat & Kirim Laporan ke WhatsApp">
        <form onSubmit={handleCreateReport}>
          
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '0.78rem', color: '#166534', marginBottom: '1.25rem', fontWeight: 600 }}>
            Laporan akan dikirim ke WhatsApp +62 857-3049-9063 setelah disimpan.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Pilih Murid *</label>
              <select
                className="input-field"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
              >
                <option value="">-- Pilih Murid --</option>
                {students.map((s) => (
                  <option key={s.student_id} value={s.student_id}>{s.name}{s.nickname ? ` (${s.nickname})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Program Mapel *</label>
              <select
                className="input-field"
                value={selectedSubjectName}
                onChange={(e) => setSelectedSubjectName(e.target.value)}
                required
              >
                {subjects.length > 0 ? (
                  subjects.map((sub) => (
                    <option key={sub.subject_id} value={sub.subject_name}>{sub.subject_name}</option>
                  ))
                ) : (
                  <>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Calistung">Calistung</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <Input
              label="Guru Pembimbing *"
              value={teacherName}
              onChange={(e: any) => setTeacherName(e.target.value)}
              placeholder="Contoh: Miss Aura"
              required
            />
            <Input
              label="Periode Laporan *"
              value={periodLabel}
              onChange={(e: any) => setPeriodLabel(e.target.value)}
              placeholder="Contoh: Minggu ke-3 dan ke-4 Bulan Agustus 2026"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Capaian Belajar (per baris) *</label>
            <textarea
              className="input-field"
              rows={4}
              placeholder="- Ananda mengenal dan menghafal nama-nama hari..."
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Harapan Progres Selanjutnya (per baris) *</label>
            <textarea
              className="input-field"
              rows={4}
              placeholder="- Review materi Animals..."
              value={nextProgress}
              onChange={(e) => setNextProgress(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" className="btn btn-primary-pink" loading={submitting} loadingText="Menyimpan...">
              Simpan & Kirim ke WA
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReportListPage;
