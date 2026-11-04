import api from '../config/axios.config.js';

const ForumService = {
  async listPosts(params = {}) {
    const response = await api.get('/forum/posts', { params });
    return response.data;
  },
  async getPost(id) {
    const response = await api.get(`/forum/posts/${id}`);
    return response.data;
  },
  async createPost(data) {
    const response = await api.post('/forum/posts', data);
    return response.data;
  },
  async deletePost(id) {
    const response = await api.delete(`/forum/posts/${id}`);
    return response.data;
  },
  async toggleLike(id) {
    const response = await api.post(`/forum/posts/${id}/like`);
    return response.data;
  },
  async addComment(id, data) {
    const response = await api.post(`/forum/posts/${id}/comments`, data);
    return response.data;
  },
  async deleteComment(commentId) {
    const response = await api.delete(`/forum/comments/${commentId}`);
    return response.data;
  },
};

export default ForumService;
