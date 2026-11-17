import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { firstLoginChangePassword } from "../../services/auth.service";

export default function FirstLoginChangePasswordPage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại (khởi tạo: 123456).");
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("Mật khẩu mới không được trùng với mật khẩu khởi tạo tạm thời.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await firstLoginChangePassword(currentPassword, newPassword, confirmPassword);
      setSuccess(true);

      // Update user in context so must_change_password becomes false
      if (updateUser) {
        updateUser({
          ...(user || {}),
          ...(res.user || {}),
          must_change_password: false,
        });
      }

      // Automatically navigate to school setup after 1.5s
      setTimeout(() => {
        navigate("/admin/school-setup", { replace: true });
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-800">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Header icon */}
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <p className="text-xs font-bold uppercase tracking-wider text-orange-600">EDUX SECURITY</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Đổi mật khẩu lần đầu</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Tài khoản quản trị của bạn vừa được cấp với mật khẩu khởi tạo tạm thời (<strong>123456</strong>).
          Vui lòng thiết lập mật khẩu mới an toàn trước khi tiếp tục cấu hình trường học.
        </p>

        {success ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200 text-emerald-700">
              ✓
            </div>
            <h2 className="mt-3 text-lg font-bold text-emerald-800">Đổi mật khẩu thành công!</h2>
            <p className="mt-1 text-sm text-emerald-700">
              Đang chuyển hướng đến bước thiết lập trường học...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Mật khẩu hiện tại (khởi tạo: 123456)
              </label>
              <div className="relative mt-1">
                <input
                  required
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập 123456"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Mật khẩu mới (tối thiểu 6 ký tự)
              </label>
              <div className="relative mt-1">
                <input
                  required
                  minLength={6}
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  {showNew ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Xác nhận lại mật khẩu mới (xác nhận 2 lần)
              </label>
              <div className="relative mt-1">
                <input
                  required
                  minLength={6}
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới một lần nữa"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="mt-6 w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Đang cập nhật mật khẩu..." : "Xác nhận và tiếp tục"}
            </button>
          </form>
        )}

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <button
            onClick={logout}
            className="text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            Đăng xuất khỏi tài khoản
          </button>
        </div>
      </div>
    </main>
  );
}
