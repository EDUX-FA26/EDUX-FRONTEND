import React, { useEffect, useState, useCallback } from "react";
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b17]">Nhật ký Hệ thống (Audit Logs)</h1>
            <p className="mt-1 text-sm text-[#545f73]">
              Truy vết và kiểm tra toàn bộ hành động quản trị diễn ra trên nền tảng EDUX để phục vụ đối soát và bảo mật.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadLogs(pagination.page)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2 text-xs font-semibold text-[#545f73] shadow-xs hover:bg-[#fff8f5] hover:text-[#f27024] transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#f27024]" : ""}`} />
            Làm mới
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#f5ebe1] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadLogs(1);
            }}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7166]" />
            <input
              type="text"
              placeholder="Lọc theo hành động (ví dụ: CREATE, LOCK, PLAN, REFUND)…"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-xl border border-[#f5ebe1] bg-white pl-10 pr-4 py-2 text-xs text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
            />
          </form>

          <div className="flex items-center gap-2 text-xs text-[#545f73]">
            <Activity className="h-4 w-4 text-[#f27024]" />
            Tổng cộng: <strong>{pagination.total}</strong> bản ghi nhật ký
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-[#f5ebe1] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#f5ebe1] bg-[#fff8f5] font-bold uppercase tracking-wider text-[#8c7166]">
                <tr>
                  <th className="px-5 py-3.5">Thời gian</th>
                  <th className="px-5 py-3.5">Người thực hiện</th>
                  <th className="px-5 py-3.5">Hành động</th>
                  <th className="px-5 py-3.5">Đối tượng</th>
                  <th className="px-5 py-3.5">Địa chỉ IP</th>
                  <th className="px-5 py-3.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5ebe1]">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-[#545f73]">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#f27024] mb-2" />
                      Đang tải nhật ký hệ thống…
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-[#8c7166]">
                      Không tìm thấy bản ghi nhật ký nào.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#fff8f5] transition">
                      <td className="px-5 py-3 font-mono text-[11px] text-[#545f73]">
                        {log.created_at ? new Date(log.created_at).toLocaleString("vi-VN") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-semibold text-[#1f1b17]">{log.actor_name || log.actor_email || "System"}</p>
                        <p className="text-[10px] text-[#8c7166] uppercase tracking-wider">{log.actor_role || "—"}</p>
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
                      <td className="px-5 py-3 text-[#545f73]">
                        <span className="font-semibold text-[#1f1b17]">{log.target_type || "—"}</span>
                        {log.target_id && (
                          <span className="ml-1 text-[11px] font-mono text-[#8c7166] truncate max-w-[120px] inline-block align-bottom">
                            ({log.target_id})
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-[#545f73]">
                        {log.ip_address || "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectingLog(log)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#f5ebe1] bg-white px-2.5 py-1 text-[11px] font-medium text-[#545f73] hover:bg-[#fff8f5] hover:text-[#f27024] transition"
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
            <div className="flex items-center justify-between border-t border-[#f5ebe1] bg-[#fff8f5] px-5 py-3 text-xs text-[#545f73]">
              <p>Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} bản ghi)</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => loadLogs(pagination.page - 1)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1 font-medium hover:bg-[#fff8f5] disabled:opacity-40"
                >
                  ← Trước
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadLogs(pagination.page + 1)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1 font-medium hover:bg-[#fff8f5] disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Xem chi tiết metadata */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-[#f5ebe1]">
            <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-[#f27024]" />
                <h2 className="text-base font-bold text-[#1f1b17]">Chi tiết Audit Log: {inspectingLog.action}</h2>
              </div>
              <button onClick={() => setInspectingLog(null)} className="rounded-lg p-1 text-[#8c7166] hover:bg-[#fff8f5]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#fff8f5] border border-[#f5ebe1] p-3 text-[#545f73]">
                <div>
                  <span className="text-[#8c7166]">Actor:</span> <strong>{inspectingLog.actor_name || inspectingLog.actor_email}</strong> ({inspectingLog.actor_role})
                </div>
                <div>
                  <span className="text-[#8c7166]">Thời gian:</span> {new Date(inspectingLog.created_at).toLocaleString("vi-VN")}
                </div>
                <div>
                  <span className="text-[#8c7166]">Target Type:</span> {inspectingLog.target_type || "—"}
                </div>
                <div>
                  <span className="text-[#8c7166]">IP:</span> {inspectingLog.ip_address || "—"}
                </div>
              </div>

              <div>
                <p className="font-semibold text-[#1f1b17] mb-1">Payload Metadata:</p>
                <pre className="max-h-64 overflow-auto rounded-xl bg-[#1f1b17] p-4 font-mono text-[11px] text-emerald-400">
                  {JSON.stringify(inspectingLog.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex justify-end border-t border-[#f5ebe1] pt-3">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="rounded-xl bg-[#f27024] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d95c14] transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperadminLayout>
  );
}
