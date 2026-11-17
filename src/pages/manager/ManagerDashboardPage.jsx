import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  FileText,
  CreditCard,
  RefreshCw,
  PlusCircle,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Bell,
} from "lucide-react";
import ManagerLayout from "../../components/platform/ManagerLayout";
import api from "../../config/axios.config";
import {
  createSchool,
  inviteSchoolAdmin,
  remindSubscriptionRenewal,
} from "../../services/platformApi";

export default function ManagerDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Quick invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState(null);
  const [inviting, setInviting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewRes, schoolsRes, subscriptionsRes, transactionsRes] = await Promise.all([
        api.get("/platform/overview"),
        api.get("/platform/schools", { params: { limit: 5 } }),
        api.get("/platform/subscriptions", { params: { limit: 5 } }),
        api.get("/platform/transactions", { params: { limit: 5 } }),
      ]);

      setData({
        overview: overviewRes.data.data,
        schools: schoolsRes.data.data,
        subscriptions: subscriptionsRes.data.data,
        transactions: transactionsRes.data.data,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải dữ liệu bảng điều khiển.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBlankTenant = async () => {
    try {
      const res = await createSchool();
      const school = res.data;
      setActionMessage(`Đã khởi tạo tenant trường trống mã: ${school.code || school.id}. Hãy mời School Admin để bàn giao.`);
      loadData();
      setSelectedSchoolId(school.id);
      setInviteModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể khởi tạo tenant mới.");
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!selectedSchoolId || !inviteEmail) return;
    setInviting(true);
    try {
      const res = await inviteSchoolAdmin(selectedSchoolId, inviteEmail);
      setInviteResult(res.data);
      setActionMessage(`Đã gửi lời mời tới ${inviteEmail} thành công!`);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi lời mời.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemindRenewal = async (subId, schoolName) => {
    try {
      const res = await remindSubscriptionRenewal(subId);
      setActionMessage(`Đã gửi thông báo nhắc nhở gia hạn đến School Admin của trường ${schoolName || res.data?.school_name || ""}`);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi thông báo gia hạn.");
    }
  };

  const overview = data?.overview || {};
  const recentSchools = data?.schools?.items || [];
  const recentSubscriptions = data?.subscriptions?.items || [];
  const recentTransactions = data?.transactions?.items || [];

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1f1b17]">
              Bảng điều khiển Vận hành
            </h1>
            <p className="mt-1 text-sm text-[#545f73]">
              Quản lý danh sách cơ sở đào tạo, theo dõi hợp đồng và các nghiệp vụ vận hành nền tảng EDUX.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCreateBlankTenant}
              className="inline-flex items-center gap-2 rounded-xl bg-[#f27024] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-[#d95c14] transition"
            >
              <PlusCircle className="h-4 w-4" />
              Khởi tạo Tenant mới
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#545f73] shadow-xs hover:bg-[#fff8f5] hover:text-[#f27024] transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#f27024]" : ""}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Action alert message */}
        {actionMessage && (
          <div className="flex items-center justify-between rounded-xl bg-[#fff8f5] border border-[#ffdbcc] p-4 text-sm text-[#1f1b17]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#f27024] shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage("")} className="text-[#f27024] hover:text-[#d95c14] font-bold ml-4">
              &times;
            </button>
          </div>
        )}

        {/* Error message */}
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

        {/* Manager Scope Info Banner */}
        <div className="rounded-2xl border border-[#f5ebe1] bg-gradient-to-r from-[#fff8f5] via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f27024] text-white shadow-xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="text-xs sm:text-sm leading-relaxed text-[#545f73]">
              <span className="font-bold text-[#1f1b17]">Phân quyền Vận hành Manager: </span>
              Quản lý vòng đời trường học (Khởi tạo tenant, gửi lời mời School Admin, Khóa/Mở, Đình chỉ/Khôi phục, Xóa mềm). Theo dõi hợp đồng và thanh toán ở chế độ chỉ đọc. Manager không sửa thông tin/logo trường và không quản lý giá gói thuê.
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#545f73]">Tổng số trường</span>
              <Building2 className="h-4 w-4 text-[#8c7166]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#1f1b17]">{overview.total_schools ?? 0}</p>
            <p className="mt-1 text-[11px] text-[#8c7166]">Tất cả tenant</p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700">Đang hoạt động</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{overview.active_schools ?? 0}</p>
            <p className="mt-1 text-[11px] text-emerald-600">Vận hành bình thường</p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700">Chờ thiết lập</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-700">{overview.pending_setup_schools ?? 0}</p>
            <p className="mt-1 text-[11px] text-amber-600">Đang chờ bàn giao</p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-700">Khóa / Đình chỉ</span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-rose-700">
              {(overview.locked_schools ?? 0) + (overview.suspended_schools ?? 0)}
            </p>
            <p className="mt-1 text-[11px] text-rose-600">Cần xử lý vận hành</p>
          </div>

          <div className="rounded-2xl border border-[#ffdbcc] bg-[#fff8f5] p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#f27024]">Hợp đồng hiệu lực</span>
              <FileText className="h-4 w-4 text-[#f27024]" />
            </div>
            <p className="mt-2 text-2xl font-bold text-[#f27024]">{overview.active_contracts ?? 0}</p>
            <p className="mt-1 text-[11px] text-[#a04100]">Thuê bao đang mở</p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-orange-700">Sắp hết hạn</span>
              <Bell className="h-4 w-4 text-orange-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-orange-700">{overview.expiring_contracts ?? 0}</p>
            <p className="mt-1 text-[11px] text-orange-600">Trong vòng 30 ngày</p>
          </div>
        </div>

        {/* Two-Column Section: Recent Schools & Recent Contracts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Schools */}
          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#1f1b17]">Danh sách Trường gần đây</h2>
                <p className="text-xs text-[#545f73]">Các tenant được khởi tạo hoặc đăng ký mới nhất</p>
              </div>
              <Link
                to="/manager/schools"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#f27024] hover:text-[#d95c14]"
              >
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-[#f5ebe1] overflow-x-auto">
              {recentSchools.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#8c7166]">Chưa có trường nào.</p>
              ) : (
                recentSchools.map((school) => (
                  <div key={school.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ffdbcc] text-[#a04100] font-bold text-xs">
                        {(school.name?.[0] || school.code?.[0] || "T").toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#1f1b17]">
                            {school.name || "Tenant chưa đặt tên"}
                          </p>
                          <span className="font-mono text-xs text-[#8c7166]">({school.code})</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {school.provisioning_source === "self_registered" ? (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Tự đăng ký
                            </span>
                          ) : (
                            <span className="rounded bg-[#fff8f5] border border-[#ffdbcc] px-1.5 py-0.5 text-[10px] font-semibold text-[#f27024]">
                              Manager khởi tạo
                            </span>
                          )}
                          <span className="text-xs text-[#8c7166]">
                            {school.total_members ?? 0} thành viên
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          school.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : school.status === "pending_setup"
                            ? "bg-amber-100 text-amber-800"
                            : school.status === "locked"
                            ? "bg-rose-100 text-rose-800"
                            : school.status === "suspended"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-[#fcf2eb] text-[#8c7166]"
                        }`}
                      >
                        {school.status === "active"
                          ? "Hoạt động"
                          : school.status === "pending_setup"
                          ? "Chờ thiết lập"
                          : school.status === "locked"
                          ? "Bị khóa"
                          : school.status === "suspended"
                          ? "Đình chỉ"
                          : school.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expiring / Active Subscriptions */}
          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#1f1b17]">Hợp đồng & Thuê bao</h2>
                <p className="text-xs text-[#545f73]">Theo dõi thời hạn và gửi nhắc nhở gia hạn</p>
              </div>
              <Link
                to="/manager/subscriptions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#f27024] hover:text-[#d95c14]"
              >
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-[#f5ebe1] overflow-x-auto">
              {recentSubscriptions.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#8c7166]">Chưa có hợp đồng nào.</p>
              ) : (
                recentSubscriptions.map((sub) => {
                  const isExpiring = sub.end_date && new Date(sub.end_date) <= new Date(Date.now() + 30 * 86400000);
                  return (
                    <div key={sub.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#1f1b17]">
                            {sub.school_name || sub.school_code}
                          </p>
                          <span className="rounded bg-[#fff8f5] border border-[#ffdbcc] px-1.5 py-0.5 text-[10px] font-semibold text-[#f27024]">
                            {sub.plan_name || "Gói dịch vụ"}
                          </span>
                        </div>
                        <p className="text-xs text-[#545f73] mt-0.5">
                          Hạn dùng: {sub.end_date ? new Date(sub.end_date).toLocaleDateString("vi-VN") : "Vô thời hạn"}
                          {isExpiring && <span className="ml-2 font-medium text-[#f27024]">Sắp hết hạn</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemindRenewal(sub.id, sub.school_name)}
                          className="rounded-lg border border-[#f5ebe1] bg-white px-2.5 py-1 text-xs font-medium text-[#545f73] hover:bg-[#fff8f5] hover:text-[#f27024] transition"
                          title="Gửi nhắc nhở gia hạn đến School Admin"
                        >
                          <Bell className="h-3.5 w-3.5 inline mr-1 text-[#f27024]" />
                          Nhắc gia hạn
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions (Read-Only) */}
        <div className="rounded-2xl border border-[#f5ebe1] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#1f1b17]">Lịch sử Giao dịch thanh toán gần nhất</h2>
              <p className="text-xs text-[#545f73]">Chế độ theo dõi giao dịch (Chỉ đọc)</p>
            </div>
            <Link
              to="/manager/payments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#f27024] hover:text-[#d95c14]"
            >
              Xem tất cả giao dịch <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fff8f5] text-xs font-bold text-[#8c7166] uppercase tracking-wider border-b border-[#f5ebe1]">
                <tr>
                  <th className="py-2.5 px-3">Mã giao dịch</th>
                  <th className="py-2.5 px-3">Trường học</th>
                  <th className="py-2.5 px-3">Gói</th>
                  <th className="py-2.5 px-3">Số tiền</th>
                  <th className="py-2.5 px-3">Cổng</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5ebe1] text-[#1f1b17]">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#8c7166]">
                      Chưa có giao dịch nào phát sinh.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#fff8f5] transition-colors">
                      <td className="py-3 px-3 font-mono text-xs font-semibold text-[#1f1b17]">
                        {tx.order_reference || tx.id?.slice(0, 8)}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#1f1b17]">
                        {tx.school_name || tx.school_code}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#545f73]">{tx.plan_name || "—"}</td>
                      <td className="py-3 px-3 font-semibold text-[#1f1b17]">
                        {Number(tx.amount || 0).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded bg-[#fff8f5] border border-[#ffdbcc] px-2 py-0.5 text-[11px] font-medium text-[#f27024] uppercase">
                          {tx.payment_method || "payos"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            tx.status === "success"
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.status === "success" ? "Thành công" : tx.status === "pending" ? "Đang chờ" : tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#8c7166]">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString("vi-VN") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Invite School Admin */}
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#f5ebe1]">
              <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-3">
                <h3 className="text-base font-bold text-[#1f1b17]">Mời School Admin</h3>
                <button
                  onClick={() => {
                    setInviteModalOpen(false);
                    setInviteResult(null);
                    setInviteEmail("");
                  }}
                  className="rounded-lg p-1 text-[#8c7166] hover:bg-[#fff8f5]"
                >
                  &times;
                </button>
              </div>

              {inviteResult ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-800">
                    <p className="font-semibold">Đã tạo liên kết bàn giao thành công!</p>
                    <p className="text-xs mt-1">Gửi liên kết bên dưới cho School Admin để hoàn tất kích hoạt trường:</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={`${window.location.origin}${inviteResult.inviteUrl}`}
                      className="w-full rounded-lg border border-[#f5ebe1] bg-[#fff8f5] px-3 py-2 text-xs font-mono text-[#1f1b17] select-all"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${inviteResult.inviteUrl}`);
                        alert("Đã sao chép liên kết bàn giao!");
                      }}
                      className="rounded-lg bg-[#f27024] px-3 py-2 text-xs font-semibold text-white hover:bg-[#d95c14] whitespace-nowrap"
                    >
                      Sao chép
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setInviteModalOpen(false);
                      setInviteResult(null);
                      setInviteEmail("");
                    }}
                    className="w-full mt-2 rounded-lg border border-[#f5ebe1] bg-white py-2 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5]"
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendInvite} className="mt-4 space-y-4">
                  <p className="text-xs text-[#545f73]">
                    Nhập email đại diện trường. Hệ thống sẽ sinh liên kết bàn giao tenant để School Admin hoàn thiện thông tin trường và thiết lập tài khoản.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#1f1b17] mb-1">
                      Email School Admin nhận bàn giao
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@school.edu.vn"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-lg border border-[#f5ebe1] bg-white px-3 py-2 text-sm text-[#1f1b17] focus:border-[#f27024] focus:ring-1 focus:ring-[#f27024]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setInviteModalOpen(false)}
                      className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-2 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5]"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="rounded-lg bg-[#f27024] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d95c14] disabled:opacity-50 transition"
                    >
                      {inviting ? "Đang gửi…" : "Tạo & Gửi lời mời"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
