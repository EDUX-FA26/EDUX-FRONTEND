import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Volume2, Settings, BarChart2, Maximize2, Minimize2, ArrowLeft,
  X, CheckSquare, Sparkles, Sliders
} from 'lucide-react';
import { useFocusSession } from '../../hooks/useFocusSession';
import { useFocusPreferences } from '../../hooks/useFocusPreferences';
import { AmbientMixer } from '../../helper/focusAudio';
import FocusScene from '../../components/focus/FocusScene';
import PomodoroTimer from '../../components/focus/PomodoroTimer';
import SoundMixerPanel from '../../components/focus/SoundMixerPanel';
import TodoLinkSelect from '../../components/focus/TodoLinkSelect';
import FocusStatsPanel from '../../components/focus/FocusStatsPanel';

export default function FocusRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTodoId = searchParams.get('todoId');

  const mixerRef = useRef(null);
  if (!mixerRef.current && typeof window !== 'undefined') {
    mixerRef.current = new AmbientMixer();
  }

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [drawer, setDrawer] = useState(null); // 'mixer' | 'stats' | 'settings' | null
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [linkedTodoId, setLinkedTodoId] = useState(initialTodoId || null);

  const { prefs, catalog, loading: prefsLoading, update: updatePrefs } = useFocusPreferences();

  const handlePhaseChange = useCallback((newSession) => {
    mixerRef.current?.chime();
    // Tự bắt đầu pha kế tiếp nếu bật autoStartNext trong preferences
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
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <FocusScene
      id={prefs?.backgroundId || 'cottage'}
      className="fixed inset-0 z-50 flex flex-col justify-between select-none"
    >
      <div onClick={unlockAudio} className="absolute inset-0 z-0" />

      {/* ── Top Bar ── */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <button
          type="button"
          onClick={() => navigate('/student/dashboard')}
          className="flex items-center gap-2 rounded-xl bg-black/40 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white hover:bg-black/60 transition border border-white/10"
        >
          <ArrowLeft size={16} />
          <span>Thoát phòng học</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { unlockAudio(); setDrawer(drawer === 'mixer' ? null : 'mixer'); }}
            className={`flex items-center gap-2 rounded-xl backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white border transition ${
              drawer === 'mixer' ? 'bg-orange-500 border-orange-400' : 'bg-black/40 hover:bg-black/60 border-white/10'
            }`}
          >
            <Sliders size={16} />
            <span className="hidden sm:inline">Âm thanh & Cảnh</span>
          </button>

          <button
            type="button"
            onClick={() => setDrawer(drawer === 'stats' ? null : 'stats')}
            className={`flex items-center gap-2 rounded-xl backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white border transition ${
              drawer === 'stats' ? 'bg-orange-500 border-orange-400' : 'bg-black/40 hover:bg-black/60 border-white/10'
            }`}
          >
            <BarChart2 size={16} />
            <span className="hidden sm:inline">Thống kê</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-xl bg-black/40 backdrop-blur-md p-2 text-white hover:bg-black/60 transition border border-white/10"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* ── Main Center: Pomodoro Timer ── */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-black/30 p-6 sm:p-8 backdrop-blur-xl border border-white/15 shadow-2xl">
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
          />
        </div>
      </main>

      {/* ── Bottom Dock: Linked Todo ── */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl bg-black/40 backdrop-blur-md p-3.5 border border-white/10 shadow-lg">
          <TodoLinkSelect
            value={linkedTodoId}
            onChange={handleTodoChange}
            disabled={sessionApi.busy}
          />
        </div>
      </footer>

      {/* ── Right Slide-over Drawer (Mixer / Stats) ── */}
      {drawer && (
        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-slate-900/90 p-6 backdrop-blur-2xl border-l border-white/10 shadow-2xl animate-fade-in text-white overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {drawer === 'mixer' && <Sliders size={18} className="text-orange-400" />}
              {drawer === 'stats' && <BarChart2 size={18} className="text-orange-400" />}
              {drawer === 'mixer' ? 'Cảnh phòng & Âm thanh' : 'Thống kê Focus Room'}
            </h2>
            <button
              onClick={() => setDrawer(null)}
              className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          {drawer === 'mixer' && (
            <SoundMixerPanel
              prefs={prefs}
              catalog={catalog}
              audioReady={audioUnlocked}
              onChange={updatePrefs}
            />
          )}

          {drawer === 'stats' && (
            <FocusStatsPanel refreshKey={sessionApi.lastEnded?.id} />
          )}
        </aside>
      )}
    </FocusScene>
  );
}

