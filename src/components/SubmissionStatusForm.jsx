import React, { useState, useRef } from "react";
import { 
  createDefaultDeclarations, 
  createEmptyScope, 
  normalizeAuditData 
} from "../helper/aiAuditHelper";

const rubricData = {
  decomposition: {
    title: "Decomposition",
    desc: "Phân rã bài toán phức tạp thành các module và tác vụ nhỏ hơn có thể quản lý.",
  },
  pattern_recognition: {
    title: "Pattern Recognition",
    desc: "Nhận diện mẫu thiết kế (Design Patterns), quy luật kiến trúc hoặc xu hướng tái sử dụng.",
  },
  abstraction: {
    title: "Abstraction & Modeling",
    desc: "Trừu tượng hóa & xây dựng mô hình, lược bỏ chi tiết không cần thiết (Data models, Interfaces, C4).",
  },
  algorithmic_thinking: {
    title: "Algorithmic Thinking",
    desc: "Tư duy thuật toán, phát triển quy trình từng bước và luồng dữ liệu (Data flow, API flow).",
  },
  reflection: {
    title: "Reflection & Trade-off",
    desc: "Phản tư, đánh giá phê phán đề xuất của AI và phân tích các đánh đổi kỹ thuật (Trade-offs).",
  },
};

const rubricKeys = [
  "decomposition",
  "pattern_recognition",
  "abstraction",
  "algorithmic_thinking",
  "reflection",
];

