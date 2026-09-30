import api from '../config/axios.config';

const SubmissionService = {
    async submitAssignment(assignmentId, file, note) {
        const formData = new FormData();
        if (file) formData.append('files', file);
        if (note) formData.append('note', note);
        // Assuming link is passed as note or not fully supported yet in DB, we'll put link in note for now

        const response = await api.post(`/submissions/${assignmentId}/files`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    async getMySubmissions() {
        const response = await api.get('/submissions/my-submissions');
        return response.data;
    },

    // Thêm hàm này vào trong block SubmissionService
    async getSubmissionsByAssignment(assignmentId) {
        // Thay đổi đường dẫn '/submissions/assignment/...' theo đúng router backend của bạn
        const response = await api.get(`/submissions/assignments/${assignmentId}`);
        return response.data;
    }
};

export default SubmissionService;