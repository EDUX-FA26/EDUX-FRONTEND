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

  const loadTransactions = async (page = 1) => {
    setTxLoading(true);
    setError("");
    try {
      const res = await getTransactions({
        page,
        limit: txPagination.limit,
        search: txSearch.trim() || undefined,
        status: txStatusFilter || undefined,
      });
      setTransactions(res.data.items || []);
      setTxPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải lịch sử giao dịch.");
    } finally {
      setTxLoading(false);
    }
  };

  const loadRefunds = async (page = 1) => {
    setRfLoading(true);
    setError("");
    try {
      const res = await getRefunds({
        page,
        limit: rfPagination.limit,
        status: rfStatusFilter || undefined,
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
      loadTransactions(1);
    } else {
      loadRefunds(1);
    }
  }, [activeTab, txStatusFilter, rfStatusFilter]);

  const handleTxSearchSubmit = (e) => {
    e.preventDefault();
    loadTransactions(1);
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1f1b17]">
              Theo dõi Giao dịch & Hoàn tiền (Chỉ đọc)
            </h1>
            <p className="mt-1 text-sm text-[#545f73]">
              Lịch sử thu phí trường học và tiến độ hoàn tiền trên hệ thống EDUX Multi-Tenant SaaS.
            </p>
          </div>

          <button
            onClick={() => (activeTab === "transactions" ? loadTransactions(txPagination.page) : loadRefunds(rfPagination.page))}
            disabled={txLoading || rfLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#545f73] shadow-xs hover:bg-[#fff8f5] hover:text-[#f27024] transition"
          >
            <RefreshCw className={`h-4 w-4 ${txLoading || rfLoading ? "animate-spin text-[#f27024]" : ""}`} />
            Làm mới
          </button>
        </div>

        {/* Read-Only Notice Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-[#ffdbcc] bg-[#fff8f5] p-4 sm:p-5 shadow-xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f27024] text-white shadow-xs">
            <Lock className="h-5 w-5" />
          </div>
          <div className="text-xs sm:text-sm leading-relaxed text-[#545f73]">
            <strong className="text-[#1f1b17]">Chế độ giám sát & đối soát (Read-only): </strong>
            Manager được cấp quyền xem toàn bộ giao dịch thanh toán và yêu cầu hoàn tiền để hỗ trợ vận hành trường. Thao tác <strong>phê duyệt hoàn tiền</strong>, <strong>từ chối</strong> và <strong>thực hiện lệnh chi (payout)</strong> được bảo lưu độc quyền cho <strong>Superadmin</strong>.
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-500 hover:text-red-700 font-bold ml-4">
              &times;
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-[#f5ebe1] gap-6">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "transactions"
                ? "border-[#f27024] text-[#f27024]"
                : "border-transparent text-[#545f73] hover:text-[#1f1b17]"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Lịch sử Giao dịch ({txPagination.total})
          </button>

          <button
            onClick={() => setActiveTab("refunds")}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "refunds"
                ? "border-[#f27024] text-[#f27024]"
                : "border-transparent text-[#545f73] hover:text-[#1f1b17]"
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            Tiến độ Hoàn tiền ({rfPagination.total})
          </button>
        </div>

        {/* TAB 1: TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <form onSubmit={handleTxSearchSubmit} className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8c7166]" />
                <input
                  type="text"
                  placeholder="Tìm theo mã giao dịch, tên trường, mã trường..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="w-full rounded-xl border border-[#f5ebe1] bg-white pl-10 pr-4 py-2.5 text-sm shadow-xs focus:border-[#f27024] focus:ring-1 focus:ring-[#f27024] text-[#1f1b17] placeholder-[#8c7166]"
                />
              </form>

              <div className="flex items-center gap-2">
                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  className="rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2.5 text-sm shadow-xs font-medium text-[#545f73] focus:border-[#f27024]"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="success">Thành công (Success)</option>
                  <option value="pending">Đang chờ (Pending)</option>
                  <option value="failed">Thất bại (Failed)</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[#f5ebe1] bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#fff8f5] text-xs font-bold text-[#8c7166] uppercase tracking-wider border-b border-[#f5ebe1]">
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

              {/* Pagination */}
              {txPagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#f5ebe1] bg-[#fff8f5] px-4 py-3">
                  <span className="text-xs text-[#545f73]">
                    Trang {txPagination.page} / {txPagination.totalPages} (Tổng {txPagination.total} giao dịch)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={txPagination.page <= 1}
                      onClick={() => loadTransactions(txPagination.page - 1)}
                      className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40"
                    >
                      Trước
                    </button>
                    <button
                      disabled={txPagination.page >= txPagination.totalPages}
                      onClick={() => loadTransactions(txPagination.page + 1)}
                      className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REFUNDS */}
        {activeTab === "refunds" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={rfStatusFilter}
                  onChange={(e) => setRfStatusFilter(e.target.value)}
                  className="rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2.5 text-sm shadow-xs font-medium text-[#545f73] focus:border-[#f27024]"
                >
                  <option value="">Tất cả trạng thái hoàn tiền</option>
                  <option value="requested">Chờ duyệt (Requested)</option>
                  <option value="approved">Đã duyệt (Approved)</option>
                  <option value="rejected">Từ chối (Rejected)</option>
                  <option value="succeeded">Thành công (Succeeded)</option>
                  <option value="failed">Thất bại (Failed)</option>
                </select>
              </div>

              <span className="text-xs text-[#8c7166]">
                Chế độ chỉ đọc • Chỉ Superadmin có quyền duyệt & chi trả
              </span>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-[#f5ebe1] bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#fff8f5] text-xs font-bold text-[#8c7166] uppercase tracking-wider border-b border-[#f5ebe1]">
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

              {/* Pagination */}
              {rfPagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#f5ebe1] bg-[#fff8f5] px-4 py-3">
                  <span className="text-xs text-[#545f73]">
                    Trang {rfPagination.page} / {rfPagination.totalPages} (Tổng {rfPagination.total} yêu cầu)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={rfPagination.page <= 1}
                      onClick={() => loadRefunds(rfPagination.page - 1)}
                      className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40"
                    >
                      Trước
                    </button>
                    <button
                      disabled={rfPagination.page >= rfPagination.totalPages}
                      onClick={() => loadRefunds(rfPagination.page + 1)}
                      className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
