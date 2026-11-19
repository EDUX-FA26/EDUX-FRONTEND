import React from "react";
import { Check, Lightbulb, X } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

/**
 * Centered bold exclamation mark icon matching the warning badge in design reference.
 */
function ExclamationMarkIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M12 3.75a1.25 1.25 0 011.25 1.25v8.5a1.25 1.25 0 01-2.5 0v-8.5A1.25 1.25 0 0112 3.75zm0 13.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Modern Alert component matching the clean pill card design with solid circular icon badges
 * as shown in the reference design (Success, Info, Warning, Error).
 * Supports types: 'success' | 'error' | 'warning' | 'info'
 */
export default function EduxAlert({
  type = "info",
  title,
  message,
  onClose,
  className = "",
  actions,
}) {
  let lang = "vi";
  try {
    const langContext = useLanguage();
    if (langContext && langContext.language) {
      lang = langContext.language;
    }
  } catch {
    lang = "vi";
  }

  if (!message && !title) return null;

  const isEn = lang === "en";

  const config = {
    success: {
      container: "bg-[#f2fcf4] border-[#86efac] text-[#0f172a] shadow-[0_2px_12px_rgba(34,197,94,0.08)]",
      badge: "bg-[#22c55e] text-white shadow-sm shadow-green-500/25",
      icon: Check,
      defaultTitle: isEn ? "Congratulations!" : "Thành công!",
    },
    info: {
      container: "bg-[#f0f7ff] border-[#93c5fd] text-[#0f172a] shadow-[0_2px_12px_rgba(59,130,246,0.08)]",
      badge: "bg-[#3b82f6] text-white shadow-sm shadow-blue-500/25",
      icon: Lightbulb,
      defaultTitle: isEn ? "Did you know?" : "Thông tin hệ thống",
    },
    warning: {
      container: "bg-[#fefcf0] border-[#fde047] text-[#0f172a] shadow-[0_2px_12px_rgba(234,179,8,0.08)]",
      badge: "bg-[#f59e0b] text-white shadow-sm shadow-amber-500/25",
      icon: ExclamationMarkIcon,
      defaultTitle: isEn ? "Warning!" : "Cảnh báo!",
    },
    error: {
      container: "bg-[#fef2f2] border-[#fca5a5] text-[#0f172a] shadow-[0_2px_12px_rgba(239,68,68,0.08)]",
      badge: "bg-[#ef4444] text-white shadow-sm shadow-red-500/25",
      icon: X,
      defaultTitle: isEn ? "Something went wrong!" : "Đã xảy ra lỗi!",
    },
  }[type] || {
    container: "bg-[#f0f7ff] border-[#93c5fd] text-[#0f172a]",
    badge: "bg-[#3b82f6] text-white",
    icon: Lightbulb,
    defaultTitle: isEn ? "Notice" : "Thông báo",
  };

  const IconComponent = config.icon;
  const displayTitle = title || config.defaultTitle;

  return (
    <div
      role="alert"
      className={`relative flex items-center justify-between gap-3.5 rounded-2xl border-[1.5px] px-4 py-3 sm:px-5 sm:py-3.5 transition-all duration-300 ${config.container} ${className}`}
    >
      {/* Left circular badge + Text content */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <div className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full ${config.badge}`}>
          <IconComponent className="h-5 w-5 stroke-[2.5]" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-[15px] font-bold tracking-tight text-[#0f172a] leading-tight">
            {displayTitle}
          </h4>
          {message && (
            <div className="text-xs sm:text-[13px] text-[#64748b] mt-0.5 leading-relaxed font-normal">
              {message}
            </div>
          )}
          {actions && <div className="mt-2.5 flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Close button on right */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={isEn ? "Close alert" : "Đóng thông báo"}
          className="shrink-0 p-1.5 rounded-full text-[#94a3b8] hover:text-[#475569] hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
