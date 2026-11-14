import api from '../config/axios.config';

const SubmissionService = {
    /**
     * Nộp bài hoặc lưu nháp bài tập (tương thích ngược)
     */
    async submitAssignment(assignmentId, file, note, isDraft = false) {
        if (isDraft) {
            return this.saveDraft(assignmentId, file, note);
        }
        return this.submitFinal(assignmentId, file, note);
    },

    /**
     * 1. Lưu bản nháp bài nộp (Save Draft - legacy)
     */
    async saveDraft(assignmentId, file, note) {
        const formData = new FormData();
        if (file) formData.append('files', file);
        if (note) formData.append('note', note);
        formData.append('is_draft', 'true');

        const response = await api.post(`/submissions/${assignmentId}/draft`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            schoolScoped: true
        });
        return response.data;
    },

    /**
     * 1a. Silent Auto-Save Draft File (Upload ngầm)
     */
    async saveDraftFile(assignmentId, file, onUploadProgress) {
        const formData = new FormData();
        if (file) formData.append('file', file);

        const response = await api.post(`/submissions/${assignmentId}/draft-file`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress,
            schoolScoped: true
        });
        return response.data;
    },

    /**
     * 1b. Xóa file trong bản nháp ngầm
     */
    async removeDraftFile(assignmentId) {
        const response = await api.delete(`/submissions/${assignmentId}/draft-file`, {
            schoolScoped: true
        });
        return response.data;
    },

    /**
     * 1c. Silent Auto-Save Draft Declarations (Debounce text khai báo AI)
     */
    async saveDraftDeclarations(assignmentId, payload = {}) {
        const response = await api.patch(`/submissions/${assignmentId}/draft-declarations`, payload, {
            schoolScoped: true
        });
        return response.data;
    },

    /**
     * 1d. Bổ sung khai báo AI sau khi giảng viên bật AI Audit Log
     */
    async supplementDeclarations(assignmentId, payload = {}) {
        const response = await api.patch(`/submissions/${assignmentId}/supplement-declarations`, payload, {
            schoolScoped: true
        });
        return response.data;
    },

    /**
     * 2. Nộp bài chính thức (Submit Final)
     */
    async submitFinal(assignmentId, file, note) {
        const formData = new FormData();
        if (file) formData.append('files', file);
        if (note) formData.append('note', note);

        const response = await api.post(`/submissions/${assignmentId}/submit-final`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            schoolScoped: true
        });
        return response.data;
    },

    /**
     * Lấy bài nộp của chính sinh viên cho 1 bài tập cụ thể
     */
    async getMySubmissionByAssignment(assignmentId) {
        const response = await api.get(`/submissions/assignments/${assignmentId}/my-submission`, {
            schoolScoped: true
        });
        return response.data;
    },

    async getAssignmentSubmissions(assignmentId, query = {}) { 
        const params = new URLSearchParams(query).toString(); 
        const url = params ? `/submissions/assignments/${assignmentId}?${params}` : `/submissions/assignments/${assignmentId}`; 
        const response = await api.get(url, { schoolScoped: true }); 
        return response.data; 
    },

    async getSubmissionById(id, includeHistory = false) {
        const response = await api.get(`/submissions/${id}?include_history=${includeHistory}`, {
            schoolScoped: true
        });
        return response.data;
    },

    async getSubmissionFile(submissionId, fileId) {
        const response = await api.get(`/submissions/${submissionId}/files/${fileId}`, {
            schoolScoped: true
        });
        return response.data;
    },

    async auditRubric(submissionId, payload = {}) {
        const response = await api.post(`/submissions/${submissionId}/ai-rubric`, payload, {
            schoolScoped: true,
            timeout: 60000 // Tối thiểu 60000ms (60 giây), tránh bị ngắt kết nối giữa chừng
        });
        return response.data;
    },

    /**
     * 3. AI Pre-submission Sanity Check (Chẩn đoán nhanh bài nháp)
     */
    async runSanityCheck(assignmentId, payload = {}) {
        const response = await api.post(`/submissions/${assignmentId}/sanity-check`, payload, {
            schoolScoped: true,
            timeout: 60000 // Tối thiểu 60000ms (60 giây)
        });
        return response.data;
    },

    async getMySubmissions(query = {}) {
        const params = new URLSearchParams(query).toString();
        const url = params ? `/submissions/my-submissions?${params}` : '/submissions/my-submissions';
        const response = await api.get(url, { schoolScoped: true });
        return response.data;
    },
};

export default SubmissionService;
