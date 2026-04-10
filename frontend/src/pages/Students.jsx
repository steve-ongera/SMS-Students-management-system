import { useState, useEffect, useCallback } from 'react';
import { studentsAPI, programmesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';

const STATUS_BADGE = { active:'badge-green', deferred:'badge-amber', graduated:'badge-blue', withdrawn:'badge-red' };
const AV_COLORS = ['av-green','av-blue','av-amber','av-rose'];
const avColor = (n='') => AV_COLORS[(n.charCodeAt(0)||0) % AV_COLORS.length];
const initials = (s) => ((s.first_name?.[0]||'')+(s.last_name?.[0]||'')).toUpperCase() || 'S';

const EMPTY_FORM = {
  student_id:'', first_name:'', last_name:'', email:'', phone:'',
  gender:'M', date_of_birth:'', address:'', programme:'', level:'100', status:'active',
};

export default function Students() {
  const { toast } = useToast();
  const [students,   setStudents]   = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filters,    setFilters]    = useState({ status: '', programme: '', level: '' });
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);

  const [modal,   setModal]   = useState({ open: false, mode: 'add', data: null });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(false);
  const [viewModal, setViewModal] = useState({ open: false, student: null, results: [] });

  const PAGE_SIZE = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search)           params.search      = search;
      if (filters.status)   params.status      = filters.status;
      if (filters.programme)params.programme   = filters.programme;
      if (filters.level)    params.level       = filters.level;
      const res = await studentsAPI.list(params);
      setStudents(res.results || res);
      setTotal(res.count || (res.results || res).length);
    } catch (e) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [page, search, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { programmesAPI.list({ page_size: 100 }).then(r => setProgrammes(r.results || r)).catch(() => {}); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add' }); };
  const openEdit = (s) => {
    setForm({
      student_id: s.student_id, first_name: s.first_name, last_name: s.last_name,
      email: s.email, phone: s.phone || '', gender: s.gender,
      date_of_birth: s.date_of_birth || '', address: s.address || '',
      programme: s.programme || '', level: s.level, status: s.status,
    });
    setModal({ open: true, mode: 'edit', data: s });
  };
  const openView = async (s) => {
    setViewModal({ open: true, student: s, results: [] });
    const res = await studentsAPI.results(s.id).catch(() => []);
    setViewModal(v => ({ ...v, results: res }));
  };

  const handleField = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await studentsAPI.create(form);
        toast('Student added successfully');
      } else {
        await studentsAPI.update(modal.data.id, form);
        toast('Student updated');
      }
      setModal({ open: false });
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const deleteStudent = async () => {
    setDeleting(true);
    try {
      await studentsAPI.delete(confirm.id);
      toast('Student deleted');
      setConfirm({ open: false });
      load();
    } catch (e) { toast(e.message, 'error'); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const GRADE_BADGE = { A:'badge-green', B:'badge-teal', C:'badge-blue', D:'badge-amber', E:'badge-red' };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h2>Students</h2>
          <p>{total} student{total !== 1 ? 's' : ''} registered</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <i className="bi bi-person-plus-fill"></i> Add Student
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-bar">
          <i className="bi bi-search"></i>
          <input placeholder="Search by name, ID, or email…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="filter-select" value={filters.status}
          onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="deferred">Deferred</option>
          <option value="graduated">Graduated</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
        <select className="filter-select" value={filters.programme}
          onChange={e => { setFilters(f => ({ ...f, programme: e.target.value })); setPage(1); }}>
          <option value="">All Programmes</option>
          {programmes.map(p => <option key={p.id} value={p.id}>{p.code}</option>)}
        </select>
        <select className="filter-select" value={filters.level}
          onChange={e => { setFilters(f => ({ ...f, level: e.target.value })); setPage(1); }}>
          <option value="">All Levels</option>
          {['100','200','300','400','500','600'].map(l => <option key={l} value={l}>Level {l}</option>)}
        </select>
        {(search || filters.status || filters.programme || filters.level) &&
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilters({ status:'', programme:'', level:'' }); setPage(1); }}>
            <i className="bi bi-x-circle"></i> Clear
          </button>
        }
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading
          ? <div className="loading-overlay"><div className="spinner"></div><span>Loading students…</span></div>
          : !students.length
            ? <div className="empty-state"><div className="empty-icon"><i className="bi bi-people"></i></div><h4>No students found</h4><p>Try adjusting your filters or add a new student.</p></div>
            : (
              <table>
                <thead>
                  <tr>
                    <th>Student</th><th>Student ID</th><th>Programme</th>
                    <th>Level</th><th>Gender</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div className="student-cell">
                          <div className={`avatar avatar-sm ${avColor(s.first_name)}`}>{initials(s)}</div>
                          <div>
                            <div className="font-medium">{s.full_name}</div>
                            <div className="text-xs text-muted">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="font-mono text-sm">{s.student_id}</span></td>
                      <td className="td-muted">{s.programme_name || '—'}</td>
                      <td><span className="badge badge-gray">Lvl {s.level}</span></td>
                      <td className="td-muted">{s.gender === 'M' ? 'Male' : s.gender === 'F' ? 'Female' : 'Other'}</td>
                      <td><span className={`badge ${STATUS_BADGE[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                      <td>
                        <div className="action-row">
                          <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => openView(s)}><i className="bi bi-eye"></i></button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(s)}><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => setConfirm({ open: true, id: s.id })}><i className="bi bi-trash3"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        }

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="pagination">
            <span>Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,total)} of {total}</span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page===1} onClick={() => setPage(1)}><i className="bi bi-chevron-double-left"></i></button>
              <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}><i className="bi bi-chevron-left"></i></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages-4, page-2)) + i;
                return <button key={p} className={`page-btn${p===page?' active':''}`} onClick={() => setPage(p)}>{p}</button>;
              })}
              <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}><i className="bi bi-chevron-right"></i></button>
              <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(totalPages)}><i className="bi bi-chevron-double-right"></i></button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.mode === 'add' ? 'Add New Student' : 'Edit Student'}
        subtitle={modal.mode === 'add' ? 'Fill in the student details below.' : `Editing ${form.first_name} ${form.last_name}`}
        size="modal-lg"
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal({ open: false })} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width:16, height:16, borderWidth:2 }}></span> Saving…</> : <><i className="bi bi-check2"></i> {modal.mode === 'add' ? 'Add Student' : 'Save Changes'}</>}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name <span className="required">*</span></label>
            <input className="form-control" name="first_name" value={form.first_name} onChange={handleField} placeholder="e.g. Alice" required />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name <span className="required">*</span></label>
            <input className="form-control" name="last_name" value={form.last_name} onChange={handleField} placeholder="e.g. Kamau" required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Student ID <span className="required">*</span></label>
            <input className="form-control" name="student_id" value={form.student_id} onChange={handleField} placeholder="e.g. STU20240001" />
          </div>
          <div className="form-group">
            <label className="form-label">Email <span className="required">*</span></label>
            <input className="form-control" name="email" type="email" value={form.email} onChange={handleField} placeholder="student@email.com" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-control" name="phone" value={form.phone} onChange={handleField} placeholder="0712345678" />
          </div>
          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input className="form-control" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleField} />
          </div>
        </div>
        <div className="form-row-3">
          <div className="form-group">
            <label className="form-label">Gender</label>
            <select className="form-control" name="gender" value={form.gender} onChange={handleField}>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Programme</label>
            <select className="form-control" name="programme" value={form.programme} onChange={handleField}>
              <option value="">— Select —</option>
              {programmes.map(p => <option key={p.id} value={p.id}>{p.code} – {p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Level</label>
            <select className="form-control" name="level" value={form.level} onChange={handleField}>
              {['100','200','300','400','500','600'].map(l => <option key={l} value={l}>Level {l}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" name="status" value={form.status} onChange={handleField}>
              <option value="active">Active</option>
              <option value="deferred">Deferred</option>
              <option value="graduated">Graduated</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea className="form-control" name="address" value={form.address} onChange={handleField} placeholder="Residential address…" />
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        open={viewModal.open}
        onClose={() => setViewModal({ open: false, student: null, results: [] })}
        title="Student Profile"
        size="modal-lg"
      >
        {viewModal.student && (
          <div>
            <div style={{ display:'flex', gap:20, alignItems:'center', marginBottom:24, paddingBottom:20, borderBottom:'1px solid var(--clr-border)' }}>
              <div className={`avatar avatar-lg ${avColor(viewModal.student.first_name)}`} style={{ fontSize:'1.3rem' }}>
                {initials(viewModal.student)}
              </div>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:'1.25rem', fontWeight:700 }}>{viewModal.student.full_name}</div>
                <div className="text-sm text-muted">{viewModal.student.student_id} · {viewModal.student.email}</div>
                <div style={{ marginTop:6, display:'flex', gap:8 }}>
                  <span className={`badge ${STATUS_BADGE[viewModal.student.status]||'badge-gray'}`}>{viewModal.student.status}</span>
                  <span className="badge badge-gray">Level {viewModal.student.level}</span>
                  <span className="badge badge-blue">{viewModal.student.programme_name || 'No Programme'}</span>
                </div>
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <div className="card-title mb-3">Exam Results</div>
              {!viewModal.results.length
                ? <p className="text-sm text-muted">No exam results recorded.</p>
                : <table>
                    <thead><tr><th>Exam</th><th>Type</th><th>Marks</th><th>Grade</th></tr></thead>
                    <tbody>
                      {viewModal.results.map(r => (
                        <tr key={r.id}>
                          <td>{r.exam_title}</td>
                          <td className="td-muted">{r.exam}</td>
                          <td className="font-mono">{r.marks ?? '—'}</td>
                          <td><span className={`badge ${GRADE_BADGE[r.grade]||'badge-gray'}`}>{r.grade || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              }
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={confirm.open}
        onClose={() => setConfirm({ open: false })}
        onConfirm={deleteStudent}
        loading={deleting}
        title="Delete Student?"
        message="All associated results and enrollments will also be removed."
      />
    </div>
  );
}