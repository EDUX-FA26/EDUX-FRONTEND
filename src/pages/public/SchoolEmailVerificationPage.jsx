import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifySchoolEmail } from "../../services/publicRegistrationApi";

export default function SchoolEmailVerificationPage() {
  const [params] = useSearchParams();
  const [state, setState] = useState({ loading: true, error: "", success: false });

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState({ loading: false, error: "Liên kết xác minh không hợp lệ.", success: false });
      return;
    }
    verifySchoolEmail(token)
      .then(() => setState({ loading: false, error: "", success: true }))
      .catch((error) =>
        setState({
          loading: false,
          error: error.response?.data?.message || "Không thể xác minh email.",
          success: false,
        })
      );
  }, [params]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="max-w-lg rounded-2xl bg-white p-7 shadow">
        {state.loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
            <p className="text-slate-600">Đang xác minh email…</p>
          </div>
        ) : state.error ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <span className="text-xl">✕</span>
            </div>
            <h1 className="mt-4 text-xl font-bold text-red-700">Không thể xác minh email</h1>
            <p className="mt-3 text-sm text-slate-600">{state.error}</p>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <span className="text-xl">✓</span>
            </div>
            <h1 className="mt-4 text-xl font-bold text-emerald-700">Email đã được xác minh!</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Bạn có thể <strong>đóng tab này</strong> và quay lại trang đăng ký.
              Trang thanh toán sẽ <strong>tự động cập nhật</strong> và hiển thị nút thanh toán PayOS.
            </p>
            <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
              💡 Trang đăng ký trường đang tự động kiểm tra trạng thái – không cần thao tác thêm!
            </div>
          </>
        )}
        <Link to="/login" className="mt-5 inline-flex font-semibold text-orange-600 hover:text-orange-700">
          Quay lại EDUX
        </Link>
      </section>
    </main>
  );
}
