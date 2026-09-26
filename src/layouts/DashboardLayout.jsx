import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  LogOut, 
  ShieldCheck, 
  User, 
  ChevronRight,
  Menu,
  X,
  Bell,
  Search,
  BarChart2
} from "lucide-react";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Quản lý Người dùng", path: "/admin/users", icon: Users },
    { label: "Báo cáo & Thống kê", path: "/admin/reports", icon: BarChart2 },
    { label: "System Logs", path: "/admin/logs", icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900/50 backdrop-blur-2xl border-r border-white/5 relative z-20">
        {/* Logo */}
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              EDUX Admin
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
          <div className="px-4 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Menu Quản trị
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full" />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-indigo-400/50" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Card */}
        <div className="p-4 border-t border-white/5 bg-slate-900/30">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-white font-bold text-sm">
                {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-200 truncate">{user?.username || "Admin"}</div>
              <div className="text-xs text-indigo-400 uppercase font-mono font-semibold tracking-wide">
                {user?.role || "admin"}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 lg:px-10 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl w-64 md:w-96 focus-within:border-indigo-500/50 focus-within:bg-slate-900 transition-all">
              <Search className="w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-500 w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
            </button>
            
            {/* Mobile Profile (shows only on mobile) */}
            <div className="lg:hidden flex items-center gap-2">
               <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                  {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
               </div>
            </div>
          </div>
        </header>

        {/* Dynamic Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-96 bg-indigo-600/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 blur-[120px] pointer-events-none -z-10" />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar relative z-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute top-0 left-0 bottom-0 w-72 bg-slate-900 border-r border-white/10 flex flex-col animate-in slide-in-from-left-full duration-300">
            <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
              <div className="flex items-center gap-2 group">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-white">EDUX</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                      isActive ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            
            <div className="p-4 border-t border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors font-medium text-sm"
              >
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;