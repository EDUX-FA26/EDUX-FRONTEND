import api from '../config/axios.config.js';

const AssignmentService = {
    async getClassAssignments(classId) {
        const response = await api.get('/assignments', {
            params: { class_id: classId },
            schoolScoped: true,
        });
        return response.data;
    },

    async createAssignment(data) {
        const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
        const response = await api.post('/assignments', data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
            schoolScoped: true,
        });
        return response.data;
    },

    async updateAssignment(assignmentId, data) {
        const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
        const response = await api.patch(`/assignments/${assignmentId}`, data, {
            headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
            schoolScoped: true,
        });
        return response.data;
    },

    async updatePublishStatus(assignmentId, publishStatus) {
        const response = await api.patch(
            `/assignments/${assignmentId}/publish-status`,
            { publish_status: publishStatus },
            { schoolScoped: true }
        );
        return response.data;
    },

    async deleteAssignment(assignmentId, force = false) {
        const response = await api.delete(`/assignments/${assignmentId}`, {
            params: force ? { force: true } : {},
            schoolScoped: true,
        });
        return response.data;
    },

    async getAssignmentDetail(assignmentId) {
        const response = await api.get(`/assignments/${assignmentId}`, {
            schoolScoped: true,
        });
        return response.data;
    },

    async getMaterialDownloadUrl(assignmentId, materialId) {
        const response = await api.get(
            `/assignments/${assignmentId}/materials/${materialId}/download`,
            { schoolScoped: true }
        );
        return response.data;
    },

    async deleteMaterial(assignmentId, materialId) {
        const response = await api.delete(
            `/assignments/${assignmentId}/materials/${materialId}`,
            { schoolScoped: true }
        );
        return response.data;
    }
};

export default AssignmentService;
