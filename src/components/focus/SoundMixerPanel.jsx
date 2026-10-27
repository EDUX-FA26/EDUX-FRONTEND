
import React from 'react';
import {
  CloudRain,
  Wind,
  Trees,
  Coffee,
  Flame,
  Music2,
  Moon,
  Volume2,
  VolumeX,
  X,
  Sparkles,
} from 'lucide-react';

// Icon cho từng luồng âm thanh
const SOUND_ICON = {
  rain: CloudRain,
  forest: Trees,
  cafe: Coffee,
  lofi: Music2,
  wind: Wind,
  fire: Flame,
};

// Tên hiển thị
const SOUND_LABEL = {
  rain: 'Rain',
  forest: 'Birds',
  cafe: 'Cafe',
  lofi: 'Noise',
  wind: 'Wind',
  fire: 'Fire',
};

// Icon cho từng cảnh nền
const SCENE_ICON = {
  cottage: Flame,
  forest: Wind,
  'rainy-window': CloudRain,
  cafe: Coffee,
  'night-desk': Moon,
};

export default function SoundMixerPanel({
  prefs,
  catalog,
  audioReady,
  onChange,
  onClose,
}) {
  if (!prefs || !catalog) return null;

  const sounds = catalog.sounds || [];
  const backgrounds = catalog.backgrounds || [];
  const currentSounds = prefs.sounds || [];

  const setSound = (id, patch) => {
    onChange({
      sounds: currentSounds.map((sound) =>
        sound.id === id ? { ...sound, ...patch } : sound
      ),
    });
  };

  const isMasterMuted = prefs.masterVolume === 0;

  const toggleMasterMute = () => {
    onChange({
      masterVolume: isMasterMuted ? 0.8 : 0,
    });
  };

  const handleVolumeChange = (soundId, volume) => {
    setSound(soundId, {
      volume,
      enabled: volume > 0,
    });
  };

  const toggleSoundMute = (soundId, current) => {
    if (current.enabled && current.volume > 0) {
      setSound(soundId, { enabled: false });
    } else {
      setSound(soundId, {
        enabled: true,
        volume: current.volume > 0 ? current.volume : 0.5,
      });
    }
  };

  return (
    <div
      className="relative z-30 flex flex-col overflow-y-auto overscroll-contain rounded-3xl border border-[#e8d9c8] bg-[#faf5eb] font-sans text-[#4a3b32] shadow-2xl animate-fade-in select-none"
      style={{
        width: '380px',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100dvh - 90px)',
        padding: '24px 28px',
        boxShadow:
          '0 24px 48px -12px rgba(20,10,5,.35), 0 4px 12px rgba(0,0,0,.08)',
        scrollbarWidth: 'thin',
        scrollbarColor: '#d7c4b1 transparent',
      }}
    >
      {/* Góc gấp giấy */}

      <div
        className="
          pointer-events-none absolute bottom-0 left-0
          h-4 w-4 rounded-tr-md
          border-r border-t border-[#decaba]
          bg-[#ede0d0] shadow-sm
        "
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative z-20 mb-5 flex items-center justify-between border-b border-[#e8d9c8] pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#efe2d3] text-[#765b49]">
            <Volume2 size={19} />
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-tight tracking-tight text-[#45362e]">
              Sound
            </h3>
          </div>
        </div>

        <div className="relative z-30 flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggleMasterMute}
            title={isMasterMuted ? 'Bật âm lượng tổng' : 'Tắt âm lượng tổng'}
            aria-label={isMasterMuted ? 'Bật âm lượng tổng' : 'Tắt âm lượng tổng'}
            className="
        relative z-30 flex h-9 w-9 items-center justify-center
        rounded-xl text-[#6d584c] transition-colors
        hover:bg-[#ecdfd0] hover:text-[#45362e]
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[#bd8055]
      "
          >
            {isMasterMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Đóng bảng cài đặt"
              aria-label="Đóng bảng cài đặt"
              className="
          relative z-30 flex h-9 w-9 shrink-0 items-center
          justify-center rounded-xl bg-transparent
          text-[#8b7565] transition-colors
          hover:bg-[#ecdfd0] hover:text-[#45362e]
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-[#bd8055]
        "
            >
              <X size={19} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Thông báo kích hoạt âm thanh */}
      {!audioReady && (
        <p className="mb-4 rounded-xl border border-[#ead5bf] bg-[#f3e7d8] px-3 py-2 text-xs leading-relaxed text-[#765b49]">
          Nhấn vào màn hình để kích hoạt âm thanh.
        </p>
      )}

      {/* Sound controls */}
      <section aria-label="Điều chỉnh âm thanh">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a705d]">
            Ambient sounds
          </h4>
          <span className="text-[11px] text-[#ad9886]">
            {sounds.length} sounds
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {sounds.map((sound) => {
            const state = currentSounds.find(
              (item) => item.id === sound.id
            ) || { enabled: false, volume: 0.5 };

            const Icon = SOUND_ICON[sound.id] || Music2;
            const isMuted = !state.enabled || state.volume === 0;
            const volumeValue = state.enabled ? state.volume : 0;

            return (
              <div
                key={sound.id}
                className="
                  grid grid-cols-[24px_minmax(42px,60px)_28px_minmax(0,1fr)]
                  items-center gap-2
                  rounded-xl px-2 py-2
                  transition-colors
                  hover:bg-[#f2e8dc]
                "
              >
                {/* Icon */}
                <div className="flex items-center justify-center text-[#806957]">
                  <Icon size={18} strokeWidth={1.8} />
                </div>

                {/* Tên âm thanh */}
                <span
                  className="truncate text-sm font-semibold text-[#514137]"
                  title={SOUND_LABEL[sound.id] || sound.name}
                >
                  {SOUND_LABEL[sound.id] || sound.name}
                </span>

                {/* Mute */}
                <button
                  type="button"
                  onClick={() => toggleSoundMute(sound.id, state)}
                  title={isMuted ? `Bật ${sound.name}` : `Tắt ${sound.name}`}
                  aria-label={isMuted ? `Bật ${sound.name}` : `Tắt ${sound.name}`}
                  className={`
                    flex h-7 w-7 items-center justify-center rounded-lg
                    transition-colors
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-[#bd8055]
                    ${isMuted
                      ? 'text-[#b2a092] hover:bg-[#e8dacb] hover:text-[#5c493f]'
                      : 'text-[#76523d] hover:bg-[#e8dacb]'
                    }
                  `}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>

                {/* Volume slider */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volumeValue}
                  onChange={(event) =>
                    handleVolumeChange(
                      sound.id,
                      Number(event.target.value)
                    )
                  }
                  aria-label={`Âm lượng ${sound.name}`}
                  className="
                    h-1.5 w-full min-w-0 cursor-pointer
                    appearance-none rounded-full
                    bg-[#dfd2c4] accent-[#765542]
                  "
                  style={{ touchAction: 'pan-y' }}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Background selector */}
      <section className="mt-5 border-t border-[#e8d9c8] pt-5">
        <div className="mb-4">
          <h4 className="text-sm font-bold tracking-wide text-[#45362e]">
            Background
          </h4>
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-4">
          {backgrounds.map((bg) => {
            const selected = prefs.backgroundId === bg.id;
            const Icon = SCENE_ICON[bg.id] || CloudRain;

            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => onChange({ backgroundId: bg.id })}
                title={bg.name}
                aria-label={bg.name}
                aria-pressed={selected}
                className={`
                  group flex min-w-0 flex-col items-center gap-2
                  rounded-xl p-2
                  transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2
                  focus-visible:ring-[#bd8055]
                  ${selected
                    ? 'bg-[#eee1d5]'
                    : 'bg-transparent hover:bg-[#f1e7dc]'
                  }
                `}
              >
                <span
                  className={`
                    flex h-12 w-12 items-center justify-center rounded-full
                    transition-all duration-200
                    ${selected
                      ? 'scale-105 bg-[#523f4c] text-white shadow-md ring-2 ring-[#523f4c]/20'
                      : 'bg-[#e8dacd] text-[#6b584d] group-hover:bg-[#dfcfc0] group-hover:text-[#4a3b32]'
                    }
                  `}
                >
                  <Icon size={21} strokeWidth={1.8} />
                </span>

                <span
                  className={`
                    max-w-full truncate text-[11px] font-medium
                    ${selected
                      ? 'text-[#523f4c]'
                      : 'text-[#8b7565]'
                    }
                  `}
                >
                  {bg.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
