import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login }   = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left brand panel */}
      <div className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-brand-logo">
            <i className="bi bi-mortarboard-fill"></i>
          </div>
          <h1>Edu<em>Core</em><br />SMS</h1>
          <p>A complete student management system for academic institutions — manage students, programmes, exams, and more.</p>
          <div className="login-features">
            {[
              ['bi-people-fill',         'Student & Programme Management'],
              ['bi-clipboard2-check-fill','Exam Scheduling & Results'],
              ['bi-bar-chart-fill',       'Performance Analytics'],
              ['bi-shield-lock-fill',     'Admin-Only Secure Access'],
            ].map(([icon, label]) => (
              <div className="login-feature" key={icon}>
                <i className={`bi ${icon}`}></i>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-form-box">
          <p className="form-title">Welcome back</p>
          <p className="form-subtitle">Sign in to your admin account to continue.</p>

          {error && (
            <div className="login-alert">
              <i className="bi bi-exclamation-circle-fill"></i>
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-light)' }}>
                  <i className="bi bi-person"></i>
                </span>
                <input
                  className="form-control"
                  style={{ paddingLeft: 36 }}
                  type="text"
                  name="username"
                  placeholder="admin"
                  value={form.username}
                  onChange={handle}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-light)' }}>
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  className="form-control"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handle}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-light)' }}
                >
                  <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button className="login-submit-btn" type="submit" disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> Signing in…</>
                : <><i className="bi bi-box-arrow-in-right"></i> Sign In</>
              }
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.78rem', color: 'var(--clr-text-light)' }}>
            <i className="bi bi-shield-lock" style={{ marginRight: 4 }}></i>
            Admin access only · EduCore SMS v1.0
          </p>
        </div>
      </div>
    </div>
  );
}