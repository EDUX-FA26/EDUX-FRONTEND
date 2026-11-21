import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import SuperadminLayout from "../../components/platform/SuperadminLayout";
import EduxAlert from "../../components/common/EduxAlert";
import api from "../../config/axios.config";
import {
  getRevenue,
  getTransactions,
} from "../../services/platformApi";
import {
  TrendingUp,
  CreditCard,
  RotateCcw,
  Building,
  Building2,
  Calendar,
  Search,
  RefreshCw,
  Layers3,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  PieChart,
  BarChart3,
  Users,
  Activity,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatShortVND(val) {
  const num = Number(val || 0);
  if (num === 0) return "0 đ";
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)} Tỷ`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)} Tr`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)} K`;
  return `${num} đ`;
}

export default function PlatformRevenuePage() {
  const { lang, t } = useLanguage();
  const s = t?.superadmin?.dashboard;

  // Financial data state
  const [revenueData, setRevenueData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Alert & feedback state
  const [alert, setAlert] = useState({
    type: "info",
    title: "Trạng thái Dòng tiền Nền tảng",
    message: "Hệ thống đang đồng bộ giao dịch thời gian thực từ cổng VietQR PayOS. Tất cả số liệu tài chính được kiểm toán tự động.",
  });

  // Chart view mode: "column" (Bar Chart) | "area" (Spline Wave)
  const [chartMode, setChartMode] = useState("column");

  // Transactions table state
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [txLoading, setTxLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Hover states for interactive charts
  const [hoveredMonth, setHoveredMonth] = useState(null);

  const loadAllData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [revRes, overviewRes] = await Promise.all([
        getRevenue(),
        api.get("/platform/overview"),
      ]);
      setRevenueData(revRes.data);
      setOverviewData(overviewRes.data?.data || {});
    } catch (err) {
      console.error("Error loading platform revenue & overview:", err);
      setAlert({
        type: "error",
        title: "Lỗi đồng bộ dữ liệu tài chính",
        message: err.response?.data?.message || "Không thể kết nối đến máy chủ tài chính nền tảng.",
      });
    } finally {
      setDataLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async (page = 1) => {
    setTxLoading(true);
    try {
      const res = await getTransactions({
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setTransactions(res.data?.items || []);
      setPagination(res.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setTxLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadAllData();
    loadTransactions(1);
  }, [loadAllData, loadTransactions]);

  const summary = revenueData?.summary || {};
  const byPlan = revenueData?.by_plan || [];
  const rawByMonth = revenueData?.by_month || [];
  const bySchool = revenueData?.by_school || [];

  // Overview metrics
  const totalSchools = overviewData?.total_schools || 0;
  const activeSchools = overviewData?.active_schools || 0;
  const pendingSchools = overviewData?.pending_setup_schools || 0;
  const lockedSchools = overviewData?.locked_schools || 0;
  const suspendedSchools = overviewData?.suspended_schools || 0;
  const activeMemberships = overviewData?.active_memberships || 0;
  const managerCount = overviewData?.manager_count || 0;
  const schoolHealthRate = totalSchools > 0 ? Math.round((activeSchools / totalSchools) * 100) : 100;

  // =========================================================================
  // CONTINUOUS 12-MONTH TIMELINE GENERATION (Ensures full visual bar chart)
  // =========================================================================
  const fullMonthsSeries = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const key = `${year}-${String(monthNum).padStart(2, "0")}`;
      const label = `Thg ${monthNum}`;

      // Match backend row
      const found = rawByMonth.find(
        (m) => m.month === key || m.month?.endsWith(`-${String(monthNum).padStart(2, "0")}`)
      );

      list.push({
        key,
        label,
        year,
        revenue: found ? Number(found.revenue || 0) : 0,
        gross_revenue: found ? Number(found.gross_revenue || found.revenue || 0) : 0,
        transaction_count: found ? Number(found.transaction_count || 0) : 0,
      });
    }
    return list;
  }, [rawByMonth]);

  // SMART DYNAMIC CEILING: Scaled directly against actual maximum revenue in active data
  const maxMonthRev = useMemo(() => {
    const revs = fullMonthsSeries.map((m) => m.revenue);
    const maxVal = Math.max(...revs, 0);
    // If maxVal > 0, scale against that actual max so even small amounts (50k, 200k, 1tr) stand tall!
    return maxVal > 0 ? maxVal : 500000;
  }, [fullMonthsSeries]);

  // Total calculated from 12-month series
  const totalAnnualRev = useMemo(() => {
    return fullMonthsSeries.reduce((acc, m) => acc + m.revenue, 0);
  }, [fullMonthsSeries]);

  // Calculate dynamic bar height (Guarantees tall visible pillars even for modest amounts)
  const getBarHeightPercent = (rev) => {
    if (rev <= 0) return 8; // subtle baseline anchor for months with zero
    const ratio = Math.min(rev / maxMonthRev, 1);
    // Scale non-zero revenue from 36% height to 92% height
    return Math.round(36 + ratio * 56);
  };

  // SVG Area Spline calculations for 12 months
  const svgWidth = 600;
  const svgHeight = 220;
  const padX = 25;
  const padY = 30;
  const graphWidth = svgWidth - padX * 2;
  const graphHeight = svgHeight - padY * 2;

  const areaPoints = fullMonthsSeries.map((m, idx) => {
    const x = padX + (idx / Math.max(fullMonthsSeries.length - 1, 1)) * graphWidth;
    const ratio = m.revenue > 0 ? Math.min(m.revenue / maxMonthRev, 1) : 0;
    const y = svgHeight - padY - ratio * graphHeight;
    return { x, y, ...m };
  });

  const splineD =
    areaPoints.length > 0
      ? areaPoints.reduce((acc, p, i, a) => {
          if (i === 0) return `M ${p.x} ${p.y}`;
          const prev = a[i - 1];
          const cx1 = prev.x + (p.x - prev.x) / 2;
          const cy1 = prev.y;
          const cx2 = prev.x + (p.x - prev.x) / 2;
          const cy2 = p.y;
          return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
        }, "")
      : `M 25 190 L 575 190`;

  const splineAreaD = `${splineD} L ${areaPoints[areaPoints.length - 1]?.x || 575} ${
    svgHeight - padY
  } L ${areaPoints[0]?.x || 25} ${svgHeight - padY} Z`;

  // ==========================================
  // PLAN REVENUE DISTRIBUTION
  // ==========================================
  const planColors = ["#f27024", "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#06b6d4"];
  const planRevenueTotal = useMemo(() => {
    return byPlan.reduce((acc, p) => acc + Number(p.revenue || p.gross_revenue || 0), 0);
  }, [byPlan]);

  const planRadius = 52;
  const planCircumference = 2 * Math.PI * planRadius;
  let cumPlan = 0;
  const planDonutSlices = byPlan.map((p, idx) => {
    const rev = Number(p.revenue || p.gross_revenue || 0);
    const percent = planRevenueTotal > 0 ? rev / planRevenueTotal : 0;
    const strokeDasharray = `${percent * planCircumference} ${planCircumference}`;
    const strokeDashoffset = -(cumPlan * planCircumference);
    cumPlan += percent;
    return {
      ...p,
      rev,
      color: planColors[idx % planColors.length],
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // Top School Scaling
  const maxSchoolPaid = useMemo(() => {
    return Math.max(...bySchool.map((s) => Number(s.total_paid || 0)), 100000);
  }, [bySchool]);

  return (
    <SuperadminLayout>
      <div className="space-y-7">
        {/* ======================================================== */}
        {/* HEADER SECTION */}
        {/* ======================================================== */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff8f5] border border-[#ffdbcc] px-3 py-1 text-xs font-semibold text-[#f27024]">
                <Activity className="h-3.5 w-3.5 animate-pulse" />
                {s?.portalBadge || "Cổng Điều Hành Cấp Cao (SuperAdmin)"}
              </span>
              <span className="text-xs text-[#8c7166]">
                {s?.lastSync || "Dòng tiền PayOS cập nhật:"} {new Date().toLocaleTimeString(lang === "en" ? "en-US" : "vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1f1b17] mt-1.5">
              {s?.title || "Bảng Điều Khiển & Dòng Tiền Nền Tảng"}
            </h1>
            <p className="mt-1 text-sm text-[#545f73]">
              {s?.subtitle || "Giám sát dòng tiền bản quyền SaaS, biến động doanh thu VietQR và sức khỏe toàn bộ mạng lưới trường học EDUX."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                loadAllData();
                loadTransactions(pagination.page);
                setAlert({
                  type: "success",
                  title: s?.syncSuccessTitle || "Đồng bộ thành công!",
                  message: s?.syncSuccessMsg || "Số liệu dòng tiền và giao dịch đã được làm mới từ cơ sở dữ liệu.",
                });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-[#f5ebe1] bg-white px-4 py-2.5 text-xs font-bold text-[#545f73] shadow-xs hover:bg-[#fff8f5] hover:text-[#f27024] hover:border-[#ffdbcc] transition cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${dataLoading || txLoading ? "animate-spin text-[#f27024]" : ""}`} />
              {s?.btnRefresh || "Làm mới dữ liệu"}
            </button>

            <Link
              to="/superadmin/plans"
              className="inline-flex items-center gap-2 rounded-xl bg-[#f27024] px-4 py-2.5 text-xs font-bold !text-white shadow-md shadow-orange-500/30 hover:bg-[#d95c14] hover:!text-white transition cursor-pointer"
            >
              <Layers3 className="h-4 w-4 !text-white" />
              <span className="!text-white font-bold">{s?.btnManagePlans || "Quản lý Gói SaaS"}</span>
            </Link>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BEAUTIFUL ALERT NOTIFICATION BANNER */}
        {/* ======================================================== */}
        {alert && (
          <EduxAlert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* ======================================================== */}
        {/* TOP EXECUTIVE METRIC CARDS (5 GIANT KPI CARDS) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Card 1: Doanh thu thực (Net Revenue) */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">{s?.kpi?.netRevenue || "Doanh thu thực (Net)"}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-xs">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {formatCurrency(summary.total_revenue || 0)}
            </p>
            <div className="mt-2.5 flex items-center justify-between text-xs text-emerald-800">
              <span className="font-medium">{s?.kpi?.netSub || "Đã trừ hoàn tiền"}</span>
              <span className="rounded-md bg-emerald-100/80 px-2 py-0.5 font-bold text-[10px]">VietQR PayOS</span>
            </div>
            <DollarSign className="absolute -bottom-4 -right-4 h-24 w-24 text-emerald-600/10 pointer-events-none" />
          </div>

          {/* Card 2: Doanh thu gộp (Gross Revenue) */}
          <div className="relative overflow-hidden rounded-3xl border border-[#ffdbcc] bg-gradient-to-br from-[#fff8f5] via-white to-white p-5 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#a04100]">{s?.kpi?.grossRevenue || "Doanh thu gộp (Gross)"}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffdbcc] text-[#f27024] shadow-xs">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-black text-[#1f1b17] tracking-tight">
              {formatCurrency(summary.total_gross_revenue || summary.total_revenue || 0)}
            </p>
            <div className="mt-2.5 flex items-center justify-between text-xs text-[#8c7166]">
              <span>{s?.kpi?.grossSub || "Tổng tiền nạp thu về"}</span>
              <span className="font-bold text-[#f27024]">{summary.total_successful_payments || 0} {lang === "en" ? "Orders" : "Giao dịch"}</span>
            </div>
            <TrendingUp className="absolute -bottom-4 -right-4 h-24 w-24 text-[#f27024]/10 pointer-events-none" />
          </div>

          {/* Card 3: Cơ sở Đào tạo (Schools) */}
          <div className="relative overflow-hidden rounded-3xl border border-[#f5ebe1] bg-white p-5 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#545f73]">{s?.kpi?.schools || "Mạng lưới Cơ sở"}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-xs">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-black text-[#1f1b17] tracking-tight">
              {totalSchools} <span className="text-sm font-bold text-[#8c7166]">{lang === "en" ? "Schools" : "Trường"}</span>
            </p>
            <div className="mt-2.5 flex items-center justify-between text-xs text-[#545f73]">
              <span className="font-bold text-emerald-600">{activeSchools} {lang === "en" ? "active" : "hoạt động"}</span>
              <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-[#8c7166]">{schoolHealthRate}% {lang === "en" ? "Healthy" : "Chuẩn"}</span>
            </div>
            <Building2 className="absolute -bottom-4 -right-4 h-24 w-24 text-blue-500/10 pointer-events-none" />
          </div>

          {/* Card 4: Thành viên toàn hệ sinh thái */}
          <div className="relative overflow-hidden rounded-3xl border border-[#f5ebe1] bg-white p-5 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#545f73]">{s?.kpi?.users || "Thành viên Active"}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-black text-[#1f1b17] tracking-tight">
              {Number(activeMemberships).toLocaleString(lang === "en" ? "en-US" : "vi-VN")}{" "}
              <span className="text-sm font-bold text-[#8c7166]">{lang === "en" ? "Users" : "Người"}</span>
            </p>
            <div className="mt-2.5 flex items-center justify-between text-xs text-[#545f73]">
              <span>{s?.kpi?.usersSub || "Sinh viên & Giảng viên"}</span>
              <span className="font-bold text-indigo-600">{lang === "en" ? "Nationwide" : "Toàn quốc"}</span>
            </div>
            <Users className="absolute -bottom-4 -right-4 h-24 w-24 text-indigo-500/10 pointer-events-none" />
          </div>

          {/* Card 5: Quản trị viên Vận hành */}
          <div className="relative overflow-hidden rounded-3xl border border-purple-200/80 bg-gradient-to-br from-purple-50/70 via-white to-white p-5 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-purple-800">{s?.kpi?.team || "Đội ngũ Vận hành"}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-black text-purple-800 tracking-tight">
              {managerCount} <span className="text-sm font-bold text-purple-600">Manager</span>
            </p>
            <div className="mt-2.5 flex items-center justify-between text-xs text-purple-700">
              <span>{s?.kpi?.teamSub || "Giám sát 24/7"}</span>
              <Link to="/superadmin/managers" className="font-bold text-[11px] underline hover:text-purple-900">
                {lang === "en" ? "Manage →" : "Quản trị →"}
              </Link>
            </div>
            <ShieldCheck className="absolute -bottom-4 -right-4 h-24 w-24 text-purple-500/10 pointer-events-none" />
          </div>
        </div>

        {/* ======================================================== */}
        {/* MAIN VISUAL FINANCIAL CHART (TALL PROMINENT PILLARS) */}
        {/* ======================================================== */}
        <div className="rounded-3xl border border-[#f5ebe1] bg-white p-6 sm:p-7 shadow-xs">
          {/* Chart Header with Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#f5ebe1]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff8f5] text-[#f27024] shadow-xs">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#1f1b17] tracking-tight">
                  {s?.charts?.revenueTitle || "Biểu Đồ Dòng Tiền & Biến Động Doanh Thu 12 Tháng"}
                </h2>
                <p className="text-xs text-[#545f73]">
                  {s?.charts?.revenueSubtitle || "Thống kê doanh thu theo chu kỳ thanh toán 12 tháng gần nhất (VND)"} – {lang === "en" ? "Peak:" : "Đỉnh doanh thu:"}{" "}
                  <strong className="text-[#f27024] font-black">{formatCurrency(maxMonthRev)}</strong>
                </p>
              </div>
            </div>

            {/* Toggle view buttons */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-[#fff8f5] p-1.5 border border-[#f5ebe1] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartMode("column")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  chartMode === "column"
                    ? "bg-[#f27024] text-white shadow-xs"
                    : "text-[#545f73] hover:text-[#1f1b17]"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                {s?.charts?.tabColumns || "Cột Tài Chính"}
              </button>
              <button
                type="button"
                onClick={() => setChartMode("area")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  chartMode === "area"
                    ? "bg-[#f27024] text-white shadow-xs"
                    : "text-[#545f73] hover:text-[#1f1b17]"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                {s?.charts?.tabWave || "Sóng Dòng Tiền"}
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* VIEW 1: TALL COLUMN BARS (LARGE IMPACTFUL PILLARS) */}
          {/* ======================================================== */}
          {chartMode === "column" ? (
            <div className="mt-6">
              {/* Reference Grid lines */}
              <div className="relative h-72 sm:h-80 w-full pt-10 pb-6 px-1">
                {/* Horizontal guide lines */}
                <div className="absolute inset-x-0 top-10 border-b border-dashed border-[#f5ebe1] flex justify-between text-[10px] text-[#8c7166]">
                  <span>Đỉnh: {formatShortVND(maxMonthRev)}</span>
                  <span>100% Khung</span>
                </div>
                <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-[#f5ebe1]/70 flex justify-between text-[10px] text-[#8c7166]">
                  <span>{formatShortVND(maxMonthRev * 0.5)}</span>
                  <span>50%</span>
                </div>
                <div className="absolute inset-x-0 bottom-6 border-b border-solid border-stone-200 flex justify-between text-[10px] text-[#8c7166]">
                  <span>0 ₫</span>
                  <span>Mốc sàn</span>
                </div>

                {/* 12 Prominent Columns */}
                <div className="relative z-10 flex h-full items-end justify-between gap-1.5 sm:gap-3">
                  {fullMonthsSeries.map((m, idx) => {
                    const heightPercent = getBarHeightPercent(m.revenue);
                    const isHovered = hoveredMonth === idx;
                    const hasRev = m.revenue > 0;

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredMonth(idx)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        className="group relative flex-1 flex flex-col items-center justify-end h-full cursor-pointer"
                      >
                        {/* Hover Tooltip Popup */}
                        {isHovered && (
                          <div className="absolute -top-14 z-30 flex flex-col items-center rounded-2xl bg-[#1f1b17] px-3 py-2 text-center text-white shadow-xl pointer-events-none whitespace-nowrap border border-stone-700 animate-in fade-in zoom-in-95 duration-150">
                            <span className="text-[10px] font-semibold text-stone-300">
                              {m.label} ({m.year})
                            </span>
                            <span className="text-sm font-black text-amber-300">
                              {formatCurrency(m.revenue)}
                            </span>
                            <span className="text-[10px] text-stone-400 mt-0.5">
                              {m.transaction_count} giao dịch PayOS
                            </span>
                            <div className="absolute -bottom-1.5 h-3 w-3 rotate-45 bg-[#1f1b17]" />
                          </div>
                        )}

                        {/* Direct Top Value Tag (Visible without hover) */}
                        <div className="mb-2 text-center">
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-black transition-all ${
                              hasRev
                                ? "bg-[#fff8f5] text-[#f27024] border border-[#ffdbcc] shadow-2xs font-mono"
                                : "text-stone-300 opacity-60"
                            }`}
                          >
                            {formatShortVND(m.revenue)}
                          </span>
                        </div>

                        {/* The Large Pillar Column */}
                        <div
                          className={`w-full max-w-[42px] sm:max-w-[56px] rounded-t-2xl transition-all duration-500 relative overflow-hidden ${
                            hasRev
                              ? isHovered
                                ? "bg-gradient-to-t from-[#d95c14] via-[#f27024] to-[#fb923c] shadow-lg shadow-orange-500/35 scale-y-105"
                                : "bg-gradient-to-t from-[#f27024] via-[#f97316] to-[#fdba74] hover:shadow-md"
                              : "bg-stone-100 border border-dashed border-stone-200 opacity-50"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        >
                          {/* Inner glowing top cap */}
                          {hasRev && (
                            <div className="absolute top-0 inset-x-0 h-1.5 bg-white/70 rounded-t-2xl" />
                          )}
                        </div>

                        {/* Bottom Month Label */}
                        <div className="mt-2.5 text-center">
                          <span
                            className={`block text-[11px] font-extrabold transition-colors ${
                              isHovered ? "text-[#f27024]" : hasRev ? "text-[#1f1b17]" : "text-[#8c7166]"
                            }`}
                          >
                            {m.label}
                          </span>
                          {hasRev && (
                            <span className="block text-[9px] font-bold text-[#f27024]">
                              {m.transaction_count} GD
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* VIEW 2: HIGH-RESOLUTION SPLINE AREA WAVE CHART */
            /* ======================================================== */
            <div className="mt-6">
              <div className="relative h-72 sm:h-80 w-full pt-4">
                <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                  <defs>
                    <linearGradient id="superadminAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f27024" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="#f27024" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#f27024" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="superadminStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f27024" />
                      <stop offset="50%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  <line x1={padX} y1={padY} x2={svgWidth - padX} y2={padY} stroke="#f5ebe1" strokeDasharray="3 3" />
                  <line x1={padX} y1={svgHeight / 2} x2={svgWidth - padX} y2={svgHeight / 2} stroke="#f5ebe1" strokeDasharray="3 3" />
                  <line x1={padX} y1={svgHeight - padY} x2={svgWidth - padX} y2={svgHeight - padY} stroke="#e2e8f0" />

                  {/* Area fill */}
                  <path d={splineAreaD} fill="url(#superadminAreaGrad)" />

                  {/* Line stroke */}
                  <path d={splineD} fill="none" stroke="url(#superadminStrokeGrad)" strokeWidth="3.5" strokeLinecap="round" />

                  {/* Points with direct hover interaction */}
                  {areaPoints.map((p, i) => (
                    <g key={i} className="group cursor-pointer">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="6"
                        className="fill-white stroke-[#f27024] stroke-[3px] hover:r-8 hover:stroke-[#ea580c] transition-all"
                      />
                      {/* X label */}
                      <text
                        x={p.x}
                        y={svgHeight - 8}
                        textAnchor="middle"
                        className="text-[10px] font-bold fill-[#545f73]"
                      >
                        {p.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          )}

          {/* Bottom Financial Metrics Banner */}
          <div className="mt-6 pt-5 border-t border-[#f5ebe1] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-2xl bg-[#fff8f5] p-3.5 border border-[#ffdbcc]/70">
              <span className="text-[11px] font-semibold text-[#8c7166]">Tổng Dòng Tiền 12 Tháng</span>
              <p className="text-base font-black text-[#1f1b17] mt-1">{formatCurrency(totalAnnualRev)}</p>
            </div>
            <div className="rounded-2xl bg-[#fff8f5] p-3.5 border border-[#ffdbcc]/70">
              <span className="text-[11px] font-semibold text-[#8c7166]">Mức Thu Đỉnh (Tháng Max)</span>
              <p className="text-base font-black text-[#f27024] mt-1">{formatCurrency(maxMonthRev)}</p>
            </div>
            <div className="rounded-2xl bg-[#fff8f5] p-3.5 border border-[#ffdbcc]/70">
              <span className="text-[11px] font-semibold text-[#8c7166]">Tỷ Lệ Giữ Chân Dòng Tiền</span>
              <p className="text-base font-black text-emerald-700 mt-1">
                {summary.total_gross_revenue > 0
                  ? ((1 - summary.total_refunded / summary.total_gross_revenue) * 100).toFixed(1)
                  : "100"}% Net
              </p>
            </div>
            <div className="rounded-2xl bg-[#fff8f5] p-3.5 border border-[#ffdbcc]/70">
              <span className="text-[11px] font-semibold text-[#8c7166]">Cổng Thanh Toán Tự Động</span>
              <p className="text-base font-black text-blue-700 mt-1">100% PayOS VietQR</p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ROW 2: PLAN REVENUE DONUT & TOP CONTRIBUTING SCHOOLS */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* CHART 2: REVENUE DISTRIBUTION BY SAAS PLAN (DONUT & METERS) */}
          <div className="col-span-12 lg:col-span-5 rounded-3xl border border-[#f5ebe1] bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#f5ebe1]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff8f5] text-[#f27024]">
                    <PieChart className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#1f1b17]">Cơ cấu Doanh thu theo Gói SaaS</h2>
                    <p className="text-xs text-[#545f73]">Tỷ trọng đóng góp dòng tiền từ các gói dịch vụ</p>
                  </div>
                </div>
                <Link
                  to="/superadmin/plans"
                  className="text-xs font-bold text-[#f27024] hover:text-[#d95c14] flex items-center gap-1"
                >
                  Cấu hình <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Donut Chart Visual */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="relative flex items-center justify-center">
                  <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 140 140">
                    <circle
                      cx="70"
                      cy="70"
                      r={planRadius}
                      className="text-stone-100"
                      strokeWidth="20"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    {planDonutSlices.length === 0 ? (
                      <circle
                        cx="70"
                        cy="70"
                        r={planRadius}
                        className="text-emerald-500"
                        strokeWidth="20"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    ) : (
                      planDonutSlices.map((slice, i) => (
                        <circle
                          key={i}
                          cx="70"
                          cy="70"
                          r={planRadius}
                          stroke={slice.color}
                          strokeWidth="20"
                          strokeDasharray={slice.strokeDasharray}
                          strokeDashoffset={slice.strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-700 hover:opacity-85"
                        />
                      ))
                    )}
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-[#1f1b17]">
                      {byPlan.length}
                    </span>
                    <span className="text-[10px] font-bold text-[#8c7166] uppercase tracking-wider">
                      Gói Thuê
                    </span>
                  </div>
                </div>

                {/* Slices legend */}
                <div className="w-full sm:w-auto flex flex-col gap-2 text-xs">
                  {planDonutSlices.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#fff8f5] px-3 py-1.5 border border-[#f5ebe1]/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-[#1f1b17] truncate max-w-[100px]">{item.plan_name}</span>
                      </div>
                      <span className="font-black text-[#1f1b17]">({item.percent}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Breakdown List */}
              <div className="mt-5 space-y-2.5">
                {byPlan.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-2xl bg-[#fff8f5]/60 p-3 border border-[#f5ebe1]/60">
                    <div>
                      <p className="font-bold text-xs text-[#1f1b17]">{item.plan_name}</p>
                      <p className="text-[11px] text-[#545f73]">{item.transaction_count} lượt thanh toán</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xs text-[#1f1b17]">{formatCurrency(item.revenue || item.gross_revenue)}</p>
                      {item.refunded_amount > 0 && (
                        <p className="text-[10px] text-amber-600 font-bold">Hoàn: {formatCurrency(item.refunded_amount)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f5ebe1] flex items-center justify-between text-xs text-[#545f73]">
              <span>Tổng doanh thu toàn gói:</span>
              <span className="font-black text-[#f27024]">{formatCurrency(planRevenueTotal)}</span>
            </div>
          </div>

          {/* CHART 3: TOP CONTRIBUTING SCHOOLS (REVENUE & TRANSACTIONS) */}
          <div className="col-span-12 lg:col-span-7 rounded-3xl border border-[#f5ebe1] bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#f5ebe1]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff8f5] text-[#f27024]">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#1f1b17]">Top Trường Đóng Góp Doanh Thu</h2>
                    <p className="text-xs text-[#545f73]">Các cơ sở có tổng thanh toán cao nhất toàn hệ thống EDUX</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#8c7166]">
                  {bySchool.length} Cơ sở thanh toán
                </span>
              </div>

              {/* Top Schools List with Horizontal Progress Bars */}
              <div className="mt-5 space-y-4">
                {bySchool.length === 0 ? (
                  <p className="py-12 text-center text-xs text-[#8c7166]">
                    Chưa có dữ liệu trường học thanh toán.
                  </p>
                ) : (
                  bySchool.slice(0, 5).map((s, idx) => {
                    const paid = Number(s.total_paid || 0);
                    // Make sure even small payments show wide, readable bars (min 20%)
                    const ratio = maxSchoolPaid > 0 ? paid / maxSchoolPaid : 1;
                    const percent = Math.min(Math.round(20 + ratio * 80), 100);

                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#f5ebe1] bg-[#fff8f5]/40 p-3.5 hover:bg-[#fff8f5] transition"
                      >
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f27024] text-[11px] font-black text-white shadow-2xs">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-extrabold text-[#1f1b17]">{s.school_name}</span>
                              <span className="ml-2 font-mono text-[10px] text-[#8c7166]">({s.school_code})</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-[#1f1b17] text-sm">{formatCurrency(paid)}</span>
                            <span className="ml-2 text-[11px] text-[#8c7166] font-semibold">({s.transaction_count} GD)</span>
                          </div>
                        </div>

                        {/* Relative Size Bar */}
                        <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-[#f97316] to-[#f27024] transition-all duration-700 shadow-xs"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#f5ebe1] flex items-center justify-between text-xs text-[#545f73]">
              <span>Mạng lưới cơ sở đào tạo:</span>
              <span className="font-black text-[#f27024] text-sm">{totalSchools} Trường học</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DETAILED TRANSACTIONS TABLE SECTION */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1f1b17]">Lịch sử Giao dịch PayOS Toàn Hệ Thống</h2>
              <p className="text-xs text-[#545f73]">Danh sách các khoản thanh toán bản quyền SaaS của toàn bộ cơ sở đào tạo.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8c7166]" />
                <input
                  type="text"
                  placeholder="Mã đơn / tên trường…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl border border-[#f5ebe1] bg-white pl-8 pr-3 py-1.5 text-xs text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#f5ebe1] bg-white px-2.5 py-1.5 text-xs text-[#1f1b17] focus:border-[#f27024] focus:outline-hidden"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="success">Thành công</option>
                <option value="refunded">Đã hoàn tiền</option>
                <option value="pending">Chờ xử lý</option>
                <option value="failed">Thất bại</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#f5ebe1] bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#f5ebe1] bg-[#fff8f5] font-bold uppercase tracking-wider text-[#8c7166]">
                  <tr>
                    <th className="px-5 py-3.5">Mã đơn hàng</th>
                    <th className="px-5 py-3.5">Cơ sở đào tạo</th>
                    <th className="px-5 py-3.5">Gói dịch vụ</th>
                    <th className="px-5 py-3.5">Số tiền</th>
                    <th className="px-5 py-3.5">Cổng</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5ebe1]">
                  {txLoading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-[#545f73]">
                        <RefreshCw className="mx-auto h-5 w-5 animate-spin text-[#f27024] mb-2" />
                        Đang đồng bộ dữ liệu giao dịch PayOS…
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-[#8c7166]">
                        Không tìm thấy giao dịch nào.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#fff8f5] transition">
                        <td className="px-5 py-3 font-mono font-medium text-[#1f1b17]">
                          {tx.order_reference}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-[#1f1b17]">{tx.school_name || "—"}</p>
                          <p className="text-[11px] text-[#8c7166] font-mono">{tx.school_code}</p>
                        </td>
                        <td className="px-5 py-3 text-[#545f73]">{tx.plan_name || tx.plan_id || "—"}</td>
                        <td className="px-5 py-3 font-bold text-[#1f1b17]">{formatCurrency(tx.amount)}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-md px-2 py-0.5 font-bold uppercase text-[10px] ${
                              tx.payment_method === "payos"
                                ? "bg-[#fff8f5] text-[#f27024] border border-[#ffdbcc]"
                                : "bg-[#fcf2eb] text-[#a04100] border border-[#ffdbcc]"
                            }`}
                          >
                            {tx.payment_method || "payos"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {tx.status === "success" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Thành công
                            </span>
                          ) : tx.status === "refunded" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Đã hoàn tiền
                            </span>
                          ) : tx.status === "pending" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#fcf2eb] px-2.5 py-0.5 font-semibold text-[#8c7166]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#8c7166]" />
                              Chờ xử lý
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 font-semibold text-red-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                              Thất bại
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-[#8c7166] text-[11px]">
                          {tx.paid_at || tx.created_at
                            ? new Date(tx.paid_at || tx.created_at).toLocaleString("vi-VN")
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#f5ebe1] bg-[#fff8f5] px-5 py-3 text-xs text-[#545f73]">
                <p>
                  Trang {pagination.page} / {pagination.totalPages} (Tổng {pagination.total} giao dịch)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => loadTransactions(pagination.page - 1)}
                    className="rounded-lg border border-[#f5ebe1] bg-white px-2.5 py-1 font-medium hover:bg-[#fff8f5] disabled:opacity-40 cursor-pointer"
                  >
                    ← Trước
                  </button>
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadTransactions(pagination.page + 1)}
                    className="rounded-lg border border-[#f5ebe1] bg-white px-2.5 py-1 font-medium hover:bg-[#fff8f5] disabled:opacity-40 cursor-pointer"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SuperadminLayout>
  );
}
