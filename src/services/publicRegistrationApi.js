import api from "../config/axios.config";

export async function getPublicPlans() {
  const response = await api.get("/public/plans");
  return response.data;
}

export async function createSchoolRegistration(payload) {
  const response = await api.post("/public/registrations", payload);
  return response.data;
}

export async function getSchoolRegistrationStatus(id, trackingToken) {
  const response = await api.get(`/public/registrations/${id}`, {
    headers: { "X-Registration-Token": trackingToken },
  });
  return response.data;
}

function registrationHeaders(trackingToken) {
  return { headers: { "X-Registration-Token": trackingToken } };
}

export async function resendVerificationEmail(id, trackingToken) {
  const response = await api.post(`/public/registrations/${id}/resend-email-verification`, {}, registrationHeaders(trackingToken));
  return response.data;
}

export async function createPayosCheckout(id, trackingToken) {
  const response = await api.post(`/public/registrations/${id}/checkout`, {}, registrationHeaders(trackingToken));
  return response.data;
}

export async function resendActivationEmail(id, trackingToken) {
  const response = await api.post(`/public/registrations/${id}/resend-activation`, {}, registrationHeaders(trackingToken));
  return response.data;
}

export async function verifySchoolEmail(token) {
  const response = await api.post("/public/verify-school-email", { token });
  return response.data;
}

export async function getSchoolAdminActivation(token) {
  const response = await api.get("/public/school-admin-activation", { params: { token } });
  return response.data;
}

export async function completeSchoolAdminActivation(token, password) {
  const response = await api.post("/public/school-admin-activation", { token, password });
  return response.data;
}
