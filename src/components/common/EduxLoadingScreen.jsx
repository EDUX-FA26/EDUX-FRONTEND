
import React from "react";

import {
  School2,
  LoaderCircle,
} from "lucide-react";

import { useTheme } from "../../contexts/ThemeContext";

export default function EduxLoadingScreen({
  title = "Đang chuẩn bị EDUX",
  description = "Hệ thống đang chuẩn bị không gian học tập của bạn.",
}) {
  const { isDark } = useTheme();

  return (
    <div
      className="
        flex min-h-screen w-full
        items-center justify-center
        px-4 transition-colors duration-300
      "
      style={{
        backgroundColor: isDark
          ? "#1f1712"
          : "#fffaf7",
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center text-center">

        {/* ANIMATED ICON */}

        <div className="relative mb-7 flex items-center justify-center">
          <div
            className="
              absolute h-28 w-28
              rounded-full bg-orange-500/10
              animate-ping
            "
            aria-hidden="true"
          />

          <div
            className="
              absolute h-28 w-28
              rounded-full border
              border-orange-400/40
            "
            aria-hidden="true"
          />

          <div
            className="
              relative z-10
              flex h-20 w-20
              items-center justify-center
              rounded-3xl
              bg-gradient-to-br
              from-[#ff914d] to-[#f36a20]
              shadow-xl shadow-orange-500/20
              animate-pulse
            "
          >
            <School2
              size={36}
              strokeWidth={1.8}
              className="text-white"
            />
          </div>
        </div>

        {/* BRAND */}

        <h2
          className="text-2xl font-extrabold tracking-widest"
          style={{
            color: "#f36a20",
          }}
        >
          EDUX
        </h2>

        {/* TITLE */}

        <h3
          className="mt-4 text-lg font-bold"
          style={{
            color: isDark
              ? "#f5eee8"
              : "#302722",
          }}
        >
          {title}
        </h3>

        {/* DESCRIPTION */}

        <p
          className="
            mt-2 max-w-sm
            text-sm leading-relaxed
          "
          style={{
            color: isDark
              ? "#b9aaa0"
              : "#82736a",
          }}
        >
          {description}
        </p>

        {/* SPINNER */}

        <div
          className="
            mt-6 flex items-center
            gap-2 text-sm font-semibold
          "
          style={{
            color: "#f36a20",
          }}
        >
          <LoaderCircle
            size={18}
            className="animate-spin"
            aria-hidden="true"
          />

          <span>
            Vui lòng chờ trong giây lát...
          </span>
        </div>

        {/* LOADING BAR */}

        <div
          className="
            mt-5 h-1 w-52
            overflow-hidden rounded-full
          "
          style={{
            backgroundColor: isDark
              ? "#493126"
              : "#ffe6d5",
          }}
          aria-hidden="true"
        >
          <div
            className="
              h-full w-1/2
              rounded-full
              bg-gradient-to-r
              from-orange-400 to-orange-600
              animate-pulse
            "
          />
        </div>

        {/* FOOTER */}

        <p
          className="mt-8 text-xs"
          style={{
            color: isDark
              ? "#9e8a7d"
              : "#a6968b",
          }}
        >
          EDUX · Smart Learning Platform
        </p>

      </div>
    </div>
  );
}
