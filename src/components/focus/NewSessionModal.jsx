import React, { useState } from 'react';
import {
  Clock,
  Volume2,
  Play,
  X,
  ChevronDown,
} from 'lucide-react';

/**
 * Modal New Session đồng bộ bố cục và phong cách thiết kế của bảng Sound,
 * Tỉ lệ vừa vặn, tinh tế, hài hòa theo đúng nguyên bản Virtual Cottage:
 * - Khung thẻ gọn gàng 440px
 * - Nút hành động Footer (Cancel & Confirm): Vừa vặn h-11 (44px), thanh thoát và êm tay
 * - Bộ 3 nút chọn chế độ (Classic | Pomodoro | Stopwatch): Cao h-10.5 (42px), bo cong mềm mại
 * - Các nút trong Timer Configuration: Cao h-9.5 (38px), số to rõ cân đối
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

  // 3 Chế độ: 'pomodoro' | 'classic' | 'stopwatch'
  const [timerMode, setTimerMode] = useState('pomodoro');
  const [focusGoal, setFocusGoal] = useState(currentTodoTitle || 'Focus');

  // Cấu hình Pomodoro
  const [focusTime, setFocusTime] = useState(idleConfig?.focusMinutes || 25);
  const [shortBreak, setShortBreak] = useState(idleConfig?.shortBreakMinutes || 5);
  const [longBreak, setLongBreak] = useState(idleConfig?.longBreakMinutes || 15);
  const [longBreakEvery, setLongBreakEvery] = useState(idleConfig?.longBreakEvery || 4);
  const [autoStart, setAutoStart] = useState(idleConfig?.autoStartNext || false);

  // Cấu hình Classic / Âm thanh
  const [alarmType, setAlarmType] = useState('Digital Clock');
  const [alarmVolume, setAlarmVolume] = useState(80);

  // Tooltip mô tả chế độ (theo nguyên bản Virtual Cottage)
  const MODE_DESCRIPTIONS = {
    pomodoro: 'Helps boost focus by breaking work into intervals, typically 25 minutes of focused work followed by 5-minute break',
    classic: 'Counts down from a set time, great for staying focused within a limit',
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
      alarmVolume: alarmVolume / 100,
    });
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in select-none">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Container - Rộng 440px vừa vặn, tinh tế */}
      <div
        className="relative z-30 flex flex-col rounded-3xl border border-[#e8d9c8] bg-[#faf5eb] font-sans text-[#4a3b32] shadow-2xl animate-fade-in select-none my-auto max-h-[94vh] overflow-y-auto overscroll-contain"
        style={{
          width: '440px',
          maxWidth: 'calc(100vw - 32px)',
          padding: '22px 26px',
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
        <div className="relative z-20 mb-3 flex items-center justify-between border-b border-[#e8d9c8] pb-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#efe2d3] text-[#765b49]">
              <Clock size={20} />
            </div>

            <div className="min-w-0">
              <h3 className="text-xl font-bold leading-tight tracking-tight text-[#45362e]">
                New Session
              </h3>
            </div>
          </div>

          <div className="relative z-30 flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onPlayChime}
              title="Nghe thử âm báo"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#6d584c] transition-colors hover:bg-[#ecdfd0] hover:text-[#45362e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd8055]"
            >
              <Volume2 size={19} />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Đóng bảng cài đặt"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-transparent text-[#8b7565] transition-colors hover:bg-[#ecdfd0] hover:text-[#45362e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd8055]"
            >
              <X size={19} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── SECTION 1: FOCUS GOAL (VỪA VẶN H-11) ── */}
        <section className="mb-3">
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
              className="w-full text-center h-11 px-4 rounded-2xl bg-[#ede0d0] hover:bg-[#e5d6c4] focus:bg-white border border-[#decaba] text-[#45362e] font-semibold text-sm sm:text-base outline-none transition focus:border-[#74b9be] focus:ring-2 focus:ring-[#74b9be]/30 placeholder:text-[#998372] shadow-2xs"
            />
          </div>
        </section>

        {/* ── SECTION 2: CHOOSE TIMER MODE (VỪA VẶN H-10.5) ── */}
        <section className="border-t border-[#e8d9c8] pt-3 mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a705d]">
              Choose Timer
            </h4>
            <span className="text-[11px] text-[#ad9886]">
              3 modes
            </span>
          </div>

          {/* 3 nút Mode: Classic | Pomodoro | Stopwatch cao h-10.5 */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'classic', label: 'Classic' },
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
                    h-10.5 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer shadow-2xs flex items-center justify-center
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

          <p className="mt-1.5 text-xs text-[#786150] italic px-1 text-center leading-relaxed">
            "{MODE_DESCRIPTIONS[timerMode]}"
          </p>
        </section>

        {/* ── SECTION 3: TIMER CONFIGURATION (CÂN ĐỐI, VỪA VẶN H-9.5) ── */}
        <section className="border-t border-[#e8d9c8] pt-3 mb-3.5">
          <div className="mb-1.5 flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8a705d]">
              Timer Configuration
            </h4>
          </div>

          {/* Hộp bo viền chứa cài đặt bên trong */}
          <div
            className="rounded-2xl border border-[#decaba] bg-[#fbf7f0]/50 p-3.5 sm:p-4 relative"
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
                    <span className="block text-[11px] font-semibold text-[#786150] mb-1">Focus Time</span>
                    <select
                      value={focusTime}
                      onChange={(e) => setFocusTime(Number(e.target.value))}
                      className="w-full h-9.5 px-2 rounded-2xl bg-[#ede0d0] hover:bg-[#e4d4bf] border border-[#decaba] text-[#45362e] font-bold text-xs sm:text-sm text-center outline-none cursor-pointer appearance-none transition shadow-2xs"
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
                    <span className="block text-[11px] font-semibold text-[#786150] mb-1">Short Break</span>
                    <select
                      value={shortBreak}
                      onChange={(e) => setShortBreak(Number(e.target.value))}
                      className="w-full h-9.5 px-2 rounded-2xl bg-[#ede0d0] hover:bg-[#e4d4bf] border border-[#decaba] text-[#45362e] font-bold text-xs sm:text-sm text-center outline-none cursor-pointer appearance-none transition shadow-2xs"
                    >
                      <option value={3}>3m</option>
                      <option value={5}>5m</option>
                      <option value={10}>10m</option>
                    </select>
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold text-[#786150] mb-1">Long Break</span>
                    <select
                      value={longBreak}
                      onChange={(e) => setLongBreak(Number(e.target.value))}
                      className="w-full h-9.5 px-2 rounded-2xl bg-[#ede0d0] hover:bg-[#e4d4bf] border border-[#decaba] text-[#45362e] font-bold text-xs sm:text-sm text-center outline-none cursor-pointer appearance-none transition shadow-2xs"
                    >
                      <option value={10}>10m</option>
                      <option value={15}>15m</option>
                      <option value={20}>20m</option>
                      <option value={30}>30m</option>
                    </select>
                  </div>
                </div>

                {/* Hàng 2: Auto Start Focus/Break (Công tắc) */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#514137]">
                  <span>Auto Start Focus/Break</span>
                  <button
                    type="button"
                    onClick={() => setAutoStart(!autoStart)}
                    className={`
                      w-12 h-6.5 rounded-full transition-colors relative p-0.5 cursor-pointer
                      ${autoStart ? 'bg-[#74b9be]' : 'bg-[#decaba]'}
                    `}
                  >
                    <span
                      className={`
                        block w-5.5 h-5.5 rounded-full bg-white shadow-xs transition-transform
                        ${autoStart ? 'translate-x-5.5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>

                {/* Hàng 3: Sessions Before Long Break */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#514137]">
                  <span>Sessions Before Long Break</span>
                  <select
                    value={longBreakEvery}
                    onChange={(e) => setLongBreakEvery(Number(e.target.value))}
                    className="w-32 h-9.5 px-3 rounded-2xl bg-[#ede0d0] hover:bg-[#e4d4bf] border border-[#decaba] text-[#45362e] font-bold text-xs sm:text-sm text-center outline-none cursor-pointer appearance-none transition shadow-2xs"
                  >
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={6}>6</option>
                  </select>
                </div>

                {/* Hàng 4: Alarm Dropdown + Nút nghe thử (▶) */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#514137]">
                  <span>Alarm</span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        value={alarmType}
                        onChange={(e) => setAlarmType(e.target.value)}
                        className="h-9.5 py-1.5 pl-3.5 pr-8 rounded-2xl bg-[#ff9f24] hover:bg-[#f09218] text-white font-bold text-xs sm:text-sm outline-none cursor-pointer appearance-none transition shadow-xs"
                      >
                        <option value="Digital Clock">Digital Clock</option>
                        <option value="Chime Bell">Chime Bell</option>
                        <option value="Lofi Beat">Lofi Beat</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                    </div>

                    <button
                      type="button"
                      onClick={onPlayChime}
                      title="Nghe thử âm báo"
                      className="w-9.5 h-9.5 rounded-full bg-[#ff9f24] hover:bg-[#f09218] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xs cursor-pointer"
                    >
                      <Play size={13} fill="currentColor" className="ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CHẾ ĐỘ CLASSIC */}
            {timerMode === 'classic' && (
              <div className="space-y-3.5">
                {/* Hàng 1: Focus Time */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#514137]">
                  <span>Focus Time</span>
                  <select
                    value={focusTime}
                    onChange={(e) => setFocusTime(Number(e.target.value))}
                    className="w-32 h-9.5 px-3 rounded-2xl bg-[#ede0d0] hover:bg-[#e4d4bf] border border-[#decaba] text-[#45362e] font-bold text-xs sm:text-sm text-center outline-none cursor-pointer appearance-none transition shadow-2xs"
                  >
                    <option value={15}>15m</option>
                    <option value={20}>20m</option>
                    <option value={25}>25m</option>
                    <option value={30}>30m</option>
                    <option value={45}>45m</option>
                    <option value={60}>60m</option>
                    <option value={90}>90m</option>
                  </select>
                </div>

                {/* Hàng 2: Alarm Dropdown + Nút nghe thử (▶) */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#514137]">
                  <span>Alarm</span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        value={alarmType}
                        onChange={(e) => setAlarmType(e.target.value)}
                        className="h-9.5 py-1.5 pl-3.5 pr-8 rounded-2xl bg-[#ff9f24] hover:bg-[#f09218] text-white font-bold text-xs sm:text-sm outline-none cursor-pointer appearance-none transition shadow-xs"
                      >
                        <option value="Digital Clock">Digital Clock</option>
                        <option value="Chime Bell">Chime Bell</option>
                        <option value="Lofi Beat">Lofi Beat</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white pointer-events-none" />
                    </div>

                    <button
                      type="button"
                      onClick={onPlayChime}
                      title="Nghe thử âm báo"
                      className="w-9.5 h-9.5 rounded-full bg-[#ff9f24] hover:bg-[#f09218] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xs cursor-pointer"
                    >
                      <Play size={13} fill="currentColor" className="ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* Hàng 3: Alarm Volume Slider */}
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#514137]">
                  <span>Alarm Volume</span>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={alarmVolume}
                      onChange={(e) => setAlarmVolume(Number(e.target.value))}
                      className="w-36 h-2 bg-[#dfd2c4] accent-[#765542] rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-mono text-[#786150] w-8 text-right font-bold">{alarmVolume}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. CHẾ ĐỘ STOPWATCH */}
            {timerMode === 'stopwatch' && (
              <div className="py-6 px-4 text-center text-xs sm:text-sm text-[#6e5848] leading-relaxed animate-fade-in italic">
                "Just a simple stopwatch, which does not need any settings. But nevertheless an effective tool for time measurement!"
              </div>
            )}
          </div>
        </section>

        {/* ── FOOTER: CANCEL & CONFIRM BUTTONS (H-11 (44px) VỪA VẶN, THANH THOÁT) ── */}
        <div className="pt-2 pb-1 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="w-36 sm:w-40 h-11 rounded-2xl bg-[#ede0d0] hover:bg-[#e4d4bf] text-[#6d584c] font-bold text-sm sm:text-[15px] transition active:scale-95 cursor-pointer shadow-xs flex items-center justify-center"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-40 sm:w-44 h-11 rounded-2xl bg-[#eb5e34] hover:bg-[#d9532b] text-white font-bold text-sm sm:text-[15px] shadow-md hover:shadow-lg transition active:scale-95 text-center cursor-pointer flex items-center justify-center"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
