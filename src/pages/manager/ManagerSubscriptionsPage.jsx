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
} from "lucide-react";
import ManagerLayout from "../../components/platform/ManagerLayout";
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

  const loadContracts = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await getSubscriptions({
        page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
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
    loadContracts(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadContracts(1);
  };

  const handleRemind = async (subId, schoolName) => {
    setRemindingId(subId);
    try {
      const res = await remindSubscriptionRenewal(subId);
      setSuccessMsg(`Đã gửi thông báo nhắc gia hạn đến School Admin của trường "${schoolName || res.data?.school_name || ""}"!`);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1f1b17]">
              Quản lý Hợp đồng & Thuê bao Trường học
            </h1>
            <p className="mt-1 text-sm text-[#545f73]">
              Theo dõi tình trạng hợp đồng, gói dịch vụ và thời hạn thuê bao của tất cả trường trên nền tảng.
            </p>
          </div>

          <button
            onClick={() => loadContracts(pagination.page)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#545f73] shadow-xs hover:bg-[#fff8f5] hover:text-[#f27024] transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#f27024]" : ""}`} />
            Làm mới
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="flex items-center justify-between rounded-xl bg-[#fff8f5] border border-[#ffdbcc] p-4 text-sm text-[#1f1b17]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#f27024] shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-[#f27024] hover:text-[#d95c14] font-bold ml-4">
              &times;
            </button>
          </div>
        )}

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

        {/* Read-Only Notice Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-[#ffdbcc] bg-[#fff8f5] p-4 sm:p-5 shadow-xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f27024] text-white shadow-xs">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-xs sm:text-sm leading-relaxed text-[#545f73]">
            <strong className="text-[#1f1b17]">Chế độ theo dõi chỉ đọc (Read-only): </strong>
            Manager theo dõi thời hạn hợp đồng và gửi thông báo nhắc gia hạn trực tiếp cho School Admin. Thẩm quyền định giá gói dịch vụ, cấu hình biểu phí và tạo mới gói thuê thuộc về <strong>Superadmin</strong>.
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8c7166]" />
            <input
              type="text"
              placeholder="Tìm theo tên trường, mã trường, tên gói..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#f5ebe1] bg-white pl-10 pr-4 py-2.5 text-sm shadow-xs focus:border-[#f27024] focus:ring-1 focus:ring-[#f27024] text-[#1f1b17] placeholder-[#8c7166]"
            />
          </form>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2.5 text-sm shadow-xs font-medium text-[#545f73] focus:border-[#f27024]"
            >
              <option value="">Tất cả trạng thái hợp đồng</option>
              <option value="active">Đang hiệu lực (Active)</option>
              <option value="expired">Đã hết hạn (Expired)</option>
              <option value="cancelled">Đã hủy (Cancelled)</option>
            </select>
          </div>
        </div>

        {/* Contracts Table */}
        <div className="rounded-2xl border border-[#f5ebe1] bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fff8f5] text-xs font-bold text-[#8c7166] uppercase tracking-wider border-b border-[#f5ebe1]">
                <tr>
                  <th className="py-3 px-4">Trường học</th>
                  <th className="py-3 px-4">Gói dịch vụ</th>
                  <th className="py-3 px-4">Chu kỳ</th>
                  <th className="py-3 px-4">Giá chốt hợp đồng</th>
                  <th className="py-3 px-4">Thời hạn thuê</th>
                  <th className="py-3 px-4">Thời gian còn lại</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
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
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-semibold text-[#1f1b17] leading-tight">
                              {sub.school_name || "—"}
                            </p>
                            <span className="font-mono text-xs text-[#8c7166]">
                              {sub.school_code}
                            </span>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center rounded-md bg-[#fff8f5] border border-[#ffdbcc] px-2 py-1 text-xs font-semibold text-[#f27024]">
                            {sub.plan_name || "Gói tiêu chuẩn"}
                          </span>
                        </td>

                        {/* Cycle */}
                        <td className="py-3.5 px-4 text-xs font-medium text-[#545f73]">
                          {sub.billing_cycle === "yearly" ? "Theo năm" : "Theo tháng"}
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 font-semibold text-[#1f1b17]">
                          {Number(sub.price_snapshot || 0).toLocaleString("vi-VN")} đ
                        </td>

                        {/* Dates */}
                        <td className="py-3.5 px-4 text-xs text-[#545f73]">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-[#8c7166]" />
                            <span>
                              {sub.start_date ? new Date(sub.start_date).toLocaleDateString("vi-VN") : "—"} đến{" "}
                              {sub.end_date ? new Date(sub.end_date).toLocaleDateString("vi-VN") : "Vô hạn"}
                            </span>
                          </div>
                        </td>

                        {/* Remaining */}
                        <td className="py-3.5 px-4 text-xs">
                          <span className={remaining.color}>{remaining.label}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
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
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleRemind(sub.id, sub.school_name)}
                            disabled={remindingId === sub.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-medium text-[#545f73] shadow-xs hover:bg-[#fff8f5] hover:text-[#f27024] hover:border-[#ffdbcc] transition disabled:opacity-50"
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
            <div className="flex items-center justify-between border-t border-[#f5ebe1] bg-[#fff8f5] px-4 py-3">
              <span className="text-xs text-[#545f73]">
                Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} hợp đồng)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadContracts(pagination.page - 1)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadContracts(pagination.page + 1)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40"
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
