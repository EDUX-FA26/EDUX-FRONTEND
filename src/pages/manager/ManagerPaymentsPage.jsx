import React, { useEffect, useState } from "react";
import {
  CreditCard,
  RotateCcw,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  Lock,
} from "lucide-react";
import ManagerLayout from "../../components/platform/ManagerLayout";
import EduxAlert from "../../components/common/EduxAlert";
import { getTransactions, getRefunds } from "../../services/platformApi";

export default function ManagerPaymentsPage() {
  const [activeTab, setActiveTab] = useState("transactions"); // "transactions" | "refunds"

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [txPagination, setTxPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [txSearch, setTxSearch] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("");
  const [txLoading, setTxLoading] = useState(true);

  // Refunds state
  const [refunds, setRefunds] = useState([]);
  const [rfPagination, setRfPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [rfSearch, setRfSearch] = useState("");
  const [rfStatusFilter, setRfStatusFilter] = useState("");
  const [rfLoading, setRfLoading] = useState(false);

  const [error, setError] = useState("");

  const loadTransactions = async (page = 1, currentSearch = txSearch, currentStatus = txStatusFilter) => {
    setTxLoading(true);
    setError("");
    try {
      const res = await getTransactions({
        page,
        limit: txPagination.limit,
        search: currentSearch.trim() || undefined,
        status: currentStatus || undefined,
      });
      setTransactions(res.data.items || []);
      setTxPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải lịch sử giao dịch.");
    } finally {
      setTxLoading(false);
    }
  };

  const loadRefunds = async (page = 1, currentSearch = rfSearch, currentStatus = rfStatusFilter) => {
    setRfLoading(true);
    setError("");
    try {
      const res = await getRefunds({
        page,
        limit: rfPagination.limit,
        search: currentSearch.trim() || undefined,
        status: currentStatus || undefined,
      });
      setRefunds(res.data.items || []);
      setRfPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách hoàn tiền.");
    } finally {
      setRfLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "transactions") {
      loadTransactions(1, txSearch, txStatusFilter);
    } else {
      loadRefunds(1, rfSearch, rfStatusFilter);
    }
  }, [activeTab, txStatusFilter, rfStatusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "transactions") {
      loadTransactions(1, txSearch, txStatusFilter);
    } else {
      loadRefunds(1, rfSearch, rfStatusFilter);
    }
  };

  const handleClearFilter = () => {
    if (activeTab === "transactions") {
      if (txSearch || txStatusFilter) {
        setTxSearch("");
        setTxStatusFilter("");
        loadTransactions(1, "", "");
      }
    } else {
      if (rfSearch || rfStatusFilter) {
        setRfSearch("");
        setRfStatusFilter("");
        loadRefunds(1, "", "");
      }
    }
  };

  return (
    <ManagerLayout>
      <div className="w-full max-w-7xl mx-auto h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-6 pt-4 pb-4 box-border">
        {/* Header */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Theo dõi Giao dịch & Hoàn tiền (Chỉ đọc)
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Lịch sử thu phí trường học và tiến độ hoàn tiền trên hệ thống EDUX Multi-Tenant SaaS.
            </p>
          </div>

          <button
            onClick={() =>
              activeTab === "transactions"
                ? loadTransactions(txPagination.page, txSearch, txStatusFilter)
                : loadRefunds(rfPagination.page, rfSearch, rfStatusFilter)
            }
            disabled={txLoading || rfLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 h-9 text-xs sm:text-sm font-medium text-slate-600 shadow-xs hover:bg-slate-50 hover:text-[#f27024] transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${txLoading || rfLoading ? "animate-spin text-[#f27024]" : ""}`} />
            Làm mới
          </button>
        </div>

        {/* Read-Only Notice Banner */}
        <div className="shrink-0 mb-3 flex items-start gap-2.5 rounded-xl border border-[#ffdbcc] bg-[#fff8f5] py-2 px-3.5 text-xs text-[#1f1b17]">
          <Lock className="h-4 w-4 shrink-0 text-[#f27024] mt-0.5" />
          <span>
            <strong>Chế độ giám sát & đối soát (Read-only): </strong>
            Manager được cấp quyền xem toàn bộ giao dịch thanh toán và yêu cầu hoàn tiền để hỗ trợ vận hành trường. Thao tác <strong>phê duyệt hoàn tiền</strong>, <strong>từ chối</strong> và <strong>thực hiện lệnh chi (payout)</strong> được bảo lưu độc quyền cho <strong>Superadmin</strong>.
          </span>
        </div>

        {error && (
          <div className="shrink-0 mb-3">
            <EduxAlert
              type="error"
              message={error}
              onClose={() => setError("")}
            />
          </div>
        )}

        {/* Merged Tabs + Search/Filter Row */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 mb-3">
          {/* Left: Tab Switcher */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("transactions")}
              className={`flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "transactions"
                  ? "bg-[#f27024] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Lịch sử Giao dịch ({txPagination.total})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("refunds")}
              className={`flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === "refunds"
                  ? "bg-[#f27024] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Tiến độ Hoàn tiền ({rfPagination.total})
            </button>
          </div>

          {/* Right: Search & Filter Toolbar */}
          <div className="flex items-center gap-2.5">
            <form onSubmit={handleSearchSubmit} className="relative w-64 sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo mã giao dịch, tên trường, mã trường..."
                value={activeTab === "transactions" ? txSearch : rfSearch}
                onChange={(e) => {
                  if (activeTab === "transactions") setTxSearch(e.target.value);
                  else setRfSearch(e.target.value);
                }}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs shadow-xs focus:border-[#f27024] focus:outline-none focus:ring-1 focus:ring-[#f27024] text-slate-800 placeholder-slate-400"
              />
            </form>

            <div className="relative">
              {activeTab === "transactions" ? (
                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  className="h-9 w-40 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus:border-[#f27024] focus:outline-none"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="success">Thành công (Success)</option>
                  <option value="pending">Đang chờ (Pending)</option>
                  <option value="failed">Thất bại (Failed)</option>
                </select>
              ) : (
                <select
                  value={rfStatusFilter}
                  onChange={(e) => setRfStatusFilter(e.target.value)}
                  className="h-9 w-40 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus:border-[#f27024] focus:outline-none"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="requested">Chờ duyệt (Requested)</option>
                  <option value="approved">Đã duyệt (Approved)</option>
                  <option value="rejected">Từ chối (Rejected)</option>
                  <option value="succeeded">Thành công (Succeeded)</option>
                  <option value="failed">Thất bại (Failed)</option>
                </select>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearFilter}
              className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-600 shrink-0 inline-flex items-center gap-1.5 transition cursor-pointer"
              title="Xóa bộ lọc"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Xóa lọc
            </button>
          </div>
        </div>

        {/* White Card Container for Table */}
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-xs">
          {activeTab === "transactions" ? (
            <>
              {/* Transactions Table: Scrollable independently */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[#fff8f5] z-10 text-xs font-bold text-[#8c7166] uppercase tracking-wider border-b border-[#f5ebe1]">
                    <tr>
                      <th className="py-3 px-4">Mã tham chiếu / ID</th>
                      <th className="py-3 px-4">Trường học</th>
                      <th className="py-3 px-4">Gói dịch vụ</th>
                      <th className="py-3 px-4">Số tiền thu</th>
                      <th className="py-3 px-4">Đã hoàn</th>
                      <th className="py-3 px-4">Phương thức</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5ebe1] text-[#1f1b17]">
                    {txLoading ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-[#8c7166]">
                          Đang tải giao dịch...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-[#8c7166]">
                          Không tìm thấy giao dịch nào.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-[#fff8f5] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#1f1b17]">
                            {tx.order_reference || tx.id?.slice(0, 8)}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-[#1f1b17]">{tx.school_name || "—"}</p>
                            <span className="font-mono text-xs text-[#8c7166]">{tx.school_code}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="rounded bg-[#fff8f5] border border-[#ffdbcc] px-2 py-0.5 text-xs font-semibold text-[#f27024]">
                              {tx.plan_name || "Gói thuê"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#1f1b17]">
                            {Number(tx.amount || 0).toLocaleString("vi-VN")} đ
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            {Number(tx.refunded_amount || 0) > 0 ? (
                              <span className="font-semibold text-rose-600">
                                {Number(tx.refunded_amount).toLocaleString("vi-VN")} đ
                              </span>
                            ) : (
                              <span className="text-[#8c7166]">0 đ</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="rounded bg-[#fff8f5] border border-[#ffdbcc] px-2 py-0.5 text-[11px] font-semibold text-[#f27024] uppercase">
                              {tx.payment_method || "payos"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                tx.status === "success"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : tx.status === "pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {tx.status === "success" ? "Thành công" : tx.status === "pending" ? "Chờ xử lý" : tx.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#8c7166]">
                            {tx.created_at ? new Date(tx.created_at).toLocaleString("vi-VN") : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Transactions Pagination */}
              {txPagination.totalPages > 1 && (
                <div className="shrink-0 flex items-center justify-between border-t border-[#f5ebe1] bg-[#fff8f5] px-4 py-2.5">
                  <span className="text-xs text-[#545f73]">
                    Trang {txPagination.page} / {txPagination.totalPages} (Tổng {txPagination.total} giao dịch)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={txPagination.page <= 1}
                      onClick={() => loadTransactions(txPagination.page - 1, txSearch, txStatusFilter)}
                      className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40 cursor-pointer"
                    >
                      Trước
                    </button>
                    <button
                      disabled={txPagination.page >= txPagination.totalPages}
                      onClick={() => loadTransactions(txPagination.page + 1, txSearch, txStatusFilter)}
                      className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40 cursor-pointer"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Refunds Table: Scrollable independently */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[#fff8f5] z-10 text-xs font-bold text-[#8c7166] uppercase tracking-wider border-b border-[#f5ebe1]">
                    <tr>
                      <th className="py-3 px-4">Mã yêu cầu</th>
                      <th className="py-3 px-4">Trường học</th>
                      <th className="py-3 px-4">Số tiền yêu cầu hoàn</th>
                      <th className="py-3 px-4">Lý do hoàn tiền</th>
                      <th className="py-3 px-4">Người yêu cầu</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5ebe1] text-[#1f1b17]">
                    {rfLoading ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-[#8c7166]">
                          Đang tải yêu cầu hoàn tiền...
                        </td>
                      </tr>
                    ) : refunds.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-[#8c7166]">
                          Chưa có yêu cầu hoàn tiền nào trên hệ thống.
                        </td>
                      </tr>
                    ) : (
                      refunds.map((rf) => (
                        <tr key={rf.id} className="hover:bg-[#fff8f5] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#1f1b17]">
                            {rf.id?.slice(0, 8)}
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-[#1f1b17]">{rf.school_name || "—"}</p>
                            <span className="font-mono text-xs text-[#8c7166]">{rf.school_code}</span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-rose-600">
                            {Number(rf.amount || 0).toLocaleString("vi-VN")} đ
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#545f73] max-w-xs truncate" title={rf.reason}>
                            {rf.reason || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#545f73]">
                            {rf.requester_email || rf.requester_name || "School Admin"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                rf.status === "succeeded"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : rf.status === "approved"
                                  ? "bg-[#fff8f5] border border-[#ffdbcc] text-[#f27024]"
                                  : rf.status === "requested"
                                  ? "bg-amber-100 text-amber-800"
                                  : rf.status === "rejected"
                                  ? "bg-[#fcf2eb] text-[#8c7166]"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {rf.status === "succeeded"
                                ? "Hoàn thành công"
                                : rf.status === "approved"
                                ? "Đã duyệt"
                                : rf.status === "requested"
                                ? "Chờ duyệt"
                                : rf.status === "rejected"
                                ? "Từ chối"
                                : rf.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#8c7166]">
                            {rf.created_at ? new Date(rf.created_at).toLocaleString("vi-VN") : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Refunds Pagination */}
              {rfPagination.totalPages > 1 && (
                <div className="shrink-0 flex items-center justify-between border-t border-[#f5ebe1] bg-[#fff8f5] px-4 py-2.5">
                  <span className="text-xs text-[#545f73]">
                    Trang {rfPagination.page} / {rfPagination.totalPages} (Tổng {rfPagination.total} yêu cầu)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={rfPagination.page <= 1}
                      onClick={() => loadRefunds(rfPagination.page - 1, rfSearch, rfStatusFilter)}
                      className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40 cursor-pointer"
                    >
                      Trước
                    </button>
                    <button
                      disabled={rfPagination.page >= rfPagination.totalPages}
                      onClick={() => loadRefunds(rfPagination.page + 1, rfSearch, rfStatusFilter)}
                      className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40 cursor-pointer"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}
