
let activeSchoolId = null;

export function setActiveSchoolId(schoolId) {
  activeSchoolId = schoolId;
}

export function getActiveSchoolId() {
  return activeSchoolId;
}

export function clearActiveSchoolId() {
  activeSchoolId = null;
}
