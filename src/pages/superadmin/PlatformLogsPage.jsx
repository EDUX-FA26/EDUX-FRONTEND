import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import SuperadminLayout from "../../components/platform/SuperadminLayout";
import { getAuditLogs } from "../../services/platformApi";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Eye,
  X,
  FileCode,
  Calendar,
  User,
  Activity,
} from "lucide-react";

export default function PlatformLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [inspectingLog, setInspectingLog] = useState(null);

  const loadLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAuditLogs({
        page,
        limit: 15,
        action: actionFilter.trim() || undefined,
      });
      setLogs(res.data?.items || []);
      setPagination(res.data?.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    loadLogs(1);
  }, [loadLogs]);

  const getActionBadgeColor = (action = "") => {
    if (action.includes("CREATE")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (action.includes("UPDATE") || action.includes("EDIT")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (action.includes("DELETE") || action.includes("DEACTIVATE") || action.includes("LOCK") || action.includes("REJECT"))
      return "bg-red-50 text-red-700 border-red-200";
    if (action.includes("APPROVE") || action.includes("EXECUTE")) return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-[#fff8f5] text-[#545f73] border-[#f5ebe1]";
  };

  return (
    <SuperadminLayout>
      <div className="w-full max-w-7xl mx-auto h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-6 pt-4 pb-4 box-border">
        {/* Header */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Nhật ký Hệ thống (Audit Logs)</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Truy vết và kiểm tra toàn bộ hành động quản trị diễn ra trên nền tảng EDUX để phục vụ đối soát và bảo mật.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadLogs(pagination.page)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white h-9 px-3.5 text-xs sm:text-sm font-semibold text-slate-600 shadow-xs hover:bg-slate-50 hover:text-[#f27024] transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#f27024]" : ""}`} />
            Làm mới
          </button>
        </div>

        {/* Table Card */}
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Filter Bar */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 p-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadLogs(1);
                }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lọc theo hành động (ví dụ: CREATE, LOCK, PLAN, REFUND)..."
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="h-9 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#f27024] focus:outline-hidden"
                />
              </form>
              <button
                type="button"
                onClick={() => {
                  if (actionFilter) {
                    setActionFilter("");
                  }
                }}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 shrink-0 transition cursor-pointer"
              >
                Xóa lọc
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
              <Activity className="h-4 w-4 text-[#f27024]" />
              <span>
                Tổng cộng: <strong className="text-slate-900">{pagination.total}</strong> bản ghi nhật ký
              </span>
            </div>
          </div>

          {/* Table Scroll Area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white z-10 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 shadow-xs">
                <tr>
                  <th className="px-5 py-3">Thời gian</th>
                  <th className="px-5 py-3">Người thực hiện</th>
                  <th className="px-5 py-3">Hành động</th>
                  <th className="px-5 py-3">Đối tượng</th>
                  <th className="px-5 py-3">Địa chỉ IP</th>
                  <th className="px-5 py-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#f27024] mb-2" />
                      Đang tải nhật ký hệ thống…
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      Không tìm thấy bản ghi nhật ký nào.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-500">
                        {log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{log.actor_name || log.actor_email || "System"}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{log.actor_role || "—"}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        <span className="font-semibold text-slate-900">{log.target_type || "—"}</span>
                        {log.target_id && (
                          <span className="ml-1 text-[11px] font-mono text-slate-400 truncate max-w-[120px] inline-block align-bottom">
                            ({log.target_id})
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-500">
                        {log.ip_address || "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectingLog(log)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-[#f27024] transition cursor-pointer"
                        >
                          <Eye className="h-3 w-3" />
                          Xem JSON
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="shrink-0 flex items-center justify-between border-t border-slate-200 bg-white px-5 py-2.5 text-xs text-slate-500">
              <p>Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} bản ghi)</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => loadLogs(pagination.page - 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Trước
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadLogs(pagination.page + 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Xem chi tiết metadata */}
      {inspectingLog &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileCode className="h-5 w-5 text-[#f27024]" />
                  <h2 className="text-base font-bold text-slate-900">Chi tiết Audit Log: {inspectingLog.action}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingLog(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-orange-50/40 border border-orange-100/60 p-3 text-slate-600">
                  <div>
                    <span className="text-slate-400">Actor:</span>{" "}
                    <strong className="text-slate-900">{inspectingLog.actor_name || inspectingLog.actor_email}</strong>{" "}
                    ({inspectingLog.actor_role})
                  </div>
                  <div>
                    <span className="text-slate-400">Thời gian:</span>{" "}
                    <span className="text-slate-900">{new Date(inspectingLog.created_at).toLocaleString("vi-VN")}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Target Type:</span>{" "}
                    <span className="text-slate-900">{inspectingLog.target_type || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">IP:</span>{" "}
                    <span className="text-slate-900 font-mono">{inspectingLog.ip_address || "—"}</span>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-900 mb-1">Payload Metadata:</p>
                  <pre className="max-h-64 overflow-auto rounded-xl bg-slate-900 p-4 font-mono text-[11px] text-emerald-400">
                    {JSON.stringify(inspectingLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="mt-5 flex justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setInspectingLog(null)}
                  className="rounded-xl bg-[#f27024] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d95c14] transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </SuperadminLayout>
  );
}
