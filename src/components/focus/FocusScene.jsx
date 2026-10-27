import React from 'react';

/**
 * Các cảnh phòng học dựng bằng CSS/SVG (không cần file ảnh, tải tức thì, nhẹ).
 * `id` phải khớp danh mục BACKGROUNDS ở BE.
 */

const KEYFRAMES = `
@keyframes fr-rain { from { background-position: 0 0; } to { background-position: -60px 480px; } }
@keyframes fr-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
@keyframes fr-drift { from { transform: translateX(-6%); } to { transform: translateX(6%); } }
@keyframes fr-twinkle { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
@keyframes fr-flicker { 0%,100% { opacity: .9; } 45% { opacity: .75; } 60% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .fr-anim { animation: none !important; } }
`;

const abs = 'absolute pointer-events-none';

const STARS = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7) % 58,
  size: 1 + (i % 3),
  delay: (i % 9) * 0.4,
}));

const BOKEH = [
  { x: 8, y: 18, s: 120, c: 'rgba(255,170,80,.35)', d: 0 },
  { x: 24, y: 55, s: 80, c: 'rgba(255,214,120,.3)', d: 1.2 },
  { x: 48, y: 12, s: 150, c: 'rgba(255,120,60,.25)', d: 2.1 },
  { x: 68, y: 40, s: 100, c: 'rgba(255,200,140,.3)', d: 0.6 },
  { x: 84, y: 16, s: 130, c: 'rgba(255,150,90,.28)', d: 1.7 },
  { x: 90, y: 62, s: 90, c: 'rgba(255,230,160,.3)', d: 2.6 },
];

function Cottage() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(165deg,#2c1810 0%,#5a331c 48%,#b9692f 100%)' }} />
      {/* Cửa sổ hoàng hôn */}
      <div
        className={`${abs} left-[8%] top-[10%] h-[34%] w-[24%] rounded-t-[40%] border-[10px] border-[#3a2112]`}
        style={{ background: 'linear-gradient(180deg,#ff9a5a 0%,#ffcf8a 55%,#ffe7b8 100%)', boxShadow: 'inset 0 0 40px rgba(255,120,40,.5)' }}
      >
        <div className="absolute left-1/2 top-0 h-full w-[6px] -translate-x-1/2 bg-[#3a2112]" />
        <div className="absolute left-0 top-1/2 h-[6px] w-full -translate-y-1/2 bg-[#3a2112]" />
      </div>
      {/* Ánh đèn */}
      <div
        className={`${abs} fr-anim right-[12%] top-[16%] h-[320px] w-[320px] rounded-full`}
        style={{ background: 'radial-gradient(circle,rgba(255,200,120,.55) 0%,rgba(255,160,70,.18) 45%,transparent 70%)', animation: 'fr-flicker 4s ease-in-out infinite' }}
      />
      {/* Sàn gỗ */}
      <div
        className={`${abs} bottom-0 left-0 h-[22%] w-full`}
        style={{ background: 'repeating-linear-gradient(90deg,#4a2a16 0,#4a2a16 90px,#3d2312 90px,#3d2312 92px)', boxShadow: 'inset 0 20px 40px rgba(0,0,0,.35)' }}
      />
      {[12, 30, 52, 74, 88].map((x, i) => (
        <span
          key={x}
          className={`${abs} fr-anim h-1.5 w-1.5 rounded-full bg-amber-200/60`}
          style={{ left: `${x}%`, top: `${25 + (i * 11) % 40}%`, animation: `fr-float ${6 + i}s ease-in-out ${i * 0.7}s infinite` }}
        />
      ))}
    </>
  );
}

function Forest() {
  const pines = (fill, scale, offset) => (
    <svg className={`${abs} bottom-0 left-0 w-full`} style={{ height: `${scale}%` }} viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => {
        const cx = i * 78 + offset;
        const h = 150 + ((i * 47) % 110);
        return <polygon key={i} points={`${cx},${300} ${cx + 45},${300 - h} ${cx + 90},${300}`} fill={fill} />;
      })}
    </svg>
  );

  return (
    <>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#9fc5a8 0%,#5f8f6b 40%,#1f4a36 100%)' }} />
      <div
        className={`${abs} left-[40%] top-0 h-full w-[18%] -skew-x-12`}
        style={{ background: 'linear-gradient(180deg,rgba(255,255,220,.4),transparent 80%)', filter: 'blur(14px)' }}
      />
      {pines('#2f6247', 62, -20)}
      {pines('#214a37', 48, 25)}
      {pines('#12332a', 34, -45)}
      <div
        className={`${abs} fr-anim bottom-[8%] left-[-10%] h-[28%] w-[120%]`}
        style={{ background: 'linear-gradient(180deg,transparent,rgba(235,245,240,.35),transparent)', filter: 'blur(20px)', animation: 'fr-drift 18s ease-in-out infinite alternate' }}
      />
    </>
  );
}

