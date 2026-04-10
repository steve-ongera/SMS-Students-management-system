import { useEffect } from 'react';

export default function Modal({ open, onClose, title, subtitle, size = '', children, footer }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title="" size="modal-sm">
      <div style={{ textAlign: 'center' }}>
        <div className="confirm-icon"><i className="bi bi-trash3"></i></div>
        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: 8 }}>{title || 'Confirm Delete'}</h4>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
          {message || 'This action cannot be undone. Are you sure?'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Deleting…</> : <><i className="bi bi-trash3"></i> Delete</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}