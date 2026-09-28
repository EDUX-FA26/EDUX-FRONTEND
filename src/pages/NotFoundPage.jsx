import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-primary-bg)',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '20px',
          background: '#fff1e7', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--color-primary)' }}>
            search_off
          </span>
        </div>
        <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', margin: '0 0 8px' }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 12px' }}>
          Không tìm thấy trang
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', marginBottom: '28px' }}>
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-primary"
          style={{ margin: '0 auto' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_back</span>
          Quay lại
        </button>
      </div>
    </div>
  );
}