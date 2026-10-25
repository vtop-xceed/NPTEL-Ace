import React from 'react';

// Key is prompted per device and kept in localStorage; never shipped in the bundle.
const openDashboard = () => {
  let key = localStorage.getItem('nptel-admin-key');
  if (!key) {
    key = window.prompt('Admin key:');
    if (key) localStorage.setItem('nptel-admin-key', key);
  }
  if (key) window.open(`https://nptel-feedback.sykik.workers.dev/admin?admin=${encodeURIComponent(key)}`, '_blank');
};

export default function AdminToast({ onClose }) {
  return (
    <div className="admin-toast">
      <div style={{ marginBottom: '10px' }}>
        <span className="ms">shield</span> <strong>Admin Menu</strong>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Live visits, course picks, and feedback:
      </p>
      <button
        onClick={openDashboard}
        style={{
          display: 'inline-block',
          background: 'var(--accent)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}
      >
        Open Live Stats ↗
      </button>
      <button
        onClick={onClose}
        style={{
          display: 'block',
          margin: '10px auto 0',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: '0.8rem',
        }}
      >
        Close
      </button>
    </div>
  );
}
