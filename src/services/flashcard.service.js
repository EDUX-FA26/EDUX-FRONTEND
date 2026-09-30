import api from '../config/axios.config.js';

const FlashcardService = {
  // ─────────────────────────────────────────────
  // DECK
  // ─────────────────────────────────────────────

  /** GET /api/flashcards/decks — Danh sách deck (có filter + phân trang) */
  async getDecks(params = {}) {
    const response = await api.get('/flashcards/decks', { params });
    return response.data;
  },

  /** GET /api/flashcards/decks/:deckId — Chi tiết deck + toàn bộ cards */
  async getDeckById(deckId) {
    const response = await api.get(`/flashcards/decks/${deckId}`);
    return response.data;
  },

  /** POST /api/flashcards/decks — Tạo deck mới (lecturer, admin) */
  async createDeck(data) {
    const response = await api.post('/flashcards/decks', data);
    return response.data;
  },

  /** PUT /api/flashcards/decks/:deckId — Sửa deck */
  async updateDeck(deckId, data) {
    const response = await api.put(`/flashcards/decks/${deckId}`, data);
    return response.data;
  },

  /** PUT /api/flashcards/decks/:deckId/publish — Publish deck */
  async publishDeck(deckId) {
    const response = await api.put(`/flashcards/decks/${deckId}/publish`);
    return response.data;
  },

  /** DELETE /api/flashcards/decks/:deckId — Xóa deck */
  async deleteDeck(deckId) {
    const response = await api.delete(`/flashcards/decks/${deckId}`);
    return response.data;
  },

  /** POST /api/flashcards/decks/:deckId/complete — Hoàn thành deck (tăng streak) */
  async completeDeck(deckId) {
    const response = await api.post(`/flashcards/decks/${deckId}/complete`);
    return response.data;
  },

  /** GET /api/flashcards/decks/:deckId/class-access — Lấy danh sách lớp được phép xem */
  async getClassAccess(deckId) {
    const response = await api.get(`/flashcards/decks/${deckId}/class-access`);
    return response.data;
  },

  /** PUT /api/flashcards/decks/:deckId/class-access — Cập nhật lớp được phép xem */
  async setClassAccess(deckId, classIds) {
    const response = await api.put(`/flashcards/decks/${deckId}/class-access`, { class_ids: classIds });
    return response.data;
  },

  // ─────────────────────────────────────────────
  // CARD
  // ─────────────────────────────────────────────

  /** GET /api/flashcards/decks/:deckId/cards — Xem cards */
  async getCards(deckId) {
    const response = await api.get(`/flashcards/decks/${deckId}/cards`);
    return response.data;
  },

  /** POST /api/flashcards/decks/:deckId/cards — Tạo card */
  async createCard(deckId, data) {
    const response = await api.post(`/flashcards/decks/${deckId}/cards`, data);
    return response.data;
  },

  /** PUT /api/flashcards/decks/:deckId/cards — Sửa card */
  async updateCard(deckId, data) {
    const response = await api.put(`/flashcards/decks/${deckId}/cards`, data);
    return response.data;
  },

  /** DELETE /api/flashcards/decks/:deckId/cards — Xóa card */
  async deleteCard(deckId, cardId) {
    const response = await api.delete(`/flashcards/decks/${deckId}/cards`, { data: { cardId } });
    return response.data;
  },

  // ─────────────────────────────────────────────
  // REVIEW & SRS
  // ─────────────────────────────────────────────

  /** POST /api/flashcards/cards/:cardId/reviews — Ghi kết quả học 1 card */
  async submitReview(cardId, result) {
    const response = await api.post(`/flashcards/cards/${cardId}/reviews`, { result });
    return response.data;
  },

  /** GET /api/flashcards/decks/:deckId/study — Lấy hàng đợi học SRS */
  async getStudyQueue(deckId) {
    const response = await api.get(`/flashcards/decks/${deckId}/study`);
    return response.data;
  },

  /** GET /api/flashcards/decks/:deckId/reviews/stats — Thống kê tiến độ */
  async getDeckReviewStats(deckId) {
    const response = await api.get(`/flashcards/decks/${deckId}/reviews/stats`);
    return response.data;
  },

  // ─────────────────────────────────────────────
  // FLASHCARD TESTS
  // ─────────────────────────────────────────────

  /** POST /api/flashcards/decks/:deckId/tests — Tạo lượt làm bài kiểm tra */
  async createTest(deckId) {
    const response = await api.post(`/flashcards/decks/${deckId}/tests`);
    return response.data;
  },

  /** GET /api/flashcards/tests/:testId — Lấy thông tin bài kiểm tra */
  async getTest(testId) {
    const response = await api.get(`/flashcards/tests/${testId}`);
    return response.data;
  },

  /** POST /api/flashcards/tests/:testId/submit — Nộp bài kiểm tra */
  async submitTest(testId, answers) {
    const response = await api.post(`/flashcards/tests/${testId}/submit`, { answers });
    return response.data;
  },

  /** GET /api/flashcards/tests/:testId/result — Xem kết quả chi tiết */
  async getTestResult(testId) {
    const response = await api.get(`/flashcards/tests/${testId}/result`);
    return response.data;
  },
};

export default FlashcardService;
