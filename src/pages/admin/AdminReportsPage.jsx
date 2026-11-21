import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSchool } from "../../contexts/SchoolContext";
import {
  getSystemReports,
  getAiUsageStats,
  getAuditLogs,
  exportLearningActivity,
  exportAiTransparency,
} from "../../services/report.service";
import EduxAlert from "../../components/common/EduxAlert";

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

function MetricCard({ label, value, icon, tone }) {
  const iconToneClasses = {
    teal: "bg-[#e7f7f3] text-[#159b87]",
    blue: "bg-[#eaf2ff] text-[#3978d5]",
    orange: "bg-[#fff3e7] text-[#d78328]",
    purple: "bg-[#f0edff] text-[#6750c8]",
  };
  const toneClass = iconToneClasses[tone] || iconToneClasses.purple;

  return (
    <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs min-w-0">
      <div className="min-w-0 pr-2">
        <span className="text-xs font-medium text-slate-500 block truncate">{label}</span>
        <strong className="text-2xl font-bold text-slate-900 mt-0.5 block truncate leading-tight">
          {value == null ? "—" : numberFormat.format(asNumber(value))}
        </strong>
      </div>
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base font-bold ${toneClass}`} aria-hidden="true">
        {icon}
      </span>
    </div>
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
    <div className="flex items-center gap-6 my-auto">
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
.reports-bars { display:flex; flex-direction:column; gap:14px; width:100%; }
.reports-bar-row { display:grid; grid-template-columns:minmax(90px, .9fr) minmax(80px,2fr) 60px; align-items:center; gap:12px; }
.reports-bar-label { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--color-ink-muted,#667085); font-size:.8rem; font-weight:500; text-transform:capitalize; }
.reports-bar-track { height:10px; overflow:hidden; border-radius:20px; background:#eff1f5; }
.reports-bar-fill { height:100%; border-radius:20px; transition:width .25s ease; }
.reports-bar-row>strong { text-align:right; font-size:.82rem; font-variant-numeric:tabular-nums; }
.reports-empty-chart,.reports-state { padding:24px 16px; text-align:center; color:var(--color-ink-muted,#8993a5); font-size:.82rem; }
.reports-donut-layout { display:flex; align-items:center; justify-content:center; gap:24px; width:100%; }
.reports-donut { flex:0 0 160px; width:160px; height:160px; border-radius:50%; display:grid; place-items:center; }
.reports-donut>div { width:110px; height:110px; border-radius:50%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:var(--color-surface,#fff); box-shadow:inset 0 1px 3px rgba(0,0,0,0.04); }
.reports-donut strong { font-size:1.25rem; font-weight:800; color:var(--color-ink,#202638); }
.reports-donut span { color:var(--color-ink-muted,#8993a5); font-size:.72rem; margin-top:2px; }
.reports-legend { display:flex; flex-direction:column; gap:9px; min-width:0; flex:1; max-width:240px; }
.reports-legend-item { display:grid; grid-template-columns:10px minmax(0,1fr) auto; align-items:center; gap:8px; font-size:.78rem; text-transform:capitalize; }
.reports-legend-dot { width:10px; height:10px; border-radius:50%; }
.reports-legend-item>span:nth-child(2) { overflow-wrap:anywhere; color:var(--color-ink-muted,#667085); }
.reports-legend-item strong { white-space:nowrap; font-variant-numeric:tabular-nums; }
.reports-legend-item small { color:var(--color-ink-muted,#8993a5); font-weight:500; }
.reports-table-wrap { overflow-x:auto; width:100%; }
.reports-table { width:100%; min-width:680px; border-collapse:collapse; text-align:left; }
.reports-table th { padding:10px 14px; background:var(--color-primary-bg,#f8fafc); color:var(--color-ink-muted,#778196); font-size:.7rem; text-transform:uppercase; letter-spacing:.04em; }
.reports-table td { padding:10px 14px; border-top:1px solid var(--color-border,#edf0f4); font-size:.79rem; vertical-align:middle; }
.reports-table tr:hover td { background:rgba(120,100,210,.035); }
.reports-id { font-family:monospace; color:var(--color-ink-muted,#8993a5); }
.reports-status { display:inline-flex; border-radius:30px; padding:3px 8px; font-size:.68rem; font-weight:700; text-transform:capitalize; background:#f0f1f4; color:#667085; }
.reports-status.warning { background:#fff3df; color:#a96613; }
.reports-status.success { background:#e5f6ef; color:#147b5b; }
.reports-note { color:var(--color-ink-muted,#8993a5); font-size:.74rem; line-height:1.5; }
`;

export default function AdminReportsPage() {
  const { activeSchool, currentSchool, schoolId } = useSchool();
  const effectiveSchoolId = schoolId || currentSchool?.schoolId || activeSchool?.id;

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

  const currentSchoolIdRef = useRef(effectiveSchoolId);
  const requestGenRef = useRef(0);
  const abortControllerRef = useRef(null);

  const loadReports = useCallback(async (targetSchoolId = effectiveSchoolId) => {
    if (!targetSchoolId) {
      setSystemStats(null);
      setAiStats(null);
      setAuditLogs([]);
      setLoading(false);
      setError("");
      return;
    }

    currentSchoolIdRef.current = targetSchoolId;
    const genId = ++requestGenRef.current;

    // Hủy các request đang bay trước đó
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        getSystemReports({ signal: controller.signal }),
        getAiUsageStats({ signal: controller.signal }),
        getAuditLogs({ signal: controller.signal }),
      ]);

      // Kiểm tra race condition: chỉ cập nhật nếu vẫn ở đúng trường và đúng generation
      if (currentSchoolIdRef.current !== targetSchoolId || requestGenRef.current !== genId) {
        return;
      }

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
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError" || err?.code === "ERR_CANCELED") {
        return;
      }
      if (currentSchoolIdRef.current === targetSchoolId && requestGenRef.current === genId) {
        setError("Lỗi tải báo cáo trường học");
      }
    } finally {
      if (currentSchoolIdRef.current === targetSchoolId && requestGenRef.current === genId) {
        setLoading(false);
      }
    }
  }, [effectiveSchoolId]);

  useEffect(() => {
    setSystemStats(null);
    setAiStats(null);
    setAuditLogs([]);
    loadReports(effectiveSchoolId);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [effectiveSchoolId, loadReports]);

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
    if (!activeSchool?.id) {
      window.alert("Vui lòng chọn trường trước khi xuất báo cáo.");
      return;
    }
    setExporting(type);
    try {
      const response = type === "learning"
        ? await exportLearningActivity({ signal: abortControllerRef.current?.signal })
        : await exportAiTransparency({ signal: abortControllerRef.current?.signal });
      const payload = unwrap(response);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const schoolIdentifier = activeSchool?.slug || activeSchool?.code || "school";
      link.download = `${type === "learning" ? "learning-activity" : "ai-transparency"}-${schoolIdentifier}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      if (exportError?.name === "CanceledError" || exportError?.name === "AbortError") {
        return;
      }
      window.alert(exportError?.response?.data?.message || "Không thể xuất báo cáo. Vui lòng thử lại.");
    } finally {
      setExporting("");
    }
  };

  const handleClearAuditFilters = () => {
    if (
      !auditSearch.trim() &&
      auditStatus === "all" &&
      auditType === "all" &&
      auditRange === "all"
    ) {
      return;
    }
    setAuditSearch("");
    setAuditStatus("all");
    setAuditType("all");
    setAuditRange("all");
  };

  const tabs = [
    { id: "overview", label: "Tổng quan hệ thống" },
    { id: "ai-usage", label: "AI & minh bạch" },
    { id: "audit", label: "Audit Logs" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-6 pt-4 pb-4 box-border">
      <style>{styles}</style>

      {/* 1. Page Header thu gọn */}
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 mb-2.5">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">Báo cáo &amp; Thống kê</h1>
          <p className="text-xs text-slate-500 mt-0.5 m-0">Theo dõi dữ liệu vận hành, hoạt động AI và nhật ký cảnh báo của EduTrack.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-secondary h-9 px-3.5 text-sm font-medium rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            onClick={() => handleExport("learning")}
            disabled={!!exporting}
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>{exporting === "learning" ? "Đang xuất..." : "Xuất dữ liệu học tập"}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary h-9 px-3.5 text-sm font-medium rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            onClick={() => handleExport("ai")}
            disabled={!!exporting}
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>{exporting === "ai" ? "Đang xuất..." : "Xuất dữ liệu AI"}</span>
          </button>
        </div>
      </header>

      {/* 2. Thanh chuyển đổi 3 Tab */}
      <nav className="shrink-0 border-b border-slate-200 mb-3 flex gap-1 overflow-x-auto" aria-label="Các nhóm báo cáo">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`whitespace-nowrap px-4 py-2 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
                isSelected
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
              aria-selected={isSelected}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {error && (
        <div className="shrink-0 mb-3">
          <EduxAlert
            type="error"
            title="Đã xảy ra lỗi tải báo cáo"
            message={error}
            onClose={() => setError("")}
            actions={
              <button
                type="button"
                onClick={() => loadReports()}
                className="text-xs font-bold text-red-700 underline hover:text-red-900 cursor-pointer"
              >
                Thử tải lại
              </button>
            }
          />
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-500 mb-2">
              <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
            </div>
            <h2 className="text-sm font-semibold text-slate-700">Đang tải dữ liệu báo cáo từ hệ thống...</h2>
          </div>
        </div>
      ) : (
        <>
          {activeTab === "overview" && (
            <>
              {!systemStats ? (
                <div className="flex-1 flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-200">
                  <div className="text-center text-slate-500 text-sm">Không có dữ liệu tổng quan.</div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex flex-col">
                  {/* 4 Thẻ KPI compact */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 mb-3">
                    <MetricCard label="Tổng người dùng" value={systemStats.totalUsers} icon="◎" tone="" />
                    <MetricCard label="Người dùng hoạt động" value={systemStats.activeUsers} icon="✓" tone="teal" />
                    <MetricCard label="Tổng lớp học" value={systemStats.totalClasses} icon="▦" tone="blue" />
                    <MetricCard label="Tổng bài nộp" value={systemStats.totalSubmissions} icon="▤" tone="orange" />
                  </div>

                  {/* 2 khung biểu đồ */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 flex flex-col shadow-xs">
                      <div className="mb-5">
                        <h2 className="text-sm font-bold text-slate-800 m-0">Quy mô dữ liệu</h2>
                        <p className="text-xs text-slate-500 mt-0.5 m-0">So sánh số lượng bản ghi theo từng nhóm dữ liệu.</p>
                      </div>
                      <BarChart nameKey="label" valueKey="value" items={[
                        { label: "Người dùng", value: asNumber(systemStats.totalUsers) },
                        { label: "Đang hoạt động", value: asNumber(systemStats.activeUsers) },
                        { label: "Lớp học", value: asNumber(systemStats.totalClasses) },
                        { label: "Bài nộp", value: asNumber(systemStats.totalSubmissions) },
                      ]} />
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-slate-200 flex flex-col shadow-xs">
                      <div className="mb-5">
                        <h2 className="text-sm font-bold text-slate-800 m-0">Tỷ lệ hoạt động tài khoản</h2>
                        <p className="text-xs text-slate-500 mt-0.5 m-0">Tính từ tổng người dùng và người dùng có is_active = true.</p>
                      </div>
                      {activeRate == null ? (
                        <div className="reports-empty-chart">Chưa có dữ liệu người dùng.</div>
                      ) : (
                        <div className="flex items-center gap-6 my-auto">
                          <div className="reports-donut" style={{ background: `conic-gradient(${palette.teal} 0% ${Math.min(activeRate, 100)}%, #edf0f4 ${Math.min(activeRate, 100)}% 100%)` }}>
                            <div><strong>{activeRate.toFixed(1)}%</strong><span>Đang hoạt động</span></div>
                          </div>
                          <div className="reports-legend">
                            <div className="reports-legend-item">
                              <span className="reports-legend-dot" style={{ background: palette.teal }} />
                              <span>Đang hoạt động</span>
                              <strong>{numberFormat.format(asNumber(systemStats.activeUsers))}</strong>
                            </div>
                            <div className="reports-legend-item">
                              <span className="reports-legend-dot" style={{ background: "#dfe3ea" }} />
                              <span>Còn lại</span>
                              <strong>{numberFormat.format(Math.max(0, asNumber(systemStats.totalUsers) - asNumber(systemStats.activeUsers)))}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-400 m-0 leading-normal">
                    Lưu ý: API hiện tại trả về số liệu tổng hợp toàn hệ thống, chưa cung cấp chuỗi dữ liệu theo ngày/tháng. Vì vậy biểu đồ đang thể hiện quy mô và tỷ lệ thực, không dựng xu hướng giả.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "ai-usage" && (
            <>
              {!aiStats ? (
                <div className="flex-1 flex items-center justify-center p-8 bg-white rounded-2xl border border-slate-200">
                  <div className="text-center text-slate-500 text-sm">Không có dữ liệu thống kê AI.</div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex flex-col">
                  {/* 4 Thẻ KPI compact */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 mb-3">
                    <MetricCard label="Tổng lượt tương tác AI" value={totalAi} icon="✧" tone="" />
                    <MetricCard label="Nhóm công cụ AI" value={toolItems.length} icon="⌘" tone="blue" />
                    <MetricCard label="Lượt có quyết định" value={totalDecisions} icon="✓" tone="teal" />
                    <MetricCard label="Nhóm quyết định" value={decisionItems.length} icon="◷" tone="orange" />
                  </div>

                  {/* 2 khung biểu đồ */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 flex flex-col shadow-xs">
                      <div className="mb-5">
                        <h2 className="text-sm font-bold text-slate-800 m-0">Lượt dùng theo công cụ</h2>
                        <p className="text-xs text-slate-500 mt-0.5 m-0">Số bản ghi ai_interactions được nhóm theo ai_tool.</p>
                      </div>
                      <BarChart items={toolItems} nameKey="ai_tool" valueKey="count" />
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-slate-200 flex flex-col shadow-xs">
                      <div className="mb-5">
                        <h2 className="text-sm font-bold text-slate-800 m-0">Quyết định của sinh viên</h2>
                        <p className="text-xs text-slate-500 mt-0.5 m-0">Phân bố student_decision theo dữ liệu đã khai báo.</p>
                      </div>
                      <DonutChart items={decisionItems} nameKey="student_decision" valueKey="count" />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-400 m-0 leading-normal">
                    Các chỉ số phản ánh dữ liệu khai báo/lưu trữ trong hệ thống; không phải kết quả phát hiện gian lận hoặc kết luận mức độ phụ thuộc AI.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "audit" && (
            <div className="flex-1 min-h-0 flex flex-col">
              {/* 4 Thẻ KPI compact */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 mb-3">
                <MetricCard label="Tổng bản ghi tải về" value={auditLogs.length} icon="▤" tone="" />
                <MetricCard label="Đang mở / chờ xử lý" value={auditLogs.filter((log) => ["open", "pending"].includes(String(log.status).toLowerCase())).length} icon="!" tone="orange" />
                <MetricCard label="Đã xử lý / đóng" value={auditLogs.filter((log) => ["resolved", "reviewed", "closed"].includes(String(log.status).toLowerCase())).length} icon="✓" tone="teal" />
                <MetricCard label="Loại cảnh báo" value={uniqueTypes.length} icon="⚑" tone="blue" />
              </div>

              {/* Bọc vùng lọc và bảng log trong card flex-1 overflow-hidden */}
              <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-xs">
                <div className="shrink-0 p-3 border-b border-slate-100 flex gap-2 flex-wrap items-center bg-slate-50/50">
                  <input
                    aria-label="Tìm kiếm audit log"
                    className="h-9 flex-1 min-w-[200px] bg-white border border-slate-200 rounded-xl px-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary"
                    placeholder="Tìm theo ID, loại flag, người tạo..."
                    value={auditSearch}
                    onChange={(event) => setAuditSearch(event.target.value)}
                  />
                  <select
                    aria-label="Lọc trạng thái"
                    className="h-9 bg-white border border-slate-200 rounded-xl px-2.5 text-xs text-slate-700 focus:outline-none focus:border-primary"
                    value={auditStatus}
                    onChange={(event) => setAuditStatus(event.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    {[...new Set(auditLogs.map((log) => log.status).filter(Boolean))].map((status) => (
                      <option key={status} value={status}>{String(status).replaceAll("_", " ")}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Lọc loại cảnh báo"
                    className="h-9 bg-white border border-slate-200 rounded-xl px-2.5 text-xs text-slate-700 focus:outline-none focus:border-primary"
                    value={auditType}
                    onChange={(event) => setAuditType(event.target.value)}
                  >
                    <option value="all">Tất cả loại flag</option>
                    {uniqueTypes.map((type) => (
                      <option key={type} value={type}>{String(type).replaceAll("_", " ")}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Lọc khoảng thời gian"
                    className="h-9 bg-white border border-slate-200 rounded-xl px-2.5 text-xs text-slate-700 focus:outline-none focus:border-primary"
                    value={auditRange}
                    onChange={(event) => setAuditRange(event.target.value)}
                  >
                    <option value="all">Mọi thời gian</option>
                    <option value="7d">7 ngày gần đây</option>
                    <option value="30d">30 ngày gần đây</option>
                    <option value="90d">90 ngày gần đây</option>
                  </select>
                  <button
                    type="button"
                    className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                    onClick={handleClearAuditFilters}
                    title="Xóa tất cả bộ lọc"
                  >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">filter_alt_off</span>
                    <span>Xóa lọc</span>
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
                  <table className="reports-table w-full">
                    <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 shadow-2xs">
                      <tr>
                        <th className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">ID</th>
                        <th className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">Loại flag</th>
                        <th className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">Người tạo</th>
                        <th className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">Trạng thái</th>
                        <th className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">Thời gian</th>
                      </tr>
                    </thead>
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
                      {!filteredLogs.length && (
                        <tr>
                          <td colSpan="5">
                            <div className="reports-state">Không tìm thấy bản ghi phù hợp với bộ lọc.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="shrink-0 p-2.5 px-4 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-400 m-0">
                  Bộ lọc được áp dụng trên 50 bản ghi gần nhất do endpoint hiện tại cung cấp; chưa phải truy vấn phân trang toàn bộ lịch sử.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
