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
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { normalizeAuditData } from '../../helper/aiAuditHelper';

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
 * Lấy danh sách active rubric keys từ cấu hình assignment
 */
export function getActiveRubricKeysFromAssignment(assignment) {
  const configs = assignment?.rubric_configs || assignment?.rubricConfigs;
  if (!configs || !Array.isArray(configs) || configs.length === 0) {
    return null;
  }
  const enabled = configs.filter((c) => c.is_enabled !== false);
  if (enabled.length === 0) return null;

  const KEY_MAP = {
    PROBLEM_ABSTRACTION: 'decomposition',
    DECOMPOSITION: 'decomposition',
    PATTERN_RECOGNITION: 'pattern',
    PATTERN: 'pattern',
    GENERALIZATION: 'pattern',
    ABSTRACTION: 'abstraction',
    IMPLEMENTATION_QUALITY: 'abstraction',
    ALGORITHMIC_THINKING: 'algorithmic',
    ALGORITHMIC: 'algorithmic',
    AI_INTERACTION: 'algorithmic',
    CRITICAL_EVALUATION: 'reflection',
    REFLECTION: 'reflection',
    ETHICAL_IMPACT: 'reflection',
    AI_EVALUATION: 'reflection',
    METACOGNITIVE_REFLECTION: 'reflection',
  };

  const keys = new Set();
  enabled.forEach((c) => {
    const rawKey = c.criterion_key || c.key || '';
    const upper = String(rawKey).toUpperCase();
    const lower = String(rawKey).toLowerCase();
    if (KEY_MAP[upper]) {
      keys.add(KEY_MAP[upper]);
    } else if (['decomposition', 'pattern', 'abstraction', 'algorithmic', 'reflection'].includes(lower)) {
      keys.add(lower);
    }
  });

  return keys.size > 0 ? Array.from(keys) : null;
}

/**
 * Robust safe data parser supporting both camelCase and snake_case schemas:
 * - Uses normalizeAuditData helper for 100% backward compatibility
 */
export function parseDeclarationData(declarationData) {
  const fallbackRubrics = COMPUTATIONAL_THINKING_RUBRICS.map((r) => ({
    ...r,
    aiTool: 'N/A',
    decision: 'Not Declared',
    prompt: '',
    responseSummary: '',
    reflection: '',
    isCompleted: false,
    isPartiallyFilled: false,
    hasPrompt: false,
    hasResponse: false,
    hasReflection: false,
  }));

  const fallbackData = {
    isDeclared: false,
    no_ai_used: false,
    no_ai_note: '',
    completedCount: 0,
    totalCount: 5,
    scopes: [
      {
        scopeId: 'scope-1',
        id: 'scope-1',
        scope_title: 'Khai báo 1',
        title: 'Khai báo 1',
        scope_description: '',
        description: '',
        rubrics: fallbackRubrics,
        completedCount: 0,
      },
    ],
    rubrics: fallbackRubrics,
  };

  if (!declarationData) return fallbackData;

  const normalized = normalizeAuditData(declarationData);
  const no_ai_used = Boolean(
    declarationData?.no_ai_used === true ||
    declarationData?.no_ai_used === 'true' ||
    declarationData?.noAiUsed === true ||
    declarationData?.noAiUsed === 'true' ||
    normalized?.no_ai_used === true ||
    normalized?.no_ai_used === 'true' ||
    normalized?.noAiUsed === true ||
    normalized?.noAiUsed === 'true'
  );
  const no_ai_note =
    declarationData?.no_ai_note ||
    declarationData?.noAiNote ||
    normalized?.no_ai_note ||
    normalized?.noAiNote ||
    '';

  if (!normalized || !Array.isArray(normalized.scopes) || normalized.scopes.length === 0) {
    return {
      ...fallbackData,
      isDeclared: no_ai_used,
      no_ai_used,
      no_ai_note,
      completedCount: no_ai_used ? 5 : 0,
    };
  }

  const parsedScopes = normalized.scopes.map((scope, idx) => {
    const rubrics = parseSingleScopeDeclarations(scope.declarations);
    const completedCount = rubrics.filter((r) => r.isCompleted).length;
    const title = scope.scope_title || scope.title || `Khai báo ${idx + 1}`;
    const desc = scope.scope_description || scope.description || '';

    return {
      scopeId: scope.id || scope.scopeId || `scope-${idx + 1}`,
      id: scope.id || scope.scopeId || `scope-${idx + 1}`,
      scope_title: title,
      title: title,
      scope_description: desc,
      description: desc,
      rubrics,
      completedCount,
    };
  });

  const totalCompleted = parsedScopes.reduce((a, s) => a + s.completedCount, 0);
  const isDeclared = totalCompleted > 0 || no_ai_used;

  return {
    isDeclared,
    no_ai_used,
    no_ai_note,
    completedCount: no_ai_used ? parsedScopes.length * 5 : totalCompleted,
    totalCount: parsedScopes.length * 5,
    scopes: parsedScopes,
    rubrics: parsedScopes[0]?.rubrics || [],
  };
}

