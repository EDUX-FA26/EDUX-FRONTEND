import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  RotateCcw,
  Bookmark,
  Send,
  Code,
  Sparkles,
  Download,
  ShieldCheck,
  Layers,
  Zap,
  Copy,
  CheckCircle,
  AlertTriangle,
  X,
  FileText,
  HelpCircle,
  Check
} from 'lucide-react';
import './LecturerAcademicEvaluation.css';
import SubmissionFileViewer from './SubmissionFileViewer';
import { SubmissionFile } from '../../types/submission';

/* ==========================================================================
   1. TYPESCRIPT INTERFACES
   ========================================================================== */

export interface StudentInfo {
  name: string;
  code: string;
  email?: string;
  aiRiskLevel: 'low' | 'medium' | 'high';
  aiRiskLabel?: string;
}

export interface CourseClassInfo {
  courseCode: string;
  courseTitle?: string;
  className: string;
  assignmentTitle: string;
}

export interface SubmissionCodeFile {
  name: string;
  size?: number | string;
  url?: string;
  content?: string;
  lines?: string[];
}

export interface AiDeclarationPhase {
  phaseKey: 'reflection' | 'decomposition' | 'pattern' | 'abstraction' | 'algorithmic';
  phaseName: string;
  badgeBg: string;
  badgeText: string;
  aiTool: string;
  decision: 'Fully Accepted' | 'Partially Modified' | 'Heavily Adapted' | 'Rejected';
  decisionBg: string;
  decisionText: string;
  prompt: string;
  aiResponseSummary: string;
  studentReflection: string;
}

export interface RubricScores {
  r1: number; // Code Quality & Structure (max 4)
  r2: number; // Functionality & Correctness (max 4)
  r3: number; // Documentation & AI Declaration (max 2)
}

export type AiComplianceStatus = 'compliant' | 'minor_discrepancy' | 'violation';

export interface GradePayload {
  score: number;
  feedback: string;
  rubrics: RubricScores;
  aiComplianceStatus: AiComplianceStatus;
  isDraft: boolean;
}

export interface LecturerAcademicEvaluationProps {
  student?: StudentInfo;
  courseInfo?: CourseClassInfo;
  submissionFile?: SubmissionCodeFile;
  file?: SubmissionFile;
  aiDeclarations?: AiDeclarationPhase[];
  initialRubrics?: RubricScores;
  initialFeedback?: string;
  initialAiCompliance?: AiComplianceStatus;
  onBack?: () => void;
  onRequestResubmit?: (reason: string) => Promise<void | boolean>;
  onSaveDraft?: (payload: GradePayload) => Promise<void | boolean>;
  onPublishGrade?: (payload: GradePayload) => Promise<void | boolean>;
  onAiAnnotate?: () => void;
  onRunAuditViva?: () => void;
}

/* ==========================================================================
   2. DEFAULT MOCK DATA (MATCHING EXACT HTML MOCKUP)
   ========================================================================== */

export const DEFAULT_STUDENT: StudentInfo = {
  name: 'Tran Thi B',
  code: 'DE181802',
  email: 'tranb.de181802@fpt.edu.vn',
  aiRiskLevel: 'low',
  aiRiskLabel: 'low AI-transparency risk',
};

export const DEFAULT_COURSE_INFO: CourseClassInfo = {
  courseCode: 'SWD392',
  courseTitle: 'Software Architecture and Design',
  className: 'SE18D01',
  assignmentTitle: 'Backend Architecture C4 Model',
};

