import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import SuperadminLayout from "../../components/platform/SuperadminLayout";
import {
  getRefunds,
  approveRefund,
  rejectRefund,
  executeRefund,
} from "../../services/platformApi";
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  RefreshCw,
  AlertCircle,
  Building,
  CreditCard,
  FileText,
  X,
  Send,
} from "lucide-react";
import EduxAlert from "../../components/common/EduxAlert";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

const STATUS_TABS = [
  { id: "", label: "Tất cả" },
  { id: "requested", label: "Chờ duyệt", color: "text-amber-600 bg-amber-50" },
  { id: "approved", label: "Đã phê duyệt", color: "text-blue-600 bg-blue-50" },
  { id: "succeeded", label: "Đã hoàn tất", color: "text-emerald-600 bg-emerald-50" },
  { id: "rejected", label: "Đã từ chối", color: "text-red-600 bg-red-50" },
];

export default function PlatformRefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  // Action modals
  const [rejectingRefund, setRejectingRefund] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const [executingRefund, setExecutingRefund] = useState(null);
  const [executeForm, setExecuteForm] = useState({ payoutReference: "", notes: "" });
  const [executeSubmitting, setExecuteSubmitting] = useState(false);

  const loadRefunds = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getRefunds({
        page,
        limit: 10,
        status: statusTab || undefined,
        search: search.trim() || undefined,
      });
      setRefunds(res.data?.items || []);
      setPagination(res.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Không thể tải danh sách hoàn tiền." });
    } finally {
      setLoading(false);
    }
  }, [statusTab, search]);

  useEffect(() => {
    loadRefunds(1);
  }, [loadRefunds]);

  const handleApprove = async (refund) => {
    if (!window.confirm(`Xác nhận phê duyệt yêu cầu hoàn tiền ${formatCurrency(refund.amount)} cho trường ${refund.school_name}?`)) return;

    try {
      await approveRefund(refund.id);
      setMessage({ type: "success", text: "Đã phê duyệt yêu cầu hoàn tiền. Bạn có thể tiến hành thực hiện lệnh chi!" });
      loadRefunds(pagination.page);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi phê duyệt hoàn tiền." });
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingRefund) return;
    setRejectSubmitting(true);
    try {
      await rejectRefund(rejectingRefund.id, rejectionReason);
      setRejectingRefund(null);
      setRejectionReason("");
      setMessage({ type: "success", text: "Đã từ chối yêu cầu hoàn tiền." });
      loadRefunds(pagination.page);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi từ chối hoàn tiền." });
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleExecuteSubmit = async (e) => {
    e.preventDefault();
    if (!executingRefund) return;
    setExecuteSubmitting(true);
    try {
      await executeRefund(executingRefund.id, executeForm);
      setExecutingRefund(null);
      setExecuteForm({ payoutReference: "", notes: "" });
      setMessage({ type: "success", text: `Đã xác nhận hoàn tiền thành công ${formatCurrency(executingRefund.amount)}!` });
      loadRefunds(pagination.page);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi xác nhận hoàn tiền." });
    } finally {
      setExecuteSubmitting(false);
    }
  };

  return (
    <SuperadminLayout>
      <div className="w-full max-w-[1600px] mx-auto min-w-0 h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-4 sm:px-5 lg:px-6 xl:px-8 pt-4 pb-4 box-border animate-fade-in">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-[#FFEDD5] via-[#FED7AA]/90 to-[#FDBA74]/85 border border-orange-300/80 rounded-2xl px-5 py-4 shadow-xs mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0">
              Quản lý Hoàn tiền (Refunds)
            </h1>
            <p className="text-sm text-slate-700 font-medium mt-1 m-0">
              Quy trình phê duyệt và thực hiện lệnh chi hoàn tiền cho các giao dịch SaaS theo chính sách nền tảng EDUX.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => loadRefunds(pagination.page)}
            className="h-10 px-3.5 rounded-xl bg-white/95 hover:bg-white border border-orange-200/80 text-xs sm:text-sm font-semibold text-slate-800 hover:text-[#EA580C] shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#EA580C]" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Alerts */}
        {message.text && (
          <div className="shrink-0 mb-3">
            <EduxAlert
              type={message.type}
              message={message.text}
              onClose={() => setMessage({ type: "", text: "" })}
            />
          </div>
        )}

        {/* Filter Tabs & Search */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id)}
                className={`h-9 px-3.5 text-xs font-medium rounded-xl transition ${
                  statusTab === tab.id
                    ? "bg-[#f27024] text-white shadow-xs font-semibold"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-[#f27024]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo trường, mã đơn…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-48 sm:w-64 max-w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#f27024] focus:outline-hidden"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (statusTab !== "" || search !== "") {
                  setStatusTab("");
                  setSearch("");
                }
              }}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 shrink-0 transition cursor-pointer"
            >
              Xóa lọc
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white z-10 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-500 shadow-xs">
                <tr>
                  <th className="px-5 py-3 whitespace-nowrap">Trường học</th>
                  <th className="px-5 py-3 whitespace-nowrap">Giao dịch gốc</th>
                  <th className="px-5 py-3 whitespace-nowrap">Số tiền hoàn</th>
                  <th className="px-5 py-3 whitespace-nowrap">Tài khoản thụ hưởng</th>
                  <th className="px-5 py-3">Lý do</th>
                  <th className="px-5 py-3 whitespace-nowrap">Trạng thái</th>
                  <th className="px-5 py-3 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#f27024] mb-2" />
                      Đang tải yêu cầu hoàn tiền…
                    </td>
                  </tr>
                ) : refunds.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      Không có yêu cầu hoàn tiền nào ở trạng thái này.
                    </td>
                  </tr>
                ) : (
                  refunds.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3 min-w-0">
                        <p className="font-semibold text-slate-900 truncate max-w-[180px]">{r.school_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{r.school_code}</p>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <p className="font-mono text-slate-900 font-medium">{r.order_reference}</p>
                        <p className="text-[11px] text-slate-400">Gốc: {formatCurrency(r.transaction_amount)}</p>
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-900 text-sm whitespace-nowrap">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="px-5 py-3 min-w-0">
                        <p className="font-semibold text-slate-900 truncate max-w-[180px]">{r.bank_name || "Ngân hàng thụ hưởng"}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{r.bank_account_number || "—"}</p>
                        <p className="text-[10px] uppercase text-slate-400 truncate max-w-[180px]">{r.bank_account_name || "—"}</p>
                      </td>
                      <td className="px-5 py-3 max-w-xs text-slate-600">
                        <p className="truncate" title={r.reason}>{r.reason}</p>
                        {r.rejection_reason && (
                          <p className="text-[11px] text-red-600 italic">Lý do từ chối: {r.rejection_reason}</p>
                        )}
                        {r.payout_reference && (
                          <p className="text-[11px] text-emerald-700 font-mono">Ref chi: {r.payout_reference}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {r.status === "requested" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                            <Clock className="h-3 w-3" />
                            Chờ duyệt
                          </span>
                        ) : r.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-semibold text-[#f27024]">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã duyệt
                          </span>
                        ) : r.status === "succeeded" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã hoàn tất
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                            <XCircle className="h-3 w-3" />
                            Đã từ chối
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status === "requested" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(r)}
                                className="rounded-lg bg-[#f27024] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#d95c14] transition"
                              >
                                Phê duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingRefund(r);
                                  setRejectionReason("");
                                }}
                                className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                              >
                                Từ chối
                              </button>
                            </>
                          )}

                          {r.status === "approved" && (
                            <button
                              type="button"
                              onClick={() => {
                                setExecutingRefund(r);
                                setExecuteForm({ payoutReference: "", notes: "" });
                              }}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                            >
                              Thực hiện lệnh chi
                            </button>
                          )}
                        </div>
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
              <p>Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} yêu cầu)</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => loadRefunds(pagination.page - 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Trước
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadRefunds(pagination.page + 1)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Từ chối hoàn tiền */}
      {rejectingRefund &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Từ chối yêu cầu hoàn tiền</h2>
                <button
                  type="button"
                  onClick={() => setRejectingRefund(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
                <p className="text-xs text-slate-600">
                  Trường: <strong className="text-slate-900">{rejectingRefund.school_name}</strong> — Số tiền: <strong className="text-red-600">{formatCurrency(rejectingRefund.amount)}</strong>
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Lý do từ chối (Bắt buộc)</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Ghi rõ lý do không đủ điều kiện hoàn tiền theo điều khoản…"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setRejectingRefund(null)}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={rejectSubmitting}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    {rejectSubmitting ? "Đang xử lý…" : "Xác nhận từ chối"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal: Thực hiện lệnh chi */}
      {executingRefund &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Xác nhận thực hiện lệnh chi hoàn tiền</h2>
                <button
                  type="button"
                  onClick={() => setExecutingRefund(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteSubmit} className="mt-4 space-y-4">
                <div className="rounded-xl bg-orange-50/40 border border-orange-100/60 p-3.5 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trường yêu cầu:</span>
                    <span className="font-semibold text-slate-900">{executingRefund.school_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tiền hoàn:</span>
                    <span className="font-bold text-emerald-600 text-sm">{formatCurrency(executingRefund.amount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-orange-100/60 pt-2">
                    <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                    <span className="font-semibold text-slate-900">{executingRefund.bank_name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <span className="font-mono font-bold text-slate-900">{executingRefund.bank_account_number || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <span className="uppercase font-semibold text-slate-900">{executingRefund.bank_account_name || "—"}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Mã tham chiếu chuyển khoản / Payout Ref</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: FT26084920239 hoặc payOS Payout ID…"
                    value={executeForm.payoutReference}
                    onChange={(e) => setExecuteForm({ ...executeForm, payoutReference: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-xs text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Ghi chú đối soát / chứng từ</label>
                  <textarea
                    rows="2"
                    placeholder="Ghi chú đối soát nội bộ…"
                    value={executeForm.notes}
                    onChange={(e) => setExecuteForm({ ...executeForm, notes: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setExecutingRefund(null)}
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={executeSubmitting}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {executeSubmitting ? "Đang xác nhận…" : "Xác nhận đã chuyển tiền"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </SuperadminLayout>
  );
}
