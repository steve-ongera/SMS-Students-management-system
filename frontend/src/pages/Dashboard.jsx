import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

const STATS = [
  { key: 'total_students',   label: 'Total Students',   icon: 'bi-people-fill',           color: 'green' },
  { key: 'active_students',  label: 'Active Students',  icon: 'bi-person-check-fill',      color: 'teal'  },
  { key: 'total_programmes', label: 'Programmes',        icon: 'bi-mortarboard-fill',       color: 'blue'  },
  { key: 'total_courses',    label: 'Courses',           icon: 'bi-book-fill',              color: 'purple'},
  { key: 'total_exams',      label: 'Total Exams',       icon: 'bi-clipboard-check-fill',   color: 'amber' },
  { key: 'upcoming_exams',   label: 'Upcoming Exams',    icon: 'bi-calendar-event-fill',    color: 'rose'  },
  { key: 'total_users',      label: 'Admin Users',       icon: 'bi-person-gear',            color: 'blue'  },
];

const STATUS_BADGE = {
  active:    'badge-green',
  deferred:  'badge-amber',
  graduated: 'badge-blue',
  withdrawn: 'badge-red',
};

const EXAM_STATUS = {
  scheduled: 'badge-blue',
  ongoing:   'badge-amber',
  completed: 'badge-green',
  cancelled: 'badge-red',
};

const AV_COLORS = ['av-green','av-blue','av-amber','av-rose'];
function avColor(name='') { return AV_COLORS[(name.charCodeAt(0)||0) % AV_COLORS.length]; }
function initials(s) { return ((s.first_name?.[0]||'') + (s.last_name?.[0]||'')).toUpperCase() || 'S'; }

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.stats()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-overlay"><div className="spinner"></div><span>Loading dashboard…</span></div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {STATS.map(s => (
          <div className="stat-card" key={s.key}>
            <div className={`stat-icon ${s.color}`}><i className={`bi ${s.icon}`}></i></div>
            <div className="stat-body">
              <div className="stat-value">{data?.[s.key] ?? '—'}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent Students */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><i className="bi bi-people" style={{ marginRight: 6 }}></i>Recent Enrollments</span>
          </div>
          <div style={{ padding: '16px 0 0' }}>
            {!data?.recent_students?.length
              ? <div className="empty-state"><div className="empty-icon"><i className="bi bi-people"></i></div><h4>No students yet</h4></div>
              : (
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>ID</th>
                      <th>Programme</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_students.map(s => (
                      <tr key={s.id}>
                        <td>
                          <div className="student-cell">
                            <div className={`avatar avatar-sm ${avColor(s.first_name)}`}>{initials(s)}</div>
                            <span className="font-medium">{s.full_name}</span>
                          </div>
                        </td>
                        <td><span className="font-mono text-sm">{s.student_id}</span></td>
                        <td className="td-muted">{s.programme_name || '—'}</td>
                        <td><span className={`badge ${STATUS_BADGE[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><i className="bi bi-calendar-event" style={{ marginRight: 6 }}></i>Upcoming Exams</span>
          </div>
          <div style={{ padding: '16px 0 0' }}>
            {!data?.upcoming_exam_list?.length
              ? <div className="empty-state"><div className="empty-icon"><i className="bi bi-calendar-x"></i></div><h4>No upcoming exams</h4></div>
              : data.upcoming_exam_list.map(ex => (
                <div key={ex.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--clr-border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 44, height: 44, background: 'var(--clr-accent-pale)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="bi bi-clipboard-check" style={{ color: 'var(--clr-primary)', fontSize: '1.1rem' }}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-medium text-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.title}</div>
                    <div className="text-xs text-muted mt-1">{ex.course_code} · {ex.date} · {ex.venue || 'TBD'}</div>
                  </div>
                  <span className={`badge ${EXAM_STATUS[ex.status] || 'badge-gray'}`}>{ex.exam_type}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}