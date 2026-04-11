import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  dashboard:   { title: 'Dashboard',      sub: 'Overview' },
  students:    { title: 'Students',        sub: 'Academic' },
  programmes:  { title: 'Programmes',      sub: 'Academic' },
  courses:     { title: 'Courses',         sub: 'Academic' },
  enrollments: { title: 'Enrollments',     sub: 'Academic' },
  exams:       { title: 'Exam Management', sub: 'Examinations' },
  results:     { title: 'Results',         sub: 'Examinations' },
  users:       { title: 'User Management', sub: 'Administration' },
};

function initials(user) {
  if (!user) return 'A';
  return ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')) || user.username?.[0]?.toUpperCase() || 'A';
}

export default function Navbar({ collapsed, onToggle, activePage }) {
  const { user, logout } = useAuth();
  const info = PAGE_TITLES[activePage] || { title: 'Dashboard', sub: 'Main' };

  return (
    <header className={`topbar${collapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Collapse toggle */}
      <button className="topbar-toggle" onClick={onToggle} title="Toggle sidebar">
        <i className="bi bi-list"></i>
      </button>

      {/* Breadcrumb */}
      <div className="topbar-breadcrumb">
        <span className="text-muted text-sm">{info.sub}</span>
        <span className="separator"><i className="bi bi-chevron-right" style={{ fontSize: '0.65rem' }}></i></span>
        <span className="page-title">{info.title}</span>
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        <button className="topbar-btn" title="Notifications">
          <i className="bi bi-bell"></i>
          <span className="dot"></span>
        </button>

        <button className="topbar-btn" title="Settings">
          <i className="bi bi-gear"></i>
        </button>

        {/* User chip */}
        <div className="topbar-user-chip" onClick={logout} title="Logout">
          <div className="topbar-avatar">
            {initials(user)}
          </div>
          <span>{user?.first_name || user?.username}</span>
          <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}></i>
        </div>
      </div>
    </header>
  );
}