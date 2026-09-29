import { useState, useEffect, useCallback } from 'react';
import LearningService from '../services/learning.service';
import { useStreakRealtime } from './useStreakRealtime';

export function useStreak(subjectId = null) {
  const [streaks, setStreaks] = useState(subjectId ? null : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStreaks = useCallback(async () => {
    try {
      setLoading(true);
      const data = subjectId 
        ? await LearningService.getSubjectStreak(subjectId)
        : await LearningService.getAllSubjectStreaks();
      setStreaks(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load streak');
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchStreaks();
  }, [fetchStreaks]);

  // Lắng nghe realtime update từ Socket.IO
  useStreakRealtime((payload) => {
    if (subjectId) {
      // Nếu đang ở màn hình chi tiết 1 môn học
      if (payload.subjectId === subjectId) {
        setStreaks((prev) => ({
          ...prev,
          currentStreak: payload.currentStreak,
          longestStreak: payload.longestStreak,
          lastActivityDate: payload.lastActivityDate,
          recoveryUsed: payload.recoveryUsed,
          recoveryRemaining: payload.recoveryRemaining,
        }));
      }
    } else {
      // Nếu đang ở Dashboard tổng hợp danh sách các môn
      setStreaks((prevList) =>
        prevList.map((item) =>
          item.subjectId === payload.subjectId
            ? {
                ...item,
                currentStreak: payload.currentStreak,
                longestStreak: payload.longestStreak,
                lastActivityDate: payload.lastActivityDate,
                recoveryUsed: payload.recoveryUsed,
                recoveryRemaining: payload.recoveryRemaining,
              }
            : item
        )
      );
    }
  });

  const recover = async (targetSubjectId) => {
    const res = await LearningService.recoverSubjectStreak(targetSubjectId);
    await fetchStreaks(); // Refresh lại dữ liệu sau khi recover thành công
    return res;
  };

  const recordDeck = async (deckId) => {
    const res = await LearningService.recordActivity(deckId);
    return res;
  };

  return {
    streaks,
    loading,
    error,
    refresh: fetchStreaks,
    recoverStreak: recover,
    recordActivity: recordDeck,
  };
}