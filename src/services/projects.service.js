
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
};
