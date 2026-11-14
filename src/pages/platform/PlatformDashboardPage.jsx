
import React, { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import {
    LayoutDashboard,
    Building2,
    School,
    Users,
    ShieldCheck,
    Search,
    RefreshCw,
    ArrowRight,
    LogOut,
    CheckCircle2,
    AlertCircle,
    GraduationCap,
    Layers3,
} from "lucide-react";

import api from '../../config/axios.config';
import { useAuth } from "../../contexts/AuthContext";
import { useSchool } from "../../contexts/SchoolContext";

// ============================================
// HELPERS
// ============================================

function formatNumber(value) {
    return Number(value || 0).toLocaleString("vi-VN");
}

function MetricCard({ icon: Icon, label, value, note, color }) {
    const colors = {
        orange: {
            bg: "#fff0e4",
            fg: "#f97320",
        },
        blue: {
            bg: "#e9efff",
            fg: "#3157ba",
        },
        green: {
            bg: "#e5f6ef",
            fg: "#16835d",
        },
        purple: {
            bg: "#f0eaff",
            fg: "#7452bf",
        },
    };

    const tone = colors[color] || colors.orange;

    return (
        <div className="rounded-[22px] border border-[#f0e5dd] bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[#687489]">
                        {label}
                    </p>

                    <p className="mt-4 text-4xl font-extrabold tracking-tight text-[#18243b]">
                        {formatNumber(value)}
                    </p>
                </div>

                <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{
                        background: tone.bg,
                        color: tone.fg,
                    }}
                >
                    <Icon size={23} />
                </div>
            </div>

            <p className="mt-4 text-xs font-medium text-[#988b81]">
                {note}
            </p>
        </div>
    );
}

