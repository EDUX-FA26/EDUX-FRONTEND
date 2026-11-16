
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    ArrowLeft,
    FolderKanban,
    Users,
    CheckCircle2,
    Clock3,
    RefreshCw,
    AlertCircle,
    LoaderCircle,
    ChevronRight,
} from "lucide-react";

import { ProjectsService } from "../../services/projects.service";
import TaskModal from '../../components/student/kanban/TaskModal';
import "../../components/student/ProjectWorkspace.css";
import "../../components/student/kanban/ProjectKanban.css";
import MemberPerformance from '../../components/lecturer/projects/MemberPerformance';

// ==========================================
// CONSTANTS
// ==========================================

const COLUMNS = [
    {
        id: "todo",
        title: "TO DO",
        color: "slate",
    },
    {
        id: "in_progress",
        title: "IN PROGRESS",
        color: "blue",
    },
    {
        id: "in_review",
        title: "IN REVIEW",
        color: "amber",
    },
    {
        id: "done",
        title: "DONE",
        color: "green",
    },
];

function getError(error) {
    return (
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra."
    );
}

function formatDate(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toLocaleDateString("vi-VN");
}

// ==========================================
// LECTURER PROJECTS PAGE
// ==========================================

export default function LecturerProjectsPage() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [selectedTask, setSelectedTask] = useState(null);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] =
        useState(null);

    const [tasks, setTasks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] =
        useState(false);

    const [error, setError] = useState("");

    // ======================================
    // LOAD PROJECT LIST
    // ======================================

    const loadProjects = useCallback(async () => {
        if (!classId) return;

        setLoading(true);
        setError("");

        try {
            const response =
                await ProjectsService.getClassProjects(
                    classId
                );

            setProjects(
                Array.isArray(response?.data)
                    ? response.data
                    : []
            );
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        setSelectedProject(null);
        setTasks([]);
        loadProjects();
    }, [loadProjects]);

    // ======================================
    // OPEN PROJECT
    // ======================================

    const openProject = async projectId => {
        setSelectedTask(null);
        setDetailLoading(true);
        setError("");

        try {
            const [
                projectResponse,
                tasksResponse,
            ] = await Promise.all([
                ProjectsService.getProject(projectId),
                ProjectsService.getTasks(projectId),
            ]);

            const project = projectResponse?.data;

            if (
                !project ||
                project.class_id !== classId
            ) {
                throw new Error(
                    "Project không thuộc lớp đang xem."
                );
            }

            setSelectedProject(project);

            setTasks(
                Array.isArray(tasksResponse?.data)
                    ? tasksResponse.data
                    : []
            );

        } catch (err) {
            setError(getError(err));
        } finally {
            setDetailLoading(false);
        }
    };

    // ======================================
    // STATISTICS
    // ======================================

    const stats = useMemo(() => {
        const total = tasks.length;

        const completed = tasks.filter(
            task => task.status === "done"
        ).length;

        const overdue = tasks.filter(task => {
            return (
                task.status !== "done" &&
                task.due_date &&
                new Date(task.due_date) < new Date()
            );
        }).length;

        return {
            total,
            completed,
            overdue,
            progress: total
                ? Math.round(
                    (completed / total) * 100
                )
                : 0,
        };
    }, [tasks]);

    // ======================================
    // RENDER
    // ======================================

    return (
        <main className="edux-projects-page">

            {/* BREADCRUMB */}

            <nav className="edux-projects-breadcrumb">
                <button
                    type="button"
                    onClick={() =>
                        navigate("/lecturer/classes")
                    }
                >
                    Lớp giảng dạy
                </button>

                <ChevronRight size={14} />

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            `/lecturer/classes/${classId}`
                        )
                    }
                >
                    Chi tiết lớp
                </button>

                <ChevronRight size={14} />

                <span>Projects</span>
            </nav>

            <button
                className="edux-projects-back"
                onClick={() =>
                    navigate(
                        `/lecturer/classes/${classId}`
                    )
                }
            >
                <ArrowLeft size={16} />
                Quay lại lớp học
            </button>

            <div className="pw-root">

                {/* HEADER */}

                <section className="pw-panel">
                    <div className="pw-section-heading">
                        <div>
                            <span className="pw-section-kicker">
                                LECTURER WORKSPACE
                            </span>

                            <h2>
                                Quản lý dự án sinh viên
                            </h2>

                            <p>
                                Theo dõi tiến độ các nhóm
                                dự án trong lớp học.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="pw-btn pw-btn--outline"
                            onClick={loadProjects}
                            disabled={loading}
                        >
                            <RefreshCw size={16} />
                            Làm mới
                        </button>
                    </div>
                </section>

                {/* ERROR */}

                {error && (
                    <div className="pw-alert pw-alert--error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* LOADING */}

                {loading && (
                    <div className="pw-empty">
                        <LoaderCircle
                            size={26}
                            className="pw-spin"
                        />
                        <p>Đang tải danh sách Project...</p>
                    </div>
                )}

                {/* PROJECT LIST */}

                {!loading && !selectedProject && (
                    <section className="pw-section">

                        <div className="pw-section-heading">
                            <div>
                                <h2>
                                    Các nhóm dự án
                                </h2>

                                <p>
                                    {projects.length} Project
                                    trong lớp học này.
                                </p>
                            </div>
                        </div>

                        {projects.length === 0 ? (
                            <div className="pw-empty">
                                <FolderKanban size={38} />

                                <h3>
                                    Chưa có Project
                                </h3>

                                <p>
                                    Sinh viên chưa tạo
                                    dự án trong lớp này.
                                </p>
                            </div>
                        ) : (
                            <div className="pw-project-grid">
                                {projects.map(project => (
                                    <article
                                        className="pw-project-card"
                                        key={project.id}
                                    >
                                        <div className="pw-project-card__top">
                                            <span className="pw-project-card__icon">
                                                <FolderKanban
                                                    size={23}
                                                />
                                            </span>

                                            <span className="pw-status">
                                                {project.status}
                                            </span>
                                        </div>

                                        <h3>
                                            {project.name}
                                        </h3>

                                        <p>
                                            {project.description ||
                                                "Chưa có mô tả."}
                                        </p>

                                        <div className="pw-project-card__meta">
                                            Trưởng nhóm:{" "}
                                            {project.owner_name ||
                                                "Chưa có thông tin"}
                                        </div>

                                        <div className="pw-project-card__bottom">
                                            <button
                                                type="button"
                                                className="pw-project-card__open"
                                                disabled={detailLoading}
                                                onClick={() =>
                                                    openProject(
                                                        project.id
                                                    )
                                                }
                                            >
                                                Xem chi tiết
                                                <ChevronRight
                                                    size={16}
                                                />
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* PROJECT DETAIL */}

                {!loading && selectedProject && (
                    <section className="pw-panel pw-detail">

                        <button
                            type="button"
                            className="pw-text-back"
                            onClick={() => {
                                setSelectedTask(null);
                                setSelectedProject(null);
                                setTasks([]);
                            }}
                        >
                            <ArrowLeft size={16} />
                            Tất cả Project
                        </button>

                        <div className="pw-section-heading">
                            <div>
                                <span className="pw-section-kicker">
                                    PROJECT OVERVIEW
                                </span>

                                <h2>
                                    {selectedProject.name}
                                </h2>

                                <p>
                                    {selectedProject.description ||
                                        "Chưa có mô tả."}
                                </p>
                            </div>
                        </div>

                        {/* STATS */}

                        <div className="pw-stats">
                            <div className="pw-stat">
                                <FolderKanban size={20} />
                                <div>
                                    <strong>
                                        {stats.total}
                                    </strong>
                                    <span>Tổng Task</span>
                                </div>
                            </div>

                            <div className="pw-stat">
                                <CheckCircle2 size={20} />
                                <div>
                                    <strong>
                                        {stats.completed}
                                    </strong>
                                    <span>Đã hoàn thành</span>
                                </div>
                            </div>

                            <div className="pw-stat">
                                <Clock3 size={20} />
                                <div>
                                    <strong>
                                        {stats.overdue}
                                    </strong>
                                    <span>Quá hạn</span>
                                </div>
                            </div>
                        </div>

                        {/* PROGRESS */}

                        <div className="pk-progress">
                            <div className="pk-progress__top">
                                <div>
                                    <strong>
                                        Tiến độ Project
                                    </strong>

                                    <span>
                                        {stats.completed}/
                                        {stats.total} Task
                                    </span>
                                </div>

                                <strong className="pk-progress__percent">
                                    {stats.progress}%
                                </strong>
                            </div>

                            <div className="pk-progress__track">
                                <div
                                    className="pk-progress__fill"
                                    style={{
                                        width:
                                            `${stats.progress}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* MEMBERS */}

                        <div className="pw-section-heading">
                            <div>
                                <h3>
                                    <Users size={17} />
                                    Thành viên nhóm
                                </h3>
                            </div>
                        </div>

                        <div className="pw-member-list">
                            {(selectedProject.members || [])
                                .map(member => (
                                    <div
                                        className="pw-member"
                                        key={member.user_id}
                                    >
                                        <div>
                                            <strong>
                                                {member.full_name ||
                                                    member.student_code}
                                            </strong>

                                            <span>
                                                {member.role === "owner"
                                                    ? "Trưởng nhóm"
                                                    : "Thành viên"}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* MEMBER PERFORMANCE */}

                        <MemberPerformance
                            members={selectedProject.members || []}
                            tasks={tasks}
                        />

                        {/* READ ONLY KANBAN */}

                        <div className="pk-root">
                            <header className="pk-header">
                                <div className="pk-header__info">
                                    <span className="pk-eyebrow">
                                        READ ONLY BOARD
                                    </span>

                                    <h2>Kanban Board</h2>

                                    <p>
                                        Theo dõi trạng thái
                                        công việc của nhóm.
                                    </p>
                                </div>
                            </header>

                            <div className="pk-board">
                                {COLUMNS.map(column => {
                                    const columnTasks = tasks
                                        .filter(
                                            task =>
                                                task.status ===
                                                column.id &&
                                                !task.parent_task_id
                                        )
                                        .sort(
                                            (a, b) =>
                                                Number(a.position) -
                                                Number(b.position)
                                        );

                                    return (
                                        <div
                                            key={column.id}
                                            className={
                                                `pk-column pk-column--${column.color}`
                                            }
                                        >
                                            <div className="pk-column__header">
                                                <div className="pk-column__title">
                                                    <span className="pk-column__dot" />

                                                    <strong>
                                                        {column.title}
                                                    </strong>
                                                </div>

                                                <span className="pk-column__count">
                                                    {columnTasks.length}
                                                </span>
                                            </div>

                                            <div className="pk-column__body">
                                                {columnTasks.map(task => (
                                                    <article
                                                        key={task.id}
                                                        className="pk-task"
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => setSelectedTask(task)}
                                                        onKeyDown={event => {
                                                            if (
                                                                event.key === "Enter" ||
                                                                event.key === " "
                                                            ) {
                                                                event.preventDefault();
                                                                setSelectedTask(task);
                                                            }
                                                        }}
                                                        style={{
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        <div className="pk-task__top">
                                                            <span className="pk-task__key">
                                                                TASK-
                                                                {task.task_number}
                                                            </span>
                                                        </div>

                                                        <h3>
                                                            {task.title}
                                                        </h3>

                                                        <div className="pk-task__labels">
                                                            <span className="pk-task__type">
                                                                {task.type}
                                                            </span>

                                                            <span
                                                                className={
                                                                    `pk-priority pk-priority--${task.priority}`
                                                                }
                                                            >
                                                                {task.priority}
                                                            </span>
                                                        </div>

                                                        <div className="pk-task__footer">
                                                            <span className="pk-task__assignee">
                                                                {task.assignee_name ||
                                                                    "Chưa giao"}
                                                            </span>

                                                            {task.due_date && (
                                                                <span className="pk-task__due">
                                                                    {formatDate(
                                                                        task.due_date
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </article>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ======================================
    LECTURER TASK DETAIL — READ ONLY
====================================== */}

                        {selectedTask && selectedProject && (
                            <TaskModal
                                key={selectedTask.id}
                                task={selectedTask}
                                tasks={tasks}
                                projectId={selectedProject.id}
                                members={selectedProject.members || []}
                                isOwner={false}
                                currentUserId={null}
                                readOnly={true}
                                onClose={() => {
                                    setSelectedTask(null);
                                }}
                                onOpenTask={task => {
                                    setSelectedTask(task);
                                }}
                            />
                        )}

                    </section>
                )}

            </div>
        </main>
    );
}
