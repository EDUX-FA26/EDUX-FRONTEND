import React, { useEffect, useState } from "react";
import { createManager, getManagers, setManagerStatus } from "../../services/platformApi";

const emptyForm = { email: "", username: "", password: "", fullName: "" };

export default function ManagersPage() {
  const [managers, setManagers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const result = await getManagers(); setManagers(result.data || []); }
    catch (error) { setMessage(error.response?.data?.message || "Không thể tải danh sách Manager."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault(); setMessage("");
    try { await createManager(form); setForm(emptyForm); setMessage("Đã tạo tài khoản Manager."); await load(); }
    catch (error) { setMessage(error.response?.data?.message || "Không thể tạo Manager."); }
  };
  const toggle = async (manager) => {
    setMessage("");
    try { await setManagerStatus(manager.id, !manager.is_active); await load(); }
    catch (error) { setMessage(error.response?.data?.message || "Không thể cập nhật trạng thái Manager."); }
  };

  return <main className="mx-auto max-w-6xl p-6">
    <h1 className="text-2xl font-bold text-slate-800">Quản lý Manager</h1>
    <p className="mt-1 text-sm text-slate-500">Manager là tài khoản Platform độc lập, không có quyền truy cập dữ liệu học tập của trường.</p>
    <form onSubmit={submit} className="mt-6 grid gap-3 rounded-xl border bg-white p-5 md:grid-cols-2">
      <input required placeholder="Họ tên" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="rounded border p-2" />
      <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded border p-2" />
      <input required placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="rounded border p-2" />
      <input required minLength="12" type="password" placeholder="Mật khẩu tối thiểu 12 ký tự" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded border p-2" />
      <button className="rounded bg-orange-500 px-4 py-2 font-semibold text-white md:col-span-2">Tạo Manager</button>
    </form>
    {message && <p className="mt-4 rounded bg-slate-100 p-3 text-sm">{message}</p>}
    <section className="mt-6 overflow-x-auto rounded-xl border bg-white p-5"><h2 className="font-bold">Danh sách tài khoản</h2>
      {loading ? <p className="mt-4 text-sm">Đang tải…</p> : <table className="mt-4 w-full text-left text-sm"><thead className="text-slate-500"><tr><th className="pb-3">Họ tên</th><th className="pb-3">Email</th><th className="pb-3">Trạng thái</th><th /></tr></thead><tbody>{managers.filter((item) => item.role === "manager").map((manager) => <tr key={manager.id} className="border-t"><td className="py-3">{manager.full_name || manager.username}</td><td>{manager.email}</td><td>{manager.is_active ? "Hoạt động" : "Đã khóa"}</td><td><button onClick={() => toggle(manager)} className="rounded border px-3 py-1.5">{manager.is_active ? "Khóa" : "Mở khóa"}</button></td></tr>)}</tbody></table>}
    </section>
  </main>;
}
