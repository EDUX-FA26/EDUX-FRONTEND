import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  HelpCircle,
  Check,
  BookOpen,
  Compass,
  RefreshCw
} from 'lucide-react';
import './LecturerAcademicEvaluation.css';
import SubmissionFileViewer from './SubmissionFileViewer';
import { SubmissionFile, AuditIntegrity, VivaQuestion } from '../../types/submission';
import { normalizeAuditData, formatCleanVietnamese } from '../../helper/aiAuditHelper';
import TopicService from '../../services/topic.service';
import GradingService from '../../services/grading.service';

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
  subjectId?: string;
  rubricConfigs?: any[];
  rubric_configs?: any[];
  ai_declaration_required?: boolean;
  course_topics?: any[];
  has_course_topics?: boolean;
  recommended_topics?: any[];
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
  decomposition?: number;        // Decomposition (Phân rã bài toán - Tối đa 2.0)
  pattern_recognition?: number;  // Pattern Recognition (Nhận diện mẫu kiến trúc - Tối đa 2.0)
  abstraction?: number;          // Abstraction (Trừu tượng hóa & DTO/Entity - Tối đa 2.0)
  algorithmic_thinking?: number; // Algorithmic Thinking (Tư duy thuật toán & Logic nghiệp vụ - Tối đa 2.0)
  reflection?: number;           // Reflection (Đánh giá & Kiểm thử biên - Tối đa 2.0)
  // Aliases tương thích
  pattern?: number;
  algorithmic?: number;
  implementation?: number;
  verification?: number;
  ai_interaction?: number;
  DECOMPOSITION?: number;
  PATTERN_RECOGNITION?: number;
  ABSTRACTION?: number;
  ALGORITHMIC_THINKING?: number;
  REFLECTION?: number;
  PROBLEM_ABSTRACTION?: number;
  IMPLEMENTATION_QUALITY?: number;
  CRITICAL_EVALUATION?: number;
  AI_INTERACTION?: number;
  METACOGNITIVE_REFLECTION?: number;
  core_requirements?: number;
  technical_quality?: number;
  code_clean?: number;
  [key: string]: any;
}

export const DEFAULT_RUBRIC_SCORES: RubricScores = {
  decomposition: 1.6,
  pattern_recognition: 1.6,
  abstraction: 1.6,
  algorithmic_thinking: 1.3,
  reflection: 1.3,
  pattern: 1.6,
  algorithmic: 1.3,
};

export const CANONICAL_RUBRIC_MAP: Record<string, string> = {
  PROBLEM_ABSTRACTION: 'decomposition',
  DECOMPOSITION: 'decomposition',
  decomposition: 'decomposition',

  IMPLEMENTATION_QUALITY: 'pattern_recognition',
  PATTERN_RECOGNITION: 'pattern_recognition',
  pattern: 'pattern_recognition',
  pattern_recognition: 'pattern_recognition',

  CRITICAL_EVALUATION: 'abstraction',
  ABSTRACTION: 'abstraction',
  abstraction: 'abstraction',

  AI_INTERACTION: 'algorithmic_thinking',
  ALGORITHMIC_THINKING: 'algorithmic_thinking',
  algorithmic: 'algorithmic_thinking',
  algorithmic_thinking: 'algorithmic_thinking',

  METACOGNITIVE_REFLECTION: 'reflection',
  REFLECTION: 'reflection',
  reflection: 'reflection',
};

export const PRESET_CRITERIA_META: Record<string, any> = {
  decomposition: {
    key: 'decomposition' as const,
    apiKey: 'DECOMPOSITION',
    name: 'Problem Abstraction & Solution Design',
    viName: 'Phân rã bài toán',
    color: 'bg-blue-500',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    focusRing: 'focus:ring-blue-400',
    activeBg: 'bg-blue-600',
    desc: 'Phân chia luồng xử lý thành các bước rõ ràng (validation, fetch inventory, trừ kho, tính tiền, lưu order).',
  },
  pattern_recognition: {
    key: 'pattern_recognition' as const,
    altKey: 'pattern',
    apiKey: 'PATTERN_RECOGNITION',
    name: 'Implementation & Code Quality',
    viName: 'Nhận diện mẫu kiến trúc',
    color: 'bg-indigo-500',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    focusRing: 'focus:ring-indigo-400',
    activeBg: 'bg-indigo-600',
    desc: 'Áp dụng đúng các mẫu thiết kế (Spring Service/Repository, Transaction, Map lookup phòng tránh N+1 Query).',
  },
  abstraction: {
    key: 'abstraction' as const,
    apiKey: 'ABSTRACTION',
    name: 'Critical Evaluation & Verification',
    viName: 'Trừu tượng hóa & DTO/Entity',
    color: 'bg-cyan-500',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
    focusRing: 'focus:ring-cyan-400',
    activeBg: 'bg-cyan-600',
    desc: 'Mô hình hóa dữ liệu, tách biệt DTO Request/Response và Entity database, đóng gói dữ liệu phù hợp.',
  },
  algorithmic_thinking: {
    key: 'algorithmic_thinking' as const,
    altKey: 'algorithmic',
    apiKey: 'ALGORITHMIC_THINKING',
    name: 'AI Interaction & Prompt Engineering',
    viName: 'Tư duy thuật toán & Logic nghiệp vụ',
    color: 'bg-emerald-500',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    focusRing: 'focus:ring-emerald-400',
    activeBg: 'bg-emerald-600',
    desc: 'Tính đúng đắn của logic tính toán, thứ tự công thức (VAT, trừ discount), tính toán tiền tệ BigDecimal chuẩn xác.',
  },
  reflection: {
    key: 'reflection' as const,
    apiKey: 'REFLECTION',
    name: 'Metacognitive Reflection & Transparency',
    viName: 'Đánh giá & Kiểm thử biên',
    color: 'bg-purple-500',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    focusRing: 'focus:ring-purple-400',
    activeBg: 'bg-purple-600',
    desc: 'Kiểm soát các trường hợp ngoại lệ (Edge cases: số lượng âm, discount > subtotal, null/rỗng) và phản tư làm chủ AI.',
  },
};

export const RUBRIC_CRITERIA_LIST = [
  {
    ...PRESET_CRITERIA_META.decomposition,
    criterion_key: 'PROBLEM_ABSTRACTION',
    max: 2.0,
    weight_percent: 20,
    pills: [0, 0.5, 1.0, 1.5, 1.8, 2.0],
  },
  {
    ...PRESET_CRITERIA_META.pattern_recognition,
    criterion_key: 'IMPLEMENTATION_QUALITY',
    max: 3.0,
    weight_percent: 30,
    pills: [0, 0.8, 1.5, 2.2, 2.7, 3.0],
  },
  {
    ...PRESET_CRITERIA_META.abstraction,
    criterion_key: 'CRITICAL_EVALUATION',
    max: 2.5,
    weight_percent: 25,
    pills: [0, 0.6, 1.2, 1.8, 2.2, 2.5],
  },
  {
    ...PRESET_CRITERIA_META.algorithmic_thinking,
    criterion_key: 'AI_INTERACTION',
    max: 1.5,
    weight_percent: 15,
    pills: [0, 0.4, 0.8, 1.1, 1.3, 1.5],
  },
  {
    ...PRESET_CRITERIA_META.reflection,
    criterion_key: 'METACOGNITIVE_REFLECTION',
    max: 1.0,
    weight_percent: 10,
    pills: [0, 0.2, 0.5, 0.7, 0.9, 1.0],
  },
];

export type AiComplianceStatus = 'compliant' | 'minor_discrepancy' | 'violation';

export interface GradePayload {
  score: number;
  feedback: string;
  rubrics: RubricScores;
  aiComplianceStatus: AiComplianceStatus;
  isDraft: boolean;
  reviewTopics?: any[];
}

export interface LecturerAcademicEvaluationProps {
  submissionId?: string;
  student?: StudentInfo;
  courseInfo?: CourseClassInfo;
  rubricConfigs?: any[];
  submissionFile?: SubmissionCodeFile;
  file?: SubmissionFile;
  aiDeclarations?: AiDeclarationPhase[];
  auditData?: any;
  noAiUsed?: boolean;
  noAiNote?: string;
  initialRubrics?: RubricScores;
  initialFeedback?: string;
  initialAiCompliance?: AiComplianceStatus;
  savedEvaluation?: any;
  topics?: any[];
  isLoadingTopics?: boolean;
  hasCourseTopics?: boolean;
  recommendedTopics?: any[];
  onBack?: () => void;
  onRequestResubmit?: (reason: string) => Promise<void | boolean>;
  onSaveDraft?: (payload: GradePayload) => Promise<void | boolean>;
  onPublishGrade?: (payload: GradePayload) => Promise<void | boolean>;
  onAiAnnotate?: () => void;
  onRunAuditViva?: () => void;
}

/* ==========================================================================
   2. DEFAULT EMPTY STATE
   ========================================================================== */

export const DEFAULT_STUDENT: StudentInfo = {
  name: '',
  code: '',
  email: '',
  aiRiskLevel: 'low',
  aiRiskLabel: 'low AI-transparency risk',
};

export const DEFAULT_COURSE_INFO: CourseClassInfo = {
  courseCode: '',
  courseTitle: '',
  className: '',
  assignmentTitle: '',
};

export const DEFAULT_SUBMISSION_CODE_LINES: string[] = [];

