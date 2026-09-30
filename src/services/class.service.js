import api from '../config/axios.config.js';

const ClassService = {
  /**
   * GET /api/classes — Lấy danh sách lớp
   * Giảng viên sẽ nhận được các lớp mà họ phụ trách (backend tự filter theo user.role)
   */
  async getMyClasses(params = {}) {
    const response = await api.get('/classes', { params: { limit: 100, ...params } });
    return response.data;
  },

  /**
   * GET /api/classes/:id — Chi tiết 1 lớp
   */
  async getClassById(classId) {
    const response = await api.get(`/classes/${classId}`);
    return response.data;
  },
};

export default ClassService;