import React, { useEffect, useState, useCallback } from "react";
import SuperadminLayout from "../../components/platform/SuperadminLayout";
import {
  getRevenue,
  getTransactions,
} from "../../services/platformApi";
import {
  TrendingUp,
  CreditCard,
  RotateCcw,
  Building,
  Calendar,
  Search,
  RefreshCw,
  Layers3,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function PlatformRevenuePage() {
  const [revenueData, setRevenueData] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);

  // Transactions table state
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [txLoading, setTxLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadRevenue = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const res = await getRevenue();
      setRevenueData(res.data);
    } catch (err) {
      console.error("Error loading revenue data:", err);
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async (page = 1) => {
    setTxLoading(true);
    try {
      const res = await getTransactions({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setTransactions(res.data?.items || []);
      setPagination(res.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setTxLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadRevenue();
    loadTransactions(1);
  }, [loadRevenue, loadTransactions]);

  const summary = revenueData?.summary || {};
  const byPlan = revenueData?.by_plan || [];
  const byMonth = revenueData?.by_month || [];
  const bySchool = revenueData?.by_school || [];

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b17]">Tổng quan & Doanh thu Nền tảng</h1>
            <p className="mt-1 text-sm text-[#545f73]">
              Theo dõi biến động dòng tiền, thống kê giao dịch PayOS/VietQR và quản trị tài chính toàn hệ thống EDUX.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              loadRevenue();
              loadTransactions(pagination.page);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2 text-xs font-semibold text-[#545f73] shadow-xs hover:bg-[#fff8f5] hover:text-[#f27024] transition"
          >
            <RefreshCw className={`h-4 w-4 ${revenueLoading || txLoading ? "animate-spin text-[#f27024]" : ""}`} />
            Làm mới dữ liệu
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8c7166]">Doanh thu thực (Net)</span>
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-600">
              {formatCurrency(summary.total_revenue || 0)}
            </p>
            <p className="mt-2 text-xs text-[#8c7166]">Đã trừ các khoản hoàn tiền</p>
          </div>

          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8c7166]">Doanh thu gộp (Gross)</span>
              <div className="rounded-xl bg-[#fff8f5] p-2.5 text-[#f27024]">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-[#1f1b17]">
              {formatCurrency(summary.total_gross_revenue || summary.total_revenue || 0)}
            </p>
            <p className="mt-2 text-xs text-[#8c7166]">Tổng giá trị thanh toán thu về</p>
          </div>

          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8c7166]">Tổng tiền đã hoàn</span>
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                <RotateCcw className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-amber-600">
              {formatCurrency(summary.total_refunded || 0)}
            </p>
            <p className="mt-2 text-xs text-[#8c7166]">
              {summary.successful_refunds_count || 0} yêu cầu hoàn đã xử lý
            </p>
          </div>

          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8c7166]">Giao dịch thành công</span>
              <div className="rounded-xl bg-[#fff8f5] p-2.5 text-[#f27024]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-black text-[#f27024]">
              {summary.total_successful_payments || 0}
            </p>
            <p className="mt-2 text-xs text-[#8c7166]">Giao dịch hợp lệ trên hệ thống</p>
          </div>
        </div>

        {/* Breakdown by Plan & Top Schools */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue by Plan */}
          <div className="rounded-3xl border border-[#f5ebe1] bg-white p-6 shadow-xs">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#1f1b17]">
              <Layers3 className="h-5 w-5 text-[#f27024]" />
              Doanh thu theo Gói dịch vụ
            </h2>
            <div className="mt-4 space-y-3">
              {byPlan.length === 0 ? (
                <p className="text-xs text-[#8c7166] py-6 text-center">Chưa có giao dịch theo gói</p>
              ) : (
                byPlan.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-2xl bg-[#fff8f5] p-3.5 border border-[#f5ebe1]/60">
                    <div>
                      <p className="font-semibold text-[#1f1b17]">{item.plan_name}</p>
                      <p className="text-xs text-[#545f73]">{item.transaction_count} giao dịch</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1f1b17]">{formatCurrency(item.revenue || item.gross_revenue)}</p>
                      {item.refunded_amount > 0 && (
                        <p className="text-[11px] text-amber-600 font-medium">Đã hoàn: {formatCurrency(item.refunded_amount)}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Paying Schools */}
          <div className="rounded-3xl border border-[#f5ebe1] bg-white p-6 shadow-xs">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#1f1b17]">
              <Building className="h-5 w-5 text-[#f27024]" />
              Top Trường học đóng góp doanh thu
            </h2>
            <div className="mt-4 space-y-3">
              {bySchool.length === 0 ? (
                <p className="text-xs text-[#8c7166] py-6 text-center">Chưa có dữ liệu trường học thanh toán</p>
              ) : (
                bySchool.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-2xl bg-[#fff8f5] p-3.5 border border-[#f5ebe1]/60">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffdbcc] text-xs font-bold text-[#a04100]">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-[#1f1b17]">{s.school_name}</p>
                        <p className="text-xs text-[#8c7166] font-mono">{s.school_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1f1b17]">{formatCurrency(s.total_paid)}</p>
                      <p className="text-[11px] text-[#545f73]">{s.transaction_count} lần thanh toán</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Revenue by Month Bar Display */}
        {byMonth.length > 0 && (
          <div className="rounded-3xl border border-[#f5ebe1] bg-white p-6 shadow-xs">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#1f1b17]">
              <Calendar className="h-5 w-5 text-[#f27024]" />
              Biến động Doanh thu 12 tháng gần nhất
            </h2>
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {byMonth.map((m, idx) => (
                <div key={idx} className="rounded-2xl border border-[#f5ebe1] bg-[#fff8f5] p-3.5 text-center">
                  <p className="text-xs font-semibold text-[#545f73]">{m.month}</p>
                  <p className="mt-2 text-sm font-extrabold text-[#1f1b17]">{formatCurrency(m.revenue)}</p>
                  <p className="text-[11px] text-[#8c7166] mt-1">{m.transaction_count} GD</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Transactions Table */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1f1b17]">Chi tiết Lịch sử Giao dịch</h2>
              <p className="text-xs text-[#545f73]">Danh sách các khoản thanh toán subscription của toàn hệ thống.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8c7166]" />
                <input
                  type="text"
                  placeholder="Mã đơn / tên trường…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl border border-[#f5ebe1] bg-white pl-8 pr-3 py-1.5 text-xs text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#f5ebe1] bg-white px-2.5 py-1.5 text-xs text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="success">Thành công</option>
                <option value="refunded">Đã hoàn tiền</option>
                <option value="pending">Chờ xử lý</option>
                <option value="failed">Thất bại</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#f5ebe1] bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#f5ebe1] bg-[#fff8f5] font-bold uppercase tracking-wider text-[#8c7166]">
                  <tr>
                    <th className="px-5 py-3.5">Mã đơn hàng</th>
                    <th className="px-5 py-3.5">Trường học</th>
                    <th className="px-5 py-3.5">Gói dịch vụ</th>
                    <th className="px-5 py-3.5">Số tiền</th>
                    <th className="px-5 py-3.5">Cổng</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5ebe1]">
                  {txLoading ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-[#545f73]">
                        <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#f27024] mb-2" />
                        Đang tải giao dịch…
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-[#8c7166]">
                        Không tìm thấy giao dịch nào.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#fff8f5] transition">
                        <td className="px-5 py-3 font-mono font-medium text-[#1f1b17]">
                          {tx.order_reference}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-[#1f1b17]">{tx.school_name || "—"}</p>
                          <p className="text-[11px] text-[#8c7166] font-mono">{tx.school_code}</p>
                        </td>
                        <td className="px-5 py-3 text-[#545f73]">{tx.plan_name || tx.plan_id || "—"}</td>
                        <td className="px-5 py-3 font-bold text-[#1f1b17]">{formatCurrency(tx.amount)}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-md px-2 py-0.5 font-bold uppercase text-[10px] ${
                              tx.payment_method === "payos"
                                ? "bg-[#fff8f5] text-[#f27024] border border-[#ffdbcc]"
                                : "bg-[#fcf2eb] text-[#a04100] border border-[#ffdbcc]"
                            }`}
                          >
                            {tx.payment_method || "payos"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {tx.status === "success" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Thành công
                            </span>
                          ) : tx.status === "refunded" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Đã hoàn tiền
                            </span>
                          ) : tx.status === "pending" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#fcf2eb] px-2.5 py-0.5 font-semibold text-[#8c7166]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#8c7166]" />
                              Chờ xử lý
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 font-semibold text-red-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                              Thất bại
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-[#8c7166] text-[11px]">
                          {tx.paid_at || tx.created_at
                            ? new Date(tx.paid_at || tx.created_at).toLocaleString("vi-VN")
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#f5ebe1] bg-[#fff8f5] px-5 py-2.5 text-xs text-[#545f73]">
                <p>
                  Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} GD)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => loadTransactions(pagination.page - 1)}
                    className="rounded-lg border border-[#f5ebe1] bg-white px-2.5 py-1 font-medium hover:bg-[#fff8f5] disabled:opacity-40"
                  >
                    ← Trước
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadTransactions(pagination.page + 1)}
                    className="rounded-lg border border-[#f5ebe1] bg-white px-2.5 py-1 font-medium hover:bg-[#fff8f5] disabled:opacity-40"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SuperadminLayout>
  );
}
