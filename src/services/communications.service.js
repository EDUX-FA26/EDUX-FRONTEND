import api from '../config/axios.config';

export const CommunicationsService = {
  /**
   * UC 97: POST /api/communications/assignment-deadline
   */
  async sendAssignmentDeadline(payload) {
    const { data } = await api.post('/communications/assignment-deadline', payload, {
      schoolScoped: true,
    });
    return data;
  },

  /**
   * UC 98: POST /api/communications/submission-confirmation
   */
  async sendSubmissionConfirmation(payload) {
    const { data } = await api.post('/communications/submission-confirmation', payload, {
      schoolScoped: true,
    });
    return data;
  },
};

export default CommunicationsService;
