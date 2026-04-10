import { useState, useEffect, useCallback } from 'react';
import { enrollmentsAPI, studentsAPI, coursesAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal, { ConfirmModal } from '../components/Modal';

export default function Enrollments() {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents]       = useState([]);
  const [courses, setCourses]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [modal, setModal]             = useState(false);
  const [confirm, setConfirm]         = useState({ open:false, id:null });
  const [form, setForm]               = useState({ student:'', course:'', semester:'' });
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {}; if (search) params.search = search;
      const res = await enrollmentsAPI.list(params);
      setEnrollments(res.results || res);
    } catch(e) { toast(e.message,'error'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    studentsAPI.list({ page_size:200 }).then(r=>setStudents(r.results||r)).catch(()=>{});
    coursesAPI.list({ page_size:200 }).then(r=>setCourses(r.results||r)).catch(()=>{});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await enrollmentsAPI.create(form);
      toast('Enrollment added');
      setModal(false); setForm({ student:'', course:'', semester:'' }); load();
    } catch(e) { toast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    setDeleting(true);
    try { await enrollmentsAPI.delete(confirm.id); toast('Enrollment removed'); setConfirm({open:false}); load(); }
    catch(e) { toast(e.message,'error'); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header"><h2>Enrollments</h2><p>Manage student course enrollments.</p></div>
        <button className="btn btn-primary" onClick={()=>setModal(true)}><i className="bi bi-plus-lg"></i> Enroll Student</button>
      </div>

      <div className="toolbar">
        <div className="search-bar"><i className="bi bi-search"></i><input placeholder="Search by student or course…" value={search} onChange={e=>setSearch(e.target.value)} /></div>
      </div>

      <div className="table-wrapper">
        {loading
          ? <div className="loading-overlay"><div className="spinner"></div><span>Loading enrollments…</span></div>
          : !enrollments.length
            ? <div className="empty-state"><div className="empty-icon"><i className="bi bi-journal-bookmark"></i></div><h4>No enrollments found</h4></div>
            : (
              <table>
                <thead><tr><th>Student</th><th>Course</th><th>Course Code</th><th>Semester</th><th>Enrolled On</th><th></th></tr></thead>
                <tbody>
                  {enrollments.map(e=>(
                    <tr key={e.id}>
                      <td className="font-medium">{e.student_name}</td>
                      <td>{e.course_name}</td>
                      <td><span className="font-mono text-sm">{e.course_code}</span></td>
                      <td><span className="badge badge-blue">{e.semester}</span></td>
                      <td className="td-muted">{e.enrolled_at?.slice(0,10)}</td>
                      <td><button className="btn btn-danger btn-icon btn-sm" onClick={()=>setConfirm({open:true,id:e.id})}><i className="bi bi-trash3"></i></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        }
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="Enroll Student" subtitle="Assign a student to a course for a semester."
        footer={<><button className="btn btn-outline" onClick={()=>setModal(false)} disabled={saving}>Cancel</button><button className="btn btn-primary" onClick={save} disabled={saving||!form.student||!form.course||!form.semester}>{saving?'Saving…':'Enroll'}</button></>}>
        <div className="form-group"><label className="form-label">Student <span className="required">*</span></label>
          <select className="form-control" value={form.student} onChange={e=>setForm(f=>({...f,student:e.target.value}))}>
            <option value="">— Select Student —</option>
            {students.map(s=><option key={s.id} value={s.id}>{s.student_id} – {s.full_name}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Course <span className="required">*</span></label>
          <select className="form-control" value={form.course} onChange={e=>setForm(f=>({...f,course:e.target.value}))}>
            <option value="">— Select Course —</option>
            {courses.map(c=><option key={c.id} value={c.id}>{c.code} – {c.name}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Semester <span className="required">*</span></label>
          <input className="form-control" value={form.semester} onChange={e=>setForm(f=>({...f,semester:e.target.value}))} placeholder="e.g. 2024/1 or Semester 1 2025" />
        </div>
      </Modal>

      <ConfirmModal open={confirm.open} onClose={()=>setConfirm({open:false})} onConfirm={del} loading={deleting} title="Remove Enrollment?" message="The student will be unenrolled from this course." />
    </div>
  );
}