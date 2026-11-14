import React, { useEffect, useState } from "react";
import { getSchoolSettings, updateSchoolSettings } from "../../services/schoolApi";

const fields = [
  ["name", "Tên trường", true], ["logo_url", "URL logo", false], ["address", "Địa chỉ", false],
  ["contact_email", "Email liên hệ", false], ["contact_phone", "Số điện thoại", false],
  ["website", "Website", false], ["description", "Mô tả", false],
];

export default function SchoolSettingsPage() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => { getSchoolSettings().then((result) => setForm(result.data || {})).catch((e) => setMessage(e.response?.data?.message || "Không thể tải thông tin trường.")).finally(() => setLoading(false)); }, []);
  const save = async (event) => {
    event.preventDefault(); setMessage("");
    try { const result = await updateSchoolSettings(form); setForm(result.data); setMessage("Đã lưu thông tin trường."); }
    catch (e) { setMessage(e.response?.data?.message || "Không thể lưu thay đổi."); }
  };
  if (loading) return <p className="p-6">Đang tải thông tin trường…</p>;
  return <main className="mx-auto max-w-3xl p-6"><h1 className="text-2xl font-bold">School Settings</h1><p className="mt-2 text-sm text-slate-500">Mã trường: {form.code}</p><form onSubmit={save} className="mt-6 grid gap-4 rounded-xl border bg-white p-6">{fields.map(([key, label, required]) => <label key={key} className="grid gap-1 text-sm font-medium">{label}{key === "description" ? <textarea value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="min-h-28 rounded border p-2" /> : <input required={required} type={key === "contact_email" ? "email" : "text"} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="rounded border p-2" />}</label>)}<button className="rounded bg-orange-500 px-4 py-2 font-semibold text-white">Lưu thay đổi</button>{message && <p className="text-sm">{message}</p>}</form></main>;
}
