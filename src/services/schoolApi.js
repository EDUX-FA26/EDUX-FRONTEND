
import api from '../config/axios.config';

export async function getMySchools(options = {}) {
  const response = await api.get(
    "/schools/mine",
    options
  );

  return response.data;
}

export async function verifySchoolContext(
  schoolId,
  options = {}
) {
  if (!schoolId) {
    throw new Error("School ID is required");
  }

  const response = await api.get(
    "/schools/context",
    {
      ...options,

      headers: {
        ...(options.headers || {}),
        "X-School-Id": schoolId,
      },
    }
  );

  return response.data;
}

export async function getSchoolSettings() {
  const response = await api.get("/schools/settings", { schoolScoped: true });
  return response.data;
}

export async function completeSchoolSetup(payload) {
  const response = await api.put("/schools/setup", payload, { schoolScoped: true });
  return response.data;
}

export async function updateSchoolSettings(payload) {
  const response = await api.patch("/schools/settings", payload, { schoolScoped: true });
  return response.data;
}
