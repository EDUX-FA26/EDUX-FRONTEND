/** Định dạng dùng chung cho Focus Room / thống kê. */

export const PHASE_LABEL = {
  FOCUS: 'Tập trung',
  SHORT_BREAK: 'Nghỉ ngắn',
  LONG_BREAK: 'Nghỉ dài',
};

export function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/** 4500 → "1 giờ 15 phút", 90 → "1 phút 30 giây", 20 → "20 giây" */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h > 0) return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
  if (m > 0) return sec > 0 && m < 10 ? `${m} phút ${sec} giây` : `${m} phút`;
  return `${sec} giây`;
}

export function formatDateTimeVN(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "YYYY-MM-DD" → "DD/MM" (không qua Date để tránh lệch múi giờ). */
export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = String(dateStr).slice(0, 10).split('-');
  return `${d}/${m}`;
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
export function weekdayLabel(dateStr) {
  return WEEKDAYS[new Date(`${String(dateStr).slice(0, 10)}T00:00:00Z`).getUTCDay()];
}

