import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, KeyRound, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

const FIXED_ADMIN_CREDENTIALS = {
  identifier: "admin@art-ai.edu.vn",
  password: "Admin@123456",
};

const LoginPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Route muốn truy cập sau khi login thành công
  const from = location.state?.from?.pathname || "/admin/dashboard";
  const initialError = location.state?.error || "";

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("Vui lòng nhập đầy đủ Tên đăng nhập/Email và Mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(identifier, password);
      
      // Kiểm tra role admin
      if (res.user?.role !== "admin") {
        setError("Tài khoản này không có quyền truy cập vào Admin Dashboard (Role phải là Admin).");
        return;
      }

      // Đăng nhập thành công -> Điều hướng sang Admin Dashboard
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nạp thông tin tài khoản cố định
  const handleFillFixedAdmin = () => {
    setIdentifier(FIXED_ADMIN_CREDENTIALS.identifier);
    setPassword(FIXED_ADMIN_CREDENTIALS.password);
    setError("");
  };

  // Đăng nhập nhanh với tài khoản admin cố định
  const handleQuickLoginAdmin = async () => {
    setIdentifier(FIXED_ADMIN_CREDENTIALS.identifier);
    setPassword(FIXED_ADMIN_CREDENTIALS.password);
    setError("");
    setIsSubmitting(true);
    try {
      const res = await login(FIXED_ADMIN_CREDENTIALS.identifier, FIXED_ADMIN_CREDENTIALS.password);
      if (res.user?.role !== "admin") {
        setError("Tài khoản này không có quyền Admin.");
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Đăng nhập tài khoản cố định thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Dynamic Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />
      
      <div className="w-full max-w-md relative z-10">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600/10 border border-indigo-500/30 rounded-2xl mb-4 shadow-xl backdrop-blur-md">
            <ShieldCheck className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            EDUX Admin Portal
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Đăng nhập bằng tài khoản Quản trị viên để truy cập Dashboard
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Preset Fixed Credentials Box */}
          <div className="mb-6 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
            <div className="flex items-center justify-between font-semibold mb-2">
              <span className="flex items-center gap-1.5 text-indigo-300">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                Tài khoản Admin Cố định
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full text-[10px] font-mono">
                System Default
              </span>
            </div>
            <div className="space-y-1 font-mono text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
              <div><strong className="text-indigo-400">Email:</strong> {FIXED_ADMIN_CREDENTIALS.identifier}</div>
              <div><strong className="text-indigo-400">Mật khẩu:</strong> {FIXED_ADMIN_CREDENTIALS.password}</div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={handleFillFixedAdmin}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition border border-white/10 font-medium"
              >
                Nạp Form
              </button>
              <button
                type="button"
                onClick={handleQuickLoginAdmin}
                disabled={isSubmitting}
                className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Đăng nhập Nhanh"}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {(error || initialError) && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>{error || initialError}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Field: Identifier */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email hoặc Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@art-ai.edu.vn"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 transition outline-none"
                  required
                />
              </div>
            </div>

            {/* Field: Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 transition outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 mt-6">
          EDUX Management System &copy; {new Date().getFullYear()} — Secure Access Only
        </div>
      </div>
    </div>
  );
};

export default LoginPage;