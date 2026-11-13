import api from '../config/axios.config.js';

const AssignmentService = {
    async getClassAssignments(classId) {
        const response = await api.get('/assignments', { params: { class_id: classId } });
        return response.data;
    },

    async createAssignment(data) {
        const response = await api.post('/assignments', data);
        return response.data;
    },

    async updateAssignment(assignmentId, data) {
        const response = await api.patch(`/assignments/${assignmentId}`, data);
        return response.data;
    },

    async getAssignmentDetail(assignmentId) {
        const response = await api.get(`/assignments/${assignmentId}`);
        return response.data;
    },

    async getMaterialDownloadUrl(assignmentId, materialId) {
        const response = await api.get(`/assignments/${assignmentId}/materials/${materialId}/download`);
        return response.data;
    },

    async deleteMaterial(assignmentId, materialId) {
        const response = await api.delete(`/assignments/${assignmentId}/materials/${materialId}`);
        return response.data;
    },

    async deleteAssignment(assignmentId, force = false) {
        const response = await api.delete(`/assignments/${assignmentId}`, {
            params: force ? { force: true } : {}
        });
        return response.data;
    }
};

export default AssignmentService;
