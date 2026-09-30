import api from '../config/axios.config.js';

const GradingService = {
    async createGrade(payload) {
        const response = await api.post('/grades', payload);
        return response.data;
    },

    async updateGrade(gradeId, payload) {
        const response = await api.patch(`/grades/${gradeId}`, payload);
        return response.data;
    },

    async getGrade(gradeId) {
        const response = await api.get(`/grades/${gradeId}`);
        return response.data;
    },

    async getGradebook(classId) {
        const response = await api.get(`/gradebooks/${classId}`);
        return response.data;
    },

    async exportGradebook(classId, format = 'xlsx') {
        const response = await api.get(`/gradebooks/${classId}/export`, {
            params: { format },
            responseType: 'blob', // Rất quan trọng để tải file
        });

        // Xử lý tạo link ảo và tự động click để tải file về máy
        const blob = new Blob([response.data], {
            type: response.headers['content-type'],
        });
        
        // Lấy tên file động từ backend trả về (nếu có), hoặc dùng tên mặc định
        let fileName = `Gradebook_${classId}.${format}`; 
        const disposition = response.headers['content-disposition'];
        if (disposition && disposition.includes('filename=')) {
            const matches = /filename="([^"]+)"/.exec(disposition);
            if (matches && matches[1]) {
                fileName = matches[1];
            }
        }

        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();

        // Dọn dẹp DOM
        link.remove();
        window.URL.revokeObjectURL(url);

        return response.data;
    },
};

export default GradingService;