import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import SuperadminLayout from "../../components/platform/SuperadminLayout";
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from "../../services/platformApi";
import {
  Layers3,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  RefreshCw,
  HardDrive,
  Users,
  Sparkles,
  Building,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import EduxAlert from "../../components/common/EduxAlert";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

const DEFAULT_PLAN_FORM = {
  id: "",
  name: "",
  description: "",
  price_monthly: 1000000,
  price_yearly: 10000000,
  student_limit: 1000,
  storage_limit_gb: 50,
  ai_requests_limit: 5000,
  features: {
    lms_core: true,
    ai_advisory: true,
    plagiarism_check: false,
    custom_domain: false,
    dedicated_support: false,
  },
  is_active: true,
};

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(DEFAULT_PLAN_FORM);
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [editingPlan, setEditingPlan] = useState(null);
  const [editForm, setEditForm] = useState(DEFAULT_PLAN_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPlans(true);
      setPlans(res.data || []);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Không thể tải danh sách gói thuê." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      await createPlan({
        ...createForm,
        id: createForm.id.toLowerCase().trim().replace(/[^a-z0-9_-]/g, ""),
        price_monthly: Number(createForm.price_monthly),
        price_yearly: Number(createForm.price_yearly),
        student_limit: Number(createForm.student_limit),
        storage_limit_gb: Number(createForm.storage_limit_gb),
        ai_requests_limit: Number(createForm.ai_requests_limit),
      });
      setShowCreateModal(false);
      setCreateForm(DEFAULT_PLAN_FORM);
      setMessage({ type: "success", text: "Đã tạo gói thuê SaaS mới thành công!" });
      loadPlans();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi tạo gói thuê." });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    setEditSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      await updatePlan(editingPlan.id, {
        name: editForm.name,
        description: editForm.description,
        price_monthly: Number(editForm.price_monthly),
        price_yearly: Number(editForm.price_yearly),
        student_limit: Number(editForm.student_limit),
        storage_limit_gb: Number(editForm.storage_limit_gb),
        ai_requests_limit: Number(editForm.ai_requests_limit),
        features: editForm.features,
        is_active: editForm.is_active,
      });
      setEditingPlan(null);
      setMessage({ type: "success", text: `Đã cập nhật gói ${editForm.name}!` });
      loadPlans();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi cập nhật gói." });
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleActive = async (plan) => {
    const nextState = !plan.is_active;
    try {
      await updatePlan(plan.id, { is_active: nextState });
      setMessage({ type: "success", text: `Đã ${nextState ? "kích hoạt" : "ẩn"} gói ${plan.name}.` });
      loadPlans();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi đổi trạng thái gói." });
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Bạn có chắc muốn xóa hoặc ngừng cung cấp gói "${plan.name}"? Nếu đã có trường học đăng ký gói này, hệ thống sẽ tự động chuyển sang chế độ Ẩn (is_active = false) để bảo toàn hợp đồng hiện tại.`)) return;

    try {
      const res = await deletePlan(plan.id);
      const action = res.data?.action === "deactivated" ? "ngừng cung cấp (ẩn khỏi mục đăng ký mới)" : "xóa hoàn toàn";
      setMessage({ type: "success", text: `Gói ${plan.name} đã được ${action}.` });
      loadPlans();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Lỗi khi xóa gói thuê." });
    }
  };

  const totalActiveSchools = plans.reduce((sum, p) => sum + Number(p.active_school_count || 0), 0);

  return (
    <SuperadminLayout>
      <div className="w-full max-w-[1600px] mx-auto min-w-0 h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-4 sm:px-5 lg:px-6 xl:px-8 pt-4 pb-4 box-border animate-fade-in">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-[#FFEDD5] via-[#FED7AA]/90 to-[#FDBA74]/85 border border-orange-300/80 rounded-2xl px-5 py-4 shadow-xs mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0">
              Quản lý Gói dịch vụ (Subscription Plans)
            </h1>
            <p className="text-sm text-slate-700 font-medium mt-1 m-0">
              Cấu hình các gói dịch vụ SaaS, giá thuê theo tháng/năm và hạn mức tài nguyên (sinh viên, dung lượng S3, yêu cầu AI).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreateForm(DEFAULT_PLAN_FORM);
              setShowCreateModal(true);
            }}
            className="h-10 px-4 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs sm:text-sm font-semibold shadow-xs transition inline-flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo gói dịch vụ mới</span>
          </button>
        </div>

        {/* Alert Notification */}
        {message.text && (
          <div className="shrink-0 mb-3">
            <EduxAlert
              type={message.type}
              message={message.text}
              onClose={() => setMessage({ type: "", text: "" })}
            />
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0 mb-3">
          <div className="py-2.5 px-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between min-w-0">
            <span className="text-xs font-medium text-slate-500 truncate mr-2">Tổng số gói</span>
            <span className="text-lg font-bold text-slate-900 shrink-0">{plans.length}</span>
          </div>
          <div className="py-2.5 px-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between min-w-0">
            <span className="text-xs font-medium text-slate-500 truncate mr-2">Gói đang mở bán</span>
            <span className="text-lg font-bold text-emerald-600 shrink-0">{plans.filter((p) => p.is_active).length}</span>
          </div>
          <div className="py-2.5 px-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between min-w-0">
            <span className="text-xs font-medium text-slate-500 truncate mr-2">Trường đang thuê dịch vụ</span>
            <span className="text-lg font-bold text-[#f27024] shrink-0">{totalActiveSchools}</span>
          </div>
        </div>

        {/* Plan Cards Grid Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#f27024] mb-2" />
              Đang tải thông tin gói thuê…
            </div>
          ) : plans.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
              Chưa có gói thuê nào được cấu hình. Nhấn &quot;Tạo gói dịch vụ mới&quot; để thêm.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-2">
              {plans.map((p) => {
                const features = typeof p.features === "object" && p.features !== null ? p.features : {};
                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-xs transition hover:shadow-md ${
                      p.is_active ? "border-slate-200" : "border-slate-200/80 opacity-70 bg-slate-50/60"
                    }`}
                  >
                    <div>
                      {/* Header: Name, Active Badge & Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-base font-bold text-slate-900 truncate">{p.name}</h3>
                            <span className="font-mono text-[11px] text-slate-400">({p.id})</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {p.description || "Gói dịch vụ nền tảng EDUX."}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            p.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {p.is_active ? "Đang mở bán" : "Đã ẩn"}
                        </span>
                      </div>

                      {/* Pricing */}
                      <div className="mt-2.5 rounded-xl bg-orange-50/40 border border-orange-100/60 py-2 px-3 space-y-1 text-xs">
                        <div className="flex items-baseline justify-between text-slate-600">
                          <span className="text-xs text-slate-500">Theo tháng:</span>
                          <span className="text-sm font-bold text-slate-900">{formatCurrency(p.price_monthly)}</span>
                        </div>
                        <div className="flex items-baseline justify-between border-t border-orange-100/60 pt-1 text-slate-600">
                          <span className="text-xs text-slate-500">Theo năm:</span>
                          <span className="text-sm font-bold text-[#f27024]">{formatCurrency(p.price_yearly)}</span>
                        </div>
                      </div>

                      {/* Resource Quotas */}
                      <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-[#f27024]" />
                            Hạn mức sinh viên:
                          </span>
                          <strong className="text-slate-900">{Number(p.student_limit).toLocaleString("vi-VN")} SV</strong>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <HardDrive className="h-3.5 w-3.5 text-amber-500" />
                            Dung lượng lưu trữ:
                          </span>
                          <strong className="text-slate-900">{p.storage_limit_gb} GB</strong>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-[#f27024]" />
                            Yêu cầu AI / tháng:
                          </span>
                          <strong className="text-slate-900">{Number(p.ai_requests_limit).toLocaleString("vi-VN")} lượt</strong>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                          <span className="flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-emerald-500" />
                            Trường đang sử dụng:
                          </span>
                          <strong className="text-emerald-700">{p.active_school_count || 0} trường</strong>
                        </div>
                      </div>

                      {/* Features Badges */}
                      <div className="mt-2.5 border-t border-slate-100 pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tính năng mở rộng</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(features).map(([key, val]) => (
                            <span
                              key={key}
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1 ${
                                val ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-400 line-through"
                              }`}
                            >
                              {val ? <Check className="h-2.5 w-2.5 text-emerald-600" /> : <X className="h-2.5 w-2.5" />}
                              {key}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(p)}
                        className={`text-xs font-semibold hover:underline ${
                          p.is_active ? "text-amber-600" : "text-emerald-600"
                        }`}
                      >
                        {p.is_active ? "Ẩn gói này" : "Mở bán lại"}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlan(p);
                            setEditForm({
                              ...p,
                              features: typeof p.features === "object" && p.features !== null ? p.features : {},
                            });
                          }}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 hover:text-[#f27024] transition"
                          title="Chỉnh sửa gói"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="rounded-lg border border-red-200 bg-white p-1.5 text-red-600 hover:bg-red-50 transition"
                          title="Xóa / Ngừng cung cấp gói"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tạo gói mới */}
      {showCreateModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Tạo gói dịch vụ SaaS mới</h2>
                  <p className="text-xs text-slate-500">Gói mới sẽ hiển thị trên trang đăng ký trường và bảng giá hệ thống.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Mã gói (ID định danh - viết liền, không dấu)</label>
                    <input
                      type="text"
                      required
                      placeholder="enterprise, basic_plus..."
                      value={createForm.id}
                      onChange={(e) => setCreateForm({ ...createForm, id: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 font-mono text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Tên gói hiển thị</label>
                    <input
                      type="text"
                      required
                      placeholder="Gói Doanh nghiệp, Gói Nâng cao..."
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Mô tả ngắn về gói</label>
                  <textarea
                    rows="2"
                    placeholder="Mô tả đối tượng phù hợp và lợi ích của gói…"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-orange-50/40 p-3 rounded-xl border border-orange-100/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Giá theo tháng (VND)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="10000"
                      value={createForm.price_monthly}
                      onChange={(e) => setCreateForm({ ...createForm, price_monthly: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Giá theo năm (VND)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="50000"
                      value={createForm.price_yearly}
                      onChange={(e) => setCreateForm({ ...createForm, price_yearly: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-sm text-[#f27024] focus:border-[#f27024] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Giới hạn Sinh viên</label>
                    <input
                      type="number"
                      required
                      min="10"
                      value={createForm.student_limit}
                      onChange={(e) => setCreateForm({ ...createForm, student_limit: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Dung lượng S3 (GB)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={createForm.storage_limit_gb}
                      onChange={(e) => setCreateForm({ ...createForm, storage_limit_gb: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Yêu cầu AI / tháng</label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={createForm.ai_requests_limit}
                      onChange={(e) => setCreateForm({ ...createForm, ai_requests_limit: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bật/Tắt tính năng trong gói</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(createForm.features).map(([key, val]) => (
                      <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) =>
                            setCreateForm({
                              ...createForm,
                              features: { ...createForm.features, [key]: e.target.checked },
                            })
                          }
                          className="rounded text-[#f27024] focus:ring-[#f27024]"
                        />
                        <span className="font-medium text-slate-800">{key}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="rounded-xl bg-[#f27024] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#d95c14] disabled:opacity-50 transition"
                  >
                    {createSubmitting ? "Đang tạo…" : "Xác nhận tạo gói"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal: Chỉnh sửa gói */}
      {editingPlan &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Chỉnh sửa gói: {editingPlan.name}</h2>
                  <p className="text-xs text-slate-500">
                    Mã định danh: <code>{editingPlan.id}</code> (Giá mới áp dụng cho các đăng ký mới, bảo toàn giá cũ của các trường đang hoạt động).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Tên gói</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Mô tả gói</label>
                  <textarea
                    rows="2"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-orange-50/40 p-3 rounded-xl border border-orange-100/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Giá theo tháng (VND)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="10000"
                      value={editForm.price_monthly}
                      onChange={(e) => setEditForm({ ...editForm, price_monthly: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Giá theo năm (VND)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="50000"
                      value={editForm.price_yearly}
                      onChange={(e) => setEditForm({ ...editForm, price_yearly: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 font-semibold text-sm text-[#f27024] focus:border-[#f27024] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Giới hạn Sinh viên</label>
                    <input
                      type="number"
                      required
                      min="10"
                      value={editForm.student_limit}
                      onChange={(e) => setEditForm({ ...editForm, student_limit: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Dung lượng S3 (GB)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editForm.storage_limit_gb}
                      onChange={(e) => setEditForm({ ...editForm, storage_limit_gb: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Yêu cầu AI / tháng</label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={editForm.ai_requests_limit}
                      onChange={(e) => setEditForm({ ...editForm, ai_requests_limit: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-900 focus:border-[#f27024] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="rounded text-[#f27024] focus:ring-[#f27024]"
                  />
                  <label htmlFor="edit_is_active" className="text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer">
                    Kích hoạt mở bán gói này cho khách hàng tự đăng ký
                  </label>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="rounded-xl bg-[#f27024] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#d95c14] disabled:opacity-50 transition"
                  >
                    {editSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </SuperadminLayout>
  );
}
