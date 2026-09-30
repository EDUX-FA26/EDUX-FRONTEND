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

    async getSubmissionById(id, includeHistory = false) {
        const response = await api.get(`/submissions/${id}?include_history=${includeHistory}`);
        return response.data;
    },

    async getSubmissionFile(submissionId, fileId) {
        const response = await api.get(`/submissions/${submissionId}/files/${fileId}`);
        return response.data;
    },

    async getMySubmissions(query = {}) {
        const params = new URLSearchParams(query).toString();
        const url = params ? `/submissions/my-submissions?${params}` : '/submissions/my-submissions';
        const response = await api.get(url);
        return response.data;
    }
};

export default SubmissionService;