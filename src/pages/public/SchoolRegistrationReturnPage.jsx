import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const REGISTRATION_SESSION_KEY = "edux:pending-school-registration";

export default function SchoolRegistrationReturnPage() {
  const navigate = useNavigate();
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(REGISTRATION_SESSION_KEY) || "null");
      if (!saved?.id || !saved?.trackingToken) { setMissing(true); return; }
      navigate(`/register-school/payment/${saved.id}?return=1`, { replace: true });
    } catch { setMissing(true); }
  }, [navigate]);
  if (!missing) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-600">Đang kiểm tra xác nhận thanh toán từ PayOS…</main>;
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><section className="max-w-lg rounded-2xl bg-white p-7 shadow"><h1 className="text-xl font-bold">Không tìm thấy phiên đăng ký</h1><p className="mt-3 text-sm leading-6 text-slate-600">Hãy mở liên kết trên cùng trình duyệt đã bắt đầu đăng ký, hoặc liên hệ hỗ trợ với mã giao dịch PayOS.</p><Link to="/login" className="mt-5 inline-flex font-semibold text-orange-600">Quay lại đăng nhập</Link></section></main>;
}
