import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { completeSchoolAdminActivation, getSchoolAdminActivation } from "../../services/publicRegistrationApi";

export default function SchoolAdminActivationPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [details, setDetails] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  useEffect(() => { if (!token) { setMessage("Liên kết kích hoạt không hợp lệ."); setLoading(false); return; } getSchoolAdminActivation(token).then((result) => setDetails(result.data)).catch((error) => setMessage(error.response?.data?.message || "Liên kết kích hoạt không hợp lệ hoặc đã hết hạn.")).finally(() => setLoading(false)); }, [token]);
  const submit = async (event) => { event.preventDefault(); setMessage(""); if (password.length < 12) { setMessage("Mật khẩu cần tối thiểu 12 ký tự."); return; } if (password !== confirm) { setMessage("Hai mật khẩu chưa khớp."); return; } setSaving(true); try { await completeSchoolAdminActivation(token, password); setCompleted(true); } catch (error) { setMessage(error.response?.data?.message || "Không thể tạo mật khẩu."); } finally { setSaving(false); } };
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><section className="w-full max-w-lg rounded-2xl bg-white p-7 shadow"><p className="text-sm font-bold text-orange-600">EDUX SCHOOL ADMIN</p><h1 className="mt-2 text-2xl font-bold">Kích hoạt tài khoản quản trị</h1>{loading ? <p className="mt-5 text-slate-600">Đang kiểm tra liên kết…</p> : completed ? <><p className="mt-4 leading-6 text-emerald-700">Đã tạo mật khẩu. Bạn có thể đăng nhập bằng email quản trị và hoàn thiện thông tin trường sau đó.</p><Link to="/login" className="mt-6 inline-flex rounded-lg bg-orange-500 px-4 py-2.5 font-semibold text-white">Đăng nhập EDUX</Link></> : !details ? <p className="mt-5 text-sm text-red-700">{message}</p> : <form onSubmit={submit} className="mt-6 space-y-4"><p className="text-sm text-slate-600">Trường: <strong>{details.school_name}</strong><br />Email: <strong>{details.email}</strong></p><label className="block text-sm font-medium">Mật khẩu mới<input required minLength="12" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label><label className="block text-sm font-medium">Nhập lại mật khẩu<input required minLength="12" type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5" /></label>{message && <p className="text-sm text-red-700">{message}</p>}<button disabled={saving} className="rounded-lg bg-orange-500 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? "Đang lưu…" : "Tạo mật khẩu và kích hoạt"}</button></form>}</section></main>;
}
