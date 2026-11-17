import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  createPayosCheckout,
  getSchoolRegistrationStatus,
  resendActivationEmail,
  resendVerificationEmail,
} from "../../services/publicRegistrationApi";

const REGISTRATION_SESSION_KEY = "edux:pending-school-registration";
const POLL_INTERVAL_MS = 3000;   // poll every 3s while waiting for email verification
const POLL_TIMEOUT_MS  = 600000; // stop polling after 10 minutes

function statusText(registration) {
  if (registration.status === "paid") return "Thanh toán đã được xác nhận";
  if (!registration.email_verified) return "Chờ xác minh email";
  if (registration.payment_status === "failed") return "Thanh toán chưa thành công";
  return "Chờ thanh toán";
}

function statusColor(registration) {
  if (registration.status === "paid") return "text-emerald-700";
  if (!registration.email_verified) return "text-amber-700";
  return "text-orange-700";
}

function errorMessage(error) {
  const code = error.response?.data?.message || error.message;
  if (code === "EMAIL_VERIFICATION_REQUIRED") return "Bạn cần xác minh email quản trị trước khi mở cổng thanh toán.";
  if (code === "EMAIL_ALREADY_VERIFIED") return "Email đã được xác minh. Bạn có thể thanh toán ngay.";
  return code || "Không thể thực hiện thao tác này. Vui lòng thử lại.";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function SchoolRegistrationPaymentPage() {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [trackingToken, setTrackingToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [justVerified, setJustVerified] = useState(false);
  const pollRef = useRef(null);
  const timeoutRef = useRef(null);

  // ─── Load registration status ──────────────────────────────
  const load = useCallback(async () => {
    const raw = sessionStorage.getItem(REGISTRATION_SESSION_KEY);
    if (!raw) throw new Error("REGISTRATION_SESSION_MISSING");
    const saved = JSON.parse(raw);
    if (saved?.id !== registrationId || !saved?.trackingToken) throw new Error("REGISTRATION_SESSION_MISSING");
    setTrackingToken(saved.trackingToken);
    const result = await getSchoolRegistrationStatus(registrationId, saved.trackingToken);
    setRegistration(result.data);
    return result.data;
  }, [registrationId]);

  // ─── Initial load ──────────────────────────────────────────
  useEffect(() => {
    let active = true;
    load()
      .catch((error) => { if (active) setMessage(errorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  // ─── Auto-polling: check email verification every 3s ───────
  useEffect(() => {
    // Only poll while waiting for email verification
    if (!registration || registration.email_verified || registration.status === "paid") {
      return;
    }

    const startTime = Date.now();

    pollRef.current = window.setInterval(async () => {
      // Stop polling after timeout
      if (Date.now() - startTime > POLL_TIMEOUT_MS) {
        window.clearInterval(pollRef.current);
        return;
      }
      try {
        const data = await load();
        if (data.email_verified) {
          // Email just got verified! Stop polling and show transition
          window.clearInterval(pollRef.current);
          setJustVerified(true);
        }
      } catch {
        // silent – keep polling
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [registration?.email_verified, registration?.status, load]);

  // ─── Auto-poll when returned from payment gateway ──────────
  useEffect(() => {
    if (!registration || registration.status === "paid") return;
    if (registration.email_verified && registration.payment_status === "pending") {
      // If we're waiting for payment confirmation, poll
      const interval = window.setInterval(() => { load().catch(() => {}); }, 5000);
      const timeout = window.setTimeout(() => window.clearInterval(interval), 120000);
      return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
    }
  }, [registration?.email_verified, registration?.payment_status, registration?.status, load]);

  // ─── Auto-clean session when paid ─────────────────────────
  useEffect(() => {
    if (registration?.status === "paid") {
      sessionStorage.removeItem(REGISTRATION_SESSION_KEY);
    }
  }, [registration?.status]);
  useEffect(() => {
    if (!justVerified) return;
    timeoutRef.current = window.setTimeout(() => {
      setJustVerified(false);
    }, 2500);
    return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); };
  }, [justVerified]);

  // ─── Resend verification email ─────────────────────────────
  const resendVerification = async () => {
    setSubmitting(true); setMessage("");
    try {
      const result = await resendVerificationEmail(registrationId, trackingToken);
      setMessage(
        result.data?.alreadyVerified ? "Email đã được xác minh. Bạn có thể thanh toán ngay."
          : result.data?.sent ? "Đã gửi lại email xác minh."
          : "Chưa gửi được email. Kiểm tra cấu hình SMTP và thử lại."
      );
      await load();
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setSubmitting(false); }
  };

  // ─── Checkout via PayOS ────────────────────────────────────
  const checkout = async () => {
    setSubmitting(true); setMessage("");
    try {
      const result = await createPayosCheckout(registrationId, trackingToken);
      // PayOS returns a checkoutUrl – redirect user to it
      window.location.assign(result.data.checkoutUrl);
    } catch (error) { setMessage(errorMessage(error)); setSubmitting(false); }
  };

  // ─── Resend activation email ───────────────────────────────
  const resendActivation = async () => {
    setSubmitting(true); setMessage("");
    try {
      const result = await resendActivationEmail(registrationId, trackingToken);
      setMessage(result.data?.sent ? "Đã gửi lại email kích hoạt." : "Chưa gửi được email. Kiểm tra SMTP và thử lại.");
      await load();
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setSubmitting(false); }
  };

  // ─── RENDER ────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wider text-orange-600">EDUX PAYMENT</p>
        <h1 className="mt-2 text-3xl font-bold">Hoàn tất đăng ký trường</h1>

        {loading ? (
          <p className="mt-6 text-slate-500">Đang tải trạng thái đăng ký…</p>
        ) : !registration ? (
          <>
            <p className="mt-4 text-red-700">{message || "Không tìm thấy phiên đăng ký trên trình duyệt này."}</p>
            <Link to="/register-school" className="mt-6 inline-flex font-semibold text-orange-600">Tạo yêu cầu mới</Link>
          </>
        ) : (
          <>
            {/* ── Just verified transition banner ── */}
            {justVerified && (
              <div className="mt-5 animate-pulse rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                <span className="mr-2 text-lg">✅</span>
                <strong>Email đã được xác minh thành công!</strong> Bạn có thể thanh toán ngay bên dưới.
              </div>
            )}

            {/* ── Registration info ── */}
            <dl className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Trường</dt>
                <dd className="mt-1 font-semibold">{registration.school_name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Mã yêu cầu</dt>
                <dd className="mt-1 break-all font-semibold">{registration.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Trạng thái</dt>
                <dd className={`mt-1 font-semibold ${statusColor(registration)}`}>{statusText(registration)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Tổng thanh toán</dt>
                <dd className="mt-1 font-semibold">
                  {formatCurrency(registration.price_snapshot)} / {registration.billing_cycle === "yearly" ? "năm" : "tháng"}
                </dd>
              </div>
            </dl>

            {/* ── State: PAID ── */}
            {/* ── State: PAID ── */}
            {registration.status === "paid" ? (
              <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
                <strong>Thanh toán đã được xác nhận thành công!</strong><br />
                Trường học của bạn đã được kích hoạt trên hệ thống EDUX. Thông tin đăng nhập và quản trị đã được gửi vào email quản trị.
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    to="/login"
                    onClick={() => sessionStorage.removeItem(REGISTRATION_SESSION_KEY)}
                    className="inline-flex rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                  >
                    Đăng nhập hệ thống ngay
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.removeItem(REGISTRATION_SESSION_KEY);
                      navigate("/register-school", { replace: true });
                    }}
                    className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Đăng ký trường mới khác
                  </button>
                </div>
              </div>
            ) : !registration.email_verified ? (
              /* ── State: WAITING FOR EMAIL VERIFICATION ── */
              <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
                <strong>Xác minh email trước.</strong><br />
                Một liên kết xác minh đã được gửi đến email quản trị. 
                <span className="font-medium"> Trang này sẽ tự động chuyển sang thanh toán khi email được xác minh.</span>
                {/* Pulsing indicator */}
                <div className="mt-3 flex items-center gap-2 text-amber-700">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
                  </span>
                  <span className="text-xs">Đang chờ xác minh…</span>
                </div>
                <button disabled={submitting} onClick={resendVerification} className="mt-3 block font-semibold text-amber-800 underline disabled:opacity-50">
                  Gửi lại email xác minh
                </button>
              </div>
            ) : (
              /* ── State: EMAIL VERIFIED → CHECKOUT ── */
              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
                <strong>Thanh toán qua PayOS (VietQR).</strong><br />
                EDUX sẽ tạo mã QR thanh toán qua PayOS. Sau khi quét mã và chuyển khoản thành công, hệ thống sẽ tự động xác nhận.
                <button
                  disabled={submitting}
                  onClick={checkout}
                  className="mt-4 inline-flex rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {submitting ? "Đang tạo thanh toán…" : "Thanh toán qua PayOS"}
                </button>
              </div>
            )}

            {message && <p className="mt-5 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
            
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <Link
                to="/login"
                onClick={() => {
                  if (registration?.status === "paid") {
                    sessionStorage.removeItem(REGISTRATION_SESSION_KEY);
                  }
                }}
                className="text-sm font-semibold text-slate-600 hover:text-orange-600"
              >
                ← Quay lại đăng nhập
              </Link>

              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem(REGISTRATION_SESSION_KEY);
                  navigate("/register-school", { replace: true });
                }}
                className="text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline"
              >
                Hủy phiên này & Đăng ký trường mới khác →
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
