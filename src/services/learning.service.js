import api from '../config/axios.config.js';

const LearningService = {
  // ── Streak & Activity ──
  async getAllSubjectStreaks() {
    const response = await api.get('/learning/streak');
    return response.data;
  },

  async getSubjectStreak(subjectId) {
    const response = await api.get(`/learning/streak/${subjectId}`);
    return response.data;
  },

  async recoverSubjectStreak(subjectId) {
    const response = await api.post(`/learning/streak/${subjectId}/recover`, {});
    return response.data;
  },

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

  // ── Phase 4: Learning Profile & Topic Analytics ──
  async getLearningProfile(subjectId, params = {}) {
    const response = await api.get('/learning/profile', {
      params: { subjectId, ...params },
    });
    return response.data;
  },

  async getTopicPerformance(subjectId) {
    const response = await api.get('/learning/topics/performance', {
      params: { subjectId },
    });
    return response.data;
  },

  // ── Phase 4: Study Plan & AI Practice Quiz ──
  async generateStudyPlan(subjectId) {
    const response = await api.post('/learning/study-plan/generate', {}, {
      params: { subjectId },
    });
    return response.data;
  },

  async getStudyPlanPreview(subjectId) {
    const response = await api.get('/learning/study-plan/preview', {
      params: { subjectId },
    });
    return response.data;
  },

  async getStudyPlanMistakes(subjectId) {
    const response = await api.get('/learning/study-plan/mistakes', {
      params: { subjectId },
    });
    return response.data;
  },

  async getStudyPlanDay(planDayId) {
    const response = await api.get(`/learning/study-plan/days/${planDayId}`);
    return response.data;
  },

  async generateStudyPlanDay(planDayId) {
    const response = await api.post(`/learning/study-plan/days/${planDayId}/generate`, {});
    return response.data;
  },

  async submitStudyPlanDay(planDayId, answers) {
    const response = await api.post(`/learning/study-plan/days/${planDayId}/submit`, {
      answers,
    });
    return response.data;
  },

  async getStudyPlanDayResult(planDayId) {
    const response = await api.get(`/learning/study-plan/days/${planDayId}/result`);
    return response.data;
  },
};

export default LearningService;
