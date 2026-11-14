import api from '../config/axios.config.js';

/** Smart Todo API. Mỗi hàm trả về `response.data` = { success, message, data }. */
const TodoService = {
  async create(payload) {
    const response = await api.post('/todos', payload, { schoolScoped: true });
    return response.data;
  },
  async list(params = {}) {
    const response = await api.get('/todos', { params, schoolScoped: true });
    return response.data;
  },
  async getById(id) {
    const response = await api.get(`/todos/${id}`, { schoolScoped: true });
    return response.data;
  },
  async update(id, payload) {
    const response = await api.patch(`/todos/${id}`, payload, { schoolScoped: true });
    return response.data;
  },
  async changeStatus(id, status) {
    const response = await api.patch(`/todos/${id}/status`, { status }, { schoolScoped: true });
    return response.data;
  },
  async remove(id) {
    const response = await api.delete(`/todos/${id}`, { schoolScoped: true });
    return response.data;
  },
  async getStats() {
    const response = await api.get('/todos/stats', { schoolScoped: true });
    return response.data;
  },

  // Tích hợp Study Planner (chỉ tham chiếu planDayId)
  async getStudyPlanSuggestions(params = {}) {
    const response = await api.get('/todos/study-plan-suggestions', { params, schoolScoped: true });
    return response.data;
  },
  async createFromStudyPlan(planDayId) {
    const response = await api.post('/todos/from-study-plan', { planDayId }, { schoolScoped: true });
    return response.data;
  },
};

export default TodoService;
