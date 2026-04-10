import { useState, useEffect, useCallback } from 'react';
import { programmesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';

const EMPTY = { code:'', name:'', department:'', duration:3, description:'', is_active:true };

export default function Programmes() {
  const { toast } = useToast();
  const [programmes, setProgs] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [search, setSearch]    = useState('');
  const [modal, setModal]      = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]  = useState({ open:false, id:null });
  const [form, setForm]        = useState(EMPTY);
  const [saving, setSaving]    = useState(false);
  const [deleting, setDeleting]= useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await programmesAPI.list(search ? { search } : {});
      setProgs(res.results || res);
    } catch(e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(EMPTY); setModal({ open:true, mode:'add' }); };
  const openEdit = (p) => { setForm({ code:p.code, name:p.name, department:p.department, duration:p.duration, description:p.description||'', is_active:p.is_active }); setModal({ open:true, mode:'edit', data:p }); };
  const fld = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.type==='checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      modal.mode === 'add' ? await programmesAPI.create(form) : await programmesAPI.update(modal.data.id, form);
      toast(modal.mode === 'add' ? 'Programme created' : 'Programme updated');
      setModal({ open:false }); load();
    } catch(e) { toast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    setDeleting(true);
    try { await programmesAPI.delete(confirm.id); toast('Programme deleted'); setConfirm({ open:false }); load(); }
    catch(e) { toast(e.message,'error'); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h2>Programmes</h2>
          <p>Manage academic programmes and their configurations.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> New Programme</button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <i className="bi bi-search"></i>
          <input placeholder="Search programmes…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Cards grid */}
      {loading
        ? <div className="loading-overlay"><div className="spinner"></div><span>Loading…</span></div>
        : !programmes.length
          ? <div className="empty-state"><div className="empty-icon"><i className="bi bi-mortarboard"></i></div><h4>No programmes found</h4><p>Create your first academic programme.</p></div>
          : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 }}>
              {programmes.map(p => (
                <div className="card" key={p.id}>
                  <div className="card-body">
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                      <div style={{ width:44, height:44, background:'var(--clr-accent-pale)', borderRadius:'var(--radius-md)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <i className="bi bi-mortarboard-fill" style={{ color:'var(--clr-primary)', fontSize:'1.2rem' }}></i>
                      </div>
                      <span className={`badge ${p.is_active ? 'badge-green' : 'badge-gray'}`}>{p.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:700, marginBottom:4 }}>{p.name}</div>
                    <div className="text-xs text-muted mb-3" style={{ marginBottom:14 }}>{p.code} · {p.department}</div>
                    <div style={{ display:'flex', gap:12, marginBottom:16 }}>
                      <div style={{ textAlign:'center', flex:1, background:'var(--clr-bg)', borderRadius:'var(--radius-sm)', padding:'8px 4px' }}>
                        <div className="font-bold" style={{ fontSize:'1.1rem' }}>{p.student_count}</div>
                        <div className="text-xs text-muted">Students</div>
                      </div>
                      <div style={{ textAlign:'center', flex:1, background:'var(--clr-bg)', borderRadius:'var(--radius-sm)', padding:'8px 4px' }}>
                        <div className="font-bold" style={{ fontSize:'1.1rem' }}>{p.course_count}</div>
                        <div className="text-xs text-muted">Courses</div>
                      </div>
                      <div style={{ textAlign:'center', flex:1, background:'var(--clr-bg)', borderRadius:'var(--radius-sm)', padding:'8px 4px' }}>
                        <div className="font-bold" style={{ fontSize:'1.1rem' }}>{p.duration}</div>
                        <div className="text-xs text-muted">Years</div>
                      </div>
                    </div>
                    {p.description && <p className="text-sm text-muted" style={{ marginBottom:16, lineHeight:1.5 }}>{p.description.slice(0,90)}{p.description.length>90?'…':''}</p>}
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={() => openEdit(p)}><i className="bi bi-pencil"></i> Edit</button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => setConfirm({ open:true, id:p.id })}><i className="bi bi-trash3"></i></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      }

      <Modal open={modal.open} onClose={() => setModal({open:false})} title={modal.mode==='add'?'New Programme':'Edit Programme'} subtitle="Fill in programme details below."
        footer={<><button className="btn btn-outline" onClick={()=>setModal({open:false})} disabled={saving}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save Programme'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Code <span className="required">*</span></label><input className="form-control" name="code" value={form.code} onChange={fld} placeholder="e.g. BSC-CS" /></div>
          <div className="form-group"><label className="form-label">Duration (Years)</label><select className="form-control" name="duration" value={form.duration} onChange={fld}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} Year{n>1?'s':''}</option>)}</select></div>
        </div>
        <div className="form-group"><label className="form-label">Programme Name <span className="required">*</span></label><input className="form-control" name="name" value={form.name} onChange={fld} placeholder="Bachelor of Science in Computer Science" /></div>
        <div className="form-group"><label className="form-label">Department <span className="required">*</span></label><input className="form-control" name="department" value={form.department} onChange={fld} placeholder="Computer Science" /></div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" name="description" value={form.description} onChange={fld} placeholder="Brief description of the programme…" /></div>
        <div className="form-group" style={{ display:'flex', alignItems:'center', gap:10 }}>
          <input type="checkbox" id="is_active" name="is_active" checked={form.is_active} onChange={fld} style={{ width:16, height:16, accentColor:'var(--clr-accent)' }} />
          <label htmlFor="is_active" className="form-label" style={{ margin:0 }}>Programme is active</label>
        </div>
      </Modal>

      <ConfirmModal open={confirm.open} onClose={()=>setConfirm({open:false})} onConfirm={del} loading={deleting} title="Delete Programme?" message="This will remove the programme. Students assigned to it will lose their programme link." />
    </div>
  );
}