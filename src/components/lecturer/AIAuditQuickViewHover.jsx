import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye,
  Puzzle,
  Layers,
  Boxes,
  GitBranch,
  Lightbulb,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

/**
 * 5 Computational Thinking Standard Rubrics Metadata
 */
const COMPUTATIONAL_THINKING_RUBRICS = [
  {
    key: 'decomposition',
    name: 'Decomposition',
    viName: 'Phân rã bài toán',
    icon: Puzzle,
    iconColor: '#f27024',
    iconBg: '#fff7ed',
  },
  {
    key: 'pattern',
    name: 'Pattern Recognition',
    viName: 'Nhận diện mẫu & quy luật',
    icon: Layers,
    iconColor: '#4f46e5',
    iconBg: '#eef2ff',
  },
  {
    key: 'abstraction',
    name: 'Abstraction',
    viName: 'Trừu tượng hóa & Mô hình',
    icon: Boxes,
    iconColor: '#0891b2',
    iconBg: '#ecfeff',
  },
  {
    key: 'algorithmic',
    name: 'Algorithmic Thinking',
    viName: 'Tư duy thuật toán',
    icon: GitBranch,
    iconColor: '#059669',
    iconBg: '#ecfdf5',
  },
  {
    key: 'reflection',
    name: 'Reflection',
    viName: 'Phản tư & Đánh giá giải pháp',
    icon: Lightbulb,
    iconColor: '#d97706',
    iconBg: '#fffbeb',
  },
];

/**
 * Robust safe data parser supporting both camelCase and snake_case schemas:
 * - prompt / prompt_used / promptUsed / promptContent / input_used
 * - responseSummary / response_summary / aiResponse / ai_response / aiRespond
 * - reflection / self_reflection / selfReflection / studentReflection
 * - aiTool / ai_tool / tool / toolUsed
 * - decision / decisionStatus / decision_status
 */
