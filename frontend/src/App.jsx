import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import Sidebar  from './components/Sidebar';
import Navbar   from './components/Navbar';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Students     from './pages/Students';
import Programmes   from './pages/Programmes';
import Courses      from './pages/Courses';
import Enrollments  from './pages/Enrollments';
import Exams        from './pages/Exams';
import Results      from './pages/Results';
import UserManagement from './pages/UserManagement';

const PAGES = {
  dashboard:   Dashboard,
  students:    Students,
  programmes:  Programmes,
  courses:     Courses,
  enrollments: Enrollments,
  exams:       Exams,
  results:     Results,
  users:       UserManagement,
};

function AppShell() {
  const [collapsed,   setCollapsed]   = useState(false);
  const [activePage,  setActivePage]  = useState('dashboard');

  const PageComponent = PAGES[activePage] || Dashboard;

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        activePage={activePage}
        onNavigate={setActivePage}
      />
      <div className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}>
        <Navbar
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
          activePage={activePage}
        />
        <main className="page-body">
          <PageComponent />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight:'100vh', flexDirection:'column', gap:16 }}>
        <div className="spinner" style={{ width:40, height:40, borderWidth:4 }}></div>
        <span style={{ color:'var(--clr-text-muted)', fontSize:'0.875rem' }}>Loading EduCore…</span>
      </div>
    );
  }

  return user ? <AppShell /> : <Login />;
}