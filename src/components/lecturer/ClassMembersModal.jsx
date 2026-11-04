import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Users, X, Flame, RotateCw, Activity, AlertCircle } from "lucide-react";
import ClassService from "../../services/class.service";
import ClassHealthDashboard from "./ClassHealthDashboard";

export default function ClassMembersModal({ isOpen, onClose, classId, classData }) {
  const [activeTab, setActiveTab] = useState("members");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refreshMembers = useCallback(() => setRefreshIndex((index) => index + 1), []);

  useEffect(() => {
    if (!isOpen || !classId) return;
    let cancelled = false;

    async function loadMembers() {
      setLoading(true);
      setError(null);
      try {
        const response = await ClassService.getClassMembers(classId);
        if (cancelled) return;
        if (response?.success === false) {
          throw new Error(response.message || "Failed to fetch members");
        }
        const payload = response?.data ?? response;
        if (!Array.isArray(payload) && !Array.isArray(payload?.data)) {
          throw new Error("Invalid members API response");
        }
        setMembers(Array.isArray(payload) ? payload : payload.data);
      } catch (err) {
        if (cancelled) return;
        setMembers([]);
        setError(err.response?.data?.message || err.message || "Không thể tải danh sách sinh viên.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMembers();
    return () => { cancelled = true; };
  }, [isOpen, classId, refreshIndex]);

  useEffect(() => {
    if (isOpen) setActiveTab("members");
  }, [isOpen, classId]);

  useEffect(() => {
    if (!isOpen) return;
    const onEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabStyle = (active) => ({
    border: "none",
    borderBottom: active ? "2px solid var(--color-primary)" : "2px solid transparent",
    background: "transparent",
    color: active ? "var(--color-primary)" : "var(--color-ink-muted)",
    fontWeight: active ? 700 : 500,
    fontSize: "13px",
    padding: "12px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    cursor: "pointer",
  });

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div className="card" role="dialog" aria-modal="true" aria-label="Class Members and Health Dashboard"
        style={{ width: "100%", maxWidth: "1050px", maxHeight: "85vh", display: "flex", flexDirection: "column", padding: "24px", background: "var(--color-surface)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", paddingBottom: "14px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", color: "var(--color-ink)" }}>Class Members</h2>
            <p style={{ fontSize: "12px", color: "var(--color-ink-muted)", margin: "4px 0 0" }}>
              {classData?.class_code || classData?.class_name || "Class"} · {loading ? "Loading..." : error ? "Members unavailable" : `${members.length} students`}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button type="button" className="btn btn-secondary" onClick={refreshMembers} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <RotateCw size={16} /> Refresh
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} aria-label="Close modal" style={{ display: "inline-flex", alignItems: "center" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div role="tablist" aria-label="Class member sections" style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--color-border)" }}>
          <button type="button" role="tab" aria-selected={activeTab === "members"} onClick={() => setActiveTab("members")} style={tabStyle(activeTab === "members")}>
            <Users size={16} /> Members
          </button>
          <button type="button" role="tab" aria-selected={activeTab === "health"} onClick={() => setActiveTab("health")} style={tabStyle(activeTab === "health")}>
            <Activity size={16} /> Health Dashboard
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingTop: "16px" }}>
          {activeTab === "members" ? (
            loading ? <p style={{ color: "var(--color-ink-muted)" }}>Loading members...</p>
              : error ? <div role="alert" style={{ display: "flex", gap: "8px", color: "#dc2626", alignItems: "center" }}><AlertCircle size={18} />{error}</div>
                : members.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-ink-muted)" }}>
                    <Users size={40} style={{ margin: "0 auto 12px" }} /><p>No members found in this class.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {members.map((member, index) => {
                      const studentId = member.studentId || member.student_id;
                      const name = member.fullName || member.full_name || member.name || "N/A";
                      const code = member.studentCode || member.student_code || "No Code";
                      const streak = member.currentStreak ?? member.current_streak;
                      return (
                        <div key={studentId || `${code}-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "12px 16px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-ink)" }}>{name}</div>
                            <div style={{ fontSize: "12px", color: "var(--color-ink-muted)" }}>{code}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#ea580c", fontSize: "13px", fontWeight: 600 }}>
                            <Flame size={16} />{streak ?? "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
          ) : (
            <ClassHealthDashboard classId={classId} members={members} membersLoading={loading} membersError={error} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
