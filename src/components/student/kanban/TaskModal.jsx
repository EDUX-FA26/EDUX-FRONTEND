
import React, {
    useEffect,
    useState,
} from 'react';

import {
    X,
    Save,
    Trash2,
    CalendarDays,
    UserRound,
    Flag,
    AlignLeft,
    ListTodo,
    LoaderCircle,
    AlertCircle,
    CheckCircle2,
    Clock3,
    Plus,
    ChevronRight,
    ArrowLeft,
} from 'lucide-react';

import { ProjectsService } from '../../../services/projects.service';

// ==========================================
// CONSTANTS
// ==========================================

const STATUSES = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'done', label: 'Done' },
];

const PRIORITIES = [
    { value: 'low', label: 'Thấp' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'high', label: 'Cao' },
    { value: 'critical', label: 'Khẩn cấp' },
];

const TYPES = [
    { value: 'task', label: 'Task' },
    { value: 'bug', label: 'Bug' },
    { value: 'story', label: 'Story' },
];

// ==========================================
// HELPERS
// ==========================================

function getError(error) {
    return (
        error?.response?.data?.message ||
        error?.message ||
        'Có lỗi xảy ra. Vui lòng thử lại.'
    );
}

function toDateInput(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    // Lấy ngày theo múi giờ địa phương.
    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
        date.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function createInitialForm(task) {
    return {
        title: task?.title || '',
        description: task?.description || '',
        type: task?.type || 'task',
        priority: task?.priority || 'medium',
        status: task?.status || 'todo',
        assigneeId: task?.assignee_id || '',
        dueDate: toDateInput(task?.due_date),
    };
}

// ==========================================
// TASK MODAL
// ==========================================

export default function TaskModal({
    task,
    tasks = [],
    projectId,
    members = [],
    isOwner = false,
    currentUserId = null,
    onClose,
    onUpdated,
    onDeleted,
    onOpenTask,
}) {
    const [form, setForm] = useState(
        () => createInitialForm(task)
    );

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [showSubtaskForm, setShowSubtaskForm] =
        useState(false);

    const [subtaskTitle, setSubtaskTitle] =
        useState('');

    const [subtaskAssignee, setSubtaskAssignee] =
        useState('');

    const [subtaskPriority, setSubtaskPriority] =
        useState('medium');
    // ======================================
    // PERMISSIONS
    // ======================================

    const isAssignee =
        Boolean(currentUserId) &&
        task?.assignee_id === currentUserId;

    const canEdit = isOwner || isAssignee;
    const canAssign = isOwner;
    const canDelete = isOwner;

    const isSubtask = Boolean(task?.parent_task_id);

    // ======================================
    // PARENT TASK
    // ======================================

    const parentTask = isSubtask
        ? tasks.find(item => item.id === task.parent_task_id)
        : null;

    const subtasks = tasks.filter(
        item => item.parent_task_id === task?.id
    );

    const completedSubtasks = subtasks.filter(
        item => item.status === 'done'
    ).length;

    const subtaskProgress = subtasks.length
        ? Math.round(
            (completedSubtasks / subtasks.length) * 100
        )
        : 0;
    // ======================================
    // SYNC TASK
    // ======================================

    useEffect(() => {
        setForm(createInitialForm(task));
        setError('');
        setNotice('');
    }, [task]);

    // ======================================
    // ESC KEY
    // ======================================

    useEffect(() => {
        if (busy) return undefined;

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                onClose?.();
            }
        }

        window.addEventListener(
            'keydown',
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                'keydown',
                handleKeyDown
            );
        };
    }, [busy, onClose]);

    // ======================================
    // UPDATE FORM
    // ======================================

    const updateField = (field, value) => {
        setForm(current => ({
            ...current,
            [field]: value,
        }));
    };

    // ======================================
    // SAVE TASK
    // ======================================

    const saveTask = async event => {
        event.preventDefault();

        if (
            busy ||
            !canEdit ||
            !form.title.trim()
        ) {
            return;
        }

        setBusy(true);
        setError('');
        setNotice('');

        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                type: form.type,
                priority: form.priority,

                dueDate: form.dueDate
                    ? new Date(
                        `${form.dueDate}T23:59:00`
                    ).toISOString()
                    : null,
            };

            // 1. Cập nhật thông tin.
            await ProjectsService.updateTask(
                projectId,
                task.id,
                payload
            );

            // 2. Giao việc (Owner).
            if (
                canAssign &&
                (form.assigneeId || null) !==
                (task.assignee_id || null)
            ) {
                await ProjectsService.assignTask(
                    projectId,
                    task.id,
                    form.assigneeId || null
                );
            }

            // 3. Cập nhật trạng thái.
            if (form.status !== task.status) {
                await ProjectsService.updateTaskStatus(
                    projectId,
                    task.id,
                    form.status
                );
            }

            setNotice('Đã lưu thay đổi thành công.');

            await onUpdated?.();

        } catch (err) {
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    };

    // ======================================
    // DELETE TASK
    // ======================================

    const deleteTask = async () => {
        if (!canDelete || busy) return;

        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa công việc "${task.title}"?\n\n` +
            'Hành động này không thể hoàn tác.'
        );

        if (!confirmed) return;

        setBusy(true);
        setError('');

        try {
            await ProjectsService.deleteTask(
                projectId,
                task.id
            );

            await onDeleted?.(task.id);

        } catch (err) {
            setError(getError(err));
            setBusy(false);
        }
    };

    if (!task) return null;


    const createSubtask = async event => {
        event.preventDefault();

        if (
            busy ||
            !subtaskTitle.trim() ||
            isSubtask
        ) {
            return;
        }

        setBusy(true);
        setError('');
        setNotice('');

        try {
            await ProjectsService.createTask(
                projectId,
                {
                    title: subtaskTitle.trim(),
                    description: '',
                    type: 'task',
                    priority: subtaskPriority,
                    assigneeId:
                        subtaskAssignee || null,
                    parentTaskId: task.id,
                    dueDate: null,
                }
            );

            setSubtaskTitle('');
            setSubtaskAssignee('');
            setSubtaskPriority('medium');
            setShowSubtaskForm(false);

            setNotice('Đã tạo Subtask thành công.');

            await onUpdated?.();

        } catch (err) {
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    };


    // ======================================
    // RENDER
    // ======================================

    return (
        <div
            className="pk-modal-backdrop"
            onMouseDown={event => {
                if (
                    event.target === event.currentTarget &&
                    !busy
                ) {
                    onClose?.();
                }
            }}
        >
            <div
                className="pk-modal pk-task-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pk-task-modal-title"
            >

                {/* HEADER */}

                <header className="pk-modal__header">
                    <div className="pk-task-modal__heading">
                        {isSubtask && parentTask && (
                            <button
                                type="button"
                                className="pk-task-modal__back"
                                onClick={() => onOpenTask?.(parentTask)}
                                disabled={busy}
                            >
                                <ArrowLeft size={16} />
                                Quay lại TASK-{parentTask.task_number}
                            </button>
                        )}

                        <span className="pk-eyebrow">
                            TASK-{task.task_number}
                        </span>

                        <h2 id="pk-task-modal-title">
                            {isSubtask
                                ? "Chi tiết Subtask"
                                : "Chi tiết công việc"}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Đóng"
                    >
                        <X size={19} />
                    </button>
                </header>

                {/* ALERTS */}

                {error && (
                    <div className="pk-alert pk-alert--error">
                        <AlertCircle size={17} />
                        <span>{error}</span>
                    </div>
                )}

                {notice && (
                    <div className="pk-alert pk-alert--success">
                        <CheckCircle2 size={17} />
                        <span>{notice}</span>
                    </div>
                )}

                {!canEdit && (
                    <div className="pk-task-modal__readonly">
                        <AlertCircle size={16} />

                        Bạn chỉ có quyền xem công việc này.
                        Chỉ trưởng nhóm hoặc người được giao
                        mới có thể chỉnh sửa.
                    </div>
                )}

                {/* FORM */}

                <form onSubmit={saveTask}>

                    {/* TITLE */}

                    <label htmlFor="pk-edit-title">
                        <ListTodo size={15} />
                        Tên công việc
                    </label>

                    <input
                        id="pk-edit-title"
                        value={form.title}
                        onChange={event =>
                            updateField(
                                'title',
                                event.target.value
                            )
                        }
                        maxLength={255}
                        required
                        disabled={!canEdit || busy}
                    />

                    {/* DESCRIPTION */}

                    <label htmlFor="pk-edit-description">
                        <AlignLeft size={15} />
                        Mô tả công việc
                    </label>

                    <textarea
                        id="pk-edit-description"
                        rows={5}
                        maxLength={10000}
                        value={form.description}
                        onChange={event =>
                            updateField(
                                'description',
                                event.target.value
                            )
                        }
                        placeholder="Mô tả nội dung công việc..."
                        disabled={!canEdit || busy}
                    />

                    <div className="pk-modal__grid">

                        {/* TYPE */}

                        <div>
                            <label htmlFor="pk-edit-type">
                                <ListTodo size={15} />
                                Loại công việc
                            </label>

                            <select
                                id="pk-edit-type"
                                value={form.type}
                                onChange={event =>
                                    updateField(
                                        'type',
                                        event.target.value
                                    )
                                }
                                disabled={!canEdit || busy}
                            >
                                {TYPES.map(item => (
                                    <option
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* STATUS */}

                        <div>
                            <label htmlFor="pk-edit-status">
                                <Clock3 size={15} />
                                Trạng thái
                            </label>

                            <select
                                id="pk-edit-status"
                                value={form.status}
                                onChange={event =>
                                    updateField(
                                        'status',
                                        event.target.value
                                    )
                                }
                                disabled={!canEdit || busy}
                            >
                                {STATUSES.map(item => (
                                    <option
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* PRIORITY */}

                        <div>
                            <label htmlFor="pk-edit-priority">
                                <Flag size={15} />
                                Độ ưu tiên
                            </label>

                            <select
                                id="pk-edit-priority"
                                value={form.priority}
                                onChange={event =>
                                    updateField(
                                        'priority',
                                        event.target.value
                                    )
                                }
                                disabled={!canEdit || busy}
                            >
                                {PRIORITIES.map(item => (
                                    <option
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ASSIGNEE */}

                        <div>
                            <label htmlFor="pk-edit-assignee">
                                <UserRound size={15} />
                                Người phụ trách
                            </label>

                            <select
                                id="pk-edit-assignee"
                                value={form.assigneeId}
                                onChange={event =>
                                    updateField(
                                        'assigneeId',
                                        event.target.value
                                    )
                                }
                                disabled={!canAssign || busy}
                            >
                                <option value="">
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

                        {/* DUE DATE */}

                        <div>
                            <label htmlFor="pk-edit-due">
                                <CalendarDays size={15} />
                                Hạn hoàn thành
                            </label>

                            <input
                                id="pk-edit-due"
                                type="date"
                                value={form.dueDate}
                                onChange={event =>
                                    updateField(
                                        'dueDate',
                                        event.target.value
                                    )
                                }
                                disabled={!canEdit || busy}
                            />
                        </div>

                    </div>


                    {/* ======================================
    SUBTASK MANAGEMENT
====================================== */}

                    {!isSubtask && (
                        <section className="pk-subtasks">

                            <div className="pk-subtasks__header">
                                <div>
                                    <h3>
                                        <ListTodo size={17} />
                                        Subtasks
                                    </h3>

                                    <p>
                                        Chia công việc lớn thành các nhiệm vụ nhỏ.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="pk-btn pk-btn--outline"
                                    onClick={() =>
                                        setShowSubtaskForm(value => !value)
                                    }
                                    disabled={busy}
                                >
                                    <Plus size={15} />
                                    Thêm Subtask
                                </button>
                            </div>

                            {/* PROGRESS */}

                            {subtasks.length > 0 && (
                                <div className="pk-subtasks__progress">
                                    <div>
                                        <span>Tiến độ Subtask</span>

                                        <strong>
                                            {completedSubtasks}/{subtasks.length}
                                        </strong>
                                    </div>

                                    <div className="pk-subtasks__track">
                                        <div
                                            className="pk-subtasks__fill"
                                            style={{
                                                width: `${subtaskProgress}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* CREATE SUBTASK */}

                            {showSubtaskForm && (
                                <div className="pk-subtasks__create">
                                    <input
                                        type="text"
                                        placeholder="Tên công việc con..."
                                        value={subtaskTitle}
                                        maxLength={255}
                                        disabled={busy}
                                        onChange={event =>
                                            setSubtaskTitle(event.target.value)
                                        }
                                    />

                                    <div className="pk-subtasks__create-grid">
                                        <select
                                            value={subtaskPriority}
                                            disabled={busy}
                                            onChange={event =>
                                                setSubtaskPriority(event.target.value)
                                            }
                                            aria-label="Độ ưu tiên Subtask"
                                        >
                                            {PRIORITIES.map(priority => (
                                                <option
                                                    key={priority.value}
                                                    value={priority.value}
                                                >
                                                    {priority.label}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={subtaskAssignee}
                                            disabled={busy || !isOwner}
                                            onChange={event =>
                                                setSubtaskAssignee(event.target.value)
                                            }
                                            aria-label="Người phụ trách Subtask"
                                        >
                                            <option value="">
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

                                    <div className="pk-subtasks__create-actions">
                                        <button
                                            type="button"
                                            className="pk-btn pk-btn--outline"
                                            disabled={busy}
                                            onClick={() =>
                                                setShowSubtaskForm(false)
                                            }
                                        >
                                            Hủy
                                        </button>

                                        <button
                                            type="button"
                                            className="pk-btn pk-btn--primary"
                                            disabled={
                                                busy ||
                                                !subtaskTitle.trim()
                                            }
                                            onClick={createSubtask}
                                        >
                                            {busy ? (
                                                <LoaderCircle
                                                    size={15}
                                                    className="pk-spin"
                                                />
                                            ) : (
                                                <Plus size={15} />
                                            )}

                                            Tạo Subtask
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* SUBTASK LIST */}

                            {subtasks.length === 0 ? (
                                <div className="pk-subtasks__empty">
                                    Chưa có Subtask nào.
                                </div>
                            ) : (
                                <div className="pk-subtasks__list">
                                    {subtasks.map(subtask => (
                                        <button
                                            type="button"
                                            key={subtask.id}
                                            className="pk-subtask-item"
                                            onClick={() => onOpenTask?.(subtask)}
                                            disabled={busy}
                                        >
                                            <span
                                                className={[
                                                    'pk-subtask-item__check',
                                                    subtask.status === 'done'
                                                        ? 'pk-subtask-item__check--done'
                                                        : '',
                                                ].join(' ')}
                                            >
                                                {subtask.status === 'done' ? (
                                                    <CheckCircle2 size={18} />
                                                ) : (
                                                    <ListTodo size={18} />
                                                )}
                                            </span>

                                            <span className="pk-subtask-item__body">
                                                <small>
                                                    TASK-{subtask.task_number}
                                                </small>

                                                <strong>
                                                    {subtask.title}
                                                </strong>
                                            </span>

                                            <span className="pk-subtask-item__status">
                                                {STATUSES.find(
                                                    status =>
                                                        status.value === subtask.status
                                                )?.label || subtask.status}
                                            </span>

                                            <ChevronRight size={15} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}


                    {/* META */}

                    <div className="pk-task-modal__meta">
                        <span>
                            Người tạo:{' '}
                            <strong>
                                {task.reporter_name ||
                                    'Không xác định'}
                            </strong>
                        </span>

                        <span>
                            Ngày tạo:{' '}
                            <strong>
                                {task.created_at
                                    ? new Date(
                                        task.created_at
                                    ).toLocaleString('vi-VN')
                                    : '—'}
                            </strong>
                        </span>
                    </div>

                    {/* ACTIONS */}

                    <div className="pk-modal__actions">

                        {canDelete && (
                            <button
                                type="button"
                                className="pk-btn pk-btn--danger"
                                disabled={busy}
                                onClick={deleteTask}
                            >
                                <Trash2 size={16} />
                                Xóa Task
                            </button>
                        )}

                        <button
                            type="button"
                            className="pk-btn pk-btn--outline"
                            disabled={busy}
                            onClick={onClose}
                        >
                            Đóng
                        </button>

                        {canEdit && (
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
                                    <Save size={16} />
                                )}

                                Lưu thay đổi
                            </button>
                        )}

                    </div>
                </form>
            </div>
        </div>
    );
}
