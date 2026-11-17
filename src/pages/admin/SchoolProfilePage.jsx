import React, { useEffect, useState } from "react";
import { useSchool } from "../../contexts/SchoolContext";
import { getSchoolSettings, updateSchoolSettings } from "../../services/schoolApi";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  Layers,
  Sparkles,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Calendar,
  HardDrive,
  Users
} from "lucide-react";

export default function SchoolProfilePage() {
  const { currentSchool, refreshSchools } = useSchool();

  const [form, setForm] = useState({
    name: "",
    display_name: "",
    code: "",
    logo_url: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    description: "",
  });

  const [initialData, setInitialData] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await getSchoolSettings();
      if (res?.data) {
        const d = res.data;
        const formData = {
          name: d.name || currentSchool?.name || "",
          display_name: d.display_name || d.name || "",
          code: d.code || currentSchool?.code || "",
          logo_url: d.logo_url || "",
          address: d.address || "",
          contact_email: d.contact_email || "",
          contact_phone: d.contact_phone || "",
          website: d.website || "",
          description: d.description || "",
        };
        setForm(formData);
        setInitialData(formData);
        setSubscriptionInfo({
          status: d.status || "active",
          created_at: d.created_at,
          plan_name: d.plan_name || "Gói tiêu chuẩn (Standard)",
          billing_cycle: d.billing_cycle || "monthly",
          subscription_status: d.subscription_status || "active",
          subscription_start: d.subscription_start,
          subscription_end: d.subscription_end,
          student_limit: d.student_limit,
          storage_limit_gb: d.storage_limit_gb,
          ai_requests_limit: d.ai_requests_limit,
        });
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
        err.message ||
        "Không thể tải thông tin hồ sơ trường học."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentSchool?.id, currentSchool?.schoolId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleReset = () => {
    if (initialData) {
      setForm(initialData);
      setSuccessMessage("");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    if (!form.name.trim()) {
      setErrorMessage("Tên trường học là trường bắt buộc và không được để trống.");
      setSaving(false);
      return;
    }

    try {
      const res = await updateSchoolSettings({
        name: form.name.trim(),
        display_name: form.display_name.trim() || form.name.trim(),
        logo_url: form.logo_url.trim(),
        address: form.address.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        website: form.website.trim(),
        description: form.description.trim(),
      });

      if (res?.data) {
        const d = res.data;
        const updated = {
          name: d.name || form.name,
          display_name: d.display_name || form.display_name,
          code: d.code || form.code,
          logo_url: d.logo_url ?? form.logo_url,
          address: d.address ?? form.address,
          contact_email: d.contact_email ?? form.contact_email,
          contact_phone: d.contact_phone ?? form.contact_phone,
          website: d.website ?? form.website,
          description: d.description ?? form.description,
        };
        setForm(updated);
        setInitialData(updated);
      }

      setSuccessMessage("Cập nhật thông tin hồ sơ trường học thành công!");
      if (typeof refreshSchools === "function") {
        refreshSchools();
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message ||
        err.message ||
        "Không thể lưu thay đổi. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-1/3"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="h-40 bg-slate-200 rounded-3xl mt-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="h-80 bg-slate-200 rounded-3xl"></div>
          <div className="h-80 bg-slate-200 rounded-3xl"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-700">
              <ShieldCheck className="w-3.5 h-3.5" /> Quản trị trường học
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {currentSchool?.schoolId || currentSchool?.id}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
            Hồ sơ & Thông tin Trường học
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý tên trường, nhận diện thương hiệu, thông tin liên lạc và gói dịch vụ hệ thống EDUX.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Khôi phục
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-md shadow-orange-500/20 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-sm shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* School Brand Hero Card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="flex items-center gap-5">
            {/* Logo box */}
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-2 border-orange-100 bg-orange-50/50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt={form.name}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                style={{ display: form.logo_url ? "none" : "flex" }}
                className="w-full h-full items-center justify-center text-orange-500"
              >
                <Building2 className="w-10 h-10" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl md:text-2xl font-black text-slate-900">
                  {form.name || "Chưa đặt tên trường"}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Đang hoạt động
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {form.display_name && form.display_name !== form.name ? (
                  <span>Tên viết tắt: <strong className="text-slate-700">{form.display_name}</strong> • </span>
                ) : null}
                Mã định danh hệ thống: <span className="font-mono font-bold text-orange-600">{form.code || "—"}</span>
              </p>
              {form.website && (
                <a
                  href={form.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-semibold mt-2 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {form.website}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Subscription Badge */}
          {subscriptionInfo && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 w-full md:w-auto md:min-w-[240px]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Gói tài khoản
              </div>
              <p className="text-base font-bold text-slate-900 mt-1">
                {subscriptionInfo.plan_name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Chu kỳ: <span className="font-semibold text-slate-700">{subscriptionInfo.billing_cycle === "yearly" ? "Theo năm" : "Theo tháng"}</span>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Main Form Fields */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols wide on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: School Identity */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-orange-600" />
              <h3 className="text-base font-bold text-slate-900">Thông tin pháp lý & Định danh</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Tên trường học chính thức <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ví dụ: Trường Đại học Bách Khoa Đà Nẵng"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Tên này sẽ hiển thị trên tất cả chứng từ, bằng cấp, báo cáo và bảng điều khiển.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Tên viết tắt / Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={(e) => handleChange("display_name", e.target.value)}
                    placeholder="Ví dụ: DUT - ĐHBK"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Dùng cho thanh tiêu đề nhỏ và menu điều hướng.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Mã trường hệ thống
                  </label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={form.code}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-mono font-bold text-slate-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Mã duy nhất không thể thay đổi sau khi đăng ký.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Logo and Branding */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Globe className="w-5 h-5 text-orange-600" />
              <h3 className="text-base font-bold text-slate-900">Nhận diện trực tuyến & Logo</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Đường dẫn ảnh Logo (Logo URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.logo_url}
                    onChange={(e) => handleChange("logo_url", e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Đề xuất định dạng PNG trong suốt (khuyên dùng tỉ lệ 1:1, tối thiểu 200x200px).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Website chính thức
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://due.udn.vn"
                    className="flex-1 rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  {form.website && (
                    <a
                      href={form.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 transition text-sm font-medium"
                      title="Mở liên kết"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Description */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <FileText className="w-5 h-5 text-orange-600" />
              <h3 className="text-base font-bold text-slate-900">Giới thiệu & Sứ mệnh trường học</h3>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Mô tả giới thiệu trường
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Tóm tắt về lịch sử thành lập, tầm nhìn giáo dục, các ngành đào tạo nổi bật..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
        </div>

        {/* Right Column (1 col wide) */}
        <div className="space-y-6">
          {/* Card 4: Contact & Address */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Mail className="w-5 h-5 text-orange-600" />
              <h3 className="text-base font-bold text-slate-900">Liên hệ & Địa chỉ</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email liên hệ chính thức
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => handleChange("contact_email", e.target.value)}
                    placeholder="contact@school.edu.vn"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Số điện thoại đường dây nóng
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={form.contact_phone}
                    onChange={(e) => handleChange("contact_phone", e.target.value)}
                    placeholder="0236 3836 169"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Địa chỉ trụ sở trường
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="71 Ngũ Hành Sơn, Mỹ An, Ngũ Hành Sơn, Đà Nẵng"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Subscription Plan Details */}
          {subscriptionInfo && (
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 md:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-orange-400" />
                  <h3 className="text-base font-bold text-white">Gói dịch vụ EDUX</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {subscriptionInfo.subscription_status}
                </span>
              </div>

              <div className="space-y-3.5 text-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Tên gói đăng ký</p>
                  <p className="text-lg font-bold text-white mt-0.5">{subscriptionInfo.plan_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
                  <div>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-orange-400" /> Số sinh viên
                    </p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">
                      {subscriptionInfo.student_limit ? `${subscriptionInfo.student_limit} người` : "Không giới hạn"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-orange-400" /> Dung lượng
                    </p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">
                      {subscriptionInfo.storage_limit_gb ? `${subscriptionInfo.storage_limit_gb} GB` : "Theo gói"}
                    </p>
                  </div>
                </div>

                {subscriptionInfo.ai_requests_limit && (
                  <div className="pt-2 border-t border-slate-700/60">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Lượt AI EduX / tháng
                    </p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">
                      {subscriptionInfo.ai_requests_limit.toLocaleString("vi-VN")} lượt
                    </p>
                  </div>
                )}

                {subscriptionInfo.created_at && (
                  <div className="pt-2 border-t border-slate-700/60 text-xs text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Khởi tạo: {new Date(subscriptionInfo.created_at).toLocaleDateString("vi-VN")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Bottom Floating/Fixed Save Bar */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
        >
          Khôi phục dữ liệu ban đầu
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-md shadow-orange-500/20 transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Đang lưu thay đổi...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Lưu thay đổi hồ sơ
            </>
          )}
        </button>
      </div>
    </main>
  );
}
