
import React, { useMemo, useState } from "react";

import {
    Users,
    CheckCircle2,
    Clock3,
    AlertTriangle,
    ListTodo,
    ArrowUpDown,
    UserRound,
} from "lucide-react";

import "./MemberPerformance.css";

function calculateMemberStats(member, tasks, now) {
    const assignedTasks = tasks.filter(
        task => task.assignee_id === member.user_id
    );

    const total = assignedTasks.length;

    const completed = assignedTasks.filter(
        task => task.status === "done"
    ).length;

    const inProgress = assignedTasks.filter(
        task => task.status === "in_progress"
    ).length;

    const overdue = assignedTasks.filter(task => {
        if (
            !task.due_date ||
            task.status === "done"
        ) {
            return false;
        }

        const deadline = new Date(task.due_date);

        return (
            !Number.isNaN(deadline.getTime()) &&
            deadline.getTime() < now
        );
    }).length;

    const completionRate = total
        ? Math.round((completed / total) * 100)
        : 0;

    return {
        ...member,
        total,
        completed,
        inProgress,
        overdue,
        completionRate,
    };
}

export default function MemberPerformance({
    members = [],
    tasks = [],
    onSelectMember,
}) {
    const [sortBy, setSortBy] = useState("completed");

    // Tính tại thời điểm component render.
    const now = Date.now();

    const statistics = useMemo(() => {
        return members
            .map(member =>
                calculateMemberStats(
                    member,
                    tasks,
                    now
                )
            )
            .sort((a, b) => {
                if (sortBy === "completed") {
                    return b.completed - a.completed;
                }

                if (sortBy === "overdue") {
                    return b.overdue - a.overdue;
                }

                if (sortBy === "assigned") {
                    return b.total - a.total;
                }

                if (sortBy === "progress") {
                    return (
                        b.completionRate -
                        a.completionRate
                    );
                }

                return 0;
            });
    }, [members, tasks, sortBy, now]);

    const unassignedCount = tasks.filter(
        task => !task.assignee_id
    ).length;

    return (
        <section className="mp-root">

            {/* HEADER */}

            <div className="mp-header">
                <div>
                    <span className="mp-eyebrow">
                        TEAM PERFORMANCE
                    </span>

                    <h2>
                        <Users size={21} />
                        Hiệu suất thành viên
                    </h2>

                    <p>
                        Theo dõi phân công và tiến độ
                        công việc của từng sinh viên.
                    </p>
                </div>

                <div className="mp-sort">
                    <ArrowUpDown size={15} />

                    <select
                        value={sortBy}
                        onChange={event =>
                            setSortBy(event.target.value)
                        }
                        aria-label="Sắp xếp thành viên"
                    >
                        <option value="completed">
                            Hoàn thành nhiều nhất
                        </option>

                        <option value="progress">
                            Tỷ lệ hoàn thành
                        </option>

                        <option value="assigned">
                            Được giao nhiều nhất
                        </option>

                        <option value="overdue">
                            Quá hạn nhiều nhất
                        </option>
                    </select>
                </div>
            </div>

            {/* UNASSIGNED WARNING */}

            {unassignedCount > 0 && (
                <div className="mp-warning">
                    <AlertTriangle size={16} />

                    <span>
                        Có <strong>{unassignedCount}</strong>
                        {" "}Task/Subtask chưa được
                        phân công cho thành viên.
                    </span>
                </div>
            )}

            {/* TABLE */}

            <div className="mp-table-wrap">
                <table className="mp-table">

                    <thead>
                        <tr>
                            <th>Thành viên</th>
                            <th>Assigned</th>
                            <th>Completed</th>
                            <th>In Progress</th>
                            <th>Overdue</th>
                            <th>Tiến độ</th>
                        </tr>
                    </thead>

                    <tbody>
                        {statistics.map((member, index) => (
                            <tr
                                key={member.user_id}
                                onClick={() =>
                                    onSelectMember?.(member)
                                }
                                className={
                                    onSelectMember
                                        ? "mp-table__clickable"
                                        : ""
                                }
                            >
                                <td>
                                    <div className="mp-member">
                                        <span className="mp-avatar">
                                            <UserRound size={18} />
                                        </span>

                                        <div>
                                            <strong>
                                                {member.full_name ||
                                                    member.student_code ||
                                                    "Sinh viên"}
                                            </strong>

                                            <span>
                                                {member.role === "owner"
                                                    ? "Trưởng nhóm"
                                                    : "Thành viên"}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    <span className="mp-stat">
                                        <ListTodo size={14} />
                                        {member.total}
                                    </span>
                                </td>

                                <td>
                                    <span className="mp-stat mp-stat--success">
                                        <CheckCircle2 size={14} />
                                        {member.completed}
                                    </span>
                                </td>

                                <td>
                                    <span className="mp-stat mp-stat--info">
                                        <Clock3 size={14} />
                                        {member.inProgress}
                                    </span>
                                </td>

                                <td>
                                    <span className="mp-stat mp-stat--danger">
                                        <AlertTriangle size={14} />
                                        {member.overdue}
                                    </span>
                                </td>

                                <td>
                                    <div className="mp-progress">
                                        <div className="mp-progress__top">
                                            <strong>
                                                {member.total
                                                    ? `${member.completionRate}%`
                                                    : "—"}
                                            </strong>
                                        </div>

                                        <div className="mp-progress__track">
                                            <div
                                                className="mp-progress__fill"
                                                style={{
                                                    width:
                                                        `${member.completionRate}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {statistics.length === 0 && (
                    <div className="mp-empty">
                        Chưa có thành viên để thống kê.
                    </div>
                )}
            </div>
        </section>
    );
}
