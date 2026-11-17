import React, { useEffect, useState, useCallback } from "react";
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1f1b17]">Quản lý Gói dịch vụ (Subscription Plans)</h1>
            <p className="mt-1 text-sm text-[#545f73]">
              Cấu hình các gói dịch vụ SaaS, giá thuê theo tháng/năm và hạn mức tài nguyên (sinh viên, dung lượng S3, yêu cầu AI).
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreateForm(DEFAULT_PLAN_FORM);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#f27024] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-[#d95c14] transition"
          >
            <Plus className="h-4 w-4" />
            Tạo gói dịch vụ mới
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`rounded-xl p-4 text-sm flex items-center justify-between ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: "", text: "" })} className="text-[#8c7166] hover:text-[#1f1b17]">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8c7166]">Tổng số gói</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1f1b17]">{plans.length}</p>
          </div>
          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8c7166]">Gói đang mở bán</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600">{plans.filter((p) => p.is_active).length}</p>
          </div>
          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8c7166]">Trường đang thuê dịch vụ</p>
            <p className="mt-2 text-3xl font-extrabold text-[#f27024]">{totalActiveSchools}</p>
          </div>
        </div>

        {/* Plan Cards Grid */}
        {loading ? (
          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-12 text-center text-[#545f73]">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#f27024] mb-2" />
            Đang tải thông tin gói thuê…
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#f5ebe1] bg-white p-12 text-center text-[#8c7166]">
            Chưa có gói thuê nào được cấu hình. Nhấn &quot;Tạo gói dịch vụ mới&quot; để thêm.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => {
              const features = typeof p.features === "object" && p.features !== null ? p.features : {};
              return (
                <div
                  key={p.id}
                  className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
                    p.is_active ? "border-[#f5ebe1]" : "border-[#f5ebe1] opacity-60 bg-[#fff8f5]/50"
                  }`}
                >
                  <div>
                    {/* Header: Name, Active Badge & Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-[#1f1b17]">{p.name}</h3>
                          <span className="font-mono text-[11px] text-[#8c7166]">({p.id})</span>
                        </div>
                        <p className="mt-1 text-xs text-[#545f73] line-clamp-2">{p.description || "Gói dịch vụ nền tảng EDUX."}</p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.is_active ? "bg-emerald-50 text-emerald-700" : "bg-[#fcf2eb] text-[#8c7166]"
                        }`}
                      >
                        {p.is_active ? "Đang mở bán" : "Đã ẩn"}
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="mt-5 rounded-2xl bg-[#fff8f5] border border-[#f5ebe1] p-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-[#545f73]">Theo tháng:</span>
                        <span className="text-lg font-extrabold text-[#1f1b17]">{formatCurrency(p.price_monthly)}</span>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between border-t border-[#f5ebe1] pt-2">
                        <span className="text-xs text-[#545f73]">Theo năm:</span>
                        <span className="text-base font-bold text-[#f27024]">{formatCurrency(p.price_yearly)}</span>
                      </div>
                    </div>

                    {/* Resource Quotas */}
                    <div className="mt-5 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between text-[#545f73]">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#f27024]" />
                          Hạn mức sinh viên:
                        </span>
                        <strong className="text-[#1f1b17]">{Number(p.student_limit).toLocaleString("vi-VN")} SV</strong>
                      </div>

                      <div className="flex items-center justify-between text-[#545f73]">
                        <span className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-amber-500" />
                          Dung lượng lưu trữ:
                        </span>
                        <strong className="text-[#1f1b17]">{p.storage_limit_gb} GB</strong>
                      </div>

                      <div className="flex items-center justify-between text-[#545f73]">
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[#f27024]" />
                          Yêu cầu AI / tháng:
                        </span>
                        <strong className="text-[#1f1b17]">{Number(p.ai_requests_limit).toLocaleString("vi-VN")} lượt</strong>
                      </div>

                      <div className="flex items-center justify-between text-[#545f73] border-t border-[#f5ebe1] pt-2">
                        <span className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-emerald-500" />
                          Trường đang sử dụng:
                        </span>
                        <strong className="text-emerald-700">{p.active_school_count || 0} trường</strong>
                      </div>
                    </div>

                    {/* Features Badges */}
                    <div className="mt-4 border-t border-[#f5ebe1] pt-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c7166] mb-2">Tính năng mở rộng</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(features).map(([key, val]) => (
                          <span
                            key={key}
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium flex items-center gap-1 ${
                              val ? "bg-emerald-50 text-emerald-800" : "bg-[#fcf2eb] text-[#8c7166] line-through"
                            }`}
                          >
                            {val ? <Check className="h-3 w-3 text-emerald-600" /> : <X className="h-3 w-3" />}
                            {key}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-6 flex items-center justify-between border-t border-[#f5ebe1] pt-4">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(p)}
                      className={`text-xs font-semibold hover:underline ${
                        p.is_active ? "text-amber-600" : "text-emerald-600"
                      }`}
                    >
                      {p.is_active ? "Ẩn gói này" : "Mở bán lại"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPlan(p);
                          setEditForm({
                            ...p,
                            features: typeof p.features === "object" && p.features !== null ? p.features : {},
                          });
                        }}
                        className="rounded-lg border border-[#f5ebe1] bg-white p-2 text-[#545f73] hover:bg-[#fff8f5] hover:text-[#f27024]"
                        title="Chỉnh sửa gói"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="rounded-lg border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50"
                        title="Xóa / Ngừng cung cấp gói"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Tạo gói mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#f5ebe1] my-8">
            <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1f1b17]">Tạo gói dịch vụ SaaS mới</h2>
                <p className="text-xs text-[#545f73]">Gói mới sẽ hiển thị trên trang đăng ký trường và bảng giá hệ thống.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1 text-[#8c7166] hover:bg-[#fff8f5]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1f1b17]">Mã gói (ID định danh - viết liền, không dấu)</label>
                  <input
                    type="text"
                    required
                    placeholder="enterprise, basic_plus..."
                    value={createForm.id}
                    onChange={(e) => setCreateForm({ ...createForm, id: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 font-mono text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1f1b17]">Tên gói hiển thị</label>
                  <input
                    type="text"
                    required
                    placeholder="Gói Doanh nghiệp, Gói Nâng cao..."
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f1b17]">Mô tả ngắn về gói</label>
                <textarea
                  rows="2"
                  placeholder="Mô tả đối tượng phù hợp và lợi ích của gói…"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#fff8f5] p-4 rounded-2xl border border-[#f5ebe1]">
                <div>
                  <label className="block text-xs font-semibold text-[#1f1b17]">Giá theo tháng (VND)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="10000"
                    value={createForm.price_monthly}
                    onChange={(e) => setCreateForm({ ...createForm, price_monthly: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 font-semibold text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1f1b17]">Giá theo năm (VND)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50000"
                    value={createForm.price_yearly}
                    onChange={(e) => setCreateForm({ ...createForm, price_yearly: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 font-semibold text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1f1b17]">Giới hạn Sinh viên</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={createForm.student_limit}
                    onChange={(e) => setCreateForm({ ...createForm, student_limit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1f1b17]">Dung lượng S3 (GB)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={createForm.storage_limit_gb}
                    onChange={(e) => setCreateForm({ ...createForm, storage_limit_gb: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1f1b17]">Yêu cầu AI / tháng</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={createForm.ai_requests_limit}
                    onChange={(e) => setCreateForm({ ...createForm, ai_requests_limit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="border-t border-[#f5ebe1] pt-4">
                <label className="block text-xs font-semibold text-[#1f1b17] mb-2">Bật/Tắt tính năng trong gói</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(createForm.features).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2 rounded-lg border border-[#f5ebe1] bg-white p-2.5 hover:bg-[#fff8f5] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) => setCreateForm({
                          ...createForm,
                          features: { ...createForm.features, [key]: e.target.checked },
                        })}
                        className="rounded text-[#f27024] focus:ring-[#f27024]"
                      />
                      <span className="font-medium text-[#1f1b17]">{key}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#f5ebe1] pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-[#f5ebe1] bg-white px-4 py-2 text-sm font-semibold text-[#545f73] hover:bg-[#fff8f5]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="rounded-xl bg-[#f27024] px-5 py-2 text-sm font-semibold text-white hover:bg-[#d95c14] disabled:opacity-50 transition"
                >
                  {createSubmitting ? "Đang tạo…" : "Xác nhận tạo gói"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chỉnh sửa gói */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#f5ebe1] my-8">
            <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1f1b17]">Chỉnh sửa gói: {editingPlan.name}</h2>
                <p className="text-xs text-[#545f73]">Mã định danh: <code>{editingPlan.id}</code> (Giá mới áp dụng cho các đăng ký mới, bảo toàn giá cũ của các trường đang hoạt động).</p>
              </div>
              <button onClick={() => setEditingPlan(null)} className="rounded-lg p-1 text-[#8c7166] hover:bg-[#fff8f5]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1f1b17]">Tên gói</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1f1b17]">Mô tả gói</label>
                <textarea
                  rows="2"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#fff8f5] p-4 rounded-2xl border border-[#f5ebe1]">
                <div>
                  <label className="block text-xs font-semibold text-[#1f1b17]">Giá theo tháng (VND)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="10000"
                    value={editForm.price_monthly}
                    onChange={(e) => setEditForm({ ...editForm, price_monthly: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 font-semibold text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1f1b17]">Giá theo năm (VND)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50000"
                    value={editForm.price_yearly}
                    onChange={(e) => setEditForm({ ...editForm, price_yearly: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 font-semibold text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1f1b17]">Giới hạn Sinh viên</label>
                  <input
                    type="number"
                    required
                    min="10"
                    value={editForm.student_limit}
                    onChange={(e) => setEditForm({ ...editForm, student_limit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1f1b17]">Dung lượng S3 (GB)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editForm.storage_limit_gb}
                    onChange={(e) => setEditForm({ ...editForm, storage_limit_gb: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1f1b17]">Yêu cầu AI / tháng</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={editForm.ai_requests_limit}
                    onChange={(e) => setEditForm({ ...editForm, ai_requests_limit: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#f5ebe1] bg-white p-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
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
                <label htmlFor="edit_is_active" className="text-sm font-semibold text-[#1f1b17] cursor-pointer">
                  Kích hoạt mở bán gói này cho khách hàng tự đăng ký
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#f5ebe1] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="rounded-xl border border-[#f5ebe1] bg-white px-4 py-2 text-sm font-semibold text-[#545f73] hover:bg-[#fff8f5]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="rounded-xl bg-[#f27024] px-5 py-2 text-sm font-semibold text-white hover:bg-[#d95c14] disabled:opacity-50 transition"
                >
                  {editSubmitting ? "Đang lưu…" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SuperadminLayout>
  );
}
