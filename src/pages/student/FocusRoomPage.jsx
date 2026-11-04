import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Volume2, VolumeX, BarChart2, Maximize2, Minimize2, ArrowLeft,
  X, CheckSquare, Sparkles, Play, Pause, SkipBack, SkipForward
} from 'lucide-react';
import { useFocusSession } from '../../hooks/useFocusSession';
import { useFocusPreferences } from '../../hooks/useFocusPreferences';
import { AmbientMixer } from '../../helper/focusAudio';
import FocusScene from '../../components/focus/FocusScene';
import PomodoroTimer from '../../components/focus/PomodoroTimer';
import SoundMixerPanel from '../../components/focus/SoundMixerPanel';
import TodoLinkSelect from '../../components/focus/TodoLinkSelect';
import FocusStatsPanel from '../../components/focus/FocusStatsPanel';
import FocusTodoListWidget from '../../components/focus/FocusTodoListWidget';
import NewSessionModal from '../../components/focus/NewSessionModal';

const TRACKS = [
  { title: 'Lost In The Waves', artist: 'bidrav', duration: 254 },
  { title: 'scents of spring', artist: 'Yojo Summer', duration: 233 },
  { title: 'midnight study', artist: 'Lofi Girl', duration: 165 },
  { title: 'rainy afternoon', artist: 'EduX Ambient', duration: 200 },
];

function PlaylistIcon({ className = 'w-6 h-6' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h7M4 10h7M4 14h5M4 18h4" />
      <path d="M17 17.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="currentColor" stroke="none" />
      <path d="M19.5 15V6l3-1" />
    </svg>
  );
}

