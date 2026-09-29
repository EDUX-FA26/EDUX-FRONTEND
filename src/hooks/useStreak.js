import { useState, useEffect, useCallback } from 'react';
import LearningService from '../services/learning.service';
import { useStreakRealtime } from './useStreakRealtime';

// Thêm tham số skipInitialFetch = false để có thể chủ động fetch song song ở component cha nếu cần
export function useStreak(subjectId = null, skipInitialFetch = false) {
  const [streaks, setStreaks] = useState(subjectId ? null : []);
  const [loading, setLoading] = useState(!skipInitialFetch);
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
    if (!skipInitialFetch) {
      fetchStreaks();
    }
  }, [fetchStreaks, skipInitialFetch]);

  // Lắng nghe realtime update từ Socket.IO
  useStreakRealtime((payload) => {
    if (subjectId) {
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
      setStreaks((prevList) =>
        (Array.isArray(prevList) ? prevList : []).map((item) =>
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
    await fetchStreaks();
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