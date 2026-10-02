import React, { useState, useRef } from "react";

const rubricData = {
  decomposition: {
    title: "Decomposition",
    desc: "Breaking down complex problems into smaller, manageable parts.",
  },
  pattern: {
    title: "Pattern Recognition",
    desc: "Identifying trends, similarities, or recurring rules in the problem or data.",
  },
  abstraction: {
    title: "Abstraction",
    desc: "Focusing on important information only, ignoring irrelevant details.",
  },
  algorithmic: {
    title: "Algorithmic Thinking",
    desc: "Developing step-by-step solutions or rules to solve the problem.",
  },
  reflection: {
    title: "Reflection",
    desc: "Critically assessing AI suggestions and evaluating learning outcomes.",
  },
};

export default function SubmissionStatusForm({ onCancel, onSubmitSuccess }) {
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeRubric, setActiveRubric] = useState("decomposition");
  const fileInputRef = useRef(null);

  const [rubricForms, setRubricForms] = useState({
    decomposition: { tool: "ChatGPT", decision: "Fully Accepted", prompt: "", response: "", reflection: "" },
    pattern: { tool: "ChatGPT", decision: "Fully Accepted", prompt: "", response: "", reflection: "" },
    abstraction: { tool: "ChatGPT", decision: "Fully Accepted", prompt: "", response: "", reflection: "" },
    algorithmic: { tool: "ChatGPT", decision: "Fully Accepted", prompt: "", response: "", reflection: "" },
    reflection: { tool: "ChatGPT", decision: "Fully Accepted", prompt: "", response: "", reflection: "" },
  });

  const handleInputChange = (field, value) => {
    setRubricForms((prev) => ({
      ...prev,
      [activeRubric]: {
        ...prev[activeRubric],
        [field]: value,
      },
    }));
  };

  const rubricKeys = Object.keys(rubricData);

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
          background-color: rgba(248, 250, 252, 0.6) !important;
          border: 1px solid #f1f5f9 !important;
          border-radius: 16px !important;
          padding: 20px !important;
        }
        .rubric-input {
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          padding: 8px 12px !important;
          font-size: 12px !important;
        }
      `}</style>

      <div className="col-span-12 lg:col-span-8 bg-white border border-slate-100 shadow-sm space-y-6 submission-card">
        {/* 1. HEADER CỦA FORM: Tiêu đề & Stepper (1 -> 2) */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Submission Status</h2>
          
          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {/* Step 1 Button */}
            <button type="button" onClick={() => setStep(1)} id="step1-indicator" className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center transition ${step === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'}`}>
              1
            </button>
            {/* Connecting Line */}
            <div id="step-connector" className={`w-8 h-0.5 transition ${step === 2 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
            {/* Step 2 Button */}
            <button type="button" onClick={() => setStep(2)} id="step2-indicator" className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-xs transition ${step === 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 2 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-400'}`}>2</span>
              <span className="text-[10px] tracking-wider uppercase">T_SUBMITTED</span>
            </button>
          </div>
        </div>

        {/* STEP 1: UPLOAD FILE */}
        <div id="step1-content" className={`space-y-6 ${step === 1 ? '' : 'hidden'}`}>
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
          <div onClick={() => fileInputRef.current?.click()} className="hover:border-blue-400 hover:bg-blue-50/20 transition cursor-pointer group drag-drop-zone">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            {selectedFile ? (
              <p className="text-xs font-bold text-blue-600">{selectedFile.name}</p>
            ) : (
              <>
                <p className="text-xs font-bold text-slate-800">Click to browse or drag and drop</p>
                <p className="text-[11px] text-slate-400 mt-1">PDF, ZIP, RAR, DOCX, TXT (Max 10MB)</p>
              </>
            )}
          </div>

          {/* Footer Buttons Step 1 */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition">
              Save as Draft
            </button>
            <button type="button" onClick={() => setStep(2)} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center gap-2 hover:opacity-95 shadow-md shadow-orange-500/20 transition">
              <span>Next: AI Declaration</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* STEP 2: AI DECLARATION */}
        <div id="step2-content" className={`space-y-6 ${step === 2 ? '' : 'hidden'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wide uppercase">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>STEP 2: AI DECLARATION (REQUIRED)</span>
            </div>
            <span className="text-[11px] text-slate-400 border border-slate-200 rounded-full px-3 py-0.5 font-medium">
              Complete 5-10 declarations
            </span>
          </div>

          <div className="grid grid-cols-12 gap-5 items-start">
            {/* Cột trái: Danh sách Rubric Items */}
            <div className="col-span-12 md:col-span-4 space-y-2" id="rubric-list">
              {rubricKeys.map((key, idx) => {
                const isActive = activeRubric === key;
                const isFilled = rubricForms[key].prompt.trim() !== "";
                return (
                  <div key={key} onClick={() => setActiveRubric(key)} className={`flex items-start gap-3 p-3 rounded-2xl border-l-4 cursor-pointer transition ${isActive ? 'border-blue-600 bg-white shadow-xs' : 'border-transparent hover:bg-slate-50'}`}>
                    <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {idx + 1}
                    </span>
                    <div className="leading-tight">
                      <div className={`text-xs font-bold ${isActive ? 'text-slate-800' : 'text-slate-700'}`}>{rubricData[key].title}</div>
                      <span className={`text-[10px] uppercase font-semibold ${isFilled ? 'text-emerald-500' : 'text-slate-400'}`}>{isFilled ? 'DECLARED' : 'NOT DECLARED'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form Điền Nội Dung Của Rubric Được Chọn (Bên phải) */}
            <div className="col-span-12 md:col-span-8 space-y-4 rubric-form-box">
              {/* Tiêu đề Rubric đang điền */}
              <div className="flex items-start gap-3 border-b border-slate-200/60 pb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a2 2 0 00-2 2v1H6a2 2 0 00-2 2v2H3a2 2 0 100 4h1v2a2 2 0 002 2h2v1a2 2 0 104 0v-1h2a2 2 0 002-2v-2h1a2 2 0 100-4h-1V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{rubricData[activeRubric].title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{rubricData[activeRubric].desc}</p>
                </div>
              </div>

              {/* Inputs 1: AI Tool & Decision */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">AI Tool Used</label>
                  <select value={rubricForms[activeRubric].tool} onChange={(e) => handleInputChange("tool", e.target.value)} className="w-full bg-white outline-none focus:border-blue-500 rubric-input">
                    <option>ChatGPT</option>
                    <option>Claude</option>
                    <option>Gemini</option>
                    <option>GitHub Copilot</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Decision</label>
                  <select value={rubricForms[activeRubric].decision} onChange={(e) => handleInputChange("decision", e.target.value)} className="w-full bg-white outline-none focus:border-blue-500 rubric-input">
                    <option>Fully Accepted</option>
                    <option>Partially Modified</option>
                    <option>Heavily Adapted</option>
                    <option>Rejected</option>
                  </select>
                </div>
              </div>

              {/* Inputs 2: Prompt / Input Used */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Prompt / Input Used</label>
                <textarea rows="2" value={rubricForms[activeRubric].prompt} onChange={(e) => handleInputChange("prompt", e.target.value)} placeholder={`e.g., Help me apply ${rubricData[activeRubric].title.toLowerCase()} for this task...`} className="w-full bg-white outline-none focus:border-blue-500 resize-y rubric-input"></textarea>
              </div>

              {/* Inputs 3: AI Response Summary */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">AI Response Summary</label>
                <textarea rows="2" value={rubricForms[activeRubric].response} onChange={(e) => handleInputChange("response", e.target.value)} placeholder="Briefly summarize what the AI suggested..." className="w-full bg-white outline-none focus:border-blue-500 resize-y rubric-input"></textarea>
              </div>

              {/* Inputs 4: Self-Reflection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Self-Reflection</label>
                <textarea rows="2" value={rubricForms[activeRubric].reflection} onChange={(e) => handleInputChange("reflection", e.target.value)} placeholder="Explain how you used this suggestion in your work, what you changed, and why..." className="w-full bg-white outline-none focus:border-blue-500 resize-y rubric-input"></textarea>
              </div>

              {/* Actions điều hướng trong Step 2 */}
              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                  <span>Previous</span>
                </button>
                <button type="button" onClick={() => { if (onSubmitSuccess) onSubmitSuccess({ selectedFile, rubricForms }); }} className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-slate-800 transition">
                  <span>Next</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
