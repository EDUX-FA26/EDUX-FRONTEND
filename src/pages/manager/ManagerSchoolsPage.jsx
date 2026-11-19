import React, { useEffect, useState } from "react";
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  Lock,
  Unlock,
  AlertTriangle,
  Play,
  Trash2,
  Mail,
  Copy,
  CheckCircle2,
  RefreshCw,
  Eye,
  Info,
} from "lucide-react";
import ManagerLayout from "../../components/platform/ManagerLayout";
import EduxAlert from "../../components/common/EduxAlert";
import {
  getSchools,
  createSchool,
  inviteSchoolAdmin,
  lockSchool,
  unlockSchool,
  suspendSchool,
  unsuspendSchool,
  deleteSchool,
} from "../../services/platformApi";

export default function ManagerSchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals state
  const [inviteModal, setInviteModal] = useState({ open: false, schoolId: null, schoolName: "", schoolCode: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState(null);
  const [inviting, setInviting] = useState(false);

  const [statusModal, setStatusModal] = useState({ open: false, schoolId: null, action: null, schoolName: "", reason: "" });
  const [processingStatus, setProcessingStatus] = useState(false);

  const loadSchools = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await getSchools({
        page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setSchools(res.data.items || []);
      setPagination(res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách trường.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadSchools(1);
  };

  const handleCreateTenant = async () => {
    try {
      const res = await createSchool();
      const school = res.data;
      setSuccessMsg(`Khởi tạo tenant trống thành công! Mã trường: ${school.code || school.id}`);
      loadSchools(1);
      // Automatically open invite modal for the new tenant
      setInviteModal({
        open: true,
        schoolId: school.id,
        schoolName: school.name || "Tenant mới tạo",
        schoolCode: school.code,
      });
      setInviteResult(null);
      setInviteEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tạo tenant mới.");
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteModal.schoolId || !inviteEmail) return;
    setInviting(true);
    try {
      const res = await inviteSchoolAdmin(inviteModal.schoolId, inviteEmail);
      setInviteResult(res.data);
      setSuccessMsg(`Đã tạo liên kết bàn giao cho email: ${inviteEmail}`);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tạo lời mời.");
    } finally {
      setInviting(false);
    }
  };

  const handleStatusAction = async () => {
    if (!statusModal.schoolId || !statusModal.action) return;
    setProcessingStatus(true);
    try {
      if (statusModal.action === "lock") {
        await lockSchool(statusModal.schoolId, statusModal.reason);
        setSuccessMsg(`Đã khóa trường "${statusModal.schoolName}" thành công.`);
      } else if (statusModal.action === "unlock") {
        await unlockSchool(statusModal.schoolId);
        setSuccessMsg(`Đã mở khóa trường "${statusModal.schoolName}" thành công.`);
      } else if (statusModal.action === "suspend") {
        await suspendSchool(statusModal.schoolId, statusModal.reason);
        setSuccessMsg(`Đã đình chỉ trường "${statusModal.schoolName}".`);
      } else if (statusModal.action === "restore") {
        await unsuspendSchool(statusModal.schoolId);
        setSuccessMsg(`Đã khôi phục trường "${statusModal.schoolName}".`);
      } else if (statusModal.action === "delete") {
        await deleteSchool(statusModal.schoolId);
        setSuccessMsg(`Đã xóa mềm trường "${statusModal.schoolName}".`);
      }
      setStatusModal({ open: false, schoolId: null, action: null, schoolName: "", reason: "" });
      loadSchools(pagination.page);
    } catch (err) {
      setError(err.response?.data?.message || "Thao tác không thành công.");
    } finally {
      setProcessingStatus(false);
    }
  };

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1f1b17]">
              Quản lý Cơ sở Trường học (Tenants)
            </h1>
            <p className="mt-1 text-sm text-[#545f73]">
              Quản lý vòng đời các trường học trên nền tảng EDUX: khởi tạo tenant, bàn giao School Admin và điều khiển trạng thái vận hành.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCreateTenant}
              className="inline-flex items-center gap-2 rounded-xl bg-[#f27024] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-[#d95c14] transition"
            >
              <PlusCircle className="h-4 w-4" />
              Tạo Tenant trường mới
            </button>
            <button
              onClick={() => loadSchools(pagination.page)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#545f73] shadow-xs hover:bg-[#fff8f5] hover:text-[#f27024] transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#f27024]" : ""}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <EduxAlert
            type="success"
            message={successMsg}
            onClose={() => setSuccessMsg("")}
          />
        )}

        {error && (
          <EduxAlert
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {/* Note banner */}
        <div className="flex items-start gap-2.5 rounded-xl border border-[#ffdbcc] bg-[#fff8f5] p-3.5 text-xs text-[#1f1b17]">
          <Info className="h-4 w-4 shrink-0 text-[#f27024] mt-0.5" />
          <span>
            <strong>Quy chuẩn bảo mật Multi-Tenant:</strong> Manager không được chỉnh sửa tên/logo trường hoặc xem dữ liệu học vụ riêng tư. Tên và hồ sơ trường do School Admin tự thiết lập trong luồng Onboarding hoặc School Settings.
          </span>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8c7166]" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên trường, mã trường, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#f5ebe1] bg-white pl-10 pr-4 py-2.5 text-sm shadow-xs focus:border-[#f27024] focus:ring-1 focus:ring-[#f27024] text-[#1f1b17] placeholder-[#8c7166]"
            />
          </form>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2.5 text-sm shadow-xs font-medium text-[#545f73] focus:border-[#f27024]"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="active">Hoạt động (Active)</option>
                <option value="pending_setup">Chờ thiết lập (Pending Setup)</option>
                <option value="locked">Bị khóa (Locked)</option>
                <option value="suspended">Đình chỉ (Suspended)</option>
                <option value="deleted">Đã xóa mềm (Deleted)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Schools Table */}
        <div className="rounded-2xl border border-[#f5ebe1] bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fff8f5] text-xs font-bold text-[#8c7166] uppercase tracking-wider border-b border-[#f5ebe1]">
                <tr>
                  <th className="py-3 px-4">Trường học</th>
                  <th className="py-3 px-4">Mã Tenant</th>
                  <th className="py-3 px-4">Nguồn đăng ký</th>
                  <th className="py-3 px-4">Gói dịch vụ</th>
                  <th className="py-3 px-4">Thành viên</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác Vận hành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5ebe1] text-[#1f1b17]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#8c7166]">
                      Đang tải danh sách trường...
                    </td>
                  </tr>
                ) : schools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-[#8c7166]">
                      Không tìm thấy trường nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  schools.map((school) => {
                    const isSelfRegistered = school.provisioning_source === "self_registered";
                    return (
                      <tr key={school.id} className="hover:bg-[#fff8f5] transition-colors">
                        {/* Name & Display */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffdbcc] text-[#a04100] font-bold text-sm">
                              {(school.name?.[0] || school.code?.[0] || "T").toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-[#1f1b17] leading-tight">
                                {school.name || <span className="italic text-[#8c7166]">Chưa đặt tên</span>}
                              </p>
                              {school.display_name && school.display_name !== school.name && (
                                <p className="text-xs text-[#545f73] mt-0.5">{school.display_name}</p>
                              )}
                              <p className="text-[11px] text-[#8c7166] mt-0.5">
                                Tạo: {new Date(school.created_at).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#1f1b17]">
                          {school.code}
                        </td>

                        {/* Source */}
                        <td className="py-3.5 px-4">
                          {isSelfRegistered ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                              Tự đăng ký
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-[#fff8f5] border border-[#ffdbcc] px-2.5 py-0.5 text-xs font-semibold text-[#f27024]">
                              Manager khởi tạo
                            </span>
                          )}
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-medium text-[#1f1b17]">
                              {school.plan_name || <span className="text-[#8c7166]">Chưa kích hoạt</span>}
                            </span>
                            {school.subscription_end_date && (
                              <p className="text-[11px] text-[#545f73] mt-0.5">
                                Hết hạn: {new Date(school.subscription_end_date).toLocaleDateString("vi-VN")}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Members */}
                        <td className="py-3.5 px-4 text-xs text-[#545f73]">
                          <div><strong>{school.total_members ?? 0}</strong> thành viên</div>
                          <div className="text-[11px] text-[#8c7166] mt-0.5">
                            {school.admin_count ?? 0} admin • {school.lecturer_count ?? 0} gv • {school.student_count ?? 0} sv
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
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
                        </td>

                        {/* Operational Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Invite School Admin */}
                            <button
                              onClick={() => {
                                setInviteModal({
                                  open: true,
                                  schoolId: school.id,
                                  schoolName: school.name || school.code,
                                  schoolCode: school.code,
                                });
                                setInviteResult(null);
                                setInviteEmail("");
                              }}
                              className="rounded-lg p-1.5 text-[#f27024] hover:bg-[#fff8f5] transition"
                              title="Mời School Admin"
                            >
                              <Mail className="h-4 w-4" />
                            </button>

                            {/* Lock / Unlock */}
                            {school.status === "locked" ? (
                              <button
                                onClick={() =>
                                  setStatusModal({
                                    open: true,
                                    schoolId: school.id,
                                    action: "unlock",
                                    schoolName: school.name || school.code,
                                    reason: "",
                                  })
                                }
                                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition"
                                title="Mở khóa trường"
                              >
                                <Unlock className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setStatusModal({
                                    open: true,
                                    schoolId: school.id,
                                    action: "lock",
                                    schoolName: school.name || school.code,
                                    reason: "",
                                  })
                                }
                                className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 transition"
                                title="Khóa trường tạm thời"
                              >
                                <Lock className="h-4 w-4" />
                              </button>
                            )}

                            {/* Suspend / Restore */}
                            {school.status === "suspended" ? (
                              <button
                                onClick={() =>
                                  setStatusModal({
                                    open: true,
                                    schoolId: school.id,
                                    action: "restore",
                                    schoolName: school.name || school.code,
                                    reason: "",
                                  })
                                }
                                className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50 transition"
                                title="Khôi phục trường sau đình chỉ"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  setStatusModal({
                                    open: true,
                                    schoolId: school.id,
                                    action: "suspend",
                                    schoolName: school.name || school.code,
                                    reason: "",
                                  })
                                }
                                className="rounded-lg p-1.5 text-purple-600 hover:bg-purple-50 transition"
                                title="Đình chỉ trường"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </button>
                            )}

                            {/* Soft Delete */}
                            <button
                              onClick={() =>
                                setStatusModal({
                                  open: true,
                                  schoolId: school.id,
                                  action: "delete",
                                  schoolName: school.name || school.code,
                                  reason: "",
                                })
                              }
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
                              title="Xóa mềm trường"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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
                Hiển thị trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} trường)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => loadSchools(pagination.page - 1)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadSchools(pagination.page + 1)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Invite School Admin */}
        {inviteModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#f5ebe1]">
              <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-3">
                <h3 className="text-base font-bold text-[#1f1b17]">
                  Mời School Admin: {inviteModal.schoolName}
                </h3>
                <button
                  onClick={() => setInviteModal({ open: false, schoolId: null, schoolName: "", schoolCode: "" })}
                  className="rounded-lg p-1 text-[#8c7166] hover:bg-[#fff8f5]"
                >
                  &times;
                </button>
              </div>

              {inviteResult ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-800">
                    <p className="font-semibold">Đã tạo liên kết bàn giao thành công!</p>
                    <p className="text-xs mt-1">Gửi liên kết onboarding cho đại diện trường:</p>
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
                    onClick={() => setInviteModal({ open: false, schoolId: null, schoolName: "", schoolCode: "" })}
                    className="w-full mt-2 rounded-lg border border-[#f5ebe1] bg-white py-2 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5]"
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendInvite} className="mt-4 space-y-4">
                  <p className="text-xs text-[#545f73]">
                    Nhập email đại diện trường. Hệ thống sẽ sinh liên kết bàn giao để School Admin tự hoàn thiện tên, logo, thông tin trường và đặt mật khẩu đăng nhập.
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
                      onClick={() => setInviteModal({ open: false, schoolId: null, schoolName: "", schoolCode: "" })}
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

        {/* Modal: Status Action (Lock, Unlock, Suspend, Restore, Delete) */}
        {statusModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#f5ebe1]">
              <h3 className="text-base font-bold text-[#1f1b17]">
                {statusModal.action === "lock" && "Khóa trường tạm thời"}
                {statusModal.action === "unlock" && "Mở khóa trường"}
                {statusModal.action === "suspend" && "Đình chỉ hoạt động trường"}
                {statusModal.action === "restore" && "Khôi phục trường"}
                {statusModal.action === "delete" && "Xác nhận xóa mềm trường"}
              </h3>
              <p className="mt-1 text-xs text-[#545f73]">
                Trường: <strong>{statusModal.schoolName}</strong>
              </p>

              {(statusModal.action === "lock" || statusModal.action === "suspend") && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-[#1f1b17] mb-1">
                    Lý do thao tác (bắt buộc)
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Nhập lý do khóa hoặc đình chỉ..."
                    value={statusModal.reason}
                    onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
                    className="w-full rounded-lg border border-[#f5ebe1] bg-white p-2.5 text-xs text-[#1f1b17] focus:border-[#f27024] focus:ring-1 focus:ring-[#f27024]"
                  />
                </div>
              )}

              {statusModal.action === "delete" && (
                <div className="mt-4 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-xs text-rose-800">
                  <p className="font-semibold">Cảnh báo:</p>
                  <p className="mt-1">
                    Hành động này sẽ đánh dấu xóa mềm trường. Toàn bộ lịch sử học vụ và hợp đồng vẫn được lưu trữ để phục vụ đối soát.
                  </p>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStatusModal({ open: false, schoolId: null, action: null, schoolName: "", reason: "" })}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-2 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5]"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={processingStatus || ((statusModal.action === "lock" || statusModal.action === "suspend") && !statusModal.reason.trim())}
                  onClick={handleStatusAction}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs disabled:opacity-50 transition ${
                    statusModal.action === "delete"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-[#f27024] hover:bg-[#d95c14]"
                  }`}
                >
                  {processingStatus ? "Đang xử lý…" : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
