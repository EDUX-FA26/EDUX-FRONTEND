/**
 * Engine âm thanh nền cho Focus Room — sinh âm bằng Web Audio API (không cần file mp3,
 * không lo bản quyền, chạy offline). Mỗi kênh là một "scene" âm thanh độc lập; nhiều
 * kênh có thể phát cùng lúc, mỗi kênh có âm lượng riêng và có master volume.
 *
 * Lưu ý autoplay: AudioContext chỉ chạy sau tương tác của người dùng → gọi `unlock()`
 * trong một handler click/keydown.
 */

let sharedCtx = null;
const noiseCache = new WeakMap();

function getContext() {
  if (!sharedCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    sharedCtx = new AC();
  }
  return sharedCtx;
}

function getNoise(ctx, type) {
  let cache = noiseCache.get(ctx);
  if (!cache) {
    cache = {};
    noiseCache.set(ctx, cache);
  }
  if (cache[type]) return cache[type];

  const seconds = 4;
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else {
    let last = 0; // brown
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }

  cache[type] = buffer;
  return buffer;
}

/** Tạo nguồn nhiễu lặp + filter chain, trả về { source, output }. */
function noiseLayer(ctx, type, filters = []) {
  const source = ctx.createBufferSource();
  source.buffer = getNoise(ctx, type);
  source.loop = true;
  // Lệch điểm bắt đầu để các lớp không bị cộng pha
  source.start(0, Math.random() * 3);

  let node = source;
  for (const [filterType, frequency, q] of filters) {
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    if (q) filter.Q.value = q;
    node.connect(filter);
    node = filter;
  }
  return { source, output: node };
}

function lfo(ctx, frequency, depth, target) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = frequency;
  gain.gain.value = depth;
  osc.connect(gain);
  gain.connect(target);
  osc.start();
  return osc;
}

// ── Các kênh âm thanh ────────────────────────────────────
// Mỗi factory nhận (ctx, out) và trả về hàm stop().

function rainChannel(ctx, out) {
  const high = noiseLayer(ctx, 'pink', [['highpass', 500], ['lowpass', 8000]]);
  const highGain = ctx.createGain();
  highGain.gain.value = 0.55;
  high.output.connect(highGain);
  highGain.connect(out);

  const rumble = noiseLayer(ctx, 'brown', [['lowpass', 320]]);
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.45;
  rumble.output.connect(rumbleGain);
  rumbleGain.connect(out);

  const sway = lfo(ctx, 0.13, 0.08, highGain.gain);

  return () => {
    [high.source, rumble.source, sway].forEach((n) => { try { n.stop(); } catch { /* đã dừng */ } });
    [highGain, rumbleGain].forEach((n) => n.disconnect());
  };
}

function forestChannel(ctx, out) {
  const wind = noiseLayer(ctx, 'brown', [['lowpass', 450]]);
  const windGain = ctx.createGain();
  windGain.gain.value = 0.5;
  wind.output.connect(windGain);
  windGain.connect(out);
  const gust = lfo(ctx, 0.07, 0.22, windGain.gain);

  const leaves = noiseLayer(ctx, 'pink', [['bandpass', 3200, 1.1]]);
  const leavesGain = ctx.createGain();
  leavesGain.gain.value = 0.05;
  leaves.output.connect(leavesGain);
  leavesGain.connect(out);

  let timer = null;
  let stopped = false;

  const chirp = () => {
    if (stopped) return;
    const start = ctx.currentTime + 0.05;
    const notes = 2 + Math.floor(Math.random() * 3);
    const base = 2200 + Math.random() * 1800;

    for (let i = 0; i < notes; i += 1) {
      const t = start + i * 0.14;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.45, t + 0.09);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.1, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      osc.connect(env);
      env.connect(out);
      osc.start(t);
      osc.stop(t + 0.13);
    }
    timer = setTimeout(chirp, 2500 + Math.random() * 6000);
  };
  timer = setTimeout(chirp, 800);

  return () => {
    stopped = true;
    clearTimeout(timer);
    [wind.source, leaves.source, gust].forEach((n) => { try { n.stop(); } catch { /* đã dừng */ } });
    [windGain, leavesGain].forEach((n) => n.disconnect());
  };
}

function cafeChannel(ctx, out) {
  const murmur = noiseLayer(ctx, 'pink', [['bandpass', 900, 0.5]]);
  const murmurGain = ctx.createGain();
  murmurGain.gain.value = 0.6;
  murmur.output.connect(murmurGain);
  murmurGain.connect(out);
  const chatter = lfo(ctx, 0.31, 0.18, murmurGain.gain);

  const room = noiseLayer(ctx, 'brown', [['lowpass', 260]]);
  const roomGain = ctx.createGain();
  roomGain.gain.value = 0.3;
  room.output.connect(roomGain);
  roomGain.connect(out);

  let timer = null;
  let stopped = false;

  const clink = () => {
    if (stopped) return;
    const t = ctx.currentTime + 0.02;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 2500 + Math.random() * 2000;
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.07, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(env);
    env.connect(out);
    osc.start(t);
    osc.stop(t + 0.32);
    timer = setTimeout(clink, 3000 + Math.random() * 7000);
  };
  timer = setTimeout(clink, 1500);

  return () => {
    stopped = true;
    clearTimeout(timer);
    [murmur.source, room.source, chatter].forEach((n) => { try { n.stop(); } catch { /* đã dừng */ } });
    [murmurGain, roomGain].forEach((n) => n.disconnect());
  };
}

