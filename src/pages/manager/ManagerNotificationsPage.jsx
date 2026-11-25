import React, { useState } from "react";
import {
  Bell,
  Send,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  Radio,
  Sparkles,
} from "lucide-react";
import ManagerLayout from "../../components/platform/ManagerLayout";
import EduxAlert from "../../components/common/EduxAlert";
import { broadcastNotification } from "../../services/platformApi";

export default function ManagerNotificationsPage() {
  const [form, setForm] = useState({
    target: "all",
    title: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [sentHistory, setSentHistory] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;

    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await broadcastNotification({
        target: form.target,
        title: form.title.trim(),
        message: form.message.trim(),
      });
      const count = res.data?.count ?? 0;
      const emailsQueued = res.data?.recipient_emails_count ?? count;
      const successText = `Đã phát sóng thông báo thành công tới ${count} người dùng và chuyển phát email tới ${emailsQueued} hộp thư (${getTargetLabel(form.target)})!`;
      setSuccessMsg(successText);

      // Save to local sent history
      setSentHistory((prev) => [
        {
          id: Date.now(),
          target: form.target,
          title: form.title.trim(),
          message: form.message.trim(),
          recipientCount: count,
          sentAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      // Reset form
      setForm({ target: "all", title: "", message: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể phát sóng thông báo.");
    } finally {
      setSubmitting(false);
    }
  };

  const getTargetLabel = (target) => {
    switch (target) {
      case "all":
        return "Toàn bộ người dùng";
      case "school_admin":
        return "Quản trị viên trường (School Admins)";
      case "lecturer":
        return "Giảng viên (Lecturers)";
      case "student":
        return "Sinh viên (Students)";
      default:
        return target;
    }
  };

  const templates = [
    {
      title: "Thông báo bảo trì hệ thống định kỳ",
      message: "Hệ thống EDUX sẽ tiến hành bảo trì hạ tầng từ 00:00 đến 02:00 ngày Chủ Nhật. Các dịch vụ học vụ có thể bị gián đoạn ngắn trong khoảng thời gian này.",
      target: "all",
    },
    {
      title: "Nhắc nhở kiểm tra thời hạn thuê bao trường",
      message: "Quý Quản trị viên vui lòng kiểm tra mục Cài đặt trường / Billing để cập nhật hạn sử dụng và chuẩn bị kế hoạch gia hạn dịch vụ không bị gián đoạn.",
      target: "school_admin",
    },
    {
      title: "Cập nhật tính năng nền tảng EDUX mới",
      message: "EDUX vừa bổ sung thêm các tính năng nâng cao cho quá trình giảng dạy và quản lý học vụ. Xem chi tiết tại mục Hướng dẫn & Trợ giúp.",
      target: "all",
    },
  ];

  return (
    <ManagerLayout>
      <div className="w-full max-w-[1600px] mx-auto min-w-0 h-[calc(100vh-var(--dashboard-header-height,64px))] overflow-hidden flex flex-col px-4 sm:px-5 lg:px-6 xl:px-8 pt-4 pb-4 box-border animate-fade-in">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-[#FFEDD5] via-[#FED7AA]/90 to-[#FDBA74]/85 border border-orange-300/80 rounded-2xl px-5 py-4 shadow-xs mb-5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 m-0">
            Thông báo & Vận hành Nền tảng
          </h1>
          <p className="text-sm text-slate-700 font-medium mt-1 m-0">
            Phát sóng thông điệp vận hành, lịch bảo trì và thông báo gia hạn tới các trường học trên toàn hệ thống.
          </p>
        </div>

        {/* Success / Error Messages */}
        {successMsg && (
          <div className="shrink-0 mb-3">
            <EduxAlert
              type="success"
              message={successMsg}
              onClose={() => setSuccessMsg("")}
            />
          </div>
        )}

        {error && (
          <div className="shrink-0 mb-3">
            <EduxAlert
              type="error"
              message={error}
              onClose={() => setError("")}
            />
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Main Broadcast Form (7 Cols) */}
          <div className="lg:col-span-7 h-full min-h-0 min-w-0 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-xs">
            {/* Card Header (Fixed) */}
            <div className="shrink-0 px-5 pt-3.5 pb-2.5 border-b border-slate-100 flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#f27024]" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Tạo thông báo phát sóng mới (Manager)</h2>
                <p className="text-[11px] text-slate-500">
                  Gửi qua Socket.IO thời gian thực, thông báo hệ thống và email trực tiếp tới người nhận
                </p>
              </div>
            </div>

            {/* Form with inner scrollable fields and pinned bottom submit */}
            <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3.5 space-y-3.5">
                {/* Target Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    1. Đối tượng tiếp nhận thông báo
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: "all", label: "Toàn bộ hệ thống", desc: "Tất cả admin trường, giảng viên, sinh viên" },
                      { id: "school_admin", label: "Quản trị viên trường", desc: "Chỉ gửi đến các School Admin" },
                      { id: "lecturer", label: "Giảng viên", desc: "Chỉ gửi đến các tài khoản giảng viên" },
                      { id: "student", label: "Sinh viên", desc: "Chỉ gửi đến tài khoản sinh viên" },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition ${
                          form.target === item.id
                            ? "border-[#f27024] bg-[#fff8f5] ring-1 ring-[#f27024]"
                            : "border-slate-200 hover:border-[#ffdbcc]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="target"
                          value={item.id}
                          checked={form.target === item.id}
                          onChange={(e) => setForm({ ...form, target: e.target.value })}
                          className="mt-0.5 h-3.5 w-3.5 accent-[#f27024]"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    2. Tiêu đề thông báo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Thông báo kế hoạch bảo trì máy chủ định kỳ"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 focus:border-[#f27024] focus:outline-none focus:ring-1 focus:ring-[#f27024]"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    3. Nội dung thông báo chi tiết
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Nhập nội dung thông báo đầy đủ gửi đến người nhận..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-[#f27024] focus:outline-none focus:ring-1 focus:ring-[#f27024]"
                  />
                </div>
              </div>

              {/* Card Footer: Pinned at bottom */}
              <div className="shrink-0 px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Phát sóng tức thì với quyền Manager
                </span>
                <button
                  type="submit"
                  disabled={submitting || !form.title.trim() || !form.message.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#f27024] px-4 h-9 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#d95c14] disabled:opacity-50 transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  {submitting ? "Đang phát sóng…" : "Phát sóng thông báo"}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Templates & Guidelines Sidebar (5 Cols) */}
          <div className="lg:col-span-5 h-full min-h-0 min-w-0 overflow-y-auto pr-1 space-y-3.5">
            {/* Quick Templates */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900">Mẫu thông báo sẵn có</h3>
              </div>

              <div className="mt-3 space-y-2.5">
                {templates.map((tmpl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setForm({ target: tmpl.target, title: tmpl.title, message: tmpl.message })}
                    className="group rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 hover:border-[#f27024] hover:bg-[#fff8f5] cursor-pointer transition"
                  >
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-[#f27024]">
                      {tmpl.title}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{tmpl.message}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-medium text-slate-400 group-hover:text-[#f27024]">
                      Áp dụng mẫu này &rarr;
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Note & Guidelines */}
            <div className="rounded-2xl border border-[#ffdbcc] bg-[#fff8f5] p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-[#f27024]" />
                <h4 className="text-xs font-bold text-slate-900">Lưu ý khi phát sóng</h4>
              </div>
              <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                <li>Thông báo sẽ hiển thị ngay tại thanh thông báo của người dùng đang online.</li>
                <li>Người dùng offline sẽ nhận được thông báo khi đăng nhập lần tiếp theo.</li>
                <li>Hệ thống đồng thời phân phát email hàng loạt tới hòm thư cá nhân của đối tượng được chọn.</li>
                <li>Không sử dụng kênh phát sóng để gửi thông tin mật khẩu hay dữ liệu nhạy cảm.</li>
              </ul>
            </div>

            {/* Sent History in Current Session */}
            {sentHistory.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Thông báo đã phát sóng trong phiên này ({sentHistory.length})
                </h3>
                <div className="mt-2 divide-y divide-slate-100">
                  {sentHistory.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-slate-900 truncate">{item.title}</span>
                          <span className="rounded bg-[#fff8f5] border border-[#ffdbcc] px-1.5 py-0.2 text-[10px] font-semibold text-[#f27024]">
                            {getTargetLabel(item.target)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.message}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-semibold text-emerald-600">
                          {item.recipientCount} người
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(item.sentAt).toLocaleTimeString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ManagerLayout>
  );
}