function RainyWindow() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#1b2638 0%,#2e3f57 55%,#46586e 100%)' }} />
      {/* Đèn thành phố mờ sau kính */}
      {[10, 26, 41, 63, 78, 90].map((x, i) => (
        <span
          key={x}
          className={`${abs} rounded-full`}
          style={{ left: `${x}%`, top: `${48 + (i % 3) * 8}%`, width: 46 + i * 6, height: 46 + i * 6, background: i % 2 ? 'rgba(255,196,120,.35)' : 'rgba(150,200,255,.3)', filter: 'blur(14px)' }}
        />
      ))}
      {/* Mưa */}
      <div
        className={`${abs} fr-anim inset-0 opacity-60`}
        style={{
          backgroundImage: 'linear-gradient(105deg,transparent 48%,rgba(190,215,255,.55) 50%,transparent 52%)',
          backgroundSize: '60px 90px',
          animation: 'fr-rain .8s linear infinite',
        }}
      />
      <div
        className={`${abs} fr-anim inset-0 opacity-35`}
        style={{
          backgroundImage: 'linear-gradient(105deg,transparent 48%,rgba(190,215,255,.5) 50%,transparent 52%)',
          backgroundSize: '90px 140px',
          animation: 'fr-rain 1.3s linear infinite',
        }}
      />
      {/* Khung cửa sổ */}
      <div className={`${abs} inset-6 rounded-xl border-[14px] border-[#10151f]`} style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,.45)' }}>
        <div className="absolute left-1/2 top-0 h-full w-[10px] -translate-x-1/2 bg-[#10151f]" />
      </div>
    </>
  );
}

function Cafe() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(170deg,#2a1a12 0%,#4b2c1c 55%,#6d4125 100%)' }} />
      {BOKEH.map((b) => (
        <span
          key={`${b.x}-${b.y}`}
          className={`${abs} fr-anim rounded-full`}
          style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.s, height: b.s, background: b.c, filter: 'blur(10px)', animation: `fr-float ${7 + b.d}s ease-in-out ${b.d}s infinite` }}
        />
      ))}
      <div
        className={`${abs} bottom-0 left-0 h-[20%] w-full`}
        style={{ background: 'linear-gradient(180deg,#5b3a22,#2f1d11)', boxShadow: '0 -8px 30px rgba(0,0,0,.4)' }}
      />
    </>
  );
}

function NightDesk() {
  return (
    <>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,#070b1d 0%,#121a3b 60%,#1f2a52 100%)' }} />
      {STARS.map((s, i) => (
        <span
          key={i}
          className={`${abs} fr-anim rounded-full bg-white`}
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, animation: `fr-twinkle 3.5s ease-in-out ${s.delay}s infinite` }}
        />
      ))}
      <div
        className={`${abs} right-[14%] top-[12%] h-24 w-24 rounded-full`}
        style={{ background: '#fdf6d8', boxShadow: '0 0 60px 18px rgba(253,246,216,.35)' }}
      />
      <div
        className={`${abs} fr-anim bottom-[14%] left-[10%] h-[300px] w-[300px] rounded-full`}
        style={{ background: 'radial-gradient(circle,rgba(255,214,140,.4),transparent 68%)', animation: 'fr-flicker 5s ease-in-out infinite' }}
      />
      <div className={`${abs} bottom-0 left-0 h-[16%] w-full`} style={{ background: 'linear-gradient(180deg,#2b2113,#150f08)' }} />
    </>
  );
}

const SCENES = {
  cottage: Cottage,
  forest: Forest,
  'rainy-window': RainyWindow,
  cafe: Cafe,
  'night-desk': NightDesk,
};

export default function FocusScene({ id = 'cottage', className = '', children }) {
  const Scene = SCENES[id] || Cottage;

  return (
    <div className={`relative isolate overflow-hidden ${className}`}>
      <style>{KEYFRAMES}</style>
      <Scene />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

