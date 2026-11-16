import api from '../config/axios.config.js';

const TopicService = {
  /**
   * Lấy danh sách Topic của môn học
   * @param {string} subjectId - UUID của môn học
   * @param {object} params - query params (includeAll, status, reviewRequired, isActive, search, page, limit)
   */
  async getTopics(subjectId, params = {}) {
    const response = await api.get('/topics', {
      params: { subjectId, ...params },
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * Xem chi tiết Topic bao gồm aliases, audit fields, số flashcards liên kết
   * @param {string} topicId - UUID của topic
   */
  async getTopicDetail(topicId) {
    const response = await api.get(`/topics/${topicId}`, {
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * School Admin tạo Canonical Topic chuẩn
   * @param {object} data - { subjectId, name, code, description }
   */
  async createTopic(data) {
    const response = await api.post('/topics', data, { schoolScoped: true });
    return response.data;
  },

  /**
   * School Admin cập nhật thông tin Canonical Topic
   * @param {string} topicId - UUID của topic
   * @param {object} data - { name, code, description, isActive }
   */
  async updateTopic(topicId, data) {
    const response = await api.patch(`/topics/${topicId}`, data, {
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * School Admin xác nhận học thuật Topic legacy
   * @param {string} topicId - UUID của topic
   * @param {object} data - { code, name, description, reviewNote }
   */
  async confirmLegacyTopic(topicId, data = {}) {
    const response = await api.post(`/topics/${topicId}/confirm-legacy`, data, {
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * School Admin duyệt hoặc từ chối đề xuất Topic từ Giảng viên
   * @param {string} topicId - UUID của proposal
   * @param {object} data - { status: 'approved' | 'rejected', reviewNote: string }
   */
  async reviewProposal(topicId, data) {
    const response = await api.put(`/topics/${topicId}/review`, data, {
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * Giảng viên hoặc School Admin gửi đề xuất Topic mới
   * @param {object} data - { subjectId, name, description, reason }
   */
  async createProposal(data) {
    const response = await api.post('/topics/proposals', data, {
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * School Admin ngừng sử dụng hoặc kích hoạt lại Topic (Soft status)
   * @param {string} topicId - UUID của topic
   * @param {boolean} isActive - true/false
   */
  async toggleTopicStatus(topicId, isActive) {
    const response = await api.patch(
      `/topics/${topicId}/status`,
      { isActive },
      { schoolScoped: true }
    );
    return response.data;
  },

  /**
   * Danh sách Alias của một Topic
   * @param {string} topicId - UUID của topic
   */
  async getAliases(topicId) {
    const response = await api.get(`/topics/${topicId}/aliases`, {
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * Thêm Alias mới cho Topic
   * @param {string} topicId - UUID của topic
   * @param {string} alias - chuỗi alias
   */
  async addAlias(topicId, alias) {
    const response = await api.post(
      `/topics/${topicId}/aliases`,
      { alias },
      { schoolScoped: true }
    );
    return response.data;
  },

  /**
   * Xóa một Alias khỏi Topic
   * @param {string} topicId - UUID của topic
   * @param {string} aliasId - UUID của alias
   */
  async deleteAlias(topicId, aliasId) {
    const response = await api.delete(`/topics/${topicId}/aliases/${aliasId}`, {
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * Tải file Excel mẫu (.xlsx) để import Canonical Topics
   */
  async downloadExcelTemplate() {
    const response = await api.get('/topics/template/excel', {
      responseType: 'blob',
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * Import danh sách Canonical Topics từ file Excel (.xlsx, .csv)
   * @param {string} subjectId - UUID của môn học
   * @param {File} file - File Excel tải lên
   * @param {object} options - { preview: boolean }
   */
  async importExcel(subjectId, file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subjectId', subjectId);
    if (options.preview) {
      formData.append('preview', 'true');
    }
    const response = await api.post('/topics/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      schoolScoped: true,
    });
    return response.data;
  },

  /**
   * Import batch danh sách Canonical Topics dạng JSON
   * @param {string} subjectId - UUID của môn học
   * @param {Array} topics - Mảng topic [{ name, code, description, aliases }]
   */
  async importBatch(subjectId, topics) {
    const response = await api.post(
      '/topics/batch',
      { subjectId, topics },
      { schoolScoped: true }
    );
    return response.data;
  },
};

export default TopicService;
