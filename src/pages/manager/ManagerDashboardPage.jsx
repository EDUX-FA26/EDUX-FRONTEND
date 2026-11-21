import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  Building2,
  FileText,
  CreditCard,
  RefreshCw,
  PlusCircle,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Bell,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Users,
  DollarSign,
  Layers,
  Sparkles,
} from "lucide-react";
import ManagerLayout from "../../components/platform/ManagerLayout";
import EduxAlert from "../../components/common/EduxAlert";
import api from "../../config/axios.config";
import {
  createSchool,
  inviteSchoolAdmin,
  remindSubscriptionRenewal,
} from "../../services/platformApi";

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatShortVND(num) {
  if (!num) return "0 đ";
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)} Tỷ`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)} Tr`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)} K`;
  return `${num} đ`;
}

export default function ManagerDashboardPage() {
  const { lang, t } = useLanguage();
  const m = t?.manager?.dashboard;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [activeChartTab, setActiveChartTab] = useState("all");
  const [cashflowMode, setCashflowMode] = useState("pillars"); // "pillars" | "wave"
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Quick invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState(null);
  const [inviting, setInviting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewRes, schoolsRes, subscriptionsRes, transactionsRes] = await Promise.all([
        api.get("/platform/overview"),
        api.get("/platform/schools", { params: { limit: 6 } }),
        api.get("/platform/subscriptions", { params: { limit: 6 } }),
        api.get("/platform/transactions", { params: { limit: 8 } }),
      ]);

      setData({
        overview: overviewRes.data?.data || {},
        schools: schoolsRes.data?.data || {},
        subscriptions: subscriptionsRes.data?.data || {},
        transactions: transactionsRes.data?.data || {},
      });
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải dữ liệu bảng điều khiển.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBlankTenant = async () => {
    try {
      const res = await createSchool();
      const school = res.data;
      setActionMessage(`Đã khởi tạo tenant trường trống mã: ${school.code || school.id}. Hãy mời School Admin để bàn giao.`);
      loadData();
      setSelectedSchoolId(school.id);
      setInviteModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể khởi tạo tenant mới.");
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!selectedSchoolId || !inviteEmail) return;
    setInviting(true);
    try {
      const res = await inviteSchoolAdmin(selectedSchoolId, inviteEmail);
      setInviteResult(res.data);
      setActionMessage(`Đã gửi lời mời tới ${inviteEmail} thành công!`);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi lời mời.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemindRenewal = async (subId, schoolName) => {
    setError("");
    setActionMessage("");
    try {
      const res = await remindSubscriptionRenewal(subId);
      if (res?.data?.success === false) {
        setError(res.data.message || "Không thể gửi thông báo gia hạn.");
        return;
      }
      setActionMessage(`Đã gửi thông báo nhắc nhở gia hạn đến School Admin của trường ${schoolName || res?.data?.school_name || ""}`);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi thông báo gia hạn.");
    }
  };

  const overview = data?.overview || {};
  const recentSchools = data?.schools?.items || [];
  const recentSubscriptions = data?.subscriptions?.items || [];
  const recentTransactions = data?.transactions?.items || [];
  const allSchools = overview.schools || [];
  const plans = overview.plans || [];

  // ==========================================
  // CHART COMPUTATIONS & STATS
  // ==========================================
  const totalSchools = overview.total_schools || allSchools.length || 0;
  const activeSchools = overview.active_schools ?? allSchools.filter((s) => s.status === "active").length;
  const pendingSchools = overview.pending_setup_schools ?? allSchools.filter((s) => s.status === "pending_setup").length;
  const lockedSchools = overview.locked_schools ?? allSchools.filter((s) => s.status === "locked").length;
  const suspendedSchools = overview.suspended_schools ?? allSchools.filter((s) => s.status === "suspended").length;

  const healthRate = totalSchools > 0 ? Math.round((activeSchools / totalSchools) * 100) : 100;
  const totalContracts = (overview.active_contracts || 0) + (overview.expiring_contracts || 0);
  const contractHealthRate = totalContracts > 0 ? Math.round(((overview.active_contracts || 0) / totalContracts) * 100) : 100;

  // Donut chart calculations (Radius = 54, Circumference ~ 339.29)
  const donutRadius = 54;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const statusCounts = [
    { label: "Hoạt động", count: activeSchools, color: "#10b981", bg: "bg-emerald-500", text: "text-emerald-700", ring: "ring-emerald-500" },
    { label: "Chờ thiết lập", count: pendingSchools, color: "#f59e0b", bg: "bg-amber-500", text: "text-amber-700", ring: "ring-amber-500" },
    { label: "Bị khóa", count: lockedSchools, color: "#f43f5e", bg: "bg-rose-500", text: "text-rose-700", ring: "ring-rose-500" },
    { label: "Đình chỉ", count: suspendedSchools, color: "#8b5cf6", bg: "bg-purple-500", text: "text-purple-700", ring: "ring-purple-500" },
  ];

  let cumulativePercent = 0;
  const donutSlices = statusCounts.map((item) => {
    const percent = totalSchools > 0 ? item.count / totalSchools : item.label === "Hoạt động" ? 1 : 0;
    const strokeDasharray = `${percent * donutCircumference} ${donutCircumference}`;
    const strokeDashoffset = -(cumulativePercent * donutCircumference);
    cumulativePercent += percent;
    return {
      ...item,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // Top Schools by Active Members
  const topSchoolsByMembers = [...allSchools]
    .sort((a, b) => (Number(b.active_members) || 0) - (Number(a.active_members) || 0))
    .slice(0, 5);
  const maxMemberCount = Math.max(...topSchoolsByMembers.map((s) => Number(s.active_members) || 0), 1);

  // Transaction trend data for Cash Flow Visualization
  const txList = useMemo(() => [...recentTransactions].reverse(), [recentTransactions]);
  const txAmounts = useMemo(() => txList.map((t) => Number(t.amount || 0)), [txList]);
  const maxTxVal = useMemo(() => Math.max(...txAmounts, 0) || 50000, [txAmounts]);

  // Dynamic scaling: even small amounts (e.g. 20k, 50k, 100k, 200k) appear prominently tall (36% to 92%)
  const getBarHeightPercent = useCallback((amt) => {
    if (!amt || amt <= 0) return 14;
    if (maxTxVal <= 0) return 50;
    const ratio = Math.min(amt / maxTxVal, 1);
    return Math.round(36 + ratio * 56);
  }, [maxTxVal]);

  // Create SVG points for the smooth wave chart
  const chartWidth = 560;
  const chartHeight = 180;
  const paddingX = 24;
  const paddingY = 24;
  const graphW = chartWidth - paddingX * 2;
  const graphH = chartHeight - paddingY * 2;

  const points = useMemo(() => {
    if (txList.length === 0) return [];
    return txList.map((t, idx) => {
      const x = paddingX + (idx / Math.max(txList.length - 1, 1)) * graphW;
      const amt = Number(t.amount || 0);
      const heightPercent = getBarHeightPercent(amt);
      const y = chartHeight - paddingY - (heightPercent / 100) * graphH;
      return { x, y, amount: amt, item: t, heightPercent };
    });
  }, [txList, getBarHeightPercent, graphW, graphH]);

  const svgPathD = useMemo(() => {
    if (points.length === 0) return `M ${paddingX} ${chartHeight - paddingY} L ${chartWidth - paddingX} ${chartHeight - paddingY}`;
    return points.reduce((acc, p, i, a) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = a[i - 1];
      const cx1 = prev.x + (p.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (p.x - prev.x) / 2;
      const cy2 = p.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
    }, "");
  }, [points, paddingX, paddingY, chartWidth, chartHeight]);

  const svgAreaD = useMemo(() => {
    if (points.length === 0) return `M ${paddingX} ${chartHeight - paddingY} L ${chartWidth - paddingX} ${chartHeight - paddingY} Z`;
    return `${svgPathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;
  }, [points, svgPathD, paddingX, paddingY, chartWidth, chartHeight]);

  return (
    <ManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff8f5] border border-[#ffdbcc] px-3 py-1 text-xs font-semibold text-[#f27024]">
                <Activity className="h-3.5 w-3.5 animate-pulse" />
                {m?.badge || "Cổng Vận Hành Nền Tảng (Manager)"}
              </span>
              <span className="text-xs text-[#8c7166]">
                {lang === "en" ? "Updated at:" : "Cập nhật lúc:"} {new Date().toLocaleTimeString(lang === "en" ? "en-US" : "vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1f1b17] mt-1">
              {m?.title || "Bảng điều khiển Vận hành"}
            </h1>
            <p className="mt-1 text-sm text-[#545f73]">
              {m?.subtitle || "Giám sát trực quan mạng lưới cơ sở đào tạo, phân bổ gói thuê bao và vận hành nền tảng EDUX."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCreateBlankTenant}
              className="inline-flex items-center gap-2 rounded-xl bg-[#f27024] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-orange-500/20 hover:bg-[#d95c14] transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              {t?.manager?.schools?.btnCreate || "Khởi tạo Tenant mới"}
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#f5ebe1] bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-[#545f73] shadow-xs hover:bg-[#fff8f5] hover:text-[#f27024] transition cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#f27024]" : ""}`} />
              {m?.btnRefresh || "Làm mới"}
            </button>
          </div>
        </div>

        {/* Action alert message */}
        {actionMessage && (
          <EduxAlert
            type="success"
            message={actionMessage}
            onClose={() => setActionMessage("")}
          />
        )}

        {/* Error message */}
        {error && (
          <EduxAlert
            type="error"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {/* Manager Scope Banner */}
        <div className="rounded-2xl border border-[#f5ebe1] bg-gradient-to-r from-[#fff8f5] via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f27024] text-white shadow-xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="text-xs sm:text-sm leading-relaxed text-[#545f73]">
              <span className="font-bold text-[#1f1b17]">Quyền hạn Vận hành (Manager Portal): </span>
              Quản lý vòng đời tenant trường học (Tạo mới, gửi lời mời bàn giao School Admin, Khóa/Mở, Đình chỉ/Khôi phục). Theo dõi các chỉ số hợp đồng, tình trạng thuê bao và lịch sử giao dịch PayOS theo thời gian thực.
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* KEY METRICS WITH MODERN CARDS & HERO REVENUE CARD */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {/* Card 1: TỔNG DÒNG TIỀN THU VỀ (HERO CARD) */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-white p-4 shadow-sm hover:border-emerald-300 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                {lang === "en" ? "Total Cash Flow" : "Dòng Tiền Thu Về"}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shadow-xs">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
              {formatCurrency(overview.total_revenue || 0)}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-800">
              <span className="font-semibold">VietQR PayOS</span>
              <span className="rounded bg-emerald-100/80 px-1.5 py-0.2 font-bold text-[10px] text-emerald-800">
                {recentTransactions.length} GD
              </span>
            </div>
            <DollarSign className="absolute -bottom-2 -right-2 h-16 w-16 text-emerald-600/10 pointer-events-none" />
          </div>

          {/* Card 2: Tổng số trường */}
          <div className="relative overflow-hidden rounded-2xl border border-[#f5ebe1] bg-white p-4 shadow-xs hover:border-[#ffdbcc] hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#545f73]">
                {lang === "en" ? "Total Schools" : "Mạng lưới trường"}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff8f5] text-[#f27024]">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-[#1f1b17]">{totalSchools}</p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#8c7166]">
              <span>{activeSchools} {lang === "en" ? "active" : "hoạt động"}</span>
              <span className="font-semibold text-emerald-600">{healthRate}% chuẩn</span>
            </div>
            <div className="absolute -bottom-2 -right-2 opacity-10 text-[#f27024]">
              <Building2 className="h-16 w-16" />
            </div>
          </div>

          {/* Card 3: Hợp đồng hiệu lực */}
          <div className="relative overflow-hidden rounded-2xl border border-[#ffdbcc] bg-gradient-to-br from-[#fff8f5] to-white p-4 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#f27024]">
                {lang === "en" ? "Subscriptions" : "Hợp đồng mở"}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ffdbcc] text-[#a04100]">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-[#f27024]">{overview.active_contracts ?? 0}</p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#a04100]">
              <span>{lang === "en" ? "Active licenses" : "Thuê bao kích hoạt"}</span>
              <span className="font-bold">{contractHealthRate}%</span>
            </div>
          </div>

          {/* Card 4: Sắp hết hạn */}
          <div className="relative overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/60 to-white p-4 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-800">
                {lang === "en" ? "Expiring Soon" : "Sắp hết hạn"}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                <Bell className="h-4 w-4 animate-bounce" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-orange-700">{overview.expiring_contracts ?? 0}</p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-orange-600">
              <span>{lang === "en" ? "In 30 days" : "Trong 30 ngày"}</span>
              <span className="font-bold">{lang === "en" ? "Remind" : "Nhắc ngay"}</span>
            </div>
          </div>

          {/* Card 5: Chờ thiết lập */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-white p-4 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800">
                {lang === "en" ? "Pending Setup" : "Chờ thiết lập"}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-amber-700">{pendingSchools}</p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-amber-600">
              <span>{lang === "en" ? "Onboarding" : "Đang bàn giao"}</span>
              <span className="font-bold">{totalSchools > 0 ? Math.round((pendingSchools / totalSchools) * 100) : 0}%</span>
            </div>
          </div>

          {/* Card 6: Khóa / Đình chỉ */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/60 to-white p-4 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-800">
                {lang === "en" ? "Locked / Suspended" : "Khóa / Đình chỉ"}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-rose-700">{lockedSchools + suspendedSchools}</p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-rose-600">
              <span>{lang === "en" ? "Needs action" : "Cần can thiệp"}</span>
              <span className="font-bold">{totalSchools > 0 ? Math.round(((lockedSchools + suspendedSchools) / totalSchools) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* INTERACTIVE CHARTS & VISUAL DASHBOARD SECTION */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* CHART 1: DONUT CHART - SCHOOL STATUS DISTRIBUTION */}
          <div className="col-span-12 lg:col-span-5 rounded-3xl border border-[#f5ebe1] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#f5ebe1]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff8f5] text-[#f27024]">
                    <PieChart className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1f1b17]">Phân bố Trạng thái Trường học</h2>
                    <p className="text-xs text-[#545f73]">Tỷ lệ cơ sở hoạt động, chờ bàn giao và khóa</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/60">
                  {healthRate}% Khỏe mạnh
                </span>
              </div>

              {/* Donut Chart Visual & Legend */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
                {/* SVG Donut */}
                <div className="relative flex items-center justify-center">
                  <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 140 140">
                    {/* Background Ring */}
                    <circle
                      cx="70"
                      cy="70"
                      r={donutRadius}
                      className="text-stone-100"
                      strokeWidth="18"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    {/* Slices */}
                    {totalSchools === 0 ? (
                      <circle
                        cx="70"
                        cy="70"
                        r={donutRadius}
                        className="text-emerald-500"
                        strokeWidth="18"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    ) : (
                      donutSlices.map((slice, i) => (
                        <circle
                          key={i}
                          cx="70"
                          cy="70"
                          r={donutRadius}
                          stroke={slice.color}
                          strokeWidth="18"
                          strokeDasharray={slice.strokeDasharray}
                          strokeDashoffset={slice.strokeDashoffset}
                          strokeLinecap="round"
                          fill="transparent"
                          className="transition-all duration-700 hover:opacity-85"
                        />
                      ))
                    )}
                  </svg>

                  {/* Center Content */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black text-[#1f1b17]">{totalSchools}</span>
                    <span className="text-[11px] font-semibold text-[#8c7166] uppercase tracking-wider">Cơ sở</span>
                  </div>
                </div>

                {/* Slices Legend */}
                <div className="w-full sm:w-auto flex flex-col gap-2.5 text-xs">
                  {donutSlices.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 rounded-xl bg-[#fff8f5]/80 px-3 py-1.5 border border-[#f5ebe1]/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${item.bg}`} />
                        <span className="font-medium text-[#1f1b17]">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1f1b17]">{item.count}</span>
                        <span className="text-[11px] font-semibold text-[#8c7166]">({item.percent}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Health Bar Gauge */}
            <div className="mt-6 pt-4 border-t border-[#f5ebe1]">
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-[#545f73]">Chỉ số Sức khỏe Vận hành Nền tảng</span>
                <span className="text-[#f27024] font-bold">{healthRate} / 100 Điểm</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[#f27024] to-[#f27024] transition-all duration-1000"
                  style={{ width: `${Math.max(healthRate, 5)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[#8c7166]">
                {healthRate >= 80
                  ? "✓ Hệ sinh thái vận hành ổn định, đa số cơ sở đang mở hoạt động đào tạo bình thường."
                  : "⚠ Cần rà soát các trường học đang bị khóa hoặc quá hạn thiết lập bàn giao."}
              </p>
            </div>
          </div>

          {/* CHART 2: SUBSCRIPTION PLANS & CONTRACT METERS */}
          <div className="col-span-12 lg:col-span-7 rounded-3xl border border-[#f5ebe1] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#f5ebe1]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff8f5] text-[#f27024]">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1f1b17]">Cơ cấu Gói Thuê bao & Hạn Hợp đồng</h2>
                    <p className="text-xs text-[#545f73]">Phân bổ số lượng trường theo gói dịch vụ bản quyền</p>
                  </div>
                </div>
                <Link
                  to="/manager/subscriptions"
                  className="text-xs font-semibold text-[#f27024] hover:text-[#d95c14] flex items-center gap-1"
                >
                  Chi tiết hợp đồng <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Plans Progress Bars */}
              <div className="mt-5 space-y-4">
                {plans.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#8c7166]">
                    Đang đồng bộ gói thuê bao từ hệ sinh thái...
                  </div>
                ) : (
                  plans.map((plan, idx) => {
                    const count = Number(plan.active_subscriptions || 0);
                    const totalActiveSubs = overview.active_contracts || 1;
                    const percent = Math.min(Math.round((count / Math.max(totalActiveSubs, 1)) * 100), 100);
                    const gradientColors = [
                      "from-emerald-500 to-teal-400",
                      "from-[#f27024] to-amber-500",
                      "from-indigo-600 to-purple-500",
                      "from-blue-600 to-cyan-500",
                    ];
                    const grad = gradientColors[idx % gradientColors.length];

                    return (
                      <div key={plan.id || idx} className="rounded-2xl border border-[#f5ebe1] bg-[#fff8f5]/60 p-3.5">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1f1b17]">{plan.name}</span>
                            <span className="rounded bg-white border border-[#f5ebe1] px-2 py-0.5 text-[10px] font-semibold text-[#545f73]">
                              Gói #{idx + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1f1b17]">{count} trường</span>
                            <span className="text-[11px] font-semibold text-[#f27024]">({percent}%)</span>
                          </div>
                        </div>
                        <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-800`}
                            style={{ width: `${Math.max(percent, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Renewal Status Highlights */}
            <div className="mt-6 pt-4 border-t border-[#f5ebe1] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-[#fff8f5] to-white p-3.5 border border-[#ffdbcc]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#f27024]">Thuê bao An toàn</span>
                  <CheckCircle2 className="h-4 w-4 text-[#f27024]" />
                </div>
                <p className="mt-1 text-xl font-black text-[#1f1b17]">
                  {Math.max((overview.active_contracts || 0) - (overview.expiring_contracts || 0), 0)} trường
                </p>
                <p className="text-[11px] text-[#8c7166]">Thời hạn còn trên 30 ngày</p>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-white p-3.5 border border-orange-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-orange-800">Cần liên hệ gia hạn</span>
                  <Bell className="h-4 w-4 text-orange-600 animate-pulse" />
                </div>
                <p className="mt-1 text-xl font-black text-orange-700">{overview.expiring_contracts ?? 0} trường</p>
                <p className="text-[11px] text-orange-600">Sắp đến hạn kết thúc hợp đồng</p>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ROW 2: TRANSACTION TREND WAVE CHART & TOP SCHOOLS */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* CHART 3: DÒNG TIỀN PHÓNG ĐẠI & TẦN SUẤT GIAO DỊCH */}
          <div className="col-span-12 lg:col-span-7 rounded-3xl border border-[#f5ebe1] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f5ebe1]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff8f5] text-[#f27024] shadow-xs">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#1f1b17] tracking-tight">
                      {lang === "en" ? "Cash Flow & Transaction Activity" : "Dòng tiền & Tần suất Giao dịch gần nhất"}
                    </h2>
                    <p className="text-xs text-[#545f73]">
                      {lang === "en"
                        ? `Scaling cash flow dynamics • Top recorded amount: ${formatCurrency(maxTxVal)}`
                        : `Biểu đồ quy mô dòng tiền thực tế – Đỉnh giao dịch: `}
                      {lang !== "en" && <strong className="text-[#f27024] font-black">{formatCurrency(maxTxVal)}</strong>}
                    </p>
                  </div>
                </div>

                {/* Mode switches */}
                <div className="flex items-center gap-1.5 rounded-xl bg-[#fff8f5] p-1 border border-[#ffdbcc]/60 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCashflowMode("pillars")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      cashflowMode === "pillars"
                        ? "bg-[#f27024] text-white shadow-xs"
                        : "text-[#545f73] hover:text-[#1f1b17]"
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    {lang === "en" ? "Pillars" : "Cột Dòng Tiền"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashflowMode("wave")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      cashflowMode === "wave"
                        ? "bg-[#f27024] text-white shadow-xs"
                        : "text-[#545f73] hover:text-[#1f1b17]"
                    }`}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    {lang === "en" ? "Wave" : "Sóng Dòng Tiền"}
                  </button>
                </div>
              </div>

              {/* Chart Visual Container */}
              <div className="mt-5">
                {points.length === 0 ? (
                  <div className="flex h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-[#f5ebe1] bg-[#fff8f5]/40 text-center p-4">
                    <DollarSign className="h-10 w-10 text-[#f27024]/40 mb-2" />
                    <p className="text-sm font-bold text-[#1f1b17]">
                      {lang === "en" ? "No transaction records yet" : "Chưa có dữ liệu giao dịch phát sinh"}
                    </p>
                    <p className="text-xs text-[#8c7166] mt-0.5">
                      {lang === "en" ? "Transactions via PayOS will be plotted here" : "Dòng tiền từ các đơn thanh toán VietQR PayOS sẽ hiển thị tại đây"}
                    </p>
                  </div>
                ) : cashflowMode === "pillars" ? (
                  /* MODE 1: PROMINENT TALL FINANCIAL PILLARS */
                  <div className="relative">
                    <div className="flex h-56 items-end justify-between gap-2 pt-8 pb-2 px-1">
                      {points.map((p, idx) => {
                        const isHovered = hoveredPoint === idx;
                        const schoolName = p.item?.school_name || `Tenant #${p.item?.school_id || ""}`;
                        const refCode = p.item?.reference_code || p.item?.order_code || `TX-${idx + 1}`;
                        const timeStr = p.item?.created_at ? new Date(p.item.created_at).toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", { month: "numeric", day: "numeric" }) : `#${idx + 1}`;

                        return (
                          <div
                            key={idx}
                            onMouseEnter={() => setHoveredPoint(idx)}
                            onMouseLeave={() => setHoveredPoint(null)}
                            className="group relative flex flex-1 flex-col items-center h-full justify-end cursor-pointer"
                          >
                            {/* Hover Tooltip */}
                            {isHovered && (
                              <div className="absolute -top-12 z-30 whitespace-nowrap rounded-xl bg-[#1f1b17] px-3 py-1.5 text-xs text-white shadow-xl animate-fade-in border border-stone-700 pointer-events-none">
                                <p className="font-extrabold text-orange-400">{formatCurrency(p.amount)}</p>
                                <p className="text-[10px] text-stone-300">{schoolName} • {refCode}</p>
                              </div>
                            )}

                            {/* Direct amount badge on top of pillar */}
                            <span className="mb-1.5 rounded-full bg-[#fff8f5] px-1.5 py-0.5 text-[10px] font-black text-[#f27024] border border-[#ffdbcc] shadow-xs group-hover:bg-[#f27024] group-hover:text-white transition-all whitespace-nowrap">
                              {formatShortVND(p.amount)}
                            </span>

                            {/* Tall Column Bar */}
                            <div className="w-full max-w-[42px] flex items-end justify-center h-full">
                              <div
                                style={{ height: `${p.heightPercent}%` }}
                                className={`w-full rounded-t-xl transition-all duration-300 shadow-sm ${
                                  isHovered
                                    ? "bg-gradient-to-t from-[#f27024] to-[#f97316] ring-2 ring-orange-400 shadow-orange-500/40"
                                    : "bg-gradient-to-t from-[#f27024]/85 to-[#f97316]/90 shadow-orange-500/20"
                                }`}
                              />
                            </div>

                            {/* Bottom Label */}
                            <span className="mt-2 text-[10px] font-bold text-[#8c7166] group-hover:text-[#1f1b17] truncate max-w-[50px] text-center">
                              {timeStr}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* MODE 2: AREA SPLINE WAVE CHART */
                  <div className="relative h-56 w-full">
                    <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                      <defs>
                        <linearGradient id="managerAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f27024" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#f27024" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="managerStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#f27024" />
                          <stop offset="100%" stopColor="#f97316" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal grid lines */}
                      <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#f5ebe1" strokeDasharray="3 3" />
                      <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#f5ebe1" strokeDasharray="3 3" />
                      <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#f5ebe1" />

                      {/* Area fill */}
                      <path d={svgAreaD} fill="url(#managerAreaGrad)" />

                      {/* Line stroke */}
                      <path d={svgPathD} fill="none" stroke="url(#managerStrokeGrad)" strokeWidth="3.5" strokeLinecap="round" />

                      {/* Point circles with values */}
                      {points.map((p, i) => (
                        <g key={i} className="group cursor-pointer">
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            className="fill-white stroke-[#f27024] stroke-3 hover:r-8 transition-all shadow-md"
                          />
                          <text
                            x={p.x}
                            y={p.y - 10}
                            textAnchor="middle"
                            className="fill-[#a04100] text-[10px] font-black pointer-events-none"
                          >
                            {formatShortVND(p.amount)}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}

                {/* Bottom Timeline Data Points */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#8c7166] px-1 border-t border-[#f5ebe1]/60 pt-2">
                  <span>{lang === "en" ? "Earliest orders" : "Giao dịch cũ nhất"}</span>
                  <span className="font-semibold text-[#f27024]">{points.length} {lang === "en" ? "recent transactions" : "mốc gần đây"}</span>
                  <span>{lang === "en" ? "Latest today" : "Mới nhất hôm nay"}</span>
                </div>
              </div>
            </div>

            {/* Quick summary stats underneath chart with BIG TYPOGRAPHY */}
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#f5ebe1] pt-4 text-center">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 to-white p-3 border border-emerald-200/80 shadow-xs">
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  {lang === "en" ? "Total Recorded Cash Flow" : "Tổng dòng tiền ghi nhận"}
                </p>
                <p className="text-base sm:text-xl font-black text-emerald-700 mt-1 tracking-tight">
                  {formatCurrency(overview.total_revenue || 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[#fff8f5] to-white p-3 border border-[#ffdbcc] shadow-xs">
                <p className="text-[11px] font-bold text-[#8c7166] uppercase tracking-wider">
                  {lang === "en" ? "Avg. Order Value" : "Giá trị trung bình / GD"}
                </p>
                <p className="text-base sm:text-xl font-black text-[#f27024] mt-1 tracking-tight">
                  {formatCurrency(recentTransactions.length > 0 ? (Number(overview.total_revenue || 0) / recentTransactions.length) : 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 to-white p-3 border border-blue-200/80 shadow-xs">
                <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                  {lang === "en" ? "PayOS Processed" : "Lệnh PayOS thành công"}
                </p>
                <p className="text-base sm:text-xl font-black text-blue-700 mt-1 tracking-tight">
                  {recentTransactions.filter(t => t.status === "success").length} / {recentTransactions.length} GD
                </p>
              </div>
            </div>
          </div>

          {/* CHART 4: TOP SCHOOLS BY ACTIVE MEMBERS */}
          <div className="col-span-12 lg:col-span-5 rounded-3xl border border-[#f5ebe1] bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#f5ebe1]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff8f5] text-[#f27024]">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1f1b17]">Top Cơ sở theo Quy mô</h2>
                    <p className="text-xs text-[#545f73]">Các trường có số lượng thành viên active lớn nhất</p>
                  </div>
                </div>
                <Link
                  to="/manager/schools"
                  className="text-xs font-semibold text-[#f27024] hover:text-[#d95c14] flex items-center gap-1"
                >
                  Xem hết <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Top Schools List with Horizontal Progress Bars */}
              <div className="mt-4 space-y-3">
                {topSchoolsByMembers.length === 0 ? (
                  <p className="py-8 text-center text-xs text-[#8c7166]">Chưa có dữ liệu thành viên trường.</p>
                ) : (
                  topSchoolsByMembers.map((school, idx) => {
                    const members = Number(school.active_members) || 0;
                    const percent = Math.min(Math.round((members / maxMemberCount) * 100), 100);

                    return (
                      <div key={school.id || idx} className="rounded-2xl border border-[#f5ebe1] bg-[#fff8f5]/40 p-3 hover:bg-[#fff8f5] transition">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f27024] text-[10px] font-black text-white">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-[#1f1b17] truncate max-w-[140px] sm:max-w-[180px]">
                              {school.name || school.code}
                            </span>
                            <span className="font-mono text-[10px] text-[#8c7166]">({school.code})</span>
                          </div>
                          <span className="font-black text-[#1f1b17]">{members} thành viên</span>
                        </div>
                        {/* Horizontal relative size bar */}
                        <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#f27024] transition-all duration-700"
                            style={{ width: `${Math.max(percent, 6)}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-[#8c7166]">
                          <span>{school.school_admins || 1} Quản trị viên</span>
                          <span
                            className={`font-semibold ${
                              school.status === "active" ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            {school.status === "active" ? "Hoạt động" : "Chờ thiết lập"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f5ebe1] flex items-center justify-between text-xs text-[#545f73]">
              <span>Tổng thành viên toàn mạng lưới:</span>
              <span className="font-black text-[#f27024] text-sm">{overview.active_memberships ?? 0} người</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TWO-COLUMN SECTION: RECENT SCHOOLS & RECENT CONTRACTS */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Schools */}
          <div className="rounded-3xl border border-[#f5ebe1] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#1f1b17]">Danh sách Trường gần đây</h2>
                <p className="text-xs text-[#545f73]">Các tenant được khởi tạo hoặc đăng ký mới nhất</p>
              </div>
              <Link
                to="/manager/schools"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#f27024] hover:text-[#d95c14]"
              >
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-[#f5ebe1] overflow-x-auto">
              {recentSchools.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#8c7166]">Chưa có trường nào.</p>
              ) : (
                recentSchools.map((school) => (
                  <div key={school.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffdbcc] text-[#a04100] font-black text-sm">
                        {(school.name?.[0] || school.code?.[0] || "T").toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#1f1b17]">
                            {school.name || "Tenant chưa đặt tên"}
                          </p>
                          <span className="font-mono text-xs text-[#8c7166]">({school.code})</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {school.provisioning_source === "self_registered" ? (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                              Tự đăng ký
                            </span>
                          ) : (
                            <span className="rounded bg-[#fff8f5] border border-[#ffdbcc] px-1.5 py-0.5 text-[10px] font-semibold text-[#f27024]">
                              Manager khởi tạo
                            </span>
                          )}
                          <span className="text-xs text-[#8c7166]">
                            {school.total_members ?? 0} thành viên
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          school.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : school.status === "pending_setup"
                            ? "bg-amber-100 text-amber-800"
                            : school.status === "locked"
                            ? "bg-rose-100 text-rose-800"
                            : school.status === "suspended"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-[#fcf2eb] text-[#8c7166]"
                        }`}
                      >
                        {school.status === "active"
                          ? "Hoạt động"
                          : school.status === "pending_setup"
                          ? "Chờ thiết lập"
                          : school.status === "locked"
                          ? "Bị khóa"
                          : school.status === "suspended"
                          ? "Đình chỉ"
                          : school.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expiring / Active Subscriptions */}
          <div className="rounded-3xl border border-[#f5ebe1] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#1f1b17]">Hợp đồng & Thuê bao</h2>
                <p className="text-xs text-[#545f73]">Theo dõi thời hạn và gửi nhắc nhở gia hạn</p>
              </div>
              <Link
                to="/manager/subscriptions"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#f27024] hover:text-[#d95c14]"
              >
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-[#f5ebe1] overflow-x-auto">
              {recentSubscriptions.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#8c7166]">Chưa có hợp đồng nào.</p>
              ) : (
                recentSubscriptions.map((sub) => {
                  const isExpiring = sub.end_date && new Date(sub.end_date) <= new Date(Date.now() + 30 * 86400000);
                  return (
                    <div key={sub.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#1f1b17]">
                            {sub.school_name || sub.school_code}
                          </p>
                          <span className="rounded bg-[#fff8f5] border border-[#ffdbcc] px-1.5 py-0.5 text-[10px] font-semibold text-[#f27024]">
                            {sub.plan_name || "Gói dịch vụ"}
                          </span>
                        </div>
                        <p className="text-xs text-[#545f73] mt-0.5">
                          Hạn dùng: {sub.end_date ? new Date(sub.end_date).toLocaleDateString("vi-VN") : "Vô thời hạn"}
                          {isExpiring && <span className="ml-2 font-bold text-[#f27024]">Sắp hết hạn</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRemindRenewal(sub.id, sub.school_name)}
                          className="rounded-lg border border-[#f5ebe1] bg-white px-2.5 py-1 text-xs font-medium text-[#545f73] hover:bg-[#fff8f5] hover:text-[#f27024] transition cursor-pointer"
                          title="Gửi nhắc nhở gia hạn đến School Admin"
                        >
                          <Bell className="h-3.5 w-3.5 inline mr-1 text-[#f27024]" />
                          Nhắc gia hạn
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RECENT TRANSACTIONS TABLE */}
        {/* ======================================================== */}
        <div className="rounded-3xl border border-[#f5ebe1] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#1f1b17]">Lịch sử Giao dịch thanh toán gần nhất</h2>
              <p className="text-xs text-[#545f73]">Theo dõi các đợt kích hoạt và gia hạn thuê bao qua VietQR PayOS</p>
            </div>
            <Link
              to="/manager/payments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#f27024] hover:text-[#d95c14]"
            >
              Xem tất cả giao dịch <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fff8f5] text-xs font-bold text-[#8c7166] uppercase tracking-wider border-b border-[#f5ebe1]">
                <tr>
                  <th className="py-2.5 px-3">Mã đơn</th>
                  <th className="py-2.5 px-3">Cơ sở đào tạo</th>
                  <th className="py-2.5 px-3">Gói thuê bao</th>
                  <th className="py-2.5 px-3">Số tiền</th>
                  <th className="py-2.5 px-3">Cổng</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5ebe1] text-[#1f1b17]">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#8c7166]">
                      Chưa có giao dịch nào phát sinh.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#fff8f5] transition-colors">
                      <td className="py-3 px-3 font-mono text-xs font-semibold text-[#1f1b17]">
                        {tx.order_reference || tx.id?.slice(0, 8)}
                      </td>
                      <td className="py-3 px-3 font-medium text-[#1f1b17]">
                        {tx.school_name || tx.school_code}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#545f73]">{tx.plan_name || "—"}</td>
                      <td className="py-3 px-3 font-bold text-[#1f1b17]">
                        {Number(tx.amount || 0).toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded bg-[#fff8f5] border border-[#ffdbcc] px-2 py-0.5 text-[11px] font-semibold text-[#f27024] uppercase">
                          {tx.payment_method || "payos"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            tx.status === "success"
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.status === "success" ? "Thành công" : tx.status === "pending" ? "Đang chờ" : tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-[#8c7166]">
                        {tx.created_at ? new Date(tx.created_at).toLocaleString("vi-VN") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Invite School Admin */}
        {inviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-[#f5ebe1]">
              <div className="flex items-center justify-between border-b border-[#f5ebe1] pb-3">
                <h3 className="text-base font-bold text-[#1f1b17]">Mời School Admin</h3>
                <button
                  onClick={() => {
                    setInviteModalOpen(false);
                    setInviteResult(null);
                    setInviteEmail("");
                  }}
                  className="rounded-lg p-1 text-[#8c7166] hover:bg-[#fff8f5] cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {inviteResult ? (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-800">
                    <p className="font-semibold">Đã tạo liên kết bàn giao thành công!</p>
                    <p className="text-xs mt-1">Gửi liên kết bên dưới cho School Admin để hoàn tất kích hoạt trường:</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={`${window.location.origin}${inviteResult.inviteUrl}`}
                      className="w-full rounded-lg border border-[#f5ebe1] bg-[#fff8f5] px-3 py-2 text-xs font-mono text-[#1f1b17] select-all"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${inviteResult.inviteUrl}`);
                        alert("Đã sao chép liên kết bàn giao!");
                      }}
                      className="rounded-lg bg-[#f27024] px-3 py-2 text-xs font-semibold text-white hover:bg-[#d95c14] whitespace-nowrap cursor-pointer"
                    >
                      Sao chép
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setInviteModalOpen(false);
                      setInviteResult(null);
                      setInviteEmail("");
                    }}
                    className="w-full mt-2 rounded-lg border border-[#f5ebe1] bg-white py-2 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendInvite} className="mt-4 space-y-4">
                  <p className="text-xs text-[#545f73]">
                    Nhập email đại diện trường. Hệ thống sẽ sinh liên kết bàn giao tenant để School Admin hoàn thiện thông tin trường và thiết lập tài khoản.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-[#1f1b17] mb-1">
                      Email School Admin nhận bàn giao
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@school.edu.vn"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-lg border border-[#f5ebe1] bg-white px-3 py-2 text-sm text-[#1f1b17] focus:border-[#f27024] focus:ring-1 focus:ring-[#f27024]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setInviteModalOpen(false)}
                      className="rounded-lg border border-[#f5ebe1] bg-white px-3 py-2 text-xs font-semibold text-[#545f73] hover:bg-[#fff8f5] cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="rounded-lg bg-[#f27024] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d95c14] disabled:opacity-50 transition cursor-pointer"
                    >
                      {inviting ? "Đang gửi…" : "Tạo & Gửi lời mời"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
