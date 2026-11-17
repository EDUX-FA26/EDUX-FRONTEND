import React, { useEffect, useState, useCallback } from "react";
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b17]">Quản lý Hoàn tiền (Refunds)</h1>
            <p className="mt-1 text-sm text-[#545f73]">
              Quy trình phê duyệt và thực hiện lệnh chi hoàn tiền cho các giao dịch SaaS theo chính sách nền tảng EDUX.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadRefunds(pagination.page)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2 text-xs font-semibold text-[#545f73] shadow-xs hover:bg-[#fff8f5] hover:text-[#f27024] transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#f27024]" : ""}`} />
            Làm mới
          </button>
        </div>

        {/* Alerts */}
        {message.text && (
          <div
            className={`rounded-xl p-4 text-sm flex items-center justify-between ${message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
              }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: "", text: "" })} className="text-[#8c7166] hover:text-[#1f1b17]">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filter Tabs & Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#f5ebe1] pb-3">
          <div className="flex space-x-2 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusTab(tab.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${statusTab === tab.id
                  ? "bg-[#f27024] text-white shadow-xs"
                  : "bg-white text-[#545f73] border border-[#f5ebe1] hover:bg-[#fff8f5] hover:text-[#f27024]"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8c7166]" />
            <input
              type="text"
              placeholder="Tìm theo trường, mã đơn…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-[#f5ebe1] bg-white pl-8 pr-3 py-1.5 text-xs text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-[#f5ebe1] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#f5ebe1] bg-[#fff8f5] font-bold uppercase tracking-wider text-[#8c7166]">
                <tr>
                  <th className="px-6 py-4">Trường học</th>
                  <th className="px-6 py-4">Giao dịch gốc</th>
                  <th className="px-6 py-4">Số tiền hoàn</th>
                  <th className="px-6 py-4">Tài khoản thụ hưởng</th>
                  <th className="px-6 py-4">Lý do</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5ebe1]">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-[#545f73]">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#f27024] mb-2" />
                      Đang tải yêu cầu hoàn tiền…
                    </td>
                  </tr>
                ) : refunds.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-[#8c7166]">
                      Không có yêu cầu hoàn tiền nào ở trạng thái này.
                    </td>
                  </tr>
                ) : (
                  refunds.map((r) => (
                    <tr key={r.id} className="hover:bg-[#fff8f5] transition">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#1f1b17]">{r.school_name}</p>
                        <p className="text-[11px] text-[#8c7166] font-mono">{r.school_code}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-[#1f1b17] font-medium">{r.order_reference}</p>
                        <p className="text-[11px] text-[#8c7166]">Gốc: {formatCurrency(r.transaction_amount)}</p>
                      </td>
                      <td className="px-6 py-4 font-black text-[#1f1b17] text-sm">
                        {formatCurrency(r.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#1f1b17]">{r.bank_name || "Ngân hàng thụ hưởng"}</p>
                        <p className="text-[11px] text-[#545f73] font-mono">{r.bank_account_number || "—"}</p>
                        <p className="text-[10px] uppercase text-[#8c7166]">{r.bank_account_name || "—"}</p>
                      </td>
                      <td className="px-6 py-4 max-w-xs text-[#545f73]">
                        <p className="truncate" title={r.reason}>{r.reason}</p>
                        {r.rejection_reason && (
                          <p className="text-[11px] text-red-600 italic">Lý do từ chối: {r.rejection_reason}</p>
                        )}
                        {r.payout_reference && (
                          <p className="text-[11px] text-emerald-700 font-mono">Ref chi: {r.payout_reference}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {r.status === "requested" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <Clock className="h-3 w-3" />
                            Chờ duyệt
                          </span>
                        ) : r.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8f5] border border-[#ffdbcc] px-2.5 py-1 text-xs font-semibold text-[#f27024]">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã duyệt
                          </span>
                        ) : r.status === "succeeded" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã hoàn tất
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                            <XCircle className="h-3 w-3" />
                            Đã từ chối
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === "requested" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(r)}
                                className="rounded-lg bg-[#f27024] px-3 py-1.5 font-bold text-white hover:bg-[#d95c14] transition"
                              >
                                Phê duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingRefund(r);
                                  setRejectionReason("");
                                }}
                                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 font-semibold text-red-600 hover:bg-red-50 transition"
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
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700 transition shadow-xs"
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
            <div className="flex items-center justify-between border-t border-[#f5ebe1] bg-[#fff8f5] px-6 py-3 text-xs text-[#545f73]">
              <p>Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} yêu cầu)</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => loadRefunds(pagination.page - 1)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1 font-medium hover:bg-[#fff8f5] disabled:opacity-40"
                >
                  ← Trước
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadRefunds(pagination.page + 1)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1 font-medium hover:bg-[#fff8f5] disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Từ chối hoàn tiền */}
      {rejectingRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#f5ebe1]">
            <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-3">
              <h2 className="text-base font-bold text-[#1f1b17]">Từ chối yêu cầu hoàn tiền</h2>
              <button onClick={() => setRejectingRefund(null)} className="rounded-lg p-1 text-[#8c7166] hover:bg-[#fff8f5]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-[#545f73]">
                Trường: <strong>{rejectingRefund.school_name}</strong> — Số tiền: <strong>{formatCurrency(rejectingRefund.amount)}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#1f1b17]">Lý do từ chối (Bắt buộc)</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Ghi rõ lý do không đủ điều kiện hoàn tiền theo điều khoản…"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-xs text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#f5ebe1] pt-4">
                <button
                  type="button"
                  onClick={() => setRejectingRefund(null)}
                  className="rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5]"
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
        </div>
      )}

      {/* Modal: Thực hiện lệnh chi */}
      {executingRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-[#f5ebe1]">
            <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-3">
              <h2 className="text-base font-bold text-[#1f1b17]">Xác nhận thực hiện lệnh chi hoàn tiền</h2>
              <button onClick={() => setExecutingRefund(null)} className="rounded-lg p-1 text-[#8c7166] hover:bg-[#fff8f5]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteSubmit} className="mt-4 space-y-4">
              <div className="rounded-2xl bg-[#fff8f5] border border-[#f5ebe1] p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#545f73]">Trường yêu cầu:</span>
                  <span className="font-semibold text-[#1f1b17]">{executingRefund.school_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#545f73]">Số tiền hoàn:</span>
                  <span className="font-extrabold text-[#1f1b17] text-sm text-emerald-600">{formatCurrency(executingRefund.amount)}</span>
                </div>
                <div className="flex justify-between border-t border-[#f5ebe1] pt-2">
                  <span className="text-[#545f73]">Ngân hàng thụ hưởng:</span>
                  <span className="font-semibold text-[#1f1b17]">{executingRefund.bank_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#545f73]">Số tài khoản:</span>
                  <span className="font-mono font-bold text-[#1f1b17]">{executingRefund.bank_account_number || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#545f73]">Chủ tài khoản:</span>
                  <span className="uppercase font-semibold text-[#1f1b17]">{executingRefund.bank_account_name || "—"}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f1b17]">Mã tham chiếu chuyển khoản / Payout Ref</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: FT26084920239 hoặc payOS Payout ID…"
                  value={executeForm.payoutReference}
                  onChange={(e) => setExecuteForm({ ...executeForm, payoutReference: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 font-mono text-xs text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f1b17]">Ghi chú đối soát / chứng từ</label>
                <textarea
                  rows="2"
                  placeholder="Ghi chú đối soát nội bộ…"
                  value={executeForm.notes}
                  onChange={(e) => setExecuteForm({ ...executeForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-xs text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-[#f5ebe1] pt-4">
                <button
                  type="button"
                  onClick={() => setExecutingRefund(null)}
                  className="rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5]"
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
        </div>
      )}
    </SuperadminLayout>
  );
}
