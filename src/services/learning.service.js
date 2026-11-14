import api from '../config/axios.config.js';

const LearningService = {
  // ── Streak ──────────────────────────────────────────────────────
  async getAllSubjectStreaks() {
    const response = await api.get('/learning/streak', { schoolScoped: true });
    return response.data;
  },

  async getSubjectStreak(subjectId) {
    const response = await api.get(`/learning/streak/${subjectId}`, { schoolScoped: true });
    return response.data;
  },

  async recoverSubjectStreak(subjectId) {
    const response = await api.post(`/learning/streak/${subjectId}/recover`, {}, { schoolScoped: true });
    return response.data;
  },

  // ── Activity & Heatmap ───────────────────────────────────────────
  async getActivityHistory(params = {}) {
    const response = await api.get('/learning/activity', { params, schoolScoped: true });
    return response.data;
  },

  async getHeatmap(params = {}) {
    const response = await api.get('/learning/heatmap', { params, schoolScoped: true });
    return response.data;
  },

  async recordActivity(deckId) {
    const response = await api.post('/learning/activity', { deckId }, { schoolScoped: true });
    return response.data;
  },

  // ── Learning Profile & Topic Analytics ──────────────────────────
  async getLearningProfile(subjectId) {
    const response = await api.get('/learning/profile', {
      params: subjectId ? { subjectId } : {},
      schoolScoped: true,
    });
    return response.data;
  },

  async getTopicPerformance(subjectId) {
    const response = await api.get('/learning/topics/performance', {
      params: subjectId ? { subjectId } : {},
      schoolScoped: true,
    });
    return response.data;
  },

  // ── Study Plan ───────────────────────────────────────────────────
  /** Lấy kế hoạch học đang chạy kèm tiến độ 7 ngày */
  async getActivePlan(subjectId = null) {
    const response = await api.get('/learning/study-plan', {
      params: subjectId ? { subjectId } : {},
      schoolScoped: true,
    });
    return response.data;
  },

  /** Tạo hoặc lấy lại kế hoạch học 7 ngày cho môn học */
  async generateStudyPlan(subjectId, { force = false } = {}) {
    const response = await api.post(
      '/learning/study-plan/generate',
      {},
      {
        params: {
          subjectId,
          ...(force ? { force: 'true' } : {}),
        },
        schoolScoped: true,
      }
    );

    return response.data;
  },

  /** Preview kế hoạch 7 ngày (không lưu vào DB) */
  async getStudyPlanPreview(subjectId) {
    const response = await api.get('/learning/study-plan/preview', {
      params: { subjectId },
      schoolScoped: true,
    });
    return response.data;
  },

  async getStudyPlanMistakes(subjectId) {
    const response = await api.get('/learning/study-plan/mistakes', {
      params: { subjectId },
      schoolScoped: true,
    });
    return response.data;
  },

  /** Lấy chi tiết 1 ngày học (câu hỏi đã tạo) */
  async getStudyPlanDay(planDayId) {
    const response = await api.get(`/learning/study-plan/days/${planDayId}`, { schoolScoped: true });
    return response.data;
  },

  /** Tạo câu hỏi AI cho 1 ngày học (gọi Gemini) */
  async generateStudyPlanDay(planDayId) {
    const response = await api.post(`/learning/study-plan/days/${planDayId}/generate`, {}, { schoolScoped: true });
    return response.data;
  },

  /** Nộp bài cho 1 ngày học */
  async submitStudyPlanDay(planDayId, answers) {
    const response = await api.post(
      `/learning/study-plan/days/${planDayId}/submit`,
      { answers },
      { schoolScoped: true }
    );
    return response.data;
  },

  /** Xem lại kết quả 1 ngày học đã nộp */
  async getStudyPlanDayResult(planDayId) {
    const response = await api.get(`/learning/study-plan/days/${planDayId}/result`, { schoolScoped: true });
    return response.data;
  },
};

export default LearningService;
