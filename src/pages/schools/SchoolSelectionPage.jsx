
import React, { useState } from "react";
import { Navigate } from "react-router-dom";

import {
  useAuth,
} from "../../contexts/AuthContext";

import {
  useSchool,
} from "../../contexts/SchoolContext";

export default function SchoolSelectionPage() {
  const {
    isAuthenticated,
    logout,
  } = useAuth();

  const {
    schools,
    currentSchool,
    status,
    error,
    selectSchool,
    refreshSchools,
  } = useSchool();

  const [selectError, setSelectError] =
    useState(null);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    status === "loading" ||
    status === "idle"
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">
          Đang tải danh sách trường học...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border p-6 text-center">
          <h2 className="mb-3 text-xl font-bold">
            Không thể tải trường học
          </h2>

          <p className="mb-5 text-sm text-red-500">
            {error}
          </p>

          <button
            onClick={refreshSchools}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (status === "no_school") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border p-6 text-center">
          <h2 className="text-xl font-bold">
            Chưa được phân vào trường học
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            Tài khoản của bạn chưa có School Membership
            đang hoạt động.
          </p>

          <button
            onClick={async () => {
              await logout();
              window.location.replace("/login");
            }}
            className="mt-6 rounded-lg border px-5 py-2"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  // A single school is selected automatically.
  if (status === "ready" && schools.length === 1) {
    return <Navigate to="/" replace />;
  }

  async function handleSelect(schoolId) {
    setSelectError(null);

    try {
      const success = await selectSchool(schoolId);

      if (success) {
        // Full reload clears stale UI, socket connections,
        // component state and in-memory data caches.
        window.location.replace("/");
      }
    } catch (err) {
      setSelectError(
        err.response?.data?.message ||
        err.message ||
        "Không thể chọn trường."
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Chọn trường học
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Chọn trường bạn muốn làm việc trong EDUX.
        </p>

        {(selectError || error) && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {selectError || error}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {schools.map((school) => (
            <button
              key={school.id}
              type="button"
              onClick={() => handleSelect(school.id)}
              className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <div className="font-semibold text-slate-900 dark:text-white">
                {school.name}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {school.code}
              </div>

              <div className="mt-2 text-sm text-blue-600">
                Vai trò: {school.role}
              </div>

              {currentSchool?.schoolId === school.id && (
                <div className="mt-2 text-xs text-green-600">
                  Trường đang chọn
                </div>
              )}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