export const DEFAULT_SUBMISSION_CODE_LINES: string[] = [
  '/**',
  ' * Academic Research Transparency & AI Audit System (ART-AI)',
  ' * Student: Tran Thi B (DE181802)',
  ' * Assignment: Backend Architecture with C4 Model & Microservices',
  ' */',
  '',
  'import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";',
  'import { Request, Response, NextFunction } from "express";',
  'import { JwtService } from "@nestjs/jwt";',
  'import { RedisTokenBlacklistService } from "../security/token-blacklist.service";',
  '',
  '@Injectable()',
  'export class JwtAuthMiddleware implements NestMiddleware {',
  '  constructor(',
  '    private readonly jwtService: JwtService,',
  '    private readonly redisBlacklist: RedisTokenBlacklistService',
  '  ) {}',
  '',
  '  async use(req: Request, res: Response, next: NextFunction) {',
  '    const authHeader = req.headers.authorization;',
  '    if (!authHeader || !authHeader.startsWith("Bearer ")) {',
  '      throw new UnauthorizedException("Missing Bearer Authentication Token");',
  '    }',
  '',
  '    const token = authHeader.split(" ")[1];',
  '    // AI Audit Note: Refactored following student reflection on Dec 15 to check Redis blacklist',
  '    const isRevoked = await this.redisBlacklist.isTokenRevoked(token);',
  '    if (isRevoked) {',
  '      throw new UnauthorizedException("Token has been revoked or expired");',
  '    }',
  '',
  '    try {',
  '      const decodedPayload = await this.jwtService.verifyAsync(token);',
  '      req["user"] = decodedPayload;',
  '      next();',
  '    } catch (err) {',
  '      throw new UnauthorizedException("Invalid token signature or expired payload");',
  '    }',
  '  }',
  '}',
];

export const DEFAULT_AI_DECLARATIONS: AiDeclarationPhase[] = [
  {
    phaseKey: 'reflection',
    phaseName: 'AI REFLECTION',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    aiTool: 'Claude 3.5 Sonnet',
    decision: 'Fully Accepted',
    decisionBg: 'bg-emerald-50',
    decisionText: 'text-emerald-700',
    prompt: '"Review this module architecture and point out critical code smells."',
    aiResponseSummary: 'Suggested decomposing monolithic handlers into service layers.',
    studentReflection: 'Acknowledged tight coupling and refactored logic into service layer.',
  },
  {
    phaseKey: 'decomposition',
    phaseName: 'DECOMPOSITION',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    aiTool: 'ChatGPT-4o',
    decision: 'Partially Modified',
    decisionBg: 'bg-blue-50',
    decisionText: 'text-blue-700',
    prompt: '"Help me break down the authentication process with JWT & Refresh token."',
    aiResponseSummary: 'Divided into 4 submodules: validation, token gen, cookie, middleware.',
    studentReflection: 'Kept the proposed 4 modules, altered token storage to secure cookies.',
  },
  {
    phaseKey: 'pattern',
    phaseName: 'PATTERN RECOGNITION',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    aiTool: 'GitHub Copilot',
    decision: 'Heavily Adapted',
    decisionBg: 'bg-amber-50',
    decisionText: 'text-amber-700',
    prompt: '"Generate generic repository pattern for MongoDB CRUD operations."',
    aiResponseSummary: 'Provided standard BaseRepository class using native Mongo client.',
    studentReflection: 'Adapted types to fit project schema and added retry transactions.',
  },
  {
    phaseKey: 'abstraction',
    phaseName: 'ABSTRACTION',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    aiTool: 'ChatGPT-4o',
    decision: 'Fully Accepted',
    decisionBg: 'bg-emerald-50',
    decisionText: 'text-emerald-700',
    prompt: '"Abstract file upload handling into an independent storage provider."',
    aiResponseSummary: 'Created IStorageProvider interface with SeaweedFS & S3 adapters.',
    studentReflection: 'Implemented interface smoothly without leaking filesystem details.',
  },
  {
    phaseKey: 'algorithmic',
    phaseName: 'ALGORITHMIC THINKING',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    aiTool: 'Gemini 1.5 Pro',
    decision: 'Rejected',
    decisionBg: 'bg-rose-50',
    decisionText: 'text-rose-700',
    prompt: '"Write optimal query to calculate real-time student participation."',
    aiResponseSummary: 'Suggested client-side sorting and filter logic over full dataset.',
    studentReflection: 'Rejected client-side approach; implemented MongoDB Aggregation pipeline instead.',
  },
];

/* ==========================================================================
   3. COMPONENT IMPLEMENTATION
   ========================================================================== */

