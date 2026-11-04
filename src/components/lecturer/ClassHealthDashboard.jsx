
import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Users,
  AlertTriangle,
  RotateCw,
  Search,
  Flame,
  ClipboardList,
  BookOpen,
  Bell,
  CheckCircle2,
  X,
  Send,
  Eye,
  Clock,
  Info,
  Mail,
} from "lucide-react";

import {
  getClassHealthSnapshot,
  sendClassHealthBulkNotification,
} from "../../services/classHealth.service";

const RISK_CONFIG = {
  high: {
    label: "High Risk",
    color: "#dc2626",
    bg: "#fef2f2",
  },
  medium: {
    label: "Medium Risk",
    color: "#d97706",
    bg: "#fffbeb",
  },
  low: {
    label: "Low Risk",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  insufficient_data: {
    label: "Insufficient Data",
    color: "#64748b",
    bg: "#f1f5f9",
  },
};

const getRiskConfig = (level) =>
  RISK_CONFIG[level] || RISK_CONFIG.insufficient_data;

const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "N/A"
    : date.toLocaleDateString("vi-VN");
};

const getStudentWarnings = (student) => {
  if (Array.isArray(student.earlyWarnings)) {
    return student.earlyWarnings.map((warning) =>
      typeof warning === "string"
        ? warning
        : warning.message
    ).filter(Boolean);
  }

  const warnings = [];
  const factors = student.riskFactors || {};

  const streak = factors.streak || {};
  const assignment = factors.assignment || {};
  const quiz = factors.quiz || {};

  const hasStreakHistory =
    Boolean(student.lastActivityDate) ||
    Number(streak.activeDays7d || 0) > 0 ||
    Number(streak.previousActiveDays7d || 0) > 0;

  if (
    hasStreakHistory &&
    Number(streak.activeDays7d || 0) === 0
  ) {
    warnings.push(
      "Không ghi nhận hoạt động trong 7 ngày gần nhất"
    );
  }

  if (
    Number(streak.previousActiveDays7d || 0) >= 3 &&
    Number(streak.activeDays7d || 0) <=
    Number(streak.previousActiveDays7d) / 2
  ) {
    warnings.push("Tần suất học tập giảm đáng kể");
  }

  if (Number(assignment.overdue || 0) > 0) {
    warnings.push(
      `${assignment.overdue} Assignment quá hạn chưa nộp`
    );
  }

  if (
    Number(quiz.recentTestCount || 0) >= 3 &&
    Number(quiz.lowRecentTests || 0) === 3
  ) {
    warnings.push("3 bài Quiz gần nhất có kết quả thấp");
  }

  return warnings;
};

function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div
      className="card"
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "var(--color-ink-muted)",
          }}
        >
          {title}
        </span>

        <Icon size={18} color={color} />
      </div>

      <strong
        style={{
          fontSize: 26,
          color: color || "var(--color-ink)",
        }}
      >
        {value ?? "—"}
      </strong>
    </div>
  );
}

function RiskBadge({ level }) {
  const config = getRiskConfig(level);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 10px",
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 20,
        background: config.bg,
        color: config.color,
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}


