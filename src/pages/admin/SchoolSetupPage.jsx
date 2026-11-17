import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSchool } from "../../contexts/SchoolContext";
import { completeSchoolSetup, getSchoolSettings } from "../../services/schoolApi";

export default function SchoolSetupPage() {
  const navigate = useNavigate();
  const { currentSchool, refreshSchools } = useSchool();

  const [form, setForm] = useState({
    name: currentSchool?.name || "",
    display_name: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    logo_url: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getSchoolSettings()
      .then((res) => {
        if (!active || !res.data) return;
        setForm((prev) => ({
          ...prev,
          name: res.data.name || prev.name,
          display_name: res.data.display_name || prev.display_name || res.data.name || "",
          address: res.data.address || "",
          contact_email: res.data.contact_email || "",
          contact_phone: res.data.contact_phone || "",
          website: res.data.website || "",
          logo_url: res.data.logo_url || "",
          description: res.data.description || "",
        }));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      sessionStorage.setItem("edux:setup_skipped", "true");
      await completeSchoolSetup({
        ...form,
        name: form.name.trim() || currentSchool?.name || "Trường học",
      });
      if (typeof refreshSchools === "function") {
        refreshSchools();
      }
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Không thể lưu thông tin trường học. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Skip optional profile completion and proceed straight to Admin Dashboard
    sessionStorage.setItem("edux:setup_skipped", "true");
    try {
      await completeSchoolSetup({
        name: form.name.trim() || currentSchool?.name || "Trường học",
      });
      if (typeof refreshSchools === "function") {
        refreshSchools();
      }
    } catch (_) {
      // Ignore background completion error on skip
    }
    navigate("/admin/dashboard", { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-800">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600">EDUX ONBOARDING</p>
            <h1 className="text-2xl font-bold text-slate-900">Hoàn thiện hồ sơ trường học</h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Chúc mừng bạn đã kích hoạt tài khoản School Admin! Bạn có thể bổ sung thông tin hiển thị của trường bên dưới hoặc chọn bỏ qua để cập nhật sau trong phần <strong>Cài đặt trường học</strong>.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Tên trường học *
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Đại học FPT Đà Nẵng"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Tên viết tắt / Tên hiển thị
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Ví dụ: FPT University"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                placeholder="028 1234 5678"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Email liên hệ
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="contact@school.edu.vn"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Website
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://school.edu.vn"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Địa chỉ trường
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Khu đô thị FPT City, Ngũ Hành Sơn, Đà Nẵng"
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Logo trường (URL ảnh)
              </label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
                {form.logo_url && (
                  <div className="h-10 w-10 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={form.logo_url}
                      alt="Logo preview"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Mô tả trường học
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Giới thiệu ngắn về lịch sử và định hướng của trường..."
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleSkip}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Bỏ qua, cập nhật sau
            </button>

            <button
              disabled={loading}
              type="submit"
              className="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Lưu và tiếp tục"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
