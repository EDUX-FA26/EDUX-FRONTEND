import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Square, Coffee, BrainCircuit, WifiOff } from 'lucide-react';
import { PHASE_LABEL, formatClock } from '../../helper/focusFormat';

const RADIUS = 118;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PHASE_COLOR = {
  FOCUS: '#f27024',
  SHORT_BREAK: '#34d399',
  LONG_BREAK: '#38bdf8',
};

function PomodoroDots({ current, total, phase }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`Tiến độ Pomodoro ${current}/${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-3 w-3 rounded-full border transition-all ${
            i < current ? 'border-transparent bg-orange-500 shadow-[0_0_8px_rgba(242,112,36,.8)]' : 'border-white/40 bg-white/10'
          } ${i === current && phase === 'FOCUS' ? 'animate-pulse border-orange-300' : ''}`}
        />
      ))}
      <span className="ml-2 text-xs font-semibold text-white/70">{current}/{total}</span>
    </div>
  );
}

function ActionButton({ onClick, disabled, variant = 'ghost', icon: Icon, children }) {
  const styles = {
    primary: 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-400',
    ghost: 'bg-white/10 text-white hover:bg-white/20 border border-white/20',
    danger: 'bg-red-500/80 text-white hover:bg-red-500',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

/**
 * Đồng hồ Pomodoro. Chỉ hiển thị — toàn bộ logic thời gian nằm ở BE + hook useFocusSession.
 */
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
}) {
  const [confirming, setConfirming] = useState(null); // 'finish' | 'cancel' | null

  const active = Boolean(session);
  const phase = session?.phase || 'FOCUS';
  const color = PHASE_COLOR[phase];
  const running = session?.status === 'IN_PROGRESS';
  // Pha vừa hết giờ, đang chờ người học bắt đầu pha kế tiếp
  const waitingNextPhase = active && !running && session.phaseElapsedMs === 0 && session.phaseSeq > 1;

  const displayMs = active ? remainingMs : (idleConfig?.focusMinutes || 25) * 60_000;
  const dash = CIRCUMFERENCE * (1 - (active ? progress : 0));

  const cycleLength = session?.config.longBreakEvery || idleConfig?.longBreakEvery || 4;
  const dotsDone = session?.pomodoroProgress.current || 0;

  const statusText = !active
    ? 'Sẵn sàng bắt đầu'
    : waitingNextPhase
      ? `Sẵn sàng: ${PHASE_LABEL[phase]}`
      : running
        ? PHASE_LABEL[phase]
        : `${PHASE_LABEL[phase]} • Tạm dừng`;

  const confirmAndRun = (kind, action) => {
    if (confirming === kind) {
      setConfirming(null);
      action();
    } else {
      setConfirming(kind);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {!online && (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-400/20 px-3 py-1.5 text-xs font-semibold text-yellow-100">
          <WifiOff size={14} /> Đang offline — đồng hồ vẫn chạy theo máy chủ, sẽ tự đồng bộ khi có mạng
        </div>
      )}

      <div className="relative h-[280px] w-[280px]">
        <svg viewBox="0 0 280 280" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="140" cy="140" r={RADIUS} fill="rgba(0,0,0,.28)" stroke="rgba(255,255,255,.14)" strokeWidth="10" />
          <circle
            cx="140"
            cy="140"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dash}
            style={{ transition: running ? 'stroke-dashoffset .3s linear' : 'stroke-dashoffset .5s ease' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <span className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest" style={{ color }}>
            {phase === 'FOCUS' ? <BrainCircuit size={14} /> : <Coffee size={14} />}
            {statusText}
          </span>
          <span
            className="font-mono text-6xl font-bold tabular-nums drop-shadow-lg"
            role="timer"
            aria-live="off"
          >
            {formatClock(displayMs)}
          </span>
          {active && (
            <span className="mt-1 text-xs text-white/60">
              Pomodoro hoàn thành: <b className="text-white">{session.completedPomodoros}</b>
            </span>
          )}
        </div>
      </div>

      <PomodoroDots current={dotsDone} total={cycleLength} phase={phase} />

      {session?.todoTitle && (
        <p className="max-w-xs truncate rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
          📌 {session.todoTitle}
        </p>
      )}

      {/* Điều khiển */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!active && (
          <ActionButton variant="primary" icon={Play} disabled={busy} onClick={onStart}>
            Bắt đầu học
          </ActionButton>
        )}

        {active && running && (
          <ActionButton variant="primary" icon={Pause} disabled={busy} onClick={onPause}>
            Tạm dừng
          </ActionButton>
        )}

        {active && !running && (
          <ActionButton variant="primary" icon={Play} disabled={busy} onClick={onResume}>
            {waitingNextPhase ? `Bắt đầu ${PHASE_LABEL[phase].toLowerCase()}` : 'Tiếp tục'}
          </ActionButton>
        )}

        {active && (
          <>
            <ActionButton icon={RotateCcw} disabled={busy} onClick={onResetPhase}>
              Làm lại pha
            </ActionButton>

            {confirming === 'finish' ? (
              <>
                <ActionButton variant="danger" icon={Square} disabled={busy} onClick={() => confirmAndRun('finish', onFinish)}>
                  Xác nhận kết thúc
                </ActionButton>
                <ActionButton disabled={busy} onClick={() => setConfirming(null)}>Huỷ</ActionButton>
              </>
            ) : confirming === 'cancel' ? (
              <>
                <ActionButton variant="danger" disabled={busy} onClick={() => confirmAndRun('cancel', onCancel)}>
                  Xác nhận bỏ phiên
                </ActionButton>
                <ActionButton disabled={busy} onClick={() => setConfirming(null)}>Giữ lại</ActionButton>
              </>
            ) : (
              <>
                <ActionButton icon={Square} disabled={busy} onClick={() => setConfirming('finish')}>
                  Kết thúc
                </ActionButton>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirming('cancel')}
                  className="text-xs font-semibold text-white/60 underline-offset-2 hover:text-white hover:underline disabled:opacity-50"
                >
                  Bỏ phiên
                </button>
              </>
            )}
          </>
        )}
      </div>

      {error && (
        <div role="alert" className="flex max-w-sm items-start gap-2 rounded-lg bg-red-500/25 px-3 py-2 text-xs font-semibold text-red-100">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={onDismissError} aria-label="Đóng thông báo" className="text-red-100/80 hover:text-white">✕</button>
        </div>
      )}
    </div>
  );
}

