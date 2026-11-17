import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createSchoolRegistration,
  getPublicPlans,
} from "../../services/publicRegistrationApi";

const REGISTRATION_SESSION_KEY = "edux:pending-school-registration";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getErrorMessage(error) {
  const code = error.response?.data?.message;
  if (code === "EMAIL_ALREADY_HAS_ACCOUNT") {
    return "Email này đã có tài khoản EDUX. Hãy đăng nhập để tiếp tục quản lý trường của bạn.";
  }
  if (code === "REGISTRATION_ALREADY_EXISTS") {
    return "Email này đang có một yêu cầu đăng ký chưa hoàn tất. Hãy kiểm tra trạng thái yêu cầu hiện có.";
  }
  if (code === "PLAN_NOT_AVAILABLE") {
    return "Gói dịch vụ vừa chọn không còn khả dụng. Vui lòng chọn gói khác.";
  }
  return code || "Không thể tạo yêu cầu đăng ký. Vui lòng thử lại.";
}

export default function SchoolRegistrationPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    school_name: "",
    admin_email: "",
    plan_id: "",
    billing_cycle: "monthly",
    terms_accepted: false,
  });

  useEffect(() => {
    // Tự động xóa session cũ khi quay lại trang đăng ký để người dùng luôn có form tạo trường mới
    sessionStorage.removeItem(REGISTRATION_SESSION_KEY);

    let active = true;

    const load = async () => {
      try {
        const plansResult = await getPublicPlans();
        if (!active) return;
        const availablePlans = plansResult.data || [];
        setPlans(availablePlans);
        setForm((current) => ({
          ...current,
          plan_id: current.plan_id || availablePlans[0]?.id || "",
        }));
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError));
      } finally {
        if (active) setPlansLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === form.plan_id),
    [plans, form.plan_id]
  );
  const price = selectedPlan
    ? (form.billing_cycle === "yearly" ? selectedPlan.price_yearly : selectedPlan.price_monthly)
    : 0;

  const update = (key, value) => {
    setError("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.terms_accepted) {
      setError("Bạn cần đồng ý Điều khoản sử dụng trước khi gửi yêu cầu.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createSchoolRegistration(form);
      const created = result.data;
      // This short-lived tracking capability is intentionally stored only for
      // the current browser session. No password or account credential exists
      // before payment has been confirmed.
      sessionStorage.setItem(REGISTRATION_SESSION_KEY, JSON.stringify({
        id: created.id,
        trackingToken: created.tracking_token,
      }));
      navigate(`/register-school/payment/${created.id}`, { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-7 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-orange-600">EDUX FOR SCHOOLS</p>
            <h1 className="mt-2 text-3xl font-bold">Tạo hệ thống trường mới</h1>
            <p className="mt-2 max-w-2xl leading-6 text-slate-600">Chọn gói phù hợp và gửi yêu cầu. Tài khoản School Admin chỉ được cấp sau khi thanh toán được xác nhận.</p>
          </div>
          <Link to="/login" className="whitespace-nowrap text-sm font-semibold text-orange-600 hover:text-orange-700">Đã có tài khoản? Đăng nhập</Link>
        </div>

        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.25fr]">
          <div className="space-y-5">
            <h2 className="text-lg font-bold">1. Thông tin quản trị ban đầu</h2>
            <label className="block text-sm font-medium">Tên trường
              <input required maxLength="255" value={form.school_name} onChange={(event) => update("school_name", event.target.value)} placeholder="Ví dụ: Trường Đại học FPT" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
            </label>
            <label className="block text-sm font-medium">Email nhận tài khoản School Admin
              <input required type="email" value={form.admin_email} onChange={(event) => update("admin_email", event.target.value)} placeholder="admin@school.edu.vn" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
            </label>
            <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Một email có thể đăng ký và quản lý nhiều trường học (đa trường). Nếu bạn đã có tài khoản EDUX từ trước, trường mới sẽ tự động được liên kết vào danh sách trường của bạn sau khi thanh toán thành công.
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">2. Chọn gói dịch vụ</h2><span className="text-xs text-slate-500">Giá lấy trực tiếp từ hệ thống</span></div>
            {plansLoading ? <p className="mt-5 text-sm text-slate-500">Đang tải các gói dịch vụ…</p> : plans.length === 0 ? <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">Hiện chưa có gói dịch vụ công khai.</p> : <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {plans.map((plan) => {
                  const chosen = form.plan_id === plan.id;
                  return <button type="button" key={plan.id} onClick={() => update("plan_id", plan.id)} className={`rounded-xl border p-4 text-left transition ${chosen ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500" : "border-slate-200 hover:border-orange-300"}`}>
                    <span className="font-bold">{plan.name}</span>
                    <span className="mt-1 block text-sm text-slate-500">{plan.description}</span>
                    <span className="mt-3 block font-semibold text-orange-700">Từ {formatCurrency(plan.price_monthly)} / tháng</span>
                  </button>;
                })}
              </div>
              <div className="mt-5 flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
                {[['monthly', 'Thanh toán tháng'], ['yearly', 'Thanh toán năm']].map(([value, label]) => <button key={value} type="button" onClick={() => update("billing_cycle", value)} className={`flex-1 rounded-md px-3 py-2 ${form.billing_cycle === value ? "bg-white text-orange-700 shadow-sm" : "text-slate-600"}`}>{label}</button>)}
              </div>
              <p className="mt-4 text-right text-lg font-bold">{formatCurrency(price)} <span className="text-sm font-normal text-slate-500">/ {form.billing_cycle === "yearly" ? "năm" : "tháng"}</span></p>
            </>}
          </div>

          <label className="flex items-start gap-3 text-sm leading-5 lg:col-span-2">
            <input required type="checkbox" checked={form.terms_accepted} onChange={(event) => update("terms_accepted", event.target.checked)} className="mt-1 h-4 w-4 accent-orange-500" />
            <span>Tôi đã đọc và đồng ý với Điều khoản sử dụng cùng Chính sách xử lý dữ liệu của EDUX.</span>
          </label>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 lg:col-span-2">{error}</p>}
          <div className="flex items-center gap-4 lg:col-span-2">
            <button disabled={plansLoading || plans.length === 0 || submitting} className="rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-orange-600">
              {submitting ? "Đang tạo yêu cầu…" : "Tạo yêu cầu đăng ký"}
            </button>
            <span className="text-sm text-slate-500">Chưa thực hiện thanh toán ở bước này.</span>
          </div>
        </form>
      </section>
    </main>
  );
}