/**
 * Internal helper: parse declarations from a single scope raw object
 */
function parseSingleScopeDeclarations(raw) {
  if (!raw || typeof raw !== 'object') {
    return COMPUTATIONAL_THINKING_RUBRICS.map(r => ({
      ...r,
      aiTool: 'Not Declared',
      decision: 'Not Declared',
      prompt: '',
      responseSummary: '',
      reflection: '',
      isCompleted: false,
      isPartiallyFilled: false,
    }));
  }

  let decs = raw.declarations || raw.aiAuditLog || raw;

  // Handle array structure (e.g. mapped phases in LecturerGradingPage)
  if (Array.isArray(decs)) {
    const map = {};
    decs.forEach((item) => {
      const key = (item.phaseKey || item.rubricKey || item.key || item.name || '').toLowerCase();
      const prompt = (item.prompt || item.prompt_used || item.promptUsed || '').trim();
      const responseSummary = (item.aiResponseSummary || item.ai_response_summary || item.responseSummary || item.aiResponse || item.response || '').trim();
      const reflection = (item.studentReflection || item.student_reflection || item.selfReflection || item.reflection || '').trim();
      const isCompleted = prompt.length > 0 && responseSummary.length > 0 && reflection.length > 0;
      map[key] = {
        aiTool: item.aiTool || item.ai_tool || item.tool,
        decision: item.decision || item.decisionStatus || item.decision_status,
        prompt,
        responseSummary,
        reflection,
        isCompleted,
      };
    });
    decs = map;
  }

  return COMPUTATIONAL_THINKING_RUBRICS.map((r) => {
    const found =
      decs[r.key] ||
      decs[r.name] ||
      decs[r.key.toLowerCase()] ||
      (r.key === 'pattern' ? (decs.patternRecognition || decs.pattern_recognition || decs['Pattern Recognition']) : null) ||
      (r.key === 'algorithmic' ? (decs.algorithmicThinking || decs.algorithmic_thinking || decs['Algorithmic Thinking']) : null) ||
      (r.key === 'reflection' ? (decs.aiReflection || decs.ai_reflection || decs['AI Reflection']) : null);

    if (found && typeof found === 'object') {
      const aiTool =
        found.aiTool || found.ai_tool || found.tool || found.ai_tool_used || found.toolUsed || found.tool_used || '';
      const decision =
        found.decision || found.decisionStatus || found.decision_status || found.yourDecision || found.your_decision || '';
      const prompt = (
        found.prompt || found.prompt_used || found.promptUsed || found.promptContent || found.prompt_content || found.inputUsed || found.input_used || ''
      ).trim();
      const responseSummary = (
        found.responseSummary || found.response_summary || found.aiResponseSummary || found.ai_response_summary || found.aiRespond || found.ai_respond || found.aiResponse || found.ai_response || found.response || found.output || ''
      ).trim();
      const reflection = (
        found.reflection || found.selfReflection || found.self_reflection || found.studentReflection || found.student_reflection || found.evaluation || found.self_evaluation || ''
      ).trim();

      const hasPrompt = prompt.length > 0;
      const hasResponse = responseSummary.length > 0;
      const hasReflection = reflection.length > 0;

      // CHỈ TÍNH LÀ HOÀN THÀNH KHI ĐÃ ĐIỀN ĐỦ CẢ 3 MỤC TEXT (Prompt, Response, Reflection)
      // Không lấy việc chọn droplist đơn thuần làm tiêu chí đủ
      const isCompleted = hasPrompt && hasResponse && hasReflection;
      const isPartiallyFilled = (hasPrompt || hasResponse || hasReflection) && !isCompleted;

      // Nếu không có bất kỳ nội dung text nào thì hiển thị Chưa khai báo
      const finalDecision = isCompleted || isPartiallyFilled
        ? (decision || 'Partially Modified')
        : 'Not Declared';

      return {
        ...r,
        aiTool: (hasPrompt || hasResponse || hasReflection) ? (aiTool || 'ChatGPT') : (aiTool && aiTool !== 'ChatGPT' && aiTool !== 'Chưa khai báo' ? aiTool : 'N/A'),
        decision: finalDecision,
        prompt,
        responseSummary,
        reflection,
        isCompleted,
        isPartiallyFilled,
        hasPrompt,
        hasResponse,
        hasReflection,
      };
    }
    return {
      ...r,
      aiTool: 'N/A',
      decision: 'Not Declared',
      prompt: '',
      responseSummary: '',
      reflection: '',
      isCompleted: false,
      isPartiallyFilled: false,
      hasPrompt: false,
      hasResponse: false,
      hasReflection: false,
    };
  });
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
  if (t === 'not declared' || !t || t === '-' || t === 'n/a' || t.includes('chưa') || t.includes('không')) {
    return {
      bg: '#f8fafc',
      color: '#94a3b8',
      border: '#e2e8f0',
      label: 'N/A',
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
 * AIAuditDetailModal Component
 *
 * Full-scale Modal displaying 5 Computational Thinking Standard Rubrics:
 * - Size: w-[80vw] max-w-5xl h-[75vh]
 * - Centered via fixed inset-0 z-[99999] with backdrop blur
 * - 4 Rich Columns:
 *   1. Rubric & AI Tool + Decision badges
 *   2. Prompt / Input Used (code block box)
 *   3. AI Respond Summary (soft blue box)
 *   4. Student Self-Reflection & Evaluation (soft amber box)
 */
export function AIAuditDetailModal({
  isOpen,
  onClose,
  declarationData,
  studentName = '',
  studentCode = '',
  assignment,
  activeRubricKeys = [],
  onMouseEnter,
  onMouseLeave,
}) {
  const [activeScopeIdx, setActiveScopeIdx] = useState(0);

  const tabsContainerRef = useRef(null);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const dragStartXRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const parsedData = parseDeclarationData(declarationData);

  // Derived: current scope's rubrics for display
  const hasScopes = Array.isArray(parsedData?.scopes) && parsedData.scopes.length > 0;

  // Wheel listener: chuyển con lăn chuột dọc (deltaY) thành cuộn ngang cho chuột cắm dây/chuột rời
  useEffect(() => {
    if (!isOpen) return;
    const el = tabsContainerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (el.scrollWidth > el.clientWidth && e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isOpen, hasScopes]);

  const handleTabsMouseDown = (e) => {
    if (e.button !== 0 || !tabsContainerRef.current) return;
    setIsDraggingTabs(true);
    hasMovedRef.current = false;
    dragStartXRef.current = e.pageX;
    scrollStartLeftRef.current = tabsContainerRef.current.scrollLeft;
  };

  const handleTabsMouseMove = (e) => {
    if (!isDraggingTabs || !tabsContainerRef.current) return;
    const diff = e.pageX - dragStartXRef.current;
    if (Math.abs(diff) > 4) {
      hasMovedRef.current = true;
    }
    tabsContainerRef.current.scrollLeft = scrollStartLeftRef.current - diff;
  };

  const handleTabsMouseUp = () => {
    setIsDraggingTabs(false);
  };

  const safeScope = hasScopes
    ? parsedData.scopes[Math.min(activeScopeIdx, parsedData.scopes.length - 1)]
    : null;
  const baseRubrics = safeScope?.rubrics ?? parsedData?.rubrics ?? [];
  const activeKeys = activeRubricKeys || (assignment ? getActiveRubricKeysFromAssignment(assignment) : null);
  const displayRubrics = activeKeys && Array.isArray(activeKeys) && activeKeys.length > 0
    ? baseRubrics.filter((r) => activeKeys.includes(r.key) || r.isCompleted || r.isPartiallyFilled)
    : baseRubrics;

  // Keyboard accessibility: Escape closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-200 pointer-events-none"
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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
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

      {/* MODAL CARD: responsive width & height */}
      <div
        className="pointer-events-auto flex flex-col h-[85vh] max-h-[90vh] w-[92vw] lg:w-[85vw] max-w-5xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          pointerEvents: 'auto',
          width: 'min(92vw, 1080px)',
          maxWidth: '1080px',
          height: 'min(85vh, 780px)',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
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
                      {studentCode ? ` (MSSV: ${studentCode})` : ''} • {displayRubrics.length} Tiêu chí Rubric
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Status Badge */}
                  {parsedData.no_ai_used ? (
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
                      Zero-AI (Tự làm 100%)
                    </span>
                  ) : parsedData.completedCount === parsedData.totalCount ? (
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
                      {hasScopes && parsedData.scopes.length > 1
                        ? `Hoàn tất ${parsedData.completedCount}/${parsedData.totalCount} Rubrics`
                        : `Hoàn tất ${parsedData.completedCount}/${displayRubrics.length} Rubrics`}
                    </span>
                  ) : parsedData.completedCount > 0 ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        backgroundColor: '#fffbeb',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        fontSize: '11px',
                        fontWeight: '700',
                      }}
                    >
                      <AlertCircle size={13} />
                      {hasScopes && parsedData.scopes.length > 1
                        ? `Đang khai báo: ${parsedData.completedCount}/${parsedData.totalCount} Rubrics đầy đủ`
                        : `Đang khai báo: ${parsedData.completedCount}/${displayRubrics.length} Rubrics đầy đủ`}
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
                      {hasScopes && parsedData.scopes.length > 1
                        ? `Chưa hoàn thành khai báo (0/${parsedData.totalCount})`
                        : `Chưa hoàn thành khai báo (0/${displayRubrics.length})`}
                    </span>
                  )}

                  {/* Close button X */}
                  <button
                    type="button"
                    onClick={onClose}
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

              {/* SCOPE TABS (multi-scope mode) */}
              {hasScopes && parsedData.scopes.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 20px 0 20px',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: '#fafbfc',
                    flexShrink: 0,
                    gap: '6px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => tabsContainerRef.current?.scrollBy({ left: -160, behavior: 'smooth' })}
                    style={{
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      borderRadius: '6px',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#64748b',
                      flexShrink: 0,
                    }}
                    title="Cuộn sang trái"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <div
                    ref={tabsContainerRef}
                    onMouseDown={handleTabsMouseDown}
                    onMouseMove={handleTabsMouseMove}
                    onMouseUp={handleTabsMouseUp}
                    onMouseLeave={handleTabsMouseUp}
                    className="edux-tab-scroll"
                    style={{
                      display: 'flex',
                      gap: '6px',
                      overflowX: 'auto',
                      flexWrap: 'nowrap',
                      flex: 1,
                      paddingBottom: '2px',
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 #f8fafc',
                      cursor: isDraggingTabs ? 'grabbing' : 'grab',
                      userSelect: 'none',
                    }}
                  >
                    {parsedData.scopes.map((scope, idx) => {
                      const isActive = idx === Math.min(activeScopeIdx, parsedData.scopes.length - 1);
                      return (
                        <button
                          key={scope.scopeId}
                          type="button"
                          onClick={() => {
                            if (hasMovedRef.current) return;
                            setActiveScopeIdx(idx);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px 8px 0 0',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            border: '1px solid',
                            borderBottom: 'none',
                            transition: 'all 0.12s',
                            whiteSpace: 'nowrap',
                            backgroundColor: isActive ? '#ffffff' : 'transparent',
                            borderColor: isActive ? '#e2e8f0' : 'transparent',
                            color: isActive ? '#1e293b' : '#64748b',
                            boxShadow: isActive ? '0 -2px 0 0 #4f46e5 inset' : 'none',
                          }}
                        >
                          {scope.title}
                          <span style={{
                            marginLeft: '6px',
                            fontSize: '9.5px',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: isActive ? '#eef2ff' : '#f1f5f9',
                            color: isActive ? '#4f46e5' : '#94a3b8',
                            fontWeight: '700',
                          }}>
                            {scope.completedCount}/5
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => tabsContainerRef.current?.scrollBy({ left: 160, behavior: 'smooth' })}
                    style={{
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      borderRadius: '6px',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#64748b',
                      flexShrink: 0,
                    }}
                    title="Cuộn sang phải"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {/* SCOPE DETAIL BANNER (TITLE & DESCRIPTION) */}
              {safeScope && (
                <div
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#e0e7ff',
                          color: '#3730a3',
                        }}
                      >
                        {hasScopes && parsedData.scopes.length > 1
                          ? `Khai báo ${Math.min(activeScopeIdx, parsedData.scopes.length - 1) + 1} / ${parsedData.scopes.length}`
                          : 'Khai báo'}
                      </span>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          fontWeight: '800',
                          color: '#0f172a',
                        }}
                      >
                        {safeScope.scope_title || safeScope.title || 'Khai báo tổng quan'}
                      </h3>
                    </div>
                    {(safeScope.scope_description || safeScope.description) && (
                      <p
                        style={{
                          margin: '4px 0 0 0',
                          fontSize: '11.5px',
                          color: '#475569',
                          lineHeight: '1.4',
                        }}
                      >
                        {safeScope.scope_description || safeScope.description}
                      </p>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', flexShrink: 0 }}>
                    Tiêu chí hoàn thành: <strong style={{ color: safeScope.completedCount === 5 ? '#047857' : safeScope.completedCount > 0 ? '#b45309' : '#64748b' }}>{safeScope.completedCount}/5</strong>
                  </div>
                </div>
              )}

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
                {parsedData.no_ai_used && (
                  <div
                    style={{
                      margin: '0 0 16px 0',
                      padding: '14px 18px',
                      backgroundColor: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: '#d1fae5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#065f46' }}>
                          SINH VIÊN CAM KẾT KHÔNG SỬ DỤNG AI (ZERO-AI / TỰ THỰC HIỆN 100%)
                        </div>
                        <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                          Sinh viên cam kết hoàn thành bài làm độc lập 100%, không sử dụng các công cụ AI hỗ trợ sinh mã hay giải đề.
                        </div>
                      </div>
                    </div>
                    {parsedData.no_ai_note && (
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '8px 12px',
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #d1fae5',
                          fontSize: '11.5px',
                          color: '#1e293b',
                        }}
                      >
                        <strong style={{ color: '#047857' }}>Phương pháp tự thực hiện của sinh viên: </strong>
                        <span style={{ fontStyle: 'italic' }}>{parsedData.no_ai_note}</span>
                      </div>
                    )}
                  </div>
                )}
                {!parsedData.isDeclared && !parsedData.no_ai_used && (
                  <div
                    style={{
                      margin: '0 0 16px 0',
                      padding: '10px 14px',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: '#b45309',
                      fontWeight: '500',
                    }}
                  >
                    <AlertCircle size={16} className="shrink-0 text-amber-600" />
                    <span>Sinh viên chưa thực hiện khai báo AI Audit Log cho bài nộp này. Các tiêu chí dưới đây hiển thị ở trạng thái mặc định (N/A / Not Declared).</span>
                  </div>
                )}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    textAlign: 'left',
                    tableLayout: 'fixed',
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
                    {displayRubrics.map((r, idx) => {
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

                              {/* Badges Container: AI Tool & Decision & Completion */}
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

                                {/* Completion Indicator */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600' }}>
                                    Text:
                                  </span>
                                  {r.isCompleted ? (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        padding: '2px 7px',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        backgroundColor: '#ecfdf5',
                                        color: '#047857',
                                        border: '1px solid #a7f3d0',
                                      }}
                                    >
                                      <CheckCircle2 size={10} /> Đủ 3 mục text
                                    </span>
                                  ) : r.isPartiallyFilled ? (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        padding: '2px 7px',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        backgroundColor: '#fffbeb',
                                        color: '#b45309',
                                        border: '1px solid #fde68a',
                                      }}
                                      title="Cần điền đầy đủ cả 3 mục: Prompt, AI Response và Student Reflection"
                                    >
                                      <AlertCircle size={10} /> Thiếu mục text
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '2px 7px',
                                        borderRadius: '6px',
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        backgroundColor: '#f8fafc',
                                        color: '#94a3b8',
                                        border: '1px solid #e2e8f0',
                                      }}
                                    >
                                      Chưa điền text
                                    </span>
                                  )}
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
                                minHeight: '100px',
                                maxHeight: '144px',
                                overflowY: 'auto',
                                lineHeight: '1.5',
                              }}
                            >
                              {r.prompt ? (
                                r.prompt
                              ) : (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic', fontFamily: 'inherit' }}>
                                  N/A (Chưa khai báo câu lệnh Prompt)
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
                                minHeight: '100px',
                                maxHeight: '144px',
                                overflowY: 'auto',
                                lineHeight: '1.5',
                              }}
                            >
                              {r.responseSummary ? (
                                r.responseSummary
                              ) : (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                  N/A (Chưa khai báo phản hồi AI)
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
                                minHeight: '100px',
                                maxHeight: '144px',
                                overflowY: 'auto',
                                lineHeight: '1.55',
                              }}
                            >
                              {r.reflection ? (
                                r.reflection
                              ) : (
                                <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 'normal' }}>
                                  N/A (Chưa khai báo phản tư)
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
            </div>
          </div>,
          document.body
        );
}

