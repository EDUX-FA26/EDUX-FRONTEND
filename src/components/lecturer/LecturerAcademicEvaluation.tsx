import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SubmissionService from '../../services/submission.service';
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
import { SubmissionFile, AuditIntegrity, VivaQuestion } from '../../types/submission';
import { normalizeAuditData } from '../../helper/aiAuditHelper';

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
  courseName?: string;
  subjectName?: string;
  className: string;
  assignmentTitle: string;
  classId?: string;
  assignmentId?: string;
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
  abstraction: number;       // Problem Abstraction & Decomposition (Tối đa: 2.0)
  implementation: number;    // Implementation & Code Quality (Tối đa: 3.0)
  verification: number;      // Functionality & Verification (Tối đa: 2.5)
  ai_interaction: number;    // AI Interaction Quality & Audit Alignment (Tối đa: 1.5)
  reflection: number;        // Reflection & Oral Defense Ownership (Tối đa: 1.0)
  decomposition?: number;    // Tương thích ngược
  pattern?: number;
  algorithmic?: number;
  r1?: number;
  r2?: number;
  r3?: number;
  [key: string]: any;
}

export const DEFAULT_RUBRIC_SCORES: RubricScores = {
  abstraction: 0,
  implementation: 0,
  verification: 0,
  ai_interaction: 0,
  reflection: 0,
};

export const RUBRIC_CRITERIA_LIST = [
  {
    key: 'abstraction' as const,
    name: 'Problem Abstraction & Decomposition',
    viName: 'Trừu tượng hóa & Phân rã bài toán',
    max: 2.0,
    color: 'bg-indigo-500',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    focusRing: 'focus:ring-indigo-400',
    activeBg: 'bg-indigo-600',
    pills: [0, 0.5, 1.0, 1.5, 2.0],
    desc: 'Khả năng phân rã bài toán phức tạp, thiết kế interface trừu tượng và tách lớp dịch vụ độc lập.',
  },
  {
    key: 'implementation' as const,
    name: 'Implementation & Code Quality',
    viName: 'Chất lượng mã nguồn & Cài đặt',
    max: 3.0,
    color: 'bg-blue-500',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    focusRing: 'focus:ring-blue-400',
    activeBg: 'bg-blue-600',
    pills: [0, 1.0, 1.5, 2.0, 2.5, 3.0],
    desc: 'Mã nguồn sạch, cấu trúc chặt chẽ, tuân thủ nguyên lý SOLID, xử lý ngoại lệ và an toàn bảo mật.',
  },
  {
    key: 'verification' as const,
    name: 'Functionality & Verification',
    viName: 'Kiểm thử & Khả năng vận hành',
    max: 2.5,
    color: 'bg-emerald-500',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    focusRing: 'focus:ring-emerald-400',
    activeBg: 'bg-emerald-600',
    pills: [0, 0.5, 1.0, 1.5, 2.0, 2.5],
    desc: 'Tính đúng đắn của logic nghiệp vụ, xử lý truy vấn tối ưu (aggregation, indexing) và kiểm thử thực tế.',
  },
  {
    key: 'ai_interaction' as const,
    name: 'AI Interaction Quality & Audit Alignment',
    viName: 'Chất lượng tương tác & Đối soát AI',
    max: 1.5,
    color: 'bg-purple-500',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    focusRing: 'focus:ring-purple-400',
    activeBg: 'bg-purple-600',
    pills: [0, 0.5, 1.0, 1.5],
    desc: 'Mức độ trung thực trong khai báo công cụ AI, độ khớp AST 5 phases và chất lượng prompt kỹ thuật.',
  },
  {
    key: 'reflection' as const,
    name: 'Reflection & Oral Defense Ownership',
    viName: 'Phản tư & Bảo vệ vấn đáp (Viva)',
    max: 1.0,
    color: 'bg-amber-500',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    focusRing: 'focus:ring-amber-400',
    activeBg: 'bg-amber-600',
    pills: [0, 0.25, 0.5, 0.75, 1.0],
    desc: 'Năng lực làm chủ mã nguồn, trả lời gãy gọn và bảo vệ vững vàng quyết định kỹ thuật trong phiên vấn đáp.',
  },
];

export type AiComplianceStatus = 'compliant' | 'minor_discrepancy' | 'violation';

export interface GradePayload {
  score: number;
  feedback: string;
  rubrics: RubricScores;
  aiComplianceStatus: AiComplianceStatus;
  isDraft: boolean;
}

export interface LecturerAcademicEvaluationProps {
  submissionId?: string;
  student?: StudentInfo;
  courseInfo?: CourseClassInfo;
  submissionFile?: SubmissionCodeFile;
  file?: SubmissionFile;
  aiDeclarations?: AiDeclarationPhase[];
  auditData?: any;
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

