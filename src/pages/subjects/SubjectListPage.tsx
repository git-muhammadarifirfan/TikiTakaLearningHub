import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Subject } from '../../types';
import { Button, Input, Modal, Select, SkeletonBox } from '../../components/ui';
import { Plus, BookOpen, Search, Edit2, Sparkles, FolderPlus, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const SubjectListPage: React.FC = () => {
  const cachedSubjects = api.getCached<Subject[]>('subjects/list');
  const [subjects, setSubjects] = useState<Subject[]>(cachedSubjects || []);
  const [loading, setLoading] = useState(!cachedSubjects);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form State
  const [subjectName, setSubjectName] = useState('');
  const [category, setCategory] = useState('Reguler');
  const [submitting, setSubmitting] = useState(false);

  const fetchSubjects = async () => {
    try {
      const data = await api.request<Subject[]>('subjects/list');
      setSubjects(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar mata pelajaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openAddModal = () => {
    setEditingSubject(null);
    setSubjectName('');
    setCategory('Reguler');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setSubjectName(sub.subject_name || '');
    setCategory(sub.category || 'Reguler');
    setIsModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName) {
      toast.error('Nama mata pelajaran wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      api.invalidateCache();
      if (editingSubject) {
        await api.request<Subject>('subjects/update', {
          subjectId: editingSubject.subject_id,
          subject_name: subjectName,
          category,
        });
        toast.success('Mata pelajaran berhasil diperbarui!');
      } else {
        await api.request<Subject>('subjects/create', {
          subject_name: subjectName,
          category,
        });
        toast.success('Mata pelajaran baru berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan mata pelajaran');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = Array.from(new Set(subjects.map((s) => s.category).filter(Boolean)));
  const categoryOptions = [
    { value: 'all', label: 'Semua Kategori' },
    ...categories.map((c) => ({ value: c || '', label: c || 'Reguler' })),
  ];

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      s.subject_id.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Top Header & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 600 }}>Mata Pelajaran</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Dashboard / <span style={{ color: 'var(--primary-pink)' }}>Subjects</span>
          </p>
        </div>
        <Button className="btn btn-primary-pink" onClick={openAddModal} icon={<Plus size={16} />}>
          Tambah Mapel Baru
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Input
                placeholder="Cari nama mapel atau ID..."
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            <div style={{ width: '200px' }}>
              <Select
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                options={categoryOptions}
              />
            </div>
          </div>

          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {loading ? <SkeletonBox width="180px" height="18px" /> : `Total ${filteredSubjects.length} Mata Pelajaran Terdaftar`}
          </div>
        </div>
      </div>

      {/* Main Subjects Data Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '1.5rem' }}>Nomor</th>
                <th>Pelajaran</th>
                <th>Kategori</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: subjects.length > 0 ? subjects.length : 5 }).map((_, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ paddingLeft: '1.5rem' }}><SkeletonBox width="60px" height="18px" /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <SkeletonBox width="32px" height="32px" borderRadius="var(--radius-md)" />
                        <SkeletonBox width="140px" height="18px" />
                      </div>
                    </td>
                    <td><SkeletonBox width="90px" height="18px" /></td>
                    <td style={{ textAlign: 'center' }}><SkeletonBox width="60px" height="28px" borderRadius="var(--radius-md)" style={{ margin: '0 auto' }} /></td>
                  </tr>
                ))
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Tidak ada mata pelajaran yang sesuai filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((sub) => (
                  <tr key={sub.subject_id}>
                    <td style={{ paddingLeft: '1.5rem', fontWeight: 700, color: 'var(--primary-pink)', fontSize: '0.85rem' }}>
                      {sub.subject_id}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: '#fdf2f8',
                            color: 'var(--primary-pink)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <BookOpen size={16} />
                        </div>
                        <span>{sub.subject_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#166534' }}>
                        {sub.category || 'Reguler'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Button
                        className="btn btn-secondary"
                        size="sm"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => openEditModal(sub)}
                        icon={<Edit2 size={14} />}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit Subject */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? `Edit Mapel: ${editingSubject.subject_name}` : 'Tambah Mata Pelajaran Baru'}
      >
        <form onSubmit={handleSaveSubject}>
          <Input
            label="Nama Pelajaran *"
            value={subjectName}
            onChange={(e: any) => setSubjectName(e.target.value)}
            placeholder="Contoh: JPA Matematika Ratusan"
            required
          />

          <Input
            label="Kategori"
            value={category}
            onChange={(e: any) => setCategory(e.target.value)}
            placeholder="Contoh: Matematika / Bahasa / Calistung / Sains"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="btn btn-primary-pink" loading={submitting} loadingText="Menyimpan...">
              {editingSubject ? 'Simpan Perubahan' : 'Simpan Mapel'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubjectListPage;
