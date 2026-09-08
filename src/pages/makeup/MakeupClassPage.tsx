import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { MakeupClass } from '../../types';
import { Button, Modal, SkeletonBox } from '../../components/ui';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const MakeupClassPage: React.FC = () => {
  const cachedMakeup = api.getCached<MakeupClass[]>('makeup/list');
  const [makeupList, setMakeupList] = useState<MakeupClass[]>(cachedMakeup || []);
  const [loading, setLoading] = useState(!cachedMakeup);

  const fetchMakeupClasses = async () => {
    try {
      const data = await api.request<MakeupClass[]>('makeup/list');
      setMakeupList(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat kelas pengganti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMakeupClasses();
  }, []);

  const handleUpdateStatus = async (makeupId: string, newStatus: 'selesai' | 'batal') => {
    try {
      await api.request('makeup/update-status', { makeupId, status: newStatus });
      toast.success(`Status kelas pengganti diubah menjadi ${newStatus}`);
      fetchMakeupClasses();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui status');
    }
  };

  return (
    <div className="page-container page-transition">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Kelas Pengganti (Makeup Classes)</h1>
        <p style={{ color: 'var(--text-muted)' }}>Kelola jadwal les susulan bagi murid yang izin, sakit, atau alpa.</p>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Sesi</th>
              <th>Nama Murid</th>
              <th>Tanggal Asli</th>
              <th>Jadwal Pengganti</th>
              <th>Durasi</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: makeupList.length > 0 ? makeupList.length : 5 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  <td><SkeletonBox width="60px" height="18px" /></td>
                  <td><SkeletonBox width="110px" height="18px" /></td>
                  <td><SkeletonBox width="90px" height="18px" /></td>
                  <td><SkeletonBox width="130px" height="18px" /></td>
                  <td><SkeletonBox width="60px" height="18px" /></td>
                  <td><SkeletonBox width="75px" height="22px" borderRadius="9999px" /></td>
                  <td style={{ textAlign: 'right' }}><SkeletonBox width="100px" height="28px" borderRadius="var(--radius-md)" style={{ marginLeft: 'auto' }} /></td>
                </tr>
              ))
            ) : makeupList.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Belum ada kelas pengganti yang terjadwal.</td></tr>
            ) : (
              makeupList.map((m) => (
                <tr key={m.makeup_id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary-pink)' }}>{m.makeup_id}</td>
                  <td style={{ fontWeight: 600 }}>{m.student_name || 'Siswa'}</td>
                  <td>{m.original_date}</td>
                  <td style={{ fontWeight: 700 }}>{m.makeup_date} ({m.makeup_start_time})</td>
                  <td>{m.duration_hours || 1.5} jam</td>
                  <td>
                    <span className={`badge ${m.status === 'selesai' ? 'badge-success' : m.status === 'terjadwal' ? 'badge-warning' : 'badge-danger'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {m.status === 'terjadwal' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <Button className="btn btn-primary-pink" style={{ padding: '0.35rem 0.65rem' }} onClick={() => handleUpdateStatus(m.makeup_id, 'selesai')}>
                          <CheckCircle size={14} />
                          <span>Selesai</span>
                        </Button>
                        <Button className="btn btn-danger" style={{ padding: '0.35rem 0.65rem' }} onClick={() => handleUpdateStatus(m.makeup_id, 'batal')}>
                          <span>Batal</span>
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default MakeupClassPage;