export function parseDeclarationData(declarationData) {
  if (!declarationData) return null;

  let raw = declarationData;

  if (typeof raw === 'string') {
    let trimmed = raw.trim();
    if (trimmed.toLowerCase().startsWith('note:')) {
      trimmed = trimmed.substring(5).trim();
    }
    try {
      raw = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  if (!raw || typeof raw !== 'object') return null;

  let decs = raw.declarations || raw.aiAuditLog || raw;

  // Handle array structure (e.g. mapped phases in LecturerGradingPage)
  if (Array.isArray(decs)) {
    const map = {};
    decs.forEach((item) => {
      const key = (item.phaseKey || item.rubricKey || item.key || item.name || '').toLowerCase();
      map[key] = {
        aiTool: item.aiTool || item.ai_tool || item.tool,
        decision: item.decision || item.decisionStatus || item.decision_status,
        prompt: item.prompt || item.prompt_used || item.promptUsed,
        responseSummary: item.aiResponseSummary || item.ai_response_summary || item.responseSummary || item.aiResponse || item.response,
        reflection: item.studentReflection || item.student_reflection || item.selfReflection || item.reflection,
        isCompleted: true,
      };
    });
    decs = map;
  }

  const rubrics = COMPUTATIONAL_THINKING_RUBRICS.map((r) => {
    const found =
      decs[r.key] ||
      decs[r.name] ||
      decs[r.key.toLowerCase()] ||
      (r.key === 'pattern' ? (decs.patternRecognition || decs.pattern_recognition || decs['Pattern Recognition']) : null) ||
      (r.key === 'algorithmic' ? (decs.algorithmicThinking || decs.algorithmic_thinking || decs['Algorithmic Thinking']) : null) ||
      (r.key === 'reflection' ? (decs.aiReflection || decs.ai_reflection || decs['AI Reflection']) : null);

    if (found && typeof found === 'object') {
      const aiTool =
        found.aiTool ||
        found.ai_tool ||
        found.tool ||
        found.ai_tool_used ||
        found.toolUsed ||
        found.tool_used ||
        '';

      const decision =
        found.decision ||
        found.decisionStatus ||
        found.decision_status ||
        found.yourDecision ||
        found.your_decision ||
        '';

      const prompt =
        found.prompt ||
        found.prompt_used ||
        found.promptUsed ||
        found.promptContent ||
        found.prompt_content ||
        found.inputUsed ||
        found.input_used ||
        '';

      const responseSummary =
        found.responseSummary ||
        found.response_summary ||
        found.aiResponseSummary ||
        found.ai_response_summary ||
        found.aiRespond ||
        found.ai_respond ||
        found.aiResponse ||
        found.ai_response ||
        found.response ||
        found.output ||
        '';

      const reflection =
        found.reflection ||
        found.selfReflection ||
        found.self_reflection ||
        found.studentReflection ||
        found.student_reflection ||
        found.evaluation ||
        found.self_evaluation ||
        '';

      const isCompleted = Boolean(aiTool || decision || prompt || responseSummary || reflection);

      return {
        ...r,
        aiTool: aiTool || 'Not Declared',
        decision: decision || 'Not Declared',
        prompt,
        responseSummary,
        reflection,
        isCompleted,
      };
    }

    return {
      ...r,
      aiTool: 'Not Declared',
      decision: 'Not Declared',
      prompt: '',
      responseSummary: '',
      reflection: '',
      isCompleted: false,
    };
  });

  const completedCount = rubrics.filter(
    (r) => r.isCompleted && r.decision !== 'Not Declared'
  ).length;

  const isDeclared = completedCount > 0 || raw.isDeclared === true;

  return {
    isDeclared,
    completedCount,
    totalCount: COMPUTATIONAL_THINKING_RUBRICS.length,
    rubrics,
  };
}

/**
 * AI Tool Badge Styles
 */
export function getToolBadgeStyle(tool) {
  const t = (tool || '').toLowerCase();
  if (t.includes('chatgpt') || t.includes('gpt')) {
    return {
      bg: '#ecfdf5',
      color: '#047857',
      border: '#a7f3d0',
      label: tool || 'ChatGPT',
    };
  }
  if (t.includes('claude')) {
    return {
      bg: '#fffbeb',
      color: '#b45309',
      border: '#fde68a',
      label: tool || 'Claude',
    };
  }
  if (t.includes('gemini')) {
    return {
      bg: '#eef2ff',
      color: '#4338ca',
      border: '#c7d2fe',
      label: tool || 'Gemini',
    };
  }
  if (t.includes('copilot') || t.includes('github')) {
    return {
      bg: '#f1f5f9',
      color: '#1e293b',
      border: '#cbd5e1',
      label: tool || 'GitHub Copilot',
    };
  }
  if (t.includes('deepseek')) {
    return {
      bg: '#ecfeff',
      color: '#0e7490',
      border: '#a5f3fc',
      label: tool || 'DeepSeek',
    };
  }
  if (t === 'not declared' || !t || t === '-') {
    return {
      bg: '#f8fafc',
      color: '#94a3b8',
      border: '#e2e8f0',
      label: 'Chưa khai báo',
    };
  }
  return {
    bg: '#f1f5f9',
    color: '#475569',
    border: '#cbd5e1',
    label: tool,
  };
}

/**
 * Decision Badge Styles
 */
export function getDecisionBadgeStyle(decision) {
  const d = (decision || '').toLowerCase();
  if (d.includes('accept') || d === 'accepted' || d === 'fully accepted') {
    return {
      bg: '#ecfdf5',
      color: '#047857',
      border: '#a7f3d0',
      label: 'Accepted',
    };
  }
  if (d.includes('partially') || d === 'modified' || d === 'partially modified') {
    return {
      bg: '#eff6ff',
      color: '#1d4ed8',
      border: '#bfdbfe',
      label: 'Modified',
    };
  }
  if (d.includes('heavily') || d.includes('adapted') || d === 'heavily adapted') {
    return {
      bg: '#fffbeb',
      color: '#b45309',
      border: '#fde68a',
      label: 'Heavily Adapted',
    };
  }
  if (d.includes('reject') || d === 'rejected') {
    return {
      bg: '#fff1f2',
      color: '#be123c',
      border: '#fecdd3',
      label: 'Rejected',
    };
  }
  return {
    bg: '#f8fafc',
    color: '#94a3b8',
    border: '#e2e8f0',
    label: 'Not Declared',
  };
}

/**
 * AIAuditQuickViewHover Component
 *
 * Full-scale Quick View Subwindow Modal:
 * - Size: w-[80vw] max-w-5xl h-[75vh]
 * - Centered via fixed inset-0 z-[9999] with backdrop blur
 * - 4 Rich Columns:
 *   1. Rubric & AI Tool + Decision badges
 *   2. Prompt / Input Used (code block box)
 *   3. AI Respond Summary (soft blue box)
 *   4. Student Self-Reflection & Evaluation (soft amber box)
 * - Safe hover debouncing (220ms buffer)
 */
export default function AIAuditQuickViewHover({
  declarationData,
  studentName = '',
  studentCode = '',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef(null);

  const parsedData = parseDeclarationData(declarationData);
  const isDeclared = parsedData?.isDeclared && parsedData?.completedCount > 0;

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 220); // 220ms buffer to safely transition between eye icon & subwindow
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard accessibility: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* TRIGGER BUTTON (ROUND EYE ICON) */}
      <button
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Xem nhanh AI Audit"
        title="Quick view: AI Audit Log (5 Tiêu chí Computational Thinking)"
        className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-150 cursor-pointer outline-none relative ${
          isDeclared
            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200 shadow-xs'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-400 border-slate-200'
        } ${className}`}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
        }}
      >
        <Eye size={16} />
        {/* Active notification indicator */}
        {isDeclared && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
            style={{ width: '9px', height: '9px' }}
          />
        )}
      </button>

      {/* FULL-SCALE SUBWINDOW MODAL (PORTAL) */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none transition-all duration-200"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(3px)',
              pointerEvents: 'none',
            }}
          >
            {/* CSS SCROLLBAR RULES */}
            <style>{`
              .edux-ai-scroll::-webkit-scrollbar {
                width: 6px;
                height: 6px;
              }
              .edux-ai-scroll::-webkit-scrollbar-track {
                background: #f8fafc;
                border-radius: 4px;
              }
              .edux-ai-scroll::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
              }
              .edux-ai-scroll::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}</style>

            {/* MODAL CARD: w-[80vw] max-w-5xl h-[75vh] flex flex-col overflow-hidden */}
            <div
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="pointer-events-auto flex flex-col h-[75vh] w-[80vw] max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
              style={{
                pointerEvents: 'auto',
                width: '80vw',
                maxWidth: '1080px',
                height: '75vh',
                backgroundColor: '#ffffff',
                borderRadius: '18px',
                border: '1px solid #e2e8f0',
                boxShadow:
                  '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* 1. HEADER */}
              <div
                className="px-7 py-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0"
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: '1px solid #dbeafe',
                    }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#0f172a',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      BÁO CÁO CHI TIẾT KHAI BÁO LIÊM CHÍNH AI (AI AUDIT LOG)
                    </h2>
                    <p
                      style={{
                        fontSize: '11.5px',
                        color: '#64748b',
                        margin: '3px 0 0 0',
                      }}
                    >
                      Sinh viên:{' '}
                      <strong style={{ color: '#1e293b' }}>
                        {studentName || 'Sinh viên'}
                      </strong>
                      {studentCode ? ` (MSSV: ${studentCode})` : ''} • 5 Tiêu chí Computational Thinking
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Status Badge */}
                  {isDeclared ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        backgroundColor: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        fontSize: '11px',
                        fontWeight: '700',
                      }}
                    >
                      <CheckCircle2 size={13} />
                      {parsedData.completedCount}/5 Rubrics Declared
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        backgroundColor: '#f8fafc',
                        color: '#64748b',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      <AlertCircle size={13} />
                      Chưa khai báo AI
                    </span>
                  )}

                  {/* Close button X */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      padding: '6px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s, background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#334155';
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title="Đóng bảng (Esc)"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* 2. BODY TABLE AREA (INDEPENDENT SCROLL) */}
              <div
                className="overflow-y-auto flex-1 p-6 edux-ai-scroll"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px 24px',
                  backgroundColor: '#ffffff',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    textAlign: 'left',
                  }}
                >
                  <thead
                    className="sticky top-0 bg-white border-b border-gray-200 z-10"
                    style={{
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#ffffff',
                      borderBottom: '2px solid #e2e8f0',
                      zIndex: 10,
                    }}
                  >
                    <tr
                      style={{
                        color: '#475569',
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                      }}
                    >
                      <th style={{ padding: '0 12px 10px 4px', width: '22%' }}>
                        RUBRIC & AI TOOL
                      </th>
                      <th style={{ padding: '0 12px 10px 12px', width: '26%' }}>
                        PROMPT / INPUT USED
                      </th>
                      <th style={{ padding: '0 12px 10px 12px', width: '26%' }}>
                        AI RESPOND SUMMARY
                      </th>
                      <th style={{ padding: '0 4px 10px 12px', width: '26%' }}>
                        STUDENT SELF-REFLECTION & EVALUATION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData?.rubrics?.map((r, idx) => {
                      const IconComp = r.icon || Puzzle;
                      const toolStyle = getToolBadgeStyle(r.aiTool);
                      const decStyle = getDecisionBadgeStyle(r.decision);

                      return (
                        <tr
                          key={r.key || idx}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          {/* CỘT 1: RUBRIC & AI TOOL */}
                          <td
                            style={{
                              padding: '16px 12px 16px 4px',
                              verticalAlign: 'top',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {/* Rubric Name & Icon */}
                              <div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    fontWeight: '800',
                                    color: '#0f172a',
                                    fontSize: '12.5px',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: '22px',
                                      height: '22px',
                                      borderRadius: '6px',
                                      backgroundColor: r.iconBg,
                                      color: r.iconColor,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}
                                  >
                                    <IconComp size={13} />
                                  </div>
                                  <span>{r.name}</span>
                                </div>
                                <div
                                  style={{
                                    fontSize: '10.5px',
                                    color: '#64748b',
                                    marginTop: '2px',
                                    paddingLeft: '29px',
                                    fontWeight: '500',
                                  }}
                                >
                                  {r.viName}
                                </div>
                              </div>

                              {/* Badges Container: AI Tool & Decision */}
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px',
                                  paddingLeft: '4px',
                                }}
                              >
                                {/* AI Tool Badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600' }}>
                                    Tool:
                                  </span>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      fontSize: '10.5px',
                                      fontWeight: '700',
                                      backgroundColor: toolStyle.bg,
                                      color: toolStyle.color,
                                      border: `1px solid ${toolStyle.border}`,
                                      maxWidth: '135px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                    title={`AI Tool: ${r.aiTool}`}
                                  >
                                    {toolStyle.label}
                                  </span>
                                </div>

                                {/* Decision Badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600' }}>
                                    Status:
                                  </span>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      fontSize: '10.5px',
                                      fontWeight: '700',
                                      backgroundColor: decStyle.bg,
                                      color: decStyle.color,
                                      border: `1px solid ${decStyle.border}`,
                                      maxWidth: '135px',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                    title={`Decision: ${r.decision}`}
                                  >
                                    {decStyle.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* CỘT 2: PROMPT / INPUT USED */}
                          <td
                            style={{
                              padding: '16px 12px',
                              verticalAlign: 'top',
                            }}
                          >
                            <div
                              className="edux-ai-scroll"
                              style={{
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                fontSize: '11px',
                                color: '#334155',
                                fontFamily:
                                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '144px',
                                overflowY: 'auto',
                                lineHeight: '1.5',
                              }}
                            >
                              {r.prompt ? (
                                r.prompt
                              ) : (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic', fontFamily: 'inherit' }}>
                                  Không có nội dung câu lệnh (Prompt)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* CỘT 3: AI RESPOND SUMMARY */}
                          <td
                            style={{
                              padding: '16px 12px',
                              verticalAlign: 'top',
                            }}
                          >
                            <div
                              className="edux-ai-scroll"
                              style={{
                                backgroundColor: 'rgba(239, 246, 255, 0.6)',
                                border: '1px solid #dbeafe',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                fontSize: '11.5px',
                                color: '#334155',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '144px',
                                overflowY: 'auto',
                                lineHeight: '1.5',
                              }}
                            >
                              {r.responseSummary ? (
                                r.responseSummary
                              ) : (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                  Không có tóm tắt phản hồi của AI
                                </span>
                              )}
                            </div>
                          </td>

                          {/* CỘT 4: STUDENT SELF-REFLECTION & EVALUATION */}
                          <td
                            style={{
                              padding: '16px 4px 16px 12px',
                              verticalAlign: 'top',
                            }}
                          >
                            <div
                              className="edux-ai-scroll"
                              style={{
                                backgroundColor: 'rgba(255, 251, 235, 0.65)',
                                border: '1px solid #fef3c7',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                fontSize: '11.5px',
                                color: '#1e293b',
                                fontWeight: '500',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '144px',
                                overflowY: 'auto',
                                lineHeight: '1.55',
                              }}
                            >
                              {r.reflection ? (
                                r.reflection
                              ) : (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 'normal' }}>
                                  Không có phản tư / đánh giá của sinh viên
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 3. FOOTER */}
              <div
                className="px-7 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0"
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
                  fontSize: '11px',
                  color: '#475569',
                }}
              >
                <span>
                  💡 <strong>Ghi chú:</strong> Di chuyển chuột ra ngoài để đóng xem nhanh. Bấm <strong>"Sửa điểm"</strong> ở danh sách để thẩm định và cho điểm trên từng tiêu chí Rubric.
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '5px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '11px',
                    color: '#334155',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  Đóng (Esc)
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
