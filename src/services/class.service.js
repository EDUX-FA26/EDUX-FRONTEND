import api from '../config/axios.config.js';

const ClassService = {
    async getStudentClasses(userId, params = {}) {
        const response = await api.get('/classes', { params: { studentId: userId, ...params } });
        return response.data;
    },

    async getClassDetail(classId) {
        const response = await api.get(`/classes/${classId}`);
        return response.data;
    },

    async getClassSlots(classId) {
        const response = await api.get(`/classes/${classId}/slots`);
        return response.data;
    }
};

export default ClassService;