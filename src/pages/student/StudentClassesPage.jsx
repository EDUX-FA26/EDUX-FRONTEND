
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

function extractSemesterYear(sem) {
    // Ưu tiên trường year nếu có (ví dụ: 2026)
    if (sem?.year) return Number(sem.year);
    // Tìm 4 chữ số năm trong name (ví dụ: "Fall 2026" -> 2026)
    const match4 = String(sem?.name || '').match(/\b(20\d{2})\b/);
    if (match4) return Number(match4[1]);
    // Fallback lấy 2 số cuối từ code (ví dụ: "FA26" -> 2026)
    const match2 = String(sem?.code || '').match(/(\d{2})$/);
    return match2 ? 2000 + Number(match2[1]) : 0;
}

function getErrorMessage(error, fallback) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        fallback
    );
}

export default function StudentClassesPage() {
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
            const response = await ClassService.getStudentClasses(
                user.id,
                { semester: activeSemester }
            );

            if (signal?.aborted) return;
            if (response?.success === false) {
                throw new Error(response.message || "Failed to load classes");
            }

            const payload = response?.data ?? response;
            if (!Array.isArray(payload) && !Array.isArray(payload?.data)) {
                throw new Error("Invalid student classes API response");
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
    const groups = semesters.reduce((acc, semester) => {
        const group = getSemesterGroup(semester);

        if (!acc[group]) {
            acc[group] = [];
        }

        acc[group].push(semester);

        return acc;
    }, {});

    // Sắp xếp các học kỳ trong từng nhóm theo năm giảm dần (từ lớn đến nhỏ)
    Object.keys(groups).forEach((groupName) => {
        groups[groupName].sort((a, b) => extractSemesterYear(b) - extractSemesterYear(a));
    });

    // Thứ tự hiển thị nhóm mùa: Fall -> Summer -> Spring -> Other (nếu có)
    const SEASON_ORDER = ['Fall', 'Summer', 'Spring'];
    const sortedGroups = {};
    SEASON_ORDER.forEach((season) => {
        if (groups[season]) {
            sortedGroups[season] = groups[season];
        }
    });
    Object.keys(groups).forEach((key) => {
        if (!sortedGroups[key]) {
            sortedGroups[key] = groups[key];
        }
    });

    return sortedGroups;
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
    <div className="animate-fade-in h-[calc(100vh-64px)] w-full max-w-full min-w-0 overflow-hidden flex flex-col px-6 pt-5 pb-5 box-border">
        {/* Header: Title + Search & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 shrink-0">
            <div>
                <p
                    style={{
                        fontSize: "12px",
                        color: "var(--color-ink-muted)",
                        marginBottom: "2px",
                    }}
                >
                    Welcome back, Student
                </p>

                <h1
                    style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: "var(--color-ink)",
                        margin: 0,
                        lineHeight: 1.2,
                    }}
                >
                    My Courses
                </h1>
            </div>

            <div className="flex items-center gap-3">
                <div
                    style={{
                        position: "relative",
                        width: "280px",
                        maxWidth: "100%",
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
                    <RotateCw
                        size={16}
                        className={loading || semestersLoading ? "animate-spin" : ""}
                    />
                    <span>Refresh</span>
                </button>
            </div>
        </div>

        {/* Main 2-column area */}
        <div className="flex-1 min-h-0 flex gap-6 w-full overflow-hidden">
            {/* Left Column: Semesters Card */}
            <div
                className="w-60 shrink-0 h-full flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
                style={{
                    background: "var(--color-surface, #fff)",
                    borderColor: "var(--color-border, rgba(226, 232, 240, 0.8))",
                }}
            >
                <div
                    className="px-4 py-3.5 border-b border-slate-100 shrink-0 flex items-center justify-between"
                    style={{
                        borderBottomColor: "var(--color-border, #f1f5f9)",
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
                    className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scroll"
                    style={{ scrollbarWidth: "thin" }}
                >
                    {semestersLoading ? (
                        <div className="space-y-2">
                            <div className="skeleton rounded-lg" style={{ height: "36px" }} />
                            <div className="skeleton rounded-lg" style={{ height: "36px" }} />
                            <div className="skeleton rounded-lg" style={{ height: "36px" }} />
                            <div className="skeleton rounded-lg" style={{ height: "36px" }} />
                        </div>
                    ) : semesterError ? (
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#dc2626",
                                padding: "8px",
                            }}
                        >
                            {semesterError}
                        </div>
                    ) : semesters.length === 0 ? (
                        <p
                            style={{
                                fontSize: "12px",
                                color: "var(--color-ink-muted)",
                                padding: "8px",
                                margin: 0,
                            }}
                        >
                            Chưa có học kỳ nào.
                        </p>
                    ) : (
                        Object.entries(groupedSemesters).map(
                            ([groupName, items]) => (
                                <div key={groupName} className="space-y-1">
                                    <div
                                        style={{
                                            fontSize: "10px",
                                            color: "var(--color-ink-soft)",
                                            fontWeight: "bold",
                                            textTransform: "uppercase",
                                            letterSpacing: "1px",
                                            padding: "4px 8px 2px",
                                        }}
                                    >
                                        {groupName}
                                    </div>

                                    <div className="space-y-1">
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
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors duration-150 flex items-center justify-between border-0 cursor-pointer ${
                                                        selected
                                                            ? "font-semibold"
                                                            : "hover:bg-slate-100 font-medium"
                                                    }`}
                                                    style={{
                                                        backgroundColor: selected
                                                            ? "var(--color-primary)"
                                                            : "transparent",
                                                        color: selected
                                                            ? "#fff"
                                                            : "var(--color-ink)",
                                                    }}
                                                >
                                                    <span className="truncate">
                                                        {getSemesterLabel(semester)}
                                                    </span>

                                                    {semester.is_current && (
                                                        <span
                                                            className="text-[10px] px-1.5 py-0.5 rounded font-normal shrink-0 ml-1.5"
                                                            style={{
                                                                backgroundColor: selected
                                                                    ? "rgba(255,255,255,0.25)"
                                                                    : "var(--color-primary-bg, #eff6ff)",
                                                                color: selected
                                                                    ? "#fff"
                                                                    : "var(--color-primary-dark, #2563eb)",
                                                            }}
                                                        >
                                                            Current
                                                        </span>
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

            {/* Right Column: Course Cards Grid */}
            <div
                className="flex-1 min-w-0 h-full overflow-y-auto pr-1 custom-scroll"
                style={{ scrollbarWidth: "thin" }}
            >
                {loading || semestersLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
                        <div
                            className="skeleton rounded-2xl"
                            style={{ height: "190px" }}
                        />
                        <div
                            className="skeleton rounded-2xl"
                            style={{ height: "190px" }}
                        />
                        <div
                            className="skeleton rounded-2xl"
                            style={{ height: "190px" }}
                        />
                    </div>
                ) : error || semesterError ? (
                    <div
                        style={{
                            padding: "16px",
                            backgroundColor: "#fee2e2",
                            color: "#dc2626",
                            borderRadius: "var(--radius-md)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{semesterError || error}</span>
                    </div>
                ) : filteredClasses.length === 0 ? (
                    <div
                        className="card"
                        style={{
                            padding: "48px 12px",
                            textAlign: "center",
                            color: "var(--color-ink-muted)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
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
                                margin: 0,
                            }}
                        >
                            {search
                                ? "Không tìm thấy lớp học phù hợp."
                                : "Không tìm thấy lớp học nào trong học kỳ này."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
                        {filteredClasses.map((course) => (
                            <div
                                className="card"
                                key={course.id || course._id}
                                style={{
                                    padding: "20px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "14px",
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
                                            margin: 0,
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
                                            `/student/classes/${course.id || course._id}`
                                        )
                                    }
                                    style={{
                                        marginTop: "auto",
                                        paddingTop: "14px",
                                        borderTop: "1px solid var(--color-border)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        fontSize: "13px",
                                        fontWeight: "600",
                                        color: "var(--color-ink-muted)",
                                        cursor: "pointer",
                                        transition: "color 0.15s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "var(--color-primary)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "var(--color-ink-muted)";
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
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
);
}