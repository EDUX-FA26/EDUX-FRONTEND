import api from '../config/axios.config.js';

const LearningService = {
  // ── Streak ──────────────────────────────────────────────────────
  async getAllSubjectStreaks() {
    const response = await api.get('/learning/streak');
    return response.data;
  },

  async getSubjectStreak(subjectId) {
    const response = await api.get(`/learning/streak/${subjectId}`);
    return response.data;
  },

  async recoverSubjectStreak(subjectId) {
    const response = await api.post(`/learning/streak/${subjectId}/recover`);
    return response.data;
  },

  // ── Activity & Heatmap ───────────────────────────────────────────
  async getActivityHistory(params = {}) {
    const response = await api.get('/learning/activity', { params });
    return response.data;
  },

  async getHeatmap(params = {}) {
    const response = await api.get('/learning/heatmap', { params });
    return response.data;
  },

  async recordActivity(deckId) {
    const response = await api.post('/learning/activity', { deckId });
    return response.data;
  },

  // ── Learning Profile & Topic Analytics ──────────────────────────
  async getLearningProfile(subjectId) {
    const response = await api.get('/learning/profile', {
      params: subjectId ? { subjectId } : {},
    });
    return response.data;
  },

  async getTopicPerformance(subjectId) {
    const response = await api.get('/learning/topics/performance', {
      params: subjectId ? { subjectId } : {},
    });
    return response.data;
  },

  // ── Study Plan ───────────────────────────────────────────────────
  /** Lấy kế hoạch học đang chạy kèm tiến độ 7 ngày */
  async getActivePlan(subjectId = null) {
    const response = await api.get('/learning/study-plan', {
      params: subjectId ? { subjectId } : {},
    });
    return response.data;
  },

  /** Tạo hoặc lấy lại kế hoạch học 7 ngày cho môn học */
  async generateStudyPlan(subjectId) {
    const response = await api.post('/learning/study-plan/generate', null, {
      params: { subjectId },
    });
    return response.data;
  },

  /** Preview kế hoạch 7 ngày (không lưu vào DB) */
  async getStudyPlanPreview(subjectId) {
    const response = await api.get('/learning/study-plan/preview', {
      params: { subjectId },
    });
    return response.data;
  },

  /** Lấy chi tiết 1 ngày học (câu hỏi đã tạo) */
  async getStudyPlanDay(planDayId) {
    const response = await api.get(`/learning/study-plan/days/${planDayId}`);
    return response.data;
  },

  /** Tạo câu hỏi AI cho 1 ngày học (gọi Gemini) */
  async generateStudyPlanDay(planDayId) {
    const response = await api.post(`/learning/study-plan/days/${planDayId}/generate`);
    return response.data;
  },

  /** Nộp bài cho 1 ngày học */
  async submitStudyPlanDay(planDayId, answers) {
    const response = await api.post(
      `/learning/study-plan/days/${planDayId}/submit`,
      { answers }
    );
    return response.data;
  },

  /** Xem lại kết quả 1 ngày học đã nộp */
  async getStudyPlanDayResult(planDayId) {
    const response = await api.get(`/learning/study-plan/days/${planDayId}/result`);
    return response.data;
  },
};

export default LearningService;