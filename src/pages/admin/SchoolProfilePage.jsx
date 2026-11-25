import React, { useEffect, useState } from "react";
import { useSchool } from "../../contexts/SchoolContext";
import { getSchoolSettings, updateSchoolSettings } from "../../services/schoolApi";
import EduxAlert from "../../components/common/EduxAlert";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  Save,
  Sparkles,
  ExternalLink,
  RotateCcw,
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
      <main className="p-4 sm:p-5 lg:p-6 xl:p-8 max-w-[1600px] mx-auto min-w-0 w-full space-y-5 animate-pulse">
        <div className="h-9 bg-slate-200 rounded-xl w-1/3"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="h-24 bg-slate-200 rounded-2xl mt-5"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <div className="h-72 bg-slate-200 rounded-2xl"></div>
          <div className="h-72 bg-slate-200 rounded-2xl"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-5 lg:p-6 xl:p-8 max-w-[1600px] mx-auto min-w-0 w-full text-slate-800 animate-fade-in">
      {/* Sticky Action Bar / Page Header */}
      <div className="sticky top-0 z-20 bg-[#FDF8F5]/95 backdrop-blur py-3 mb-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            Hồ sơ & Thông tin Trường học
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý tên trường, nhận diện thương hiệu, thông tin liên lạc và gói dịch vụ EDUX.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi phục
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {successMessage && (
        <div className="mb-4">
          <EduxAlert
            type="success"
            title="Thành công!"
            message={successMessage}
            onClose={() => setSuccessMessage("")}
          />
        </div>
      )}

      {errorMessage && (
        <div className="mb-4">
          <EduxAlert
            type="error"
            title="Đã xảy ra lỗi!"
            message={errorMessage}
            onClose={() => setErrorMessage("")}
          />
        </div>
      )}

      {/* School Brand Banner */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Logo box */}
          <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt={form.name}
                className="w-full h-full object-contain p-1.5"
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
              <Building2 className="w-7 h-7" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">
                {form.name || "Chưa đặt tên trường"}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Đang hoạt động
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {form.display_name && form.display_name !== form.name ? (
                <span>Tên viết tắt: <strong className="text-slate-700">{form.display_name}</strong> · </span>
              ) : null}
              Mã định danh hệ thống: <span className="font-mono font-bold text-orange-600">{form.code || "—"}</span>
            </p>
            {form.website && (
              <a
                href={form.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-semibold mt-1 hover:underline"
              >
                <Globe className="w-3 h-3" />
                {form.website}
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Subscription Summary */}
        {subscriptionInfo && (
          <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-right shrink-0">
            <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{subscriptionInfo.plan_name}</span>
              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">
                {subscriptionInfo.subscription_status || "Active"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Chu kỳ: <span className="font-semibold text-slate-700">{subscriptionInfo.billing_cycle === "yearly" ? "Theo năm" : "Theo tháng"}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              SV: <span className="font-semibold text-slate-700">{subscriptionInfo.student_limit ? `${subscriptionInfo.student_limit} người` : "Không giới hạn"}</span>
              {" · "}
              Dung lượng: <span className="font-semibold text-slate-700">{subscriptionInfo.storage_limit_gb ? `${subscriptionInfo.storage_limit_gb} GB` : "Theo gói"}</span>
            </p>
          </div>
        )}
      </section>

      {/* 2-Column Balanced Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-start">
        {/* Left Column */}
        <div className="space-y-4 sm:space-y-5 min-w-0">
          {/* Card 1: School Identity */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-slate-900">Thông tin pháp lý & Định danh</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Tên trường học chính thức <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Ví dụ: Trường Đại học Bách Khoa Đà Nẵng"
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Tên này sẽ hiển thị trên tất cả chứng từ, bằng cấp, báo cáo và bảng điều khiển.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tên viết tắt / Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={form.display_name}
                    onChange={(e) => handleChange("display_name", e.target.value)}
                    placeholder="Ví dụ: DUT - ĐHBK"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Dùng cho thanh tiêu đề nhỏ và menu điều hướng.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Mã trường hệ thống
                  </label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={form.code}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-100 px-3.5 text-sm font-mono font-bold text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mã định danh duy nhất không thể thay đổi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Description */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <FileText className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-slate-900">Giới thiệu & Sứ mệnh trường học</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mô tả giới thiệu trường
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Tóm tắt về lịch sử thành lập, tầm nhìn giáo dục, các ngành đào tạo nổi bật..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-5 min-w-0">
          {/* Card 3: Contact & Address */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Mail className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-slate-900">Liên hệ & Địa chỉ</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email liên hệ chính thức
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => handleChange("contact_email", e.target.value)}
                    placeholder="contact@school.edu.vn"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Số điện thoại đường dây nóng
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={form.contact_phone}
                    onChange={(e) => handleChange("contact_phone", e.target.value)}
                    placeholder="0236 3836 169"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Địa chỉ trụ sở trường
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="71 Ngũ Hành Sơn, Mỹ An, Ngũ Hành Sơn, Đà Nẵng"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Online Identity & Logo */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Globe className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-slate-900">Nhận diện trực tuyến & Logo</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Đường dẫn ảnh Logo (Logo URL)
                </label>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center overflow-hidden">
                    {form.logo_url ? (
                      <img
                        src={form.logo_url}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      style={{ display: form.logo_url ? "none" : "flex" }}
                      className="w-full h-full items-center justify-center text-slate-400"
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                  <input
                    type="url"
                    value={form.logo_url}
                    onChange={(e) => handleChange("logo_url", e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Đề xuất định dạng PNG trong suốt (khuyên dùng tỉ lệ 1:1, tối thiểu 200x200px).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Website chính thức
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      placeholder="https://due.udn.vn"
                      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 text-sm font-medium text-slate-900 transition focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  {form.website && (
                    <a
                      href={form.website}
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition flex items-center justify-center text-sm font-medium shrink-0"
                      title="Mở liên kết"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
