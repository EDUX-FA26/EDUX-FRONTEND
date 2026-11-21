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
import SuperadminLayout from "../../components/platform/SuperadminLayout";
import { broadcastNotification } from "../../services/platformApi";
import EduxAlert from "../../components/common/EduxAlert";

export default function SuperadminNotificationsPage() {
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
        return "Toàn bộ hệ thống";
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
      title: "Thông báo nâng cấp hạ tầng hệ thống EDUX",
      message: "Hệ thống sẽ tiến hành bảo trì máy chủ định kỳ vào cuối tuần để tối ưu hiệu năng. Kính báo Quý trường và Quý người dùng sắp xếp kế hoạch làm việc.",
      target: "all",
    },
    {
      title: "Thông báo chính sách biểu phí & gói dịch vụ mới",
      message: "EDUX vừa cập nhật các gói thuê bao với nhiều ưu đãi và hạn mức người dùng mở rộng. Quý trường vui lòng xem chi tiết tại trang Cài đặt trường.",
      target: "school_admin",
    },
    {
      title: "Cập nhật tính năng trợ lý AI và chấm điểm tự động",
      message: "Tính năng hỗ trợ học tập AI đã được kích hoạt cho toàn thể Giảng viên và Sinh viên. Chúc Quý Thầy/Cô và các bạn có trải nghiệm giảng dạy, học tập hiệu quả.",
      target: "all",
    },
  ];

  return (
    <SuperadminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1f1b17]">
              Phát sóng Thông báo Toàn nền tảng
            </h1>
            <p className="mt-1 text-sm text-[#545f73]">
              Quyền quản trị cao nhất: Phát thông điệp Socket.IO thời gian thực và gửi email tự động tới người nhận trên toàn bộ hệ thống EDUX.
            </p>
          </div>
        </div>

        {/* Success / Error Messages */}
        {successMsg && (
          <EduxAlert
            type="success"
            message={successMsg}
            title="Đã phát sóng thông báo"
            onClose={() => setSuccessMsg("")}
          />
        )}

        {error && (
          <EduxAlert
            type="error"
            message={error}
            title="Lỗi phát sóng"
            onClose={() => setError("")}
          />
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Broadcast Form (2 Cols) */}
          <div className="lg:col-span-2 rounded-2xl border border-[#f5ebe1] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[#f5ebe1] pb-4">
              <Radio className="h-5 w-5 text-[#f27024]" />
              <div>
                <h2 className="text-base font-bold text-[#1f1b17]">Tạo thông báo phát sóng mới (Superadmin)</h2>
                <p className="text-xs text-[#545f73]">Thông báo gửi qua Socket.IO thời gian thực, lưu vào thông báo hệ thống và chuyển phát email trực tiếp tới người nhận</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Target Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#545f73] mb-2">
                  1. Đối tượng tiếp nhận thông báo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: "all", label: "Toàn bộ hệ thống", desc: "Tất cả admin trường, giảng viên, sinh viên" },
                    { id: "school_admin", label: "Quản trị viên trường", desc: "Chỉ gửi đến các School Admin" },
                    { id: "lecturer", label: "Giảng viên", desc: "Chỉ gửi đến các tài khoản giảng viên" },
                    { id: "student", label: "Sinh viên", desc: "Chỉ gửi đến tài khoản sinh viên" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition ${
                        form.target === item.id
                          ? "border-[#f27024] bg-[#fff8f5] ring-1 ring-[#f27024]"
                          : "border-[#f5ebe1] hover:border-[#ffdbcc]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="target"
                        value={item.id}
                        checked={form.target === item.id}
                        onChange={(e) => setForm({ ...form, target: e.target.value })}
                        className="mt-1 h-4 w-4 accent-[#f27024]"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#1f1b17]">{item.label}</p>
                        <p className="text-[11px] text-[#545f73] mt-0.5">{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#545f73] mb-1.5">
                  2. Tiêu đề thông báo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thông báo quan trọng từ Ban Quản trị Hệ thống EDUX"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:ring-1 focus:ring-[#f27024]"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#545f73] mb-1.5">
                  3. Nội dung thông báo chi tiết
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Nhập nội dung thông báo đầy đủ gửi đến người nhận..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-xl border border-[#f5ebe1] bg-white p-3.5 text-sm text-[#1f1b17] focus:border-[#f27024] focus:ring-1 focus:ring-[#f27024]"
                />
              </div>

              {/* Submit button */}
              <div className="pt-2 flex items-center justify-between border-t border-[#f5ebe1]">
                <span className="text-xs text-[#8c7166]">
                  Đặc quyền Superadmin
                </span>
                <button
                  type="submit"
                  disabled={submitting || !form.title.trim() || !form.message.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f27024] px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#d95c14] disabled:opacity-50 transition"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Đang phát sóng…" : "Phát sóng thông báo"}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Templates & Guidelines Sidebar (1 Col) */}
          <div className="space-y-6">
            {/* Quick Templates */}
            <div className="rounded-2xl border border-[#f5ebe1] bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 border-b border-[#f5ebe1] pb-3">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-[#1f1b17]">Mẫu thông báo mẫu</h3>
              </div>

              <div className="mt-4 space-y-3">
                {templates.map((tmpl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setForm({ target: tmpl.target, title: tmpl.title, message: tmpl.message })}
                    className="group rounded-xl border border-[#f5ebe1] p-3 hover:border-[#f27024] hover:bg-[#fff8f5] cursor-pointer transition"
                  >
                    <p className="text-xs font-semibold text-[#1f1b17] group-hover:text-[#f27024]">
                      {tmpl.title}
                    </p>
                    <p className="text-[11px] text-[#545f73] line-clamp-2 mt-1">{tmpl.message}</p>
                    <span className="inline-block mt-2 text-[10px] font-medium text-[#8c7166] group-hover:text-[#f27024]">
                      Áp dụng mẫu này &rarr;
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Note & Guidelines */}
            <div className="rounded-2xl border border-[#ffdbcc] bg-[#fff8f5] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-[#f27024]" />
                <h4 className="text-xs font-bold text-[#1f1b17]">Quy chuẩn phát sóng</h4>
              </div>
              <ul className="space-y-1.5 text-xs text-[#545f73] list-disc list-inside">
                <li>Tất cả tài khoản Manager và Superadmin đều có quyền phát sóng thông báo.</li>
                <li>Thông báo hệ thống sẽ được đẩy ngay tới ứng dụng của người dùng online qua WebSockets.</li>
                <li>Toàn bộ thông báo được lưu vĩnh viễn trên hộp thư cá nhân của đối tượng được chọn.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Sent History in Current Session */}
        {sentHistory.length > 0 && (
          <div className="rounded-2xl border border-[#f5ebe1] bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#1f1b17] border-b border-[#f5ebe1] pb-3">
              Thông báo Superadmin đã phát sóng trong phiên ({sentHistory.length})
            </h3>
            <div className="mt-4 divide-y divide-[#f5ebe1]">
              {sentHistory.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#1f1b17]">{item.title}</span>
                      <span className="rounded bg-[#fff8f5] border border-[#ffdbcc] px-2 py-0.5 text-[10px] font-semibold text-[#f27024]">
                        {getTargetLabel(item.target)}
                      </span>
                    </div>
                    <p className="text-xs text-[#545f73] mt-1">{item.message}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-emerald-600">
                      {item.recipientCount} người nhận
                    </span>
                    <p className="text-[11px] text-[#8c7166] mt-0.5">
                      {new Date(item.sentAt).toLocaleTimeString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SuperadminLayout>
  );
}
