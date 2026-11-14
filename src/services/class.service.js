import api from '../config/axios.config.js';

const ClassService = {
  /**
   * GET /api/classes
   * Lấy danh sách lớp của student
   */
  async getStudentClasses(userId, params = {}) {
    const response = await api.get('/classes', {
      params: {
        studentId: userId,
        limit: 100,
        ...params,
      },
      schoolScoped: true,
    });

    return response.data;
  },

  /**
   * GET /api/classes
   * Lấy danh sách lớp của lecturer
   */
  async getLecturerClasses(userId, params = {}) {
    const response = await api.get('/classes', {
      params: {
        lecturerId: userId,
        limit: 100,
        ...params,
      },
      schoolScoped: true,
    });

    return response.data;
  },

  /**
   * GET /api/classes
   * Lấy danh sách lớp của user hiện tại
   * Backend tự filter theo role
   */
  async getMyClasses(params = {}) {
    const response = await api.get('/classes', {
      params: {
        limit: 100,
        ...params,
      },
      schoolScoped: true,
    });

    return response.data;
  },

  /**
   * GET /api/classes/:id
   * Lấy chi tiết lớp
   */
  async getClassById(classId) {
    const response = await api.get(`/classes/${classId}`, {
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * GET /api/classes/:id
   * Alias cho getClassById
   */
  async getClassDetail(classId) {
    const response = await api.get(`/classes/${classId}`, {
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * GET /api/classes/:id/members
   * Lấy danh sách thành viên trong lớp
   */
  async getClassMembers(classId, params = {}) {
    const response = await api.get(`/classes/${classId}/members`, {
      params,
      schoolScoped: true,
    });

    return response.data;
  },

  /**
   * GET /api/classes/:id/slots
   * Lấy danh sách slot của lớp
   */
  async getClassSlots(classId) {
    const response = await api.get(`/classes/${classId}/slots`, {
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * GET /api/classes/:classId/ai-advisor
   * Lấy dữ liệu trợ lý sư phạm AI & lịch sử
   */
  async getClassAiAdvisor(classId) {
    const response = await api.get(`/classes/${classId}/ai-advisor`, {
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * POST /api/classes/:classId/ai-advisor/refresh
   * Buộc phân tích lại bài tập mới nhất
   */
  async refreshClassAiAdvisor(classId) {
    const response = await api.post(
      `/classes/${classId}/ai-advisor/refresh`,
      undefined,
      { schoolScoped: true }
    );
    return response.data;
  },
};

export default ClassService;