function SchoolCard({ school, isCurrent }) {
    const active = school.status === "active";

    return (
        <article
            className={`relative overflow-hidden rounded-[24px] border-2 bg-white p-6 shadow-sm transition hover:shadow-lg ${isCurrent
                ? "border-[#f97320]"
                : "border-[#efe5dd]"
                }`}
        >
            {isCurrent && (
                <div className="absolute inset-x-0 top-0 h-1 bg-[#f97320]" />
            )}

            <div className="flex items-start justify-between gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0e4] text-[#f97320]">
                    <School size={27} />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                    {isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0e4] px-3 py-1.5 text-xs font-bold text-[#d6681b]">
                            <CheckCircle2 size={13} />
                            Đang chọn
                        </span>
                    )}

                    <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${active
                            ? "bg-[#e5f6ef] text-[#16835d]"
                            : "bg-[#f3f1ef] text-[#81776f]"
                            }`}
                    >
                        {active ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </span>
                </div>
            </div>

            <h3 className="mt-5 text-xl font-extrabold text-[#1c2940]">
                {school.name}
            </h3>

            <p className="mt-2 font-mono text-xs font-semibold text-[#9d877a]">
                {school.code}
            </p>

            <div className="my-5 h-px bg-[#f0e8e2]" />

            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#fcf8f5] p-4">
                    <div className="flex items-center gap-2 text-[#8e7f75]">
                        <Users size={15} />
                        <span className="text-xs font-medium">
                            Thành viên
                        </span>
                    </div>

                    <p className="mt-2 text-2xl font-extrabold text-[#1c2940]">
                        {formatNumber(school.active_members)}
                    </p>
                </div>

                <div className="rounded-xl bg-[#fcf8f5] p-4">
                    <div className="flex items-center gap-2 text-[#8e7f75]">
                        <ShieldCheck size={15} />
                        <span className="text-xs font-medium">
                            Quản trị viên
                        </span>
                    </div>

                    <p className="mt-2 text-2xl font-extrabold text-[#1c2940]">
                        {formatNumber(school.school_admins)}
                    </p>
                </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs text-[#a19389]">
                        School Slug
                    </p>

                    <p className="mt-1 truncate font-mono text-xs font-semibold text-[#5e6a7c]">
                        {school.slug || "—"}
                    </p>
                </div>

                <span className="rounded-lg bg-[#fff0e4] px-3 py-2 text-xs font-bold text-[#d86c1c]">
                    School Tenant
                </span>
            </div>
        </article>
    );
}

// ============================================
// MAIN PAGE
// ============================================

export default function PlatformDashboardPage() {
    const { isAuthenticated, logout } = useAuth();
    const { currentSchool } = useSchool();

    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [forbidden, setForbidden] = useState(false);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [refreshKey, setRefreshKey] = useState(0);

    // ==========================================
    // LOAD PLATFORM DATA
    // ==========================================

    useEffect(() => {
        if (!isAuthenticated) return;

        let cancelled = false;

        async function loadData() {
            setLoading(true);
            setError("");
            setForbidden(false);
            setOverview(null);

            try {
                // Global authorization, no School Context.
                await api.get("/platform/me");

                const response = await api.get(
                    "/platform/overview"
                );

                if (!cancelled) {
                    setOverview(response.data.data);
                }
            } catch (err) {
                if (!cancelled) {
                    if (err.response?.status === 403) {
                        setForbidden(true);
                    } else {
                        setError(
                            err.response?.data?.message ||
                            "Không thể tải dữ liệu EDUX Platform."
                        );
                    }
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadData();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, refreshKey]);

    const schools = overview?.schools || [];

    const currentSchoolId =
        currentSchool?.schoolId ||
        currentSchool?.id ||
        null;

    const totalSchoolAdmins = schools.reduce(
        (sum, school) =>
            sum + Number(school.school_admins || 0),
        0
    );

    const filteredSchools = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return schools.filter((school) => {
            const matchesSearch = [
                school.name,
                school.code,
                school.slug,
            ].some((value) =>
                String(value || "")
                    .toLowerCase()
                    .includes(keyword)
            );

            const matchesStatus =
                filter === "all" ||
                (filter === "active" &&
                    school.status === "active") ||
                (filter === "inactive" &&
                    school.status !== "active");

            return matchesSearch && matchesStatus;
        });
    }, [schools, search, filter]);

    // ==========================================
    // ACTIONS
    // ==========================================

    async function handleLogout() {
        await logout();
        window.location.replace("/login");
    }

    function handleRefresh() {
        setRefreshKey((value) => value + 1);
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="min-h-screen bg-[#fcf8f5] text-[#18243b]">

            {/* ======================================
          TOP HEADER
      ====================================== */}

            <header className="sticky top-0 z-30 border-b border-[#f0e5dd] bg-white/95 backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 lg:px-8">

                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#f97320] px-4 py-2.5 shadow-sm">
                            <span className="text-xl font-black tracking-[0.12em] text-white">
                                EDUX
                            </span>
                        </div>

                        <div className="hidden border-l border-[#e8ddd5] pl-3 sm:block">
                            <p className="text-sm font-extrabold text-[#25334b]">
                                Platform Console
                            </p>

                            <p className="text-xs text-[#9a897e]">
                                Multi-Tenant Administration
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            to="/select-school"
                            className="inline-flex items-center gap-2 rounded-xl border border-[#f0e0d5] bg-[#fff8f3] px-3 py-2.5 text-sm font-semibold text-[#a45219] transition hover:bg-[#ffecdf] sm:px-4"
                        >
                            <GraduationCap size={18} />
                            <span>Không gian trường</span>
                            <ArrowRight size={15} />
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#e9dfd8] bg-white px-3 py-2.5 text-sm font-semibold text-[#586174] transition hover:bg-[#faf3ee]"
                        >
                            <LogOut size={17} />
                            <span className="hidden sm:inline">
                                Đăng xuất
                            </span>
                        </button>
                    </div>

                </div>
            </header>

            <div className="flex">

                {/* ====================================
            SIDEBAR
        ==================================== */}

                <aside className="hidden min-h-[calc(100vh-80px)] w-64 shrink-0 border-r border-[#f0e5dd] bg-white px-4 py-7 lg:block">

                    <p className="mb-4 px-3 text-xs font-extrabold uppercase tracking-widest text-[#a18d80]">
                        Quản trị nền tảng
                    </p>

                    <nav className="space-y-2">

                        <a
                            href="#overview"
                            className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold shadow-sm"
                            style={{
                                backgroundColor: "#f97320",
                                color: "#ffffff",
                                textDecoration: "none",
                            }}
                        >
                            <LayoutDashboard
                                size={20}
                                strokeWidth={2.2}
                                style={{
                                    color: "#ffffff",
                                    stroke: "#ffffff",
                                    flexShrink: 0,
                                }}
                            />

                            <span style={{ color: "#ffffff", fontWeight: 700 }}>
                                Tổng quan
                            </span>
                        </a>


                        <a
                            href="#schools"
                            className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition hover:bg-[#fff3eb]"
                            style={{
                                color: "#5d697e",
                                textDecoration: "none",
                            }}
                        >
                            <Building2
                                size={20}
                                style={{ flexShrink: 0, color: "#f97320" }}
                            />
                            <span style={{ color: "#5d697e" }}>
                                Danh sách trường
                            </span>
                        </a>

                        <Link
                            to="/select-school"
                            className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition hover:bg-[#fff3eb]"
                            style={{
                                color: "#5d697e",
                                textDecoration: "none",
                            }}
                        >
                            <Layers3
                                size={20}
                                style={{ flexShrink: 0, color: "#f97320" }}
                            />
                            <span style={{ color: "#5d697e" }}>
                                School Workspace
                            </span>
                        </Link>

                    </nav>

                    <div className="mt-10 rounded-2xl border border-[#f1e4db] bg-[#fff8f3] p-4">
                        <div className="flex items-center gap-2 text-[#df6d1d]">
                            <ShieldCheck size={20} />
                            <span className="text-sm font-bold">
                                Platform Admin
                            </span>
                        </div>

                        <p className="mt-3 text-xs leading-6 text-[#8b786b]">
                            Không gian quản trị toàn bộ hệ thống
                            EDUX, độc lập với quyền quản trị của
                            từng trường học.
                        </p>
                    </div>
                </aside>

                {/* ====================================
            MAIN CONTENT
        ==================================== */}

                <main
                    id="overview"
                    className="min-w-0 flex-1 px-5 py-7 sm:px-7 lg:px-9"
                >

                    {/* Breadcrumb */}
                    <div className="mb-6 flex items-center gap-2 text-sm text-[#9b887b]">
                        <span>EDUX Platform</span>
                        <span>/</span>
                        <span className="font-bold text-[#e86d1c]">
                            Tổng quan
                        </span>
                    </div>

                    {/* HERO */}
                    <section
                        className="relative overflow-hidden rounded-[28px] px-7 py-9 text-white shadow-xl shadow-slate-900/10 sm:px-10 sm:py-11"
                        style={{
                            background:
                                "linear-gradient(125deg, #121c30 0%, #1d2b41 58%, #35445b 100%)",
                        }}
                    >
                        <div
                            className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full"
                            style={{
                                background:
                                    "radial-gradient(circle, rgba(249,115,32,0.25), transparent 70%)",
                            }}
                        />

                        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">

                            <div className="max-w-2xl">
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-orange-100">
                                    <span className="h-2 w-2 rounded-full bg-[#f97320]" />
                                    EDUX PLATFORM CONTROL CENTER
                                </div>

                                <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                                    Quản trị toàn bộ
                                    <span className="block text-[#ffae75]">
                                        hệ thống EDUX.
                                    </span>
                                </h1>

                                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                                    Theo dõi các trường học, thành viên
                                    và tình trạng hoạt động trên một
                                    nền tảng giáo dục Multi-Tenant.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
                                <ShieldCheck
                                    size={27}
                                    className="text-[#ffae75]"
                                />

                                <div>
                                    <p className="text-sm font-bold">
                                        Super Admin
                                    </p>

                                    <p className="mt-1 text-xs text-slate-300">
                                        Platform Workspace
                                    </p>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* ==================================
              PERMISSION DENIED
          ================================== */}

                    {!loading && forbidden && (
                        <div className="mt-7 rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
                            <AlertCircle
                                size={38}
                                className="mx-auto text-red-500"
                            />

                            <h2 className="mt-4 text-xl font-extrabold">
                                Không có quyền Super Admin
                            </h2>

                            <p className="mt-3 text-sm text-[#8b817c]">
                                Tài khoản này không được cấp quyền
                                quản trị nền tảng EDUX.
                            </p>

                            <Link
                                to="/select-school"
                                className="mt-6 inline-flex rounded-xl bg-[#f97320] px-5 py-3 text-sm font-bold text-white"
                            >
                                Trở về chọn trường
                            </Link>
                        </div>
                    )}

                    {/* ==================================
              ERROR STATE
          ================================== */}

                    {!loading && !forbidden && error && (
                        <div className="mt-7 rounded-3xl border border-[#f3d4c3] bg-white p-7">
                            <div className="flex items-start gap-3">
                                <AlertCircle
                                    size={22}
                                    className="shrink-0 text-[#e86d1c]"
                                />

                                <div>
                                    <p className="font-bold">
                                        Không tải được dữ liệu nền tảng
                                    </p>

                                    <p className="mt-2 text-sm text-[#8b817c]">
                                        {error}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={handleRefresh}
                                        className="mt-4 rounded-xl bg-[#f97320] px-5 py-2.5 text-sm font-bold text-white"
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================================
              LOADING STATE
          ================================== */}

                    {loading && (
                        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-[#f0e5dd] bg-white p-6 text-sm font-medium text-[#748094]">
                            <RefreshCw
                                size={20}
                                className="animate-spin text-[#f97320]"
                            />

                            Đang xác minh quyền và tải dữ liệu EDUX...
                        </div>
                    )}

                    {/* ==================================
              DASHBOARD CONTENT
          ================================== */}

                    {!loading && !error && !forbidden && overview && (
                        <>
                            {/* METRICS */}
                            <section className="mt-8">
                                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-extrabold uppercase tracking-widest text-[#e86d1c]">
                                            Thống kê hệ thống
                                        </p>

                                        <h2 className="mt-2 text-2xl font-extrabold text-[#1c2940]">
                                            Tổng quan nền tảng
                                        </h2>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleRefresh}
                                        disabled={loading}
                                        className="inline-flex items-center gap-2 rounded-xl border border-[#f0e0d5] bg-white px-4 py-2.5 text-sm font-bold text-[#a65a27] transition hover:bg-[#fff3eb]"
                                    >
                                        <RefreshCw size={17} />
                                        Làm mới dữ liệu
                                    </button>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    <MetricCard
                                        icon={Building2}
                                        label="Tổng số trường"
                                        value={overview.total_schools}
                                        note="Các trường trên EDUX"
                                        color="orange"
                                    />

                                    <MetricCard
                                        icon={School}
                                        label="Trường hoạt động"
                                        value={overview.active_schools}
                                        note="Đang được kích hoạt"
                                        color="green"
                                    />

                                    <MetricCard
                                        icon={Users}
                                        label="Membership hoạt động"
                                        value={overview.active_memberships}
                                        note="Tổng lượt thành viên theo trường"
                                        color="blue"
                                    />

                                    <MetricCard
                                        icon={ShieldCheck}
                                        label="School Admin"
                                        value={totalSchoolAdmins}
                                        note="Lượt quản trị viên theo trường"
                                        color="purple"
                                    />
                                </div>
                            </section>

                            {/* SCHOOLS */}
                            <section
                                id="schools"
                                className="mt-10 scroll-mt-28"
                            >
                                <div className="mb-6">
                                    <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#e86d1c]">
                                        <Layers3 size={15} />
                                        Hệ thống trường học
                                    </p>

                                    <h2 className="mt-2 text-2xl font-extrabold text-[#1c2940]">
                                        Danh sách trường
                                    </h2>

                                    <p className="mt-2 text-sm text-[#8e8179]">
                                        Thông tin trường và số lượng thành
                                        viên được tổng hợp từ EDUX Database.
                                    </p>
                                </div>

                                {/* SEARCH & FILTER */}
                                <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

                                    <div className="relative w-full xl:max-w-md">
                                        <Search
                                            size={19}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a28d7f]"
                                        />

                                        <input
                                            type="search"
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                            placeholder="Tìm theo tên, mã hoặc slug trường..."
                                            className="w-full rounded-xl border border-[#ecdfd5] bg-white py-3.5 pl-12 pr-4 text-sm text-[#243148] outline-none transition placeholder:text-[#ad9e92] focus:border-[#f97320] focus:ring-2 focus:ring-orange-100"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {[
                                            ["all", "Tất cả"],
                                            ["active", "Hoạt động"],
                                            ["inactive", "Ngừng hoạt động"],
                                        ].map(([value, label]) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() =>
                                                    setFilter(value)
                                                }
                                                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${filter === value
                                                    ? "bg-[#f97320] text-white"
                                                    : "border border-[#ecdfd5] bg-white text-[#7d716c] hover:bg-[#fff3eb]"
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-4 text-xs font-semibold text-[#9a8b81]">
                                    Hiển thị {filteredSchools.length} / {schools.length} trường
                                </div>

                                {filteredSchools.length === 0 ? (
                                    <div className="rounded-3xl border border-[#efe5dd] bg-white px-6 py-14 text-center">
                                        <Building2
                                            size={38}
                                            className="mx-auto text-[#e6b08b]"
                                        />

                                        <p className="mt-4 font-bold text-[#243148]">
                                            Không tìm thấy trường phù hợp
                                        </p>

                                        <p className="mt-2 text-sm text-[#9a8b81]">
                                            Thử thay đổi từ khóa hoặc bộ lọc.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-5 xl:grid-cols-2">
                                        {filteredSchools.map((school) => (
                                            <SchoolCard
                                                key={school.id}
                                                school={school}
                                                isCurrent={
                                                    school.id === currentSchoolId
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}

                    {/* FOOTER */}
                    <footer className="mt-12 border-t border-[#eadfd7] py-6 text-center">
                        <p className="text-xs font-medium text-[#a7988c]">
                            EDUX Multi-Tenant Platform • Super Admin Console
                        </p>
                    </footer>
                </main>
            </div>
        </div>
    );
}
