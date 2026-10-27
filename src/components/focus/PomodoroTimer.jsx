import React, { useState } from 'react';
import { Play, Pause, X, Check, WifiOff } from 'lucide-react';
import { PHASE_LABEL, formatClock } from '../../helper/focusFormat';
export default function PomodoroTimer({
  session,
  idleConfig,
  remainingMs,
  progress,
  busy,
  online,
  error,
  onDismissError,
  onStart,
  onPause,
  onResume,
  onResetPhase,
  onFinish,
  onCancel,
  timerMode = 'pomodoro', // 'classic' | 'pomodoro' | 'stopwatch'
  customGoalTitle = '',
}) {
  const [adjustMs, setAdjustMs] = useState(0);
  const [confirming, setConfirming] = useState(null); // 'cancel' | 'finish' | null

  const active = Boolean(session);
  const phase = session?.phase || 'FOCUS';
  const running = session?.status === 'IN_PROGRESS';
  const waitingNextPhase = active && !running && session.phaseElapsedMs === 0 && session.phaseSeq > 1;

  // Tính thời gian hiển thị:
  // - Nếu là Stopwatch: đếm tiến (count-up) từ 0
  // - Nếu là Pomodoro / Classic: đếm lùi (countdown)
  const isStopwatch = timerMode === 'stopwatch';
  const baseMs = active ? remainingMs : (idleConfig?.focusMinutes || 25) * 60_000;
  const elapsedMs = session?.phaseElapsedMs || 0;

  const displayMs = isStopwatch
    ? Math.max(0, elapsedMs + adjustMs)
    : Math.max(0, baseMs + adjustMs);

  const title = customGoalTitle || session?.todoTitle || (
    isStopwatch
      ? 'Stopwatch'
      : !active
      ? 'Focus Session'
      : waitingNextPhase
      ? `Sẵn sàng: ${PHASE_LABEL[phase]}`
      : PHASE_LABEL[phase] || 'Tutorial'
  );

  const handleTogglePlay = () => {
    if (!active) {
      const minutes = Math.max(1, Math.round(displayMs / 60_000));
      onStart?.({ focusMinutes: minutes });
      setAdjustMs(0);
    } else if (running) {
      onPause?.();
    } else {
      onResume?.();
    }
  };

  const handleMinusMinute = () => {
    if (displayMs > 60_000) {
      setAdjustMs((prev) => prev - 60_000);
    }
  };

  const handleAddMinute = () => {
    setAdjustMs((prev) => prev + 60_000);
  };

  const handleCancel = () => {
    if (confirming === 'cancel') {
      setConfirming(null);
      setAdjustMs(0);
      if (active) onCancel?.();
    } else {
      setConfirming('cancel');
      setTimeout(() => setConfirming(null), 3000);
    }
  };

  const handleFinish = () => {
    if (confirming === 'finish') {
      setConfirming(null);
      setAdjustMs(0);
      if (active) onFinish?.();
    } else {
      setConfirming('finish');
      setTimeout(() => setConfirming(null), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center select-none animate-fade-in">
      {/* Tiêu đề Focus / Tutorial / Goal (chuẩn theo ảnh 1 & 2) */}
      <div className="text-sm font-semibold text-white/80 tracking-wide mb-1.5 truncate max-w-[240px] text-center drop-shadow-sm">
        {title}
      </div>

      {/* Card hẹn giờ bo tròn kiểu Lofi Cottage */}
      <div
        className="
          w-[220px] sm:w-[240px]
          rounded-2xl
          bg-[#1e172a]/75 backdrop-blur-xl
          border border-white/20
          text-white
          shadow-2xl
          py-3 px-4
          flex flex-col items-center justify-center
          transition-all
        "
        style={{
          boxShadow: '0 16px 36px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {/* Đồng hồ hiển thị thời gian mm:ss */}
        <div className="font-sans text-3xl font-medium tracking-wider text-white py-1 tabular-nums">
          {formatClock(displayMs)}
        </div>

        {/* Hàng điều khiển 5 nút: 1:00  ✕  ❚❚  ✓  +1:00 */}
        <div className="w-full flex items-center justify-between text-white/50 px-1 pt-1.5">
          {/* -1:00 */}
          <button
            type="button"
            onClick={handleMinusMinute}
            disabled={busy || displayMs <= 60_000}
            title="Giảm 1 phút"
            className="text-xs font-medium text-white/40 hover:text-white transition disabled:opacity-20 cursor-pointer select-none tabular-nums"
          >
            -1:00
          </button>

          {/* ✕ (Huỷ / Bỏ phiên / Đặt lại) */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy || !active}
            title={confirming === 'cancel' ? 'Bấm lần nữa để xác nhận huỷ' : 'Huỷ phiên'}
            className={`p-1 transition cursor-pointer active:scale-90 ${
              confirming === 'cancel'
                ? 'text-red-400 animate-pulse'
                : 'text-white/40 hover:text-red-400 disabled:opacity-20'
            }`}
          >
            <X size={17} strokeWidth={2.4} />
          </button>

          {/* ❚❚ hoặc ▶ (Phát / Tạm dừng) */}
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={busy}
            title={running ? 'Tạm dừng' : active ? 'Tiếp tục' : 'Bắt đầu học'}
            className="p-1 text-white/85 hover:text-white transition hover:scale-110 active:scale-95 cursor-pointer"
          >
            {running ? (
              <Pause size={19} strokeWidth={2.6} fill="currentColor" />
            ) : (
              <Play size={19} strokeWidth={2.6} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          {/* ✓ (Hoàn thành pha) */}
          <button
            type="button"
            onClick={handleFinish}
            disabled={busy || !active}
            title={confirming === 'finish' ? 'Bấm lần nữa để xác nhận hoàn thành' : 'Hoàn thành phiên'}
            className={`p-1 transition cursor-pointer active:scale-90 ${
              confirming === 'finish'
                ? 'text-teal-400 animate-pulse'
                : 'text-white/40 hover:text-teal-400 disabled:opacity-20'
            }`}
          >
            <Check size={18} strokeWidth={2.6} />
          </button>

          {/* +1:00 */}
          <button
            type="button"
            onClick={handleAddMinute}
            disabled={busy}
            title="Thêm 1 phút"
            className="text-xs font-medium text-white/40 hover:text-white transition disabled:opacity-20 cursor-pointer select-none tabular-nums"
          >
            +1:00
          </button>
        </div>
      </div>

      {/* Thông báo offline hoặc xác nhận nếu có */}
      {!online && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-yellow-300 bg-yellow-900/40 px-2 py-0.5 rounded-lg border border-yellow-500/30">
          <WifiOff size={12} /> Đang chạy offline
        </div>
      )}
      {confirming && (
        <span className="mt-1 text-[11px] text-orange-300 animate-fade-in font-medium">
          {confirming === 'cancel' ? 'Bấm ✕ lần nữa để huỷ phiên' : 'Bấm ✓ lần nữa để hoàn thành'}
        </span>
      )}
      {error && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-red-300 bg-red-900/40 px-2 py-0.5 rounded-lg border border-red-500/30">
          <span className="truncate max-w-[200px]">{error}</span>
          <button type="button" onClick={onDismissError} className="hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
}
