import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Schedule, Attendance, StatusAbsensi } from '../../types';
import { Button, Modal, SkeletonBox } from '../../components/ui';
import { Clock, CheckCircle, AlertCircle, Plus, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AttendancePage: React.FC = () => {
  const cachedSchedules = api.getCached<Schedule[]>('schedules/list');
  const cachedAtts = api.getCached<Attendance[]>(`attendance/today_${JSON.stringify({ date: new Date().toISOString().split('T')[0] })}`);
  
  const [schedules, setSchedules] = useState<Schedule[]>(cachedSchedules || []);
  const [attendances, setAttendances] = useState<Attendance[]>(cachedAtts || []);
  const [loading, setLoading] = useState(!cachedSchedules);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal Record Attendance
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [status, setStatus] = useState<StatusAbsensi>('hadir');
  const [topicCovered, setTopicCovered] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal Trigger Kelas Pengganti Auto
  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);
  const [makeupDate, setMakeupDate] = useState('');
  const [makeupTime, setMakeupTime] = useState('15:00');
  const [makeupDuration, setMakeupDuration] = useState(1.5);
  const [lastAttendanceId, setLastAttendanceId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const schs = await api.request<Schedule[]>('schedules/list');
      const atts = await api.request<Attendance[]>('attendance/today', { date: selectedDate });
      setSchedules(schs);
      setAttendances(atts);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat presensi hari ini');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleRecordAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    setSubmitting(true);
    try {
      const result = await api.request<Attendance>('attendance/record', {
        schedule_id: selectedSchedule.schedule_id,
        student_subject_id: selectedSchedule.student_subject_id,
        date: selectedDate,
        status,
        topic_covered: topicCovered,
        notes,
      });

      toast.success('Presensi berhasil dicatat!');
      setIsRecordModalOpen(false);

      // Jika bukan 'hadir', tawarkan penjadwalan kelas pengganti
      if (status !== 'hadir' && status !== 'selesai' && status !== 'Hadir') {
        setLastAttendanceId(result.attendance_id);
        setIsMakeupModalOpen(true);
      }

      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mencatat presensi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleMakeup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !makeupDate) return;

    setSubmitting(true);
    try {
      await api.request('makeup/schedule', {
        original_attendance_id: lastAttendanceId,
        student_subject_id: selectedSchedule.student_subject_id,
        original_date: selectedDate,
        makeup_date: makeupDate,
        makeup_start_time: makeupTime,
        duration_hours: makeupDuration,
      });
      toast.success('Kelas pengganti berhasil dijadwalkan!');
      setIsMakeupModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menjadwalkan kelas pengganti');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container page-transition">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Presensi Harian</h1>
          <p style={{ color: 'var(--text-muted)' }}>Catat kehadiran murid per jadwal les dan materi yang dipelajari.</p>
        </div>

        <input
          type="date"
          className="input-field"
          style={{ width: 'auto', fontWeight: 700 }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Jadwal / Siswa</th>
              <th>Mata Pelajaran</th>
              <th>Pengajar</th>
              <th>Jam Les</th>
              <th>Status Presensi</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: schedules.length > 0 ? schedules.length : 5 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  <td><SkeletonBox width="110px" height="18px" /></td>
                  <td><SkeletonBox width="90px" height="18px" /></td>
                  <td><SkeletonBox width="100px" height="18px" /></td>
                  <td><SkeletonBox width="80px" height="18px" /></td>
                  <td><SkeletonBox width="70px" height="22px" borderRadius="9999px" /></td>
                  <td style={{ textAlign: 'right' }}><SkeletonBox width="90px" height="28px" borderRadius="var(--radius-md)" style={{ marginLeft: 'auto' }} /></td>
                </tr>
              ))
            ) : schedules.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Tidak ada jadwal untuk tanggal ini.</td></tr>
            ) : (
              schedules.map((sch) => {
                const att = attendances.find((a) => a.schedule_id === sch.schedule_id || a.student_subject_id === sch.student_subject_id);
                return (
                  <tr key={sch.schedule_id}>
                    <td style={{ fontWeight: 700 }}>{sch.student_name || 'Siswa'}</td>
                    <td>{sch.subject_name || '-'}</td>
                    <td>{sch.teacher_name || '-'}</td>
                    <td>{sch.start_time} - {sch.end_time}</td>
                    <td>
                      {att ? (
                        <span className={`badge ${att.status === 'hadir' || att.status === 'Hadir' ? 'badge-success' : 'badge-warning'}`}>
                          {att.status}
                        </span>
                      ) : (
                        <span className="badge badge-danger">Belum Dicatat</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        className="btn btn-primary-pink"
                        style={{ padding: '0.4rem 0.85rem' }}
                        onClick={() => {
                          setSelectedSchedule(sch);
                          setIsRecordModalOpen(true);
                        }}
                      >
                        <Clock size={14} />
                        <span>{att ? 'Edit Absen' : 'Catat Absen'}</span>
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Catat Absen */}
      <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} title="Catat Kehadiran Sesi Les">
        {selectedSchedule && (
          <form onSubmit={handleRecordAttendance}>
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--pink-light)', borderRadius: 'var(--radius-md)' }}>
              <strong>{selectedSchedule.student_name}</strong> — {selectedSchedule.subject_name} ({selectedSchedule.start_time})
            </div>

            <div className="input-group">
              <label className="input-label">Status Kehadiran *</label>
              <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value as StatusAbsensi)}>
                <option value="hadir">Hadir (Selesai)</option>
                <option value="izin">Izin (Butuh Kelas Pengganti)</option>
                <option value="sakit">Sakit (Butuh Kelas Pengganti)</option>
                <option value="alpa">Alpa (Butuh Kelas Pengganti)</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Materi / Topik Diajarkan Hari Ini</label>
              <input
                className="input-field"
                placeholder="Misal: JPA Bab 2 Penjumlahan Sederhana"
                value={topicCovered}
                onChange={(e) => setTopicCovered(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Catatan Tambahan</label>
              <input
                className="input-field"
                placeholder="Catatan perkembangan atau kendala les..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button type="button" className="btn btn-secondary" onClick={() => setIsRecordModalOpen(false)}>Batal</Button>
              <Button type="submit" className="btn btn-primary-pink" loading={submitting} loadingText="Menyimpan...">Simpan Presensi</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Auto Jadwal Kelas Pengganti */}
      <Modal isOpen={isMakeupModalOpen} onClose={() => setIsMakeupModalOpen(false)} title="Jadwalkan Kelas Pengganti">
        <form onSubmit={handleScheduleMakeup}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Murid berstatus <strong>{status}</strong>. Silakan tentukan jadwal pengganti untuk sesi ini.
          </p>

          <div className="input-group">
            <label className="input-label">Tanggal Kelas Pengganti *</label>
            <input type="date" className="input-field" value={makeupDate} onChange={(e) => setMakeupDate(e.target.value)} required />
          </div>

          <div className="input-group">
            <label className="input-label">Jam Mulai *</label>
            <input type="time" className="input-field" value={makeupTime} onChange={(e) => setMakeupTime(e.target.value)} required />
          </div>

          <div className="input-group">
            <label className="input-label">Durasi Jam (misal 1.5 jam) *</label>
            <input type="number" step="0.5" className="input-field" value={makeupDuration} onChange={(e) => setMakeupDuration(parseFloat(e.target.value))} required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" className="btn btn-secondary" onClick={() => setIsMakeupModalOpen(false)}>Lewati Dulu</Button>
            <Button type="submit" className="btn btn-primary-yellow" loading={submitting} loadingText="Menyimpan...">Simpan Kelas Pengganti</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default AttendancePage;
