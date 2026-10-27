import React, { useCallback, useEffect, useState } from 'react';
import { Clock, Flame, Target, CheckCircle2 } from 'lucide-react';
import FocusService from '../../services/focus.service';
import { formatDuration, formatDateTimeVN, formatShortDate, weekdayLabel } from '../../helper/focusFormat';

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl bg-white/[0.08] p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/60">
        <Icon size={13} /> {label}
      </div>
      <div className="text-lg font-extrabold text-white">{value}</div>
      {sub && <div className="text-[11px] text-white/50">{sub}</div>}
    </div>
  );
}

function BarChart({ items, getLabel, getValue }) {
  const max = Math.max(1, ...items.map(getValue));
  return (
    <div className="flex h-28 items-end gap-1.5" role="img" aria-label="Biểu đồ thời gian tập trung">
      {items.map((item) => {
        const value = getValue(item);
        const height = Math.max(value > 0 ? 6 : 2, (value / max) * 100);
        return (
          <div key={getLabel(item)} className="group relative flex flex-1 flex-col items-center justify-end gap-1">
            <span className="pointer-events-none absolute -top-5 hidden whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white group-hover:block">
              {formatDuration(value)}
            </span>
            <div
              className={`w-full rounded-t ${value > 0 ? 'bg-orange-500' : 'bg-white/15'}`}
              style={{ height: `${height}%` }}
            />
            <span className="text-[10px] text-white/60">{getLabel(item)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Thống kê tổng, theo ngày/tuần và lịch sử phiên học (phân trang). */
export default function FocusStatsPanel({ refreshKey }) {
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [history, setHistory] = useState({ items: [], pagination: null });
  const [page, setPage] = useState(1);
  const [range, setRange] = useState('daily');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, d, w, h] = await Promise.all([
        FocusService.getSummary(),
        FocusService.getDaily(7),
        FocusService.getWeekly(8),
        FocusService.getHistory({ page, limit: 5 }),
      ]);
      setSummary(s.data);
      setDaily(d.data);
      setWeekly(w.data);
      setHistory(h.data);
      setError(null);
    } catch {
      setError('Không tải được thống kê.');
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (!summary) return <p className="text-sm text-white/70">Đang tải thống kê…</p>;

  const { total, today } = summary;
  const pg = history.pagination;

  return (
    <div className="flex flex-col gap-5 text-white">
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={Clock} label="Hôm nay" value={formatDuration(today.focusSeconds)} sub={`${today.pomodoros} Pomodoro`} />
        <StatCard icon={Flame} label="Tổng thời gian" value={formatDuration(total.focusSeconds)} sub={`TB ${formatDuration(total.averageSessionSeconds)}/phiên`} />
        <StatCard icon={CheckCircle2} label="Phiên hoàn thành" value={total.sessions} sub={total.cancelledSessions ? `${total.cancelledSessions} phiên bỏ dở` : 'Không có phiên bỏ dở'} />
        <StatCard icon={Target} label="Pomodoro" value={total.pomodoros} sub={`Dài nhất ${formatDuration(total.longestSessionSeconds)}`} />
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">Thời gian tập trung</h3>
          <div className="flex rounded-lg bg-white/10 p-0.5 text-xs font-semibold">
            {[['daily', '7 ngày'], ['weekly', '8 tuần']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                className={`rounded-md px-2.5 py-1 ${range === key ? 'bg-orange-500 text-white' : 'text-white/70'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {range === 'daily' ? (
          <BarChart items={daily} getLabel={(d) => weekdayLabel(d.date)} getValue={(d) => d.focusSeconds} />
        ) : (
          <BarChart items={weekly} getLabel={(w) => formatShortDate(w.weekStart)} getValue={(w) => w.focusSeconds} />
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/70">Lịch sử phiên học</h3>
        {history.items.length === 0 ? (
          <p className="rounded-lg bg-white/[0.07] px-3 py-4 text-center text-sm text-white/60">Chưa có phiên học nào kết thúc.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.items.map((s) => (
              <li key={s.id} className="rounded-lg bg-white/[0.07] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{formatDuration(s.focusSeconds)}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${s.status === 'COMPLETED' ? 'bg-emerald-500/25 text-emerald-200' : 'bg-white/15 text-white/70'}`}>
                    {s.status === 'COMPLETED' ? 'Hoàn thành' : 'Bỏ dở'}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between text-[11px] text-white/60">
                  <span className="truncate">{s.todoTitle ? `📌 ${s.todoTitle}` : 'Không gắn nhiệm vụ'}</span>
                  <span className="shrink-0">{s.completedPomodoros} 🍅 • {formatDateTimeVN(s.startedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pg && pg.totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between text-xs text-white/70">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md bg-white/10 px-2.5 py-1 disabled:opacity-40">← Trước</button>
            <span>{pg.page}/{pg.totalPages}</span>
            <button type="button" disabled={page >= pg.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md bg-white/10 px-2.5 py-1 disabled:opacity-40">Sau →</button>
          </div>
        )}
      </section>
    </div>
  );
}

