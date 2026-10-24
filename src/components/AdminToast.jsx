import React from 'react';

const COUNTER_NAMESPACE = 'nptel-cloud-mcq-ravikant';
const COUNTER_KEY = 'visits';

export default function AdminToast({ onClose }) {
  const statsUrl = `https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/${COUNTER_KEY}`;

  return (
    <div className="admin-toast">
      <div style={{ marginBottom: '10px' }}>
        <span className="ms">shield</span> <strong>Admin Menu</strong>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Click below to see the live visitor data:
      </p>
      <a
        href={statsUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          background: 'var(--accent)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '0.9rem',
        }}
      >
        Open Live Stats ↗
      </a>
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
