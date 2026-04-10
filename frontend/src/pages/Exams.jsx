import { useState, useEffect, useCallback } from 'react';
import { examsAPI, coursesAPI, studentsAPI, resultsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';

const EXAM_TYPES   = ['midterm','final','quiz','assignment','practical'];
const STATUS_OPTS  = ['scheduled','ongoing','completed','cancelled'];
const STATUS_BADGE = { scheduled:'badge-blue', ongoing:'badge-amber', completed:'badge-green', cancelled:'badge-red' };
const TYPE_BADGE   = { midterm:'badge-purple', final:'badge-red', quiz:'badge-teal', assignment:'badge-blue', practical:'badge-amber' };
const GRADE_BADGE  = { A:'badge-green', B:'badge-teal', C:'badge-blue', D:'badge-amber', E:'badge-red', ABS:'badge-gray' };

const EMPTY = { title:'', course:'', exam_type:'midterm', date:'', start_time:'08:00', duration:120, venue:'', total_marks:100, pass_marks:40, status:'scheduled', instructions:'' };

export default function Exams() {
  const { toast } = useToast();
  const [exams, setExams]        = useState([]);
  const [courses, setCourses]    = useState([]);
  const [loading, setLoading]    = useState(true);
  const [search, setSearch]      = useState('');
  const [filters, setFilters]    = useState({ status:'', type:'' });
  const [modal, setModal]        = useState({ open:false, mode:'add', data:null });
  const [confirm, setConfirm]    = useState({ open:false, id:null });
  const [form, setForm]          = useState(EMPTY);
  const [saving, setSaving]      = useState(false);
  const [deleting, setDeleting]  = useState(false);

  // Results sub-modal
  const [resultsModal, setResultsModal] = useState({ open:false, exam:null, results:[], students:[], adding:false });
  const [resultForm, setResultForm]     = useState({ student:'', marks:'', remarks:'' });
  const [savingResult, setSavingResult] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      const res = await examsAPI.list(params);
      setExams(res.results || res);
    } catch(e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  }, [search, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { coursesAPI.list({ page_size:200 }).then(r=>setCourses(r.results||r)).catch(()=>{}); }, []);

  const openAdd  = () => { setForm(EMPTY); setModal({ open:true, mode:'add' }); };
  const openEdit = (e) => {
    setForm({ title:e.title, course:e.course, exam_type:e.exam_type, date:e.date, start_time:e.start_time, duration:e.duration, venue:e.venue||'', total_marks:e.total_marks, pass_marks:e.pass_marks, status:e.status, instructions:e.instructions||'' });
    setModal({ open:true, mode:'edit', data:e });
  };

  const openResults = async (exam) => {
    setResultsModal({ open:true, exam, results:[], students:[], adding:false });
    const [results, students] = await Promise.all([
      examsAPI.results(exam.id).catch(()=>[]),
      studentsAPI.list({ page_size:200 }).then(r=>r.results||r).catch(()=>[]),
    ]);
    setResultsModal(v => ({ ...v, results, students }));
  };

  const fld = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      modal.mode === 'add' ? await examsAPI.create(form) : await examsAPI.update(modal.data.id, form);
      toast(modal.mode==='add'?'Exam created':'Exam updated');
      setModal({open:false}); load();
    } catch(e) { toast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    setDeleting(true);
    try { await examsAPI.delete(confirm.id); toast('Exam deleted'); setConfirm({open:false}); load(); }
    catch(e) { toast(e.message,'error'); }
    finally { setDeleting(false); }
  };

  const saveResult = async () => {
    setSavingResult(true);
    try {
      await resultsAPI.create({ exam:resultsModal.exam.id, student:resultForm.student, marks:resultForm.marks, remarks:resultForm.remarks });
      toast('Result recorded');
      setResultForm({ student:'', marks:'', remarks:'' });
      const results = await examsAPI.results(resultsModal.exam.id).catch(()=>[]);
      setResultsModal(v => ({ ...v, results, adding:false }));
    } catch(e) { toast(e.message,'error'); }
    finally { setSavingResult(false); }
  };

  const deleteResult = async (id) => {
    try { await resultsAPI.delete(id); toast('Result removed'); const results = await examsAPI.results(resultsModal.exam.id); setResultsModal(v=>({...v,results})); }
    catch(e) { toast(e.message,'error'); }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h2>Exam Management</h2>
          <p>Schedule exams, track status, and record results.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><i className="bi bi-plus-lg"></i> Schedule Exam</button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="bi bi-search"></i><input placeholder="Search exams…" value={search} onChange={e=>setSearch(e.target.value)} /></div>
        <select className="filter-select" value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}>
          <option value="">All Statuses</option>
          {STATUS_OPTS.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
        <select className="filter-select" value={filters.type} onChange={e=>setFilters(f=>({...f,type:e.target.value}))}>
          <option value="">All Types</option>
          {EXAM_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        {loading
          ? <div className="loading-overlay"><div className="spinner"></div><span>Loading exams…</span></div>
          : !exams.length
            ? <div className="empty-state"><div className="empty-icon"><i className="bi bi-clipboard-check"></i></div><h4>No exams found</h4><p>Schedule your first exam.</p></div>
            : (
              <table>
                <thead><tr><th>Title</th><th>Course</th><th>Type</th><th>Date</th><th>Time</th><th>Venue</th><th>Marks</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {exams.map(e => (
                    <tr key={e.id}>
                      <td>
                        <div className="font-medium">{e.title}</div>
                        <div className="text-xs text-muted">{e.results_count || 0} results recorded</div>
                      </td>
                      <td><span className="font-mono text-sm">{e.course_code}</span><div className="text-xs text-muted">{e.course_name}</div></td>
                      <td><span className={`badge ${TYPE_BADGE[e.exam_type]||'badge-gray'}`}>{e.exam_type}</span></td>
                      <td className="td-muted">{e.date}</td>
                      <td className="td-muted">{e.start_time?.slice(0,5)} · {e.duration}min</td>
                      <td className="td-muted">{e.venue || '—'}</td>
                      <td className="td-muted">{e.pass_marks}/{e.total_marks}</td>
                      <td><span className={`badge ${STATUS_BADGE[e.status]||'badge-gray'}`}>{e.status}</span></td>
                      <td>
                        <div className="action-row">
                          <button className="btn btn-ghost btn-icon btn-sm" title="View Results" onClick={()=>openResults(e)}><i className="bi bi-list-check"></i></button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={()=>openEdit(e)}><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={()=>setConfirm({open:true,id:e.id})}><i className="bi bi-trash3"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        }
      </div>

      {/* Exam Form Modal */}
      <Modal open={modal.open} onClose={()=>setModal({open:false})} title={modal.mode==='add'?'Schedule Exam':'Edit Exam'} size="modal-lg"
        footer={<><button className="btn btn-outline" onClick={()=>setModal({open:false})} disabled={saving}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':modal.mode==='add'?'Schedule Exam':'Save Changes'}</button></>}>
        <div className="form-group"><label className="form-label">Exam Title <span className="required">*</span></label><input className="form-control" name="title" value={form.title} onChange={fld} placeholder="e.g. CS101 Mid-Term Examination" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Course <span className="required">*</span></label>
            <select className="form-control" name="course" value={form.course} onChange={fld}>
              <option value="">— Select Course —</option>
              {courses.map(c=><option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Exam Type</label>
            <select className="form-control" name="exam_type" value={form.exam_type} onChange={fld}>
              {EXAM_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row-3">
          <div className="form-group"><label className="form-label">Date <span className="required">*</span></label><input className="form-control" name="date" type="date" value={form.date} onChange={fld} /></div>
          <div className="form-group"><label className="form-label">Start Time</label><input className="form-control" name="start_time" type="time" value={form.start_time} onChange={fld} /></div>
          <div className="form-group"><label className="form-label">Duration (mins)</label><input className="form-control" name="duration" type="number" value={form.duration} onChange={fld} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Venue</label><input className="form-control" name="venue" value={form.venue} onChange={fld} placeholder="e.g. Hall 3" /></div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-control" name="status" value={form.status} onChange={fld}>
              {STATUS_OPTS.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Total Marks</label><input className="form-control" name="total_marks" type="number" value={form.total_marks} onChange={fld} /></div>
          <div className="form-group"><label className="form-label">Pass Marks</label><input className="form-control" name="pass_marks" type="number" value={form.pass_marks} onChange={fld} /></div>
        </div>
        <div className="form-group"><label className="form-label">Instructions</label><textarea className="form-control" name="instructions" value={form.instructions} onChange={fld} placeholder="Exam instructions for students…" /></div>
      </Modal>

      {/* Results Modal */}
      <Modal open={resultsModal.open} onClose={()=>setResultsModal({open:false,exam:null,results:[],students:[],adding:false})} title="Exam Results" subtitle={resultsModal.exam?.title} size="modal-lg">
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
          <button className="btn btn-primary btn-sm" onClick={()=>setResultsModal(v=>({...v,adding:!v.adding}))}>
            <i className="bi bi-plus-lg"></i> {resultsModal.adding?'Cancel':'Add Result'}
          </button>
        </div>
        {resultsModal.adding && (
          <div className="card" style={{marginBottom:20}}>
            <div className="card-body">
              <div className="form-row-3">
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Student</label>
                  <select className="form-control" value={resultForm.student} onChange={e=>setResultForm(v=>({...v,student:e.target.value}))}>
                    <option value="">— Select —</option>
                    {resultsModal.students.map(s=><option key={s.id} value={s.id}>{s.student_id} – {s.full_name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Marks</label>
                  <input className="form-control" type="number" min="0" max={resultsModal.exam?.total_marks} value={resultForm.marks} onChange={e=>setResultForm(v=>({...v,marks:e.target.value}))} placeholder="0–100" />
                </div>
                <div className="form-group" style={{marginBottom:0,alignSelf:'flex-end'}}>
                  <button className="btn btn-accent w-full" onClick={saveResult} disabled={savingResult||!resultForm.student||!resultForm.marks}>
                    {savingResult?'Saving…':'Save Result'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {!resultsModal.results.length
          ? <div className="empty-state"><div className="empty-icon"><i className="bi bi-clipboard2-x"></i></div><h4>No results yet</h4><p>Add results using the button above.</p></div>
          : <table>
              <thead><tr><th>Student</th><th>Student ID</th><th>Marks</th><th>Grade</th><th>Remarks</th><th></th></tr></thead>
              <tbody>
                {resultsModal.results.map(r=>(
                  <tr key={r.id}>
                    <td className="font-medium">{r.student_name}</td>
                    <td><span className="font-mono text-sm">{r.student_id_no}</span></td>
                    <td><span className="font-mono">{r.marks ?? '—'}</span></td>
                    <td><span className={`badge ${GRADE_BADGE[r.grade]||'badge-gray'}`}>{r.grade||'—'}</span></td>
                    <td className="td-muted">{r.remarks||'—'}</td>
                    <td><button className="btn btn-danger btn-icon btn-sm" onClick={()=>deleteResult(r.id)}><i className="bi bi-trash3"></i></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </Modal>

      <ConfirmModal open={confirm.open} onClose={()=>setConfirm({open:false})} onConfirm={del} loading={deleting} title="Delete Exam?" message="All results for this exam will also be permanently deleted." />
    </div>
  );
}