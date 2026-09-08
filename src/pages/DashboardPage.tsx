import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DashboardStats, Subject, Schedule } from '../types';
import { Users, BookOpen, Calendar, Clock, ChevronDown, Filter, Star } from 'lucide-react';
import { Select } from '../components/ui';
import { toast } from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subjectCount, setSubjectCount] = useState<number>(0);
  const [weeklyScheduleCount, setWeeklyScheduleCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Interactive Period Selectors
  const [perfPeriod, setPerfPeriod] = useState<string>('6months');
  const [activityPeriod, setActivityPeriod] = useState<string>('thisweek');
  const [selectedMonth, setSelectedMonth] = useState<string>('mar');
  const [progressPeriod, setProgressPeriod] = useState<string>('thisweek');

  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const dStats = await api.request<DashboardStats>('dashboard/stats');
        const subs = await api.request<Subject[]>('subjects/list');
        const schs = await api.request<Schedule[]>('schedules/list');

        setStats(dStats);
        setSubjects(subs);
        setSubjectCount(subs.length);
        setWeeklyScheduleCount(schs.length);
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat data dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // State Tooltip Hover
  const [hoveredBar, setHoveredBar] = useState<{ day: string; hours: number } | null>(null);

  // Performance Data Points per filter
  const perfData = {
    '6months': { percentage: '85%', path: 'M 0 90 L 40 75 L 80 50 L 120 65 L 160 30 L 200 20', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
    '1month': { percentage: '92%', path: 'M 0 100 L 50 60 L 100 40 L 150 35 L 200 15', labels: ['W1', 'W2', 'W3', 'W4'] },
    '1week': { percentage: '96%', path: 'M 0 80 L 40 60 L 80 40 L 120 30 L 160 20 L 200 10', labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] },
  }[perfPeriod as '6months' | '1month' | '1week'] || { percentage: '85%', path: 'M 0 90 L 40 75 L 80 50 L 120 65 L 160 30 L 200 20', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] };

  // Activity Data Bars per filter
  const actBars = {
    'thisweek': [
      { day: 'Mon', h: 75, hours: 2.5, col: '#f472b6' },
      { day: 'Tue', h: 90, hours: 3.0, col: '#f472b6' },
      { day: 'Wed', h: 60, hours: 2.0, col: '#f472b6' },
      { day: 'Thu', h: 100, hours: 3.5, col: '#f472b6' },
      { day: 'Fri', h: 120, hours: 4.5, col: '#f472b6' },
      { day: 'Sat', h: 55, hours: 1.8, col: '#fbbf24' },
      { day: 'Sun', h: 30, hours: 1.0, col: '#f472b6' },
    ],
    'lastweek': [
      { day: 'Mon', h: 60, hours: 2.0, col: '#f472b6' },
      { day: 'Tue', h: 80, hours: 2.8, col: '#f472b6' },
      { day: 'Wed', h: 95, hours: 3.2, col: '#f472b6' },
      { day: 'Thu', h: 70, hours: 2.2, col: '#f472b6' },
      { day: 'Fri', h: 110, hours: 4.0, col: '#f472b6' },
      { day: 'Sat', h: 65, hours: 2.0, col: '#fbbf24' },
      { day: 'Sun', h: 40, hours: 1.2, col: '#f472b6' },
    ],
    'thismonth': [
      { day: 'Mon', h: 85, hours: 3.0, col: '#f472b6' },
      { day: 'Tue', h: 100, hours: 3.8, col: '#f472b6' },
      { day: 'Wed', h: 75, hours: 2.5, col: '#f472b6' },
      { day: 'Thu', h: 90, hours: 3.2, col: '#f472b6' },
      { day: 'Fri', h: 125, hours: 4.8, col: '#f472b6' },
      { day: 'Sat', h: 50, hours: 1.5, col: '#fbbf24' },
      { day: 'Sun', h: 35, hours: 1.0, col: '#f472b6' },
    ],
  }[activityPeriod as 'thisweek' | 'lastweek' | 'thismonth'] || [
      { day: 'Mon', h: 75, hours: 2.5, col: '#f472b6' },
      { day: 'Tue', h: 90, hours: 3.0, col: '#f472b6' },
      { day: 'Wed', h: 60, hours: 2.0, col: '#f472b6' },
      { day: 'Thu', h: 100, hours: 3.5, col: '#f472b6' },
      { day: 'Fri', h: 120, hours: 4.5, col: '#f472b6' },
      { day: 'Sat', h: 55, hours: 1.8, col: '#fbbf24' },
      { day: 'Sun', h: 30, hours: 1.0, col: '#f472b6' },
    ];

  return (
    <div className="page-container page-transition">

      {/* 4 Essential Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
        <div className="stat-card pink">
          <div className="stat-icon pink">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <h3>{loading ? '...' : stats?.totalStudents || 0}</h3>
            <p>Total Murid Bimbel</p>
          </div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon yellow">
            <BookOpen size={22} />
          </div>
          <div className="stat-info">
            <h3>{loading ? '...' : subjectCount}</h3>
            <p>Total Mata Pelajaran</p>
          </div>
        </div>

        <div className="stat-card pink">
          <div className="stat-icon pink">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <h3>{loading ? '...' : stats?.todaySchedules || 0}</h3>
            <p>Jadwal Hari Ini</p>
          </div>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon yellow">
            <Calendar size={22} />
          </div>
          <div className="stat-info">
            <h3>{loading ? '...' : weeklyScheduleCount}</h3>
            <p>Jadwal Minggu Ini</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.3fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

            {/* Redesain Performance Card 100% Persis Acuan Gambar */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Performance</h3>
                  <div>
                    <Select
                      value={perfPeriod}
                      onChange={(val) => setPerfPeriod(val)}
                      options={[
                        { value: '6months', label: 'Last 6 Months' },
                        { value: '1month', label: 'Last 1 Month' },
                        { value: '1week', label: 'Last 1 Week' },
                      ]}
                    />
                  </div>
                </div>

                {/* Top Row: Arc Gauge Donut Chart & Breakdown Stats */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* SVG Semi-Circle Arc Donut Gauge */}
                  <div style={{ position: 'relative', width: 150, height: 95, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <svg width="150" height="95" viewBox="0 0 150 95">
                      {/* Background Gray Arc */}
                      <path
                        d="M 15 85 A 60 60 0 0 1 135 85"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="16"
                        strokeLinecap="round"
                      />
                      {/* Exam Light Blue Segment */}
                      <path
                        d="M 15 85 A 60 60 0 0 1 135 85"
                        fill="none"
                        stroke="#bfdbfe"
                        strokeWidth="16"
                        strokeDasharray="188"
                        strokeDashoffset="38"
                        strokeLinecap="round"
                      />
                      {/* Quiz Yellow Segment */}
                      <path
                        d="M 15 85 A 60 60 0 0 1 135 85"
                        fill="none"
                        stroke="#fcd34d"
                        strokeWidth="16"
                        strokeDasharray="188"
                        strokeDashoffset="65"
                        strokeLinecap="round"
                      />
                      {/* Participation Pink Segment */}
                      <path
                        d="M 15 85 A 60 60 0 0 1 135 85"
                        fill="none"
                        stroke="#f472b6"
                        strokeWidth="16"
                        strokeDasharray="188"
                        strokeDashoffset="95"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div style={{ position: 'absolute', bottom: 5, textAlign: 'center' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Score</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.1 }}>80%</div>
                    </div>
                  </div>

                  {/* Right Breakdown List (Metrik Bimbel TikaTrack) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#f472b6' }} />
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Kehadiran Les</span>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>55%</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#fcd34d' }} />
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Kuis & Latihan</span>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>15%</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#93c5fd' }} />
                        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Ujian Evaluasi</span>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>10%</span>
                    </div>
                  </div>
                </div>

                {/* Clean Polyline Trend Chart 100% Persis Acuan Gambar Baru */}
                <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-xl)', padding: '1.25rem 1rem', position: 'relative' }}>
                  <div style={{ height: '110px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="pinkSoftFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f472b6" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#f472b6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <polygon
                        points="10,80 50,70 100,50 150,60 200,30 250,22 300,12 300,100 10,100"
                        fill="url(#pinkSoftFill)"
                      />
                      <polyline
                        points="10,80 50,70 100,50 150,60 200,30 250,22 300,12"
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <div
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '28px',
                        backgroundColor: '#fef9c3',
                        color: '#854d0e',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
                      }}
                    >
                      85%
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem', padding: '0 0.5rem', fontWeight: 500 }}>
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Activity Chart — Height Matched & Aligned */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Activity</h3>
                  <div>
                    <Select
                      value={activityPeriod}
                      onChange={(val) => setActivityPeriod(val)}
                      options={[
                        { value: 'thisweek', label: 'Pekan Ini' },
                        { value: 'lastweek', label: 'Pekan Lalu' },
                        { value: 'thismonth', label: 'Bulan Ini' },
                      ]}
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.5rem 1.25rem',
                    height: '245px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 0.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', position: 'relative' }}>
                    {actBars.map((item) => {
                      const isHovered = hoveredBar?.day === item.day;
                      return (
                        <div
                          key={item.day}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', flex: 1, padding: '0 0.15rem', position: 'relative', cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredBar({ day: item.day, hours: item.hours })}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          {isHovered && (
                            <div className="chart-tooltip" style={{ top: -34 }}>
                              {item.hours} jam
                            </div>
                          )}
                          <div
                            key={`${activityPeriod}-${item.day}`}
                            className="animated-bar"
                            style={{
                              width: '100%',
                              maxWidth: '28px',
                              height: `${item.h * 1.25}px`,
                              backgroundColor: isHovered ? '#db2777' : item.col,
                              borderRadius: 'var(--radius-md)',
                              transition: 'background-color 0.2s ease',
                            }}
                          />
                          <span style={{ fontSize: '0.7rem', color: isHovered ? 'var(--primary-pink)' : 'var(--text-muted)', fontWeight: isHovered ? 600 : 400 }}>
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Motivational Banner Below aligned across bottom */}
              <div style={{ backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: 'var(--radius-lg)', padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#854d0e', lineHeight: 1.4 }}>
                Success is the sum of small efforts, repeated day in and day out. Keep pushing forward! 🫡
              </div>
            </div>

          </div>

          {/* Program Belajar & Progress */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Program Belajar & Progress Murid</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Select
                  options={[
                    { value: 'thisweek', label: 'Per Minggu' },
                    { value: 'thismonth', label: 'Per Bulan' },
                  ]}
                  value={progressPeriod}
                  onChange={(val) => setProgressPeriod(val)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {subjects.length === 0 ? (
                <div style={{ padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {loading ? 'Memuat program belajar...' : 'Belum ada mata pelajaran terpaut.'}
                </div>
              ) : (
                subjects.slice(0, 4).map((sub, idx) => {
                  const bgCols = ['#fdf2f8', '#eff6ff', '#fefce8', '#f3e8ff'];
                  const bg = bgCols[idx % bgCols.length];
                  return (
                    <div
                      key={sub.subject_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '0.85rem',
                        borderBottom: idx < 3 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 'var(--radius-lg)',
                            background: bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            color: 'var(--primary-pink)',
                          }}
                        >
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{sub.subject_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                            {sub.category || 'Bimbel'} • {stats?.totalStudents || 0} Murid
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          <Star size={14} fill="#fbbf24" color="#fbbf24" />
                          <span>4.{7 - (idx % 3)}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: 140 }}>
                          <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                            <div
                              className="animated-progress-fill"
                              style={{ width: `${85 - idx * 7}%`, height: '100%', background: 'var(--primary-pink)' }}
                            />
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, minWidth: 32 }}>{85 - idx * 7}%</span>
                        </div>

                        <span
                          className="badge"
                          style={{
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                          }}
                        >
                          Aktif
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Kalender Imut Widget */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <Select
                options={[
                  { value: 'jan', label: 'Januari 2026' },
                  { value: 'feb', label: 'Februari 2026' },
                  { value: 'mar', label: 'Maret 2026' },
                  { value: 'apr', label: 'April 2026' },
                  { value: 'may', label: 'Mei 2026' },
                  { value: 'jun', label: 'Juni 2026' },
                ]}
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(val)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sun</span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, backgroundColor: 'transparent', color: 'var(--text-main)' }}>12</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mon</span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, backgroundColor: '#fdf2f8', color: '#db2777' }}>13</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tue</span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, backgroundColor: 'transparent', color: 'var(--text-main)' }}>14</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Wed</span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, backgroundColor: '#fbbf24', color: '#78350f' }}>15</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Thu</span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, backgroundColor: 'transparent', color: 'var(--text-main)' }}>16</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fri</span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, backgroundColor: '#fdf2f8', color: '#db2777' }}>17</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sat</span>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, backgroundColor: 'transparent', color: 'var(--text-main)' }}>18</div>
              </div>
            </div>

            {/* Schedule & Task Notification per Tanggal (Real-Time Notification Bar) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.85rem 1rem', background: '#fbcfe8', borderRadius: 'var(--radius-lg)', color: '#9d174d' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Sesi Les Bahasa Inggris</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.85 }}>08:00 AM - 09:00 AM</div>
              </div>

              <div style={{ padding: '0.85rem 1rem', background: '#fef08a', borderRadius: 'var(--radius-lg)', color: '#854d0e' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Sesi Les JPA Matematika</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.85 }}>10:00 AM - 11:30 AM</div>
              </div>

              <div style={{ padding: '0.85rem 1rem', background: '#bfdbfe', borderRadius: 'var(--radius-lg)', color: '#1e40af' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Kelas Pengganti Calistung</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, opacity: 0.85 }}>12:00 PM - 01:00 PM</div>
              </div>
            </div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: '1fr', gap: '0.85rem', marginBottom: 0 }}>
            <div className="stat-card pink" style={{ padding: '1rem' }}>
              <div className="stat-icon pink" style={{ width: 40, height: 40, fontSize: '1.1rem' }}>
                <Users size={18} />
              </div>
              <div className="stat-info">
                <h3 style={{ fontSize: '1.35rem' }}>{loading ? '...' : stats?.totalStudents || 0}</h3>
                <p style={{ fontSize: '0.75rem' }}>Total Murid Bimbel</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
export default DashboardPage;