function CloudRainIcon({ className = 'w-7 h-7' }) {
  return (
    <svg viewBox="0 0 28 28" className={className} fill="currentColor">
      <path d="M21 16.5a4.5 4.5 0 0 0-.9-8.9A6.5 6.5 0 0 0 7.5 12a4.5 4.5 0 0 0 .8 8.9h12.7z" />
      <path d="M9 22.5l-1.5 3M13.5 22.5l-1.5 3M18 22.5l-1.5 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function FocusRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTodoId = searchParams.get('todoId');

  const mixerRef = useRef(null);
  if (!mixerRef.current && typeof window !== 'undefined') {
    mixerRef.current = new AmbientMixer();
  }

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [drawer, setDrawer] = useState(null); // 'mixer' | 'stats' | null
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [linkedTodoId, setLinkedTodoId] = useState(initialTodoId || null);

  // Cấu hình New Session Modal (Classic | Pomodoro | Stopwatch)
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [activeSessionConfig, setActiveSessionConfig] = useState({
    mode: 'pomodoro',
    goalTitle: 'Focus',
  });

  // Player state: mặc định giống ảnh mẫu 1:09 / 4:14
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [trackSeconds, setTrackSeconds] = useState(69);
  const [showTodoDock, setShowTodoDock] = useState(false);
  const currentTrack = TRACKS[trackIdx];

  const mixerPanelRef = useRef(null);
  const mixerBtnRef = useRef(null);
  const todoDockRef = useRef(null);

  const { prefs, catalog, loading: prefsLoading, update: updatePrefs } = useFocusPreferences();

  const handlePhaseChange = useCallback((newSession) => {
    mixerRef.current?.chime();
    if (prefs?.autoStartNext && newSession.status === 'PAUSED') {
      setTimeout(() => {
        sessionApi.resume();
      }, 1000);
    }
  }, [prefs?.autoStartNext]);

  const sessionApi = useFocusSession({ onPhaseChange: handlePhaseChange });

  // Mở khóa âm thanh khi người dùng click
  const unlockAudio = useCallback(() => {
    if (!audioUnlocked && mixerRef.current) {
      const ok = mixerRef.current.unlock();
      if (ok) setAudioUnlocked(true);
    }
  }, [audioUnlocked]);

  // Cập nhật âm thanh nền vào Audio Mixer khi preferences thay đổi
  useEffect(() => {
    if (!prefs || !mixerRef.current) return;
    mixerRef.current.setMasterVolume(prefs.masterVolume);
    prefs.sounds.forEach((s) => {
      mixerRef.current.setChannel(s.id, { enabled: s.enabled, volume: s.volume });
    });
  }, [prefs]);

  // Dọn dẹp âm thanh khi unmount
  useEffect(() => {
    return () => {
      mixerRef.current?.dispose();
    };
  }, []);

  // Nếu session có todoId, đồng bộ lại linkedTodoId
  useEffect(() => {
    if (sessionApi.session?.todoId) {
      setLinkedTodoId(sessionApi.session.todoId);
    } else if (initialTodoId && !sessionApi.session) {
      setLinkedTodoId(initialTodoId);
    }
  }, [sessionApi.session, initialTodoId]);

  // Đếm thời gian khi nhạc đang phát
  useEffect(() => {
    if (!isPlayingMusic) return;
    const interval = setInterval(() => {
      setTrackSeconds((sec) => {
        const cur = TRACKS[trackIdx];
        if (sec + 1 >= cur.duration) {
          setTrackIdx((idx) => (idx + 1) % TRACKS.length);
          return 0;
        }
        return sec + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlayingMusic, trackIdx]);

  // Tự động đóng bảng Sound & Visual khi click bên ngoài
  useEffect(() => {
    if (drawer !== 'mixer') return;
    const handleClickOutside = (e) => {
      if (
        mixerPanelRef.current &&
        !mixerPanelRef.current.contains(e.target) &&
        mixerBtnRef.current &&
        !mixerBtnRef.current.contains(e.target)
      ) {
        setDrawer(null);
      }
    };
    const t = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [drawer]);

  const toggleMusicPlay = () => {
    unlockAudio();
    const next = !isPlayingMusic;
    setIsPlayingMusic(next);
    if (prefs) {
      updatePrefs({
        sounds: prefs.sounds.map((s) => (s.id === 'lofi' ? { ...s, enabled: next } : s)),
      });
    }
  };

  const handlePrevTrack = () => {
    setTrackIdx((idx) => (idx - 1 + TRACKS.length) % TRACKS.length);
    setTrackSeconds(0);
  };

  const handleNextTrack = () => {
    setTrackIdx((idx) => (idx + 1) % TRACKS.length);
    setTrackSeconds(0);
  };

  const formatTrackTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleStart = () => {
    unlockAudio();
    sessionApi.start({
      todoId: linkedTodoId || undefined,
      focusMinutes: prefs?.focusMinutes,
      shortBreakMinutes: prefs?.shortBreakMinutes,
      longBreakMinutes: prefs?.longBreakMinutes,
      longBreakEvery: prefs?.longBreakEvery,
    });
  };

  const handleTodoChange = (newTodoId) => {
    setLinkedTodoId(newTodoId);
    if (sessionApi.session) {
      sessionApi.linkTodo(newTodoId);
    }
    setShowTodoDock(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsFullscreen(false);
    }
  };

  const handleConfirmNewSession = (config) => {
    setActiveSessionConfig(config);
    unlockAudio();
    sessionApi.start({
      todoId: linkedTodoId || undefined,
      focusMinutes: config.focusMinutes,
      shortBreakMinutes: config.shortBreakMinutes,
      longBreakMinutes: config.longBreakMinutes,
      longBreakEvery: config.longBreakEvery,
      note: config.goalTitle,
    });
    if (config.autoStartNext !== undefined && prefs) {
      updatePrefs({ autoStartNext: config.autoStartNext });
    }
  };

  return (
    <FocusScene
      id={prefs?.backgroundId || 'cottage'}
      className="relative w-full h-full min-h-full flex-1 flex flex-col justify-between select-none overflow-hidden"
    >
      <div onClick={unlockAudio} className="absolute inset-0 z-0" />

      {/* ── Top Bar: Pomodoro bên trái, To-Do-List bên phải (theo đúng ảnh mẫu) ── */}
      <header className="relative z-30 flex items-start justify-between p-4 sm:p-6 flex-shrink-0 pointer-events-none">
        {/* Góc trên bên trái: Nút điều khiển phòng học + Pomodoro Timer Widget */}
        <div className="flex flex-col items-start gap-2.5 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="flex items-center gap-1.5 rounded-xl bg-black/40 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-white hover:bg-black/60 transition border border-white/10 shadow-sm"
            >
              <ArrowLeft size={14} />
              <span>Thoát</span>
            </button>

            <button
              type="button"
              onClick={() => setDrawer(drawer === 'stats' ? null : 'stats')}
              className={`flex items-center gap-1.5 rounded-xl backdrop-blur-md px-2.5 py-1.5 text-xs font-bold text-white border transition ${drawer === 'stats' ? 'bg-orange-500 border-orange-400' : 'bg-black/40 hover:bg-black/60 border-white/10'
                }`}
              title="Thống kê học tập"
            >
              <BarChart2 size={14} />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded-xl bg-black/40 backdrop-blur-md p-1.5 text-white hover:bg-black/60 transition border border-white/10"
              title="Toàn màn hình"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>

          {/* Nút [New Session] khi chưa có phiên học (To rõ chuẩn theo ảnh mẫu) HOẶC PomodoroTimer khi đang chạy */}
          {!sessionApi.session ? (
            <button
              type="button"
              onClick={() => setShowNewSessionModal(true)}
              className="
                w-[185px] sm:w-[185px]
                h-[45px] sm:h-[45px]
                flex items-center justify-center
                rounded-2xl
                border border-white/25 hover:border-white/45
                bg-[#1e172a]/75 hover:bg-[#281e37]/90
                backdrop-blur-xl
                text-white/90 hover:text-white
                font-medium text-base sm:text-[17px] tracking-wide
                transition-all shadow-xl hover:shadow-2xl active:scale-95 cursor-pointer
              "
              style={{
                boxShadow: '0 14px 32px -8px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.1)',
              }}
            >
              New Session
            </button>
          ) : (
            <PomodoroTimer
              session={sessionApi.session}
              idleConfig={prefs}
              remainingMs={sessionApi.remainingMs}
              progress={sessionApi.progress}
              busy={sessionApi.busy}
              online={sessionApi.online}
              error={sessionApi.error}
              onDismissError={sessionApi.clearError}
              onStart={handleStart}
              onPause={sessionApi.pause}
              onResume={sessionApi.resume}
              onResetPhase={sessionApi.resetPhase}
              onFinish={sessionApi.finish}
              onCancel={sessionApi.cancel}
              timerMode={activeSessionConfig.mode}
              customGoalTitle={activeSessionConfig.goalTitle}
            />
          )}
        </div>

        {/* Góc trên bên phải: To-Do-List Widget tích hợp chuẩn theo ảnh mẫu */}
        <div className="pointer-events-auto">
          <FocusTodoListWidget
            activeTodoId={linkedTodoId}
            onSelectTodo={handleTodoChange}
            onSessionTodoChange={setLinkedTodoId}
          />
        </div>
      </header>

      {/* ── Main Center: Trống để nhìn trọn vẹn phòng học isometric 3D lofi ── */}
      <main className="relative flex-1 pointer-events-none" />

      {/* ── Bottom Dock Bar (Chuẩn thiết kế theo ảnh mẫu) ── */}
      <footer className="
  relative z-20 flex w-full flex-shrink-0
  items-center justify-center
  gap-4 sm:gap-5
  px-4 sm:px-8
  pt-3 pb-5
  -translate-y-8 sm:-translate-y-10
">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              setShowTodoDock((prev) => !prev);
              if (drawer === 'mixer') setDrawer(null);
            }}
            title="Danh sách bài hát & Nhiệm vụ"
            className={`w-[54px] h-[54px] rounded-2xl flex items-center justify-center border transition-all ${showTodoDock
                ? 'bg-[#3b2d45]/80 border-purple-300/60 text-white shadow-lg scale-105'
                : 'bg-[#21182e]/60 hover:bg-[#2c203d]/80 border-white/20 text-white/70 hover:text-white'
              }`}
          >
            <PlaylistIcon className="w-6 h-6" />
          </button>

          {/* Popup danh sách & chọn nhiệm vụ */}
          {showTodoDock && (
            <div
              ref={todoDockRef}
              className="absolute bottom-16 left-0 z-40 w-84 rounded-2xl bg-[#1b1426]/95 p-4 backdrop-blur-2xl border border-white/15 shadow-2xl animate-fade-in text-white"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Gắn nhiệm vụ vào phiên học
                </span>
                <button
                  type="button"
                  onClick={() => setShowTodoDock(false)}
                  className="p-1 text-white/60 hover:text-white rounded"
                >
                  <X size={15} />
                </button>
              </div>
              <TodoLinkSelect
                value={linkedTodoId}
                onChange={handleTodoChange}
                disabled={sessionApi.busy}
              />
            </div>
          )}
        </div>

        {/* Thanh phát nhạc Lo-fi ở chính giữa (Image 1 & User Screenshot) */}
        <div
          className="w-[500px] max-w-[calc(100vw-180px)] rounded-3xl bg-[#21182e]/70 hover:bg-[#251b34]/85 backdrop-blur-xl border border-white/20 text-white shadow-xl flex flex-col justify-center transition"
          style={{ padding: '16px 32px', gap: '10px' }}
        >
          {/* Top row: Track Info (left) + Buttons (right) */}
          <div className="flex items-center justify-between gap-4">
            {/* Track Info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate tracking-wide leading-tight">
                {currentTrack.title}
              </p>
              <p className="text-xs text-white/55 truncate mt-0.5 leading-none">
                {currentTrack.artist}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handlePrevTrack}
                title="Bài trước"
                className="text-white/70 hover:text-white transition p-1"
              >
                <SkipBack size={17} />
              </button>

              <button
                type="button"
                onClick={toggleMusicPlay}
                title={isPlayingMusic ? 'Tạm dừng nhạc' : 'Phát nhạc'}
                className="w-8 h-8 rounded-full bg-white text-[#21182e] flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-md"
              >
                {isPlayingMusic ? (
                  <Pause size={15} fill="currentColor" />
                ) : (
                  <Play size={15} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleNextTrack}
                title="Bài tiếp"
                className="text-white/70 hover:text-white transition p-1"
              >
                <SkipForward size={17} />
              </button>

              <button
                type="button"
                onClick={() => {
                  unlockAudio();
                  updatePrefs({ masterVolume: prefs?.masterVolume > 0 ? 0 : 0.8 });
                }}
                title={prefs?.masterVolume === 0 ? 'Bật âm lượng tổng' : 'Tắt âm lượng tổng'}
                className="text-white/70 hover:text-white transition p-1"
              >
                {prefs?.masterVolume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
            </div>
          </div>

          {/* Bottom row: Scrubber progress timeline */}
          <div className="w-full flex items-center gap-2 text-[11px] text-white/50 tabular-nums select-none">
            <span className="w-7 text-left">{formatTrackTime(trackSeconds)}</span>
            <div
              className="flex-1 h-1 bg-white/20 hover:bg-white/30 rounded-full relative cursor-pointer my-1 transition-colors"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setTrackSeconds(Math.floor(pct * currentTrack.duration));
              }}
            >
              <div
                className="h-full bg-white rounded-full relative"
                style={{ width: `${Math.min(100, (trackSeconds / currentTrack.duration) * 100)}%` }}
              >
                <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            <span className="w-7 text-right">{formatTrackTime(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Nút đám mây bên phải: Chỉ hiện icon, BẤM VÀO MỚI HIỆN RA SOUND VÀ BACKGROUND */}
        <div className="relative" ref={mixerBtnRef}>
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              setDrawer(drawer === 'mixer' ? null : 'mixer');
              if (showTodoDock) setShowTodoDock(false);
            }}
            title="Âm thanh & Cảnh (Sound & Visual Effects)"
            className={`w-[54px] h-[54px] rounded-2xl flex items-center justify-center border transition-all ${drawer === 'mixer'
                ? 'bg-[#3b2d45]/80 border-purple-300/60 text-white shadow-lg scale-105'
                : 'bg-[#21182e]/60 hover:bg-[#2c203d]/80 border-white/20 text-white/70 hover:text-white'
              }`}
          >
            <CloudRainIcon className="w-7 h-7" />
          </button>
        </div>
      </footer>

      {/* ── Bảng cài đặt Sound & Background: Hiển thị bên cạnh To-Do-List (theo ảnh mẫu) ── */}
      {drawer === 'mixer' && (
        <div
          ref={mixerPanelRef}
          className="absolute right-4 sm:right-[380px] top-4 sm:top-6 z-50 animate-fade-in"
        >
          <SoundMixerPanel
            prefs={prefs}
            catalog={catalog}
            audioReady={audioUnlocked}
            onChange={updatePrefs}
            onClose={() => setDrawer(null)}
          />
        </div>
      )}

      {/* ── Drawer Thống kê (trượt từ mép phải khi mở) ── */}
      {drawer === 'stats' && (
        <aside className="absolute inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-slate-900/90 p-6 backdrop-blur-2xl border-l border-white/10 shadow-2xl animate-fade-in text-white overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart2 size={18} className="text-orange-400" />
              Thống kê Focus Room
            </h2>
            <button
              onClick={() => setDrawer(null)}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          <FocusStatsPanel refreshKey={sessionApi.lastEnded?.id} />
        </aside>
      )}

      {/* ── Modal Cấu hình phiên học mới (New Session Modal: Classic, Pomodoro, Stopwatch) ── */}
      <NewSessionModal
        isOpen={showNewSessionModal}
        onClose={() => setShowNewSessionModal(false)}
        onConfirm={handleConfirmNewSession}
        idleConfig={prefs}
        currentTodoTitle={activeSessionConfig.goalTitle}
        onPlayChime={() => mixerRef.current?.chime()}
      />
    </FocusScene>
  );
}
