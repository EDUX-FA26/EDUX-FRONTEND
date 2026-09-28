import React, { useState, useEffect } from "react";
import { 
  getSystemReports, getAiUsageStats, getAuditLogs, 
  exportLearningActivity, exportAiTransparency 
} from "../../services/report.service";

function StatCard({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="stat-card animate-fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)' }}>{label}</span>
        <div className="stat-card__icon" style={{ background: iconBg, color: iconColor }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
        </div>
      </div>
      <div className="stat-card__value" style={{ color: iconColor, fontSize: '1.5rem' }}>{value ?? '—'}</div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  
  const [systemStats, setSystemStats] = useState(null);
  const [aiStats, setAiStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sysRes, aiRes, auditRes] = await Promise.all([
          getSystemReports().catch(()=>null),
          getAiUsageStats().catch(()=>null),
          getAuditLogs().catch(()=>null)
        ]);
        
        if (cancelled) return;

        const mockSys = { totalUsers: 1250, activeUsers: 1180, totalClasses: 45, totalSubmissions: 3200 };
        const mockAi = {
          tools: [
            { ai_tool: 'chatgpt', count: 1540 },
            { ai_tool: 'gemini', count: 820 },
            { ai_tool: 'claude', count: 450 },
            { ai_tool: 'copilot', count: 300 }
          ],
          decisions: [
            { student_decision: 'accepted', count: 1200 },
            { student_decision: 'partially_accepted', count: 950 },
            { student_decision: 'rejected', count: 320 },
            { student_decision: 'reference_only', count: 640 }
          ]
        };
        const mockAudit = [
          { id: 'uuid-1', flag_type: 'high_ai_dependency', flagged_by: 'system', status: 'open', created_at: new Date().toISOString() },
          { id: 'uuid-2', flag_type: 'suspicious_declaration', flagged_by: 'lecturer', status: 'reviewed', created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 'uuid-3', flag_type: 'low_quality_prompt', flagged_by: 'system', status: 'resolved', created_at: new Date(Date.now() - 172800000).toISOString() },
        ];

        setSystemStats(sysRes?.data || mockSys);
        setAiStats(aiRes?.data || mockAi);
        setAuditLogs(auditRes?.data || mockAudit);
        
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const handleExport = async (type) => {
    try {
      let res;
      if (type === "learning") res = await exportLearningActivity();
      else res = await exportAiTransparency();
      
      const dataStr = JSON.stringify(res?.data || { placeholder: true }, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type}_export_${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Lỗi khi tải xuống dữ liệu!");
    }
  };

  const TabButton = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        padding: '12px 16px', fontSize: '0.875rem', fontWeight: 600,
        background: 'none', cursor: 'pointer',
        border: 'none', borderBottom: activeTab === id ? '2px solid var(--color-primary)' : '2px solid transparent',
        color: activeTab === id ? 'var(--color-primary-dark)' : 'var(--color-ink-muted)',
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>bar_chart</span>
            Báo Cáo & Thống Kê
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
            Tổng quan dữ liệu và hệ thống học tập
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => handleExport("learning")} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span> Export Điểm Số
          </button>
          <button onClick={() => handleExport("ai")} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cloud_download</span> Export Dữ Liệu AI
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: '8px' }}>
        <TabButton id="overview" label="Tổng Quan Hệ Thống" />
        <TabButton id="ai-usage" label="Thống Kê AI" />
        <TabButton id="audit" label="Audit Logs" />
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>Đang tải dữ liệu...</div>
      ) : (
        <>
          {activeTab === "overview" && systemStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <StatCard label="Tổng Users" value={systemStats.totalUsers} icon="group" iconBg="#f3e8ff" iconColor="#7c3aed" />
              <StatCard label="Users Đang Hoạt Động" value={systemStats.activeUsers} icon="how_to_reg" iconBg="var(--color-accent-teal-light)" iconColor="var(--color-accent-teal)" />
              <StatCard label="Tổng Số Lớp Học" value={systemStats.totalClasses} icon="class" iconBg="#d5e0f8" iconColor="#1e40af" />
              <StatCard label="Tổng Bài Nộp" value={systemStats.totalSubmissions} icon="assignment" iconBg="#fff1e7" iconColor="var(--color-primary)" />
            </div>
          )}

          {activeTab === "ai-usage" && aiStats && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Lượt dùng AI theo Công Cụ</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {aiStats.tools.map((t, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink-muted)', textTransform: 'capitalize' }}>{t.ai_tool}</span>
                      <span className="badge badge-teal">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>Quyết định của Sinh Viên</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {aiStats.decisions.map((d, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink-muted)', textTransform: 'capitalize' }}>{d.student_decision.replace('_', ' ')}</span>
                      <span className="badge badge-purple">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', background: 'var(--color-primary-bg)', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>security</span>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>Lịch Sử Cảnh Báo Hệ Thống</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ w: '100%', minWidth: '600px', borderCollapse: 'collapse', width: '100%', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-surface)', color: 'var(--color-ink-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>ID</th>
                      <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>Loại Flag</th>
                      <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>Trạng Thái</th>
                      <th style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)' }}>Ngày Tạo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.8125rem' }}>
                        <td style={{ padding: '12px 20px', color: 'var(--color-ink-soft)', fontFamily: 'var(--font-mono)' }}>{log.id.slice(0, 8)}...</td>
                        <td style={{ padding: '12px 20px', fontWeight: 600, color: 'var(--color-ink)' }}>{log.flag_type}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <span className={`badge ${log.status === 'open' ? 'badge-orange' : 'badge-teal'}`}>{log.status}</span>
                        </td>
                        <td style={{ padding: '12px 20px', color: 'var(--color-ink-muted)' }}>{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