export default function SubmissionStatusForm({ 
  initialData = null,
  onCancel, 
  onSubmitSuccess 
}) {
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Khởi tạo danh sách Scopes (Multi-Scope) thông qua normalizeAuditData
  const [scopes, setScopes] = useState(() => {
    if (initialData) {
      const normalized = normalizeAuditData(initialData);
      if (normalized.scopes && normalized.scopes.length > 0) {
        return normalized.scopes;
      }
    }
    return [
      {
        id: "scope-1",
        scope_title: "Backend & Database Architecture",
        scope_description: "Kiến trúc máy chủ REST API, PostgreSQL ORM, cơ chế bảo mật JWT/RBAC và Redis Cache",
        declarations: createDefaultDeclarations(),
      },
    ];
  });

  const [currentScopeIndex, setCurrentScopeIndex] = useState(0);
  const [activeRubric, setActiveRubric] = useState("decomposition");

  const tabsContainerRef = useRef(null);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const dragStartXRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Wheel listener: chuyển con lăn chuột dọc thành cuộn ngang cho chuột cắm dây/chuột ngoài
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (el.scrollWidth > el.clientWidth && e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Cuộn tab đang chọn vào tầm nhìn mượt mà
  useEffect(() => {
    if (!tabsContainerRef.current) return;
    const activeTab = tabsContainerRef.current.children[currentScopeIndex];
    if (activeTab && typeof activeTab.scrollIntoView === 'function') {
      activeTab.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [currentScopeIndex]);

  // Xử lý kéo rê chuột ngang (Drag-to-scroll)
  const handleMouseDown = (e) => {
    if (e.button !== 0 || !tabsContainerRef.current) return;
    setIsDraggingTabs(true);
    hasMovedRef.current = false;
    dragStartXRef.current = e.pageX;
    scrollStartLeftRef.current = tabsContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingTabs || !tabsContainerRef.current) return;
    const diff = e.pageX - dragStartXRef.current;
    if (Math.abs(diff) > 4) {
      hasMovedRef.current = true;
    }
    tabsContainerRef.current.scrollLeft = scrollStartLeftRef.current - diff;
  };

  const handleMouseUp = () => {
    setIsDraggingTabs(false);
  };

  const safeScopeIdx = Math.min(currentScopeIndex, scopes.length - 1);
  const currentScope = scopes[safeScopeIdx] || scopes[0];

  // Cập nhật tên Scope (scope_title)
  const handleScopeTitleChange = (val) => {
    setScopes((prev) =>
      prev.map((s, idx) =>
        idx === safeScopeIdx ? { ...s, scope_title: val, title: val } : s
      )
    );
  };

  // Cập nhật mô tả Scope (scope_description)
  const handleScopeDescChange = (val) => {
    setScopes((prev) =>
      prev.map((s, idx) =>
        idx === safeScopeIdx ? { ...s, scope_description: val, description: val } : s
      )
    );
  };

  // Thêm khai báo mới
  const handleAddScope = () => {
    const newScope = createEmptyScope(scopes.length, `Khai báo ${scopes.length + 1}`);
    setScopes((prev) => [...prev, newScope]);
    setCurrentScopeIndex(scopes.length);
    setActiveRubric("decomposition");
  };

  // Xóa khai báo
  const handleRemoveScope = (idxToRemove) => {
    if (scopes.length <= 1) return;
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa khai báo "${scopes[idxToRemove]?.scope_title || `Khai báo ${idxToRemove + 1}`}" không?`
    );
    if (!confirmDelete) return;

    setScopes((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    setCurrentScopeIndex((prev) => Math.max(0, Math.min(prev, scopes.length - 2)));
  };

  // Chuyển khai báo nhanh
  const handlePrevScope = () => {
    if (safeScopeIdx > 0) {
      setCurrentScopeIndex(safeScopeIdx - 1);
    }
  };

  const handleNextScope = () => {
    if (safeScopeIdx < scopes.length - 1) {
      setCurrentScopeIndex(safeScopeIdx + 1);
    }
  };

  // Cập nhật trường trong declaration của Rubric đang chọn thuộc Scope hiện tại
  const handleDeclarationChange = (field, value) => {
    setScopes((prev) =>
      prev.map((s, idx) => {
        if (idx !== safeScopeIdx) return s;
        const currentRubric = s.declarations[activeRubric] || {};
        const updatedRubric = {
          ...currentRubric,
          [field]: value,
          ...(field === "tool" ? { aiTool: value } : {}),
          ...(field === "response" ? { responseSummary: value } : {}),
          ...(field === "reflection" ? { studentReflection: value } : {}),
        };
        return {
          ...s,
          declarations: {
            ...s.declarations,
            [activeRubric]: updatedRubric,
            // Cập nhật alias nếu có
            ...(activeRubric === "pattern_recognition" ? { pattern: updatedRubric } : {}),
            ...(activeRubric === "algorithmic_thinking" ? { algorithmic: updatedRubric } : {}),
          },
        };
      })
    );
  };

  const currentDeclarations = currentScope?.declarations || {};
  const activeDeclarationItem = currentDeclarations[activeRubric] || {
    tool: "ChatGPT",
    decision: "Fully Accepted",
    prompt: "",
    response: "",
    reflection: "",
  };

  const totalRubrics = scopes.length * 5;
  const totalCompleted = scopes.reduce((acc, scope) => {
    return (
      acc +
      rubricKeys.filter((k) => {
        const item = scope.declarations[k];
        return Boolean(item?.prompt?.trim() || item?.reflection?.trim());
      }).length
    );
  }, 0);

  const handleSubmit = () => {
    const payload = {
      version: "2.0",
      scopes: scopes,
      selectedFile,
    };
    if (onSubmitSuccess) {
      onSubmitSuccess(payload);
    }
  };

  return (
    <>
      {/* SCOPED CSS RESET CHỐNG BỊ ĐÈ */}
      <style>{`
        .submission-card {
          padding: 32px !important;
          border-radius: 24px !important;
        }
        .drag-drop-zone {
          border: 2px dashed #e2e8f0 !important;
          border-radius: 16px !important;
          padding: 48px !important;
          min-height: 280px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .rubric-form-box {
          background-color: rgba(248, 250, 252, 0.75) !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 16px !important;
          padding: 20px !important;
        }
        .rubric-input {
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          padding: 8px 12px !important;
          font-size: 12px !important;
        }
        .edux-tab-scroll {
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 #f8fafc !important;
          cursor: grab;
          user-select: none;
        }
        .edux-tab-scroll:active {
          cursor: grabbing !important;
        }
        .edux-tab-scroll::-webkit-scrollbar {
          height: 6px !important;
        }
        .edux-tab-scroll::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 4px !important;
        }
        .edux-tab-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 4px !important;
        }
        .edux-tab-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
      `}</style>

      <div className="col-span-12 lg:col-span-8 bg-white border border-slate-100 shadow-sm space-y-6 submission-card">
        {/* 1. HEADER CỦA FORM: Tiêu đề & Stepper (1 -> 2) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Submission & AI Audit Workflow
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Nộp bài tập và khai báo Liêm chính Học thuật AI theo mô hình Đa phân rã (Multi-Scope)
            </p>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              id="step1-indicator"
              className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center transition cursor-pointer ${
                step === 1 ? "bg-blue-600 text-white" : "bg-emerald-500 text-white"
              }`}
            >
              1
            </button>
            <div
              id="step-connector"
              className={`w-8 h-0.5 transition ${
                step === 2 ? "bg-emerald-500" : "bg-slate-200"
              }`}
            ></div>
            <button
              type="button"
              onClick={() => setStep(2)}
              id="step2-indicator"
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-xs transition cursor-pointer ${
                step === 2 ? "text-blue-600" : "text-slate-400"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step === 2
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                2
              </span>
              <span className="text-[10px] tracking-wider uppercase">AI DECLARATIONS</span>
            </button>
          </div>
        </div>

        {/* STEP 1: UPLOAD FILE */}
        <div id="step1-content" className={`space-y-6 ${step === 1 ? "" : "hidden"}`}>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 tracking-wide uppercase">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4" />
            </svg>
            <span>STEP 1: UPLOAD SUBMISSION FILE</span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
            className="hidden"
            accept=".pdf,.zip,.rar,.docx,.txt"
          />

          {/* Drag & Drop Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="hover:border-blue-400 hover:bg-blue-50/20 transition cursor-pointer group drag-drop-zone"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            {selectedFile ? (
              <div className="text-center">
                <p className="text-xs font-bold text-blue-600">{selectedFile.name}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Nhấp để chọn file khác
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs font-bold text-slate-800">Click to browse or drag and drop</p>
                <p className="text-[11px] text-slate-400 mt-1">PDF, ZIP, RAR, DOCX, TXT (Max 25MB)</p>
              </>
            )}
          </div>

          {/* Footer Buttons Step 1 */}
          <div className="flex items-center justify-between pt-4">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>
            ) : <div></div>}

            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-2 hover:opacity-95 shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <span>Tiếp theo: Khai báo AI theo Module</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* STEP 2: MULTI-SCOPE AI DECLARATION */}
        <div id="step2-content" className={`space-y-5 ${step === 2 ? "" : "hidden"}`}>
          {/* Subheader */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wide uppercase">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>STEP 2: MULTI-SCOPE AI AUDIT DECLARATIONS</span>
            </div>
            <span className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 font-semibold">
              {totalCompleted} / {totalRubrics} tiêu chí hoàn thành ({scopes.length} Khai báo)
            </span>
          </div>

          {/* THANH ĐIỀU HƯỚNG PHÂN ĐOẠN / TABS & CONTROLS (HỖ TRỢ CUỘN CHUỘT DỌC THÀNH NGANG & KÉO RÊ CHUỘT) */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Nút mũi tên cuộn nhanh sang trái */}
              <button
                type="button"
                onClick={() => {
                  tabsContainerRef.current?.scrollBy({ left: -160, behavior: 'smooth' });
                }}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 transition cursor-pointer shrink-0"
                title="Cuộn danh sách khai báo sang trái"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Danh sách Tabs Scopes */}
              <div
                ref={tabsContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`flex items-center gap-1.5 overflow-x-auto pb-1.5 edux-tab-scroll flex-1 max-w-full ${
                  isDraggingTabs ? 'is-dragging' : ''
                }`}
              >
                {scopes.map((scope, idx) => {
                  const isActive = idx === safeScopeIdx;
                  const completedInScope = rubricKeys.filter((k) => {
                    const item = scope.declarations[k];
                    return Boolean(item?.prompt?.trim() || item?.reflection?.trim());
                  }).length;

                  return (
                    <button
                      key={scope.id || idx}
                      type="button"
                      data-active={isActive ? "true" : "false"}
                      onClick={() => {
                        if (hasMovedRef.current) return;
                        setCurrentScopeIndex(idx);
                        setActiveRubric("decomposition");
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 border select-none ${
                        isActive
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                      }`}
                    >
                      <span>{scope.scope_title || `Khai báo ${idx + 1}`}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {completedInScope}/5
                      </span>
                    </button>
                  );
                })}

                {/* Nút + Thêm khai báo */}
                <button
                  type="button"
                  onClick={handleAddScope}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 border border-dashed border-indigo-300 transition cursor-pointer whitespace-nowrap shrink-0 select-none"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>+ Thêm khai báo</span>
                </button>
              </div>

              {/* Nút mũi tên cuộn nhanh sang phải */}
              <button
                type="button"
                onClick={() => {
                  tabsContainerRef.current?.scrollBy({ left: 160, behavior: 'smooth' });
                }}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 transition cursor-pointer shrink-0"
                title="Cuộn danh sách khai báo sang phải"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Controls nhanh: Trước, Tiếp theo, Thùng rác xóa */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={safeScopeIdx === 0}
                  onClick={handlePrevScope}
                  title="Khai báo trước"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Khai báo trước</span>
                </button>

                <button
                  type="button"
                  disabled={safeScopeIdx === scopes.length - 1}
                  onClick={handleNextScope}
                  title="Khai báo tiếp theo"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Khai báo tiếp theo</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {scopes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveScope(safeScopeIdx)}
                    title="Xóa khai báo này"
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="hidden sm:inline">Xóa khai báo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Thông tin Scope đang chọn: Tiêu đề & Mô tả kỹ thuật */}
            <div className="pt-2 border-t border-slate-200/70 grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tiêu đề phân rã / Module <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentScope?.scope_title || ""}
                  onChange={(e) => handleScopeTitleChange(e.target.value)}
                  placeholder="ví dụ: Backend Architecture, Frontend UI..."
                  className="w-full bg-white outline-none focus:border-indigo-500 rubric-input text-xs font-semibold"
                />
              </div>
              <div className="md:col-span-8">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mô tả phạm vi / kỹ thuật của module này
                </label>
                <textarea
                  rows="2"
                  value={currentScope?.scope_description || ""}
                  onChange={(e) => handleScopeDescChange(e.target.value)}
                  placeholder="Mô tả tóm tắt phạm vi kỹ thuật, công nghệ áp dụng cho khai báo này..."
                  className="w-full bg-white outline-none focus:border-indigo-500 rubric-input resize-y text-xs"
                />
              </div>
            </div>
          </div>

          {/* BỘ 5 TIÊU CHÍ RUBRIC CỦA SCOPE HIỆN TẠI */}
          <div className="grid grid-cols-12 gap-5 items-start">
            {/* Cột trái: 5 Rubrics list */}
            <div className="col-span-12 md:col-span-4 space-y-2" id="rubric-list">
              {rubricKeys.map((key, idx) => {
                const isActive = activeRubric === key;
                const rubricItem = currentDeclarations[key] || {};
                const isFilled = Boolean(
                  rubricItem.prompt?.trim() || rubricItem.reflection?.trim()
                );

                return (
                  <div
                    key={key}
                    onClick={() => setActiveRubric(key)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border-l-4 cursor-pointer transition ${
                      isActive
                        ? "border-blue-600 bg-white shadow-xs"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                        isFilled
                          ? "bg-emerald-500 text-white"
                          : isActive
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="leading-tight flex-1 min-w-0">
                      <div
                        className={`text-xs font-bold truncate ${
                          isActive ? "text-slate-900" : "text-slate-700"
                        }`}
                      >
                        {rubricData[key].title}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span
                          className={`text-[10px] uppercase font-semibold ${
                            isFilled ? "text-emerald-600 font-bold" : "text-slate-400"
                          }`}
                        >
                          {isFilled ? "DECLARED" : "NOT DECLARED"}
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-mono">
                          {rubricItem.tool || "ChatGPT"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form Chi Tiết Của Rubric Đang Chọn */}
            <div className="col-span-12 md:col-span-8 space-y-4 rubric-form-box">
              {/* Tiêu đề & mô tả Rubric */}
              <div className="flex items-start gap-3 border-b border-slate-200/60 pb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a2 2 0 00-2 2v1H6a2 2 0 00-2 2v2H3a2 2 0 100 4h1v2a2 2 0 002 2h2v1a2 2 0 104 0v-1h2a2 2 0 002-2v-2h1a2 2 0 100-4h-1V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {rubricData[activeRubric].title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {rubricData[activeRubric].desc}
                  </p>
                </div>
              </div>

              {/* Inputs 1: AI Tool & Decision */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    AI Tool Used
                  </label>
                  <select
                    value={activeDeclarationItem.tool || "ChatGPT"}
                    onChange={(e) => handleDeclarationChange("tool", e.target.value)}
                    className="w-full bg-white outline-none focus:border-blue-500 rubric-input"
                  >
                    <option>ChatGPT</option>
                    <option>Claude</option>
                    <option>Gemini</option>
                    <option>GitHub Copilot</option>
                    <option>DeepSeek</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Your Decision
                  </label>
                  <select
                    value={activeDeclarationItem.decision || "Fully Accepted"}
                    onChange={(e) => handleDeclarationChange("decision", e.target.value)}
                    className="w-full bg-white outline-none focus:border-blue-500 rubric-input"
                  >
                    <option>Fully Accepted</option>
                    <option>Partially Modified</option>
                    <option>Heavily Adapted</option>
                    <option>Rejected</option>
                  </select>
                </div>
              </div>

              {/* Inputs 2: Prompt / Input Used */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Prompt / Input Used
                </label>
                <textarea
                  rows="2"
                  value={activeDeclarationItem.prompt || ""}
                  onChange={(e) => handleDeclarationChange("prompt", e.target.value)}
                  placeholder={`Nhập câu lệnh bạn đã dùng để áp dụng ${rubricData[activeRubric].title.toLowerCase()} trong khai báo ${currentScope?.scope_title || "này"}...`}
                  className="w-full bg-white outline-none focus:border-blue-500 resize-y rubric-input font-mono text-[11px]"
                ></textarea>
              </div>

              {/* Inputs 3: AI Response Summary */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  AI Response Summary
                </label>
                <textarea
                  rows="2"
                  value={activeDeclarationItem.response || ""}
                  onChange={(e) => handleDeclarationChange("response", e.target.value)}
                  placeholder="Tóm tắt ngắn gọn phương án, giải pháp hoặc đoạn mã do AI đề xuất..."
                  className="w-full bg-white outline-none focus:border-blue-500 resize-y rubric-input text-[11px]"
                ></textarea>
              </div>

              {/* Inputs 4: Self-Reflection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Student Self-Reflection & Evaluation
                </label>
                <textarea
                  rows="2"
                  value={activeDeclarationItem.reflection || ""}
                  onChange={(e) => handleDeclarationChange("reflection", e.target.value)}
                  placeholder="Giải thích cách bạn sử dụng gợi ý này, kiểm thử ra sao, thay đổi những gì và lý do kỹ thuật (Trade-offs)..."
                  className="w-full bg-white outline-none focus:border-blue-500 resize-y rubric-input text-[11px]"
                ></textarea>
              </div>

              {/* Điều hướng giữa các Rubric */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  disabled={rubricKeys.indexOf(activeRubric) === 0}
                  onClick={() => {
                    const idx = rubricKeys.indexOf(activeRubric);
                    if (idx > 0) setActiveRubric(rubricKeys[idx - 1]);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Tiêu chí trước</span>
                </button>

                <button
                  type="button"
                  disabled={rubricKeys.indexOf(activeRubric) === rubricKeys.length - 1}
                  onClick={() => {
                    const idx = rubricKeys.indexOf(activeRubric);
                    if (idx < rubricKeys.length - 1) setActiveRubric(rubricKeys[idx + 1]);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <span>Tiêu chí tiếp theo</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions Step 2 */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              <span>Quay lại Tệp bài nộp</span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-800 shadow-md transition cursor-pointer"
            >
              <span>Hoàn tất & Nộp bài ({scopes.length} Scopes)</span>
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