/**
 * AIAuditQuickViewHover Component (Trình kích hoạt icon con mắt xem AI Audit Log)
 */
export default function AIAuditQuickViewHover({
  declarationData,
  studentName = '',
  studentCode = '',
  className = '',
  hasDeclared: hasDeclaredProp = undefined,
  isSubmitted = true,
  assignment = undefined,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const parsedData = parseDeclarationData(declarationData);
  const isZeroAi = Boolean(parsedData?.no_ai_used);
  const hasDeclared =
    typeof hasDeclaredProp === 'boolean'
      ? hasDeclaredProp
      : Boolean(isZeroAi || (parsedData?.isDeclared && parsedData?.completedCount > 0));

  const isDisabled = !isSubmitted;

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (isDisabled) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleModalMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleModalMouseLeave = () => {
    handleMouseLeave();
  };

  const handleClose = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative group inline-block" style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => !isDisabled && setIsOpen(true)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`w-7 h-7 inline-flex items-center justify-center rounded-full transition-all ${
            isDisabled
              ? 'bg-slate-50 text-slate-300 opacity-30 cursor-not-allowed'
              : isZeroAi
              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer active:scale-95'
              : hasDeclared
              ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 cursor-pointer active:scale-95'
              : 'bg-slate-100 text-slate-600 hover:text-purple-600 hover:bg-purple-50 cursor-pointer active:scale-95'
          } ${className}`}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isZeroAi ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.3 : 1,
          }}
          aria-label={
            isDisabled
              ? "Sinh viên chưa nộp bài"
              : isZeroAi
              ? "Sinh viên cam kết không sử dụng AI (Zero-AI)"
              : hasDeclared
              ? "Xem chi tiết khai báo AI Audit"
              : "Xem chi tiết AI Audit (Chưa khai báo)"
          }
          title={
            isDisabled
              ? "Sinh viên chưa nộp bài"
              : isZeroAi
              ? "Sinh viên cam kết không sử dụng AI (Zero-AI)"
              : hasDeclared
              ? "Xem chi tiết khai báo AI Audit"
              : "Xem chi tiết AI Audit (Chưa khai báo)"
          }
        >
          <Eye className="w-4 h-4" size={15} />
        </button>

        {/* Tooltip hiển thị khi hover */}
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '6px',
            zIndex: 999,
            pointerEvents: 'none',
          }}
        >
          <div
            className="bg-slate-800 text-white text-[11px] font-normal px-2.5 py-1 rounded-md shadow-md whitespace-nowrap"
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '6px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            {isDisabled
              ? "Sinh viên chưa nộp bài"
              : isZeroAi
              ? "Sinh viên cam kết không sử dụng AI (Zero-AI)"
              : hasDeclared
              ? "Xem chi tiết khai báo AI Audit"
              : "Xem chi tiết AI Audit (Chưa khai báo)"}
          </div>
          <div
            className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-0.5"
            style={{
              width: '6px',
              height: '6px',
              backgroundColor: '#1e293b',
              transform: 'rotate(45deg)',
              marginTop: '-2px',
            }}
          />
        </div>
      </div>

      <AIAuditDetailModal
        isOpen={isOpen}
        onClose={handleClose}
        onMouseEnter={handleModalMouseEnter}
        onMouseLeave={handleModalMouseLeave}
        declarationData={declarationData}
        studentName={studentName}
        studentCode={studentCode}
        assignment={assignment}
      />
    </>
  );
}

export { AIAuditDetailModal as AIAuditModal };
