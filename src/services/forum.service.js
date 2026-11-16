import api from '../config/axios.config.js';

const ForumService = {
  async listSchools() {
    const response = await api.get('/forum/schools', { schoolScoped: true });
    return response.data;
  },
  async getMyStats() {
    const response = await api.get('/forum/stats/me', { schoolScoped: true });
    return response.data;
  },
  async listPosts(params = {}) {
    const response = await api.get('/forum/posts', { params, schoolScoped: true });
    return response.data;
  },
  async getPost(id) {
    const response = await api.get(`/forum/posts/${id}`, { schoolScoped: true });
    return response.data;
  },
  async createPost(data) {
    const response = await api.post('/forum/posts', data, { schoolScoped: true });
    return response.data;
  },
  async deletePost(id) {
    const response = await api.delete(`/forum/posts/${id}`, { schoolScoped: true });
    return response.data;
  },
  async toggleLike(id) {
    const response = await api.post(`/forum/posts/${id}/like`, undefined, { schoolScoped: true });
    return response.data;
  },
  async addComment(id, data) {
    const response = await api.post(`/forum/posts/${id}/comments`, data, { schoolScoped: true });
    return response.data;
  },
  async deleteComment(commentId) {
    const response = await api.delete(`/forum/comments/${commentId}`, { schoolScoped: true });
    return response.data;
  },
};

export default ForumService;
