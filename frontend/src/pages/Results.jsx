import { useState, useEffect, useCallback } from 'react';
import { resultsAPI, examsAPI, studentsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';

const GRADE_BADGE = { A:'badge-green', B:'badge-teal', C:'badge-blue', D:'badge-amber', E:'badge-red', ABS:'badge-gray' };

export default function Results() {
  const { toast } = useToast();
  const [results, setResults]   = useState([]);
  const [exams, setExams]       = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ exam:'', student:'' });
  const [modal, setModal]       = useState({ open:false, data:null });
  const [confirm, setConfirm]   = useState({ open:false, id:null });
  const [form, setForm]         = useState({ exam:'', student:'', marks:'', remarks:'' });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.exam) params.exam = filters.exam;
      if (filters.student) params.student = filters.student;
      const res = await resultsAPI.list(params);
      setResults(res.results || res);
    } catch(e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    examsAPI.list({ page_size:200 }).then(r=>setExams(r.results||r)).catch(()=>{});
    studentsAPI.list({ page_size:200 }).then(r=>setStudents(r.results||r)).catch(()=>{});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      modal.data ? await resultsAPI.update(modal.data.id, form) : await resultsAPI.create(form);
      toast(modal.data ? 'Result updated' : 'Result added');
      setModal({open:false}); load();
    } catch(e) { toast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    setDeleting(true);
    try { await resultsAPI.delete(confirm.id); toast('Result deleted'); setConfirm({open:false}); load(); }
    catch(e) { toast(e.message,'error'); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header"><h2>Exam Results</h2><p>View and manage all recorded results.</p></div>
        <button className="btn btn-primary" onClick={()=>{ setForm({exam:'',student:'',marks:'',remarks:''}); setModal({open:true,data:null}); }}>
          <i className="bi bi-plus-lg"></i> Add Result
        </button>
      </div>

      <div className="toolbar">
        <select className="filter-select" value={filters.exam} onChange={e=>setFilters(f=>({...f,exam:e.target.value}))}>
          <option value="">All Exams</option>
          {exams.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <select className="filter-select" value={filters.student} onChange={e=>setFilters(f=>({...f,student:e.target.value}))}>
          <option value="">All Students</option>
          {students.map(s=><option key={s.id} value={s.id}>{s.student_id} – {s.full_name}</option>)}
        </select>
        {(filters.exam||filters.student) && <button className="btn btn-ghost btn-sm" onClick={()=>setFilters({exam:'',student:''})}><i className="bi bi-x-circle"></i> Clear</button>}
      </div>

      <div className="table-wrapper">
        {loading
          ? <div className="loading-overlay"><div className="spinner"></div><span>Loading results…</span></div>
          : !results.length
            ? <div className="empty-state"><div className="empty-icon"><i className="bi bi-bar-chart-line"></i></div><h4>No results found</h4><p>Use filters or add a result.</p></div>
            : (
              <table>
                <thead><tr><th>Student</th><th>Student ID</th><th>Exam</th><th>Marks</th><th>Grade</th><th>Remarks</th><th>Recorded</th><th>Actions</th></tr></thead>
                <tbody>
                  {results.map(r=>(
                    <tr key={r.id}>
                      <td className="font-medium">{r.student_name}</td>
                      <td><span className="font-mono text-sm">{r.student_id_no}</span></td>
                      <td className="td-muted">{r.exam_title}</td>
                      <td><span className="font-mono">{r.marks ?? '—'}</span></td>
                      <td><span className={`badge ${GRADE_BADGE[r.grade]||'badge-gray'}`}>{r.grade||'—'}</span></td>
                      <td className="td-muted">{r.remarks||'—'}</td>
                      <td className="td-muted">{r.recorded_at?.slice(0,10)}</td>
                      <td>
                        <div className="action-row">
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>{ setForm({exam:r.exam,student:r.student,marks:r.marks,remarks:r.remarks}); setModal({open:true,data:r}); }}><i className="bi bi-pencil"></i></button>
                          <button className="btn btn-danger btn-icon btn-sm" onClick={()=>setConfirm({open:true,id:r.id})}><i className="bi bi-trash3"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        }
      </div>

      <Modal open={modal.open} onClose={()=>setModal({open:false})} title={modal.data?'Edit Result':'Add Result'}
        footer={<><button className="btn btn-outline" onClick={()=>setModal({open:false})} disabled={saving}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button></>}>
        <div className="form-group"><label className="form-label">Exam <span className="required">*</span></label>
          <select className="form-control" value={form.exam} onChange={e=>setForm(f=>({...f,exam:e.target.value}))}>
            <option value="">— Select Exam —</option>
            {exams.map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Student <span className="required">*</span></label>
          <select className="form-control" value={form.student} onChange={e=>setForm(f=>({...f,student:e.target.value}))}>
            <option value="">— Select Student —</option>
            {students.map(s=><option key={s.id} value={s.id}>{s.student_id} – {s.full_name}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Marks <span className="required">*</span></label><input className="form-control" type="number" min="0" value={form.marks} onChange={e=>setForm(f=>({...f,marks:e.target.value}))} placeholder="0–100" /></div>
        <div className="form-group"><label className="form-label">Remarks</label><textarea className="form-control" value={form.remarks} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))} placeholder="Optional remarks…" /></div>
      </Modal>

      <ConfirmModal open={confirm.open} onClose={()=>setConfirm({open:false})} onConfirm={del} loading={deleting} title="Delete Result?" message="This result record will be permanently removed." />
    </div>
  );
}