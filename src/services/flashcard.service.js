import api from '../config/axios.config.js';

const FlashcardService = {
  // ─────────────────────────────────────────────
  // DECK
  // ─────────────────────────────────────────────

  /** GET /api/flashcards/decks — Danh sách deck (có filter + phân trang) */
  async getDecks(params = {}) {
    const response = await api.get('/flashcards/decks', { params, schoolScoped: true });
    return response.data;
  },

  /** GET /api/flashcards/decks/:deckId — Chi tiết deck + toàn bộ cards */
  async getDeckById(deckId) {
    const response = await api.get(`/flashcards/decks/${deckId}`, { schoolScoped: true });
    return response.data;
  },

  /** POST /api/flashcards/decks — Tạo deck mới (lecturer, admin) */
  async createDeck(data) {
    const response = await api.post('/flashcards/decks', data, { schoolScoped: true });
    return response.data;
  },

  /** PUT /api/flashcards/decks/:deckId — Sửa deck */
  async updateDeck(deckId, data) {
    const response = await api.put(`/flashcards/decks/${deckId}`, data, { schoolScoped: true });
    return response.data;
  },

  /** PUT /api/flashcards/decks/:deckId/publish — Publish deck */
  async publishDeck(deckId) {
    const response = await api.put(`/flashcards/decks/${deckId}/publish`, {}, { schoolScoped: true });
    return response.data;
  },

  /** DELETE /api/flashcards/decks/:deckId — Xóa deck */
  async deleteDeck(deckId) {
    const response = await api.delete(`/flashcards/decks/${deckId}`, { schoolScoped: true });
    return response.data;
  },

  /** POST /api/flashcards/decks/:deckId/complete — Hoàn thành deck (tăng streak) */
  async completeDeck(deckId) {
    const response = await api.post(`/flashcards/decks/${deckId}/complete`, {}, { schoolScoped: true });
    return response.data;
  },

  /** GET /api/flashcards/decks/:deckId/class-access — Lấy danh sách lớp được phép xem */
  async getClassAccess(deckId) {
    const response = await api.get(`/flashcards/decks/${deckId}/class-access`, { schoolScoped: true });
    return response.data;
  },

  /** PUT /api/flashcards/decks/:deckId/class-access — Cập nhật lớp được phép xem */
  async setClassAccess(deckId, classIds) {
    const response = await api.put(`/flashcards/decks/${deckId}/class-access`, { class_ids: classIds }, { schoolScoped: true });
    return response.data;
  },

  // ─────────────────────────────────────────────
  // CARD
  // ─────────────────────────────────────────────

  /** GET /api/flashcards/decks/:deckId/cards — Xem cards */
  async getCards(deckId) {
    const response = await api.get(`/flashcards/decks/${deckId}/cards`, { schoolScoped: true });
    return response.data;
  },

  /** POST /api/flashcards/decks/:deckId/cards — Tạo card */
  async createCard(deckId, data) {
    const response = await api.post(`/flashcards/decks/${deckId}/cards`, data, { schoolScoped: true });
    return response.data;
  },

  /** PUT /api/flashcards/decks/:deckId/cards/:cardId — Sửa card */
  async updateCard(deckId, cardId, data) {
    const response = await api.put(`/flashcards/decks/${deckId}/cards/${cardId}`, data, { schoolScoped: true });
    return response.data;
  },

  /** DELETE /api/flashcards/decks/:deckId/cards/:cardId — Xóa card */
  async deleteCard(deckId, cardId) {
    const response = await api.delete(`/flashcards/decks/${deckId}/cards/${cardId}`, { schoolScoped: true });
    return response.data;
  },

  /** GET /api/flashcards/template/excel — Tải file Excel mẫu */
  async downloadExcelTemplate() {
    const response = await api.get('/flashcards/template/excel', {
      responseType: 'blob',
      schoolScoped: true,
    });
    return response.data;
  },

  /** POST /api/flashcards/decks/:deckId/cards/import-excel — Import cards từ file Excel */
  async importCardsFromExcel(deckId, file, topicName = '') {
    const formData = new FormData();
    formData.append('file', file);
    if (topicName) {
      formData.append('topicName', topicName);
    }
    const response = await api.post(`/flashcards/decks/${deckId}/cards/import-excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      schoolScoped: true,
    });
    return response.data;
  },

  // ─────────────────────────────────────────────
  // REVIEW & SRS
  // ─────────────────────────────────────────────

  /** POST /api/flashcards/cards/:cardId/reviews — Ghi kết quả học 1 card */
  async submitReview(cardId, result) {
    const response = await api.post(`/flashcards/cards/${cardId}/reviews`, { result }, { schoolScoped: true });
    return response.data;
  },

  /** GET /api/flashcards/decks/:deckId/study — Lấy hàng đợi học SRS */
  async getStudyQueue(deckId) {
    const response = await api.get(`/flashcards/decks/${deckId}/study`, { schoolScoped: true });
    return response.data;
  },

  /** GET /api/flashcards/decks/:deckId/reviews/stats — Thống kê tiến độ */
  async getDeckReviewStats(deckId) {
    const response = await api.get(`/flashcards/decks/${deckId}/reviews/stats`, { schoolScoped: true });
    return response.data;
  },

  // ─────────────────────────────────────────────
  // FLASHCARD TESTS
  // ─────────────────────────────────────────────

  /** POST /api/flashcards/decks/:deckId/tests — Tạo lượt làm bài kiểm tra */
  async createTest(deckId) {
    const response = await api.post(`/flashcards/decks/${deckId}/tests`, {}, { schoolScoped: true });
    return response.data;
  },

  /** GET /api/flashcards/tests/:testId — Lấy thông tin bài kiểm tra */
  async getTest(testId) {
    const response = await api.get(`/flashcards/tests/${testId}`, { schoolScoped: true });
    return response.data;
  },

  /** POST /api/flashcards/tests/:testId/submit — Nộp bài kiểm tra */
  async submitTest(testId, answers) {
    const response = await api.post(`/flashcards/tests/${testId}/submit`, { answers }, { schoolScoped: true });
    return response.data;
  },

  /** GET /api/flashcards/tests/:testId/result — Xem kết quả chi tiết */
  async getTestResult(testId) {
    const response = await api.get(`/flashcards/tests/${testId}/result`, { schoolScoped: true });
    return response.data;
  },
};

export default FlashcardService;
