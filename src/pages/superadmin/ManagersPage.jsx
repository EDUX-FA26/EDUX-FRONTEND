import React, { useEffect, useState, useCallback } from "react";
import SuperadminLayout from "../../components/platform/SuperadminLayout";
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b17]">Quản lý Manager Nền tảng</h1>
            <p className="mt-1 text-sm text-[#545f73]">
              Phân quyền và quản lý danh sách tài khoản Manager (quản trị viên vận hành các trường học).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#f27024] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-[#d95c14] transition"
          >
            <Plus className="h-4 w-4" />
            Tạo Manager mới
          </button>
        </div>

        {/* Alerts */}
        {message.text && (
          <div
            className={`rounded-xl p-4 text-sm flex items-center justify-between ${
              message.type === "success"
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

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8c7166]">Tổng số Manager</p>
                <p className="mt-2 text-3xl font-extrabold text-[#1f1b17]">{pagination.total || managers.length}</p>
              </div>
              <div className="rounded-xl bg-[#fff8f5] p-3 text-[#f27024]">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8c7166]">Đang hoạt động</p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-600">{activeCount}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8c7166]">Đã tạm khóa</p>
                <p className="mt-2 text-3xl font-extrabold text-[#8c7166]">{inactiveCount}</p>
              </div>
              <div className="rounded-xl bg-[#fcf2eb] p-3 text-[#8c7166]">
                <UserX className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#f5ebe1] bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7166]" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, email hoặc username…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#f5ebe1] bg-white pl-10 pr-4 py-2 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
            />
          </form>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-[#f5ebe1] bg-white px-3 py-2 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang hoạt động</option>
              <option value="false">Đã tạm khóa</option>
            </select>

            <button
              type="button"
              onClick={() => loadData(pagination.page)}
              className="rounded-xl border border-[#f5ebe1] bg-white p-2 text-[#545f73] hover:bg-[#fff8f5] hover:text-[#f27024] transition"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#f27024]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Managers Table */}
        <div className="overflow-hidden rounded-2xl border border-[#f5ebe1] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#f5ebe1] bg-[#fff8f5] text-xs font-bold uppercase tracking-wider text-[#8c7166]">
                <tr>
                  <th className="px-6 py-4">Manager</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-full bg-[#ffdbcc] text-[#a04100] flex items-center justify-center font-bold text-sm">
                            {(m.full_name || m.username || "M")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1f1b17]">{m.full_name || m.username}</p>
                            <p className="text-xs text-[#545f73]">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-[#1f1b17]">{m.username}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#fff8f5] border border-[#ffdbcc] px-2 py-1 text-xs font-semibold text-[#f27024]">
                          <Shield className="h-3 w-3" />
                          Platform Manager
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {m.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fcf2eb] px-2.5 py-1 text-xs font-semibold text-[#8c7166]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#8c7166]" />
                            Đã khóa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#545f73]">
                        {m.created_at ? new Date(m.created_at).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingManager(m);
                              setEditForm({ fullName: m.full_name || "", username: m.username || "", password: "" });
                            }}
                            className="rounded-lg p-1.5 text-[#545f73] hover:bg-[#fff8f5] hover:text-[#f27024] transition"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(m)}
                            className={`rounded-lg p-1.5 transition ${
                              m.is_active
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
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
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
            <div className="flex items-center justify-between border-t border-[#f5ebe1] bg-[#fff8f5] px-6 py-3 text-xs text-[#545f73]">
              <p>
                Hiển thị trang <strong>{pagination.page}</strong> / <strong>{pagination.totalPages}</strong> (Tổng cộng {pagination.total} Manager)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => loadData(pagination.page - 1)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 font-medium text-[#1f1b17] hover:bg-[#fff8f5] disabled:opacity-40"
                >
                  ← Trước
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadData(pagination.page + 1)}
                  className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-1.5 font-medium text-[#1f1b17] hover:bg-[#fff8f5] disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tạo Manager mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-[#f5ebe1]">
            <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-4">
              <h2 className="text-lg font-bold text-[#1f1b17]">Tạo tài khoản Manager mới</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-[#8c7166] hover:bg-[#fff8f5] hover:text-[#1f1b17]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1f1b17]">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f1b17]">Email đăng nhập</label>
                <input
                  type="email"
                  required
                  placeholder="manager@fpt.edu.vn"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f1b17]">Username</label>
                <input
                  type="text"
                  required
                  placeholder="manager_an"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#1f1b17]">Mật khẩu khởi tạo</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="flex items-center gap-1 text-xs text-[#f27024] hover:underline font-semibold"
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
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 font-mono text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#f5ebe1] pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-[#f5ebe1] bg-white px-4 py-2 text-sm font-semibold text-[#545f73] hover:bg-[#fff8f5]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="rounded-xl bg-[#f27024] px-5 py-2 text-sm font-semibold text-white hover:bg-[#d95c14] disabled:opacity-50 transition"
                >
                  {createSubmitting ? "Đang tạo…" : "Xác nhận tạo Manager"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chỉnh sửa Manager */}
      {editingManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-[#f5ebe1]">
            <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-4">
              <h2 className="text-lg font-bold text-[#1f1b17]">Chỉnh sửa thông tin Manager</h2>
              <button
                type="button"
                onClick={() => setEditingManager(null)}
                className="rounded-lg p-1 text-[#8c7166] hover:bg-[#fff8f5] hover:text-[#1f1b17]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1f1b17]">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f1b17]">Username</label>
                <input
                  type="text"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f1b17]">Mật khẩu mới (để trống nếu không đổi)</label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu mới nếu muốn đặt lại..."
                  value={editForm.password || ""}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div className="rounded-xl bg-[#fff8f5] border border-[#ffdbcc] p-3 text-xs text-[#545f73]">
                Email hiện tại: <strong>{editingManager.email}</strong>. (Theo quy định bảo mật, thay đổi email Manager yêu cầu xác thực riêng).
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#f5ebe1] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingManager(null)}
                  className="rounded-xl border border-[#f5ebe1] bg-white px-4 py-2 text-sm font-semibold text-[#545f73] hover:bg-[#fff8f5]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="rounded-xl bg-[#f27024] px-5 py-2 text-sm font-semibold text-white hover:bg-[#d95c14] disabled:opacity-50 transition"
                >
                  {editSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SuperadminLayout>
  );
}
