import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  BookOpen, 
  ShieldCheck, 
  Activity, 
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
  BellRing,
  X,
  Send,
  AlertCircle,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { getAdminUsers, broadcastNotification } from "../../services/adminService";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalLecturers: 0,
    totalStudents: 0
  });
  const [loading, setLoading] = useState(true);

  // Broadcast Modal states
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "", target: "all" });
  const [broadcastState, setBroadcastState] = useState({ loading: false, error: null, success: null });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await getAdminUsers();
        if (res.success && res.data) {
          const usersList = res.data;
          setStats({
            totalUsers: usersList.length,
            activeUsers: usersList.filter(u => u.is_active).length,
            totalLecturers: usersList.filter(u => u.role === "lecturer").length,
            totalStudents: usersList.filter(u => u.role === "student").length
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleBroadcastChange = (e) => {
    const { name, value } = e.target;
    setBroadcastForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBroadcastState({ loading: true, error: null, success: null });
    try {
      const res = await broadcastNotification(broadcastForm);
      if (res.success) {
        setBroadcastState({ loading: false, error: null, success: res.message });
        setBroadcastForm({ title: "", message: "", target: "all" });
        setTimeout(() => {
          setIsBroadcastOpen(false);
          setBroadcastState({ loading: false, error: null, success: null });
        }, 2000);
      }
    } catch (err) {
      setBroadcastState({ 
        loading: false, 
        error: err.response?.data?.message || "Lỗi khi gửi thông báo", 
        success: null 
      });
    }
  };

  const cards = [
    { title: "Tổng Người dùng", value: stats.totalUsers, icon: Users, color: "from-blue-500 to-cyan-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { title: "Tổng Giảng viên", value: stats.totalLecturers, icon: Award, color: "from-purple-500 to-pink-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { title: "Tổng Học viên", value: stats.totalStudents, icon: BookOpen, color: "from-amber-400 to-orange-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { title: "Hoạt động Tốt", value: stats.activeUsers, icon: Zap, color: "from-emerald-400 to-teal-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
  ];

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      
      {/* Welcome Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-slate-400 mb-2">
          Tổng quan Hệ thống
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          Theo dõi các chỉ số quan trọng và hoạt động gần đây của nền tảng EDUX.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`relative overflow-hidden bg-slate-900/50 backdrop-blur-sm border ${card.border} rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group`}
            >
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${card.bg} blur-2xl group-hover:blur-3xl transition-all duration-500`} />
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="text-slate-400 font-medium text-sm">{card.title}</div>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <div className="relative z-10 flex items-end gap-3">
                <div className="text-4xl font-black text-white tracking-tight">
                  {loading ? "..." : card.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart / Activity Area */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6 xl:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Biểu đồ Truy cập
            </h2>
            <select className="bg-slate-950/50 border border-white/10 text-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 transition-colors">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
            </select>
          </div>
          
          <div className="w-full h-64 md:h-80 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center bg-slate-950/30">
             <TrendingUp className="w-10 h-10 text-slate-600 mb-3" />
             <p className="text-slate-500 font-medium text-sm">Chưa có đủ dữ liệu biểu đồ</p>
          </div>
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-indigo-500/20 group cursor-pointer">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            <ShieldCheck className="w-10 h-10 text-white/90 mb-4 relative z-10" />
            <h3 className="text-xl font-bold text-white mb-2 relative z-10">Quản lý Tài khoản</h3>
            <p className="text-indigo-100 text-sm mb-6 relative z-10 opacity-90">
              Thêm, sửa, hoặc tạm khóa các tài khoản người dùng một cách nhanh chóng.
            </p>
            <Link to="/admin/users" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white text-sm font-semibold transition-all relative z-10 border border-white/20">
              Đến trang Quản lý <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div 
            onClick={() => setIsBroadcastOpen(true)}
            className="bg-gradient-to-br from-rose-500 to-orange-600 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-rose-500/20 group cursor-pointer hover:shadow-rose-500/40 transition-all"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <BellRing className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Gửi Thông Báo</h3>
                <p className="text-rose-100 text-xs">Broadcast tin nhắn tới toàn bộ hệ thống</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsBroadcastOpen(false)} />
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BellRing className="w-5 h-5 text-orange-400" /> Phát thông báo (Broadcast)
              </h2>
              <button onClick={() => setIsBroadcastOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="p-6">
              {broadcastState.error && (
                <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2 items-start">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{broadcastState.error}</span>
                </div>
              )}
              {broadcastState.success && (
                <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex gap-2 items-start">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{broadcastState.success}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Đối tượng nhận <span className="text-red-400">*</span></label>
                  <select name="target" value={broadcastForm.target} onChange={handleBroadcastChange} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500 outline-none">
                    <option value="all">Tất cả (Học viên & Giảng viên)</option>
                    <option value="student">Chỉ Học viên</option>
                    <option value="lecturer">Chỉ Giảng viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Tiêu đề thông báo <span className="text-red-400">*</span></label>
                  <input type="text" name="title" required value={broadcastForm.title} onChange={handleBroadcastChange} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500 outline-none" placeholder="VD: Bảo trì hệ thống" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Nội dung <span className="text-red-400">*</span></label>
                  <textarea name="message" required value={broadcastForm.message} onChange={handleBroadcastChange} rows={4} className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-orange-500 outline-none resize-none" placeholder="VD: EDUTRACK sẽ bảo trì từ 23:00 đến 01:00..." />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsBroadcastOpen(false)} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition">
                  Hủy
                </button>
                <button type="submit" disabled={broadcastState.loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-white text-sm font-semibold shadow-lg shadow-orange-500/20 transition disabled:opacity-50">
                  {broadcastState.loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Phát thông báo ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboardPage;