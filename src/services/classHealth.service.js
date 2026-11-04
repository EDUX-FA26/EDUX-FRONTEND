
import api from '../config/axios.config';

export const getClassHealthSnapshot = async (classId) => {
  const response = await api.get(
    `/classes/${classId}/health/snapshot`
  );

  return response.data;
};


export const sendClassHealthBulkNotification = async (
  classId,
  payload
) => {
  const response = await api.post(
    `/classes/${classId}/health/notify`,
    payload
  );

  return response.data;
};

