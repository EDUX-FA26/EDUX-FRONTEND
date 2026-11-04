import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Volume2,
  X,
} from 'lucide-react';

/**
 * Modal New Session đồng bộ bố cục và phong cách thiết kế của bảng Sound.
 * Tự động zoom (scale) thông minh theo kích thước màn hình / chiều cao phòng học:
 * - Khi màn hình laptop nhỏ hoặc chiều cao thấp: Tự động co tỉ lệ zoom (0.6x - 1.0x) để hiển thị trọn vẹn 100%
 * - Không bao giờ bị tràn hay bị cắt nút Cancel / Confirm ở đáy
 * - 2 chế độ: Pomodoro | Stopwatch
 */
export default function NewSessionModal({
  isOpen,
  onClose,
  onConfirm,
  idleConfig,
  currentTodoTitle,
  onPlayChime,
}) {
  if (!isOpen) return null;

  // 2 Chế độ: 'pomodoro' | 'stopwatch'
  const [timerMode, setTimerMode] = useState('pomodoro');
  const [focusGoal, setFocusGoal] = useState(currentTodoTitle || 'Focus');

  // Cấu hình Pomodoro
  const [focusTime, setFocusTime] = useState(idleConfig?.focusMinutes || 25);
  const [shortBreak, setShortBreak] = useState(idleConfig?.shortBreakMinutes || 5);
  const [longBreak, setLongBreak] = useState(idleConfig?.longBreakMinutes || 15);
  const [longBreakEvery, setLongBreakEvery] = useState(idleConfig?.longBreakEvery || 4);
  const [autoStart, setAutoStart] = useState(idleConfig?.autoStartNext || false);

  // Tự động tính toán scale zoom theo kích thước khung phòng học
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isOpen) return;

    const updateScale = () => {
      const container = containerRef.current;
      const vh = container ? container.clientHeight : window.innerHeight;
      const vw = container ? container.clientWidth : window.innerWidth;

      // Chiều cao thiết kế chuẩn gọn gàng của NewSessionModal là ~425px, chiều rộng ~420px
      const targetHeight = 425;
      const targetWidth = 420;

      // Chừa đệm an toàn 24px để modal luôn lọt thỏm đẹp mắt
      const availableHeight = vh - 24;
      const availableWidth = vw - 24;

      const scaleY = availableHeight / targetHeight;
      const scaleX = availableWidth / targetWidth;
      const factor = Math.min(scaleX, scaleY);

      if (factor < 1) {
        // Tự động zoom nhỏ lại mượt mà khi màn hình thấp
        setScale(Math.max(0.6, Number(factor.toFixed(3))));
      } else {
        setScale(1);
      }
    };

    updateScale();

    let ro;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(updateScale);
      ro.observe(containerRef.current);
    }

    window.addEventListener('resize', updateScale);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [isOpen]);

  // Tooltip mô tả chế độ (theo nguyên bản Virtual Cottage)
  const MODE_DESCRIPTIONS = {
    pomodoro: 'Helps boost focus by breaking work into intervals, typically 25 minutes of focused work followed by 5-minute break',
    stopwatch: 'Counts up until stopped, great for tracking how long a task takes',
  };

  const handleConfirm = () => {
    onConfirm({
      mode: timerMode,
      goalTitle: focusGoal.trim() || 'Focus',
      focusMinutes: Number(focusTime),
      shortBreakMinutes: Number(shortBreak),
      longBreakMinutes: Number(longBreak),
      longBreakEvery: Number(longBreakEvery),
      autoStartNext: autoStart,
    });
    onClose();
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in select-none overflow-hidden"
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container - Tự động zoom theo kích thước màn hình */}
      <div
        className="relative z-30 flex flex-col rounded-3xl border border-[#e8d9c8] bg-[#faf5eb] font-sans text-[#4a3b32] shadow-2xl animate-fade-in select-none my-auto max-h-[96%]"
        style={{
          width: '420px',
          maxWidth: 'calc(100vw - 20px)',
          padding: '16px 22px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 24px 48px -12px rgba(20,10,5,.35), 0 4px 12px rgba(0,0,0,.08)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#d7c4b1 transparent',
        }}
      >
        {/* Nếp gấp giấy ở góc dưới bên trái (chuẩn Virtual Cottage) */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 rounded-tr-md border-r border-t border-[#decaba] bg-[#ede0d0] shadow-sm"
          aria-hidden="true"
        />

        {/* ── HEADER ── */}
        <div className="relative z-20 mb-2 flex items-center justify-between border-b border-[#e8d9c8] pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#efe2d3] text-[#765b49]">
              <Clock size={19} />
            </div>

            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-bold leading-tight tracking-tight text-[#45362e]">
                New Session
              </h3>
            </div>
          </div>

          <div className="relative z-30 flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onPlayChime}
              title="Nghe thử chuông báo"
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl text-[#6d584c] transition-colors hover:bg-[#ecdfd0] hover:text-[#45362e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd8055] cursor-pointer"
            >
              <Volume2 size={18} />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Đóng bảng cài đặt"
              className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-transparent text-[#8b7565] transition-colors hover:bg-[#ecdfd0] hover:text-[#45362e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd8055] cursor-pointer"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── SECTION 1: FOCUS GOAL ── */}
        <section className="mb-2.5">
          <div className="mb-1 flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a705d]">
              Focus Goal
            </h4>
            <span className="text-[11px] text-[#ad9886]">
              Target task
            </span>
          </div>

          <div>
            <input
              type="text"
              value={focusGoal}
              onChange={(e) => setFocusGoal(e.target.value)}
              placeholder="What do you want to focus on today?"
              className="w-full text-center h-10 px-3.5 rounded-2xl bg-[#ede0d0] hover:bg-[#e5d6c4] focus:bg-white border border-[#decaba] text-[#45362e] font-semibold text-sm outline-none transition focus:border-[#74b9be] focus:ring-2 focus:ring-[#74b9be]/30 placeholder:text-[#998372] shadow-2xs"
            />
          </div>
        </section>

        {/* ── SECTION 2: CHOOSE TIMER MODE ── */}
        <section className="border-t border-[#e8d9c8] pt-2.5 mb-2.5">
          <div className="mb-1 flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a705d]">
              Choose Timer
            </h4>
            <span className="text-[11px] text-[#ad9886]">
              2 modes
            </span>
          </div>

          {/* 2 nút Mode: Pomodoro | Stopwatch */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'pomodoro', label: 'Pomodoro' },
              { id: 'stopwatch', label: 'Stopwatch' },
            ].map((m) => {
              const active = timerMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setTimerMode(m.id)}
                  className={`
                    h-10 rounded-2xl text-xs sm:text-[13px] font-bold transition-all text-center cursor-pointer shadow-2xs flex items-center justify-center
                    ${active
                      ? 'bg-[#74b9be] text-white shadow-sm ring-1 ring-[#74b9be]'
                      : 'bg-[#ede0d0] text-[#5c493c] hover:bg-[#e4d4bf] hover:text-[#45362e]'
                    }
                  `}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <p className="mt-1 text-[11px] text-[#786150] italic px-1 text-center leading-tight">
            "{MODE_DESCRIPTIONS[timerMode]}"
          </p>
        </section>

        {/* ── SECTION 3: TIMER CONFIGURATION ── */}
        <section className="border-t border-[#e8d9c8] pt-2.5 mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a705d]">
              Timer Configuration
            </h4>
          </div>

          {/* Hộp bo viền chứa cài đặt bên trong */}
          <div
            className="rounded-2xl border border-[#decaba] bg-[#fbf7f0]/60 p-3 sm:p-3.5 relative"
            style={{
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            {/* 1. CHẾ ĐỘ POMODORO */}
            {timerMode === 'pomodoro' && (
              <div className="space-y-3">
                {/* Hàng 1: 3 cột Focus Time | Short Break | Long Break */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="block text-[11px] font-semibold text-[#786150] mb-0.5">Focus Time</span>
                    <select
                      value={focusTime}
                      onChange={(e) => setFocusTime(Number(e.target.value))}
                      className="w-full h-8.5 px-2 rounded-xl bg-[#ede0d0] hover:bg-[#e4d4bf] border border-[#decaba] text-[#45362e] font-bold text-xs text-center outline-none cursor-pointer appearance-none transition shadow-2xs"
                    >
                      <option value={15}>15m</option>
                      <option value={20}>20m</option>
                      <option value={25}>25m</option>
                      <option value={30}>30m</option>
                      <option value={45}>45m</option>
                      <option value={60}>60m</option>
                    </select>
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold text-[#786150] mb-0.5">Short Break</span>
                    <select
                      value={shortBreak}
                      onChange={(e) => setShortBreak(Number(e.target.value))}
                      className="w-full h-8.5 px-2 rounded-xl bg-[#ede0d0] hover:bg-[#e4d4bf] border border-[#decaba] text-[#45362e] font-bold text-xs text-center outline-none cursor-pointer appearance-none transition shadow-2xs"
                    >
                      <option value={3}>3m</option>
                      <option value={5}>5m</option>
                      <option value={10}>10m</option>
                    </select>
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold text-[#786150] mb-0.5">Long Break</span>
                    <select
                      value={longBreak}
                      onChange={(e) => setLongBreak(Number(e.target.value))}
                      className="w-full h-8.5 px-2 rounded-xl bg-[#ede0d0] hover:bg-[#e4d4bf] border border-[#decaba] text-[#45362e] font-bold text-xs text-center outline-none cursor-pointer appearance-none transition shadow-2xs"
                    >
                      <option value={10}>10m</option>
                      <option value={15}>15m</option>
                      <option value={20}>20m</option>
                      <option value={30}>30m</option>
                    </select>
                  </div>
                </div>

                {/* Hàng 2: Auto Start Focus/Break (Công tắc) */}
                <div className="flex items-center justify-between text-xs font-semibold text-[#514137]">
                  <span>Auto Start Focus/Break</span>
                  <button
                    type="button"
                    onClick={() => setAutoStart(!autoStart)}
                    className={`
                      w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer
                      ${autoStart ? 'bg-[#74b9be]' : 'bg-[#decaba]'}
                    `}
                  >
                    <span
                      className={`
                        block w-5 h-5 rounded-full bg-white shadow-xs transition-transform
                        ${autoStart ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>

                {/* Hàng 3: Sessions Before Long Break */}
                <div className="flex items-center justify-between text-xs font-semibold text-[#514137]">
                  <span>Sessions Before Long Break</span>
                  <select
                    value={longBreakEvery}
                    onChange={(e) => setLongBreakEvery(Number(e.target.value))}
                    className="w-28 h-8.5 px-3 rounded-xl bg-[#ede0d0] hover:bg-[#e4d4bf] border border-[#decaba] text-[#45362e] font-bold text-xs text-center outline-none cursor-pointer appearance-none transition shadow-2xs"
                  >
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                  </select>
                </div>
              </div>
            )}

            {/* 2. CHẾ ĐỘ STOPWATCH */}
            {timerMode === 'stopwatch' && (
              <div className="py-6 px-3 text-center text-xs text-[#6e5848] leading-relaxed animate-fade-in italic">
                "Just a simple stopwatch, which does not need any settings. An effective tool for tracking focused work time!"
              </div>
            )}
          </div>
        </section>

        {/* ── FOOTER: CANCEL & CONFIRM BUTTONS ── */}
        <div className="pt-1.5 pb-0.5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-32 sm:w-36 h-10 rounded-2xl bg-[#ede0d0] hover:bg-[#e4d4bf] text-[#6d584c] font-bold text-xs sm:text-sm transition active:scale-95 cursor-pointer shadow-xs flex items-center justify-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-36 sm:w-40 h-10 rounded-2xl bg-[#eb5e34] hover:bg-[#d9532b] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition active:scale-95 text-center cursor-pointer flex items-center justify-center"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
