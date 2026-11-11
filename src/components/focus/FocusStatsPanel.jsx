import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Clock, Flame, Target, CheckCircle2, BarChart2, X,
  Sparkles, Lightbulb, TrendingUp, TrendingDown, Calendar,
  PieChart, ListTodo, RotateCcw, Award, Zap, ChevronLeft, ChevronRight,
  HelpCircle, AlertCircle
} from 'lucide-react';
import FocusService from '../../services/focus.service';
import {
  formatDuration,
  formatDateTimeVN,
  formatShortDate,
  weekdayLabel,
} from '../../helper/focusFormat';

const TIMEFRAMES = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'last_7_days', label: '7 ngày' },
  { key: 'last_30_days', label: '30 ngày' },
  { key: 'this_semester', label: 'Học kỳ' },
  { key: 'all_time', label: 'Tất cả' },
];

const TABS = [
  { key: 'overview', label: 'Tổng quan', icon: BarChart2 },
  { key: 'heatmap', label: 'Bản đồ & Todo', icon: Flame },
  { key: 'insights', label: 'Trợ lý AI', icon: Sparkles },
  { key: 'history', label: 'Lịch sử', icon: Clock },
];

/** Thẻ chỉ số tổng quan phong cách Lofi Glassmorphism */
function StatCard({ icon: Icon, label, value, sub, trend, trendValue, color = 'orange' }) {
  const colorMap = {
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  };

  return (
    <div className="rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200">
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5 truncate">
          <Icon size={14} className={colorMap[color].split(' ')[0]} />
          {label}
        </span>
        {trend && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${trend === 'up' ? 'text-emerald-300 bg-emerald-500/20' : 'text-rose-300 bg-rose-500/20'}`}>
            {trend === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trendValue}
          </span>
        )}
      </div>
      <div>
        <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight" style={{ color: '#ffffff' }}>
          {value}
        </div>
        {sub && <div className="text-[11px] text-white/50 mt-1 truncate">{sub}</div>}
      </div>
    </div>
  );
}

/** Biểu đồ phân bổ tròn Donut Chart vẽ bằng SVG thuần (Pomodoro vs Stopwatch) */
function ModeDonutChart({ modes = [], totalSeconds = 0, peakSlot }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  const pomo = modes.find((m) => m.mode === 'pomodoro') || { percentage: 0, focusSeconds: 0 };
  const stop = modes.find((m) => m.mode === 'stopwatch') || { percentage: 0, focusSeconds: 0 };

  const pomoStroke = (pomo.percentage / 100) * circumference;
  const stopStroke = (stop.percentage / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-white/[0.04] border border-white/10">
      <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="11" />
          {/* Pomodoro Segment */}
          {pomo.percentage > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#f97316"
              strokeWidth="11"
              strokeDasharray={`${pomoStroke} ${circumference}`}
              strokeDashoffset="0"
              className="transition-all duration-700 ease-out"
            />
          )}
          {/* Stopwatch Segment */}
          {stop.percentage > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#a855f7"
              strokeWidth="11"
              strokeDasharray={`${stopStroke} ${circumference}`}
              strokeDashoffset={-pomoStroke}
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs font-bold text-white" style={{ color: '#ffffff' }}>Phân bổ</span>
          <span className="text-[10px] text-white/60">{formatDuration(totalSeconds)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 flex-1 w-full text-xs">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
            <span className="text-white/90 font-medium">Pomodoro</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-white">{pomo.percentage}%</span>
            <span className="text-[10px] text-white/50 ml-1.5">({formatDuration(pomo.focusSeconds)})</span>
          </div>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
            <span className="text-white/90 font-medium">Stopwatch</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-white">{stop.percentage}%</span>
            <span className="text-[10px] text-white/50 ml-1.5">({formatDuration(stop.focusSeconds)})</span>
          </div>
        </div>

        {peakSlot && (
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-300 font-medium">
            <Zap size={13} className="text-amber-400 shrink-0" />
            <span>Khung giờ vàng: <b className="text-white font-bold">{peakSlot.label}</b> ({peakSlot.percentage}%)</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Biểu đồ cột hoạt động hàng ngày (Daily Bar Chart) phân tách Pomodoro & Stopwatch */
function DailyBarChart({ items = [] }) {
  const max = Math.max(1, ...items.map((i) => i.focusSeconds || 0));

  return (
    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ color: '#ffffff' }}>Hoạt động từng ngày</span>
        <div className="flex items-center gap-3 text-[11px] text-white/70">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Pomodoro</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Stopwatch</span>
        </div>
      </div>

      <div className="flex h-36 items-end gap-1.5 sm:gap-2.5 pt-6 pb-1" role="img" aria-label="Biểu đồ cột hoạt động">
        {items.map((item) => {
          const total = item.focusSeconds || 0;
          const pomo = item.pomodoroFocusSeconds || 0;
          const stop = item.stopwatchFocusSeconds || 0;
          const height = Math.max(total > 0 ? 8 : 2, (total / max) * 100);

          const pomoPct = total > 0 ? (pomo / total) * 100 : 100;
          const stopPct = total > 0 ? (stop / total) * 100 : 0;

          return (
            <div key={item.date} className="group relative flex flex-1 flex-col items-center justify-end h-full">
              {/* Tooltip khi hover */}
              <div className="pointer-events-none absolute -top-12 z-20 hidden whitespace-nowrap rounded-xl bg-black/90 p-2 text-[10px] text-white group-hover:flex flex-col shadow-xl border border-white/10">
                <span className="font-bold text-orange-300">{formatShortDate(item.date)} ({weekdayLabel(item.date)})</span>
                <span>Tổng: {formatDuration(total)} ({item.sessions || 0} phiên)</span>
                {stop > 0 && <span className="text-purple-300">Stopwatch: {formatDuration(stop)}</span>}
              </div>

              {/* Bar container */}
              <div
                className="w-full max-w-[28px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:brightness-110"
                style={{ height: `${height}%` }}
              >
                {total > 0 ? (
                  <>
                    {stopPct > 0 && (
                      <div style={{ height: `${stopPct}%` }} className="w-full bg-purple-500" />
                    )}
                    {pomoPct > 0 && (
                      <div style={{ height: `${pomoPct}%` }} className="w-full bg-orange-500" />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-white/10" />
                )}
              </div>

              {/* X-axis label */}
              <span className="text-[10px] text-white/60 mt-1.5 group-hover:text-white transition-colors">
                {formatShortDate(item.date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Bản đồ nhiệt học tập (Study Consistency Heatmap: 120-180 ngày) */
function ConsistencyHeatmap({ items = [] }) {
  const [hovered, setHovered] = useState(null);

  const weeks = useMemo(() => {
    if (!items.length) return [];
    const res = [];
    let currentWeek = [];

    const firstDay = new Date(`${items[0].date}T00:00:00Z`).getUTCDay();
    const leadingBlanks = (firstDay + 6) % 7;
    for (let i = 0; i < leadingBlanks; i++) {
      currentWeek.push(null);
    }

    items.forEach((item) => {
      currentWeek.push(item);
      if (currentWeek.length === 7) {
        res.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      res.push(currentWeek);
    }

    return res;
  }, [items]);

  const levelColors = [
    'bg-white/[0.07]',
    'bg-amber-900/70 hover:ring-1 hover:ring-amber-500',
    'bg-amber-600 hover:ring-1 hover:ring-amber-400',
    'bg-orange-500 hover:ring-1 hover:ring-orange-300',
    'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] hover:ring-1 hover:ring-white',
  ];

  return (
    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ color: '#ffffff' }}>Bản đồ nhiệt nhất quán</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-white/50 select-none">
          <span>Ít</span>
          {levelColors.map((cls, idx) => (
            <span key={idx} className={`w-3 h-3 rounded-xs ${cls.split(' ')[0]}`} />
          ))}
          <span>Nhiều</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4a3b5c transparent' }}>
        <div className="flex gap-1.5 min-w-max">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day, dIdx) => {
                if (!day) {
                  return <div key={dIdx} className="w-3.5 h-3.5 rounded-xs opacity-0" />;
                }
                return (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHovered(day)}
                    onMouseLeave={() => setHovered(null)}
                    className={`w-3.5 h-3.5 rounded-xs transition-transform cursor-pointer hover:scale-125 ${levelColors[day.level] || levelColors[0]}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 text-xs text-white/70 min-h-[20px] flex items-center justify-between">
        {hovered ? (
          <span>
            <b className="text-orange-300 font-bold">{formatShortDate(hovered.date)}</b>: {formatDuration(hovered.focusSeconds)} ({hovered.count} phiên, {hovered.pomodoros} 🍅)
          </span>
        ) : (
          <span className="text-[11px] text-white/40 italic">Rê chuột vào ô bất kỳ để xem thời gian học</span>
        )}
      </div>
    </div>
  );
}

/** Tiến độ hoàn thành nhiệm vụ gắn với phiên học */
function TodosProgressPanel({ todosData }) {
  const { overview, topTasks = [] } = todosData || {};
  const rate = overview?.completionRate || 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white" style={{ color: '#ffffff' }}>Tỷ lệ hoàn thành nhiệm vụ</span>
          <span className="text-sm font-extrabold text-teal-300">{rate}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, rate)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] text-white/60">
          <span>{overview?.completedTasks || 0} đã hoàn thành</span>
          <span>{overview?.totalLinkedTasks || 0} nhiệm vụ đã gắn phiên</span>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
        <div className="text-xs font-bold uppercase tracking-wider text-white mb-3" style={{ color: '#ffffff' }}>Nhiệm vụ được tập trung nhiều nhất</div>
        {topTasks.length === 0 ? (
          <p className="text-xs text-white/50 text-center py-4">Chưa có nhiệm vụ nào được gắn phiên học trong khoảng thời gian này.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {topTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${t.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="truncate text-white font-medium" style={{ color: '#ffffff' }}>{t.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-white/70">
                  <span className="text-[11px] font-mono text-orange-300 font-bold">{formatDuration(t.focusSeconds)}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {t.status === 'COMPLETED' ? 'Hoàn thành' : 'Đang làm'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Tab Trợ lý Phân tích AI Insights - Font chữ sáng rực rỡ, độ tương phản cao */
function AiInsightsTab({ insights, onRefresh, loading }) {
  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center gap-3 text-center min-h-[220px]">
        <Sparkles size={24} className="text-orange-400 animate-spin" />
        <span className="text-xs text-white/70">Trợ lý AI đang phân tích dữ liệu học tập của bạn…</span>
      </div>
    );
  }

  const { headline, highlights = [], recommendation, isAiGenerated } = insights || {};

  return (
    <div className="flex flex-col gap-4">
      {/* Hero Quote Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-purple-500/15 to-white/[0.03] p-5 sm:p-6 border border-orange-500/40 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5" style={{ color: '#fb923c' }}>
            <Sparkles size={14} className="animate-pulse text-orange-400" />
            {isAiGenerated ? 'Phân tích AI Thông Minh' : 'Cố Vấn Học Tập Edutrack'}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            title="Làm mới phân tích"
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div
          className="text-base sm:text-lg font-bold tracking-wide leading-relaxed"
          style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
        >
          "{headline || 'Khởi đầu đã có nhưng cần sự kiên trì để bứt phá!'}"
        </div>
      </div>

      {/* Highlights */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.05] border border-white/10">
        <div
          className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
          style={{ color: '#2dd4bf' }}
        >
          <Award size={15} className="text-teal-400" /> Điểm sáng học tập
        </div>
        <ul className="flex flex-col gap-2.5">
          {highlights.map((h, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs leading-relaxed" style={{ color: '#ffffff' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0 shadow-[0_0_6px_#2dd4bf]" />
              <span className="text-white font-medium" style={{ color: '#ffffff' }}>{h}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actionable Recommendation */}
      {recommendation && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs flex items-start gap-3 shadow-md">
          <Lightbulb size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <span className="font-bold uppercase tracking-wider text-[11px]" style={{ color: '#fcd34d' }}>
              Gợi ý cải thiện hiệu suất
            </span>
            <p className="leading-relaxed font-normal" style={{ color: '#fef3c7' }}>
              {recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Tab Lịch sử phiên học chi tiết (Session History) */
function SessionHistoryTab({ history, page, setPage }) {
  const { items = [], pagination: pg } = history || {};

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="rounded-xl bg-white/[0.04] p-8 text-center text-xs text-white/50">
          Chưa có phiên học nào được lưu lại.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((s) => (
            <div key={s.id} className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/5 transition flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white font-mono" style={{ color: '#ffffff' }}>{formatDuration(s.focusSeconds)}</span>
                  <span className="text-[10px] font-semibold text-white/50">
                    {s.timerMode === 'stopwatch' ? '⏱️ Stopwatch' : '🍅 Pomodoro'}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/50'}`}>
                  {s.status === 'COMPLETED' ? 'Hoàn thành' : 'Bỏ dở'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-white/60">
                <span className="truncate max-w-[220px] sm:max-w-xs">{s.todoTitle ? `📌 ${s.todoTitle}` : s.note ? `📝 ${s.note}` : 'Không gắn nhiệm vụ'}</span>
                <span className="shrink-0">{formatDateTimeVN(s.startedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pg && pg.totalPages > 1 && (
        <div className="mt-2 flex items-center justify-between text-xs text-white/60 pt-2 border-t border-white/10">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ChevronLeft size={13} /> Trước
          </button>
          <span>Trang {pg.page} / {pg.totalPages}</span>
          <button
            type="button"
            disabled={page >= pg.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            Sau <ChevronRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

/** Dashboard Thống kê Focus Room Toàn Diện */
export default function FocusStatsPanel({ refreshKey, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('last_7_days');

  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [todosData, setTodosData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [history, setHistory] = useState({ items: [], pagination: null });
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [oRes, dRes, hRes, distRes, tRes, histRes] = await Promise.all([
        FocusService.getOverview({ timeframe }),
        FocusService.getDailyStats({ timeframe }),
        FocusService.getHeatmap(120),
        FocusService.getDistribution({ timeframe }),
        FocusService.getTodosStats({ timeframe, limit: 10 }),
        FocusService.getHistory({ page, limit: 6 }),
      ]);

      setOverview(oRes.data);
      setDaily(dRes.data || []);
      setHeatmap(hRes.data || []);
      setDistribution(distRes.data);
      setTodosData(tRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error('Focus stats load error:', err);
      setError('Không thể tải dữ liệu thống kê. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [timeframe, page]);

  const loadInsights = useCallback(async () => {
    try {
      setInsightsLoading(true);
      const res = await FocusService.getInsights({ timeframe });
      setInsights(res.data);
    } catch (err) {
      console.warn('Insights load notice:', err.message);
    } finally {
      setInsightsLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  useEffect(() => {
    if (activeTab === 'insights') {
      loadInsights();
    }
  }, [activeTab, loadInsights]);

  const m = overview?.metrics;
  const comp = overview?.comparison;

  return (
    <div className="flex flex-col gap-4 text-white">
      {/* ── HEADER: Tiêu đề + Timeframe Select + Close button ── */}
      <div className="flex flex-col gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} className="text-orange-400" />
            <span className="text-base font-bold tracking-wide" style={{ color: '#ffffff' }}>Thống kê Focus Room</span>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                title="Đóng bảng thống kê"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Timeframe selector pill buttons */}
        <div className="flex items-center gap-1 overflow-x-auto bg-white/[0.04] p-1 rounded-xl border border-white/5 text-xs font-semibold">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.key}
              type="button"
              onClick={() => setTimeframe(tf.key)}
              className={`rounded-lg px-2.5 sm:px-3 py-1 transition-all whitespace-nowrap active:scale-95 ${timeframe === tf.key ? 'bg-orange-500 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex items-center gap-1 border-b border-white/10 pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-white/15 text-white shadow-xs' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
            >
              <Icon size={14} className={isActive ? 'text-orange-400' : ''} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ── */}
      {error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : loading && !overview ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-white/50 text-xs">
          <BarChart2 size={24} className="text-orange-400 animate-pulse" />
          <span>Đang nạp dữ liệu thống kê…</span>
        </div>
      ) : (
        <>
          {/* TAB 1: TỔNG QUAN */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <StatCard
                  icon={Clock}
                  label="Tổng thời gian"
                  value={formatDuration(m?.totalFocusSeconds)}
                  sub={comp?.diffPercent !== undefined ? `${comp.diffPercent > 0 ? '+' : ''}${comp.diffPercent}% kỳ trước` : undefined}
                  trend={comp?.trend === 'up' ? 'up' : comp?.trend === 'down' ? 'down' : undefined}
                  trendValue={comp?.diffPercent ? `${Math.abs(comp.diffPercent)}%` : undefined}
                  color="orange"
                />

                <StatCard
                  icon={CheckCircle2}
                  label="Phiên hoàn thành"
                  value={m?.completedSessions || 0}
                  sub={m?.cancelledSessions ? `${m.cancelledSessions} phiên bỏ dở` : '100% hoàn thành'}
                  color="emerald"
                />

                <StatCard
                  icon={Flame}
                  label="Chuỗi học tập"
                  value={`${m?.currentStreak || 0} ngày`}
                  sub={`Kỷ lục ${m?.longestStreak || 0} ngày`}
                  color="amber"
                />

                <StatCard
                  icon={Target}
                  label="TB / Phiên"
                  value={formatDuration(m?.averageSessionSeconds)}
                  sub={`Dài nhất ${formatDuration(m?.longestSessionSeconds)}`}
                  color="purple"
                />

                <StatCard
                  icon={ListTodo}
                  label="Hoàn thành Todo"
                  value={`${m?.todoCompletionRate || 0}%`}
                  sub={`${m?.completedLinkedTodos || 0}/${m?.totalLinkedTodos || 0} nhiệm vụ`}
                  color="teal"
                />
              </div>

              <DailyBarChart items={daily} />

              <ModeDonutChart
                modes={distribution?.modes}
                totalSeconds={distribution?.totalFocusSeconds}
                peakSlot={distribution?.peakSlot}
              />
            </div>
          )}

          {/* TAB 2: BẢN ĐỒ NHIỆT & TIẾN ĐỘ TODO */}
          {activeTab === 'heatmap' && (
            <div className="flex flex-col gap-4">
              <ConsistencyHeatmap items={heatmap} />
              <TodosProgressPanel todosData={todosData} />
            </div>
          )}

          {/* TAB 3: TRỢ LÝ AI */}
          {activeTab === 'insights' && (
            <AiInsightsTab
              insights={insights}
              onRefresh={loadInsights}
              loading={insightsLoading}
            />
          )}

          {/* TAB 4: LỊCH SỬ PHIÊN HỌC */}
          {activeTab === 'history' && (
            <SessionHistoryTab
              history={history}
              page={page}
              setPage={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
