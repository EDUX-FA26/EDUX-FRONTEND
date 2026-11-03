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
 * Robust safe data parser supporting both camelCase and snake_case schemas:
 * - Uses normalizeAuditData helper for 100% backward compatibility
 */
export function parseDeclarationData(declarationData) {
  const fallbackRubrics = COMPUTATIONAL_THINKING_RUBRICS.map((r) => ({
    ...r,
    aiTool: 'Chưa khai báo',
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
  if (!normalized || !Array.isArray(normalized.scopes) || normalized.scopes.length === 0) {
    return fallbackData;
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
  const isDeclared = totalCompleted > 0;

  return {
    isDeclared,
    completedCount: totalCompleted,
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
        aiTool: (hasPrompt || hasResponse || hasReflection) ? (aiTool || 'ChatGPT') : (aiTool && aiTool !== 'ChatGPT' ? aiTool : 'Chưa khai báo'),
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
      aiTool: 'Chưa khai báo',
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
  const [activeScopeIdx, setActiveScopeIdx] = useState(0);
  const closeTimeoutRef = useRef(null);

  const tabsContainerRef = useRef(null);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const dragStartXRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const parsedData = parseDeclarationData(declarationData);
  const isDeclared = parsedData?.isDeclared && parsedData?.completedCount > 0;

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
  const displayRubrics = safeScope?.rubrics ?? parsedData?.rubrics ?? [];

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
                  {parsedData.completedCount === parsedData.totalCount ? (
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
                        : `Hoàn tất ${parsedData.completedCount}/5 Rubrics`}
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
                        : `Đang khai báo: ${parsedData.completedCount}/5 Rubrics đầy đủ`}
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
                        : `Chưa hoàn thành khai báo (0/5)`}
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
