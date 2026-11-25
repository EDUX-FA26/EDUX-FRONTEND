import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import SuperadminLayout from "../../components/platform/SuperadminLayout";
import EduxAlert from "../../components/common/EduxAlert";
import {
  getManagers,
  createManager,
  updateManager,
  setManagerStatus,
  deleteManager,
} from "../../services/platformApi";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Plus,
  Edit2,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  X,
  Shield,
  Key,
  RotateCcw,
} from "lucide-react";

export default function ManagersPage() {
  const [managers, setManagers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: "", email: "", username: "", password: "" });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editingManager, setEditingManager] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: "", username: "", password: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await getManagers({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter !== "" ? statusFilter : undefined,
      });

      if (res.data?.items) {
        setManagers(res.data.items);
        setPagination(res.data.pagination);
      } else if (Array.isArray(res.data)) {
        // Fallback for flat array
        const list = res.data.filter((item) => item.role === "manager");
        setManagers(list);
        setPagination({ page: 1, limit: list.length, total: list.length, totalPages: 1 });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Không thể tải danh sách Manager." });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData(1);
  };

  const handleClearFilter = () => {
    if (search || statusFilter) {
      setSearch("");
      setStatusFilter("");
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      await createManager(createForm);
      setShowCreateModal(false);
      setCreateForm({ fullName: "", email: "", username: "", password: "" });
      setMessage({ type: "success", text: "Đã tạo tài khoản Manager thành công!" });
      loadData(pagination.page);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi tạo Manager." });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingManager) return;
    setEditSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      await updateManager(editingManager.id, editForm);
      setEditingManager(null);
      setMessage({ type: "success", text: "Đã cập nhật thông tin Manager!" });
      loadData(pagination.page);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi cập nhật Manager." });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleStatus = async (manager) => {
    const nextStatus = !manager.is_active;
    const actionLabel = nextStatus ? "mở khóa" : "tạm khóa";
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionLabel} tài khoản Manager ${manager.username}?`)) return;

    try {
      await setManagerStatus(manager.id, nextStatus);
      setMessage({ type: "success", text: `Đã ${actionLabel} tài khoản Manager.` });
      loadData(pagination.page);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi đổi trạng thái." });
    }
  };

  const handleDelete = async (manager) => {
    if (!window.confirm(`Bạn có chắc muốn vô hiệu hóa Manager ${manager.username}? Tài khoản này sẽ không thể truy cập hệ thống nữa.`)) return;

    try {
      await deleteManager(manager.id);
      setMessage({ type: "success", text: "Đã vô hiệu hóa tài khoản Manager thành công." });
      loadData(pagination.page);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi vô hiệu hóa Manager." });
    }
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm((prev) => ({ ...prev, password: pass }));
  };

  // Metrics
  const activeCount = managers.filter((m) => m.is_active).length;
  const inactiveCount = managers.filter((m) => !m.is_active).length;

  return (
    <SuperadminLayout>
      <div className="w-full max-w-[1600px] mx-auto min-w-0 h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-4 sm:px-5 lg:px-6 xl:px-8 pt-4 pb-4 box-border animate-fade-in">
        {/* Header */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Quản lý Manager Nền tảng
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Phân quyền và quản lý danh sách tài khoản Manager (quản trị viên vận hành các trường học).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#f27024] px-3.5 h-9 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-[#d95c14] transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tạo Manager mới
          </button>
        </div>

        {/* Alerts */}
        {message.text && (
          <div className="shrink-0 mb-3">
            <EduxAlert
              type={message.type === "success" ? "success" : "error"}
              title={message.type === "success" ? "Thành công" : "Thông báo lỗi"}
              message={message.text}
              onClose={() => setMessage({ type: "", text: "" })}
            />
          </div>
        )}

        {/* 3 KPI Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 shrink-0 mb-3">
          <div className="py-2.5 px-4 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tổng số Manager</p>
              <p className="mt-0.5 text-xl font-bold text-slate-900">{pagination.total || managers.length}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#fff8f5] text-[#f27024] flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="py-2.5 px-4 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Đang hoạt động</p>
              <p className="mt-0.5 text-xl font-bold text-emerald-600">{activeCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="py-2.5 px-4 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Đã tạm khóa</p>
              <p className="mt-0.5 text-xl font-bold text-slate-500">{inactiveCount}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
              <UserX className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar (Direct 1 row without thick wrapper) */}
        <div className="shrink-0 flex flex-wrap items-center gap-2.5 mb-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[180px] sm:min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email hoặc username…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs shadow-xs focus:border-[#f27024] focus:outline-none focus:ring-1 focus:ring-[#f27024] text-slate-800 placeholder-slate-400"
            />
          </form>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 w-44 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-xs focus:border-[#f27024] focus:outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Đã tạm khóa</option>
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

          <button
            type="button"
            onClick={() => loadData(pagination.page)}
            className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 shadow-xs transition cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#f27024]" : ""}`} />
          </button>
        </div>

        {/* Managers Table Card */}
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-xs">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#fff8f5] z-10 text-xs font-bold uppercase tracking-wider text-[#8c7166] border-b border-[#f5ebe1]">
                <tr>
                  <th className="px-6 py-3.5">Manager</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Username</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Vai trò</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Trạng thái</th>
                  <th className="px-6 py-3.5 whitespace-nowrap">Ngày tạo</th>
                  <th className="px-6 py-3.5 text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5ebe1]">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-[#545f73]">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#f27024] mb-2" />
                      Đang tải danh sách Manager…
                    </td>
                  </tr>
                ) : managers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-[#8c7166]">
                      Không tìm thấy Manager nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  managers.map((m) => (
                    <tr key={m.id} className="hover:bg-[#fff8f5] transition">
                      <td className="px-6 py-3.5 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-full bg-[#ffdbcc] text-[#a04100] flex items-center justify-center font-bold text-sm">
                            {(m.full_name || m.username || "M")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1f1b17] truncate max-w-[180px] sm:max-w-[220px]">{m.full_name || m.username}</p>
                            <p className="text-xs text-[#545f73] truncate max-w-[180px] sm:max-w-[220px]">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-[#1f1b17] whitespace-nowrap">{m.username}</td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#fff8f5] border border-[#ffdbcc] px-2 py-0.5 text-xs font-semibold text-[#f27024]">
                          <Shield className="h-3 w-3" />
                          Platform Manager
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {m.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fcf2eb] px-2.5 py-0.5 text-xs font-semibold text-[#8c7166]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#8c7166]" />
                            Đã khóa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[#545f73] whitespace-nowrap">
                        {m.created_at ? new Date(m.created_at).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingManager(m);
                              setEditForm({ fullName: m.full_name || "", username: m.username || "", password: "" });
                            }}
                            className="rounded-lg p-1.5 text-[#545f73] hover:bg-[#fff8f5] hover:text-[#f27024] transition cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(m)}
                            className={`rounded-lg p-1.5 transition cursor-pointer ${m.is_active
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                              }`}
                            title={m.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          >
                            {m.is_active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(m)}
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                            title="Vô hiệu hóa Manager"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
            <div className="shrink-0 flex items-center justify-between border-t border-[#f5ebe1] bg-[#fff8f5] px-6 py-2.5 text-xs text-[#545f73]">
              <p>
                Hiển thị trang <strong>{pagination.page}</strong> / <strong>{pagination.totalPages}</strong> (Tổng cộng {pagination.total} Manager)
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => loadData(pagination.page - 1)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 font-medium text-[#1f1b17] hover:bg-[#fff8f5] disabled:opacity-40 cursor-pointer"
                >
                  ← Trước
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadData(pagination.page + 1)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 font-medium text-[#1f1b17] hover:bg-[#fff8f5] disabled:opacity-40 cursor-pointer"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tạo Manager mới */}
      {showCreateModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Tạo tài khoản Manager mới</h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 focus:border-[#f27024] focus:outline-none focus:ring-1 focus:ring-[#f27024]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email đăng nhập</label>
                  <input
                    type="email"
                    required
                    placeholder="manager@fpt.edu.vn"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 focus:border-[#f27024] focus:outline-none focus:ring-1 focus:ring-[#f27024]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="manager_an"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 focus:border-[#f27024] focus:outline-none focus:ring-1 focus:ring-[#f27024]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Mật khẩu khởi tạo</label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="flex items-center gap-1 text-xs text-[#f27024] hover:underline font-semibold cursor-pointer"
                    >
                      <Key className="h-3 w-3" />
                      Tạo ngẫu nhiên
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    minLength={6}
                    placeholder="Tối thiểu 6 ký tự"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-xs text-slate-900 focus:border-[#f27024] focus:outline-none focus:ring-1 focus:ring-[#f27024]"
                  />
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3.5">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 h-9 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="rounded-xl bg-[#f27024] px-4.5 h-9 text-xs font-semibold text-white hover:bg-[#d95c14] disabled:opacity-50 transition cursor-pointer"
                  >
                    {createSubmitting ? "Đang tạo…" : "Xác nhận tạo Manager"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal: Chỉnh sửa Manager */}
      {editingManager &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Chỉnh sửa thông tin Manager</h2>
                <button
                  type="button"
                  onClick={() => setEditingManager(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 focus:border-[#f27024] focus:outline-none focus:ring-1 focus:ring-[#f27024]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 focus:border-[#f27024] focus:outline-none focus:ring-1 focus:ring-[#f27024]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mật khẩu mới (để trống nếu không đổi)
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới nếu muốn đặt lại..."
                    value={editForm.password || ""}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 focus:border-[#f27024] focus:outline-none focus:ring-1 focus:ring-[#f27024]"
                  />
                </div>

                <div className="rounded-xl bg-[#fff8f5] border border-[#ffdbcc] p-3 text-xs text-slate-600">
                  Email hiện tại: <strong>{editingManager.email}</strong>. (Theo quy định bảo mật, thay đổi email Manager yêu cầu xác thực riêng).
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3.5">
                  <button
                    type="button"
                    onClick={() => setEditingManager(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 h-9 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="rounded-xl bg-[#f27024] px-4.5 h-9 text-xs font-semibold text-white hover:bg-[#d95c14] disabled:opacity-50 transition cursor-pointer"
                  >
                    {editSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
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
