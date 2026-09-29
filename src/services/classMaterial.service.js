import api from '../config/axios.config.js';

const ClassMaterialService = {
    // GET /api/classes/:classId/materials (Danh sách tài liệu lớp học)
    async getClassMaterials(classId, params = {}) {
        const response = await api.get(`/classes/${classId}/materials`, { params });
        return response.data;
    },

    // POST /api/classes/:classId/materials (Upload tài liệu - Lecturer/Admin)
    async uploadClassMaterial(classId, formData) {
        const response = await api.post(`/classes/${classId}/materials`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // GET /api/materials/classes/:id (Chi tiết tài liệu)
    async getMaterialById(id) {
        const response = await api.get(`/materials/classes/${id}`);
        return response.data;
    },

    // GET /api/materials/classes/:id/download (Lấy presigned URL để tải xuống)
    async downloadMaterial(id) {
        const response = await api.get(`/materials/classes/${id}/download`);
        return response.data;
    },

    // PATCH /api/materials/classes/:id (Cập nhật metadata - Lecturer/Admin)
    async updateMaterial(id, updateData) {
        const response = await api.patch(`/materials/classes/${id}`, updateData);
        return response.data;
    },

    // DELETE /api/materials/classes/:id (Xóa tài liệu - Lecturer/Admin)
    async deleteMaterial(id) {
        const response = await api.delete(`/materials/classes/${id}`);
        return response.data;
    },
};

export default ClassMaterialService;