export const DEFAULT_AI_DECLARATIONS: AiDeclarationPhase[] = [];

/* ==========================================================================
   3. COMPONENT IMPLEMENTATION
   ========================================================================== */

export default function LecturerAcademicEvaluation({

  submissionId,
  student = DEFAULT_STUDENT,
  courseInfo = DEFAULT_COURSE_INFO,
  submissionFile = {
    name: '',
    lines: DEFAULT_SUBMISSION_CODE_LINES,
  },
  file,
  rubricConfigs,
  aiDeclarations = DEFAULT_AI_DECLARATIONS,
  auditData,
  noAiUsed: noAiUsedProp,
  noAiNote: noAiNoteProp,
  initialRubrics = DEFAULT_RUBRIC_SCORES,
  initialFeedback = '',
  initialAiCompliance = 'compliant',
  savedEvaluation,
  topics,
  isLoadingTopics,
  hasCourseTopics: hasCourseTopicsProp,
  recommendedTopics,
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
      name: submissionFile.name || '',
      url: submissionFile.url || '',
      size: typeof submissionFile.size === 'number' ? submissionFile.size : 0,
      mimeType: submissionFile.name?.endsWith('.zip') ? 'application/zip' : 'text/plain',
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

  // Topics to Improve State (Fetched from Topic Module via subjectId)
  const [internalTopics, setInternalTopics] = useState<any[]>(topics || []);
  const [isFetchingTopics, setIsFetchingTopics] = useState<boolean>(false);

  React.useEffect(() => {
    if (topics !== undefined) {
      setInternalTopics(topics);
      return;
    }

    const targetSubjectId = courseInfo?.subjectId;
    if (!targetSubjectId) {
      setInternalTopics([]);
      return;
    }

    let isMounted = true;
    setIsFetchingTopics(true);
    TopicService.getTopics(targetSubjectId)
      .then((res: any) => {
        if (!isMounted) return;
        const list = res?.data || res || [];
        setInternalTopics(Array.isArray(list) ? list : []);
      })
      .catch((err: any) => {
        console.warn('[Topics] Failed to load topics for subject:', err);
        if (isMounted) setInternalTopics([]);
      })
      .finally(() => {
        if (isMounted) setIsFetchingTopics(false);
      });

    return () => {
      isMounted = false;
    };
  }, [courseInfo?.subjectId, topics]);

  const rawTopics = topics !== undefined ? topics : internalTopics;
  const loadingTopics = isLoadingTopics ?? isFetchingTopics;

  // Xác định môn học có cấu hình danh sách chủ đề kiến thức (Topics) hay không
  const hasCourseTopics = useMemo(() => {
    if (typeof hasCourseTopicsProp === 'boolean') {
      return hasCourseTopicsProp;
    }
    if (typeof (courseInfo as any)?.has_course_topics === 'boolean') {
      return (courseInfo as any).has_course_topics;
    }
    if (typeof (courseInfo as any)?.hasCourseTopics === 'boolean') {
      return (courseInfo as any).hasCourseTopics;
    }
    if (typeof savedEvaluation?.has_course_topics === 'boolean') {
      return savedEvaluation.has_course_topics;
    }
    if (Array.isArray((courseInfo as any)?.course_topics)) {
      return (courseInfo as any).course_topics.length > 0;
    }
    if (Array.isArray(savedEvaluation?.course_topics)) {
      return savedEvaluation.course_topics.length > 0;
    }
    if (topics !== undefined) {
      return Array.isArray(topics) && topics.length > 0;
    }
    if (isFetchingTopics) {
      return false;
    }
    return Array.isArray(internalTopics) && internalTopics.length > 0;
  }, [hasCourseTopicsProp, courseInfo, savedEvaluation, topics, internalTopics, isFetchingTopics]);

  // Kết hợp thông tin chủ đề AI gợi ý ôn tập nếu có
  const displayTopics = useMemo(() => {
    if (!Array.isArray(rawTopics) || rawTopics.length === 0) return [];

    const recList =
      recommendedTopics ||
      savedEvaluation?.recommended_topics ||
      savedEvaluation?.evaluation_data?.recommended_topics ||
      (courseInfo as any)?.recommended_topics;

    if (!Array.isArray(recList) || recList.length === 0) {
      return rawTopics;
    }

    const recNames = new Set(
      recList.map((r: any) => (typeof r === 'string' ? r.toLowerCase().trim() : (r.name || r.topic_name || '').toLowerCase().trim()))
    );

    return rawTopics.map((t: any) => {
      const isRec = recNames.has((t.name || '').toLowerCase().trim()) || recNames.has(String(t.id).toLowerCase().trim());
      if (isRec) {
        const foundRec = recList.find((r: any) =>
          (typeof r === 'string' ? r.toLowerCase().trim() : (r.name || r.topic_name || '').toLowerCase().trim()) === (t.name || '').toLowerCase().trim()
        );
        return {
          ...t,
          priority: 'high',
          priority_label: 'Ưu tiên cao (AI đề xuất)',
          description: (typeof foundRec === 'object' && foundRec?.reason) ? foundRec.reason : t.description,
        };
      }
      return t;
    });
  }, [rawTopics, recommendedTopics, savedEvaluation, courseInfo]);

  // Quản lý trạng thái duyệt các chủ đề cần ôn từ AI Audit / DB
  const [reviewTopics, setReviewTopics] = useState<any[]>([]);
  const [isSavingReviewTopics, setIsSavingReviewTopics] = useState<boolean>(false);

  // Nạp danh sách chủ đề cần ôn từ Backend DB nếu đã từng lưu
  React.useEffect(() => {
    if (!activeSubmissionId) return;

    let isMounted = true;
    GradingService.getSubmissionReviewTopics(activeSubmissionId)
      .then((res: any) => {
        if (!isMounted) return;
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setReviewTopics(
            list.map((item: any) => ({
              id: item.topic_id || item.id,
              topic_id: item.topic_id || item.id,
              name: item.topic_name || item.topicName || item.name || '',
              description: item.topicDescription || item.description || '',
              reason: item.reason || '',
              priority: (item.priority || 'medium').toLowerCase(),
              status: item.status || 'pending_review',
              isSelected: item.status !== 'rejected',
            }))
          );
        }
      })
      .catch((err) => {
        console.warn('[ReviewTopics] Error fetching review topics:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSubmissionId]);

  // Danh sách chủ đề hiển thị: ưu tiên reviewTopics, nếu chưa có thì nạp từ displayTopics
  const displayTopicsList = useMemo(() => {
    if (reviewTopics.length > 0) {
      return reviewTopics;
    }
    return displayTopics.map((t: any, idx: number) => {
      const isHighPriority =
        t.priority === 'high' ||
        t.priority === 'urgent' ||
        t.priority_label?.includes('AI đề xuất') ||
        idx < 2;
      return {
        ...t,
        id: t.id || t.topic_id,
        topic_id: t.id || t.topic_id,
        priority: isHighPriority ? 'high' : 'medium',
        status: 'pending_review',
        isSelected: isHighPriority,
        reason: t.description || 'Chủ đề kiến thức cần củng cố thêm.',
      };
    });
  }, [reviewTopics, displayTopics]);

  // Bật/tắt duyệt cho một chủ đề
  const toggleTopicApproved = (topicId: string) => {
    setReviewTopics((prev) => {
      const base = prev.length > 0 ? prev : displayTopicsList;
      return base.map((t) => {
        if ((t.topic_id || t.id) === topicId) {
          const nextSelected = !t.isSelected;
          return {
            ...t,
            isSelected: nextSelected,
            status: nextSelected ? 'approved' : 'rejected',
          };
        }
        return t;
      });
    });
  };

  // Đổi mức độ ưu tiên: 'high' vs 'medium'
  const setTopicPriority = (topicId: string, priority: 'high' | 'medium') => {
    setReviewTopics((prev) => {
      const base = prev.length > 0 ? prev : displayTopicsList;
      return base.map((t) => {
        if ((t.topic_id || t.id) === topicId) {
          return { ...t, priority };
        }
        return t;
      });
    });
  };

  // Chọn tất cả hoặc bỏ chọn tất cả
  const handleToggleAllTopics = () => {
    const allSelected = displayTopicsList.every((t) => t.isSelected);
    setReviewTopics((prev) => {
      const base = prev.length > 0 ? prev : displayTopicsList;
      return base.map((t) => ({
        ...t,
        isSelected: !allSelected,
        status: !allSelected ? 'approved' : 'rejected',
      }));
    });
  };

  // Lưu duyệt chủ đề độc lập
  const handleSaveReviewTopics = async () => {
    if (!activeSubmissionId) {
      showToastNotification('Lỗi', 'Không tìm thấy mã bài nộp để lưu chủ đề.', 'error');
      return;
    }
    const topicsToSave = displayTopicsList;
    if (topicsToSave.length === 0) return;

    setIsSavingReviewTopics(true);
    try {
      const payload = topicsToSave.map((t) => ({
        topic_id: t.topic_id || t.id,
        name: t.name || t.topic_name || '',
        priority: t.priority || 'medium',
        reason: t.reason || t.description || 'Giảng viên yêu cầu củng cố kiến thức.',
        status: t.isSelected ? 'approved' : 'rejected',
      }));
      await GradingService.updateSubmissionReviewTopics(activeSubmissionId, payload);

      setReviewTopics(
        topicsToSave.map((t) => ({
          ...t,
          status: t.isSelected ? 'approved' : 'rejected',
        }))
      );
      showToastNotification(
        'Đã lưu duyệt chủ đề',
        `Đã lưu và duyệt ${topicsToSave.filter((t) => t.isSelected).length} chủ đề cần củng cố cho sinh viên.`
      );
    } catch (err: any) {
      console.warn('[ReviewTopics] Save failed:', err);
      showToastNotification('Lỗi lưu chủ đề', err?.response?.data?.message || err.message, 'error');
    } finally {
      setIsSavingReviewTopics(false);
    }
  };

  const isAiRequired = useMemo(() => {
    if ((courseInfo as any)?.ai_declaration_required === false) return false;
    if (auditData?.submission?.assignment_ai_declaration_required === false) return false;
    if (auditData?.submission?.ai_declaration_required === false) return false;
    if ((auditData as any)?.ai_declaration_required === false) return false;
    if ((auditData as any)?.assignment?.ai_declaration_required === false) return false;
    return true;
  }, [courseInfo, auditData]);

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'ai' | 'grading'>(isAiRequired ? 'ai' : 'grading');

  // Cố định tab 'grading' nếu bài tập không yêu cầu khai báo AI
  React.useEffect(() => {
    if (!isAiRequired && activeTab !== 'grading') {
      setActiveTab('grading');
    }
  }, [isAiRequired, activeTab]);

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

  const hasDeclaredAnyAi = useMemo(() => {
    if (!normalizedAudit) return false;
    if (Array.isArray(normalizedAudit.scopes) && normalizedAudit.scopes.length > 0) {
      return normalizedAudit.scopes.some((scope: any) => {
        if (!scope?.declarations) return false;
        return Object.values(scope.declarations).some((item: any) => {
          const prompt = (item?.prompt || item?.prompt_used || '').trim();
          const response = (item?.response || item?.responseSummary || item?.aiResponseSummary || '').trim();
          const reflection = (item?.reflection || item?.studentReflection || '').trim();
          return prompt.length > 0 || response.length > 0 || reflection.length > 0;
        });
      });
    }
    return false;
  }, [normalizedAudit]);

  const isZeroAi = Boolean(
    noAiUsedProp ||
    (normalizedAudit as any)?.no_ai_used ||
    (normalizedAudit as any)?.noAiUsed ||
    auditData?.no_ai_used ||
    auditData?.noAiUsed
  );
  const studentNoAiNote =
    noAiNoteProp ||
    (normalizedAudit as any)?.no_ai_note ||
    (normalizedAudit as any)?.noAiNote ||
    auditData?.no_ai_note ||
    auditData?.noAiNote ||
    '';

  const isPendingAiSupplement = Boolean(
    isAiRequired &&
    !hasDeclaredAnyAi &&
    !isZeroAi
  );

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

  // Chuẩn hóa Rubric chuyên môn thang 10 theo đúng 5 tiêu chí Rubric gốc (mỗi tiêu chí max 2.0đ, tổng 10.0đ)
  const normalizedInitialRubrics: RubricScores = useMemo(() => {
    if (initialRubrics) {
      const decomp = initialRubrics.decomposition ?? initialRubrics.DECOMPOSITION;
      const pattern = initialRubrics.pattern_recognition ?? initialRubrics.PATTERN_RECOGNITION ?? initialRubrics.pattern;
      const abstraction = initialRubrics.abstraction ?? initialRubrics.ABSTRACTION;
      const algo = initialRubrics.algorithmic_thinking ?? initialRubrics.ALGORITHMIC_THINKING ?? initialRubrics.algorithmic;
      const reflection = initialRubrics.reflection ?? initialRubrics.REFLECTION;

      if (decomp !== undefined || pattern !== undefined || abstraction !== undefined || algo !== undefined || reflection !== undefined) {
        return {
          decomposition: decomp ?? 1.6,
          pattern_recognition: pattern ?? 1.6,
          abstraction: abstraction ?? 1.6,
          algorithmic_thinking: algo ?? 1.3,
          reflection: reflection ?? 1.3,
          pattern: pattern ?? 1.6,
          algorithmic: algo ?? 1.3,
          ...initialRubrics
        };
      }

      // Nếu có 3 tiêu chí cũ, quy đổi sang 5 tiêu chí mới
      if (initialRubrics.core_requirements !== undefined || initialRubrics.technical_quality !== undefined) {
        const sum = (initialRubrics.core_requirements || 0) + (initialRubrics.technical_quality || 0) + (initialRubrics.code_clean || 0);
        const ratio = sum > 0 ? sum / 10 : 0.78;
        return {
          decomposition: parseFloat((2.0 * ratio).toFixed(1)),
          pattern_recognition: parseFloat((2.0 * ratio).toFixed(1)),
          abstraction: parseFloat((2.0 * ratio).toFixed(1)),
          algorithmic_thinking: parseFloat((2.0 * ratio).toFixed(1)),
          reflection: parseFloat((2.0 * ratio).toFixed(1)),
          pattern: parseFloat((2.0 * ratio).toFixed(1)),
          algorithmic: parseFloat((2.0 * ratio).toFixed(1)),
          ...initialRubrics
        };
      }
    }
    return {
      decomposition: 1.6,
      pattern_recognition: 1.6,
      abstraction: 1.6,
      algorithmic_thinking: 1.3,
      reflection: 1.3,
      pattern: 1.6,
      algorithmic: 1.3,
      ...DEFAULT_RUBRIC_SCORES
    };
  }, [initialRubrics]);

  // Rubric Scores State (Thang 10 điểm chuyên môn)
  const isUserModifiedRef = React.useRef(false);
  const [scores, setScores] = useState<RubricScores>(normalizedInitialRubrics);

  // Academic Feedback State (Chỉ lưu nhận xét chính thức của giảng viên)
  const [academicFeedback, setAcademicFeedback] = useState<string>(initialFeedback || '');
  const feedback = academicFeedback;
  const setFeedback = setAcademicFeedback;

  const [aiCompliance, setAiCompliance] = useState<AiComplianceStatus>(initialAiCompliance);

  // Sync state if initialRubrics changes from API, only if user has not manually modified
  React.useEffect(() => {
    if (!isUserModifiedRef.current) {
      setScores(normalizedInitialRubrics);
    }
  }, [normalizedInitialRubrics]);

  // Khi activeSubmissionId thay đổi, reset cờ người dùng tự sửa và nạp feedback chính thức
  React.useEffect(() => {
    isUserModifiedRef.current = false;
    setAcademicFeedback(initialFeedback || '');
  }, [activeSubmissionId]);

  // Cập nhật academicFeedback khi initialFeedback thay đổi (chỉ khi người dùng chưa tự sửa)
  React.useEffect(() => {
    if (!isUserModifiedRef.current) {
      setAcademicFeedback(initialFeedback || '');
    }
  }, [initialFeedback]);

  // Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Modals & Popups
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showReloadAuditModal, setShowReloadAuditModal] = useState(false);
  const [resubmitReason, setResubmitReason] = useState('Vui lòng bổ sung thêm giải trình chi tiết về Redis Token Blacklist trong phase AI Reflection.');
  const [showVivaModal, setShowVivaModal] = useState(false);
  const [showAnnotateToast, setShowAnnotateToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isAuditingAi, setIsAuditingAi] = useState(false);
  const [rubricReasonings, setRubricReasonings] = useState<Record<string, string>>({});
  const [auditIntegrity, setAuditIntegrity] = useState<AuditIntegrity | null>(null);
  const [vivaQuestions, setVivaQuestions] = useState<VivaQuestion[]>([]);

  // AI Verdict Text State: Tách biệt hoàn toàn với Academic Feedback của Giảng viên
  const [aiVerdictText, setAiVerdictText] = useState<string>('');
  const overallAiFeedback = aiVerdictText;
  const setOverallAiFeedback = setAiVerdictText;
  const aiVerdict = aiVerdictText;
  const setAiVerdict = setAiVerdictText;

  // Hàm sao chép nhận xét AI sang ô Feedback của Giảng viên khi chủ động bấm nút
  const handleUseAiVerdictAsFeedback = () => {
    const textToUse = formatCleanVietnamese(aiVerdictText);
    if (!textToUse) return;
    isUserModifiedRef.current = true;
    setAcademicFeedback(textToUse);
    showToastNotification('Đã đưa nhận xét AI vào ô Feedback', 'Nội dung nhận xét từ AI đã được chép vào ô Feedback để giảng viên chỉnh sửa.');
  };

  // Danh sách tiêu chí Rubric động theo cấu hình bài tập (chỉ lấy các tiêu chí is_enabled === true)
  const activeCriteriaList = useMemo(() => {
    let rawConfigs = rubricConfigs || courseInfo?.rubricConfigs || (courseInfo as any)?.rubric_configs || auditData?.rubric_configs;

    // Fallback: nếu chưa có rawConfigs, lấy từ grading_breakdown hoặc rubric_evaluations nếu có
    if (!rawConfigs || !Array.isArray(rawConfigs) || rawConfigs.length === 0) {
      const breakdown = auditData?.grading_breakdown ||
        (auditData as any)?.evaluation_data?.grading_breakdown ||
        savedEvaluation?.grading_breakdown ||
        (savedEvaluation as any)?.evaluation_data?.grading_breakdown ||
        auditData?.rubric_evaluations ||
        savedEvaluation?.rubric_evaluations;

      if (Array.isArray(breakdown) && breakdown.length > 0) {
        rawConfigs = breakdown.map((item: any) => ({
          criterion_key: item.criterion_key,
          criterion_name: item.criteria || item.criterion_name,
          weight_percent: item.weight_percent || (item.max_score ? Number((item.max_score * 10).toFixed(0)) : 20),
          max_score: item.max_score,
          is_enabled: true,
        }));
      }
    }

    if (Array.isArray(rawConfigs) && rawConfigs.length > 0) {
      let enabled = rawConfigs.filter((c: any) => c.is_enabled !== false && Number(c.weight_percent || c.max_score || 0) > 0);

      // Nếu bài tập KHÔNG yêu cầu AI: Tự động loại bỏ tiêu chí AI và quy đổi lại tỷ lệ tiêu chí chuyên môn về đúng tổng 10.0
      if (!isAiRequired) {
        const isAiSpecific = (c: any) => {
          const key = String(c.criterion_key || c.key || '').toUpperCase();
          const name = String(c.criterion_name || c.criteria || c.name || '').toLowerCase();
          const aiKeys = [
            'AI_INTERACTION', 'AI_USAGE', 'AI_AUDIT', 'AI_AUDIT_LOG',
            'METACOGNITIVE_REFLECTION', 'PROMPT_ENGINEERING', 'CRITICAL_EVALUATION_OF_AI', 'AI_COMPLIANCE'
          ];
          if (aiKeys.includes(key)) return true;
          if (key.includes('AI_') || key.includes('_AI') || key === 'AI') return true;
          if (name.includes('ai interaction') || name.includes('prompt engineering') ||
              name.includes('critical evaluation of ai') || name.includes('khai báo ai') ||
              name.includes('sử dụng ai') || name.includes('ai audit') ||
              name.includes('ai transparency') || name.includes('metacognitive reflection')) {
            return true;
          }
          return false;
        };

        const nonAi = enabled.filter((c: any) => !isAiSpecific(c));
        if (nonAi.length > 0) {
          const sumWeight = nonAi.reduce((acc: number, c: any) => acc + (Number(c.weight_percent) || (c.max_score ? Number(c.max_score * 10) : 20)), 0);
          let runningWeight = 0;
          enabled = nonAi.map((c: any, idx: number) => {
            const rawWeight = Number(c.weight_percent) || (c.max_score ? Number(c.max_score * 10) : 20);
            let rescaledWeight: number;
            if (idx === nonAi.length - 1) {
              rescaledWeight = Number((100 - runningWeight).toFixed(1));
            } else {
              rescaledWeight = sumWeight > 0 ? Number(((rawWeight / sumWeight) * 100).toFixed(1)) : Number((100 / nonAi.length).toFixed(1));
              runningWeight += rescaledWeight;
            }
            const rescaledMax = Number(((rescaledWeight / 100) * 10).toFixed(2));
            return {
              ...c,
              weight_percent: rescaledWeight,
              max_score: rescaledMax,
            };
          });
        }
      }

      if (enabled.length > 0) {
        return enabled.map((c: any) => {
          const mappedKey = CANONICAL_RUBRIC_MAP[c.criterion_key] || 'decomposition';
          const preset = PRESET_CRITERIA_META[mappedKey] || PRESET_CRITERIA_META.decomposition;
          const weight = Number(c.weight_percent) || (c.max_score ? Number((c.max_score * 10).toFixed(0)) : 20);
          const maxVal = typeof c.max_score === 'number' ? c.max_score : Number((weight / 10).toFixed(2));
          const p1 = 0;
          const p2 = Number((maxVal * 0.25).toFixed(1));
          const p3 = Number((maxVal * 0.5).toFixed(1));
          const p4 = Number((maxVal * 0.75).toFixed(1));
          const p5 = Number((maxVal * 0.9).toFixed(1));
          const p6 = maxVal;
          const pills = Array.from(new Set([p1, p2, p3, p4, p5, p6])).sort((a, b) => a - b);

          return {
            ...preset,
            criterion_key: c.criterion_key,
            name: c.criterion_name || c.criteria || preset.name,
            max: maxVal,
            weight_percent: weight,
            pills,
          };
        });
      }
    }

    if (!isAiRequired) {
      return [
        {
          ...PRESET_CRITERIA_META.decomposition,
          criterion_key: 'PROBLEM_ABSTRACTION',
          name: 'Problem Abstraction & Solution Design',
          max: 3.0,
          weight_percent: 30,
          pills: [0, 0.8, 1.5, 2.3, 2.7, 3.0],
        },
        {
          ...PRESET_CRITERIA_META.pattern_recognition,
          criterion_key: 'IMPLEMENTATION_QUALITY',
          name: 'Implementation & Code Quality',
          max: 4.0,
          weight_percent: 40,
          pills: [0, 1.0, 2.0, 3.0, 3.6, 4.0],
        },
        {
          ...PRESET_CRITERIA_META.abstraction,
          criterion_key: 'CRITICAL_EVALUATION',
          name: 'Critical Evaluation & Verification',
          max: 3.0,
          weight_percent: 30,
          pills: [0, 0.8, 1.5, 2.3, 2.7, 3.0],
        },
      ];
    }

    return RUBRIC_CRITERIA_LIST;
  }, [rubricConfigs, courseInfo, auditData, savedEvaluation, isAiRequired]);

  // Calculate Total Score (Thang 10 điểm học thuật chuyên môn: Tổng các tiêu chí đang bật)
  const totalScore = parseFloat(
    activeCriteriaList.reduce((acc, crit) => {
      const currentVal = scores[crit.key] ?? (crit.altKey ? scores[crit.altKey] : undefined) ?? scores[crit.apiKey] ?? 0;
      return acc + (Number(currentVal) || 0);
    }, 0).toFixed(2)
  );

  // Update Rubric Score
  const handleUpdateRubric = (key: keyof RubricScores, val: string | number, maxScore: number = 2.0) => {
    isUserModifiedRef.current = true;
    const numVal = typeof val === 'number' ? val : parseFloat(val);
    const validVal = isNaN(numVal) ? 0 : Math.min(maxScore, Math.max(0, parseFloat(numVal.toFixed(1))));
    setScores((prev) => {
      const updated: RubricScores = {
        ...prev,
        [key]: validVal,
      };
      if (key === 'pattern_recognition') updated.pattern = validVal;
      if (key === 'pattern') updated.pattern_recognition = validVal;
      if (key === 'algorithmic_thinking') updated.algorithmic = validVal;
      if (key === 'algorithmic') updated.algorithmic_thinking = validVal;
      return updated;
    });
  };

  // Khớp từng tiêu chí với AI theo cấu hình động
  const applyAiSuggestion = () => {
    isUserModifiedRef.current = true;
    const newScores: RubricScores = { ...scores };
    activeCriteriaList.forEach((crit) => {
      const targetScore = Number((crit.max * 0.78).toFixed(1));
      newScores[crit.key] = targetScore;
      if (crit.altKey) (newScores as any)[crit.altKey] = targetScore;
      if (crit.apiKey) (newScores as any)[crit.apiKey] = targetScore;
    });
    setScores(newScores);
  };

  // Hydrate saved snapshot evaluation from DB if available
  React.useEffect(() => {
    if (savedEvaluation) {
      if (Array.isArray(savedEvaluation.viva_questions) && savedEvaluation.viva_questions.length > 0) {
        setVivaQuestions(savedEvaluation.viva_questions);
      }
      if (savedEvaluation.audit_integrity) {
        setAuditIntegrity(savedEvaluation.audit_integrity);
      }
      const evalText =
        savedEvaluation.overall_verdict ||
        savedEvaluation.summary ||
        savedEvaluation.ai_verdict ||
        savedEvaluation.evaluation_data?.overall_verdict ||
        savedEvaluation.evaluation_data?.summary ||
        '';
      if (evalText) {
        setAiVerdictText(formatCleanVietnamese(evalText));
      } else {
        setAiVerdictText('');
      }
      if (savedEvaluation.rubric_reasonings) {
        setRubricReasonings(savedEvaluation.rubric_reasonings);
      }
      if (savedEvaluation.rubric_scores) {
        setScores((prev) => ({ ...prev, ...savedEvaluation.rubric_scores }));
      } else if (Array.isArray(savedEvaluation.grading_breakdown)) {
        const newSc: RubricScores = { ...scores };
        savedEvaluation.grading_breakdown.forEach((item: any) => {
          const val = Number(item.awarded_score ?? item.score ?? 0);
          const mapped = CANONICAL_RUBRIC_MAP[item.criterion_key];
          if (mapped) newSc[mapped] = val;
          newSc[String(item.criterion_key).toLowerCase()] = val;
          newSc[String(item.criterion_key).toUpperCase()] = val;
        });
        setScores(newSc);
      }
    } else {
      setVivaQuestions([]);
      setAuditIntegrity(null);
      setAiVerdictText('');
      setRubricReasonings({});
    }
  }, [savedEvaluation]);

  const handleAuditWithAi = async (options: { force?: boolean; applyScores?: boolean } = {}) => {
    const { force = true, applyScores = true } = options;
    if (!activeSubmissionId) {
      showToastNotification('Lỗi thẩm định', 'Không xác định được mã bài nộp (submissionId).', 'error');
      return;
    }

    try {
      setIsAuditingAi(true);

      const payload = {
        force,
        ai_declaration_required: isAiRequired,
        no_ai_used: isZeroAi,
        no_ai_note: studentNoAiNote,
        aiAuditSummary: isAiRequired ? {
          declarationAlignment: isZeroAi ? '100%' : '96.4%',
          transparencyIndex: isZeroAi ? '100% (Self-Reliant)' : 'A+',
          reflectionDepth: isZeroAi ? 'Self-Authored' : 'High',
          riskLevel: isZeroAi ? 'low' : (student.aiRiskLevel || 'low'),
          summary: isZeroAi
            ? 'Sinh viên cam kết tự thực hiện 100% không sử dụng AI.'
            : 'Khai báo chi tiết cả tool được chấp thuận và tool bị từ chối.'
        } : null,
        oralExamLogs: [],
        aiDeclarations: isAiRequired ? currentScopeDeclarations : [],
        aiAuditData: isAiRequired ? {
          ...(typeof auditData === 'object' && auditData !== null ? auditData : (normalizedAudit || {})),
          no_ai_used: isZeroAi,
          no_ai_note: studentNoAiNote,
        } : null,
        codeSnippet: actualFile.textContent || (codeLines.join('\n'))
      };

      const res = await SubmissionService.auditRubric(activeSubmissionId, payload);
      const aiData = res?.data || res;

      if (!aiData) {
        throw new Error('Dữ liệu thẩm định AI không tồn tại.');
      }

      // 1. CẬP NHẬT TRỰC TIẾP VÀO STATE HIỂN THỊ ĐIỂM (Đảm bảo re-render ngay trong 1 lần bấm duy nhất)
      if (applyScores) {
        isUserModifiedRef.current = true;
        const newScores: RubricScores = { ...scores };
        const newReasons: Record<string, string> = {};

        // Merge rubric_scores trước (tương thích cả 5 tiêu chí chuẩn và các alias)
        if (aiData.rubric_scores) {
          Object.assign(newScores, aiData.rubric_scores);
        }

        // Merge chi tiết từng criterion từ grading_breakdown, rubric_evaluations hoặc rubrics array
        const evals = Array.isArray(aiData.grading_breakdown)
          ? aiData.grading_breakdown
          : (Array.isArray(aiData.rubric_evaluations)
            ? aiData.rubric_evaluations
            : (Array.isArray(aiData.rubrics) ? aiData.rubrics : []));

        evals.forEach((item: any) => {
          const keyLower = String(item.criterion_id || item.criterion_key || '').toLowerCase();
          const keyUpper = String(item.criterion_key || item.criterion_id || '').toUpperCase();
          const rawScore = item.awarded_score !== undefined ? item.awarded_score : item.score;
          const val = typeof rawScore === 'number' ? rawScore : parseFloat(rawScore);
          if (!isNaN(val)) {
            newScores[keyLower] = val;
            newScores[keyUpper] = val;
            const mapped = CANONICAL_RUBRIC_MAP[item.criterion_key];
            if (mapped) newScores[mapped] = val;
            if (keyLower === 'pattern_recognition') newScores['pattern'] = val;
            if (keyLower === 'algorithmic_thinking') newScores['algorithmic'] = val;
          }
          const reasonText = item.comment || item.reason || item.reasoning || item.short_reason || '';
          if (reasonText) {
            newReasons[keyLower] = reasonText;
            newReasons[keyUpper] = reasonText;
            const mapped = CANONICAL_RUBRIC_MAP[item.criterion_key];
            if (mapped) newReasons[mapped] = reasonText;
            if (keyLower === 'pattern_recognition') newReasons['pattern'] = reasonText;
            if (keyLower === 'algorithmic_thinking') newReasons['algorithmic'] = reasonText;
          }
        });

        // Merge lý do rubric_reasonings
        if (aiData.rubric_reasonings) {
          Object.assign(newReasons, aiData.rubric_reasonings);
        }

        // Cập nhật state điểm và giải trình
        setScores(newScores);
        setRubricReasonings(newReasons);
      } else if (aiData.rubric_reasonings) {
        setRubricReasonings((prev) => ({ ...prev, ...aiData.rubric_reasonings }));
      }

      // 2. Cập nhật câu hỏi Viva, độ liêm chính và nhận xét tổng quan
      if (Array.isArray(aiData.viva_questions) && aiData.viva_questions.length > 0) {
        setVivaQuestions(aiData.viva_questions);
      }
      if (aiData.audit_integrity) {
        setAuditIntegrity(aiData.audit_integrity);
      }

      const verdict = aiData.overall_verdict || aiData.ai_verdict || aiData.overall_feedback || '';
      if (verdict) {
        const cleanVerdict = formatCleanVietnamese(verdict);
        setAiVerdictText(cleanVerdict);
      }

      // 2b. Cập nhật danh sách chủ đề cần củng cố do AI đề xuất
      if (Array.isArray(aiData.recommended_topics) && aiData.recommended_topics.length > 0) {
        setReviewTopics(
          aiData.recommended_topics.map((t: any) => ({
            id: t.topic_id || t.id,
            topic_id: t.topic_id || t.id,
            name: t.name || t.topic_name || '',
            description: t.description || t.reason || '',
            reason: t.reason || '',
            priority: (t.priority || 'high').toLowerCase(),
            status: 'pending_review',
            isSelected: true,
          }))
        );
      }

      // 3. Điểm số và nhận xét đã tự động cập nhật trực tiếp lên giao diện (không bật toast làm vướng màn hình)
    } catch (err: any) {
      console.error('[ART-AI] AI Audit error:', err);
      const is503OrBusy = err?.response?.status === 503 || err?.status === 503 || err?.response?.status === 429 || err?.status === 429;
      if (is503OrBusy) {
        showToastNotification(
          'Hệ thống AI đang bận',
          'Hệ thống AI đang bận xử lý nhiều yêu cầu cùng lúc. Vui lòng thử lại sau vài giây.',
          'error'
        );
      } else {
        const errMsg = err?.response?.data?.message || err?.message || 'Không thể thực hiện đánh giá bằng AI.';
        showToastNotification('Lỗi thẩm định AI', errMsg, 'error');
      }
    } finally {
      setIsAuditingAi(false);
    }
  };

  // Hàm xử lý AI Grade & Regrade AI - CHỈ cập nhật aiVerdictText và điểm Rubric, TUYỆT ĐỐI KHÔNG ghi vào academicFeedback
  const handleAiGrade = async () => {
    await handleAuditWithAi({ force: true, applyScores: true });
  };

  const handleRegradeAi = async () => {
    await handleAuditWithAi({ force: true, applyScores: true });
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

    let topicsPayload: any[] = [];
    if (activeSubmissionId && displayTopicsList.length > 0) {
      topicsPayload = displayTopicsList.map((t: any) => ({
        topic_id: t.topic_id || t.id,
        name: t.name || t.topic_name || '',
        priority: t.priority || 'medium',
        reason: t.reason || t.description || 'Giảng viên yêu cầu củng cố kiến thức.',
        status: t.isSelected ? 'approved' : 'rejected',
      }));

      try {
        await GradingService.updateSubmissionReviewTopics(activeSubmissionId, topicsPayload);
      } catch (topicErr: any) {
        console.error('[handlePublishGrade] Lưu topic thất bại nhưng tiếp tục công bố điểm:', topicErr?.message);
      }
    }

    const payload: GradePayload = {
      score: totalScore,
      feedback,
      rubrics: scores,
      aiComplianceStatus: aiCompliance,
      isDraft: false,
      reviewTopics: topicsPayload,
    };
    try {
      if (onPublishGrade) {
        await onPublishGrade(payload);
      }
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
    <div className="flex-1 min-h-0 flex flex-col h-full w-full max-w-full min-w-0 overflow-hidden overflow-x-hidden bg-[#f8fafc] text-slate-700 font-sans select-none m-0 p-0">
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

      {/* ==================== TOP NAVIGATION BAR (H-14 FLUSH FIT) ==================== */}
      <header className="h-14 w-full max-w-full min-w-0 bg-[#0f172a] text-white px-4 py-2.5 flex items-center justify-between gap-3 border-b border-gray-800 shrink-0 select-none overflow-hidden">
        {/* Khối bên trái: Breadcrumb & Tên SV */}
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <button
            type="button"
            onClick={handleBackClick}
            title="Quay lại danh sách bài nộp của bài tập này"
            className="text-slate-300 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="text-xs font-medium tracking-wide flex items-center gap-1.5 min-w-0 truncate shrink-0">
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
              className="cursor-pointer hover:text-blue-400 transition-colors max-w-[120px] sm:max-w-[160px] truncate text-left bg-transparent border-0 p-0 text-slate-200"
              title={displayCourseName}
            >
              {displayCourseName}
            </button>
            <ChevronRight size={12} className="text-slate-500 shrink-0" />
            <button
              type="button"
              onClick={handleBackClick}
              className="cursor-pointer hover:text-blue-400 transition-colors max-w-[120px] sm:max-w-[160px] truncate text-left bg-transparent border-0 p-0 text-slate-300"
              title={displayAssignmentTitle}
            >
              {displayAssignmentTitle}
            </button>
          </nav>

          {/* Divider & Student Info */}
          <span className="text-slate-700 hidden sm:inline mx-1 shrink-0">|</span>
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-[280px]" title={`${student.name} (${student.code})`}>
              {student.name} ({student.code})
            </span>
          </div>
        </div>

        {/* Khối nút hành động bên phải */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowResubmitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-white text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 transition border border-rose-100 shadow-sm cursor-pointer shrink-0 whitespace-nowrap"
          >
            <RotateCcw size={13} />
            <span>Request Resubmit</span>
          </button>

          <button
            type="button"
            disabled={isPublishing}
            onClick={handlePublishGrade}
            className="flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-xs font-bold hover:opacity-95 shadow-md shadow-orange-500/20 transition cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            <Send size={11} />
            <span>{isPublishing ? 'Đang công bố...' : `Công bố điểm (${totalScore.toFixed(2)} / 10)`}</span>
          </button>
        </div>
      </header>

      {/* ==================== MAIN CONTENT AREA (WORKSPACE BODY) ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 w-full max-w-full min-w-0 h-[calc(100vh-112px)] overflow-hidden bg-white">
        {/* CỘT TRÁI: CODE VIEWER / ANNOTATE (COL-SPAN-6 / XL:COL-SPAN-7) */}
        <div className="lg:col-span-6 xl:col-span-7 min-w-0 w-full flex flex-col h-full overflow-hidden bg-white border-r border-gray-200">
          <SubmissionFileViewer
            file={actualFile}
            onAiAnnotate={handleAiAnnotateClick}
            showAiAnnotationBanner={showAnnotateToast}
            onCloseAiAnnotationBanner={() => setShowAnnotateToast(false)}
            className="w-full h-full min-h-0 flex flex-col overflow-hidden"
          />
        </div>

        {/* CỘT PHẢI: TAB AI DECLARATION & AUDIT / ACADEMIC GRADING (COL-SPAN-6 / XL:COL-SPAN-5) */}
        <aside className="lg:col-span-6 xl:col-span-5 min-w-0 w-full flex flex-col h-full border-l border-slate-200 bg-white overflow-hidden">
          {/* TAB NAVIGATION CỐ ĐỊNH (GRID 2 CỘT 50% - 50%) */}
          {isAiRequired ? (
            <div className="grid grid-cols-2 w-full min-w-0 shrink-0 border-b border-slate-200 select-none bg-white">
              <button
                id="tab-btn-ai"
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`min-w-0 px-2 py-3 text-xs font-bold truncate flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'ai'
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck size={14} className="shrink-0" />
                <span className="truncate">AI DECLARATION & AUDIT</span>
              </button>

              <button
                id="tab-btn-grading"
                type="button"
                onClick={() => setActiveTab('grading')}
                className={`min-w-0 px-2 py-3 text-xs font-bold truncate flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeTab === 'grading'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'border-b-2 border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Bookmark size={14} className="shrink-0" />
                <span className="truncate">ACADEMIC GRADING</span>
              </button>
            </div>
          ) : (
            <div className="h-11 border-b border-gray-200 flex items-center px-4 shrink-0 bg-slate-50/70 select-none w-full min-w-0">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 tracking-wide uppercase truncate">
                <Bookmark size={14} className="text-indigo-600 shrink-0" />
                <span className="truncate">BẢNG CHẤM ĐIỂM CHUYÊN MÔN (ACADEMIC GRADING)</span>
              </div>
            </div>
          )}

          {/* VÙNG NỘI DUNG CUỘN RIÊNG BIỆT CHO MỖI TAB */}
          <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
            {/* ==================== TAB 1: AI DECLARATION & AUDIT ==================== */}
            {isAiRequired && (
              <div
                id="panel-ai"
                className={`flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden p-4 pb-16 space-y-4 custom-scroll ${
                  activeTab === 'ai' ? '' : 'hidden'
                }`}
              >
              {/* Header Section */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 tracking-wide uppercase">
                  <Layers size={14} className="text-orange-500" />
                  <span>
                    {isZeroAi
                      ? 'SINH VIÊN CAM KẾT KHÔNG SỬ DỤNG AI (ZERO-AI)'
                      : `STUDENT AI DECLARATION (${scopes.length > 1 ? `${scopes.length} PHẠM VI / SCOPES` : '5 PHASES'})`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isZeroAi ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      100% Transparent (Self-Reliant)
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded border border-slate-200">
                      Self-Reported
                    </span>
                  )}
                </div>
              </div>

              {/* BANNER ZERO-AI CAM KẾT TỰ LÀM 100% */}
              {isZeroAi && (
                <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex flex-col gap-2.5 text-emerald-950 shadow-2xs shrink-0">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-2">
                        <span>SINH VIÊN CAM KẾT TỰ THỰC HIỆN 100% (ZERO-AI DECLARATION)</span>
                        <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                          Không dùng AI
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        Sinh viên cam kết đã tự hoàn thành 100% mã nguồn và tài liệu của bài nộp này mà không cần đến sự hỗ trợ của các công cụ GenAI. Bài làm được bảo lưu mức độ liêm chính học thuật tối đa.
                      </p>
                    </div>
                  </div>
                  {studentNoAiNote && (
                    <div className="mt-1 p-3 bg-white/80 border border-emerald-200 rounded-xl text-xs text-slate-800">
                      <span className="font-bold text-emerald-900">Ghi chú / Phương pháp tự thực hiện của sinh viên: </span>
                      <span className="italic text-slate-700">{studentNoAiNote}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Thông báo nhẹ nhàng khi sinh viên chưa bổ sung khai báo AI */}
              {isPendingAiSupplement && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 shadow-2xs shrink-0">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-amber-800">
                      Chưa có dữ liệu khai báo AI Audit Log
                    </div>
                    <div className="text-amber-700 leading-relaxed">
                      Sinh viên đã nộp bài trước khi bật yêu cầu khai báo AI và chưa cập nhật bổ sung. Giảng viên vẫn có thể đánh giá và chấm điểm bài làm bình thường tại tab Academic Grading.
                    </div>
                  </div>
                </div>
              )}

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
              {isZeroAi && !hasAnyDeclaration ? (
                <div className="border border-emerald-200 rounded-2xl p-6 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                      Cam kết tự thực hiện 100% (No AI Used)
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-medium max-w-md mx-auto leading-relaxed">
                      Sinh viên cam kết không sử dụng bất kỳ công cụ AI nào khi làm bài. Không yêu cầu khai báo 5 tiêu chí tương tác AI.
                    </p>
                  </div>
                  {studentNoAiNote && (
                    <div className="bg-white border border-emerald-200/80 rounded-xl px-4 py-2 text-xs text-slate-700 max-w-lg text-left shadow-2xs">
                      <strong className="text-emerald-800">Phương pháp thực hiện: </strong>
                      <span>{studentNoAiNote}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('grading')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      <span>Chuyển sang Chấm điểm (Grading)</span>
                      <ChevronRight size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowVivaModal(true);
                        if (vivaQuestions.length === 0 && !isAuditingAi) {
                          handleAuditWithAi({ force: false, applyScores: false });
                        }
                        if (onRunAuditViva) onRunAuditViva();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      <Zap size={13} />
                      <span>Tạo Câu Hỏi Vấn Đáp Xác Minh Code</span>
                    </button>
                  </div>
                </div>
              ) : !hasAnyDeclaration ? (
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
                <div className="w-full max-w-full overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-xs shrink-0">
                  <div className="w-full max-w-full overflow-x-auto overflow-y-auto custom-scroll max-h-[460px]">
                    <table className="w-full min-w-[690px] border-collapse text-left text-xs table-fixed">
                      <colgroup>
                        <col className="w-[105px]" />
                        <col className="w-[105px]" />
                        <col className="w-[160px]" />
                        <col className="w-[160px]" />
                        <col className="w-[160px]" />
                      </colgroup>
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider z-10">
                        <tr>
                          <th className="py-2.5 px-2.5 w-[105px] border-b border-slate-200 bg-slate-50">
                            Phase / Rubric
                          </th>
                          <th className="py-2.5 px-2.5 w-[105px] border-b border-slate-200 bg-slate-50">
                            Tool & Decision
                          </th>
                          <th className="py-2.5 px-2.5 w-[160px] border-b border-slate-200 bg-slate-50">
                            Prompt Input
                          </th>
                          <th className="py-2.5 px-2.5 w-[160px] border-b border-slate-200 bg-slate-50">
                            AI Response
                          </th>
                          <th className="py-2.5 px-2.5 w-[160px] border-b border-slate-200 bg-slate-50">
                            Student Reflection / Self-Evaluation
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px] text-slate-600">
                        {currentScopeDeclarations.map((item) => (
                          <tr key={item.phaseKey} className="hover:bg-slate-50/60 transition">
                            {/* CỘT 1: PHASE / RUBRIC */}
                            <td className="p-3 align-top">
                              <div className="min-h-[100px] flex flex-col justify-start">
                                <span
                                  className={`inline-block px-2.5 py-1.5 ${item.badgeBg} ${item.badgeText} font-bold rounded-lg text-[10px] leading-tight text-center`}
                                >
                                  {item.phaseName}
                                </span>
                              </div>
                            </td>

                            {/* CỘT 2: TOOL & DECISION */}
                            <td className="p-3 align-top">
                              <div className="min-h-[100px] flex flex-col justify-start space-y-1.5">
                                <div className="font-bold text-slate-800 text-xs truncate" title={item.aiTool}>
                                  {item.aiTool}
                                </div>
                                <span
                                  className={`inline-block px-2 py-0.5 ${item.decisionBg} ${item.decisionText} rounded-md text-[9.5px] font-semibold border truncate`}
                                  title={item.decision}
                                >
                                  {item.decision}
                                </span>
                              </div>
                            </td>

                            {/* CỘT 3: PROMPT INPUT (EQUAL WIDTH & UNIFORM SCROLL) */}
                            <td className="p-3 align-top">
                              <div className="min-h-[100px] max-h-48 overflow-y-auto custom-scroll p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words">
                                {item.prompt ? (
                                  item.prompt
                                ) : (
                                  <span className="italic text-slate-400 font-sans">Không có câu lệnh (Prompt)</span>
                                )}
                              </div>
                            </td>

                            {/* CỘT 4: AI RESPONSE (EQUAL WIDTH & UNIFORM SCROLL) */}
                            <td className="p-3 align-top">
                              <div className="min-h-[100px] max-h-48 overflow-y-auto custom-scroll p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-slate-700 text-[11px] leading-relaxed whitespace-pre-wrap break-words">
                                {item.aiResponseSummary ? (
                                  item.aiResponseSummary
                                ) : (
                                  <span className="italic text-slate-400">Không có phản hồi từ AI</span>
                                )}
                              </div>
                            </td>

                            {/* CỘT 5: STUDENT REFLECTION (EQUAL WIDTH & UNIFORM SCROLL) */}
                            <td className="p-3 align-top">
                              <div className="min-h-[100px] max-h-48 overflow-y-auto custom-scroll p-3 rounded-xl bg-amber-50/40 border border-amber-100 text-slate-800 text-[11px] font-medium leading-relaxed whitespace-pre-wrap break-words">
                                {item.studentReflection ? (
                                  item.studentReflection
                                ) : (
                                  <span className="italic text-slate-400 font-normal">Không có tự phản chiếu</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bottom Action Box: Thanh tra trung thực AI / Kiểm chứng code */}
              <div className="pt-2 space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>{isZeroAi ? 'KIỂM CHỨNG QUYỀN SỞ HỮU CODE & VẤN ĐÁP VIVA' : 'THANH TRA TRUNG THỰC AI & VẤN ĐÁP VIVA'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isZeroAi
                        ? 'Tự động tạo câu hỏi Viva kiểm chứng năng lực code độc lập của sinh viên'
                        : 'Kiểm định tự động độ khớp giữa lời khai và mã nguồn thực tế'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isAuditingAi}
                    onClick={() => setShowReloadAuditModal(true)}
                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="Chạy lại thanh tra & cập nhật câu hỏi vấn đáp"
                  >
                    <RefreshCw size={14} className={isAuditingAi ? "animate-spin text-purple-600" : ""} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowVivaModal(true);
                    if (vivaQuestions.length === 0 && !isAuditingAi) {
                      handleAuditWithAi({ force: false, applyScores: false });
                    }
                    if (onRunAuditViva) onRunAuditViva();
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Zap size={13} />
                  <span>{isZeroAi ? 'Tạo Câu Hỏi Vấn Đáp Xác Minh Code (Zero-AI)' : 'Chạy Thanh Tra & Tạo Vấn Đáp'}</span>
                </button>
              </div>
            </div>
            )}

            {/* ==================== TAB 2: ACADEMIC GRADING ==================== */}
            <div
              id="panel-grading"
              className={`flex-1 min-h-0 flex flex-col p-4 pb-16 overflow-y-auto overflow-x-hidden custom-scroll space-y-6 ${
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

                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={isAuditingAi}
                    onClick={handleAiGrade}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isAuditingAi ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{isAiRequired ? 'AI đang thẩm định 5 tiêu chí...' : 'AI đang thẩm định điểm chuyên môn...'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-amber-300" />
                        <span>AI Grade</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isAuditingAi}
                    onClick={() => setShowRegenerateModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Chấm lại bằng AI (Regrade AI)"
                  >
                    {isAuditingAi ? (
                      <>
                        <div className="w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                        <span>Đang phân tích lại...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={13} className="text-slate-500" />
                        <span>Regrade AI</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug max-w-xs mx-auto">
                  Điểm AI sẽ tự động điền vào các thanh trượt bên dưới; giảng viên có thể kéo thanh trượt để ghi đè điểm theo ý muốn.
                </p>
              </div>

              {/* Khối tích hợp: Kết luận Thanh tra & Nhận xét Tổng quan từ AI */}
              {aiVerdictText && (
                <div className="p-4 bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-blue-50/50 border border-purple-200/90 rounded-2xl text-xs text-purple-950 shadow-xs shrink-0 animate-in fade-in space-y-2.5">
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-purple-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <ShieldCheck size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-purple-900 text-xs uppercase tracking-wide block">
                          {isAiRequired ? 'Kết Luận Thanh Tra & Vấn Đáp (AI Verdict)' : 'Nhận Xét & Đánh Giá Chuyên Môn (AI Verdict)'}
                        </span>
                        <span className="text-[10px] text-purple-600/80 font-medium">
                          {isAiRequired ? 'Đối soát chéo & Thẩm định tự động Gemini' : 'Thẩm định mã nguồn tự động Gemini'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleUseAiVerdictAsFeedback}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-white hover:bg-purple-100/70 border border-purple-200 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs shrink-0"
                      title="Sao chép toàn bộ nhận xét này vào ô nhận xét học thuật của Giảng viên"
                    >
                      <Sparkles size={11} className="text-purple-600" />
                      <span>Dùng làm nhận xét</span>
                    </button>
                  </div>

                  <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap break-words font-medium">
                    {aiVerdictText}
                  </p>
                </div>
              )}

              {/* KHỐI CHỦ ĐỀ TRỌNG TÂM CẦN ÔN TẬP (RECOMMENDED TOPICS TO IMPROVE) - CHỈ HIỂN THỊ KHI MÔN HỌC CÓ CẤU HÌNH TOPICS */}
              {hasCourseTopics && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs shrink-0 space-y-3.5 transition-all">
                  <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-slate-100 flex-wrap">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 border border-orange-200/80 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <BookOpen size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide leading-snug">
                            Chủ đề trọng tâm cần ôn tập
                          </h3>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                            {displayTopicsList.filter((t: any) => t.isSelected && t.status !== 'rejected').length} / {displayTopicsList.length} được duyệt gửi
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                          Recommended Topics to Improve • Giảng viên phê duyệt trước khi gửi sang kế hoạch học tập của sinh viên
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Tích chọn chủ đề cần củng cố và điều chỉnh mức độ ưu tiên. Khi bấm <strong className="text-slate-700 font-semibold">Công bố điểm</strong>, các chủ đề được duyệt sẽ tự động gửi vào lộ trình học tập cá nhân hóa của sinh viên.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-start pt-0.5 flex-wrap">
                      {/* Nút chọn tất cả / bỏ chọn */}
                      {displayTopicsList.length > 0 && (
                        <button
                          type="button"
                          onClick={handleToggleAllTopics}
                          className="text-[10px] font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                        >
                          {displayTopicsList.every((t: any) => t.isSelected && t.status !== 'rejected') ? 'Bỏ chọn hết' : 'Duyệt tất cả'}
                        </button>
                      )}

                      {/* Nút lưu duyệt chủ đề */}
                      {displayTopicsList.length > 0 && (
                        <button
                          type="button"
                          disabled={isSavingReviewTopics}
                          onClick={handleSaveReviewTopics}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50 shadow-2xs"
                          title="Lưu trạng thái phê duyệt các chủ đề này ngay bây giờ"
                        >
                          <CheckCircle size={11} className="text-emerald-600" />
                          <span>{isSavingReviewTopics ? 'Đang lưu...' : 'Lưu duyệt'}</span>
                        </button>
                      )}

                      {/* Nút thêm vào nhận xét */}
                      {displayTopicsList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const approved = displayTopicsList.filter((t: any) => t.isSelected && t.status !== 'rejected');
                            const topicNames = (approved.length > 0 ? approved : displayTopicsList).map((t: any) => t.name).join(', ');
                            const note = `\n\n📌 Chủ đề trọng tâm cần củng cố thêm: ${topicNames}.`;
                            isUserModifiedRef.current = true;
                            setFeedback((prev) => (prev ? `${prev.trim()}${note}` : note.trim()));
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100/80 border border-orange-200 px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0 shadow-2xs"
                          title="Thêm danh sách các chủ đề này vào ô Nhận xét học thuật"
                        >
                          <Sparkles size={11} className="text-orange-600" />
                          <span>Thêm vào nhận xét</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Danh sách Topics / Loading / Empty State */}
                  {loadingTopics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 animate-pulse">
                      <div className="h-24 bg-slate-100 rounded-xl"></div>
                      <div className="h-24 bg-slate-100 rounded-xl"></div>
                    </div>
                  ) : displayTopicsList && displayTopicsList.length > 0 ? (
                    <div className="max-h-[340px] overflow-y-auto custom-scroll pr-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {displayTopicsList.map((topic: any, idx: number) => {
                          const isApproved = topic.status === 'approved' || (topic.status !== 'rejected' && topic.isSelected);
                          const isHigh = topic.priority === 'high';

                          return (
                            <div
                              key={topic.id || topic.topic_id || idx}
                              onClick={() => toggleTopicApproved(topic.topic_id || topic.id)}
                              className={`p-3 rounded-xl border transition-all shadow-2xs flex flex-col justify-between gap-2.5 cursor-pointer select-none ${
                                isApproved
                                  ? 'bg-orange-50/25 border-orange-300 ring-1 ring-orange-200/60'
                                  : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-90'
                              }`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <input
                                      type="checkbox"
                                      checked={isApproved}
                                      onChange={() => toggleTopicApproved(topic.topic_id || topic.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer shrink-0"
                                    />
                                    <h4
                                      className="font-semibold text-xs sm:text-sm text-gray-800 leading-snug break-words flex-1 min-w-0"
                                      title={topic.name}
                                    >
                                      {topic.name}
                                    </h4>
                                  </div>

                                  <span
                                    className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full border whitespace-nowrap self-start ${
                                      isApproved
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}
                                  >
                                    {isApproved ? '✓ Đã duyệt gửi' : '✕ Bác bỏ'}
                                  </span>
                                </div>

                                <p
                                  className="text-[11px] text-slate-500 leading-relaxed break-words pl-6"
                                  title={topic.reason || topic.description}
                                >
                                  {topic.reason || topic.description || 'Chủ đề kiến thức cốt lõi thuộc môn học cần củng cố và rèn luyện thêm.'}
                                </p>
                              </div>

                              <div
                                className="flex items-center justify-between pt-2 border-t border-slate-100/80 pl-6 text-[10px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="text-slate-400 font-medium">Mức độ ưu tiên:</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setTopicPriority(topic.topic_id || topic.id, 'high')}
                                    className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer border ${
                                      isHigh
                                        ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-2xs'
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    Ưu tiên cao
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTopicPriority(topic.topic_id || topic.id, 'medium')}
                                    className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer border ${
                                      !isHigh
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-2xs'
                                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    Khuyến nghị
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center space-y-1.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <Compass size={16} />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">Chưa có chủ đề trọng tâm nào</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Môn học này hiện chưa có chủ đề gắn cờ cần cải thiện hoặc sinh viên đã đáp ứng tốt các yêu cầu học thuật.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Điều chỉnh Rubric chuyên môn thang 10 */}
              <div className={`space-y-3.5 ${hasCourseTopics || aiVerdictText ? 'pt-2 border-t border-slate-100' : ''} shrink-0`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    ĐIỀU CHỈNH TIÊU CHÍ RUBRIC CHUẨN ({activeCriteriaList.length} TIÊU CHÍ)
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {activeCriteriaList.length} Tiêu chí • Điểm tối đa theo trọng số • Tổng 10.0đ
                  </span>
                </div>

                {activeCriteriaList.map((crit) => {
                  const currentVal = scores[crit.key] ?? (crit.altKey ? scores[crit.altKey] : undefined) ?? scores[crit.apiKey] ?? 0;
                  const reasoning = rubricReasonings[crit.key] || (crit.altKey ? rubricReasonings[crit.altKey] : undefined) || rubricReasonings[crit.apiKey];
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
                            step="0.1"
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
                            {pillVal.toFixed(pillVal % 1 === 0 ? 0 : 1)}
                          </button>
                        ))}
                      </div>

                      {/* Range slider */}
                      <input
                        type="range"
                        min="0"
                        max={crit.max}
                        step="0.1"
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
              {isAiRequired && (
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

      {/* ==================== MODAL: CONFIRM RELOAD AI AUDIT & VIVA ==================== */}
      {showReloadAuditModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <RefreshCw size={20} className={`text-purple-600 ${isAuditingAi ? 'animate-spin' : ''}`} />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 leading-snug">
                      Xác nhận chạy lại thanh tra AI?
                    </h3>
                    <button
                      type="button"
                      disabled={isAuditingAi}
                      onClick={() => setShowReloadAuditModal(false)}
                      className="text-slate-400 hover:text-slate-600 transition -mr-1 -mt-1 p-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                    Thao tác này sẽ phân tích lại toàn bộ lịch sử khai báo AI và cập nhật bộ câu hỏi vấn đáp mới. Điểm số của bài nộp sẽ được giữ nguyên.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isAuditingAi}
                  onClick={() => setShowReloadAuditModal(false)}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isAuditingAi}
                  onClick={async () => {
                    try {
                      await handleAuditWithAi({ force: true, applyScores: false });
                    } finally {
                      setShowReloadAuditModal(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAuditingAi ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang phân tích...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={13} />
                      <span>Xác nhận</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ==================== MODAL: CONFIRM REGENERATE AI EVALUATION ==================== */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-[999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles size={20} className="text-purple-600" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 leading-snug">
                    Xác nhận phân tích lại bằng AI?
                  </h3>
                  <button
                    type="button"
                    disabled={isAuditingAi}
                    onClick={() => setShowRegenerateModal(false)}
                    className="text-slate-400 hover:text-slate-600 transition -mr-1 -mt-1 p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <X size={15} />
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                  Thao tác này sẽ gọi AI tạo điểm gợi ý và nhận xét mới, đồng thời ghi đè lên kết quả đánh giá hiện tại.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isAuditingAi}
                onClick={() => setShowRegenerateModal(false)}
                className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isAuditingAi}
                onClick={async () => {
                  try {
                    await handleRegradeAi();
                  } finally {
                    setShowRegenerateModal(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAuditingAi ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang phân tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Xác nhận phân tích</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: VIVA & AUDIT INSPECTOR ==================== */}
      {showVivaModal && (
        <div 
          className="fixed top-16 right-0 bottom-0 left-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/45 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowVivaModal(false)}
        >
          <div 
            className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[calc(100vh-112px)] my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* 1. FIXED MODAL HEADER - Luôn hiển thị ở trên cùng, không bị che khuất bởi navbar */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                  <Zap size={20} className="fill-white/20" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {isZeroAi
                      ? 'Báo Cáo Kiểm Chứng Quyền Sở Hữu Code & Bộ Câu Hỏi Vấn Đáp'
                      : 'Báo Cáo Thanh Tra Trung Thực AI & Bộ Câu Hỏi Vấn Đáp Viva'}
                  </h3>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                    <span>
                      {isZeroAi
                        ? 'Sinh viên cam kết tự thực hiện 100% không dùng AI • Câu hỏi kiểm tra bản chất code'
                        : 'Đối chiếu AST Code + Git Commit History + Lời khai 5 Rubrics'}
                    </span>
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
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scroll">
              
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
                    {isZeroAi ? 'Cam Kết Liêm Chính' : 'Độ Khớp Lời Khai'}
                  </div>
                  <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
                    auditIntegrity?.penalty_applied ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {isZeroAi ? '100%' : (auditIntegrity ? `${auditIntegrity.match_percentage.toFixed(0)}%` : '96.4%')}
                  </div>
                  <div className={`text-[10px] mt-1 font-medium ${
                    auditIntegrity?.penalty_applied ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {isZeroAi
                      ? 'Zero-AI (Tự làm 100%)'
                      : auditIntegrity 
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
                    {isZeroAi ? '100%' : (auditIntegrity ? auditIntegrity.ai_transparency_index : 'A+')}
                  </div>
                  <div className={`text-[10px] mt-1 font-medium ${
                    auditIntegrity?.penalty_applied ? 'text-amber-600' : 'text-indigo-600'
                  }`}>
                    {isZeroAi
                      ? 'Minh bạch tự thân tuyệt đối'
                      : auditIntegrity 
                      ? (auditIntegrity.penalty_applied ? 'Khai báo đối phó/sơ sài' : 'Khai báo chi tiết các tool') 
                      : 'Kiểm toán tự động'}
                  </div>
                </div>

                {/* Thẻ 3: Self-Reflection Depth / AI Risk */}
                <div className={`p-4 rounded-2xl border text-center transition ${
                  auditIntegrity?.penalty_applied 
                    ? 'bg-rose-50/70 border-rose-200' 
                    : 'bg-purple-50/70 border-purple-200'
                }`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${
                    auditIntegrity?.penalty_applied ? 'text-rose-700' : 'text-purple-700'
                  }`}>
                    {isZeroAi ? 'Mức Độ Rủi Ro AI' : 'Self-Reflection Depth'}
                  </div>
                  <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
                    auditIntegrity?.penalty_applied ? 'text-rose-700' : 'text-purple-700'
                  }`}>
                    {isZeroAi ? 'LOW RISK' : (auditIntegrity ? auditIntegrity.reflection_depth : 'High')}
                  </div>
                  <div className={`text-[10px] mt-1 font-medium ${
                    auditIntegrity?.penalty_applied ? 'text-rose-600' : 'text-purple-600'
                  }`}>
                    {isZeroAi
                      ? 'Không phụ thuộc AI'
                      : auditIntegrity 
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
                    <span>
                      {isZeroAi
                        ? 'Bộ Câu Hỏi Vấn Đáp Xác Minh Quyền Sở Hữu Code (Code Ownership Verification)'
                        : 'Bộ Câu Hỏi Vấn Đáp (Viva Questions) Bám Sát Code Thực Tế'}
                    </span>
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
                              {formatCleanVietnamese(q.question)}
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
                                {formatCleanVietnamese(answerCriteria)}
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
                        disabled={isAuditingAi}
                        onClick={() => handleAuditWithAi({ force: true, applyScores: true })}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Phân Tích Code & Tạo Câu Hỏi Viva
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. FIXED MODAL FOOTER - Luôn hiển thị ở đáy modal */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Thanh tra hoàn tất lúc {new Date().toLocaleTimeString('vi-VN')}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowVivaModal(false)}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
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
