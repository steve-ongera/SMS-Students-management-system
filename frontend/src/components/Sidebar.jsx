import { useAuth } from '../context/AuthContext';

const NAV = [
  {
    section: 'Main',
    items: [
      { key: 'dashboard',  icon: 'bi-grid-1x2',        label: 'Dashboard' },
    ]
  },
  {
    section: 'Academic',
    items: [
      { key: 'students',   icon: 'bi-people',           label: 'Students' },
      { key: 'programmes', icon: 'bi-mortarboard',      label: 'Programmes' },
      { key: 'courses',    icon: 'bi-book',             label: 'Courses' },
      { key: 'enrollments',icon: 'bi-journal-bookmark', label: 'Enrollments' },
    ]
  },
  {
    section: 'Examinations',
    items: [
      { key: 'exams',      icon: 'bi-clipboard-check',  label: 'Exam Management' },
      { key: 'results',    icon: 'bi-bar-chart-line',   label: 'Results' },
    ]
  },
  {
    section: 'Administration',
    items: [
      { key: 'users',      icon: 'bi-person-gear',      label: 'User Management' },
    ]
  },
];

const COLORS = ['av-green','av-blue','av-amber','av-rose'];
function avatarColor(name = '') {
  const i = (name.charCodeAt(0) || 0) % COLORS.length;
  return COLORS[i];
}
function initials(user) {
  if (!user) return 'A';
  return ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')) || user.username?.[0]?.toUpperCase() || 'A';
}

export default function Sidebar({ collapsed, activePage, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <nav className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <i className="bi bi-mortarboard-fill"></i>
        </div>
        <div className="sidebar-brand">
          <h1>EduCore</h1>
          <span>Admin Portal</span>
        </div>
      </div>

      {/* Nav */}
      <div className="sidebar-nav">
        {NAV.map(section => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map(item => (
              <div
                key={item.key}
                className={`nav-item${activePage === item.key ? ' active' : ''}`}
                onClick={() => onNavigate(item.key)}
                title={collapsed ? item.label : ''}
              >
                <i className={`bi ${item.icon} nav-icon`}></i>
                <span className="nav-label">{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={logout} title="Logout">
          <div className={`user-avatar ${avatarColor(user?.first_name)}`}>
            {initials(user)}
          </div>
          <div className="user-info">
            <strong>{user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}</strong>
            <span>Click to logout</span>
          </div>
        </div>
      </div>
    </nav>
  );
}