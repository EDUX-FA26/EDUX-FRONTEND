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
  Zap
} from "lucide-react";
import { getAdminUsers } from "../../services/adminService";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalLecturers: 0,
    totalStudents: 0
  });

  const [loading, setLoading] = useState(true);

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
              {/* Decorative Background Blob */}
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
                {!loading && (
                  <div className="flex items-center text-emerald-400 text-xs font-bold mb-1.5 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3 mr-1" /> +12%
                  </div>
                )}
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
          
          {/* Placeholder for actual chart */}
          <div className="w-full h-64 md:h-80 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center bg-slate-950/30">
             <TrendingUp className="w-10 h-10 text-slate-600 mb-3" />
             <p className="text-slate-500 font-medium text-sm">Chưa có đủ dữ liệu biểu đồ</p>
             <p className="text-slate-600 text-xs mt-1">Dữ liệu sẽ được cập nhật sau 24h</p>
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

          <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6">
             <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Trạng thái Hệ thống</h3>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      <span className="text-sm text-slate-300 font-medium">Database API</span>
                   </div>
                   <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">Online</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      <span className="text-sm text-slate-300 font-medium">AI Engine Service</span>
                   </div>
                   <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">Online</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                      <span className="text-sm text-slate-300 font-medium">Background Jobs</span>
                   </div>
                   <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md">Warning</span>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;