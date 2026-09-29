import api from '../config/axios.config.js';

const LearningService = {
    async getAllSubjectStreaks() {
        const response = await api.get('/learning/streak');
        return response.data;
    },

    async getSubjectStreak(subjectId) {
        const response = await api.get(`/learning/streak/${subjectId}`);
        return response.data;
    },

    async recoverSubjectStreak(subjectId) {
        const response = await api.post(
            `/learning/streak/${subjectId}/recover`
        );
        return response.data;
    },

    async getActivityHistory(params = {}) {
        const response = await api.get('/learning/activity', {
            params,
        });
        return response.data;
    },

    async getHeatmap(params = {}) {
        const response = await api.get('/learning/heatmap', {
            params,
        });
        return response.data;
    },

    async recordActivity(deckId) {
        const response = await api.post('/learning/activity', {
            deckId,
        });
        return response.data;
    },
};

export default LearningService;