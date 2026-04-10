import { useState, useEffect, useCallback } from 'react';
import { coursesAPI, programmesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';

const EMPTY = { code:'', name:'', description:'', credit_hrs:3, level:'100', programme:'', is_active:true };
const LEVELS = ['100','200','300','400','500','600'];
const LEVEL_COLORS = { '100':'badge-green','200':'badge-teal','300':'badge-blue','400':'badge-purple','500':'badge-amber','600':'badge-rose' };

export default function Courses() {
  const { toast } = useToast();
  const [courses, setCourses]    = useState([]);
  const [programmes, setProgs]   = useState([]);
  const [loading, setLoading]    = useState(true);
  const [search, setSearch]      = useState('');
  const [filters, setFilters]    = useState({ programme:'', level:'' });
  const [modal, setModal]        = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]    = useState({ open:false, id:null });
  const [form, setForm]          = useState(EMPTY);
  const [saving, setSaving]      = useState(false);
  const [deleting, setDeleting]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filters.programme) params.programme = filters.programme;
      if (filters.level) params.level = filters.level;
      const res = await coursesAPI.list(params);
      setCourses(res.results || res);
    } catch(e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  }, [search, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { programmesAPI.list({ page_size:100 }).then(r => setProgs(r.results||r)).catch(()=>{}); }, []);

  const openAdd  = () => { setForm(EMPTY); setModal({ open:true, mode:'add' }); };
  const openEdit = (c) => {
    setForm({ code:c.code, name:c.name, description:c.description||'', credit_hrs:c.credit_hrs, level:c.level, programme:c.programme, is_active:c.is_active });
    setModal({ open:true, mode:'edit', data:c });
  };
  const fld = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.type==='checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      modal.mode === 'add' ? await coursesAPI.create(form) : await coursesAPI.update(modal.data.id, form);
      toast(modal.mode==='add' ? 'Course created' : 'Course updated');
      setModal({open:false}); load();
    } catch(e) { toast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    setDeleting(true);
    try { await coursesAPI.delete(confirm.id); toast('Course deleted'); setConfirm({open:false}); load(); }
    catch(e) { toast(e.message,'error'); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h2>Courses</h2>
          <p>{courses.length} course{courses.length!==1?'s':''} across all programmes.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> New Course</button>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <i className="bi bi-search"></i>
          <input placeholder="Search by name or code…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filters.programme} onChange={e=>setFilters(f=>({...f,programme:e.target.value}))}>
          <option value="">All Programmes</option>
          {programmes.map(p=><option key={p.id} value={p.id}>{p.code}</option>)}
        </select>
        <select className="filter-select" value={filters.level} onChange={e=>setFilters(f=>({...f,level:e.target.value}))}>
          <option value="">All Levels</option>
          {LEVELS.map(l=><option key={l} value={l}>Level {l}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        {loading
          ? <div className="loading-overlay"><div className="spinner"></div><span>Loading courses…</span></div>
          : !courses.length
            ? <div className="empty-state"><div className="empty-icon"><i className="bi bi-book"></i></div><h4>No courses found</h4><p>Add your first course or adjust filters.</p></div>
            : (
              <table>
                <thead>
                  <tr><th>Code</th><th>Course Name</th><th>Programme</th><th>Level</th><th>Credits</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id}>
                      <td><span className="font-mono text-sm">{c.code}</span></td>
                      <td>
                        <div className="font-medium">{c.name}</div>
                        {c.description && <div className="text-xs text-muted">{c.description.slice(0,50)}{c.description.length>50?'…':''}</div>}
                      </td>
                      <td className="td-muted">{c.programme_name || '—'}</td>
                      <td><span className={`badge ${LEVEL_COLORS[c.level]||'badge-gray'}`}>Lvl {c.level}</span></td>
                      <td className="td-muted">{c.credit_hrs} cr.</td>
                      <td className="td-muted">{c.enrolled_count || 0}</td>
                      <td><span className={`badge ${c.is_active?'badge-green':'badge-gray'}`}>{c.is_active?'Active':'Inactive'}</span></td>
                      <td>
                        <div className="action-row">
                          <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={()=>openEdit(c)}><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={()=>setConfirm({open:true,id:c.id})}><i className="bi bi-trash3"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        }
      </div>

      <Modal open={modal.open} onClose={()=>setModal({open:false})} title={modal.mode==='add'?'New Course':'Edit Course'}
        footer={<><button className="btn btn-outline" onClick={()=>setModal({open:false})} disabled={saving}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save Course'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Course Code <span className="required">*</span></label><input className="form-control" name="code" value={form.code} onChange={fld} placeholder="e.g. BSC-CS-101" /></div>
          <div className="form-group"><label className="form-label">Credit Hours</label><input className="form-control" name="credit_hrs" type="number" min="1" max="12" value={form.credit_hrs} onChange={fld} /></div>
        </div>
        <div className="form-group"><label className="form-label">Course Name <span className="required">*</span></label><input className="form-control" name="name" value={form.name} onChange={fld} placeholder="Introduction to Programming" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Programme <span className="required">*</span></label>
            <select className="form-control" name="programme" value={form.programme} onChange={fld}>
              <option value="">— Select Programme —</option>
              {programmes.map(p=><option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Level</label>
            <select className="form-control" name="level" value={form.level} onChange={fld}>
              {LEVELS.map(l=><option key={l} value={l}>Level {l}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" name="description" value={form.description} onChange={fld} placeholder="Brief description…" /></div>
        <div className="form-group" style={{display:'flex',alignItems:'center',gap:10}}>
          <input type="checkbox" id="is_active_c" name="is_active" checked={form.is_active} onChange={fld} style={{width:16,height:16,accentColor:'var(--clr-accent)'}} />
          <label htmlFor="is_active_c" className="form-label" style={{margin:0}}>Course is active</label>
        </div>
      </Modal>

      <ConfirmModal open={confirm.open} onClose={()=>setConfirm({open:false})} onConfirm={del} loading={deleting} title="Delete Course?" message="All exam and enrollment links for this course will be removed." />
    </div>
  );
}