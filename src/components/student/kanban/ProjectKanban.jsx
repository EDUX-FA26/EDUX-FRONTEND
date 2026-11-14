
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    Plus,
    RefreshCw,
    Search,
    CalendarDays,
    UserRound,
    GripVertical,
    AlertCircle,
    CheckCircle2,
    LoaderCircle,
    X,
    Bug,
    BookOpen,
    ListTodo,
    ArrowRight,
} from 'lucide-react';

import { ProjectsService } from '../../../services/projects.service';
import './ProjectKanban.css';
import TaskModal from './TaskModal';
// ==========================================
// CONSTANTS
// ==========================================

const COLUMNS = [
    {
        id: 'todo',
        title: 'TO DO',
        color: 'slate',
    },
    {
        id: 'in_progress',
        title: 'IN PROGRESS',
        color: 'blue',
    },
    {
        id: 'in_review',
        title: 'IN REVIEW',
        color: 'amber',
    },
    {
        id: 'done',
        title: 'DONE',
        color: 'green',
    },
];

const PRIORITIES = {
    low: {
        label: 'Thấp',
        color: 'low',
    },
    medium: {
        label: 'Trung bình',
        color: 'medium',
    },
    high: {
        label: 'Cao',
        color: 'high',
    },
    critical: {
        label: 'Khẩn cấp',
        color: 'critical',
    },
};

const TYPES = {
    task: {
        label: 'Task',
        Icon: ListTodo,
    },
    bug: {
        label: 'Bug',
        Icon: Bug,
    },
    story: {
        label: 'Story',
        Icon: BookOpen,
    },
};

function getError(error) {
    return (
        error?.response?.data?.message ||
        error?.message ||
        'Có lỗi xảy ra. Vui lòng thử lại.'
    );
}

