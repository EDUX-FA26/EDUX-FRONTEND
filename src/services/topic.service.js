import api from '../config/axios.config.js';

const TopicService = {
  /** Lấy danh sách các topic của môn học */
  async getTopics(subjectId) {
    const response = await api.get('/topics', {
      params: { subjectId },
    });
    return response.data;
  },

  /** Tạo topic mới thủ công nếu cần */
  async createTopic(data) {
    const response = await api.post('/topics', data);
    return response.data;
  },
};

export default TopicService;

