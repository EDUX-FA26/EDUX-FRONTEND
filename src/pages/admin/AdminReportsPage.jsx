import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSystemReports,
  getAiUsageStats,
  getAuditLogs,
  exportLearningActivity,
  exportAiTransparency,
} from "../../services/report.service";
import ExcelJS from "exceljs";

const numberFormat = new Intl.NumberFormat("vi-VN");
const dateFormat = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
};
const unwrap = (response) => response?.data ?? response;
const asNumber = (value) => Number(value) || 0;

const palette = {
  purple: "#7657d6",
  blue: "#3978d5",
  teal: "#159b87",
  orange: "#e99438",
  red: "#d95f68",
  muted: "#8993a5",
};

function Card({ children, className = "", style = {} }) {
  return <section className={`reports-card ${className}`} style={style}>{children}</section>;
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="reports-section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, icon, tone, helper }) {
  return (
    <Card className="reports-metric">
      <div className="reports-metric-top">
        <span>{label}</span>
        <span className={`reports-metric-icon ${tone}`} aria-hidden="true">{icon}</span>
      </div>
      <strong>{value == null ? "—" : numberFormat.format(asNumber(value))}</strong>
      {helper && <small>{helper}</small>}
    </Card>
  );
}

function BarChart({ items, nameKey, valueKey, emptyText = "Chưa có dữ liệu để hiển thị" }) {
  const max = Math.max(1, ...items.map((item) => asNumber(item[valueKey])));
  if (!items.length) return <div className="reports-empty-chart">{emptyText}</div>;
  return (
    <div className="reports-bars">
      {items.map((item, index) => {
        const value = asNumber(item[valueKey]);
        const width = Math.max(value > 0 ? 2 : 0, (value / max) * 100);
        return (
          <div className="reports-bar-row" key={String(item[nameKey] ?? index)}>
            <div className="reports-bar-label" title={String(item[nameKey] ?? "Khác")}>
              {String(item[nameKey] ?? "Chưa phân loại").replaceAll("_", " ")}
            </div>
            <div className="reports-bar-track">
              <div className="reports-bar-fill" style={{ width: `${width}%`, background: [palette.purple, palette.blue, palette.teal, palette.orange][index % 4] }} />
            </div>
            <strong>{numberFormat.format(value)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ items, nameKey, valueKey }) {
  const total = items.reduce((sum, item) => sum + asNumber(item[valueKey]), 0);
  const colors = [palette.teal, palette.blue, palette.orange, palette.purple, palette.red, palette.muted];
  let cursor = 0;
  const segments = items.map((item, index) => {
    const value = asNumber(item[valueKey]);
    const start = cursor;
    cursor += total ? (value / total) * 100 : 0;
    return { ...item, color: colors[index % colors.length], start, end: cursor, value };
  });
  const gradient = total
    ? `conic-gradient(${segments.map((item) => `${item.color} ${item.start}% ${item.end}%`).join(", ")})`
    : "conic-gradient(#e8ebf1 0% 100%)";

  if (!items.length || total === 0) {
    return <div className="reports-empty-chart">Chưa có dữ liệu để hiển thị</div>;
  }
  return (
    <div className="reports-donut-layout">
      <div className="reports-donut" style={{ background: gradient }} role="img" aria-label={`Tổng ${numberFormat.format(total)} quyết định`}>
        <div><strong>{numberFormat.format(total)}</strong><span>Tổng lượt</span></div>
      </div>
      <div className="reports-legend">
        {segments.map((item, index) => (
          <div className="reports-legend-item" key={String(item[nameKey] ?? index)}>
            <span className="reports-legend-dot" style={{ background: item.color }} />
            <span>{String(item[nameKey] ?? "Chưa phân loại").replaceAll("_", " ")}</span>
            <strong>{numberFormat.format(item.value)} <small>{((item.value / total) * 100).toFixed(1)}%</small></strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || "unknown").toLowerCase();
  const tone = ["open", "pending"].includes(normalized) ? "warning"
    : ["resolved", "closed", "reviewed"].includes(normalized) ? "success" : "neutral";
  return <span className={`reports-status ${tone}`}>{normalized.replaceAll("_", " ")}</span>;
}

const styles = `
.admin-reports { display:flex; flex-direction:column; gap:22px; min-width:0; color:var(--color-ink,#202638); }
.reports-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.reports-title-wrap h1 { margin:0; font-size:clamp(1.35rem,2vw,1.75rem); font-weight:800; letter-spacing:-.03em; }
.reports-title-wrap p { margin:6px 0 0; color:var(--color-ink-muted,#778196); font-size:.9rem; }
.reports-header-actions { display:flex; gap:9px; flex-wrap:wrap; }
.reports-header-actions button,.reports-filter select,.reports-filter input { min-height:39px; border:1px solid var(--color-border,#e4e7ee); border-radius:10px; padding:0 12px; background:var(--color-surface,#fff); color:inherit; font:inherit; font-size:.82rem; }
.reports-header-actions button { cursor:pointer; font-weight:650; }
.reports-header-actions button.primary { background:var(--color-primary,#6750c8); border-color:var(--color-primary,#6750c8); color:white; }
.reports-tabs { display:flex; gap:5px; overflow-x:auto; border-bottom:1px solid var(--color-border,#e4e7ee); scrollbar-width:thin; }
.reports-tab { white-space:nowrap; padding:12px 15px; border:0; border-bottom:3px solid transparent; background:transparent; color:var(--color-ink-muted,#778196); font:inherit; font-size:.86rem; font-weight:700; cursor:pointer; }
.reports-tab[aria-selected="true"] { color:var(--color-primary,#6750c8); border-bottom-color:var(--color-primary,#6750c8); }
.reports-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
.reports-card { min-width:0; border:1px solid var(--color-border,#e7e9ef); border-radius:15px; background:var(--color-surface,#fff); box-shadow:0 3px 14px rgba(30,40,70,.035); }
.reports-metric { padding:17px; }
.reports-metric-top { display:flex; justify-content:space-between; align-items:center; gap:8px; color:var(--color-ink-muted,#778196); font-size:.79rem; font-weight:650; }
.reports-metric-icon { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; font-size:1rem; background:#f0edff; color:var(--color-primary,#6750c8); }
.reports-metric-icon.blue { background:#eaf2ff; color:#3978d5; }
.reports-metric-icon.teal { background:#e7f7f3; color:#159b87; }
.reports-metric-icon.orange { background:#fff3e7; color:#d78328; }
.reports-metric>strong { display:block; margin-top:12px; font-size:clamp(1.45rem,2.4vw,1.9rem); letter-spacing:-.04em; }
.reports-metric small { display:block; margin-top:5px; color:var(--color-ink-muted,#8993a5); font-size:.72rem; }
.reports-panels { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
.reports-panel { padding:19px; }
.reports-section-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:17px; }
.reports-section-heading h2 { margin:0; font-size:1rem; font-weight:750; }
.reports-section-heading p { margin:5px 0 0; color:var(--color-ink-muted,#8993a5); font-size:.77rem; line-height:1.5; }
.reports-bars { display:flex; flex-direction:column; gap:15px; }
.reports-bar-row { display:grid; grid-template-columns:minmax(90px, .85fr) minmax(80px,2fr) 58px; align-items:center; gap:10px; }
.reports-bar-label { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--color-ink-muted,#667085); font-size:.79rem; text-transform:capitalize; }
.reports-bar-track { height:10px; overflow:hidden; border-radius:20px; background:#eff1f5; }
.reports-bar-fill { height:100%; border-radius:20px; transition:width .25s ease; }
.reports-bar-row>strong { text-align:right; font-size:.8rem; font-variant-numeric:tabular-nums; }
.reports-empty-chart,.reports-state { padding:28px 16px; text-align:center; color:var(--color-ink-muted,#8993a5); font-size:.85rem; }
.reports-donut-layout { display:flex; align-items:center; gap:22px; min-height:190px; }
.reports-donut { flex:0 0 158px; width:158px; height:158px; border-radius:50%; display:grid; place-items:center; }
.reports-donut>div { width:106px; height:106px; border-radius:50%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:var(--color-surface,#fff); }
.reports-donut strong { font-size:1.2rem; }.reports-donut span { color:var(--color-ink-muted,#8993a5); font-size:.7rem; }
.reports-legend { display:flex; flex-direction:column; gap:11px; min-width:0; flex:1; }
.reports-legend-item { display:grid; grid-template-columns:9px minmax(0,1fr) auto; align-items:center; gap:8px; font-size:.77rem; text-transform:capitalize; }
.reports-legend-dot { width:9px; height:9px; border-radius:50%; }.reports-legend-item>span:nth-child(2) { overflow-wrap:anywhere; color:var(--color-ink-muted,#667085); }.reports-legend-item strong { white-space:nowrap; font-variant-numeric:tabular-nums; }.reports-legend-item small { color:var(--color-ink-muted,#8993a5); font-weight:500; }
.reports-filter { display:flex; gap:9px; flex-wrap:wrap; margin-bottom:14px; }
.reports-filter input { flex:1 1 190px; min-width:0; }.reports-filter select { flex:0 1 180px; max-width:100%; }
.reports-table-wrap { overflow-x:auto; width:100%; }
.reports-table { width:100%; min-width:680px; border-collapse:collapse; text-align:left; }
.reports-table th { padding:12px 15px; background:var(--color-primary-bg,#f7f6fc); color:var(--color-ink-muted,#778196); font-size:.7rem; text-transform:uppercase; letter-spacing:.04em; }
.reports-table td { padding:13px 15px; border-top:1px solid var(--color-border,#edf0f4); font-size:.79rem; vertical-align:middle; }
.reports-table tr:hover td { background:rgba(120,100,210,.035); }
.reports-id { font-family:monospace; color:var(--color-ink-muted,#8993a5); }
.reports-status { display:inline-flex; border-radius:30px; padding:4px 9px; font-size:.7rem; font-weight:700; text-transform:capitalize; background:#f0f1f4; color:#667085; }
.reports-status.warning { background:#fff3df; color:#a96613; }.reports-status.success { background:#e5f6ef; color:#147b5b; }
.reports-note { color:var(--color-ink-muted,#8993a5); font-size:.74rem; line-height:1.5; }
.reports-error { padding:18px; border:1px solid #f2c8c8; border-radius:12px; background:#fff8f8; color:#a33b3b; }
.reports-error button { margin-left:10px; border:0; background:transparent; color:inherit; text-decoration:underline; cursor:pointer; font-weight:700; }
@media(max-width:1000px){.reports-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:720px){.reports-panels{grid-template-columns:1fr;}.reports-panel{padding:15px;}.reports-donut-layout{gap:15px;}.reports-donut{flex-basis:130px;width:130px;height:130px;}.reports-donut>div{width:88px;height:88px;}}
@media(max-width:440px){.reports-grid{grid-template-columns:1fr 1fr;gap:9px;}.reports-metric{padding:12px;}.reports-metric-top{font-size:.7rem;}.reports-metric-icon{width:29px;height:29px;}.reports-metric>strong{font-size:1.35rem;}.reports-header-actions{width:100%;}.reports-header-actions button{flex:1;}.reports-donut-layout{flex-direction:column;align-items:flex-start;}.reports-legend{width:100%;}}
`;

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");
  const [systemStats, setSystemStats] = useState(null);
  const [aiStats, setAiStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditStatus, setAuditStatus] = useState("all");
  const [auditType, setAuditType] = useState("all");
  const [auditRange, setAuditRange] = useState("all");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      getSystemReports(),
      getAiUsageStats(),
      getAuditLogs(),
    ]);
    const failures = [];
    if (results[0].status === "fulfilled") setSystemStats(unwrap(results[0].value));
    else failures.push("Tổng quan hệ thống");
    if (results[1].status === "fulfilled") setAiStats(unwrap(results[1].value));
    else failures.push("Thống kê AI");
    if (results[2].status === "fulfilled") {
      const logs = unwrap(results[2].value);
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } else failures.push("Audit Logs");
    setError(failures.length ? `Không tải được: ${failures.join(", ")}. Vui lòng thử tải lại.` : "");
    setLoading(false);
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const toolItems = useMemo(() => (Array.isArray(aiStats?.tools) ? aiStats.tools : [])
    .map((item) => ({ ...item, count: asNumber(item.count) }))
    .sort((a, b) => b.count - a.count), [aiStats]);
  const decisionItems = useMemo(() => (Array.isArray(aiStats?.decisions) ? aiStats.decisions : [])
    .map((item) => ({ ...item, count: asNumber(item.count) }))
    .sort((a, b) => b.count - a.count), [aiStats]);
  const totalAi = asNumber(aiStats?.totalInteractions);
  const activeRate = systemStats && asNumber(systemStats.totalUsers) > 0
    ? (asNumber(systemStats.activeUsers) / asNumber(systemStats.totalUsers)) * 100 : null;
  const totalDecisions = decisionItems.reduce((sum, item) => sum + item.count, 0);
  const uniqueTypes = [...new Set(auditLogs.map((log) => log.flag_type).filter(Boolean))];

  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const rangeMs = auditRange === "7d" ? 7 * 86400000 : auditRange === "30d" ? 30 * 86400000 : auditRange === "90d" ? 90 * 86400000 : null;
    const search = auditSearch.trim().toLowerCase();
    return auditLogs.filter((log) => {
      const matchesSearch = !search || [log.id, log.flag_type, log.flagged_by, log.status]
        .some((value) => String(value ?? "").toLowerCase().includes(search));
      const matchesStatus = auditStatus === "all" || String(log.status) === auditStatus;
      const matchesType = auditType === "all" || String(log.flag_type) === auditType;
      const created = new Date(log.created_at).getTime();
      const matchesRange = !rangeMs || (Number.isFinite(created) && created >= now - rangeMs);
      return matchesSearch && matchesStatus && matchesType && matchesRange;
    });
  }, [auditLogs, auditSearch, auditStatus, auditType, auditRange]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const response = type === "learning" ? await exportLearningActivity() : await exportAiTransparency();
      const payload = unwrap(response);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${type === "learning" ? "learning-activity" : "ai-transparency"}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      window.alert(exportError?.response?.data?.message || "Không thể xuất báo cáo. Vui lòng thử lại.");
    } finally {
      setExporting("");
    }

  const tabs = [
    { id: "overview", label: "Tổng quan hệ thống" },
    { id: "ai-usage", label: "AI & minh bạch" },
    { id: "audit", label: "Audit Logs" },
  ];

  return (
    <div className="admin-reports">
      <style>{styles}</style>
      <header className="reports-header">
        <div className="reports-title-wrap">
          <h1>Báo cáo &amp; Thống kê</h1>
          <p>Theo dõi dữ liệu vận hành, hoạt động AI và nhật ký cảnh báo của EduTrack.</p>
        </div>
        <div className="reports-header-actions">
          <button type="button" onClick={() => handleExport("learning")} disabled={!!exporting}>
            {exporting === "learning" ? "Đang xuất..." : "↓ Xuất dữ liệu học tập"}
          </button>
          <button type="button" className="primary" onClick={() => handleExport("ai")} disabled={!!exporting}>
            {exporting === "ai" ? "Đang xuất..." : "↓ Xuất dữ liệu AI"}
          </button>
        </div>
      </header>

      <nav className="reports-tabs" aria-label="Các nhóm báo cáo">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" className="reports-tab" aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </nav>

      {error && <div className="reports-error" role="alert">{error}<button type="button" onClick={loadReports}>Thử lại</button></div>}
      {loading ? <div className="reports-state">Đang tải dữ liệu báo cáo từ hệ thống...</div> : (
        <>
          {activeTab === "overview" && (
            <>
              <SectionHeading title="Tình hình hệ thống" description="Số liệu tổng hợp trực tiếp từ các bảng dữ liệu hiện có." />
              {!systemStats ? <Card><div className="reports-state">Không có dữ liệu tổng quan.</div></Card> : (
                <>
                  <div className="reports-grid">
                    <MetricCard label="Tổng người dùng" value={systemStats.totalUsers} icon="◎" tone="" helper="Tất cả tài khoản trong hệ thống" />
                    <MetricCard label="Người dùng hoạt động" value={systemStats.activeUsers} icon="✓" tone="teal" helper={activeRate == null ? "Chưa đủ dữ liệu tính tỷ lệ" : `${activeRate.toFixed(1)}% tổng người dùng`} />
                    <MetricCard label="Tổng lớp học" value={systemStats.totalClasses} icon="▦" tone="blue" helper="Số lớp hiện có" />
                    <MetricCard label="Tổng bài nộp" value={systemStats.totalSubmissions} icon="▤" tone="orange" helper="Số submission đã ghi nhận" />
                  </div>
                  <div className="reports-panels">
                    <Card className="reports-panel">
                      <SectionHeading title="Quy mô dữ liệu" description="So sánh số lượng bản ghi theo từng nhóm dữ liệu." />
                      <BarChart nameKey="label" valueKey="value" items={[
                        { label: "Người dùng", value: asNumber(systemStats.totalUsers) },
                        { label: "Đang hoạt động", value: asNumber(systemStats.activeUsers) },
                        { label: "Lớp học", value: asNumber(systemStats.totalClasses) },
                        { label: "Bài nộp", value: asNumber(systemStats.totalSubmissions) },
                      ]} />
                    </Card>
                    <Card className="reports-panel">
                      <SectionHeading title="Tỷ lệ hoạt động tài khoản" description="Tính từ tổng người dùng và người dùng có is_active = true." />
                      {activeRate == null ? <div className="reports-empty-chart">Chưa có dữ liệu người dùng.</div> : (
                        <div className="reports-donut-layout">
                          <div className="reports-donut" style={{ background: `conic-gradient(${palette.teal} 0% ${Math.min(activeRate, 100)}%, #edf0f4 ${Math.min(activeRate, 100)}% 100%)` }}>
                            <div><strong>{activeRate.toFixed(1)}%</strong><span>Đang hoạt động</span></div>
                          </div>
                          <div className="reports-legend">
                            <div className="reports-legend-item"><span className="reports-legend-dot" style={{ background: palette.teal }} /><span>Đang hoạt động</span><strong>{numberFormat.format(asNumber(systemStats.activeUsers))}</strong></div>
                            <div className="reports-legend-item"><span className="reports-legend-dot" style={{ background: "#dfe3ea" }} /><span>Còn lại</span><strong>{numberFormat.format(Math.max(0, asNumber(systemStats.totalUsers) - asNumber(systemStats.activeUsers)))}</strong></div>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                  <p className="reports-note">Lưu ý: API hiện tại trả về số liệu tổng hợp toàn hệ thống, chưa cung cấp chuỗi dữ liệu theo ngày/tháng. Vì vậy biểu đồ đang thể hiện quy mô và tỷ lệ thực, không dựng xu hướng giả.</p>
                </>
              )}
            </>
          )}

          {activeTab === "ai-usage" && (
            <>
              <SectionHeading title="Sử dụng AI & minh bạch" description="Phân tích lượt tương tác, công cụ AI và quyết định do sinh viên khai báo." />
              {!aiStats ? <Card><div className="reports-state">Không có dữ liệu thống kê AI.</div></Card> : (
                <>
                  <div className="reports-grid">
                    <MetricCard label="Tổng lượt tương tác AI" value={totalAi} icon="✧" tone="" helper="Từ bảng ai_interactions" />
                    <MetricCard label="Nhóm công cụ AI" value={toolItems.length} icon="⌘" tone="blue" helper="Số công cụ có dữ liệu" />
                    <MetricCard label="Lượt có quyết định" value={totalDecisions} icon="✓" tone="teal" helper="Tổng các nhóm student_decision" />
                    <MetricCard label="Nhóm quyết định" value={decisionItems.length} icon="◷" tone="orange" helper="Các lựa chọn được ghi nhận" />
                  </div>
                  <div className="reports-panels">
                    <Card className="reports-panel">
                      <SectionHeading title="Lượt dùng theo công cụ" description="Số bản ghi ai_interactions được nhóm theo ai_tool." />
                      <BarChart items={toolItems} nameKey="ai_tool" valueKey="count" />
                    </Card>
                    <Card className="reports-panel">
                      <SectionHeading title="Quyết định của sinh viên" description="Phân bố student_decision theo dữ liệu đã khai báo." />
                      <DonutChart items={decisionItems} nameKey="student_decision" valueKey="count" />
                    </Card>
                  </div>
                  <p className="reports-note">Các chỉ số phản ánh dữ liệu khai báo/lưu trữ trong hệ thống; không phải kết quả phát hiện gian lận hoặc kết luận mức độ phụ thuộc AI.</p>
                </>
              )}
            </>
          )}

          {activeTab === "audit" && (
            <>
              <SectionHeading title="Nhật ký cảnh báo" description={`Hiển thị ${auditLogs.length} bản ghi gần nhất do API hiện tại trả về.`} />
              <div className="reports-grid">
                <MetricCard label="Tổng bản ghi tải về" value={auditLogs.length} icon="▤" tone="" helper="API giới hạn 50 bản ghi mới nhất" />
                <MetricCard label="Đang mở / chờ xử lý" value={auditLogs.filter((log) => ["open", "pending"].includes(String(log.status).toLowerCase())).length} icon="!" tone="orange" helper="Theo trạng thái trong submission_flags" />
                <MetricCard label="Đã xử lý / đóng" value={auditLogs.filter((log) => ["resolved", "reviewed", "closed"].includes(String(log.status).toLowerCase())).length} icon="✓" tone="teal" helper="Theo trạng thái trong submission_flags" />
                <MetricCard label="Loại cảnh báo" value={uniqueTypes.length} icon="⚑" tone="blue" helper="Số flag_type khác nhau" />
              </div>
              <Card className="reports-panel">
                <div className="reports-filter">
                  <input aria-label="Tìm kiếm audit log" placeholder="Tìm theo ID, loại flag, người tạo..." value={auditSearch} onChange={(event) => setAuditSearch(event.target.value)} />
                  <select aria-label="Lọc trạng thái" value={auditStatus} onChange={(event) => setAuditStatus(event.target.value)}>
                    <option value="all">Tất cả trạng thái</option>
                    {[...new Set(auditLogs.map((log) => log.status).filter(Boolean))].map((status) => <option key={status} value={status}>{String(status).replaceAll("_", " ")}</option>)}
                  </select>
                  <select aria-label="Lọc loại cảnh báo" value={auditType} onChange={(event) => setAuditType(event.target.value)}>
                    <option value="all">Tất cả loại flag</option>
                    {uniqueTypes.map((type) => <option key={type} value={type}>{String(type).replaceAll("_", " ")}</option>)}
                  </select>
                  <select aria-label="Lọc khoảng thời gian" value={auditRange} onChange={(event) => setAuditRange(event.target.value)}>
                    <option value="all">Mọi thời gian trong dữ liệu tải về</option>
                    <option value="7d">7 ngày gần đây</option>
                    <option value="30d">30 ngày gần đây</option>
                    <option value="90d">90 ngày gần đây</option>
                  </select>
                </div>
                <div className="reports-table-wrap">
                  <table className="reports-table">
                    <thead><tr><th>ID</th><th>Loại flag</th><th>Người tạo</th><th>Trạng thái</th><th>Thời gian</th></tr></thead>
                    <tbody>
                      {filteredLogs.map((log, index) => (
                        <tr key={log.id ?? index}>
                          <td className="reports-id">{String(log.id ?? "—").slice(0, 12)}</td>
                          <td>{String(log.flag_type ?? "Chưa phân loại").replaceAll("_", " ")}</td>
                          <td>{log.flagged_by ?? "—"}</td>
                          <td><StatusPill status={log.status} /></td>
                          <td>{dateFormat(log.created_at)}</td>
                        </tr>
                      ))}
                      {!filteredLogs.length && <tr><td colSpan="5"><div className="reports-state">Không tìm thấy bản ghi phù hợp với bộ lọc.</div></td></tr>}
                    </tbody>
                  </table>
                </div>
                <p className="reports-note" style={{ margin: "12px 0 0" }}>Bộ lọc được áp dụng trên 50 bản ghi gần nhất do endpoint hiện tại cung cấp; chưa phải truy vấn phân trang toàn bộ lịch sử.</p>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}