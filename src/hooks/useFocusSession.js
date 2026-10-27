import { useCallback, useEffect, useRef, useState } from 'react';
import FocusService from '../services/focus.service';

const ERROR_MESSAGES = {
  ACTIVE_SESSION_EXISTS: 'Bạn đang có một phiên học chưa kết thúc.',
  SESSION_NOT_FOUND: 'Không tìm thấy phiên học.',
  SESSION_ALREADY_ENDED: 'Phiên học này đã kết thúc.',
  TODO_NOT_FOUND: 'Không tìm thấy nhiệm vụ đã chọn.',
  TODO_ALREADY_COMPLETED: 'Nhiệm vụ này đã hoàn thành, hãy chọn nhiệm vụ khác.',
};

export function getFocusErrorMessage(error) {
  if (!error?.response) return 'Mất kết nối mạng. Đồng hồ vẫn chạy theo máy chủ, hãy thử lại khi có mạng.';
  const code = error.response.data?.message;
  return ERROR_MESSAGES[code] || code || 'Đã có lỗi xảy ra, vui lòng thử lại.';
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isNetworkError = (error) => !error?.response;
const isEnded = (s) => s && (s.status === 'COMPLETED' || s.status === 'CANCELLED');

/**
 * Pause/resume/finish đều idempotent ở BE nên retry khi rớt mạng là an toàn
 * (không bao giờ tính trùng thời gian hay kết thúc hai lần).
 */
async function withRetry(fn, attempts = 4) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isNetworkError(error) || i === attempts - 1) break;
      await sleep(400 * 2 ** i);
    }
  }
  throw lastError;
}

/**
 * Quản lý phiên Focus. NGUỒN SỰ THẬT là server:
 *  - Mỗi lần nhận dữ liệu, ta tính độ lệch đồng hồ (offset) giữa client và server.
 *  - Thời gian còn lại = phaseRemainingMs(server) - (now_server_hiện_tại - serverNow).
 *  - setInterval chỉ để vẽ lại UI; khi tab bị throttle/refresh, giá trị vẫn đúng vì
 *    luôn tính lại từ mốc thời gian thật. Đồng bộ lại khi tab hiện, có mạng, hết pha.
 */
