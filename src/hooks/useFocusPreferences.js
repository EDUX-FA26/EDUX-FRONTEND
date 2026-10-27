import { useCallback, useEffect, useRef, useState } from 'react';
import FocusService from '../services/focus.service';

const DEBOUNCE_MS = 700;

/**
 * Tải cấu hình phòng học + danh mục (hình nền, âm thanh) từ BE.
 * `update()` cập nhật UI ngay (optimistic) và gộp nhiều thay đổi liên tiếp
 * (vd. kéo thanh âm lượng) thành 1 request PUT sau DEBOUNCE_MS.
 */
export function useFocusPreferences() {
  const [prefs, setPrefs] = useState(null);
  const [catalog, setCatalog] = useState({ backgrounds: [], sounds: [] });
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(null);

  const pendingRef = useRef({});
  const timerRef = useRef(null);

  const flush = useCallback(async () => {
    clearTimeout(timerRef.current);
    const payload = pendingRef.current;
    if (!Object.keys(payload).length) return;
    pendingRef.current = {};

    try {
      await FocusService.savePreferences(payload);
      setSaveError(null);
    } catch (err) {
      // Giữ lại thay đổi để lần lưu sau gửi cùng
      pendingRef.current = { ...payload, ...pendingRef.current };
      setSaveError(err?.response?.data?.message || 'Không lưu được cấu hình.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    FocusService.getPreferences()
      .then((res) => {
        if (cancelled) return;
        setPrefs(res.data.preferences);
        setCatalog(res.data.catalog);
      })
      .catch((err) => {
        if (!cancelled) setSaveError(err?.response?.data?.message || 'Không tải được cấu hình phòng học.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      flush(); // lưu nốt khi rời trang
    };
  }, [flush]);

  const update = useCallback(
    (partial) => {
      setPrefs((current) => (current ? { ...current, ...partial } : current));
      pendingRef.current = { ...pendingRef.current, ...partial };
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [flush]
  );

  return { prefs, catalog, loading, saveError, update, flush };
}