function formatDate(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toLocaleDateString('vi-VN');
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function ProjectKanban({
    projectId,
    members = [],
    isOwner = false,
    currentUserId = null,
}) {
    const [selectedTask, setSelectedTask] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] =
        useState('all');

    const [assigneeFilter, setAssigneeFilter] =
        useState('all');

    const [draggedTaskId, setDraggedTaskId] =
        useState(null);

    const [dragOverColumn, setDragOverColumn] =
        useState(null);

    const [showCreate, setShowCreate] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        assigneeId: '',
        dueDate: '',
    });

    // ======================================
    // LOAD TASKS
    // ======================================

    const loadTasks = useCallback(async () => {
        if (!projectId) return;

        setLoading(true);
        setError('');

        try {
            const response =
                await ProjectsService.getTasks(projectId);

            setTasks(
                Array.isArray(response?.data)
                    ? response.data
                    : []
            );
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        setTasks([]);
        setSearch('');
        setPriorityFilter('all');
        setAssigneeFilter('all');
        setShowCreate(false);
        setError('');
        setNotice('');

        loadTasks();
    }, [loadTasks]);

    // ======================================
    // FILTER TASKS
    // ======================================

    const filteredTasks = useMemo(() => {
        const keyword = search
            .trim()
            .toLocaleLowerCase('vi');

        return tasks.filter(task => {
            const matchesSearch =
                !keyword ||
                task.title
                    ?.toLocaleLowerCase('vi')
                    .includes(keyword) ||
                String(task.task_number)
                    .includes(keyword);

            const matchesPriority =
                priorityFilter === 'all' ||
                task.priority === priorityFilter;

            const matchesAssignee =
                assigneeFilter === 'all' ||
                (
                    assigneeFilter === 'unassigned'
                        ? !task.assignee_id
                        : task.assignee_id === assigneeFilter
                );

            return (
                matchesSearch &&
                matchesPriority &&
                matchesAssignee
            );
        });
    }, [
        tasks,
        search,
        priorityFilter,
        assigneeFilter,
    ]);

    // ======================================
    // STATISTICS
    // ======================================

    const stats = useMemo(() => {
        const total = tasks.length;

        const done = tasks.filter(
            task => task.status === 'done'
        ).length;

        const progress = total
            ? Math.round((done / total) * 100)
            : 0;

        return {
            total,
            done,
            progress,
        };
    }, [tasks]);

    // ======================================
    // CREATE TASK
    // ======================================

    const createTask = async event => {
        event.preventDefault();

        if (busy || !form.title.trim()) return;

        setBusy(true);
        setError('');
        setNotice('');

        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                type: form.type,
                priority: form.priority,
                assigneeId: form.assigneeId || null,
                dueDate: form.dueDate
                    ? new Date(
                        `${form.dueDate}T23:59:00`
                    ).toISOString()
                    : null,
            };

            await ProjectsService.createTask(
                projectId,
                payload
            );

            setForm({
                title: '',
                description: '',
                type: 'task',
                priority: 'medium',
                assigneeId: '',
                dueDate: '',
            });

            setShowCreate(false);
            setNotice('Đã tạo công việc thành công.');

            await loadTasks();
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    };

    // ======================================
    // UPDATE STATUS
    // ======================================


    const moveTask = async (
        taskId,
        nextStatus,
        targetIndex = null
    ) => {
        if (busy) return;

        const currentTask = tasks.find(
            task => task.id === taskId
        );

        if (!currentTask) return;

        // Lấy thứ tự hiện tại của cột đích.
        const destination = tasks
            .filter(
                task =>
                    task.status === nextStatus &&
                    task.id !== taskId
            )
            .sort(
                (a, b) =>
                    Number(a.position) -
                    Number(b.position)
            );

        const index = targetIndex === null
            ? destination.length
            : Math.max(
                0,
                Math.min(
                    targetIndex,
                    destination.length
                )
            );

        // Không cần gọi API nếu vị trí không đổi.
        if (
            currentTask.status === nextStatus
        ) {
            const currentColumn = tasks
                .filter(
                    task => task.status === nextStatus
                )
                .sort(
                    (a, b) =>
                        Number(a.position) -
                        Number(b.position)
                );

            const currentIndex =
                currentColumn.findIndex(
                    task => task.id === taskId
                );

            if (currentIndex === index) {
                return;
            }
        }

        const previousTasks = tasks;

        // ======================================
        // OPTIMISTIC UPDATE
        // ======================================

        const movedTask = {
            ...currentTask,
            status: nextStatus,
        };

        const reordered = [...destination];

        reordered.splice(
            index,
            0,
            movedTask
        );

        const updatedPositions = new Map(
            reordered.map((task, i) => [
                task.id,
                i + 1,
            ])
        );

        const nextTasks = tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    status: nextStatus,
                    position:
                        updatedPositions.get(taskId),
                };
            }

            if (updatedPositions.has(task.id)) {
                return {
                    ...task,
                    position:
                        updatedPositions.get(task.id),
                };
            }

            return task;
        });

        const sourceStatus = currentTask.status;

        const sourceTasks = nextTasks
            .filter(
                task => task.status === sourceStatus
            )
            .sort(
                (a, b) =>
                    Number(a.position) -
                    Number(b.position)
            );

        const sourcePositions = new Map(
            sourceTasks.map((task, index) => [
                task.id,
                index + 1,
            ])
        );

        setTasks(
            nextTasks.map(task => {
                if (
                    sourceStatus !== nextStatus &&
                    sourcePositions.has(task.id)
                ) {
                    return {
                        ...task,
                        position:
                            sourcePositions.get(task.id),
                    };
                }

                return task;
            })
        );
        setBusy(true);
        setError('');

        try {
            await ProjectsService.moveTask(
                projectId,
                taskId,
                nextStatus,
                index
            );

            // Đồng bộ lại thứ tự chính xác từ DB.
            const response =
                await ProjectsService.getTasks(projectId);

            if (Array.isArray(response?.data)) {
                setTasks(response.data);
            }

        } catch (err) {
            // Nếu Backend từ chối, khôi phục Board.
            setTasks(previousTasks);
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    };


    // ======================================
    // DRAG AND DROP
    // ======================================

    const handleDragStart = (event, task) => {
        if (busy) {
            event.preventDefault();
            return;
        }

        event.dataTransfer.effectAllowed = 'move';

        event.dataTransfer.setData(
            'text/plain',
            task.id
        );

        setDraggedTaskId(task.id);
    };

    const handleDragOver = (event, status) => {
        if (!draggedTaskId || busy) return;

        event.preventDefault();

        event.dataTransfer.dropEffect = 'move';

        setDragOverColumn(status);
    };

    const handleDrop = async (event, status) => {
        event.preventDefault();

        const taskId =
            event.dataTransfer.getData('text/plain') ||
            draggedTaskId;

        setDraggedTaskId(null);
        setDragOverColumn(null);

        if (!taskId) return;

        await moveTask(taskId, status);
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setDragOverColumn(null);
    };

    // ======================================
    // RENDER
    // ======================================

    return (
        <section className="pk-root">

            {/* HEADER */}

            <header className="pk-header">
                <div className="pk-header__info">
                    <span className="pk-eyebrow">
                        AGILE PROJECT MANAGEMENT
                    </span>

                    <h2>Kanban Board</h2>

                    <p>
                        Quản lý công việc và theo dõi tiến độ
                        thực hiện dự án.
                    </p>
                </div>

                <div className="pk-header__actions">
                    <button
                        type="button"
                        className="pk-btn pk-btn--outline"
                        onClick={loadTasks}
                        disabled={loading || busy}
                    >
                        <RefreshCw size={16} />
                        Làm mới
                    </button>

                    <button
                        type="button"
                        className="pk-btn pk-btn--primary"
                        onClick={() => setShowCreate(true)}
                        disabled={busy}
                    >
                        <Plus size={17} />
                        Tạo Task
                    </button>
                </div>
            </header>

            {/* PROGRESS */}

            <div className="pk-progress">
                <div className="pk-progress__top">
                    <div>
                        <strong>Tiến độ dự án</strong>
                        <span>
                            {stats.done}/{stats.total}
                            {' '}công việc hoàn thành
                        </span>
                    </div>

                    <strong className="pk-progress__percent">
                        {stats.progress}%
                    </strong>
                </div>

                <div
                    className="pk-progress__track"
                    role="progressbar"
                    aria-valuenow={stats.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Tiến độ dự án"
                >
                    <div
                        className="pk-progress__fill"
                        style={{
                            width: `${stats.progress}%`,
                        }}
                    />
                </div>
            </div>

            {/* ALERTS */}

            {error && (
                <div className="pk-alert pk-alert--error">
                    <AlertCircle size={17} />
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() => setError('')}
                        aria-label="Đóng thông báo lỗi"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}

            {notice && (
                <div className="pk-alert pk-alert--success">
                    <CheckCircle2 size={17} />
                    <span>{notice}</span>

                    <button
                        type="button"
                        onClick={() => setNotice('')}
                        aria-label="Đóng thông báo"
                    >
                        <X size={15} />
                    </button>
                </div>
            )}

            {/* FILTERS */}

            <div className="pk-toolbar">
                <div className="pk-search">
                    <Search size={17} />

                    <input
                        type="search"
                        placeholder="Tìm công việc..."
                        value={search}
                        onChange={event =>
                            setSearch(event.target.value)
                        }
                    />
                </div>

                <select
                    value={priorityFilter}
                    onChange={event =>
                        setPriorityFilter(event.target.value)
                    }
                    aria-label="Lọc theo độ ưu tiên"
                >
                    <option value="all">
                        Tất cả độ ưu tiên
                    </option>
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="critical">Khẩn cấp</option>
                </select>

                <select
                    value={assigneeFilter}
                    onChange={event =>
                        setAssigneeFilter(event.target.value)
                    }
                    aria-label="Lọc theo thành viên"
                >
                    <option value="all">
                        Tất cả thành viên
                    </option>

                    <option value="unassigned">
                        Chưa phân công
                    </option>

                    {members.map(member => (
                        <option
                            key={member.user_id}
                            value={member.user_id}
                        >
                            {member.full_name ||
                                member.student_code ||
                                'Sinh viên'}
                        </option>
                    ))}
                </select>
            </div>

            {/* BOARD */}

            {loading && tasks.length === 0 ? (
                <div className="pk-loading">
                    <LoaderCircle
                        size={26}
                        className="pk-spin"
                    />
                    <span>Đang tải Kanban Board...</span>
                </div>
            ) : (
                <div className="pk-board">
                    {COLUMNS.map(column => {
                        const columnTasks = filteredTasks
                            .filter(
                                task =>
                                    task.status === column.id &&
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
                                className={[
                                    'pk-column',
                                    `pk-column--${column.color}`,
                                    dragOverColumn === column.id
                                        ? 'pk-column--dragover'
                                        : '',
                                ].join(' ')}
                                onDragOver={event =>
                                    handleDragOver(event, column.id)
                                }
                                onDragLeave={event => {
                                    if (
                                        !event.currentTarget.contains(
                                            event.relatedTarget
                                        )
                                    ) {
                                        setDragOverColumn(null);
                                    }
                                }}
                                onDrop={event =>
                                    handleDrop(event, column.id)
                                }
                            >
                                {/* COLUMN HEADER */}

                                <div className="pk-column__header">
                                    <div className="pk-column__title">
                                        <span className="pk-column__dot" />
                                        <strong>{column.title}</strong>
                                    </div>

                                    <span className="pk-column__count">
                                        {columnTasks.length}
                                    </span>
                                </div>

                                {/* TASK LIST */}

                                <div className="pk-column__body">
                                    {columnTasks.length === 0 ? (
                                        <div className="pk-column__empty">
                                            Chưa có công việc
                                        </div>
                                    ) : (
                                        columnTasks.map((task, taskIndex) => {
                                            const subtasks = tasks.filter(
                                                item => item.parent_task_id === task.id
                                            );

                                            const completedSubtasks = subtasks.filter(
                                                item => item.status === 'done'
                                            ).length;

                                            const subtaskProgress = subtasks.length
                                                ? Math.round(
                                                    (completedSubtasks / subtasks.length) * 100
                                                )
                                                : 0;
                                            const type =
                                                TYPES[task.type] ||
                                                TYPES.task;

                                            const TypeIcon = type.Icon;

                                            const priority =
                                                PRIORITIES[task.priority] ||
                                                PRIORITIES.medium;

                                            const overdue =
                                                task.due_date &&
                                                task.status !== 'done' &&
                                                new Date(task.due_date) <
                                                new Date();

                                            return (
                                                <article
                                                    onDragOver={event => {
                                                        if (!draggedTaskId || busy) return;

                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                    }}
                                                    onDrop={async event => {
                                                        event.preventDefault();
                                                        event.stopPropagation();

                                                        const sourceId =
                                                            event.dataTransfer.getData('text/plain') ||
                                                            draggedTaskId;

                                                        setDraggedTaskId(null);
                                                        setDragOverColumn(null);

                                                        if (!sourceId) return;

                                                        await moveTask(
                                                            sourceId,
                                                            column.id,
                                                            taskIndex
                                                        );
                                                    }}
                                                    onClick={() => {
                                                        if (!busy && !draggedTaskId) {
                                                            setSelectedTask(task);
                                                        }
                                                    }}
                                                    onKeyDown={event => {
                                                        if (
                                                            event.target === event.currentTarget &&
                                                            (event.key === 'Enter' || event.key === ' ')
                                                        ) {
                                                            event.preventDefault();
                                                            setSelectedTask(task);
                                                        }
                                                    }}
                                                    tabIndex={0}
                                                    role="button"
                                                    key={task.id}
                                                    className={[
                                                        'pk-task',
                                                        draggedTaskId === task.id
                                                            ? 'pk-task--dragging'
                                                            : '',
                                                    ].join(' ')}
                                                    draggable={!busy}
                                                    onDragStart={event =>
                                                        handleDragStart(
                                                            event,
                                                            task
                                                        )
                                                    }
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <div className="pk-task__top">
                                                        <span className="pk-task__key">
                                                            TASK-{task.task_number}
                                                        </span>

                                                        <GripVertical size={15} />
                                                    </div>

                                                    <h3>{task.title}</h3>

                                                    {task.description && (
                                                        <p className="pk-task__description">
                                                            {task.description}
                                                        </p>
                                                    )}

                                                    <div className="pk-task__labels">
                                                        <span className="pk-task__type">
                                                            <TypeIcon size={13} />
                                                            {type.label}
                                                        </span>

                                                        <span
                                                            className={
                                                                `pk-priority pk-priority--${task.priority}`
                                                            }
                                                        >
                                                            {priority.label}
                                                        </span>
                                                    </div>

                                                    <div className="pk-task__footer">
                                                        <div className="pk-task__assignee">
                                                            <UserRound size={15} />

                                                            <span>
                                                                {task.assignee_name ||
                                                                    'Chưa giao'}
                                                            </span>
                                                        </div>

                                                        {task.due_date && (
                                                            <span
                                                                className={[
                                                                    'pk-task__due',
                                                                    overdue
                                                                        ? 'pk-task__due--overdue'
                                                                        : '',
                                                                ].join(' ')}
                                                            >
                                                                <CalendarDays size={13} />
                                                                {formatDate(
                                                                    task.due_date
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* MOBILE STATUS CONTROL */}

                                                    <div
                                                        className="pk-task__status"
                                                        onClick={event => event.stopPropagation()}
                                                        onKeyDown={event => event.stopPropagation()}
                                                    >
                                                        <ArrowRight size={13} />

                                                        <select
                                                            value={task.status}
                                                            disabled={busy}
                                                            onChange={event =>
                                                                moveTask(
                                                                    task.id,
                                                                    event.target.value
                                                                )
                                                            }
                                                            aria-label={
                                                                `Đổi trạng thái ${task.title}`
                                                            }
                                                        >
                                                            {COLUMNS.map(item => (
                                                                <option
                                                                    key={item.id}
                                                                    value={item.id}
                                                                >
                                                                    {item.title}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {subtasks.length > 0 && (
                                                        <div className="pk-subtask-preview">
                                                            <div className="pk-subtask-preview__header">
                                                                <span>
                                                                    <ListTodo size={13} />
                                                                    Subtasks
                                                                </span>

                                                                <strong>
                                                                    {completedSubtasks}/{subtasks.length}
                                                                </strong>
                                                            </div>

                                                            <div className="pk-subtask-preview__track">
                                                                <div
                                                                    className="pk-subtask-preview__fill"
                                                                    style={{
                                                                        width: `${subtaskProgress}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </article>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CREATE TASK MODAL */}

            {showCreate && (
                <div
                    className="pk-modal-backdrop"
                    onMouseDown={event => {
                        if (
                            event.target ===
                            event.currentTarget &&
                            !busy
                        ) {
                            setShowCreate(false);
                        }
                    }}
                >
                    <div
                        className="pk-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pk-create-title"
                    >
                        <div className="pk-modal__header">
                            <div>
                                <span className="pk-eyebrow">
                                    NEW ISSUE
                                </span>

                                <h2 id="pk-create-title">
                                    Tạo công việc mới
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                disabled={busy}
                                aria-label="Đóng"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form onSubmit={createTask}>
                            <label htmlFor="pk-title">
                                Tên công việc *
                            </label>

                            <input
                                id="pk-title"
                                required
                                maxLength={255}
                                value={form.title}
                                onChange={event =>
                                    setForm(current => ({
                                        ...current,
                                        title: event.target.value,
                                    }))
                                }
                                placeholder="Ví dụ: Thiết kế Database"
                            />

                            <label htmlFor="pk-description">
                                Mô tả
                            </label>

                            <textarea
                                id="pk-description"
                                rows={4}
                                maxLength={10000}
                                value={form.description}
                                onChange={event =>
                                    setForm(current => ({
                                        ...current,
                                        description:
                                            event.target.value,
                                    }))
                                }
                                placeholder="Mô tả công việc cần thực hiện..."
                            />

                            <div className="pk-modal__grid">
                                <div>
                                    <label htmlFor="pk-type">
                                        Loại công việc
                                    </label>

                                    <select
                                        id="pk-type"
                                        value={form.type}
                                        onChange={event =>
                                            setForm(current => ({
                                                ...current,
                                                type: event.target.value,
                                            }))
                                        }
                                    >
                                        <option value="task">Task</option>
                                        <option value="bug">Bug</option>
                                        <option value="story">Story</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="pk-priority">
                                        Độ ưu tiên
                                    </label>

                                    <select
                                        id="pk-priority"
                                        value={form.priority}
                                        onChange={event =>
                                            setForm(current => ({
                                                ...current,
                                                priority: event.target.value,
                                            }))
                                        }
                                    >
                                        <option value="low">Thấp</option>
                                        <option value="medium">Trung bình</option>
                                        <option value="high">Cao</option>
                                        <option value="critical">Khẩn cấp</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="pk-assignee">
                                        Người phụ trách
                                    </label>

                                    <select
                                        id="pk-assignee"
                                        value={form.assigneeId}
                                        onChange={event =>
                                            setForm(current => ({
                                                ...current,
                                                assigneeId:
                                                    event.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">
                                            Chưa phân công
                                        </option>

                                        {members
                                            .filter(
                                                member =>
                                                    isOwner ||
                                                    member.role === 'owner'
                                            )
                                            .map(member => (
                                                <option
                                                    key={member.user_id}
                                                    value={member.user_id}
                                                >
                                                    {member.full_name ||
                                                        member.student_code}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="pk-due">
                                        Hạn hoàn thành
                                    </label>

                                    <input
                                        id="pk-due"
                                        type="date"
                                        value={form.dueDate}
                                        onChange={event =>
                                            setForm(current => ({
                                                ...current,
                                                dueDate:
                                                    event.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="pk-modal__actions">
                                <button
                                    type="button"
                                    className="pk-btn pk-btn--outline"
                                    disabled={busy}
                                    onClick={() =>
                                        setShowCreate(false)
                                    }
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    className="pk-btn pk-btn--primary"
                                    disabled={
                                        busy ||
                                        !form.title.trim()
                                    }
                                >
                                    {busy ? (
                                        <LoaderCircle
                                            size={16}
                                            className="pk-spin"
                                        />
                                    ) : (
                                        <Plus size={16} />
                                    )}

                                    Tạo Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedTask && (
                <TaskModal
                    tasks={tasks}
                    onOpenTask={task => setSelectedTask(task)}
                    task={selectedTask}
                    projectId={projectId}
                    members={members}
                    isOwner={isOwner}
                    currentUserId={currentUserId}
                    onClose={() => setSelectedTask(null)}
                    onUpdated={async () => {
                        const response =
                            await ProjectsService.getTasks(projectId);

                        const latestTasks = Array.isArray(response?.data)
                            ? response.data
                            : [];

                        setTasks(latestTasks);

                        const updated = latestTasks.find(
                            item => item.id === selectedTask.id
                        );

                        if (updated) {
                            setSelectedTask(updated);
                        }
                    }}
                    onDeleted={async () => {
                        setSelectedTask(null);
                        await loadTasks();
                        setNotice('Đã xóa công việc thành công.');
                    }}
                />
            )}
        </section>
    );
}