export default function LecturerAcademicEvaluation({
  student = DEFAULT_STUDENT,
  courseInfo = DEFAULT_COURSE_INFO,
  submissionFile = {
    name: 'SE18D01_TranThiB_BackendArchitecture.ts',
    lines: DEFAULT_SUBMISSION_CODE_LINES,
  },
  file,
  aiDeclarations = DEFAULT_AI_DECLARATIONS,
  initialRubrics = { r1: 0, r2: 0, r3: 0 },
  initialFeedback = '',
  initialAiCompliance = 'compliant',
  onBack,
  onRequestResubmit,
  onSaveDraft,
  onPublishGrade,
  onAiAnnotate,
  onRunAuditViva,
}: LecturerAcademicEvaluationProps) {
  // Resolve actual submission file (supports ZIP tree hierarchy, PDF, or text/code)
  const actualFile: SubmissionFile = useMemo(() => {
    if (file) return file;
    const lines = submissionFile.lines || (submissionFile.content ? submissionFile.content.split('\n') : DEFAULT_SUBMISSION_CODE_LINES);
    return {
      name: submissionFile.name || 'SE18D01_TranThiB_BackendArchitecture.ts',
      url: submissionFile.url || '',
      size: typeof submissionFile.size === 'number' ? submissionFile.size : 4850000,
      mimeType: submissionFile.name?.endsWith('.zip') ? 'application/zip' : 'text/typescript',
      fileType: submissionFile.name?.endsWith('.zip') ? 'zip' : (submissionFile.name?.endsWith('.pdf') ? 'pdf' : 'code'),
      textContent: lines.join('\n'),
    };
  }, [file, submissionFile]);
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'ai' | 'grading'>('ai');

  // Rubric Scores State
  const [scores, setScores] = useState<RubricScores>(initialRubrics);
  const [feedback, setFeedback] = useState<string>(initialFeedback);
  const [aiCompliance, setAiCompliance] = useState<AiComplianceStatus>(initialAiCompliance);

  // Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Modals & Popups
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitReason, setResubmitReason] = useState('Vui lòng bổ sung thêm giải trình chi tiết về Redis Token Blacklist trong phase AI Reflection.');
  const [showVivaModal, setShowVivaModal] = useState(false);
  const [showAnnotateToast, setShowAnnotateToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Calculate Total Score (Thang 10)
  const totalScore = parseFloat((scores.r1 + scores.r2 + scores.r3).toFixed(2));

  // Update Rubric Score
  const handleUpdateRubric = (key: keyof RubricScores, val: string) => {
    const numVal = parseFloat(val);
    setScores((prev) => ({
      ...prev,
      [key]: isNaN(numVal) ? 0 : numVal,
    }));
  };

  // Khớp từng tiêu chí với AI: 8.50 / 10
  const applyAiSuggestion = () => {
    setScores({ r1: 3.5, r2: 3.25, r3: 1.75 });
    if (!feedback) {
      setFeedback('Code có kiến trúc tốt, phân tách service layer rõ ràng. Khai báo AI minh bạch và có tự phản chiếu xác đáng.');
    }
    showToastNotification('Đã áp dụng gợi ý AI', 'Đã điền điểm gợi ý 8.50/10 vào bản nháp rubrics.');
  };

  const showToastNotification = (title: string, desc: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Save Draft Action
  const handleSaveDraft = async () => {
    setIsSaving(true);
    const payload: GradePayload = {
      score: totalScore,
      feedback,
      rubrics: scores,
      aiComplianceStatus: aiCompliance,
      isDraft: true,
    };
    try {
      if (onSaveDraft) {
        await onSaveDraft(payload);
      }
      showToastNotification('Bản nháp đã được lưu', `Đã lưu tạm điểm ${totalScore.toFixed(2)}/10.`);
    } catch (err) {
      showToastNotification('Lỗi khi lưu nháp', 'Không thể lưu bản nháp, vui lòng thử lại.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish Grade Action
  const handlePublishGrade = async () => {
    if (totalScore === 0 && !window.confirm('Điểm hiện tại đang là 0.00 / 10. Bạn có chắc chắn muốn công bố?')) {
      return;
    }
    setIsPublishing(true);
    const payload: GradePayload = {
      score: totalScore,
      feedback,
      rubrics: scores,
      aiComplianceStatus: aiCompliance,
      isDraft: false,
    };
    try {
      if (onPublishGrade) {
        await onPublishGrade(payload);
      }
      showToastNotification('Đã công bố điểm thành công', `Điểm chính thức ${totalScore.toFixed(2)}/10 đã gửi cho sinh viên.`);
    } catch (err) {
      showToastNotification('Lỗi khi công bố điểm', 'Không thể hoàn tất công bố điểm.', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Request Resubmit
  const handleConfirmResubmit = async () => {
    if (!resubmitReason.trim()) {
      alert('Vui lòng nhập lý do yêu cầu nộp lại bài!');
      return;
    }
    try {
      if (onRequestResubmit) {
        await onRequestResubmit(resubmitReason);
      }
      setShowResubmitModal(false);
      showToastNotification('Yêu cầu nộp lại bài đã gửi', 'Sinh viên sẽ nhận được thông báo nộp lại bài.');
    } catch (err) {
      showToastNotification('Lỗi gửi yêu cầu', 'Vui lòng thử lại sau.', 'error');
    }
  };

  // AI Code Annotate Click
  const handleAiAnnotateClick = () => {
    if (onAiAnnotate) {
      onAiAnnotate();
    }
    setShowAnnotateToast(true);
    setTimeout(() => setShowAnnotateToast(false), 4000);
  };

  // Code lines to render
  const codeLines = submissionFile.lines || (submissionFile.content ? submissionFile.content.split('\n') : []);

  return (
    <div className="bg-[#f8fafc] text-slate-700 h-screen flex flex-col overflow-hidden font-sans select-none">
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          {toastMessage.type === 'success' && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertTriangle size={18} className="text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Sparkles size={18} className="text-indigo-400 shrink-0" />}
          <div>
            <div className="text-xs font-bold">{toastMessage.title}</div>
            <div className="text-[11px] text-slate-300">{toastMessage.desc}</div>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ==================== TOP NAVIGATION BAR ==================== */}
      <header className="bg-[#111c38] text-white px-5 py-3 flex items-center justify-between shrink-0 shadow-sm select-none">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack || (() => window.history.back())}
            title="Quay lại danh sách bài nộp"
            className="text-slate-300 hover:text-white p-1 text-base transition cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>GRADING</span>
              <ChevronRight size={10} className="text-slate-500" />
              <span>{courseInfo.courseCode}</span>
              <ChevronRight size={10} className="text-slate-500" />
              <span>
                {courseInfo.className} ({courseInfo.assignmentTitle})
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-sm font-bold text-white tracking-wide">
                {student.name} ({student.code})
              </h1>
              {student.aiRiskLevel === 'low' && (
                <span className="inline-flex items-center gap-1.5 bg-[#063f35] text-[#2fe8a6] border border-[#0d594b] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2fe8a6]"></span>
                  <span>{student.aiRiskLabel || 'low AI-transparency risk'}</span>
                </span>
              )}
              {student.aiRiskLevel === 'medium' && (
                <span className="inline-flex items-center gap-1.5 bg-[#3f2f06] text-[#e8b52f] border border-[#59440d] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e8b52f]"></span>
                  <span>{student.aiRiskLabel || 'medium AI-transparency risk'}</span>
                </span>
              )}
              {student.aiRiskLevel === 'high' && (
                <span className="inline-flex items-center gap-1.5 bg-[#3f0606] text-[#e82f2f] border border-[#590d0d] text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e82f2f]"></span>
                  <span>{student.aiRiskLabel || 'high AI-transparency risk'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowResubmitModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 transition border border-rose-100 shadow-sm cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Request Resubmit</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1b2b52] text-slate-200 rounded-lg text-xs font-semibold hover:bg-[#233766] transition border border-slate-700 cursor-pointer disabled:opacity-50"
          >
            <Bookmark size={13} />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublishGrade}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-xs font-bold hover:opacity-95 shadow-md shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
          >
            <Send size={11} />
            <span>{isPublishing ? 'Publishing...' : 'Publish Grade'}</span>
          </button>
        </div>
      </header>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* CỘT TRÁI: CODE / FILE SUBMISSION (PREVIEW TRỰC TIẾP HOẶC GITHUB-STYLE ZIP TREE) */}
        <SubmissionFileViewer
          file={actualFile}
          onAiAnnotate={handleAiAnnotateClick}
          showAiAnnotationBanner={showAnnotateToast}
          onCloseAiAnnotationBanner={() => setShowAnnotateToast(false)}
          className="border-r border-slate-200"
        />

        {/* CỘT PHẢI: KHUNG ĐIỀU KHIỂN & CUỘN TÁCH BIỆT */}
        <aside className="w-[490px] flex flex-col bg-white shrink-0 border-l border-slate-200 overflow-hidden">
          {/* TAB NAVIGATION CỐ ĐỊNH */}
          <div className="h-12 border-b border-slate-200 flex items-center px-2 shrink-0 bg-white select-none">
            <button
              id="tab-btn-ai"
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'ai'
                  ? 'border-b-2 border-orange-500 text-orange-600'
                  : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck size={14} />
              <span>AI DECLARATION & AUDIT</span>
            </button>

            <button
              id="tab-btn-grading"
              type="button"
              onClick={() => setActiveTab('grading')}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'grading'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Bookmark size={14} />
              <span>ACADEMIC GRADING</span>
            </button>
          </div>

          {/* VÙNG NỘI DUNG CUỘN RIÊNG BIỆT CHO MỖI TAB */}
          <div className="flex-1 overflow-hidden relative">
            {/* ==================== TAB 1: AI DECLARATION & AUDIT ==================== */}
            <div
              id="panel-ai"
              className={`h-full flex flex-col p-5 overflow-y-auto custom-scroll space-y-4 ${
                activeTab === 'ai' ? '' : 'hidden'
              }`}
            >
              {/* Header Section */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 tracking-wide uppercase">
                  <Layers size={14} className="text-orange-500" />
                  <span>STUDENT AI DECLARATION (5 PHASES)</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded border border-slate-200">
                  Self-Reported
                </span>
              </div>

              {/* KHUNG BẢNG 5 PHASES: CUỘN NGANG & DỌC ĐỘC LẬP BÊN TRONG HOẶC EMPTY STATE */}
              {!aiDeclarations || aiDeclarations.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50/50 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Sinh viên không khai báo sử dụng AI
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      (No AI Declaration recorded - Pure Manual Submission)
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                    Bài nộp này được sinh viên thực hiện hoàn toàn thủ công hoặc không sử dụng công cụ AI hỗ trợ. Bạn có thể kiểm tra mã nguồn và chuyển thẳng sang tab Academic Grading để chấm điểm.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('grading')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer mt-1"
                  >
                    <span>Chuyển sang Chấm điểm (Grading)</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs shrink-0">
                  <div className="max-h-[360px] overflow-x-auto overflow-y-auto custom-scroll">
                    <table className="w-full min-w-[700px] border-collapse text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider z-10">
                        <tr>
                          <th className="py-2.5 px-3 w-[150px]">Phase / Rubric</th>
                          <th className="py-2.5 px-3 w-[130px]">Tool & Decision</th>
                          <th className="py-2.5 px-3 w-[160px]">Prompt / Input Used</th>
                          <th className="py-2.5 px-3 w-[160px]">AI Response Summary</th>
                          <th className="py-2.5 px-3 w-[180px]">Student's Reflection</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600">
                        {aiDeclarations.map((item) => (
                          <tr key={item.phaseKey} className="hover:bg-slate-50/70 transition">
                            <td className="p-3 align-top">
                              <span
                                className={`inline-block px-2 py-1 ${item.badgeBg} ${item.badgeText} font-bold rounded text-[10px] whitespace-nowrap`}
                              >
                                {item.phaseName}
                              </span>
                            </td>
                            <td className="p-3 align-top space-y-1">
                              <div className="font-bold text-slate-800">{item.aiTool}</div>
                              <span
                                className={`inline-block px-1.5 py-0.5 ${item.decisionBg} ${item.decisionText} rounded text-[9px] font-semibold`}
                              >
                                {item.decision}
                              </span>
                            </td>
                            <td className="p-3 align-top leading-relaxed text-slate-600">
                              {item.prompt}
                            </td>
                            <td className="p-3 align-top leading-relaxed text-slate-500">
                              {item.aiResponseSummary}
                            </td>
                            <td className="p-3 align-top leading-relaxed text-slate-700 font-medium">
                              {item.studentReflection}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bottom Action Box: Thanh tra trung thực AI */}
              <div className="pt-2 space-y-3 shrink-0">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Sparkles size={14} className="text-indigo-600" />
                    <span>THANH TRA TRUNG THỰC AI & VẤN ĐÁP VIVA</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kiểm định tự động độ khớp giữa lời khai và mã nguồn thực tế
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowVivaModal(true);
                    if (onRunAuditViva) onRunAuditViva();
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Zap size={13} />
                  <span>Chạy Thanh Tra & Tạo Vấn Đáp</span>
                </button>
              </div>
            </div>

            {/* ==================== TAB 2: ACADEMIC GRADING ==================== */}
            <div
              id="panel-grading"
              className={`h-full flex flex-col p-5 overflow-y-auto custom-scroll space-y-6 ${
                activeTab === 'grading' ? '' : 'hidden'
              }`}
            >
              {/* Điểm tổng kết */}
              <div className="text-center space-y-3 shrink-0">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ĐIỂM TỔNG KẾT (FINAL SCORE)
                </div>

                <div className="inline-flex items-baseline justify-center border-2 border-indigo-200 bg-indigo-50/30 rounded-2xl px-12 py-3 shadow-xs">
                  <span id="final-score" className="text-4xl font-extrabold text-slate-800">
                    {totalScore.toFixed(2)}
                  </span>
                  <span className="text-slate-400 font-semibold text-sm ml-1.5">/ 10</span>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={applyAiSuggestion}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100 transition cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Khớp từng tiêu chí với AI: 8.50 / 10</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug max-w-xs mx-auto">
                  Chỉ sao chép vào bản nháp; giảng viên vẫn có thể kéo từng tiêu chí trước khi công bố.
                </p>
              </div>

              {/* Điều chỉnh Rubric */}
              <div className="space-y-4 pt-2 border-t border-slate-100 shrink-0">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  ĐIỀU CHỈNH TỪNG TIÊU CHÍ RUBRIC
                </div>

                {/* Rubric 1 */}
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Code Quality & Structure</span>
                    <span className="font-bold text-indigo-600 font-mono">
                      <span id="val-r1">{scores.r1.toFixed(2)}</span> / 4
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="0.25"
                    value={scores.r1}
                    id="range-r1"
                    onChange={(e) => handleUpdateRubric('r1', e.target.value)}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Rubric 2 */}
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Functionality & Correctness</span>
                    <span className="font-bold text-indigo-600 font-mono">
                      <span id="val-r2">{scores.r2.toFixed(2)}</span> / 4
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="0.25"
                    value={scores.r2}
                    id="range-r2"
                    onChange={(e) => handleUpdateRubric('r2', e.target.value)}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Rubric 3 */}
                <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Documentation & AI Declaration</span>
                    <span className="font-bold text-indigo-600 font-mono">
                      <span id="val-r3">{scores.r3.toFixed(2)}</span> / 2
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.25"
                    value={scores.r3}
                    id="range-r3"
                    onChange={(e) => handleUpdateRubric('r3', e.target.value)}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Đánh giá liêm chính học thuật / sử dụng AI hợp lệ */}
              <div className="space-y-2 pt-2 border-t border-slate-100 shrink-0">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  ĐÁNH GIÁ LIÊM CHÍNH AI (AI COMPLIANCE STATUS)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiCompliance('compliant')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      aiCompliance === 'compliant'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Check size={12} className={aiCompliance === 'compliant' ? 'text-emerald-600' : 'text-slate-400'} />
                    <span>Hợp lệ (Pass)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiCompliance('minor_discrepancy')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      aiCompliance === 'minor_discrepancy'
                        ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <HelpCircle size={12} className={aiCompliance === 'minor_discrepancy' ? 'text-amber-600' : 'text-slate-400'} />
                    <span>Cần Viva</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiCompliance('violation')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      aiCompliance === 'violation'
                        ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle size={12} className={aiCompliance === 'violation' ? 'text-rose-600' : 'text-slate-400'} />
                    <span>Nghi vấn</span>
                  </button>
                </div>
              </div>

              {/* Nhận xét học thuật */}
              <div className="space-y-2 pt-2 border-t border-slate-100 pb-2 shrink-0">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  NHẬN XÉT HỌC THUẬT (ACADEMIC FEEDBACK)
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Nhập nhận xét chi tiết cho sinh viên..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 bg-white resize-y"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ==================== MODAL 1: REQUEST RESUBMIT ==================== */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <RotateCcw size={16} className="text-rose-500" />
                <span>Yêu Cầu Nộp Lại Bài (Request Resubmit)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowResubmitModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Hệ thống sẽ mở lại quyền nộp bài cho sinh viên <strong>{student.name}</strong> ({student.code}) và gửi email/thông báo kèm lý do yêu cầu chỉnh sửa.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Lý do yêu cầu nộp lại bài:</label>
              <textarea
                rows={3}
                value={resubmitReason}
                onChange={(e) => setResubmitReason(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-rose-500 bg-slate-50 focus:bg-white resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmResubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                Xác nhận yêu cầu nộp lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: VIVA & AUDIT INSPECTOR ==================== */}
      {showVivaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Báo Cáo Thanh Tra Trung Thực AI & Bộ Câu Hỏi Vấn Đáp Viva
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Đối chiếu AST Code + Git Commit History + Lời khai 5 Rubrics
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVivaModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chi số đối chiếu khớp */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-center">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">Độ Khớp Lời Khai</div>
                <div className="text-2xl font-extrabold text-emerald-700 mt-0.5">96.4%</div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Mã nguồn khớp chính xác 5/5 phases</div>
              </div>

              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 text-center">
                <div className="text-[10px] font-bold text-indigo-700 uppercase">AI Transparency Index</div>
                <div className="text-2xl font-extrabold text-indigo-700 mt-0.5">A+</div>
                <div className="text-[10px] text-indigo-600 mt-0.5">Khai báo chi tiết cả tool bị từ chối</div>
              </div>

              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3.5 text-center">
                <div className="text-[10px] font-bold text-purple-700 uppercase">Self-Reflection Depth</div>
                <div className="text-2xl font-extrabold text-purple-700 mt-0.5">High</div>
                <div className="text-[10px] text-purple-600 mt-0.5">Có phản biện kiến trúc rõ ràng</div>
              </div>
            </div>

            {/* Gợi ý 3 câu hỏi vấn đáp Viva */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <HelpCircle size={14} className="text-indigo-600" />
                <span>Gợi ý 3 Câu Hỏi Vấn Đáp (Viva Defense Questions) Cho Giảng Viên</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 text-[11px] text-indigo-700">
                    Câu 1 (Rubric 5 - Algorithmic Thinking / Gemini 1.5 Pro):
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    "Trong báo cáo, em từ chối gợi ý của Gemini về client-side sorting và tự viết MongoDB Aggregation pipeline. Em hãy giải thích ưu điểm về memory overhead và database indexing của quyết định này?"
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 text-[11px] text-indigo-700">
                    Câu 2 (Rubric 2 - Decomposition / ChatGPT-4o):
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    "Em đã thay đổi cách lưu Refresh Token từ localStorage sang HttpOnly Secure Cookie so với gợi ý ban đầu của ChatGPT. Vì sao sự thay đổi này lại ngăn chặn triệt để lỗ hổng XSS token hijacking?"
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 text-[11px] text-indigo-700">
                    Câu 3 (Rubric 4 - Abstraction / IStorageProvider):
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    "Giao diện IStorageProvider em định nghĩa cho phép cắm SeaweedFS hoặc AWS S3. Nếu hệ thống đổi sang Google Cloud Storage, em cần chỉnh sửa những class nào mà không làm ảnh hưởng controller?"
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Thanh tra tự động hoàn tất lúc {new Date().toLocaleTimeString('vi-VN')}
              </span>
              <button
                type="button"
                onClick={() => setShowVivaModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
              >
                Đóng báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
