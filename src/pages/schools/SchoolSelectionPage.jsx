
import React, { useState } from "react";
import { Navigate } from "react-router-dom";

import {
  School,
  GraduationCap,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  LogOut,
  RefreshCw,
  LoaderCircle,
  Layers3,
  AlertCircle,
  LockKeyhole,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { useSchool } from "../../contexts/SchoolContext";

// ============================================
// ROLE HELPERS
// ============================================

const ROLE_CONFIG = {
  student: {
    label: "Sinh viên",
    icon: GraduationCap,
  },
  lecturer: {
    label: "Giảng viên",
    icon: BookOpen,
  },
  school_admin: {
    label: "Quản trị trường",
    icon: ShieldCheck,
  },
};

function getRoleConfig(role) {
  return (
    ROLE_CONFIG[role] || {
      label: role || "Thành viên",
      icon: GraduationCap,
    }
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SchoolSelectionPage() {
  const { isAuthenticated, logout } = useAuth();

  const {
    schools = [],
    currentSchool,
    status,
    error,
    selectSchool,
    refreshSchools,
  } = useSchool();

  const [selectingId, setSelectingId] = useState(null);
  const [selectError, setSelectError] = useState("");

  // Selected school from verified SchoolContext
  const currentSchoolId =
    currentSchool?.schoolId || currentSchool?.id;

  const isLoading =
    status === "loading" || status === "idle";

  // ==========================================
  // AUTH GUARD
  // ==========================================

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Keep existing single-school behavior
  if (status === "ready" && schools.length === 1) {
    return <Navigate to="/" replace />;
  }

  // ==========================================
  // SELECT SCHOOL
  // ==========================================

  async function handleSelect(schoolId) {
    if (selectingId) return;

    setSelectingId(schoolId);
    setSelectError("");

    try {
      const success = await selectSchool(schoolId);

      if (!success) {
        setSelectError(
          "Không thể chọn trường. Vui lòng thử lại."
        );
        return;
      }

      // Clear UI state, Socket connections
      // and in-memory caches after switching.
      window.location.replace("/");
    } catch (err) {
      setSelectError(
        err.response?.data?.message ||
        err.message ||
        "Không thể chuyển trường."
      );
    } finally {
      setSelectingId(null);
    }
  }

  async function handleLogout() {
    await logout();
    window.location.replace("/login");
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-[#fcf8f5] text-[#182239]">

      {/* ======================================
          TOP HEADER
      ====================================== */}

      <header className="border-b border-[#f0e5dd] bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">

          <div className="flex items-center gap-3">
            {/* EDUX LOGO */}
            <div className="rounded-xl bg-[#f97320] px-4 py-2.5 shadow-sm">
              <span className="text-xl font-black tracking-[0.12em] text-white">
                EDUX
              </span>
            </div>

            <div className="hidden border-l border-[#e8ddd5] pl-3 sm:block">
              <p className="text-sm font-bold text-[#26344c]">
                Learning Platform
              </p>

              <p className="text-xs text-[#927d70]">
                Multi-Tenant Workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-[#f0e0d5] bg-[#fff8f3] px-4 py-2.5 text-sm font-semibold text-[#99450d] transition hover:border-[#f97320] hover:bg-[#ffecdf]"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>

        </div>
      </header>

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <main className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-8 sm:pt-12">

        {/* ====================================
            HERO BANNER
        ==================================== */}

        <section
          className="relative overflow-hidden rounded-[28px] px-7 py-9 text-white shadow-xl shadow-slate-900/10 sm:px-11 sm:py-12"
          style={{
            background:
              "linear-gradient(125deg, #121c30 0%, #1d2b41 58%, #35445b 100%)",
          }}
        >

          {/* Decorative gradients */}
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(249,115,32,0.22), transparent 70%)",
            }}
          />

          <div
            className="pointer-events-none absolute -bottom-36 right-40 h-64 w-64 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.07), transparent 70%)",
            }}
          />

          <div className="relative z-10">

            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-orange-100">
              <span className="h-2 w-2 rounded-full bg-[#f97320]" />
              EDUX SCHOOL WORKSPACE
            </div>

            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

              <div className="max-w-2xl">
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                  Chọn không gian
                  <span className="block text-[#ffae75]">
                    trường học của bạn.
                  </span>
                </h1>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                  Một tài khoản EDUX có thể tham gia nhiều
                  trường học. Hãy chọn trường mà bạn muốn
                  học tập hoặc làm việc.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f97320]/20 text-[#ffae75]">
                  <School size={25} />
                </div>

                <div>
                  <p className="text-2xl font-extrabold">
                    {schools.length}
                  </p>

                  <p className="text-xs font-medium text-slate-300">
                    Trường tham gia
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ====================================
            SCHOOL SECTION TITLE
        ==================================== */}

        <section className="mt-9">

          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#e76c1b]">
                <Layers3 size={15} />
                Không gian của tôi
              </div>

              <h2 className="text-2xl font-extrabold text-[#1c2940]">
                Danh sách trường học
              </h2>

              <p className="mt-2 text-sm text-[#8c817c]">
                Chọn một trường để tiếp tục vào EDUX.
              </p>
            </div>

            <div className="rounded-full border border-[#f0e0d5] bg-white px-4 py-2 text-xs font-semibold text-[#826958]">
              {schools.length} trường có quyền truy cập
            </div>

          </div>

          {/* ==================================
              ERROR MESSAGE
          ================================== */}

          {(selectError || (status !== "error" && error)) && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>{selectError || error}</span>
            </div>
          )}

          {/* ==================================
              LOADING
          ================================== */}

          {isLoading && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-[#efe5dd] bg-white px-6 py-16 shadow-sm">
              <LoaderCircle
                size={36}
                className="animate-spin text-[#f97320]"
              />

              <p className="mt-5 font-semibold text-[#26344c]">
                Đang xác minh danh sách trường...
              </p>

              <p className="mt-2 text-sm text-[#8c817c]">
                EDUX đang kiểm tra quyền truy cập của bạn.
              </p>
            </div>
          )}

          {/* ==================================
              LOAD ERROR
          ================================== */}

          {status === "error" && (
            <div className="rounded-3xl border border-red-100 bg-white px-6 py-12 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <AlertCircle size={30} />
              </div>

              <h3 className="mt-5 text-xl font-bold">
                Không thể tải trường học
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#8c817c]">
                {error ||
                  "Không thể kết nối đến dữ liệu trường. Vui lòng thử lại."}
              </p>

              <button
                type="button"
                onClick={refreshSchools}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f97320] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#e86213]"
              >
                <RefreshCw size={17} />
                Thử lại
              </button>
            </div>
          )}

          {/* ==================================
              NO SCHOOL
          ================================== */}

          {status === "no_school" && (
            <div className="rounded-3xl border border-[#efe5dd] bg-white px-6 py-12 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0e5] text-[#f97320]">
                <LockKeyhole size={30} />
              </div>

              <h3 className="mt-5 text-xl font-bold">
                Chưa có trường học
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#8c817c]">
                Tài khoản của bạn chưa được cấp quyền
                tham gia trường học nào đang hoạt động.
                Hãy liên hệ quản trị viên EDUX.
              </p>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-6 rounded-xl border border-[#e8ddd5] px-6 py-3 text-sm font-bold text-[#26344c] transition hover:bg-[#fff0e5]"
              >
                Đăng xuất
              </button>
            </div>
          )}

          {/* ==================================
              SCHOOL CARDS
          ================================== */}

          {(status === "ready" ||
            status === "selection_required") && (
            <div className="grid gap-5 md:grid-cols-2">

              {schools.map((school, index) => {
                const selected =
                  currentSchoolId === school.id;

                const isSelecting =
                  selectingId === school.id;

                const roleConfig =
                  getRoleConfig(school.role);

                const RoleIcon = roleConfig.icon;

                return (
                  <button
                    key={school.id}
                    type="button"
                    disabled={Boolean(selectingId)}
                    onClick={() =>
                      handleSelect(school.id)
                    }
                    className={`
                      group relative w-full overflow-hidden
                      rounded-[24px] border-2 bg-white
                      p-6 text-left transition-all duration-200
                      focus-visible:outline-none
                      focus-visible:ring-4
                      focus-visible:ring-orange-200

                      ${
                        selected
                          ? "border-[#f97320] shadow-lg shadow-orange-100"
                          : "border-[#eee5de] shadow-sm hover:-translate-y-1 hover:border-[#f97320]/70 hover:shadow-xl hover:shadow-orange-100/50"
                      }

                      ${
                        selectingId
                          ? "cursor-wait"
                          : "cursor-pointer"
                      }
                    `}
                  >

                    {/* Active accent */}
                    {selected && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-[#f97320]" />
                    )}

                    {/* Card Top */}
                    <div className="flex items-start justify-between gap-3">

                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#fff0e4] text-[#ef711e]">
                        <School size={30} strokeWidth={1.9} />
                      </div>

                      {selected ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff0e4] px-3 py-1.5 text-xs font-bold text-[#c55a14]">
                          <CheckCircle2 size={14} />
                          Đang sử dụng
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#f7f3ef] px-3 py-1.5 text-xs font-semibold text-[#908076]">
                          Trường {index + 1}
                        </span>
                      )}

                    </div>

                    {/* School Name */}
                    <div className="mt-6">

                      <h3 className="text-xl font-extrabold leading-snug text-[#1c2940]">
                        {school.name}
                      </h3>

                      <p className="mt-2 font-mono text-xs font-semibold tracking-wide text-[#988579]">
                        {school.code}
                      </p>

                    </div>

                    {/* Divider */}
                    <div className="my-5 h-px bg-[#f0e6df]" />

                    {/* School Role */}
                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f8f4f1] text-[#64748b]">
                        <RoleIcon size={19} />
                      </div>

                      <div>
                        <p className="text-xs text-[#9a8c83]">
                          Vai trò tại trường
                        </p>

                        <p className="mt-0.5 text-sm font-bold text-[#27344a]">
                          {roleConfig.label}
                        </p>
                      </div>

                    </div>

                    {/* Action */}
                    <div
                      className={`
                        mt-7 flex items-center justify-between
                        rounded-xl px-4 py-3.5
                        text-sm font-bold transition-all

                        ${
                          selected
                            ? "bg-[#fff0e4] text-[#d96617]"
                            : "bg-[#f97320] text-white group-hover:bg-[#e96616]"
                        }
                      `}
                    >
                      <span>
                        {isSelecting
                          ? "Đang chuyển trường..."
                          : selected
                          ? "Tiếp tục vào trường"
                          : "Truy cập trường này"}
                      </span>

                      {isSelecting ? (
                        <LoaderCircle
                          size={19}
                          className="animate-spin"
                        />
                      ) : (
                        <ArrowRight
                          size={19}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      )}
                    </div>

                  </button>
                );
              })}

            </div>
          )}

        </section>

        {/* ====================================
            FOOTER
        ==================================== */}

        <footer className="mt-12 border-t border-[#ede2da] pt-6 text-center">

          <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#7e6b60]">
            <div className="h-2 w-2 rounded-full bg-[#f97320]" />
            EDUX Learning Platform
          </div>

          <p className="mt-2 text-xs text-[#aaa09a]">
            Một tài khoản • Nhiều không gian trường học
          </p>

        </footer>

      </main>
    </div>
  );
}