export function useFocusSession({ onPhaseChange } = {}) {
  const [session, setSession] = useState(null);
  const [lastEnded, setLastEnded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [, setTick] = useState(0);

  const offsetRef = useRef(0);
  const sessionRef = useRef(null);
  const busyRef = useRef(false);
  const syncingRef = useRef(false);
  const lastSyncAttemptRef = useRef(0);
  const phaseRef = useRef({ id: null, seq: null });
  const onPhaseChangeRef = useRef(onPhaseChange);
  const baseTitleRef = useRef(typeof document === 'undefined' ? '' : document.title);

  useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange;
  }, [onPhaseChange]);

  const apply = useCallback((view, t0 = Date.now(), t1 = Date.now()) => {
    if (view?.serverNow) offsetRef.current = Date.parse(view.serverNow) - (t0 + t1) / 2;

    if (!view) {
      sessionRef.current = null;
      setSession(null);
      return;
    }
    if (isEnded(view)) {
      sessionRef.current = null;
      setSession(null);
      setLastEnded(view);
      return;
    }

    // Phát hiện chuyển pha (do server chốt) để báo chuông / tự bắt đầu pha kế
    const prev = phaseRef.current;
    if (prev.id === view.id && prev.seq != null && view.phaseSeq > prev.seq) {
      onPhaseChangeRef.current?.(view);
    }
    phaseRef.current = { id: view.id, seq: view.phaseSeq };

    sessionRef.current = view;
    setLastEnded(null);
    setSession(view);
  }, []);

  /** Lấy lại phiên hiện tại từ server (đã được server chốt theo thời gian thực). */
  const sync = useCallback(async () => {
    if (syncingRef.current) return null;
    syncingRef.current = true;
    const t0 = Date.now();
    try {
      const res = await FocusService.getCurrentSession();
      apply(res.data, t0, Date.now());
      setError(null);
      return res.data;
    } catch (err) {
      setError(getFocusErrorMessage(err));
      return null;
    } finally {
      syncingRef.current = false;
      setLoading(false);
    }
  }, [apply]);

  // Khôi phục phiên khi mount / refresh trang
  useEffect(() => {
    sync();
  }, [sync]);

  // Đồng bộ lại khi quay lại tab, cửa sổ được focus, hoặc có mạng trở lại
  useEffect(() => {
    const resync = () => {
      if (document.visibilityState === 'visible') sync();
    };
    const goOnline = () => {
      setOnline(true);
      sync();
    };
    const goOffline = () => setOnline(false);

    document.addEventListener('visibilitychange', resync);
    window.addEventListener('focus', resync);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('focus', resync);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [sync]);

  const computeRemaining = (s) => {
    if (!s) return 0;
    if (s.status !== 'IN_PROGRESS') return s.phaseRemainingMs;
    const serverNow = Date.now() + offsetRef.current;
    return Math.max(0, s.phaseRemainingMs - (serverNow - Date.parse(s.serverNow)));
  };

  // Vòng lặp VẼ lại UI + phát hiện hết pha → hỏi server (không tự chốt ở client)
  const running = session?.status === 'IN_PROGRESS';
  useEffect(() => {
    if (!running) {
      document.title = baseTitleRef.current;
      return undefined;
    }

    const id = setInterval(() => {
      const s = sessionRef.current;
      const remaining = computeRemaining(s);
      setTick((t) => t + 1);

      const mm = String(Math.floor(remaining / 60000)).padStart(2, '0');
      const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
      document.title = `${mm}:${ss} • Focus`;

      if (remaining <= 0 && Date.now() - lastSyncAttemptRef.current > 1200) {
        lastSyncAttemptRef.current = Date.now();
        sync();
      }
    }, 250);

    return () => {
      clearInterval(id);
      document.title = baseTitleRef.current;
    };
  }, [running, sync]);

  const run = useCallback(
    async (fn, { onError } = {}) => {
      if (busyRef.current) return null;
      busyRef.current = true;
      setBusy(true);
      setError(null);
      try {
        const t0 = Date.now();
        const res = await withRetry(fn);
        apply(res.data, t0, Date.now());
        return res.data;
      } catch (err) {
        const handled = onError?.(err);
        if (!handled) setError(getFocusErrorMessage(err));
        return null;
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [apply]
  );

  // Khi thao tác xung đột trạng thái (vd. phiên đã kết thúc ở tab khác) → lấy lại sự thật từ server
  const resyncOnConflict = useCallback(
    (err) => {
      if (err?.response?.status === 409) {
        sync();
        return false; // vẫn hiện thông báo lỗi
      }
      return false;
    },
    [sync]
  );

  const start = useCallback(
    (payload = {}) =>
      run(() => FocusService.startSession(payload), {
        onError: (err) => {
          // Đã có phiên hoạt động (kể cả retry sau khi rớt mạng) → nhận lại phiên đó
          if (err?.response?.data?.message === 'ACTIVE_SESSION_EXISTS' && err.response.data.data) {
            apply(err.response.data.data);
            return true;
          }
          return false;
        },
      }),
    [run, apply]
  );

  const id = session?.id;
  const pause = useCallback(() => id && run(() => FocusService.pauseSession(id), { onError: resyncOnConflict }), [id, run, resyncOnConflict]);
  const resume = useCallback(() => id && run(() => FocusService.resumeSession(id), { onError: resyncOnConflict }), [id, run, resyncOnConflict]);
  const finish = useCallback(
    (note) => id && run(() => FocusService.finishSession(id, note ? { note } : {}), { onError: resyncOnConflict }),
    [id, run, resyncOnConflict]
  );
  const cancel = useCallback(
    () => id && run(() => FocusService.patchSession(id, { status: 'CANCELLED' }), { onError: resyncOnConflict }),
    [id, run, resyncOnConflict]
  );
  const resetPhase = useCallback(
    () => id && run(() => FocusService.patchSession(id, { resetPhase: true }), { onError: resyncOnConflict }),
    [id, run, resyncOnConflict]
  );
  const linkTodo = useCallback(
    (todoId) => id && run(() => FocusService.patchSession(id, { todoId: todoId || null }), { onError: resyncOnConflict }),
    [id, run, resyncOnConflict]
  );

  const remainingMs = computeRemaining(session);
  const durationMs = session?.phaseDurationMs || 0;
  const progress = durationMs ? Math.min(1, Math.max(0, 1 - remainingMs / durationMs)) : 0;

  // Tổng giây tập trung gồm cả phần pha FOCUS đang chạy (tính từ lúc nhận dữ liệu)
  let liveFocusSeconds = session?.focusSeconds || 0;
  if (session?.status === 'IN_PROGRESS' && session.phase === 'FOCUS') {
    const sinceView = Date.now() + offsetRef.current - Date.parse(session.serverNow);
    liveFocusSeconds += Math.max(0, Math.floor(sinceView / 1000));
  }

  return {
    session,
    lastEnded,
    loading,
    busy,
    error,
    online,
    remainingMs,
    progress,
    liveFocusSeconds,
    clearError: () => setError(null),
    sync,
    start,
    pause,
    resume,
    finish,
    cancel,
    resetPhase,
    linkTodo,
  };
}

