import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeSchoolSetup } from "../../services/schoolApi";

export default function SchoolSetupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", address: "", contact_email: "", contact_phone: "" });
  const [error, setError] = useState("");
  const submit = async (event) => { event.preventDefault(); setError(""); try { await completeSchoolSetup(form); navigate("/admin/school-settings", { replace: true }); } catch (e) { setError(e.response?.data?.message || "Không thể hoàn tất thiết lập."); } };
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><form onSubmit={submit} className="w-full max-w-xl rounded-2xl bg-white p-8 shadow"><p className="text-sm font-bold text-orange-600">EDUX SCHOOL ONBOARDING</p><h1 className="mt-2 text-2xl font-bold">Thiết lập trường học</h1><p className="mt-2 text-sm text-slate-500">Hoàn tất thông tin trường trước khi chọn gói sử dụng.</p><div className="mt-6 grid gap-4">{[["name", "Tên trường", true], ["address", "Địa chỉ"], ["contact_email", "Email liên hệ"], ["contact_phone", "Số điện thoại"], ["website", "Website"], ["logo_url", "URL logo"]].map(([key, label, required]) => <label key={key} className="grid gap-1 text-sm font-medium">{label}<input required={required} type={key === "contact_email" ? "email" : "text"} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="rounded border p-2" /></label>)}</div>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}<button className="mt-6 rounded bg-orange-500 px-4 py-2 font-semibold text-white">Hoàn tất và chọn gói</button></form></main>;
}
