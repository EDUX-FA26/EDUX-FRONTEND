import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  X,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Lock,
  Unlock,
  MoreVertical,
  CheckCircle2,
  BadgeCheck
} from "lucide-react";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  suspendAdminUser,
  activateAdminUser,
} from "../../services/adminService";

const INITIAL_FORM = {
  email: "",
  username: "",
  password: "",
  role: "student",
  full_name: "",
  student_code: "",
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRoleTab, setActiveRoleTab] = useState("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminUsers();
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreateModal = () => {
    setModalMode("create");
    setFormData(INITIAL_FORM);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode("edit");
    setSelectedUser(user);
    setFormData({
      email: user.email || "",
      username: user.username || "",
      password: "",
      role: user.role || "student",
      full_name: user.full_name || "",
      student_code: user.student_code || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      if (modalMode === "create") {
        const res = await createAdminUser(formData);
        if (res.success) {
          setUsers((prev) => [res.data, ...prev]);
          closeModal();
        }
      } else {
        const payload = { ...formData };
        delete payload.password;
        delete payload.username; // Cannot update username typically

        const res = await updateAdminUser(selectedUser.id, payload);
        if (res.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === selectedUser.id ? res.data : u))
          );
          closeModal();
        }
      }
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && serverErrors.length > 0) {
        setFormError(serverErrors.map((e) => e.message).join(", "));
      } else {
        setFormError(err.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      if (user.is_active) {
        if (!window.confirm(`Khóa tài khoản "${user.full_name}"?`)) return;
        await suspendAdminUser(user.id);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: false } : u)));
      } else {
        await activateAdminUser(user.id);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: true } : u)));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Không thể thay đổi trạng thái");
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.student_code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeRoleTab === "all" || u.role === activeRoleTab;
    
    return matchesSearch && matchesTab;
  });

  const getRoleBadge = (role) => {
    switch(role) {
      case "admin": return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold"><ShieldCheck className="w-3 h-3"/> Admin</span>;
      case "lecturer": return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold"><BadgeCheck className="w-3 h-3"/> Giảng viên</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-500/10 text-slate-300 border border-slate-500/20 text-xs font-semibold">Học viên</span>;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
            Quản lý Người dùng
          </h1>
          <p className="text-slate-400 text-sm">Danh sách tài khoản và phân quyền trong hệ thống.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchUsers} 
            disabled={loading}
            className="p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-white/10 rounded-xl text-slate-300 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
          <button 
            onClick={openCreateModal} 
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <UserPlus className="w-5 h-5" /> Thêm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Toolbar */}
        <div className="p-6 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Tabs */}
          <div className="flex bg-slate-950/50 p-1 rounded-xl border border-white/5 w-fit">
            {["all", "student", "lecturer", "admin"].map(role => (
              <button
                key={role}
                onClick={() => setActiveRoleTab(role)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeRoleTab === role 
                  ? "bg-slate-800 text-white shadow" 
                  : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {role === "all" ? "Tất cả" : role === "student" ? "Học viên" : role === "lecturer" ? "Giảng viên" : "Admin"}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo tên, email, mã SV..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-white/10 rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-950/30 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Người dùng</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Liên hệ</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Vai trò</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-slate-500">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-indigo-400 font-bold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">{user.full_name}</div>
                          <div className="text-xs text-slate-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300">{user.email}</div>
                      {user.student_code && <div className="text-xs text-indigo-400/80 mt-0.5 font-mono">{user.student_code}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đang HĐ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-medium">
                          <Lock className="w-3.5 h-3.5" /> Đã Khóa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_active 
                            ? "bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10" 
                            : "bg-red-500/10 text-red-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                          }`}
                          title={user.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                        >
                          {user.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-white/5 bg-slate-950/30 text-xs text-slate-500 flex justify-between items-center">
           <span>Hiển thị {filteredUsers.length} người dùng</span>
        </div>
      </div>

      {/* Modern Modal (Glassmorphism) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {modalMode === "create" ? "Tạo Người dùng mới" : "Chỉnh sửa Người dùng"}
              </h2>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6">
              
              {formError && (
                <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2 items-start">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1.5">Họ và Tên <span className="text-red-400">*</span></label>
                     <input type="text" name="full_name" required value={formData.full_name} onChange={handleInputChange}
                       className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none" 
                       placeholder="Nhập họ tên" />
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1.5">Mã sinh viên/GV</label>
                     <input type="text" name="student_code" value={formData.student_code} onChange={handleInputChange}
                       className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none" 
                       placeholder="VD: SE12345" />
                   </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email <span className="text-red-400">*</span></label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none" 
                    placeholder="email@art-ai.edu.vn" />
                </div>

                {modalMode === "create" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Tên đăng nhập (Tùy chọn)</label>
                      <input type="text" name="username" value={formData.username} onChange={handleInputChange}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none" 
                        placeholder="username" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Mật khẩu <span className="text-red-400">*</span></label>
                      <input type="password" name="password" required value={formData.password} onChange={handleInputChange}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none" 
                        placeholder="Mật khẩu" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Vai trò <span className="text-red-400">*</span></label>
                  <select name="role" value={formData.role} onChange={handleInputChange}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none appearance-none"
                  >
                    <option value="student">Học viên (Student)</option>
                    <option value="lecturer">Giảng viên (Lecturer)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition disabled:opacity-50">
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {modalMode === "create" ? "Tạo Người dùng" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
