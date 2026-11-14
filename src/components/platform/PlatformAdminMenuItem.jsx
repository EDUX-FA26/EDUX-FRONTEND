
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowUpRight } from "lucide-react";

import api from "../../config/axios.config";
import { useAuth } from "../../contexts/AuthContext";

// ==========================================
// PLATFORM ADMIN MENU ITEM
// Visible only to verified Platform Admins
// ==========================================

export default function PlatformAdminMenuItem({
  onNavigate,
}) {
  const { user, isAuthenticated } = useAuth();

  const [isPlatformAdmin, setIsPlatformAdmin] =
    useState(false);

  useEffect(() => {
    let active = true;

    setIsPlatformAdmin(false);

    if (!isAuthenticated || !user?.id) {
      return;
    }

    const controller = new AbortController();

    // Global API: no X-School-Id required.
    api.get("/platform/me", {
      signal: controller.signal,
    })
      .then((response) => {
        if (!active) return;

        const platformAdmin =
          response.data?.platformAdmin;

        setIsPlatformAdmin(
          response.data?.success === true &&
          platformAdmin?.role === "platform_admin" &&
          platformAdmin?.userId === user.id
        );
      })
      .catch(() => {
        if (active) {
          setIsPlatformAdmin(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [isAuthenticated, user?.id]);

  if (!isPlatformAdmin) {
    return null;
  }

  return (
    <Link
      to="/platform"
      onClick={onNavigate}
      className="
        flex w-full items-center gap-3
        rounded-xl px-3 py-3
        text-left transition-all
        hover:bg-[#fff0e4]
        group
      "
    >
      <div
        className="
          flex h-10 w-10 shrink-0
          items-center justify-center
          rounded-xl bg-[#fff0e4]
          text-[#e96f20]
        "
      >
        <ShieldCheck size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#25344b]">
          Quản trị nền tảng
        </p>

        <p className="mt-0.5 text-xs text-[#938276]">
          EDUX Super Admin
        </p>
      </div>

      <ArrowUpRight
        size={17}
        className="
          text-[#a69589]
          transition-transform
          group-hover:-translate-y-0.5
          group-hover:translate-x-0.5
          group-hover:text-[#e96f20]
        "
      />
    </Link>
  );
}
