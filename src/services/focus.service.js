import api from '../config/axios.config.js';

/**
 * Focus Room API. Mỗi hàm trả về `response.data` = { success, message, data }.
 * Các thao tác pause/resume/finish là idempotent ở BE nên an toàn khi retry.
 */
const FocusService = {
  // Nhóm A — Focus Session
  async startSession(payload = {}) {
    const response = await api.post('/focus/sessions', payload);
    return response.data;
  },
  async getCurrentSession() {
    const response = await api.get('/focus/sessions/current');
    return response.data;
  },
  async listSessions(params = {}) {
    const response = await api.get('/focus/sessions', { params });
    return response.data;
  },
  async getSession(id) {
    const response = await api.get(`/focus/sessions/${id}`);
    return response.data;
  },
  async patchSession(id, payload) {
    const response = await api.patch(`/focus/sessions/${id}`, payload);
    return response.data;
  },
  async pauseSession(id) {
    const response = await api.post(`/focus/sessions/${id}/pause`, {});
    return response.data;
  },
  async resumeSession(id) {
    const response = await api.post(`/focus/sessions/${id}/resume`, {});
    return response.data;
  },
  async finishSession(id, payload = {}) {
    const response = await api.post(`/focus/sessions/${id}/finish`, payload);
    return response.data;
  },

  // Nhóm D — Lịch sử & thống kê
  async getHistory(params = {}) {
    const response = await api.get('/focus/sessions/history', { params });
    return response.data;
  },
  async getSummary(params = {}) {
    const response = await api.get('/focus/stats/summary', { params });
    return response.data;
  },
  async getDaily(days = 7) {
    const response = await api.get('/focus/stats/daily', { params: { days } });
    return response.data;
  },
  async getWeekly(weeks = 8) {
    const response = await api.get('/focus/stats/weekly', { params: { weeks } });
    return response.data;
  },

  // Nhóm E — Cấu hình phòng học
  async getPreferences() {
    const response = await api.get('/focus/preferences');
    return response.data;
  },
  async savePreferences(payload) {
    const response = await api.put('/focus/preferences', payload);
    return response.data;
  },
};

export default FocusService;

