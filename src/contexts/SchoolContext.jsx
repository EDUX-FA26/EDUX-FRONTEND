
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "./AuthContext";

import {
  getMySchools,
  verifySchoolContext,
} from "../services/schoolApi";

import {
  setActiveSchoolId,
  clearActiveSchoolId,
} from "../services/tenantSession";

const SchoolContext = createContext(null);

export function SchoolProvider({ children }) {
  const {
    user,
    accessToken,
    isAuthenticated,
  } = useAuth();

  const userId =
    user?.id ??
    user?.userId ??
    user?.user_id ??
    null;

  const [schools, setSchools] = useState([]);
  const [currentSchool, setCurrentSchool] =
    useState(null);

  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const requestVersion = useRef(0);

  const storageKey = userId
    ? `edux:selected-school:${userId}`
    : null;

  // =========================================
  // LOAD SCHOOL MEMBERSHIPS
  // =========================================

  useEffect(() => {
    const controller = new AbortController();
    const version = ++requestVersion.current;

    clearActiveSchoolId();

    setSchools([]);
    setCurrentSchool(null);
    setError(null);

    if (!isAuthenticated) {
      setStatus("idle");

      return () => {
        controller.abort();
        requestVersion.current++;
      };
    }

    if (!userId) {
      setStatus("error");
      setError(
        "Không tìm thấy User ID trong phiên đăng nhập."
      );

      return () => {
        controller.abort();
        requestVersion.current++;
      };
    }

    setStatus("loading");

    async function loadSchools() {
      try {
        const result = await getMySchools({
          signal: controller.signal,
        });

        if (
          controller.signal.aborted ||
          version !== requestVersion.current
        ) {
          return;
        }

        const list = Array.isArray(result.schools)
          ? result.schools
          : [];

        setSchools(list);

        const savedId = storageKey
          ? sessionStorage.getItem(storageKey)
          : null;

        let selectedSchool = list.find(
          (school) => school.id === savedId
        );

        // Auto-select only when exactly one school.
        if (!selectedSchool && list.length === 1) {
          selectedSchool = list[0];
        }

        if (!selectedSchool) {
          setStatus(
            list.length === 0
              ? "no_school"
              : "selection_required"
          );

          return;
        }

        const context = await verifySchoolContext(
          selectedSchool.id,
          {
            signal: controller.signal,
          }
        );

        if (
          controller.signal.aborted ||
          version !== requestVersion.current
        ) {
          return;
        }

        const tenant = context.tenant;

        if (
          !tenant ||
          tenant.schoolId !== selectedSchool.id ||
          tenant.userId !== userId
        ) {
          throw new Error(
            "Invalid school context response"
          );
        }

        setActiveSchoolId(tenant.schoolId);
        setCurrentSchool(tenant);

        if (storageKey) {
          sessionStorage.setItem(
            storageKey,
            tenant.schoolId
          );
        }

        setStatus("ready");
      } catch (err) {
        if (
          controller.signal.aborted ||
          version !== requestVersion.current
        ) {
          return;
        }

        if (
          err.response?.status === 403 &&
          storageKey
        ) {
          sessionStorage.removeItem(storageKey);
        }

        clearActiveSchoolId();
        setCurrentSchool(null);

        setError(
          err.response?.data?.message ||
          err.message ||
          "Không thể tải danh sách trường."
        );

        setStatus("error");
      }
    }

    loadSchools();

    return () => {
      controller.abort();
      requestVersion.current++;
      clearActiveSchoolId();
    };
  }, [
    isAuthenticated,
    accessToken,
    userId,
    storageKey,
    reloadKey,
  ]);

  // =========================================
  // SELECT / SWITCH SCHOOL
  // =========================================

  const selectSchool = useCallback(
    async (schoolId) => {
      if (!isAuthenticated || !userId) {
        throw new Error("Authentication required");
      }

      const selected = schools.find(
        (school) => school.id === schoolId
      );

      if (!selected) {
        throw new Error(
          "Trường không nằm trong danh sách được phép."
        );
      }

      const version = ++requestVersion.current;

      clearActiveSchoolId();
      setCurrentSchool(null);
      setStatus("loading");
      setError(null);

      try {
        const result = await verifySchoolContext(
          schoolId
        );

        if (version !== requestVersion.current) {
          return false;
        }

        const tenant = result.tenant;

        if (
          !tenant ||
          tenant.schoolId !== schoolId ||
          tenant.userId !== userId
        ) {
          throw new Error(
            "Invalid school context response"
          );
        }

        if (storageKey) {
          sessionStorage.setItem(
            storageKey,
            schoolId
          );
        }

        setActiveSchoolId(schoolId);
        setCurrentSchool(tenant);
        setStatus("ready");

        return true;
      } catch (err) {
        if (version !== requestVersion.current) {
          return false;
        }

        clearActiveSchoolId();

        setError(
          err.response?.data?.message ||
          err.message
        );

        setStatus("selection_required");

        throw err;
      }
    },
    [
      isAuthenticated,
      userId,
      schools,
      storageKey,
    ]
  );

  const refreshSchools = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  const value = useMemo(
    () => ({
      schools,
      currentSchool,

      schoolId:
        currentSchool?.schoolId ?? null,

      schoolRole:
        currentSchool?.role ?? null,

      status,
      error,

      selectSchool,
      refreshSchools,
    }),
    [
      schools,
      currentSchool,
      status,
      error,
      selectSchool,
      refreshSchools,
    ]
  );

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);

  if (!context) {
    throw new Error(
      "useSchool must be used inside SchoolProvider"
    );
  }

  return context;
}
