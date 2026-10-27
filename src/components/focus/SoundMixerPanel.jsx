import React from 'react';
import { CloudRain, Trees, Coffee, Music2, Volume2, ImageIcon } from 'lucide-react';

const SOUND_ICON = { rain: CloudRain, forest: Trees, cafe: Coffee, lofi: Music2 };

const BACKGROUND_PREVIEW = {
  cottage: 'linear-gradient(135deg,#3b2417,#c97b3a)',
  forest: 'linear-gradient(135deg,#9fc5a8,#1f4a36)',
  'rainy-window': 'linear-gradient(135deg,#1b2638,#46586e)',
  cafe: 'linear-gradient(135deg,#2a1a12,#6d4125)',
  'night-desk': 'linear-gradient(135deg,#070b1d,#1f2a52)',
};

function Slider({ value, onChange, label, disabled }) {
  return (
    <input
      type="range"
      min="0"
      max="1"
      step="0.01"
      value={value}
      disabled={disabled}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-orange-500' : 'bg-white/25'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

/** Chọn hình nền + phối nhiều luồng âm thanh, mỗi luồng bật/tắt và chỉnh âm lượng riêng. */
export default function SoundMixerPanel({ prefs, catalog, audioReady, onChange }) {
  if (!prefs) return <p className="text-sm text-white/70">Đang tải cấu hình…</p>;

  const setSound = (id, patch) =>
    onChange({ sounds: prefs.sounds.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  return (
    <div className="flex flex-col gap-5 text-white">
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/70">
          <ImageIcon size={14} /> Phòng học
        </h3>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
          {catalog.backgrounds.map((bg) => {
            const selected = prefs.backgroundId === bg.id;
            return (
              <button
                key={bg.id}
                type="button"
                title={bg.name}
                aria-label={bg.name}
                aria-pressed={selected}
                onClick={() => onChange({ backgroundId: bg.id })}
                className={`aspect-square rounded-xl border-2 transition ${selected ? 'scale-105 border-orange-400 shadow-lg shadow-orange-500/30' : 'border-white/20 hover:border-white/50'}`}
                style={{ background: BACKGROUND_PREVIEW[bg.id] }}
              />
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-white/60">
          {catalog.backgrounds.find((b) => b.id === prefs.backgroundId)?.name}
        </p>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/70">
          <Volume2 size={14} /> Âm thanh nền
        </h3>

        {!audioReady && (
          <p className="mb-3 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80">
            Trình duyệt chặn tự phát âm thanh — nhấn vào bất kỳ đâu trên trang để bật.
          </p>
        )}

        <div className="mb-4 flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs font-semibold text-white/80">Tổng</span>
          <Slider value={prefs.masterVolume} label="Âm lượng tổng" onChange={(v) => onChange({ masterVolume: v })} />
          <span className="w-9 text-right text-xs tabular-nums text-white/70">{Math.round(prefs.masterVolume * 100)}%</span>
        </div>

        <ul className="flex flex-col gap-3">
          {catalog.sounds.map((sound) => {
            const state = prefs.sounds.find((s) => s.id === sound.id) || { enabled: false, volume: 0.5 };
            const Icon = SOUND_ICON[sound.id] || Music2;
            return (
              <li key={sound.id} className="rounded-xl bg-white/[0.07] p-3">
                <div className="mb-2 flex items-center gap-3">
                  <Icon size={18} className={state.enabled ? 'text-orange-300' : 'text-white/50'} />
                  <span className="flex-1 text-sm font-semibold">{sound.name}</span>
                  <Toggle checked={state.enabled} label={`Bật ${sound.name}`} onChange={(enabled) => setSound(sound.id, { enabled })} />
                </div>
                <div className="flex items-center gap-3">
                  <Slider
                    value={state.volume}
                    disabled={!state.enabled}
                    label={`Âm lượng ${sound.name}`}
                    onChange={(volume) => setSound(sound.id, { volume })}
                  />
                  <span className="w-9 text-right text-xs tabular-nums text-white/60">{Math.round(state.volume * 100)}%</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

