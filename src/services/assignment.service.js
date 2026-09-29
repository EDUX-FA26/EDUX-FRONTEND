import api from '../config/axios.config.js';

const AssignmentService = {
    async getClassAssignments(classId) {
        const response = await api.get('/assignments', { params: { class_id: classId } });
        return response.data;
    },

    async getAssignmentDetail(assignmentId) {
        const response = await api.get(`/assignments/${assignmentId}`);
        return response.data;
    }
};

export default AssignmentService;