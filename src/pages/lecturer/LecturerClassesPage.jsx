
import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ClassService from "../../services/class.service";
import { getSemesters } from "../../services/semester.service";
import { useAuth } from "../../contexts/AuthContext";
import {
    Search,
    RotateCw,
    FolderOpen,
    ArrowRight,
    AlertCircle,
} from "lucide-react";

const SEMESTER_PAGE_LIMIT = 100;

function getSemesterGroup(semester) {
    const text = `${semester.code || ""} ${semester.name || ""}`.toLowerCase();

    if (text.includes("summer") || text.includes("hè")) {
        return "Summer";
    }

    if (text.includes("spring") || text.includes("xuân")) {
        return "Spring";
    }

    if (text.includes("fall") || text.includes("autumn") || text.includes("thu")) {
        return "Fall";
    }

    return "Other";
}

function getSemesterLabel(semester) {
    return semester.name || semester.code;
}

function getErrorMessage(error, fallback) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        fallback
    );
}

export default function LecturerClassesPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [semesters, setSemesters] = useState([]);
    const [semestersLoading, setSemestersLoading] = useState(true);
    const [semesterError, setSemesterError] = useState(null);

    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [search, setSearch] = useState("");

    const activeSemester = searchParams.get("semester");

    // Load semesters from backend, including all pages.
    const fetchSemesters = useCallback(async (signal) => {
        setSemestersLoading(true);
        setSemesterError(null);

        try {
            const allSemesters = [];
            let page = 1;

            while (true) {
                const response = await getSemesters({ page, limit: SEMESTER_PAGE_LIMIT });
                if (signal?.aborted) return;
                if (response?.success === false) {
                    throw new Error(response.message || "Failed to load semesters");
                }
                if (!Array.isArray(response?.data)) {
                    throw new Error("Invalid semesters API response");
                }

                const items = response.data;
                allSemesters.push(...items);
                const total = Number(response?.pagination?.total ?? response?.total);
                if (items.length < SEMESTER_PAGE_LIMIT ||
                    (Number.isFinite(total) && allSemesters.length >= total)) {
                    break;
                }
                page += 1;
            }

            if (!signal?.aborted) setSemesters(allSemesters);
        } catch (err) {
            if (signal?.aborted) return;
            setSemesters([]);
            setSemesterError(getErrorMessage(err, "Không thể tải danh sách học kỳ."));
        } finally {
            if (!signal?.aborted) setSemestersLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchSemesters(controller.signal);
        return () => controller.abort();
    }, [fetchSemesters]);

    // Select the current semester by default, but respect a valid URL selection.
    useEffect(() => {
        if (semestersLoading || semesterError) return;

        if (semesters.length === 0) {
            if (activeSemester) setSearchParams({}, { replace: true });
            return;
        }

        if (semesters.some(semester => semester.code === activeSemester)) return;

        const selected =
            semesters.find(semester => semester.is_current === true) ||
            semesters.find(semester => semester.is_active === true) ||
            semesters[0];

        setSearchParams({ semester: selected.code }, { replace: true });
    }, [semesters, semestersLoading, semesterError, activeSemester, setSearchParams]);

    const fetchClasses = useCallback(async (signal) => {
        if (!user?.id || !activeSemester || semestersLoading || semesterError ||
            !semesters.some(semester => semester.code === activeSemester)) {
            setClasses([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setClasses([]);

        try {
            const response = await ClassService.getLecturerClasses(
                user.id,
                { semester: activeSemester }
            );

            if (signal?.aborted) return;
            if (response?.success === false) {
                throw new Error(response.message || "Failed to load classes");
            }

            const payload = response?.data ?? response;
            if (!Array.isArray(payload) && !Array.isArray(payload?.data)) {
                throw new Error("Invalid lecturer classes API response");
            }

            const parsedClasses = Array.isArray(payload) ? payload : payload.data;
            setClasses(parsedClasses);
        } catch (err) {
            if (signal?.aborted) return;
            setClasses([]);
            setError(getErrorMessage(err, "Không thể tải danh sách lớp học."));
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [user?.id, activeSemester, semestersLoading, semesterError, semesters]);

    useEffect(() => {
        const controller = new AbortController();
        fetchClasses(controller.signal);
        return () => controller.abort();
    }, [fetchClasses]);

    const handleSemesterChange = (semesterCode) => {
        setSearchParams({ semester: semesterCode });
    };

    const handleRefresh = async () => {
        await Promise.all([fetchSemesters(), fetchClasses()]);
    };

const groupedSemesters = useMemo(() => {
    return semesters.reduce((groups, semester) => {
        const group = getSemesterGroup(semester);

        if (!groups[group]) {
            groups[group] = [];
        }

        groups[group].push(semester);

        return groups;
    }, {});
}, [semesters]);

const filteredClasses = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return classes;

    return classes.filter((course) => {
        return [
            course.subject_code,
            course.subject_name,
            course.name,
            course.class_code,
            course.class_name,
            course.lecturer_name,
        ]
            .filter(Boolean)
            .some((value) =>
                String(value).toLowerCase().includes(keyword)
            );
    });
}, [classes, search]);

return (
    <div
        className="animate-fade-in w-full px-0"
        style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
        }}
    >
        {/* Header */}
        <div
            style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                marginTop: "8px",
            }}
        >
            <div>
                <p
                    style={{
                        fontSize: "12px",
                        color: "var(--color-ink-muted)",
                        marginBottom: "4px",
                    }}
                >
                    Welcome back, Lecturer
                </p>

                <h1
                    style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: "var(--color-ink)",
                        margin: 0,
                    }}
                >
                    My Courses
                </h1>
            </div>

        </div>

        <div
            style={{
                display: "flex",
                gap: "24px",
                alignItems: "flex-start",
                flexWrap: "wrap",
            }}
        >
            {/* Semester Sidebar */}
            <div
                className="card"
                style={{
                    width: "180px",
                    padding: "16px",
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid var(--color-border)",
                        paddingBottom: "8px",
                    }}
                >
                    <span
                        style={{
                            fontWeight: "600",
                            fontSize: "14px",
                            color: "var(--color-ink)",
                        }}
                    >
                        Semesters
                    </span>

                    <span className="badge badge-teal">
                        {semesters.length}
                    </span>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    {semestersLoading ? (
                        <div className="skeleton" style={{ height: 120 }} />
                    ) : semesterError ? (
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#dc2626",
                            }}
                        >
                            {semesterError}
                        </div>
                    ) : semesters.length === 0 ? (
                        <p
                            style={{
                                fontSize: "12px",
                                color: "var(--color-ink-muted)",
                            }}
                        >
                            Chưa có học kỳ nào.
                        </p>
                    ) : (
                        Object.entries(groupedSemesters).map(
                            ([groupName, items]) => (
                                <div key={groupName}>
                                    <div
                                        style={{
                                            fontSize: "10px",
                                            color: "var(--color-ink-soft)",
                                            fontWeight: "bold",
                                            textTransform: "uppercase",
                                            letterSpacing: "1px",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        {groupName}
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "6px",
                                        }}
                                    >
                                        {items.map((semester) => {
                                            const selected =
                                                activeSemester === semester.code;

                                            return (
                                                <button
                                                    key={semester.id}
                                                    type="button"
                                                    onClick={() =>
                                                        handleSemesterChange(semester.code)
                                                    }
                                                    style={{
                                                        border: "none",
                                                        textAlign: "left",
                                                        padding: "8px 12px",
                                                        borderRadius: "var(--radius-sm)",
                                                        cursor: "pointer",
                                                        fontWeight: selected ? "600" : "500",
                                                        fontSize: "13px",
                                                        transition: "0.2s",
                                                        backgroundColor: selected
                                                            ? "var(--color-primary)"
                                                            : "transparent",
                                                        color: selected
                                                            ? "#fff"
                                                            : "var(--color-ink)",
                                                    }}
                                                >
                                                    <div>{getSemesterLabel(semester)}</div>

                                                    {semester.is_current && (
                                                        <div
                                                            style={{
                                                                fontSize: "10px",
                                                                opacity: 0.8,
                                                                marginTop: "3px",
                                                            }}
                                                        >
                                                            Current
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        )
                    )}
                </div>
            </div>

            {/* Classes */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Search + Refresh Toolbar — separate from class cards grid */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "12px",
                        marginBottom: "20px",
                        width: "100%",
                        minWidth: 0,
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            flex: "0 1 280px",
                            minWidth: 0,
                        }}
                    >
                        <Search
                            size={16}
                            style={{
                                position: "absolute",
                                left: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--color-ink-soft)",
                                pointerEvents: "none",
                            }}
                        />
                        <input
                            type="text"
                            className="input"
                            placeholder="Search courses..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: "100%",
                                height: "40px",
                                paddingLeft: "36px",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleRefresh}
                        disabled={loading || semestersLoading}
                        style={{
                            height: "40px",
                            padding: "0 16px",
                            fontSize: "13px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                        }}
                    >
                        <RotateCw size={16} />
                        <span>Refresh</span>
                    </button>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
                        gap: "20px",
                    }}
                >
                    {loading || semestersLoading ? (
                        <>
                            <div
                                className="skeleton"
                                style={{ height: "200px" }}
                            />
                            <div
                                className="skeleton"
                                style={{ height: "200px" }}
                            />
                            <div
                                className="skeleton"
                                style={{ height: "200px" }}
                            />
                        </>
                    ) : error || semesterError ? (
                        <div
                            style={{
                                gridColumn: "1 / -1",
                                padding: "16px",
                                backgroundColor: "#fee2e2",
                                color: "#dc2626",
                                borderRadius: "var(--radius-md)",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <AlertCircle size={20} />
                            <span>{semesterError || error}</span>
                        </div>
                    ) : filteredClasses.length === 0 ? (
                        <div
                            className="card"
                            style={{
                                gridColumn: "1 / -1",
                                padding: "48px 12px",
                                textAlign: "center",
                                color: "var(--color-ink-muted)",
                            }}
                        >
                            <FolderOpen
                                size={48}
                                style={{
                                    margin: "0 auto 12px",
                                    opacity: 0.2,
                                }}
                            />

                            <p
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "500",
                                }}
                            >
                                {search
                                    ? "Không tìm thấy lớp học phù hợp."
                                    : "Không tìm thấy lớp học nào trong học kỳ này."}
                            </p>
                        </div>
                    ) : (
                        filteredClasses.map((course) => (
                            <div
                                className="card"
                                key={course.id || course._id}
                                style={{
                                    padding: "20px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: "4px 10px",
                                            borderRadius: "var(--radius-sm)",
                                            backgroundColor: "var(--color-primary-bg)",
                                            color: "var(--color-primary-dark)",
                                            fontWeight: "bold",
                                            fontSize: "12px",
                                        }}
                                    >
                                        {course.subject_code || "CODE"}
                                    </div>
                                </div>

                                <div>
                                    <h3
                                        style={{
                                            fontSize: "16px",
                                            fontWeight: "bold",
                                            margin: "4px 0",
                                            color: "var(--color-ink)",
                                            lineHeight: "1.4",
                                        }}
                                    >
                                        {course.subject_name || course.name}
                                    </h3>

                                    <p
                                        style={{
                                            fontSize: "12px",
                                            color: "var(--color-ink-muted)",
                                        }}
                                    >
                                        Class:{" "}
                                        <strong>
                                            {course.class_code ||
                                                course.class_name ||
                                                "N/A"}
                                        </strong>
                                        {" | "}
                                        GV:{" "}
                                        <strong>
                                            {course.lecturer_name || "Chưa cập nhật"}
                                        </strong>
                                    </p>
                                </div>

                                <div
                                    onClick={() =>
                                        navigate(
                                            `/lecturer/classes/${course.id || course._id}`
                                        )
                                    }
                                    style={{
                                        marginTop: "auto",
                                        paddingTop: "16px",
                                        borderTop: "1px solid var(--color-border)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        color: "var(--color-ink-muted)",
                                        cursor: "pointer",
                                    }}
                                >
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <FolderOpen size={16} />
                                        Vào lớp học
                                    </span>

                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
);
}
