import api from '../config/axios.config.js';

const ClassMaterialService = {
    // GET /api/classes/:classId/materials (Danh sách tài liệu lớp học)
    async getClassMaterials(classId, params = {}) {
        const response = await api.get(`/classes/${classId}/materials`, {
            params,
            schoolScoped: true,
        });
        return response.data;
    },

    // POST /api/classes/:classId/materials (Upload tài liệu - Lecturer/School Admin)
    async uploadClassMaterial(classId, formData) {
        const response = await api.post(`/classes/${classId}/materials`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            schoolScoped: true,
        });
        return response.data;
    },

    // GET /api/materials/classes/:id (Chi tiết tài liệu)
    async getMaterialById(id) {
        const response = await api.get(`/materials/classes/${id}`, {
            schoolScoped: true,
        });
        return response.data;
    },

    // GET /api/materials/classes/:id/download (Lấy presigned URL để tải xuống)
    async downloadMaterial(id) {
        const response = await api.get(`/materials/classes/${id}/download`, {
            schoolScoped: true,
        });
        return response.data;
    },

    // PATCH /api/materials/classes/:id (Cập nhật metadata - Lecturer/School Admin)
    async updateMaterial(id, updateData) {
        const response = await api.patch(`/materials/classes/${id}`, updateData, {
            schoolScoped: true,
        });
        return response.data;
    },

    // DELETE /api/materials/classes/:id (Xóa tài liệu - Lecturer/School Admin)
    async deleteMaterial(id) {
        const response = await api.delete(`/materials/classes/${id}`, {
            schoolScoped: true,
        });
        return response.data;
    },

    // GET /api/slots/:slotId/materials (Lấy danh sách tài liệu buổi học)
    async getSlotMaterials(slotId, classId = null) {
        const url = classId ? `/classes/${classId}/slots/${slotId}/materials` : `/slots/${slotId}/materials`;
        const response = await api.get(url, {
            schoolScoped: true,
        });
        return response.data;
    },

    // POST /api/lecturer/slots/:slotId/materials (Upload tài liệu buổi học)
    async uploadSlotMaterial(slotId, formData) {
        const response = await api.post(`/lecturer/slots/${slotId}/materials`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            schoolScoped: true,
        });
        return response.data;
    },

    // DELETE /api/lecturer/materials/:materialId (Xóa tài liệu buổi học)
    async deleteSlotMaterial(materialId) {
        const response = await api.delete(`/lecturer/materials/${materialId}`, {
            schoolScoped: true,
        });
        return response.data;
    },
};

export default ClassMaterialService;