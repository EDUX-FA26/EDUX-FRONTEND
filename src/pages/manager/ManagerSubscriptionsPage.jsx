import React, { useEffect, useState } from "react";
import {
  FileText,
  Search,
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Calendar,
  Building2,
  Info,
  RotateCcw,
} from "lucide-react";
import ManagerLayout from "../../components/platform/ManagerLayout";
import EduxAlert from "../../components/common/EduxAlert";
import { getSubscriptions, remindSubscriptionRenewal } from "../../services/platformApi";

export default function ManagerSubscriptionsPage() {
  const [contracts, setContracts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [remindingId, setRemindingId] = useState(null);

  const loadContracts = async (page = 1, currentSearch = search, currentStatus = statusFilter) => {
    setLoading(true);
    setError("");
    try {
      const res = await getSubscriptions({
        page,
        limit: pagination.limit,
        search: currentSearch.trim() || undefined,
        status: currentStatus || undefined,
      });
      setContracts(res.data.items || []);
      setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách hợp đồng thuê.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts(1, search, statusFilter);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadContracts(1, search, statusFilter);
  };

  const handleClearFilter = () => {
    if (search || statusFilter) {
      setSearch("");
      setStatusFilter("");
      loadContracts(1, "", "");
    }
  };

  const handleRemind = async (subId, schoolName) => {
    setRemindingId(subId);
    setError("");
    setSuccessMsg("");
    try {
      const res = await remindSubscriptionRenewal(subId);
      if (res?.data?.success === false) {
        setError(res.data.message || "Không thể gửi thông báo nhắc gia hạn.");
        return;
      }
      setSuccessMsg(`Đã gửi thông báo nhắc gia hạn đến School Admin của trường "${schoolName || res?.data?.school_name || ""}"!`);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi thông báo nhắc gia hạn.");
    } finally {
      setRemindingId(null);
    }
  };

  const calculateDaysRemaining = (endDateStr) => {
    if (!endDateStr) return { days: null, label: "Vô thời hạn", color: "text-[#8c7166]" };
    const now = new Date();
    const end = new Date(endDateStr);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { days: diffDays, label: `Đã quá hạn ${Math.abs(diffDays)} ngày`, color: "text-rose-600 font-semibold" };
    }
    if (diffDays <= 30) {
      return { days: diffDays, label: `Còn ${diffDays} ngày (Sắp hết)`, color: "text-[#f27024] font-semibold" };
    }
    return { days: diffDays, label: `Còn ${diffDays} ngày`, color: "text-emerald-600 font-semibold" };
  };

  return (
    <ManagerLayout>
      <div className="w-full max-w-[1600px] mx-auto min-w-0 h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-4 sm:px-5 lg:px-6 xl:px-8 pt-4 pb-4 box-border animate-fade-in">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-[#FFEDD5] via-[#FED7AA]/90 to-[#FDBA74]/85 border border-orange-300/80 rounded-2xl px-5 py-4 shadow-xs mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0">
              Quản lý Hợp đồng & Thuê bao Trường học
            </h1>
            <p className="text-sm text-slate-700 font-medium mt-1 m-0">
              Theo dõi tình trạng hợp đồng, gói dịch vụ và thời hạn thuê bao của tất cả trường trên nền tảng.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadContracts(pagination.page, search, statusFilter)}
            disabled={loading}
            className="h-10 px-3.5 rounded-xl bg-white/95 hover:bg-white border border-orange-200/80 text-xs sm:text-sm font-semibold text-slate-800 hover:text-[#EA580C] shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#EA580C]" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="shrink-0 mb-3">
            <EduxAlert
              type="success"
              message={successMsg}
              onClose={() => setSuccessMsg("")}
            />
          </div>
        )}

        {error && (
          <div className="shrink-0 mb-3">
            <EduxAlert
              type="error"
              message={error}
              onClose={() => setError("")}
            />
          </div>
        )}

        {/* Read-Only Notice Banner */}
        <div className="shrink-0 mb-3 flex items-start gap-2.5 rounded-xl border border-[#ffdbcc] bg-[#fff8f5] py-2 px-3.5 text-xs text-[#1f1b17]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#f27024] mt-0.5" />
          <span>
            <strong>Chế độ theo dõi chỉ đọc (Read-only): </strong>
            Manager theo dõi thời hạn hợp đồng và gửi thông báo nhắc gia hạn trực tiếp cho School Admin. Thẩm quyền định giá gói dịch vụ, cấu hình biểu phí và tạo mới gói thuê thuộc về <strong>Superadmin</strong>.
          </span>
        </div>

        {/* Card Container: Filter + Table */}
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-xs">
          {/* Filter and Search Bar */}
          <div className="shrink-0 p-3.5 border-b border-slate-100 flex flex-wrap items-center gap-2.5">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[180px] sm:min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên trường, mã trường, tên gói..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs shadow-xs focus:border-[#f27024] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#f27024] text-slate-800 placeholder-slate-400"
              />
            </form>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 w-48 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus:border-[#f27024] focus:outline-none"
              >
                <option value="">Tất cả trạng thái hợp đồng</option>
                <option value="active">Đang hiệu lực (Active)</option>
                <option value="expired">Đã hết hạn (Expired)</option>
                <option value="cancelled">Đã hủy (Cancelled)</option>
              </select>
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

          {/* Contracts Table: Scrollable independently */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#fff8f5] z-10 text-xs font-bold text-[#8c7166] uppercase tracking-wider border-b border-[#f5ebe1]">
                <tr>
                  <th className="py-3 px-4">Trường học</th>
                  <th className="py-3 px-4 whitespace-nowrap">Gói dịch vụ</th>
                  <th className="py-3 px-4 whitespace-nowrap">Chu kỳ</th>
                  <th className="py-3 px-4 whitespace-nowrap">Giá chốt hợp đồng</th>
                  <th className="py-3 px-4 whitespace-nowrap">Thời hạn thuê</th>
                  <th className="py-3 px-4 whitespace-nowrap">Thời gian còn lại</th>
                  <th className="py-3 px-4 whitespace-nowrap">Trạng thái</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5ebe1] text-[#1f1b17]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[#8c7166]">
                      Đang tải danh sách hợp đồng...
                    </td>
                  </tr>
                ) : contracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[#8c7166]">
                      Không tìm thấy hợp đồng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  contracts.map((sub) => {
                    const remaining = calculateDaysRemaining(sub.end_date);
                    return (
                      <tr key={sub.id} className="hover:bg-[#fff8f5] transition-colors">
                        {/* School */}
                        <td className="py-3.5 px-4 min-w-0">
                          <div>
                            <p className="font-semibold text-[#1f1b17] leading-tight truncate max-w-[200px]">
                              {sub.school_name || "—"}
                            </p>
                            <span className="font-mono text-xs text-[#8c7166]">
                              {sub.school_code}
                            </span>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md bg-[#fff8f5] border border-[#ffdbcc] px-2 py-1 text-xs font-semibold text-[#f27024]">
                            {sub.plan_name || "Gói tiêu chuẩn"}
                          </span>
                        </td>

                        {/* Cycle */}
                        <td className="py-3.5 px-4 text-xs font-medium text-[#545f73] whitespace-nowrap">
                          {sub.billing_cycle === "yearly" ? "Theo năm" : "Theo tháng"}
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 font-semibold text-[#1f1b17] whitespace-nowrap">
                          {Number(sub.price_snapshot || 0).toLocaleString("vi-VN")} đ
                        </td>

                        {/* Dates */}
                        <td className="py-3.5 px-4 text-xs text-[#545f73] whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-[#8c7166]" />
                            <span>
                              {sub.start_date ? new Date(sub.start_date).toLocaleDateString("vi-VN") : "—"} đến{" "}
                              {sub.end_date ? new Date(sub.end_date).toLocaleDateString("vi-VN") : "Vô hạn"}
                            </span>
                          </div>
                        </td>

                        {/* Remaining */}
                        <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                          <span className={remaining.color}>{remaining.label}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              sub.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : sub.status === "expired"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-[#fcf2eb] text-[#8c7166]"
                            }`}
                          >
                            {sub.status === "active" ? "Đang hiệu lực" : sub.status === "expired" ? "Đã hết hạn" : sub.status}
                          </span>
                        </td>

                        {/* Remind Renewal */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleRemind(sub.id, sub.school_name)}
                            disabled={remindingId === sub.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-medium text-[#545f73] shadow-xs hover:bg-[#fff8f5] hover:text-[#f27024] hover:border-[#ffdbcc] transition disabled:opacity-50 cursor-pointer"
                            title="Gửi thông báo nhắc School Admin gia hạn gói"
                          >
                            <Bell className={`h-3.5 w-3.5 ${remindingId === sub.id ? "animate-spin" : "text-[#f27024]"}`} />
                            Nhắc gia hạn
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="shrink-0 flex items-center justify-between border-t border-[#f5ebe1] bg-[#fff8f5] px-4 py-2.5">
              <span className="text-xs text-[#545f73]">
                Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} hợp đồng)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadContracts(pagination.page - 1, search, statusFilter)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40 cursor-pointer"
                >
                  Trước
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadContracts(pagination.page + 1, search, statusFilter)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40 cursor-pointer"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}
