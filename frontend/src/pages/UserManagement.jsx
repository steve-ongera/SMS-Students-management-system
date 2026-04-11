import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Modal, { ConfirmModal } from '../components/Modal';

const AV_COLORS = ['av-green','av-blue','av-amber','av-rose'];
const avColor = (n='') => AV_COLORS[(n.charCodeAt(0)||0) % AV_COLORS.length];
const initials = (u) => ((u.first_name?.[0]||'')+(u.last_name?.[0]||'')).toUpperCase() || u.username?.[0]?.toUpperCase() || 'U';

const EMPTY_FORM = { username:'', email:'', first_name:'', last_name:'', password:'', password2:'', is_staff:true, phone:'', department:'' };

export default function UserManagement() {
  const { toast }  = useToast();
  const { user: me } = useAuth();

  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState({ open:false, mode:'add', data:null });
  const [pwModal,  setPwModal]  = useState({ open:false, user:null });
  const [confirm,  setConfirm]  = useState({ open:false, id:null, name:'' });
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [pwForm,   setPwForm]   = useState({ password:'', password2:'' });
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {}; if (search) params.search = search;
      const res = await usersAPI.list(params);
      setUsers(res.results || res);
    } catch(e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(EMPTY_FORM); setShowPw(false); setModal({ open:true, mode:'add' }); };
  const openEdit = (u) => {
    setForm({ username:u.username, email:u.email, first_name:u.first_name||'', last_name:u.last_name||'', password:'', password2:'', is_staff:u.is_staff, phone:u.profile?.phone||'', department:u.profile?.department||'' });
    setShowPw(false);
    setModal({ open:true, mode:'edit', data:u });
  };

  const fld = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.type==='checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    if (modal.mode === 'add') {
      if (!form.password) return toast('Password is required', 'error');
      if (form.password !== form.password2) return toast('Passwords do not match', 'error');
    }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await usersAPI.create(form);
        toast('Admin user created');
      } else {
        const payload = { username:form.username, email:form.email, first_name:form.first_name, last_name:form.last_name, is_staff:form.is_staff };
        await usersAPI.update(modal.data.id, payload);
        toast('User updated');
      }
      setModal({ open:false }); load();
    } catch(e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!pwForm.password || pwForm.password.length < 6) return toast('Password must be at least 6 characters', 'error');
    if (pwForm.password !== pwForm.password2) return toast('Passwords do not match', 'error');
    setSaving(true);
    try {
      await usersAPI.setPassword(pwModal.user.id, pwForm.password);
      toast('Password changed successfully');
      setPwModal({ open:false, user:null });
      setPwForm({ password:'', password2:'' });
    } catch(e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (u) => {
    if (u.id === me?.id) return toast('You cannot deactivate your own account', 'warning');
    try {
      await usersAPI.toggleActive(u.id);
      toast(`User ${u.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch(e) { toast(e.message, 'error'); }
  };

  const del = async () => {
    if (confirm.id === me?.id) return toast('You cannot delete your own account', 'error');
    setDeleting(true);
    try {
      await usersAPI.delete(confirm.id);
      toast('User deleted');
      setConfirm({ open:false });
      load();
    } catch(e) { toast(e.message, 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h2>User Management</h2>
          <p>Manage administrator accounts and access levels.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-person-plus-fill"></i> Add Admin User
        </button>
      </div>

      {/* Info banner */}
      <div style={{ background:'var(--clr-info-bg)', border:'1px solid #bfdbfe', borderRadius:'var(--radius-md)', padding:'12px 16px', marginBottom:24, display:'flex', alignItems:'center', gap:10 }}>
        <i className="bi bi-shield-lock-fill" style={{ color:'var(--clr-info)', fontSize:'1.1rem' }}></i>
        <span style={{ fontSize:'0.85rem', color:'var(--clr-info)' }}>
          Only <strong>staff/admin</strong> users are shown. All users listed here have access to this admin portal.
        </span>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <i className="bi bi-search"></i>
          <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* User cards */}
      {loading
        ? <div className="loading-overlay"><div className="spinner"></div><span>Loading users…</span></div>
        : !users.length
          ? <div className="empty-state"><div className="empty-icon"><i className="bi bi-person-gear"></i></div><h4>No users found</h4><p>Create the first admin user.</p></div>
          : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
              {users.map(u => (
                <div className="card" key={u.id} style={{ opacity: u.is_active ? 1 : 0.65 }}>
                  <div className="card-body">
                    {/* Header row */}
                    <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
                      <div className={`avatar avatar-lg ${avColor(u.first_name || u.username)}`}>
                        {initials(u)}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:700 }}>
                          {u.first_name ? `${u.first_name} ${u.last_name}` : u.username}
                        </div>
                        <div className="text-xs text-muted" style={{ marginTop:2 }}>{u.email}</div>
                        <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                          {u.is_superuser && <span className="badge badge-purple"><i className="bi bi-star-fill"></i> Superuser</span>}
                          {u.is_staff    && <span className="badge badge-blue"><i className="bi bi-shield-check"></i> Admin</span>}
                          <span className={`badge ${u.is_active ? 'badge-green' : 'badge-gray'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      {/* "You" marker */}
                      {u.id === me?.id && (
                        <span className="badge badge-teal" style={{ flexShrink:0 }}>You</span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div style={{ background:'var(--clr-bg)', borderRadius:'var(--radius-md)', padding:'10px 14px', marginBottom:16, display:'flex', flexDirection:'column', gap:6 }}>
                      {u.profile?.department && (
                        <div style={{ display:'flex', gap:8, fontSize:'0.8rem' }}>
                          <i className="bi bi-building" style={{ color:'var(--clr-text-muted)', width:16 }}></i>
                          <span className="text-muted">{u.profile.department}</span>
                        </div>
                      )}
                      {u.profile?.phone && (
                        <div style={{ display:'flex', gap:8, fontSize:'0.8rem' }}>
                          <i className="bi bi-telephone" style={{ color:'var(--clr-text-muted)', width:16 }}></i>
                          <span className="text-muted">{u.profile.phone}</span>
                        </div>
                      )}
                      <div style={{ display:'flex', gap:8, fontSize:'0.8rem' }}>
                        <i className="bi bi-calendar3" style={{ color:'var(--clr-text-muted)', width:16 }}></i>
                        <span className="text-muted">Joined {u.date_joined?.slice(0,10)}</span>
                      </div>
                      <div style={{ display:'flex', gap:8, fontSize:'0.8rem' }}>
                        <i className="bi bi-person-badge" style={{ color:'var(--clr-text-muted)', width:16 }}></i>
                        <span className="font-mono text-muted">{u.username}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={() => openEdit(u)}>
                        <i className="bi bi-pencil"></i> Edit
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => { setPwModal({ open:true, user:u }); setPwForm({ password:'', password2:'' }); }}>
                        <i className="bi bi-key"></i> Password
                      </button>
                      {u.id !== me?.id && (
                        <>
                          <button className="btn btn-outline btn-sm" onClick={() => toggleActive(u)} title={u.is_active ? 'Deactivate' : 'Activate'}>
                            <i className={`bi ${u.is_active ? 'bi-person-dash' : 'bi-person-check'}`}></i>
                          </button>
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => setConfirm({ open:true, id:u.id, name: u.first_name || u.username })}>
                            <i className="bi bi-trash3"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      }

      {/* Add / Edit Modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open:false })}
        title={modal.mode === 'add' ? 'Add Admin User' : 'Edit User'}
        subtitle={modal.mode === 'add' ? 'New user will have access to the admin portal.' : `Editing @${modal.data?.username}`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal({ open:false })} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving
                ? <><span className="spinner" style={{ width:16, height:16, borderWidth:2 }}></span> Saving…</>
                : <><i className="bi bi-check2"></i> {modal.mode === 'add' ? 'Create User' : 'Save Changes'}</>
              }
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-control" name="first_name" value={form.first_name} onChange={fld} placeholder="Jane" />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-control" name="last_name" value={form.last_name} onChange={fld} placeholder="Doe" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Username <span className="required">*</span></label>
            <input className="form-control" name="username" value={form.username} onChange={fld} placeholder="janedoe" />
          </div>
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input className="form-control" name="email" type="email" value={form.email} onChange={fld} placeholder="jane@institution.ac.ke" />
          </div>
        </div>
        {modal.mode === 'add' && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password <span className="required">*</span></label>
              <div style={{ position:'relative' }}>
                <input className="form-control" name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={fld} placeholder="Min. 6 characters" style={{ paddingRight:40 }} />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--clr-text-light)' }}>
                  <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password <span className="required">*</span></label>
              <input className="form-control" name="password2" type={showPw ? 'text' : 'password'} value={form.password2} onChange={fld} placeholder="Repeat password" />
            </div>
          </div>
        )}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Department</label>
            <input className="form-control" name="department" value={form.department} onChange={fld} placeholder="e.g. Registry" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-control" name="phone" value={form.phone} onChange={fld} placeholder="0712 345 678" />
          </div>
        </div>
        <div className="form-group" style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="checkbox" id="is_staff_chk" name="is_staff" checked={form.is_staff} onChange={fld} style={{ width:16, height:16, accentColor:'var(--clr-accent)' }} />
          <label htmlFor="is_staff_chk" className="form-label" style={{ margin:0 }}>Grant admin (staff) access</label>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        open={pwModal.open}
        onClose={() => setPwModal({ open:false, user:null })}
        title="Change Password"
        subtitle={`Set a new password for @${pwModal.user?.username}`}
        size="modal-sm"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setPwModal({ open:false })} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={changePassword} disabled={saving}>
              {saving ? 'Saving…' : <><i className="bi bi-key"></i> Update Password</>}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">New Password <span className="required">*</span></label>
          <input className="form-control" type="password" value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm Password <span className="required">*</span></label>
          <input className="form-control" type="password" value={pwForm.password2} onChange={e => setPwForm(f => ({ ...f, password2: e.target.value }))} placeholder="Repeat new password" />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={confirm.open}
        onClose={() => setConfirm({ open:false })}
        onConfirm={del}
        loading={deleting}
        title={`Delete ${confirm.name}?`}
        message="This admin user will be permanently removed and will lose all access."
      />
    </div>
  );
}