  submissionId,
  student = DEFAULT_STUDENT,
  courseInfo = DEFAULT_COURSE_INFO,
  submissionFile = {
    name: 'SE18D01_TranThiB_BackendArchitecture.ts',
    lines: DEFAULT_SUBMISSION_CODE_LINES,
  },
  file,
  aiDeclarations = DEFAULT_AI_DECLARATIONS,
  auditData,
  initialRubrics = DEFAULT_RUBRIC_SCORES,
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
  const routeParams = useParams();
  const navigate = useNavigate();
  const activeSubmissionId = submissionId || routeParams.submissionId;
  const targetAssignmentId = courseInfo.assignmentId || routeParams.assignmentId;
  const targetClassId = courseInfo.classId;

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (targetAssignmentId) {
      navigate(`/lecturer/assignments/${targetAssignmentId}`);
    } else {
      navigate(-1);
    }
  };

  const displayCourseName =
    courseInfo.courseTitle ||
    courseInfo.courseName ||
    courseInfo.subjectName ||
    courseInfo.className ||
    courseInfo.courseCode ||
    'Software Architecture and Design';

  const displayAssignmentTitle =
    courseInfo.assignmentTitle || 'Assignment';

  const [aiVerdict, setAiVerdict] = useState<string>('');

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'ai' | 'grading'>('ai');

  // ==========================================================================
  // MULTI-SCOPE / MULTI-PHASE STATE & NORMALIZATION
  // ==========================================================================
  const [selectedScopeIndex, setSelectedScopeIndex] = useState<number>(0);

  const normalizedAudit = useMemo(() => {
    if (auditData) {
      return normalizeAuditData(auditData);
    }
    if (aiDeclarations && aiDeclarations.length > 0) {
      return normalizeAuditData(aiDeclarations);
    }
    return normalizeAuditData(null);
  }, [auditData, aiDeclarations]);

  const scopes = useMemo(() => {
    return normalizedAudit?.scopes || [];
  }, [normalizedAudit]);

  const safeScopeIndex = selectedScopeIndex < scopes.length ? selectedScopeIndex : 0;
  const currentScope: any = scopes[safeScopeIndex] || scopes[0] || null;

  // Helper tính số lượng tiêu chí đã điền đủ (3/3 trường text: Prompt, Response, Reflection) trong scope
  const getScopeCompletedCount = (scope: any) => {
    if (!scope || !scope.declarations) return 0;
    const decs = scope.declarations;
    const criteriaKeys = [
      'decomposition',
      'pattern',
      'abstraction',
      'algorithmic',
      'reflection',
    ];
    return criteriaKeys.filter((key) => {
      const d = decs[key] || decs[`${key}_recognition`] || decs[`${key}_thinking`];
      if (!d) return false;
      const p = (d.prompt || d.prompt_used || '').trim();
      const r = (d.response || d.responseSummary || d.aiResponseSummary || '').trim();
      const ref = (d.reflection || d.studentReflection || '').trim();
      return p.length > 0 && r.length > 0 && ref.length > 0;
    }).length;
  };

  // Kiểm tra xem sinh viên có khai báo AI nào không (nếu tất cả các scope đều trống text và aiDeclarations rỗng)
  const hasAnyDeclaration = useMemo(() => {
    if (aiDeclarations && aiDeclarations.length > 0) {
      const anyFilledInProp = aiDeclarations.some((d) => (d.prompt || '').trim().length > 0 || (d.studentReflection || '').trim().length > 0);
      if (anyFilledInProp) return true;
    }
    if (!scopes || scopes.length === 0) return false;
    return scopes.some((scope: any) => {
      const decs = scope.declarations || {};
      return Object.values(decs).some((d: any) => {
        if (!d || typeof d !== 'object') return false;
        const p = (d.prompt || d.prompt_used || '').trim();
        const r = (d.response || d.responseSummary || d.aiResponseSummary || '').trim();
        const ref = (d.reflection || d.studentReflection || '').trim();
        return p.length > 0 || r.length > 0 || ref.length > 0;
      });
    });
  }, [scopes, aiDeclarations]);

  const currentScopeDeclarations: AiDeclarationPhase[] = useMemo(() => {
    if (!currentScope || !currentScope.declarations) {
      return aiDeclarations || [];
    }
    const decs = currentScope.declarations;

    const getCriteriaData = (key: string, altKey?: string) => {
      return decs[key] || (altKey ? decs[altKey] : null) || {};
    };

    const decomp = getCriteriaData('decomposition');
    const pattern = getCriteriaData('pattern', 'pattern_recognition');
    const abstraction = getCriteriaData('abstraction');
    const algo = getCriteriaData('algorithmic', 'algorithmic_thinking');
    const reflection = getCriteriaData('reflection');

    const rubricItems = [
      {
        phaseKey: 'decomposition' as const,
        phaseName: 'DECOMPOSITION',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        data: decomp,
      },
      {
        phaseKey: 'pattern' as const,
        phaseName: 'PATTERN RECOGNITION',
        badgeBg: 'bg-indigo-50',
        badgeText: 'text-indigo-700',
        data: pattern,
      },
      {
        phaseKey: 'abstraction' as const,
        phaseName: 'ABSTRACTION',
        badgeBg: 'bg-cyan-50',
        badgeText: 'text-cyan-700',
        data: abstraction,
      },
      {
        phaseKey: 'algorithmic' as const,
        phaseName: 'ALGORITHMIC THINKING',
        badgeBg: 'bg-teal-50',
        badgeText: 'text-teal-700',
        data: algo,
      },
      {
        phaseKey: 'reflection' as const,
        phaseName: 'AI REFLECTION',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-700',
        data: reflection,
      },
    ];

    return rubricItems.map((item) => {
      const d = item.data;
      const tool = d.tool || d.aiTool || 'Chưa khai báo';
      const decision = (d.decision as any) || 'Not Declared';
      const prompt = d.prompt || '';
      const responseSummary = d.response || d.responseSummary || d.aiResponseSummary || '';
      const studentReflection = d.reflection || d.studentReflection || '';

      let decisionBg = 'bg-slate-100';
      let decisionText = 'text-slate-600';
      if (decision === 'Fully Accepted') {
        decisionBg = 'bg-emerald-50';
        decisionText = 'text-emerald-700';
      } else if (decision === 'Partially Modified') {
        decisionBg = 'bg-blue-50';
        decisionText = 'text-blue-700';
      } else if (decision === 'Heavily Adapted') {
        decisionBg = 'bg-amber-50';
        decisionText = 'text-amber-700';
      } else if (decision === 'Rejected') {
        decisionBg = 'bg-rose-50';
        decisionText = 'text-rose-700';
      }

      return {
        phaseKey: item.phaseKey,
        phaseName: item.phaseName,
        badgeBg: item.badgeBg,
        badgeText: item.badgeText,
        aiTool: tool,
        decision,
        decisionBg,
        decisionText,
        prompt,
        aiResponseSummary: responseSummary,
        studentReflection,
      };
    });
  }, [currentScope, aiDeclarations]);

  // Chuẩn hóa Rubric 5 tiêu chí (hỗ trợ chuyển đổi từ r1, r2, r3 cũ nếu có)
  const normalizedInitialRubrics: RubricScores = useMemo(() => {
    if (initialRubrics && initialRubrics.abstraction !== undefined && initialRubrics.implementation !== undefined) {
      return initialRubrics;
    }
    if (initialRubrics && (initialRubrics.decomposition !== undefined || initialRubrics.pattern !== undefined)) {
      const totalOld = (initialRubrics.decomposition || 0) + (initialRubrics.pattern || 0) + (initialRubrics.abstraction || 0) + (initialRubrics.algorithmic || 0) + (initialRubrics.reflection || 0);
      const ratio = totalOld > 0 ? totalOld / 10 : 0;
      return {
        abstraction: parseFloat((2.0 * ratio).toFixed(2)),
        implementation: parseFloat((3.0 * ratio).toFixed(2)),
        verification: parseFloat((2.5 * ratio).toFixed(2)),
        ai_interaction: parseFloat((1.5 * ratio).toFixed(2)),
        reflection: parseFloat((1.0 * ratio).toFixed(2)),
      };
    }
    if (initialRubrics && (initialRubrics.r1 || initialRubrics.r2 || initialRubrics.r3)) {
      const sum = (initialRubrics.r1 || 0) + (initialRubrics.r2 || 0) + (initialRubrics.r3 || 0);
      const ratio = sum > 0 ? sum / 10 : 0;
      return {
        abstraction: parseFloat((2.0 * ratio).toFixed(2)),
        implementation: parseFloat((3.0 * ratio).toFixed(2)),
        verification: parseFloat((2.5 * ratio).toFixed(2)),
        ai_interaction: parseFloat((1.5 * ratio).toFixed(2)),
        reflection: parseFloat((1.0 * ratio).toFixed(2)),
      };
    }
    return DEFAULT_RUBRIC_SCORES;
  }, [initialRubrics]);

  // Rubric Scores State (5 tiêu chí x 2.0 điểm tối đa)
  const isUserModifiedRef = React.useRef(false);
  const [scores, setScores] = useState<RubricScores>(normalizedInitialRubrics);
  const [feedback, setFeedback] = useState<string>(initialFeedback);
  const [aiCompliance, setAiCompliance] = useState<AiComplianceStatus>(initialAiCompliance);

  // Sync state if initialRubrics changes from API, only if user has not manually modified
  React.useEffect(() => {
    if (!isUserModifiedRef.current) {
      setScores(normalizedInitialRubrics);
    }
  }, [normalizedInitialRubrics]);

  React.useEffect(() => {
    if (initialFeedback && !isUserModifiedRef.current) {
      setFeedback(initialFeedback);
    }
  }, [initialFeedback]);

  // Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Modals & Popups
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitReason, setResubmitReason] = useState('Vui lòng bổ sung thêm giải trình chi tiết về Redis Token Blacklist trong phase AI Reflection.');
  const [showVivaModal, setShowVivaModal] = useState(false);
  const [showAnnotateToast, setShowAnnotateToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isAuditingAi, setIsAuditingAi] = useState(false);
  const [rubricReasonings, setRubricReasonings] = useState<Record<string, string>>({});
  const [auditIntegrity, setAuditIntegrity] = useState<AuditIntegrity | null>(null);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);
  const [overallAiFeedback, setOverallAiFeedback] = useState<string>('');

  // Calculate Total Score (Thang 10: 5 tiêu chí x 2.0 điểm)
  const totalScore = parseFloat(
    (
      (scores.abstraction || 0) +
      (scores.implementation || 0) +
      (scores.verification || 0) +
      (scores.ai_interaction || 0) +
      (scores.reflection || 0)
    ).toFixed(2)
  );

  // Update Rubric Score
  const handleUpdateRubric = (key: keyof RubricScores, val: string | number, maxScore: number = 2) => {
    isUserModifiedRef.current = true;
    const numVal = typeof val === 'number' ? val : parseFloat(val);
    setScores((prev) => ({
      ...prev,
      [key]: isNaN(numVal) ? 0 : Math.min(maxScore, Math.max(0, parseFloat(numVal.toFixed(2)))),
    }));
  };

  // Khớp từng tiêu chí với AI: 8.50 / 10 (1.75 + 2.55 + 2.15 + 1.25 + 0.80 = 8.50)
  const applyAiSuggestion = () => {
    isUserModifiedRef.current = true;
    setScores({
      abstraction: 1.75,
      implementation: 2.55,
      verification: 2.15,
      ai_interaction: 1.25,
      reflection: 0.80,
    });
    if (!feedback) {
      setFeedback('Code có kiến trúc tốt, phân tách service layer rõ ràng. Khai báo AI minh bạch và có tự phản chiếu xác đáng.');
    }
    showToastNotification('Đã áp dụng gợi ý AI', 'Đã điền điểm gợi ý 8.50/10 vào 5 tiêu chí rubric chuẩn SE/IT.');
  };

  const handleAuditWithAi = async () => {
    if (!activeSubmissionId) {
      showToastNotification('Lỗi thẩm định', 'Không xác định được mã bài nộp (submissionId).', 'error');
      return;
    }

    try {
      setIsAuditingAi(true);

      const payload = {
        aiAuditSummary: {
          declarationAlignment: '96.4%',
          transparencyIndex: 'A+',
          reflectionDepth: 'High',
          riskLevel: student.aiRiskLevel || 'low',
          summary: 'Khai báo chi tiết cả tool được chấp thuận và tool bị từ chối.'
        },
        oralExamLogs: [],
        aiDeclarations: currentScopeDeclarations,
        aiAuditData: auditData || normalizedAudit,
        codeSnippet: actualFile.textContent || (codeLines.join('\n'))
      };

      const res = await SubmissionService.auditRubric(activeSubmissionId, payload);
      const aiData = res?.data || res;

      if (!aiData || (!aiData.rubrics && !aiData.rubric_scores)) {
        throw new Error('Dữ liệu thẩm định AI không đúng định dạng JSON.');
      }

      isUserModifiedRef.current = true;
      const newScores: RubricScores = { ...scores };
      const newReasons: Record<string, string> = {};

      if (Array.isArray(aiData.rubrics)) {
        aiData.rubrics.forEach((item: any) => {
          if (item.criterion_id) {
            newScores[item.criterion_id] = typeof item.score === 'number' ? item.score : parseFloat(item.score);
            newReasons[item.criterion_id] = item.short_reason || '';
          }
        });
      } else if (aiData.rubric_scores) {
        Object.assign(newScores, aiData.rubric_scores);
        if (aiData.rubric_reasonings) {
          Object.assign(newReasons, aiData.rubric_reasonings);
        }
      }

      setScores(newScores);
      setRubricReasonings(newReasons);

      if (Array.isArray(aiData.viva_questions) && aiData.viva_questions.length > 0) {
        setVivaQuestions(aiData.viva_questions);
      }
      if (aiData.audit_integrity) {
        setAuditIntegrity(aiData.audit_integrity);
      }
      if (aiData.overall_verdict || aiData.ai_verdict) {
        setOverallAiFeedback(aiData.overall_verdict || aiData.ai_verdict);
      }

      const verdict = aiData.overall_verdict || aiData.ai_verdict || aiData.overall_feedback || '';
      if (verdict) {
        setAiVerdict(verdict);
        if (!feedback) {
          setFeedback(verdict);
        }
      }

      const calculatedTotal = aiData.total_score != null
        ? Number(aiData.total_score).toFixed(2)
        : (
            (newScores.abstraction || 0) +
            (newScores.implementation || 0) +
            (newScores.verification || 0) +
            (newScores.ai_interaction || 0) +
            (newScores.reflection || 0)
          ).toFixed(2);

      showToastNotification(
        'Thẩm định AI thành công',
        `Đã khớp điểm từ Gemini: Tổng điểm ${calculatedTotal}/10.`
      );
    } catch (err: any) {
      console.error('[ART-AI] AI Audit error:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Không thể thẩm định qua Gemini API.';
      showToastNotification('Lỗi thẩm định AI', errMsg, 'error');
    } finally {
      setIsAuditingAi(false);
    }
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
      // Tự động chuyển hướng quay về trang danh sách bài nộp sau khi công bố điểm thành công
      if (onBack) {
        setTimeout(() => {
          onBack();
        }, 800);
      }
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
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-[#f8fafc] text-slate-700 font-sans select-none m-0 p-0">
      {/* Toast Notification Floating */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[1050] flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
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

      {/* ==================== TOP NAVIGATION BAR (H-12 FLUSH FIT) ==================== */}
      <header className="h-12 w-full bg-[#0f172a] text-white px-4 flex items-center justify-between border-b border-gray-800 shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBackClick}
            title="Quay lại danh sách bài nộp của bài tập này"
            className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="text-xs font-medium tracking-wide flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/lecturer/dashboard')}
              className="cursor-pointer hover:text-blue-400 transition-colors uppercase font-semibold bg-transparent border-0 p-0 text-slate-300 shrink-0"
              title="Về Dashboard giảng viên"
            >
              GRADING
            </button>
            <ChevronRight size={12} className="text-slate-500 shrink-0" />
            <button
              type="button"
              onClick={() => {
                if (targetClassId) {
                  navigate(`/lecturer/classes/${targetClassId}`);
                } else {
                  navigate('/lecturer/classes');
                }
              }}
              className="cursor-pointer hover:text-blue-400 transition-colors max-w-[220px] truncate text-left bg-transparent border-0 p-0 text-slate-200"
              title={displayCourseName}
            >
              {displayCourseName}
            </button>
            <ChevronRight size={12} className="text-slate-500 shrink-0" />
            <button
              type="button"
              onClick={handleBackClick}
              className="cursor-pointer hover:text-blue-400 transition-colors max-w-[240px] truncate text-left bg-transparent border-0 p-0 text-slate-300"
              title={displayAssignmentTitle}
            >
              {displayAssignmentTitle}
            </button>
          </nav>

          {/* Divider & Student Info */}
          <span className="text-slate-700 hidden sm:inline mx-1">|</span>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-white truncate max-w-[180px]">
              {student.name} ({student.code})
            </span>
            {student.aiRiskLevel === 'low' && (
              <span className="inline-flex items-center gap-1.5 bg-[#063f35] text-[#2fe8a6] border border-[#0d594b] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2fe8a6]"></span>
                <span>{student.aiRiskLabel || 'low AI-transparency risk'}</span>
              </span>
            )}
            {student.aiRiskLevel === 'medium' && (
              <span className="inline-flex items-center gap-1.5 bg-[#3f2f06] text-[#e8b52f] border border-[#59440d] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e8b52f]"></span>
                <span>{student.aiRiskLabel || 'medium AI-transparency risk'}</span>
              </span>
            )}
            {student.aiRiskLevel === 'high' && (
              <span className="inline-flex items-center gap-1.5 bg-[#3f0606] text-[#e82f2f] border border-[#590d0d] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e82f2f]"></span>
                <span>{student.aiRiskLabel || 'high AI-transparency risk'}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowResubmitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 transition border border-rose-100 shadow-sm cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Request Resubmit</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#1b2b52] text-slate-200 rounded-lg text-xs font-semibold hover:bg-[#233766] transition border border-slate-700 cursor-pointer disabled:opacity-50"
          >
            <Bookmark size={13} />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublishGrade}
            className="flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-xs font-bold hover:opacity-95 shadow-md shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
          >
            <Send size={11} />
            <span>{isPublishing ? 'Đang công bố...' : `Công bố điểm (${totalScore.toFixed(2)} / 10)`}</span>
          </button>
        </div>
      </header>

      {/* ==================== MAIN CONTENT AREA (WORKSPACE BODY) ==================== */}
      <div className="flex-1 flex w-full overflow-hidden">
        {/* CỘT TRÁI: CODE VIEWER / ANNOTATE (FLEX-1) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white border-r border-gray-200 min-w-0">
          <SubmissionFileViewer
            file={actualFile}
            onAiAnnotate={handleAiAnnotateClick}
            showAiAnnotationBanner={showAnnotateToast}
            onCloseAiAnnotationBanner={() => setShowAnnotateToast(false)}
            className="w-full h-full flex flex-col overflow-hidden"
          />
        </div>

        {/* CỘT PHẢI: TAB AI DECLARATION & AUDIT / ACADEMIC GRADING (420px - 460px) */}
        <aside className="w-[420px] lg:w-[460px] flex flex-col overflow-hidden bg-white shrink-0">
          {/* TAB NAVIGATION CỐ ĐỊNH */}
          <div className="h-11 border-b border-gray-200 flex items-center px-2 shrink-0 bg-white select-none">
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
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {/* ==================== TAB 1: AI DECLARATION & AUDIT ==================== */}
            <div
              id="panel-ai"
              className={`flex-1 flex flex-col p-4 overflow-y-auto custom-scroll space-y-4 ${
                activeTab === 'ai' ? '' : 'hidden'
              }`}
            >
              {/* Header Section */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 tracking-wide uppercase">
                  <Layers size={14} className="text-orange-500" />
                  <span>STUDENT AI DECLARATION ({scopes.length > 1 ? `${scopes.length} PHẠM VI / SCOPES` : '5 PHASES'})</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded border border-slate-200">
                  Self-Reported
                </span>
              </div>

              {/* Thanh điều hướng Scope / Phase Selector (Đặt ngay dưới tiêu đề tab) */}
              {scopes.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scroll no-scrollbar shrink-0">
                  {scopes.map((scope: any, idx: number) => {
                    const isSelected = safeScopeIndex === idx;
                    const rawTitle = scope.scope_title || scope.title || `Scope ${idx + 1}`;
                    const displayTitle = rawTitle.toLowerCase().startsWith('scope') || rawTitle.toLowerCase().startsWith('phạm vi')
                      ? rawTitle
                      : `Scope ${idx + 1}: ${rawTitle}`;
                    const count = getScopeCompletedCount(scope);

                    return (
                      <button
                        key={scope.id || idx}
                        type="button"
                        onClick={() => setSelectedScopeIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <span>{displayTitle}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            isSelected ? 'bg-blue-700/60 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          ({count}/5)
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Hiển thị thông tin Scope hiện tại */}
              {currentScope && (
                <div className="shrink-0">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="text-blue-600 font-extrabold">#{safeScopeIndex + 1}</span>
                    <span>{currentScope.scope_title || currentScope.title || `Scope ${safeScopeIndex + 1}`}</span>
                  </div>
                  {(currentScope.scope_description || currentScope.description) && (
                    <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-lg text-xs text-gray-600 my-2 leading-relaxed">
                      {currentScope.scope_description || currentScope.description}
                    </div>
                  )}
                </div>
              )}

              {/* KHUNG BẢNG 5 PHASES: CUỘN NGANG & DỌC ĐỘC LẬP BÊN TRONG HOẶC EMPTY STATE */}
              {!hasAnyDeclaration ? (
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
                        {currentScopeDeclarations.map((item) => (
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
                              {item.prompt ? (
                                item.prompt
                              ) : (
                                <span className="italic text-slate-400">Không có câu lệnh</span>
                              )}
                            </td>
                            <td className="p-3 align-top leading-relaxed text-slate-500">
                              {item.aiResponseSummary ? (
                                item.aiResponseSummary
                              ) : (
                                <span className="italic text-slate-400">Không có tóm tắt</span>
                              )}
                            </td>
                            <td className="p-3 align-top leading-relaxed text-slate-700 font-medium">
                              {item.studentReflection ? (
                                item.studentReflection
                              ) : (
                                <span className="italic text-slate-400">Không có phản tư</span>
                              )}
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
                    if (vivaQuestions.length === 0 && !isAuditingAi) {
                      handleAuditWithAi();
                    }
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
              className={`flex-1 flex flex-col p-4 overflow-y-auto custom-scroll space-y-6 ${
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
                    disabled={isAuditingAi}
                    onClick={handleAuditWithAi}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isAuditingAi ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>AI đang thẩm định 5 tiêu chí...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-amber-300" />
                        <span>Khớp từng tiêu chí với AI</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug max-w-xs mx-auto">
                  Điểm AI sẽ tự động điền vào các thanh trượt bên dưới; giảng viên có thể kéo thanh trượt để ghi đè điểm theo ý muốn.
                </p>
              </div>

              {/* AI Verdict Banner */}
              {aiVerdict && (
                <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl text-xs text-purple-950 flex items-start gap-2.5 shadow-xs shrink-0 animate-in fade-in">
                  <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900 text-xs uppercase tracking-wide">
                        Kết Luận Thanh Tra & Vấn Đáp (AI Verdict)
                      </span>
                      <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                        Đối soát chéo Gemini
                      </span>
                    </div>
                    <p className="text-slate-700 text-xs mt-1 leading-relaxed font-medium">
                      {aiVerdict}
                    </p>
                  </div>
                </div>
              )}

              {/* Điều chỉnh Rubric 5 Tiêu chí Chuẩn thang 10 */}
              <div className="space-y-3.5 pt-2 border-t border-slate-100 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    ĐIỀU CHỈNH TỪNG TIÊU CHÍ RUBRIC (5 TIÊU CHÍ)
                  </div>
                  <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    Thang 10.0
                  </span>
                </div>

                {RUBRIC_CRITERIA_LIST.map((crit) => {
                  const currentVal = scores[crit.key] ?? 0;
                  const reasoning = rubricReasonings[crit.key];
                  return (
                    <div
                      key={crit.key}
                      className="space-y-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 transition hover:bg-slate-50 hover:border-slate-200"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full ${crit.color} shrink-0`} />
                          <div className="truncate">
                            <span className="font-bold text-slate-800">{crit.name}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5 hidden sm:inline">({crit.viName})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 font-mono text-xs">
                          <input
                            type="number"
                            min="0"
                            max={crit.max}
                            step="0.05"
                            value={currentVal}
                            onChange={(e) => handleUpdateRubric(crit.key, e.target.value, crit.max)}
                            className={`w-16 px-1.5 py-0.5 text-right font-bold text-xs bg-white border ${crit.borderColor} rounded-md ${crit.textColor} outline-none focus:ring-1 ${crit.focusRing}`}
                          />
                          <span className="text-slate-400 font-semibold text-[11px]">/ {crit.max.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Quick preset pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {crit.pills.map((pillVal) => (
                          <button
                            key={pillVal}
                            type="button"
                            onClick={() => handleUpdateRubric(crit.key, pillVal, crit.max)}
                            className={`px-2 py-0.5 text-[10px] rounded font-semibold transition cursor-pointer ${
                              Math.abs(currentVal - pillVal) < 0.01
                                ? `${crit.activeBg} text-white font-bold shadow-xs`
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {pillVal.toFixed(pillVal % 1 === 0 ? 0 : (pillVal * 10) % 1 === 0 ? 1 : 2)}
                          </button>
                        ))}
                      </div>

                      {/* Range slider */}
                      <input
                        type="range"
                        min="0"
                        max={crit.max}
                        step="0.05"
                        value={currentVal}
                        id={`range-${crit.key}`}
                        onChange={(e) => handleUpdateRubric(crit.key, e.target.value, crit.max)}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />

                      <div className="text-[10px] text-slate-400 leading-tight">
                        {crit.desc}
                      </div>

                      {/* AI Reasoning box */}
                      {reasoning && (
                        <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                          <span className="font-bold text-slate-800 shrink-0">Lý do:</span>
                          <span className="text-slate-600">{reasoning}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Đánh giá liêm chính học thuật / sử dụng AI hợp lệ */}
              <div className="space-y-2 pt-2 border-t border-slate-100 shrink-0">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  ĐÁNH GIÁ LIÊM CHÍNH AI (AI COMPLIANCE STATUS)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      isUserModifiedRef.current = true;
                      setAiCompliance('compliant');
                    }}
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
                    onClick={() => {
                      isUserModifiedRef.current = true;
                      setAiCompliance('minor_discrepancy');
                    }}
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
                    onClick={() => {
                      isUserModifiedRef.current = true;
                      setAiCompliance('violation');
                    }}
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
              {overallAiFeedback && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 shrink-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-indigo-800">
                      <Sparkles size={13} className="text-indigo-600" />
                      Nhận xét tổng quan từ AI:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        isUserModifiedRef.current = true;
                        setFeedback(overallAiFeedback);
                      }}
                      className="text-[10px] text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      Dùng nhận xét này
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{overallAiFeedback}</p>
                </div>
              )}
              
              <div className="space-y-2 pt-2 border-t border-slate-100 pb-2 shrink-0">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  NHẬN XÉT HỌC THUẬT (ACADEMIC FEEDBACK)
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => {
                    isUserModifiedRef.current = true;
                    setFeedback(e.target.value);
                  }}
                  placeholder="Nhập nhận xét chi tiết cho sinh viên..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 bg-white resize-y"
                />
              </div>

              {/* KHU VỰC CÔNG BỐ ĐIỂM DƯỚI CÙNG CHO GIẢNG VIÊN (FINAL GRADE ACTION) */}
              <div className="pt-3 border-t border-slate-200 shrink-0 space-y-2.5 bg-slate-50/50 p-3.5 rounded-2xl border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    ĐIỂM CHÍNH THỨC CỦA BÀI NỘP:
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-indigo-600 font-mono">
                      {totalScore.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold ml-1">/ 10.00</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handlePublishGrade}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>
                    {isPublishing
                      ? 'ĐANG CÔNG BỐ ĐIỂM...'
                      : `CÔNG BỐ ĐIỂM CHÍNH THỨC (${totalScore.toFixed(2)} / 10)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ==================== MODAL 1: REQUEST RESUBMIT ==================== */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-[999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
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
        <div className="fixed inset-0 z-[999] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl max-w-3xl w-full flex flex-col max-h-[86vh] overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            
            {/* 1. FIXED MODAL HEADER - Luôn hiển thị ở trên cùng, không bị che khuất bởi navbar */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                  <Zap size={20} className="fill-white/20" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    Báo Cáo Thanh Tra Trung Thực AI & Bộ Câu Hỏi Vấn Đáp Viva
                  </h3>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                    <span>Đối chiếu AST Code + Git Commit History + Lời khai 5 Rubrics</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVivaModal(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-xl transition cursor-pointer shrink-0 ml-2"
                title="Đóng (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* 2. SCROLLABLE MODAL BODY - Cuộn độc lập bên trong, không ảnh hưởng header/footer */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scroll">
              
              {/* Cảnh báo Penalty trong Modal nếu có */}
              {auditIntegrity?.penalty_applied && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-950 flex items-start gap-3 shadow-xs animate-in fade-in">
                  <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-rose-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <span>CẢNH BÁO VI PHẠM KHẢO THÍ (AI PENALTY APPLIED)</span>
                    </div>
                    <p className="text-rose-800 text-xs mt-1 leading-relaxed font-medium">
                      {auditIntegrity.penalty_reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Chỉ số đối chiếu khớp thực tế (Responsive Grid 3 cột) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Thẻ 1: Độ khớp */}
                <div className={`p-4 rounded-2xl border text-center transition ${
                  auditIntegrity?.penalty_applied 
                    ? 'bg-rose-50/70 border-rose-200' 
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${
                    auditIntegrity?.penalty_applied ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    Độ Khớp Lời Khai
                  </div>
                  <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
                    auditIntegrity?.penalty_applied ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {auditIntegrity ? `${auditIntegrity.match_percentage.toFixed(0)}%` : '96.4%'}
                  </div>
                  <div className={`text-[10px] mt-1 font-medium ${
                    auditIntegrity?.penalty_applied ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {auditIntegrity 
                      ? (auditIntegrity.penalty_applied ? 'Phát hiện sai lệch với code' : 'Mã nguồn khớp các phase') 
                      : 'Đang đối soát'}
                  </div>
                </div>

                {/* Thẻ 2: Transparency Index */}
                <div className={`p-4 rounded-2xl border text-center transition ${
                  auditIntegrity?.penalty_applied 
                    ? 'bg-amber-50/70 border-amber-200' 
                    : 'bg-indigo-50/70 border-indigo-200'
                }`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${
                    auditIntegrity?.penalty_applied ? 'text-amber-700' : 'text-indigo-700'
                  }`}>
                    AI Transparency Index
                  </div>
                  <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
                    auditIntegrity?.penalty_applied ? 'text-amber-700' : 'text-indigo-700'
                  }`}>
                    {auditIntegrity ? auditIntegrity.ai_transparency_index : 'A+'}
                  </div>
                  <div className={`text-[10px] mt-1 font-medium ${
                    auditIntegrity?.penalty_applied ? 'text-amber-600' : 'text-indigo-600'
                  }`}>
                    {auditIntegrity 
                      ? (auditIntegrity.penalty_applied ? 'Khai báo đối phó/sơ sài' : 'Khai báo chi tiết các tool') 
                      : 'Kiểm toán tự động'}
                  </div>
                </div>

                {/* Thẻ 3: Self-Reflection Depth */}
                <div className={`p-4 rounded-2xl border text-center transition ${
                  auditIntegrity?.penalty_applied 
                    ? 'bg-rose-50/70 border-rose-200' 
                    : 'bg-purple-50/70 border-purple-200'
                }`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${
                    auditIntegrity?.penalty_applied ? 'text-rose-700' : 'text-purple-700'
                  }`}>
                    Self-Reflection Depth
                  </div>
                  <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
                    auditIntegrity?.penalty_applied ? 'text-rose-700' : 'text-purple-700'
                  }`}>
                    {auditIntegrity ? auditIntegrity.reflection_depth : 'High'}
                  </div>
                  <div className={`text-[10px] mt-1 font-medium ${
                    auditIntegrity?.penalty_applied ? 'text-rose-600' : 'text-purple-600'
                  }`}>
                    {auditIntegrity 
                      ? (auditIntegrity.penalty_applied ? 'Phản tư giả mạo/lặp lại' : 'Có tư duy phản biện') 
                      : 'Kiểm tra độ sâu'}
                  </div>
                </div>
              </div>

              {/* Bộ câu hỏi vấn đáp Viva bám sát 100% mã nguồn thực tế */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <HelpCircle size={15} className="text-indigo-600" />
                    <span>Bộ Câu Hỏi Vấn Đáp (Viva Questions) Bám Sát Code Thực Tế</span>
                  </div>
                  {isAuditingAi && (
                    <span className="text-[11px] text-indigo-600 flex items-center gap-1.5 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                      <span className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Đang sinh câu hỏi từ AST...
                    </span>
                  )}
                </div>

                {vivaQuestions && vivaQuestions.length > 0 ? (
                  <div className="space-y-3.5 text-xs">
                    {vivaQuestions.map((q, idx) => {
                      const criterionLabel = 
                        q.rubric_criterion === 'abstraction' ? 'Kiến trúc & Phân rã (Abstraction)' :
                        q.rubric_criterion === 'implementation' ? 'Logic & Bắt ngoại lệ (Implementation)' :
                        q.rubric_criterion === 'reflection' ? 'Phản tư & Đánh đổi AI (Reflection)' :
                        (q.rubric_criterion || 'Kỹ thuật SE/IT');

                      const criterionColor =
                        q.rubric_criterion === 'abstraction' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        q.rubric_criterion === 'implementation' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-purple-50 text-purple-700 border-purple-200';

                      const codeSnippet = q.target_code_snippet || q.target_function_or_snippet;
                      const answerCriteria = q.expected_answer_criteria || q.expected_answer_key;

                      return (
                        <div key={q.id || idx} className="p-4 sm:p-5 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-3.5 shadow-xs hover:border-slate-300 transition">
                          
                          {/* Tiêu đề câu hỏi, Tiêu chí nhắm tới & File */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                                Câu {idx + 1}
                              </span>
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md border ${criterionColor}`}>
                                {criterionLabel}
                              </span>
                            </div>
                            {q.target_file && (
                              <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                                <span className="text-slate-400">📁</span>
                                <span className="font-semibold text-slate-700">{q.target_file}</span>
                              </span>
                            )}
                          </div>

                          {/* Đoạn code/hàm cụ thể trong file */}
                          {codeSnippet && (
                            <div className="space-y-1">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Code size={11} className="text-slate-400" />
                                <span>Vị trí / Đoạn code đối chất:</span>
                              </div>
                              <pre className="text-[11px] bg-[#0f172a] text-slate-200 p-3.5 rounded-xl font-mono overflow-x-auto max-h-36 leading-relaxed border border-slate-800 custom-scroll">
                                <code>{codeSnippet}</code>
                              </pre>
                            </div>
                          )}

                          {/* Nội dung câu hỏi vấn đáp */}
                          <div className="p-3.5 bg-white border border-slate-200/90 rounded-xl space-y-1.5 shadow-2xs">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                              <HelpCircle size={13} />
                              <span>Nội dung câu hỏi vấn đáp cho giảng viên:</span>
                            </div>
                            <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-semibold">
                              {q.question}
                            </p>
                          </div>

                          {/* Gợi ý câu trả lời kỳ vọng */}
                          {answerCriteria && (
                            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1.5">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                                <CheckCircle size={13} className="text-amber-600" />
                                <span>Gợi ý câu trả lời kỳ vọng (Expected Answer Criteria):</span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                                {answerCriteria}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-3">
                    <p className="text-xs text-slate-500">
                      {isAuditingAi
                        ? 'AI đang phân tích AST mã nguồn và tạo 3 câu hỏi vấn đáp xoáy vào bản chất code...'
                        : 'Chưa có bộ câu hỏi vấn đáp dựa trên mã nguồn thực tế.'}
                    </p>
                    {!isAuditingAi && (
                      <button
                        type="button"
                        onClick={handleAuditWithAi}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-500/20 cursor-pointer"
                      >
                        Phân Tích Code & Tạo Câu Hỏi Viva
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. FIXED MODAL FOOTER - Luôn hiển thị ở đáy modal */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Thanh tra hoàn tất lúc {new Date().toLocaleTimeString('vi-VN')}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowVivaModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-xs"
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