const CHORDS = [
  [220.0, 261.63, 329.63, 392.0], // Am7
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [261.63, 329.63, 392.0, 493.88], // Cmaj7
  [196.0, 246.94, 293.66, 392.0], // G6
];

function lofiChannel(ctx, out) {
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 1300;
  tone.connect(out);

  const crackle = noiseLayer(ctx, 'pink', [['highpass', 3500]]);
  const crackleGain = ctx.createGain();
  crackleGain.gain.value = 0.012;
  crackle.output.connect(crackleGain);
  crackleGain.connect(out);

  const CHORD_SECONDS = 4;
  let nextTime = ctx.currentTime + 0.1;
  let index = 0;
  let timer = null;
  let stopped = false;
  const live = new Set();

  // Lập lịch trước theo đồng hồ audio → không bị giật khi tab nền làm trễ setTimeout.
  const pump = () => {
    if (stopped) return;
    while (nextTime < ctx.currentTime + 20) {
      const chord = CHORDS[index % CHORDS.length];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.value = i === 0 ? freq / 2 : freq;
        env.gain.setValueAtTime(0.0001, nextTime);
        env.gain.linearRampToValueAtTime(0.09, nextTime + 0.9);
        env.gain.linearRampToValueAtTime(0.0001, nextTime + CHORD_SECONDS + 1.2);
        osc.connect(env);
        env.connect(tone);
        osc.start(nextTime);
        osc.stop(nextTime + CHORD_SECONDS + 1.3);
        live.add(osc);
        osc.onended = () => live.delete(osc);
      });
      nextTime += CHORD_SECONDS;
      index += 1;
    }
    timer = setTimeout(pump, 5000);
  };
  pump();

  return () => {
    stopped = true;
    clearTimeout(timer);
    live.forEach((osc) => { try { osc.stop(); } catch { /* đã dừng */ } });
    try { crackle.source.stop(); } catch { /* đã dừng */ }
    [crackleGain, tone].forEach((n) => n.disconnect());
  };
}

const CHANNELS = {
  rain: rainChannel,
  forest: forestChannel,
  cafe: cafeChannel,
  lofi: lofiChannel,
};

// ── Mixer ────────────────────────────────────────────────

export class AmbientMixer {
  constructor() {
    this.active = new Map(); // id → { gain, stop }
    this.master = null;
    this.masterVolume = 0.8;
  }

  /** Gọi trong handler của người dùng (click/keydown) để mở khoá audio. */
  unlock() {
    const ctx = getContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    if (!this.master) {
      this.master = ctx.createGain();
      this.master.gain.value = this.masterVolume;
      this.master.connect(ctx.destination);
    }
    return true;
  }

  get ready() {
    return Boolean(sharedCtx && sharedCtx.state === 'running' && this.master);
  }

  setMasterVolume(volume) {
    this.masterVolume = volume;
    if (this.master) this.master.gain.setTargetAtTime(volume, sharedCtx.currentTime, 0.1);
  }

  setChannel(id, { enabled, volume }) {
    const factory = CHANNELS[id];
    if (!factory || !this.master) return;
    const ctx = sharedCtx;

    const current = this.active.get(id);

    if (!enabled) {
      if (!current) return;
      this.active.delete(id);
      current.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      setTimeout(() => {
        current.stop();
        current.gain.disconnect();
      }, 900);
      return;
    }

    if (current) {
      current.gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
      return;
    }

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.master);
    const stop = factory(ctx, gain);
    gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.4); // fade in
    this.active.set(id, { gain, stop });
  }

  /** Chuông báo chuyển pha (2 nốt ngắn). */
  chime() {
    const ctx = sharedCtx;
    if (!ctx || ctx.state !== 'running') return;
    const base = ctx.currentTime + 0.02;

    [880, 1318.5].forEach((freq, i) => {
      const t = base + i * 0.22;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(env);
      env.connect(ctx.destination); // chuông không bị ảnh hưởng bởi master volume nền
      osc.start(t);
      osc.stop(t + 0.95);
    });
  }

  stopAll() {
    this.active.forEach(({ stop, gain }) => {
      stop();
      gain.disconnect();
    });
    this.active.clear();
  }

  dispose() {
    this.stopAll();
    if (this.master) {
      this.master.disconnect();
      this.master = null;
    }
  }
}

