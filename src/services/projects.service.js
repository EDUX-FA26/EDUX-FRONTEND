
import api from '../config/axios.config';

export const ProjectsService = {
    async createProject(payload) {
        const { data } = await api.post('/projects', payload, {
            schoolScoped: true,
        });
        return data;
    },

    async getMyProjects() {
        const { data } = await api.get('/projects/my', {
            schoolScoped: true,
        });
        return data;
    },

    async getClassProjects(classId) {
        const { data } = await api.get(`/projects/class/${classId}`, {
            schoolScoped: true,
        });
        return data;
    },

    async getProject(projectId) {
        const { data } = await api.get(`/projects/${projectId}`, {
            schoolScoped: true,
        });
        return data;
    },

    async getMyInvitations() {
        const { data } = await api.get('/projects/invitations/my', {
            schoolScoped: true,
        });
        return data;
    },

    async inviteMember(projectId, studentId) {
        const { data } = await api.post(
            `/projects/${projectId}/invitations`,
            { studentId },
            { schoolScoped: true }
        );
        return data;
    },

    async acceptInvitation(invitationId) {
        const { data } = await api.post(
            `/projects/invitations/${invitationId}/accept`,
            {},
            { schoolScoped: true }
        );
        return data;
    },

    async rejectInvitation(invitationId) {
        const { data } = await api.post(
            `/projects/invitations/${invitationId}/reject`,
            {},
            { schoolScoped: true }
        );
        return data;
    },

    async getProjectInvitations(projectId) {
        const { data } = await api.get(
            `/projects/${projectId}/invitations`,
            { schoolScoped: true }
        );
        return data;
    },


    // ==========================================
    // TASK MANAGEMENT
    // ==========================================

    // GET /api/projects/:projectId/tasks
    async getTasks(projectId) {
        const { data } = await api.get(
            `/projects/${projectId}/tasks`,
            { schoolScoped: true }
        );

        return data;
    },

    // GET /api/projects/:projectId/tasks/:taskId
    async getTask(projectId, taskId) {
        const { data } = await api.get(
            `/projects/${projectId}/tasks/${taskId}`,
            { schoolScoped: true }
        );

        return data;
    },

    // POST /api/projects/:projectId/tasks
    async createTask(projectId, payload) {
        const { data } = await api.post(
            `/projects/${projectId}/tasks`,
            payload,
            { schoolScoped: true }
        );

        return data;
    },

    // PATCH /api/projects/:projectId/tasks/:taskId
    async updateTask(projectId, taskId, payload) {
        const { data } = await api.patch(
            `/projects/${projectId}/tasks/${taskId}`,
            payload,
            { schoolScoped: true }
        );

        return data;
    },

    // PATCH /api/projects/:projectId/tasks/:taskId/assignee
    async assignTask(projectId, taskId, assigneeId) {
        const { data } = await api.patch(
            `/projects/${projectId}/tasks/${taskId}/assignee`,
            { assigneeId },
            { schoolScoped: true }
        );

        return data;
    },

    // PATCH /api/projects/:projectId/tasks/:taskId/status
    async updateTaskStatus(projectId, taskId, status) {
        const { data } = await api.patch(
            `/projects/${projectId}/tasks/${taskId}/status`,
            { status },
            { schoolScoped: true }
        );

        return data;
    },

    // PATCH /api/projects/:projectId/tasks/reorder
    async reorderTasks(projectId, status, taskIds) {
        const { data } = await api.patch(
            `/projects/${projectId}/tasks/reorder`,
            {
                status,
                taskIds,
            },
            { schoolScoped: true }
        );

        return data;
    },

    // ==========================================
    // KANBAN ATOMIC MOVE
    // ==========================================

    async moveTask(
        projectId,
        taskId,
        status,
        targetIndex
    ) {
        const { data } = await api.patch(
            `/projects/${projectId}/tasks/${taskId}/move`,
            {
                status,
                targetIndex,
            },
            {
                schoolScoped: true,
            }
        );

        return data;
    },

    // DELETE /api/projects/:projectId/tasks/:taskId
    async deleteTask(projectId, taskId) {
        const { data } = await api.delete(
            `/projects/${projectId}/tasks/${taskId}`,
            { schoolScoped: true }
        );

        return data;
    },

};
