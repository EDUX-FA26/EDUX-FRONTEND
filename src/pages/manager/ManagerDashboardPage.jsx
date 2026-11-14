import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, FileText, ReceiptText, RefreshCw } from "lucide-react";
import api from "../../config/axios.config";

function Metric({ label, value, icon: Icon }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <Icon className="text-orange-500" size={22} />
    <p className="mt-4 text-3xl font-bold text-slate-800">{Number(value || 0).toLocaleString("vi-VN")}</p>
    <p className="mt-1 text-sm text-slate-500">{label}</p>
  </article>;
}

export default function ManagerDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [schools, subscriptions, transactions] = await Promise.all([
        api.get("/platform/schools", { params: { limit: 1 } }),
        api.get("/platform/subscriptions", { params: { limit: 1 } }),
        api.get("/platform/transactions", { params: { limit: 8 } }),
      ]);
      setData({ schools: schools.data.data, subscriptions: subscriptions.data.data, transactions: transactions.data.data });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Không thể tải dữ liệu vận hành.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const recent = data?.transactions?.items || [];

  return <main className="min-h-screen bg-slate-50 p-6 text-slate-800 md:p-10">
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm font-semibold text-orange-600">EDUX PLATFORM</p><h1 className="text-3xl font-bold">Manager Dashboard</h1></div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold"><RefreshCw size={16} /> Làm mới</button>
      </header>
      {error && <p className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      <section className="grid gap-4 md:grid-cols-3">
        <Metric icon={Building2} label="Tổng tenant" value={data?.schools?.pagination?.total} />
        <Metric icon={FileText} label="Hợp đồng" value={data?.subscriptions?.pagination?.total} />
        <Metric icon={ReceiptText} label="Giao dịch gần đây" value={recent.length} />
      </section>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Giao dịch VNPay gần đây</h2><Link className="text-sm font-semibold text-orange-600" to="/manager/transactions">Xem tất cả</Link></div>
        {loading ? <p className="mt-5 text-slate-500">Đang tải…</p> : <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-500"><tr><th className="pb-3">Mã</th><th className="pb-3">Trường</th><th className="pb-3">Số tiền</th><th className="pb-3">Trạng thái</th></tr></thead><tbody>{recent.map((transaction) => <tr key={transaction.id} className="border-t"><td className="py-3">{transaction.order_reference}</td><td>{transaction.school_name || transaction.school_code}</td><td>{Number(transaction.amount || 0).toLocaleString("vi-VN")} đ</td><td>{transaction.status}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  </main>;
}
