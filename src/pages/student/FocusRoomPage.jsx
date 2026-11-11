import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Volume2, VolumeX, BarChart2, Maximize2, Minimize2, ArrowLeft,
  X, Play, Pause, SkipBack, SkipForward, Music, Upload, Trash2
} from 'lucide-react';
import { useFocusSession } from '../../hooks/useFocusSession';
import { useFocusPreferences } from '../../hooks/useFocusPreferences';
import { AmbientMixer } from '../../helper/focusAudio';
import FocusScene from '../../components/focus/FocusScene';
import PomodoroTimer from '../../components/focus/PomodoroTimer';
import SoundMixerPanel from '../../components/focus/SoundMixerPanel';
import FocusStatsPanel from '../../components/focus/FocusStatsPanel';
import FocusTodoListWidget from '../../components/focus/FocusTodoListWidget';
import NewSessionModal from '../../components/focus/NewSessionModal';

const DEFAULT_TRACKS = [
  {
    id: 'default-1',
    title: 'Midnight Study',
    artist: 'Lofi Girl & Chill',
    duration: 165,
    src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
  },
  {
    id: 'default-2',
    title: 'Lost In The Waves',
    artist: 'bidrav',
    duration: 254,
    src: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3',
  },
  {
    id: 'default-3',
    title: 'Scents of Spring',
    artist: 'Yojo Summer',
    duration: 233,
    src: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f77cb7.mp3',
  },
  {
    id: 'default-4',
    title: 'Rainy Afternoon',
    artist: 'EduX Ambient',
    duration: 200,
    src: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
  },
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

  // Cấu hình New Session Modal (Pomodoro | Stopwatch)
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [activeSessionConfig, setActiveSessionConfig] = useState({
    mode: 'pomodoro',
    goalTitle: 'Focus',
  });

  // ── Playlist & Trình phát nhạc thực thụ (Real Audio Player) ──
  const [playlist, setPlaylist] = useState(DEFAULT_TRACKS);
  const [trackIdx, setTrackIdx] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [trackSeconds, setTrackSeconds] = useState(0);
  const [trackDuration, setTrackDuration] = useState(DEFAULT_TRACKS[0].duration);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [showPlaylistDock, setShowPlaylistDock] = useState(false);

  const audioPlayerRef = useRef(null);
  const fileInputRef = useRef(null);
  const playlistDockRef = useRef(null);
  const playlistBtnRef = useRef(null);
  const mixerPanelRef = useRef(null);
  const mixerBtnRef = useRef(null);

  const currentTrack = playlist[trackIdx] || playlist[0] || DEFAULT_TRACKS[0];

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

  // Mở khóa âm thanh khi người dùng tương tác
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

  // ── Xử lý Audio Player thật: Đồng bộ bài hát & Play/Pause không bị Abort ──
  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (!audio || !currentTrack?.src) return;

    let isCancelled = false;

    // Chỉ đổi src nếu đổi bài hát
    if (audio.dataset.activeSrc !== currentTrack.src) {
      audio.dataset.activeSrc = currentTrack.src;
      audio.src = currentTrack.src;
      setTrackSeconds(0);
      if (currentTrack.duration) {
        setTrackDuration(currentTrack.duration);
      }
    }

    if (isPlayingMusic) {
      const p = audio.play();
      if (p !== undefined) {
        p.catch((err) => {
          if (isCancelled) return;
          if (err.name !== 'AbortError') {
            console.warn('Audio playback notice:', err.message);
            setIsPlayingMusic(false);
          }
        });
      }
    } else {
      audio.pause();
    }

    return () => {
      isCancelled = true;
    };
  }, [currentTrack?.src, isPlayingMusic]);

  const toggleMusicPlay = useCallback(() => {
    unlockAudio();
    setIsPlayingMusic((prev) => !prev);
  }, [unlockAudio]);

  const handlePrevTrack = useCallback(() => {
    setTrackIdx((idx) => (idx - 1 + playlist.length) % playlist.length);
    setTrackSeconds(0);
    setIsPlayingMusic(true);
  }, [playlist.length]);

  const handleNextTrack = useCallback(() => {
    setTrackIdx((idx) => (idx + 1) % playlist.length);
    setTrackSeconds(0);
    setIsPlayingMusic(true);
  }, [playlist.length]);

  const handleSelectTrack = (index) => {
    setTrackIdx(index);
    setTrackSeconds(0);
    setIsPlayingMusic(true);
  };

  const toggleMusicMute = () => {
    const next = !isMusicMuted;
    setIsMusicMuted(next);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.muted = next;
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = Math.floor(pct * (trackDuration || currentTrack.duration || 1));
    setTrackSeconds(target);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = target;
    }
  };

  const handleTimeUpdate = () => {
    if (audioPlayerRef.current) {
      setTrackSeconds(Math.floor(audioPlayerRef.current.currentTime));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioPlayerRef.current && Number.isFinite(audioPlayerRef.current.duration)) {
      const dur = Math.floor(audioPlayerRef.current.duration);
      if (dur > 0) {
        setTrackDuration(dur);
        setPlaylist((prev) =>
          prev.map((t, idx) => (idx === trackIdx && t.duration !== dur ? { ...t, duration: dur } : t))
        );
      }
    }
  };

  // Tải nhạc từ máy tính lên và trích xuất độ dài (duration) tự động
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const readDuration = (url) =>
      new Promise((resolve) => {
        const temp = new Audio();
        temp.preload = 'metadata';
        let done = false;
        const finish = (val) => {
          if (!done) {
            done = true;
            resolve(val);
          }
        };
        const timer = setTimeout(() => finish(0), 2000);
        temp.onloadedmetadata = () => {
          clearTimeout(timer);
          const dur = Math.floor(temp.duration);
          finish(Number.isFinite(dur) ? dur : 0);
        };
        temp.onerror = () => {
          clearTimeout(timer);
          finish(0);
        };
        temp.src = url;
        temp.load();
      });

    const newItems = await Promise.all(
      files.map(async (file, i) => {
        const url = URL.createObjectURL(file);
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        const duration = await readDuration(url);
        return {
          id: `local-${Date.now()}-${i}`,
          title: cleanName,
          artist: 'Nhạc từ máy tính',
          duration,
          src: url,
          isCustom: true,
        };
      })
    );

    setPlaylist((prev) => [...newItems, ...prev]);
    setTrackIdx(0);
    setTrackSeconds(0);
    if (newItems[0]?.duration > 0) {
      setTrackDuration(newItems[0].duration);
    }
    setIsPlayingMusic(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteCustomTrack = (e, id) => {
    e.stopPropagation();
    setPlaylist((prev) => {
      const next = prev.filter((t) => t.id !== id);
      return next.length > 0 ? next : DEFAULT_TRACKS;
    });
    setTrackIdx(0);
  };

  const formatTrackTime = (sec = 0) => {
    const s = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

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

  // Tự động đóng Playlist popover khi click bên ngoài
  useEffect(() => {
    if (!showPlaylistDock) return;
    const handleClickOutside = (e) => {
      if (
        playlistDockRef.current &&
        !playlistDockRef.current.contains(e.target) &&
        playlistBtnRef.current &&
        !playlistBtnRef.current.contains(e.target)
      ) {
        setShowPlaylistDock(false);
      }
    };
    const t = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [showPlaylistDock]);

  const handleStart = (extra = {}) => {
    unlockAudio();
    sessionApi.start({
      timerMode: extra.timerMode || activeSessionConfig.mode || 'pomodoro',
      todoId: linkedTodoId || undefined,
      focusMinutes: extra.focusMinutes || prefs?.focusMinutes,
      shortBreakMinutes: prefs?.shortBreakMinutes,
      longBreakMinutes: prefs?.longBreakMinutes,
      longBreakEvery: prefs?.longBreakEvery,
      note: activeSessionConfig.goalTitle,
    });
  };

  const handleTodoChange = useCallback((newTodoId) => {
    setLinkedTodoId(newTodoId);
    if (sessionApi.session) {
      sessionApi.linkTodo(newTodoId);
    }
  }, [sessionApi.session, sessionApi.linkTodo]);

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
      timerMode: config.mode || 'pomodoro',
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
      isPaused={showNewSessionModal || drawer !== null}
      className="relative w-full h-full min-h-full flex-1 flex flex-col justify-between select-none overflow-hidden"
    >
      <div onClick={unlockAudio} className="absolute inset-0 z-0" />

      {/* HTML5 Audio Tag chạy ngầm cho Music Player */}
      <audio
        ref={audioPlayerRef}
        preload="metadata"
        referrerPolicy="no-referrer"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNextTrack}
        onError={(e) => {
          console.warn('Audio playback element error:', e);
        }}
      />

      {/* ── Top Bar: Pomodoro bên trái, To-Do-List bên phải ── */}
      <header className="relative z-30 flex items-start justify-between p-4 sm:p-6 flex-shrink-0 pointer-events-none">
        {/* Góc trên bên trái: Nút điều khiển phòng học + Timer Widget */}
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

          {/* Nút [New Session] khi chưa có phiên học HOẶC PomodoroTimer khi đang chạy */}
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
              elapsedMs={sessionApi.elapsedMs}
              progress={sessionApi.progress}
              busy={sessionApi.busy}
              online={sessionApi.online}
              error={sessionApi.error}
              onDismissError={sessionApi.clearError}
              onStart={handleStart}
              onPause={sessionApi.pause}
              onResume={sessionApi.resume}
              onAdjust={sessionApi.adjust}
              onResetPhase={sessionApi.resetPhase}
              onFinish={sessionApi.finish}
              onCancel={sessionApi.cancel}
              timerMode={sessionApi.session?.timerMode || activeSessionConfig.mode}
              customGoalTitle={sessionApi.session?.note || activeSessionConfig.goalTitle}
            />
          )}
        </div>

        {/* Góc trên bên phải: To-Do-List Widget tích hợp chuẩn */}
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

      {/* ── Bottom Dock Bar: Playlist Icon bên trái, Music Player ở giữa, Sound Mixer bên phải ── */}
      <footer className="
        relative z-20 flex w-full flex-shrink-0
        items-center justify-center
        gap-4 sm:gap-5
        px-4 sm:px-8
        pt-3 pb-5
        -translate-y-8 sm:-translate-y-10
      ">
        {/* Nút Playlist bên trái: Bấm vào mở danh sách phát & tải nhạc từ máy */}
        <div className="relative" ref={playlistBtnRef}>
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              setShowPlaylistDock((prev) => !prev);
              if (drawer === 'mixer') setDrawer(null);
            }}
            title="Danh sách phát nhạc (Playlist)"
            className={`w-[54px] h-[54px] rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${showPlaylistDock
                ? 'bg-[#3b2d45]/80 border-purple-300/60 text-white shadow-lg scale-105'
                : 'bg-[#21182e]/60 hover:bg-[#2c203d]/80 border-white/20 text-white/70 hover:text-white'
              }`}
          >
            <PlaylistIcon className="w-6 h-6" />
          </button>

          {/* Popup danh sách phát & tải nhạc từ máy */}
          {showPlaylistDock && (
            <div
              ref={playlistDockRef}
              className="absolute bottom-16 left-0 z-50 w-80 sm:w-96 rounded-2xl bg-[#1b1426]/95 p-4 backdrop-blur-2xl border border-white/15 shadow-2xl animate-fade-in text-white"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300">
                    <Music size={15} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                    Danh Sách Phát
                  </span>
                  <span className="text-[11px] text-white/50 px-1.5 py-0.5 rounded-md bg-white/10">
                    {playlist.length} bài
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Tải nhạc từ máy tính lên"
                    className="flex items-center gap-1 text-[11px] font-bold bg-[#eb5e34] hover:bg-[#d9532b] text-white px-2.5 py-1 rounded-lg transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>Tải nhạc</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPlaylistDock(false)}
                    className="p-1 text-white/60 hover:text-white rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Input file ẩn cho tải nhạc */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Danh sách bài hát cuộn được */}
              <div
                className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#4a3b5c transparent' }}
              >
                {playlist.map((track, idx) => {
                  const isCurrent = trackIdx === idx;
                  return (
                    <div
                      key={track.id || idx}
                      onClick={() => handleSelectTrack(idx)}
                      className={`
                        group flex items-center justify-between gap-2.5 p-2 rounded-xl transition cursor-pointer select-none
                        ${isCurrent
                          ? 'bg-purple-600/30 border border-purple-400/40 text-white'
                          : 'hover:bg-white/5 text-white/80 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-5 text-center flex-shrink-0 text-xs font-mono text-white/40">
                          {isCurrent && isPlayingMusic ? (
                            <span className="text-teal-400 animate-pulse font-bold">▶</span>
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-teal-300' : 'text-white'}`}>
                            {track.title}
                          </p>
                          <p className="text-[10px] text-white/50 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-white/40 font-mono">
                          {track.duration > 0
                            ? formatTrackTime(track.duration)
                            : isCurrent && trackDuration > 0
                            ? formatTrackTime(trackDuration)
                            : '--:--'}
                        </span>

                        {track.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomTrack(e, track.id)}
                            title="Xóa bài này khỏi danh sách"
                            className="p-1 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
                className="text-white/70 hover:text-white transition p-1 cursor-pointer"
              >
                <SkipBack size={17} />
              </button>

              <button
                type="button"
                onClick={toggleMusicPlay}
                title={isPlayingMusic ? 'Tạm dừng nhạc' : 'Phát nhạc'}
                className="w-8 h-8 rounded-full bg-white text-[#21182e] flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-md cursor-pointer"
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
                className="text-white/70 hover:text-white transition p-1 cursor-pointer"
              >
                <SkipForward size={17} />
              </button>

              <button
                type="button"
                onClick={toggleMusicMute}
                title={isMusicMuted ? 'Bật âm lượng nhạc' : 'Tắt tiếng nhạc'}
                className="text-white/70 hover:text-white transition p-1 cursor-pointer"
              >
                {isMusicMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
            </div>
          </div>

          {/* Bottom row: Scrubber progress timeline */}
          <div className="w-full flex items-center gap-2 text-[11px] text-white/50 tabular-nums select-none">
            <span className="w-7 text-left">{formatTrackTime(trackSeconds)}</span>
            <div
              className="flex-1 h-1 bg-white/20 hover:bg-white/30 rounded-full relative cursor-pointer my-1 transition-colors"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-white rounded-full relative"
                style={{ width: `${Math.min(100, (trackSeconds / (trackDuration || currentTrack.duration || 1)) * 100)}%` }}
              >
                <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            <span className="w-7 text-right">{formatTrackTime(trackDuration || currentTrack.duration)}</span>
          </div>
        </div>

        {/* Nút đám mây bên phải: Chỉ hiện icon, BẤM VÀO MỚI HIỆN RA SOUND VÀ BACKGROUND */}
        <div className="relative" ref={mixerBtnRef}>
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              setDrawer(drawer === 'mixer' ? null : 'mixer');
              if (showPlaylistDock) setShowPlaylistDock(false);
            }}
            title="Âm thanh thiên nhiên & Cảnh (Sound & Visual Effects)"
            className={`w-[54px] h-[54px] rounded-2xl flex items-center justify-center border transition-all cursor-pointer ${drawer === 'mixer'
                ? 'bg-[#3b2d45]/80 border-purple-300/60 text-white shadow-lg scale-105'
                : 'bg-[#21182e]/60 hover:bg-[#2c203d]/80 border-white/20 text-white/70 hover:text-white'
              }`}
          >
            <CloudRainIcon className="w-7 h-7" />
          </button>
        </div>
      </footer>

      {/* ── Bảng cài đặt Sound & Background: Hiển thị bên cạnh To-Do-List ── */}
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

      {/* ── Drawer Thống kê (trượt từ mép phải khi mở: responsive rộng rãi Lofi) ── */}
      {drawer === 'stats' && (
        <aside className="absolute inset-y-0 right-0 z-50 flex w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl flex-col bg-[#161022]/95 p-5 sm:p-7 backdrop-blur-2xl border-l border-white/15 shadow-2xl animate-fade-in text-white overflow-y-auto">
          <FocusStatsPanel
            refreshKey={sessionApi.lastEnded?.id}
            onClose={() => setDrawer(null)}
          />
        </aside>
      )}

      {/* ── Modal Cấu hình phiên học mới (New Session Modal: Pomodoro | Stopwatch) ── */}
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