function BulkNotifyPreview({
  classId,
  students,
  onClose,
  onSent,
}) {
  const [title, setTitle] = useState(
    "Nhắc nhở và hỗ trợ tiến độ học tập"
  );

  const [message, setMessage] = useState(
    `Chào bạn,

Giảng viên nhận thấy có một số hoạt động học tập bạn cần chú ý.

Bạn vui lòng kiểm tra các Assignment chưa hoàn thành, xem lại kết quả Quiz và chủ động liên hệ giảng viên nếu gặp khó khăn.

Trân trọng,
Giảng viên EduX`
  );

  const [step, setStep] = useState("compose");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [channel, setChannel] = useState('both');

  const valid =
    students.length > 0 &&
    students.length <= 100 &&
    (channel === 'in_app' || students.length <= 20) &&
    title.trim().length > 0 &&
    title.trim().length <= 200 &&
    message.trim().length > 0 &&
    message.trim().length <= 5000;

  const handleSend = async () => {
    if (!valid || sending || step !== "preview") return;

    setSending(true);
    setError("");

    try {
      const response =
        await sendClassHealthBulkNotification(classId, {
          studentIds: students.map(s => s.studentId),
          title: title.trim(),
          message: message.trim(),
          channel,
        });

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to send notifications"
        );
      }

      setResult(response.data);
      setStep("result");
      onSent?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Không thể gửi thông báo."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (!sending && e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bulk Notify"
        className="card"

        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "min(85vh, 760px)",
          overflowY: "auto",
          overflowX: "hidden",
          backgroundColor: "var(--color-surface, #ffffff)",
          color: "var(--color-ink, #111827)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxSizing: "border-box",
          borderRadius: 16,
          position: "relative",
          margin: "0 auto",
        }}

      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>Bulk Notify</h3>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-ink-muted)",
              }}
            >
              {students.length} sinh viên được chọn
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={sending}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {step === "result" ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              padding: "24px 8px",
              textAlign: "center",
            }}
          >
            <CheckCircle2 size={48} color="#16a34a" />

            <h3 style={{ margin: 0 }}>
              Notification Results
            </h3>

            <p style={{ margin: 0, fontSize: 13 }}>
              Đã xử lý yêu cầu cho {result?.requestedCount ?? 0} sinh viên.
            </p>

            <div
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div className="card" style={{ padding: 16 }}>
                <Bell size={20} />
                <h3>{result?.inApp?.created ?? 0}</h3>
                <p style={{ fontSize: 12 }}>
                  In-app: {result?.inApp?.status ?? "N/A"}
                </p>
              </div>

              <div className="card" style={{ padding: 16 }}>
                <Mail size={20} />
                <h3>{result?.email?.accepted ?? 0}</h3>
                <p style={{ fontSize: 12 }}>
                  Email: {result?.email?.status ?? "N/A"}
                </p>
                {(result?.email?.failed > 0 ||
                  result?.email?.skipped > 0) && (
                    <p style={{ color: "#dc2626", fontSize: 12 }}>
                      Failed: {result.email.failed} |
                      Skipped: {result.email.skipped}
                    </p>
                  )}
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={onClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 150,
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Recipients */}
            <div>
              <strong style={{ fontSize: 13 }}>
                Recipients ({students.length})
              </strong>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 10,
                }}
              >
                {students.map(student => (
                  <span
                    key={student.studentId}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: "var(--color-primary-bg, #fff3eb)",
                      fontSize: 12,
                    }}
                  >
                    {student.fullName || student.studentCode}
                  </span>
                ))}
              </div>
            </div>

            {step === "compose" ? (
              <>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <strong style={{ fontSize: 13 }}>
                    Notification Channel
                  </strong>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {[
                      { value: "in_app", label: "In-app", detail: "Thông báo EduX" },
                      { value: "email", label: "Email", detail: "Gửi qua email" },
                      { value: "both", label: "Both", detail: "In-app + Email" },
                    ].map(option => (
                      <label
                        key={option.value}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          padding: 12,
                          borderRadius: 10,
                          border: channel === option.value
                            ? "1px solid #f97316"
                            : "1px solid #d1d5db",
                          background: channel === option.value
                            ? "#fff7ed"
                            : "#ffffff",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name="bulk-notification-channel"
                          checked={channel === option.value}
                          onChange={() => setChannel(option.value)}
                          style={{ accentColor: "#f97316", marginTop: 3 }}
                        />
                        <span>
                          <strong
                            style={{
                              display: "block",
                              fontSize: 13,
                              color: "#111827",
                            }}
                          >
                            {option.label}
                          </strong>
                          <span
                            style={{
                              display: "block",
                              fontSize: 11,
                              color: "#64748b",
                              marginTop: 4,
                            }}
                          >
                            {option.detail}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>

                  {channel !== "in_app" && students.length > 20 && (
                    <p style={{ fontSize: 12, color: "#dc2626" }}>
                      Email chỉ hỗ trợ tối đa 20 sinh viên mỗi lần gửi.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="notify-title"
                    style={{ fontSize: 13, fontWeight: 600 }}
                  >
                    Notification Title
                  </label>

                  <input
                    id="notify-title"
                    className="input"
                    value={title}
                    maxLength={200}
                    onChange={e => setTitle(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="notify-message"
                    style={{ fontSize: 13, fontWeight: 600 }}
                  >
                    Message
                  </label>

                  <textarea
                    id="notify-message"
                    className="input"
                    value={message}
                    maxLength={5000}
                    onChange={e => setMessage(e.target.value)}
                    rows={8}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: 12,
                  }}
                >
                  <Info size={15} style={{ marginRight: 6 }} />
                  Kênh gửi: In-app Notification.
                  Sinh viên sẽ nhận thông báo trong EduX.
                </div>
              </>
            ) : (
              <div>
                <h4>Confirm Notification</h4>

                <div
                  style={{
                    padding: 16,
                    border: "1px solid var(--color-border, #eee)",
                    borderRadius: 10,
                  }}
                >
                  <p style={{ fontSize: 12 }}>
                    <strong>Recipients:</strong>{" "}
                    {students.length} students
                  </p>

                  <p style={{ fontSize: 12 }}>
                    <strong>Channel:</strong>{" "}
                    {channel === "both"
                      ? "In-app + Email"
                      : channel === "email"
                        ? "Email"
                        : "In-app"}
                  </p>

                  <h4>{title}</h4>

                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {message}
                  </p>
                </div>

                <p
                  style={{
                    fontSize: 12,
                    color: "#d97706",
                    marginTop: 12,
                  }}
                >
                  Xác nhận sẽ tạo thông báo thật cho
                  những sinh viên được chọn.
                </p>
              </div>
            )}

            {error && (
              <div
                role="alert"
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            )}

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                width: "100%",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                disabled={sending}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  minHeight: 40,
                  padding: "0 16px",
                  whiteSpace: "nowrap",
                }}
                onClick={() => {
                  setError("");

                  if (step === "preview") {
                    setStep("compose");
                  } else {
                    onClose();
                  }
                }}
              >
                {step === "preview" ? "Back" : "Cancel"}
              </button>

              {step === "compose" ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    minHeight: 40,
                    padding: "0 16px",
                    whiteSpace: "nowrap",
                  }}
                  disabled={!valid}
                  onClick={() => {
                    setError("");
                    setStep("preview");
                  }}
                >
                  <Eye size={16} />
                  Preview
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    minHeight: 40,
                    padding: "0 16px",
                    whiteSpace: "nowrap",
                  }}
                  disabled={!valid || sending}
                  onClick={handleSend}
                >
                  {sending ? (
                    <>
                      <RotateCw size={16} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Confirm & Send
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


export default function ClassHealthDashboard({ classId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkRecipients, setBulkRecipients] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchHealth = async () => {
      if (!classId) {
        setData(null);
        setLoading(false);
        setError("Missing class ID");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getClassHealthSnapshot(classId);

        if (cancelled) return;

        if (response?.success === false) {
          throw new Error(
            response.message || "Failed to load health data"
          );
        }

        setData(response.data);
      } catch (err) {
        if (cancelled) return;

        setData(null);
        setError(
          err.response?.data?.message ||
          err.message ||
          "Không thể tải dữ liệu Class Health."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchHealth();

    return () => {
      cancelled = true;
    };
  }, [classId, refreshKey]);

  const students = useMemo(
    () => Array.isArray(data?.students) ? data.students : [],
    [data]
  );

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !keyword ||
        [
          student.fullName,
          student.studentCode,
          student.email,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(keyword)
          );

      const matchesRisk =
        riskFilter === "all" ||
        (riskFilter === "warnings"
          ? getStudentWarnings(student).length > 0
          : student.riskLevel === riskFilter);

      return matchesSearch && matchesRisk;
    });
  }, [students, search, riskFilter]);

  const selectedStudents = useMemo(
    () => students.filter((student) =>
      selectedIds.includes(student.studentId)
    ),
    [students, selectedIds]
  );

  const toggleStudent = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleAllVisible = () => {
    const ids = filteredStudents.map((s) => s.studentId);
    const allSelected = ids.every((id) =>
      selectedIds.includes(id)
    );

    if (allSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !ids.includes(id))
      );
    } else {
      setSelectedIds((current) => [
        ...new Set([...current, ...ids]),
      ]);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        Loading Class Health...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 24,
          color: "#dc2626",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <AlertTriangle size={24} />
        {error}

        <button
          className="btn btn-secondary"
          onClick={() => setRefreshKey((n) => n + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  const summary = data?.summary || {};

  const allVisibleSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) =>
      selectedIds.includes(student.studentId)
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: "var(--color-ink)",
            }}
          >
            Class Health Dashboard
          </h3>

          <p
            style={{
              fontSize: 12,
              color: "var(--color-ink-muted)",
            }}
          >
            Learning engagement & early warning monitoring
          </p>
        </div>

        <button
          className="btn btn-secondary"
          disabled={loading}
          onClick={() => {
            setSelectedIds([]);
            setRefreshKey((n) => n + 1);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <RotateCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(145px, 1fr))",
          gap: 12,
        }}
      >
        <SummaryCard
          title="Total Students"
          value={summary.totalStudents ?? students.length}
          icon={Users}
          color="var(--color-primary)"
        />

        <SummaryCard
          title="High Risk"
          value={summary.highRisk}
          icon={AlertTriangle}
          color="#dc2626"
        />

        <SummaryCard
          title="Medium Risk"
          value={summary.mediumRisk}
          icon={Activity}
          color="#d97706"
        />

        <SummaryCard
          title="Low Risk"
          value={summary.lowRisk}
          icon={CheckCircle2}
          color="#16a34a"
        />

        <SummaryCard
          title="Insufficient Data"
          value={summary.insufficientData}
          icon={Info}
          color="#64748b"
        />
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            flex: 1,
            minWidth: 0,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 200px",
              minWidth: 0,
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-ink-muted)",
              }}
            />

            <input
              className="input"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: 38,
                paddingLeft: 36,
                boxSizing: "border-box",
              }}
            />
          </div>

          <select
            className="input"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{
              height: 38,
              minWidth: 150,
            }}
          >
            <option value="all">All Students</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
            <option value="insufficient_data">
              Insufficient Data
            </option>
            <option value="warnings">
              Early Warnings
            </option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          disabled={selectedStudents.length === 0 || loading}
          onClick={() => {
            setBulkRecipients([...selectedStudents]);
            setIsBulkOpen(true);
          }}
          style={{
            height: 38,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}
        >
          <Bell size={16} />
          Bulk Notify ({selectedStudents.length})
        </button>
      </div>

      {/* Select All */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 12,
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={allVisibleSelected}
            disabled={filteredStudents.length === 0}
            onChange={toggleAllVisible}
          />

          Select all visible
        </label>

        <span style={{ color: "var(--color-ink-muted)" }}>
          {filteredStudents.length} students
        </span>
      </div>

      {/* Students */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {filteredStudents.length === 0 ? (
          <div
            className="card"
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--color-ink-muted)",
            }}
          >
            <Users size={32} style={{ marginBottom: 12 }} />

            <p>
              {students.length === 0
                ? "No students found in this class."
                : "No students match your filters."}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const risk = getRiskConfig(student.riskLevel);

            const factors = student.riskFactors || {};
            const streak = factors.streak || {};
            const quiz = factors.quiz || {};
            const assignment = factors.assignment || {};
            const warnings = getStudentWarnings(student);

            const isSelected = selectedIds.includes(
              student.studentId
            );

            return (
              <div
                className="card"
                key={student.studentId}
                style={{
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  border: isSelected
                    ? "1px solid var(--color-primary)"
                    : "1px solid var(--color-border)",
                }}
              >
                {/* Student Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        toggleStudent(student.studentId)
                      }
                      aria-label={`Select ${student.fullName}`}
                    />

                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: "var(--color-ink)",
                        }}
                      >
                        {student.fullName || "Unknown Student"}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--color-ink-muted)",
                        }}
                      >
                        {student.studentCode || "No Code"}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <RiskBadge level={student.riskLevel} />

                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        color: risk.color,
                      }}
                    >
                      {student.riskScore == null
                        ? "—"
                        : `${student.riskScore}/100`}
                    </span>
                  </div>
                </div>

                {/* Learning Signals */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(155px, 1fr))",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      padding: 12,
                      background: "var(--color-primary-bg)",
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      <Flame size={16} color="#ea580c" />
                      <strong style={{ fontSize: 12 }}>
                        Streak
                      </strong>
                    </div>

                    <div style={{ fontSize: 12 }}>
                      Current: {student.currentStreak ?? "—"}
                    </div>

                    <div style={{ fontSize: 12 }}>
                      Last 7 days: {streak.activeDays7d ?? "—"}
                    </div>

                    <div style={{ fontSize: 11, opacity: 0.75 }}>
                      Last activity:{" "}
                      {formatDate(student.lastActivityDate)}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 12,
                      background: "var(--color-primary-bg)",
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      <BookOpen size={16} color="#2563eb" />
                      <strong style={{ fontSize: 12 }}>
                        Quiz
                      </strong>
                    </div>

                    <div style={{ fontSize: 12 }}>
                      Completed: {quiz.completedTests ?? "—"}
                    </div>

                    <div style={{ fontSize: 12 }}>
                      Accuracy:{" "}
                      {quiz.recentAccuracy == null
                        ? "N/A"
                        : `${quiz.recentAccuracy}%`}
                    </div>

                    <div style={{ fontSize: 11, opacity: 0.75 }}>
                      Low recent tests: {quiz.lowRecentTests ?? 0}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 12,
                      background: "var(--color-primary-bg)",
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      <ClipboardList
                        size={16}
                        color="#7c3aed"
                      />

                      <strong style={{ fontSize: 12 }}>
                        Assignment
                      </strong>
                    </div>

                    <div style={{ fontSize: 12 }}>
                      Due: {assignment.totalDue ?? "—"}
                    </div>

                    <div style={{ fontSize: 12 }}>
                      Submitted: {assignment.submitted ?? "—"}
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: Number(assignment.overdue || 0) > 0
                          ? "#dc2626"
                          : "var(--color-ink)",
                      }}
                    >
                      Overdue: {assignment.overdue ?? "—"}
                    </div>
                  </div>
                </div>

                {/* Early Warnings */}
                {warnings.length > 0 && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: "#fffbeb",
                      color: "#92400e",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 8,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      <AlertTriangle size={15} />
                      Early Warnings
                    </div>

                    {warnings.map((warning, index) => (
                      <div
                        key={index}
                        style={{
                          fontSize: 12,
                          padding: "3px 0",
                        }}
                      >
                        • {warning}
                      </div>
                    ))}
                  </div>
                )}

                {/* Missing Signals */}
                {student.riskLevel === "insufficient_data" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      fontSize: 11,
                      color: "var(--color-ink-muted)",
                    }}
                  >
                    <Info size={15} style={{ flexShrink: 0 }} />

                    <span>
                      Chưa đủ dữ liệu để tính Risk Score.
                      {" "}
                      {student.missingSignals?.length > 0 &&
                        `Thiếu: ${student.missingSignals.join(", ")}.`}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer note */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          fontSize: 11,
          color: "var(--color-ink-muted)",
        }}
      >
        <Info size={15} style={{ flexShrink: 0 }} />

        <span>
          Risk Score là chỉ số cảnh báo học tập dựa trên quy tắc,
          không phải xác suất dự báo trượt môn hay bỏ học.
          Giảng viên cần xem xét dữ liệu trước khi liên hệ sinh viên.
        </span>
      </div>

      {/* Bulk Notify Preview */}


      {isBulkOpen && (
        <BulkNotifyPreview
          classId={classId}
          students={bulkRecipients}
          onClose={() => {
            setIsBulkOpen(false);
            setBulkRecipients([]);
          }}
          onSent={() => {
            // Xóa selection trên Dashboard sau khi gửi thành công.
            // Không ảnh hưởng danh sách người nhận trong Modal.
            setSelectedIds([]);
          }}
        />
      )}

    </div>
  );
}
