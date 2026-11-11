
import api from '../config/axios.config';

export const ProjectsService = {
    async createProject(payload) {
        const { data } = await api.post('/projects', payload);
        return data;
    },

    async getMyProjects() {
        const { data } = await api.get('/projects/my');
        return data;
    },

    async getClassProjects(classId) {
        const { data } = await api.get(
            `/projects/class/${classId}`
        );
        return data;
    },

    async getProject(projectId) {
        const { data } = await api.get(
            `/projects/${projectId}`
        );
        return data;
    },

    async getMyInvitations() {
        const { data } = await api.get(
            '/projects/invitations/my'
        );
        return data;
    },

    async inviteMember(projectId, studentId) {
        const { data } = await api.post(
            `/projects/${projectId}/invitations`,
            { studentId }
        );
        return data;
    },

    async acceptInvitation(invitationId) {
        const { data } = await api.post(
            `/projects/invitations/${invitationId}/accept`
        );
        return data;
    },

    async rejectInvitation(invitationId) {
        const { data } = await api.post(
            `/projects/invitations/${invitationId}/reject`
        );
        return data;
    },
    async getProjectInvitations(projectId) {
        const { data } = await api.get(
            `/projects/${projectId}/invitations`
        );
        return data;
    },
};
