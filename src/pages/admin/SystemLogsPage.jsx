import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getSystemLogs } from '../../services/admin.service';

function LogRow({ log }) {
  const getIcon = (type) => {
    switch(type) {
      case 'error': return { icon: 'error', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
      case 'warning': return { icon: 'warning', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
      default: return { icon: 'info', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    }
  };
  const ui = getIcon(log.type);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: ui.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: ui.color }}>{ui.icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 4px' }}>{log.message || log.action}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: 0 }}>
          {log.user ? `Người dùng: ${log.user} • ` : ''} 
          {new Date(log.created_at || Date.now()).toLocaleString('vi-VN')}
        </p>
      </div>
    </div>
  );
}

export default function SystemLogsPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSystemLogs()
      .then((res) => { if (!cancelled) setLogs(res.data || []); })
      .catch((err) => { 
        if (!cancelled) {
          setError(err.response?.data?.message || 'Không thể tải System Logs.');
          // Mock data
          setLogs([
            { id: 1, type: 'info', action: 'User Login', user: 'admin@edu.vn', created_at: new Date() },
            { id: 2, type: 'warning', message: 'Tải lượng CPU cao (85%)', created_at: new Date(Date.now() - 3600000) },
            { id: 3, type: 'error', message: 'Kết nối Database thất bại', created_at: new Date(Date.now() - 7200000) },
          ]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-ink)' }}>
          System Logs
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
          Nhật ký hoạt động của hệ thống
        </p>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)', marginBottom: '12px' }}>
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '60%', height: '14px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '40%', height: '12px' }} />
              </div>
            </div>
          ))
        ) : error && logs.length === 0 ? (
          <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', color: '#ef4444', textAlign: 'center' }}>
            {error}
          </div>
        ) : (
          <div>
            {logs.map(log => <LogRow key={log.id} log={log} />)}
          </div>
        )}
      </div>
    </div>
  );
}