import React, { useState, useRef, useEffect } from 'react';
import {
  Brain,
  Puzzle,
  Scan,
  Layers,
  GitBranch,
  Lightbulb,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Clock,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Edit3,
  Plus,
  Check,
  FileCode,
  FileArchive,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  X,
  Briefcase,
  History,
  FileCheck2,
  Undo2,
  Cloud,
  CheckCheck,
  Loader2
} from 'lucide-react';
import AssignmentService from '../../services/assignment.service';
import SubmissionService from '../../services/submission.service';
import './StudentAssignmentFlow.css';

/* ==========================================================================
   1. TYPESCRIPT INTERFACES & DOMAIN MODELS
   ========================================================================== */

export type ViewMode = 'VIEW_STATUS' | 'FORM';
export type FormStep = 1 | 2;

export type RubricKey =
  | 'decomposition'
  | 'pattern'
  | 'abstraction'
  | 'algorithmic'
  | 'reflection';

export type AiTool =
  | 'ChatGPT'
  | 'Claude'
  | 'Gemini'
  | 'GitHub Copilot'
  | 'Other';

export type AiDecision =
  | 'Fully Accepted'
  | 'Partially Modified'
  | 'Heavily Adapted'
  | 'Rejected';

export type SubmissionStatus = 'No submission' | 'Draft' | 'Submitted' | 'Graded';

export type RubricFormField =
  | 'aiTool'
  | 'decision'
  | 'prompt'
  | 'responseSummary'
  | 'reflection';

// ─── Multi-Scope types ───────────────────────────────────────────────────────
export interface AiScope {
  id?: string;
  scopeId: string;
  scope_title?: string;
  title: string;         // e.g. "Backend API"
  scope_description?: string;
  description: string;   // short note for this scope
  declarations: Record<RubricKey, AiDeclarationRubric>;
}

export interface Assignment {
  id: string;
  title: string;
  courseCode: string;
  courseTitle: string;
  dueDate: string;
  deadlineRaw?: string | null;
  allowLateSubmission?: boolean;
  content: string;
  instructions?: string;
  maxScore?: number | null;
  weight?: number | null;
  aiDeclarationRequired?: boolean;
  minAiInteractions?: number;
  maxAiInteractions?: number;
  instructor: {
    name: string;
    avatarUrl?: string;
    role?: string;
  };
  additionalFiles?: Array<{
    id: string;
    name: string;
    size: string;
    url?: string;
    materialId?: string;
    assignmentId?: string;
  }>;
  score?: number | null;
}

export interface AiDeclarationRubric {
  rubricKey: RubricKey;
  title: string;
  description: string;
  aiTool: AiTool;
  decision: AiDecision;
  prompt: string;
  responseSummary: string;
  reflection: string;
  isCompleted: boolean;
  isModified?: boolean; // Track if edited in current session
}

export interface SubmissionFile {
  name: string;
  size: number; // in bytes
  type?: string;
  lastModified?: number;
  url?: string;
}

export interface SubmissionData {
  id?: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  lastEditedAt?: string | null;
  version?: number;
  file: SubmissionFile | null;
  feedback?: string;
  transparencyScore?: number; // 0 - 100%
  declarations: Record<RubricKey, AiDeclarationRubric>;
  /** Multi-scope: array of named scopes, each with its own 5-rubric declarations */
  scopes?: AiScope[];
  score?: number | null;
  grade?: any;
  rubrics?: any;
}

export interface SanityCheckResult {
  relevance_status: 'MATCH' | 'MISMATCH_OR_SUSPICIOUS';
  relevance_reason: string;
  diagnostic_warnings: string[];
  micro_suggestions: string[];
  tone_message?: string;
}

/* ==========================================================================
   2. CONSTANTS & METADATA
   ========================================================================== */

export const RUBRIC_METADATA: Record<
  RubricKey,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    placeholderPrompt: string;
    placeholderResponse: string;
    placeholderReflection: string;
  }
> = {
  decomposition: {
    title: 'Decomposition',
    description: 'Breaking down complex problems into smaller, manageable parts.',
    icon: Puzzle,
    placeholderPrompt: 'e.g., Help me break down the e-commerce checkout flow into microservices...',
    placeholderResponse: 'e.g., The AI suggested 4 decoupled modules: Order, Cart, Payment, and Shipping...',
    placeholderReflection: 'e.g., I adopted the 4 modules but merged Cart into Order to avoid network latency...',
  },
  pattern: {
    title: 'Pattern Recognition',
    description: 'Identifying trends, similarities, or recurring rules in the problem or data.',
    icon: Scan,
    placeholderPrompt: 'e.g., What architectural design patterns best fit asynchronous order processing?',
    placeholderResponse: 'e.g., Recommended Saga pattern with RabbitMQ or Outbox Pattern with PostgreSQL...',
    placeholderReflection: 'e.g., Selected Saga Pattern because our team is experienced with choreography...',
  },
  abstraction: {
    title: 'Abstraction',
    description: 'Focusing on important information only, ignoring irrelevant details.',
    icon: Layers,
    placeholderPrompt: 'e.g., Create a high-level entity relationship diagram omitting audit fields...',
    placeholderResponse: 'e.g., AI provided a clean C4 Container diagram highlighting public APIs...',
    placeholderReflection: 'e.g., Validated boundary context, stripped out vendor-specific cloud IDs...',
  },
  algorithmic: {
    title: 'Algorithmic Thinking',
    description: 'Developing step-by-step solutions or rules to solve the problem.',
    icon: GitBranch,
    placeholderPrompt: 'e.g., Outline the step-by-step reconciliation algorithm for failed transactions...',
    placeholderResponse: 'e.g., 5-step exponential backoff retry followed by dead-letter queue routing...',
    placeholderReflection: 'e.g., Tuned maximum retries from 5 to 3 to comply with gateway SLA...',
  },
  reflection: {
    title: 'Reflection',
    description: 'Critically assessing AI suggestions and evaluating learning outcomes.',
    icon: Lightbulb,
    placeholderPrompt: 'e.g., What are the security pitfalls of relying solely on JWT in our design?',
    placeholderResponse: 'e.g., Highlighted token revocation challenges and secret key leakage risks...',
    placeholderReflection: 'e.g., Realized that GenAI can suggest insecure defaults; introduced redis blacklist...',
  },
};

export const AI_TOOLS: AiTool[] = [
  'ChatGPT',
  'Claude',
  'Gemini',
  'GitHub Copilot',
  'Other',
];

export const AI_DECISIONS: AiDecision[] = [
  'Fully Accepted',
  'Partially Modified',
  'Heavily Adapted',
  'Rejected',
];

export const INITIAL_DECLARATIONS: Record<RubricKey, AiDeclarationRubric> = {
  decomposition: {
    rubricKey: 'decomposition',
    title: RUBRIC_METADATA.decomposition.title,
    description: RUBRIC_METADATA.decomposition.description,
    aiTool: 'ChatGPT',
    decision: 'Partially Modified',
    prompt: '',
    responseSummary: '',
    reflection: '',
    isCompleted: false,
  },
  pattern: {
    rubricKey: 'pattern',
    title: RUBRIC_METADATA.pattern.title,
    description: RUBRIC_METADATA.pattern.description,
    aiTool: 'Claude',
    decision: 'Heavily Adapted',
    prompt: '',
    responseSummary: '',
    reflection: '',
    isCompleted: false,
  },
  abstraction: {
    rubricKey: 'abstraction',
    title: RUBRIC_METADATA.abstraction.title,
    description: RUBRIC_METADATA.abstraction.description,
    aiTool: 'ChatGPT',
    decision: 'Fully Accepted',
    prompt: '',
    responseSummary: '',
    reflection: '',
    isCompleted: false,
  },
  algorithmic: {
    rubricKey: 'algorithmic',
    title: RUBRIC_METADATA.algorithmic.title,
    description: RUBRIC_METADATA.algorithmic.description,
    aiTool: 'GitHub Copilot',
    decision: 'Partially Modified',
    prompt: '',
    responseSummary: '',
    reflection: '',
    isCompleted: false,
  },
  reflection: {
    rubricKey: 'reflection',
    title: RUBRIC_METADATA.reflection.title,
    description: RUBRIC_METADATA.reflection.description,
    aiTool: 'Gemini',
    decision: 'Partially Modified',
    prompt: '',
    responseSummary: '',
    reflection: '',
    isCompleted: false,
  },
};

export const DEFAULT_ASSIGNMENT: Assignment = {
  id: 'asm-swd392-01',
  title: 'Nộp Project',
  courseCode: 'SWD392',
  courseTitle: 'Server-Side development with NodeJS, Express, and PostgreSQL',
  dueDate: '2026-03-25 12:50:00 (GMT+07)',
  content:
    'Design and implement the high-concurrency Backend Architecture with C4 model specifications. Students must submit full architectural documentation and declare all GenAI tools employed across the 5 Computational Thinking rubrics.',
  instructor: {
    name: 'Dr. Alan Smith',
    role: 'Lecturer in Software Engineering',
  },
  additionalFiles: [
    {
      id: 'f1',
      name: 'Project_Specification_v2.pdf',
      size: '1.8 MB',
      url: '#',
    },
    {
      id: 'f2',
      name: 'C4_Model_Template.drawio',
      size: '640 KB',
      url: '#',
    },
  ],
  score: null,
};

// Initial sample submission in Submitted state for demonstration
export const SAMPLE_SUBMITTED_STATE: SubmissionData = {
  status: 'Submitted',
  submittedAt: '2026-03-24 14:20:00',
  lastEditedAt: '2026-03-24 14:20:00',
  version: 1,
  file: {
    name: 'SE18D01_VietKhoa_C4Diagrams.pdf',
    size: 3420000,
    type: 'application/pdf',
    lastModified: 1774336800000,
  },
  feedback: 'No feedback yet. Submitted successfully. Waiting for grading.',
  transparencyScore: 94,
  declarations: {
    decomposition: {
      rubricKey: 'decomposition',
      title: RUBRIC_METADATA.decomposition.title,
      description: RUBRIC_METADATA.decomposition.description,
      aiTool: 'ChatGPT',
      decision: 'Partially Modified',
      prompt: 'Help me break down the e-commerce checkout flow into microservices...',
      responseSummary: 'The AI suggested 4 decoupled modules: Order, Cart, Payment, and Shipping...',
      reflection: 'I adopted the 4 modules but merged Cart into Order to avoid network latency in PostgreSQL.',
      isCompleted: true,
    },
    pattern: {
      rubricKey: 'pattern',
      title: RUBRIC_METADATA.pattern.title,
      description: RUBRIC_METADATA.pattern.description,
      aiTool: 'Claude',
      decision: 'Heavily Adapted',
      prompt: 'What architectural design patterns best fit asynchronous order processing?',
      responseSummary: 'Recommended Saga pattern with RabbitMQ or Outbox Pattern with PostgreSQL...',
      reflection: 'Selected Saga Pattern because our team is experienced with event choreography.',
      isCompleted: true,
    },
    abstraction: {
      rubricKey: 'abstraction',
      title: RUBRIC_METADATA.abstraction.title,
      description: RUBRIC_METADATA.abstraction.description,
      aiTool: 'ChatGPT',
      decision: 'Fully Accepted',
      prompt: 'Create a high-level C4 container diagram omitting low-level audit fields...',
      responseSummary: 'AI provided a clean C4 Container diagram highlighting public APIs and databases.',
      reflection: 'Validated boundary context and confirmed service isolation with course requirements.',
      isCompleted: true,
    },
    algorithmic: {
      rubricKey: 'algorithmic',
      title: RUBRIC_METADATA.algorithmic.title,
      description: RUBRIC_METADATA.algorithmic.description,
      aiTool: 'GitHub Copilot',
      decision: 'Partially Modified',
      prompt: 'Outline the step-by-step reconciliation algorithm for failed transactions...',
      responseSummary: '5-step exponential backoff retry followed by dead-letter queue routing...',
      reflection: 'Tuned maximum retries from 5 to 3 to comply with gateway SLA.',
      isCompleted: true,
    },
    reflection: {
      rubricKey: 'reflection',
      title: RUBRIC_METADATA.reflection.title,
      description: RUBRIC_METADATA.reflection.description,
      aiTool: 'Gemini',
      decision: 'Partially Modified',
      prompt: 'What are the security pitfalls of relying solely on JWT in our design?',
      responseSummary: 'Highlighted token revocation challenges and secret key leakage risks...',
      reflection: 'Introduced Redis blacklist for revoked tokens rather than accepting stateless JWT defaults.',
      isCompleted: true,
    },
  },
  // Multi-scope demo data
  scopes: [
    {
      scopeId: 'scope-backend',
      title: 'Backend API',
      description: 'NestJS REST API + PostgreSQL + Redis Cache',
      declarations: {
        decomposition: {
          rubricKey: 'decomposition', title: 'Decomposition', description: '',
          aiTool: 'ChatGPT', decision: 'Partially Modified',
          prompt: 'Help me break down the e-commerce checkout flow into microservices...',
          responseSummary: 'The AI suggested 4 decoupled modules: Order, Cart, Payment, and Shipping.',
          reflection: 'I adopted the 4 modules but merged Cart into Order to avoid network latency.',
          isCompleted: true,
        },
        pattern: {
          rubricKey: 'pattern', title: 'Pattern Recognition', description: '',
          aiTool: 'Claude', decision: 'Heavily Adapted',
          prompt: 'What architectural design patterns best fit asynchronous order processing?',
          responseSummary: 'Recommended Saga pattern with RabbitMQ or Outbox Pattern with PostgreSQL.',
          reflection: 'Selected Saga Pattern because our team is experienced with event choreography.',
          isCompleted: true,
        },
        abstraction: {
          rubricKey: 'abstraction', title: 'Abstraction', description: '',
          aiTool: 'ChatGPT', decision: 'Fully Accepted',
          prompt: 'Create a high-level C4 container diagram omitting low-level audit fields...',
          responseSummary: 'AI provided a clean C4 Container diagram highlighting public APIs.',
          reflection: 'Validated boundary context and confirmed service isolation.',
          isCompleted: true,
        },
        algorithmic: {
          rubricKey: 'algorithmic', title: 'Algorithmic Thinking', description: '',
          aiTool: 'GitHub Copilot', decision: 'Partially Modified',
          prompt: 'Outline the step-by-step reconciliation algorithm for failed transactions...',
          responseSummary: '5-step exponential backoff retry followed by dead-letter queue routing.',
          reflection: 'Tuned maximum retries from 5 to 3 to comply with gateway SLA.',
          isCompleted: true,
        },
        reflection: {
          rubricKey: 'reflection', title: 'Reflection', description: '',
          aiTool: 'Gemini', decision: 'Partially Modified',
          prompt: 'What are the security pitfalls of relying solely on JWT?',
          responseSummary: 'Highlighted token revocation challenges and secret key leakage risks.',
          reflection: 'Introduced Redis blacklist for revoked tokens rather than accepting stateless JWT defaults.',
          isCompleted: true,
        },
      },
    },
    {
      scopeId: 'scope-frontend',
      title: 'Frontend React',
      description: 'Next.js 14 + TailwindCSS + Zustand State',
      declarations: {
        decomposition: {
          rubricKey: 'decomposition', title: 'Decomposition', description: '',
          aiTool: 'ChatGPT', decision: 'Partially Modified',
          prompt: 'How should I split the product listing page into reusable React components?',
          responseSummary: 'AI suggested atomic design: Atoms (Button, Badge), Molecules (ProductCard), Organisms (ProductGrid).',
          reflection: 'Adopted atomic structure; merged Molecules and Organisms for simpler team workflow.',
          isCompleted: true,
        },
        pattern: {
          rubricKey: 'pattern', title: 'Pattern Recognition', description: '',
          aiTool: 'Gemini', decision: 'Heavily Adapted',
          prompt: 'What React state management patterns best fit a large e-commerce frontend?',
          responseSummary: 'Recommended Zustand for lightweight global state and React Query for server state.',
          reflection: 'Used Zustand for cart & auth, React Query for product data fetching.',
          isCompleted: true,
        },
        abstraction: {
          rubricKey: 'abstraction', title: 'Abstraction', description: '',
          aiTool: 'Claude', decision: 'Fully Accepted',
          prompt: 'Design a generic useApiQuery hook that abstracts React Query boilerplate.',
          responseSummary: 'AI generated a typed generic hook supporting pagination, caching, and error boundaries.',
          reflection: 'Adopted hook design fully; reduced 40% of data-fetching boilerplate across 12 pages.',
          isCompleted: true,
        },
        algorithmic: {
          rubricKey: 'algorithmic', title: 'Algorithmic Thinking', description: '',
          aiTool: 'ChatGPT', decision: 'Partially Modified',
          prompt: 'Implement an optimistic UI update algorithm for the cart add-to-cart action.',
          responseSummary: 'AI described rollback pattern: optimistic update → API call → revert on error.',
          reflection: 'Implemented rollback with toast notifications; added retry mechanism for network failures.',
          isCompleted: true,
        },
        reflection: {
          rubricKey: 'reflection', title: 'Reflection', description: '',
          aiTool: 'GitHub Copilot', decision: 'Partially Modified',
          prompt: 'What accessibility pitfalls should I address in the checkout form?',
          responseSummary: 'Highlighted missing aria-labels, keyboard nav gaps, and insufficient color contrast.',
          reflection: 'Fixed 6 WCAG issues flagged by AI; manual audit revealed 2 additional focus traps.',
          isCompleted: true,
        },
      },
    },
  ],
};

/* ==========================================================================
   3. HELPER UTILITIES
   ========================================================================== */

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getDecisionBadgeStyle(decision?: string | null): {
  bg: string;
  text: string;
  border: string;
} {
  const norm = (decision || '').toLowerCase().trim();
  if (norm.includes('fully') || norm.includes('accepted') || norm === 'accept') {
    return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
  }
  if (norm.includes('heavily') || norm.includes('adapted') || norm === 'adapt') {
    return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
  }
  if (norm.includes('reject')) {
    return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
  }
  // Luôn trả về default an toàn, không bao giờ undefined
  return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
}

/* ==========================================================================
   4. SUB-COMPONENT: ASSIGNMENT OVERVIEW (CỘT TRÁI - 1/3)
   ========================================================================== */

interface AssignmentOverviewProps {
  assignment: Assignment;
  activeAssignmentTitle: string;
  score?: number | null;
}

export const AssignmentOverview: React.FC<AssignmentOverviewProps> = ({
  assignment,
  activeAssignmentTitle,
  score,
}) => {
  const [isTocOpen, setIsTocOpen] = useState(true);

  return (
    <div className="space-y-5">
      {/* Requirements Card: AI Declaration Requirement */}
      {assignment.aiDeclarationRequired !== false ? (
        <div className="saf-overview-card bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wide">
            <Sparkles size={15} className="text-amber-600 shrink-0" />
            <span>Yêu cầu khai báo AI</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed font-medium">
            ⚠️ Bài tập này bắt buộc khai báo minh bạch AI Audit Log (các công cụ và prompt AI sử dụng khi làm bài).
          </p>
          <div className="pt-2 border-t border-amber-200/60 flex items-center gap-1.5 text-[11px] text-amber-700">
            <CheckCircle2 size={13} className="text-amber-600 shrink-0" />
            <span>Phải hoàn tất ít nhất 1 mục khai báo tương tác AI tại Bước 2</span>
          </div>
        </div>
      ) : (
        <div className="saf-overview-card bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wide">
            <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
            <span>Không yêu cầu khai báo AI</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            ℹ️ Bài tập nộp thông thường (Không bắt buộc khai báo tương tác AI).
          </p>
        </div>
      )}

      {/* Card 1: Table of contents */}
      <div className="saf-overview-card bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <button
          type="button"
          onClick={() => setIsTocOpen(!isTocOpen)}
          className="w-full flex items-center justify-between font-bold text-slate-800 text-sm cursor-pointer mb-3 focus:outline-none"
        >
          <span>Table of contents</span>
          {isTocOpen ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </button>

        {isTocOpen && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              ASSIGNMENTS
            </div>

            {/* Active Assignment Item */}
            <div className="flex items-center justify-between bg-indigo-50/80 border border-indigo-100 rounded-xl p-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center text-xs shrink-0">
                  <Briefcase size={14} />
                </span>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {activeAssignmentTitle}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
                Current
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Card 2: Content */}
      <div className="saf-overview-card bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">Description</h3>
        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
          {assignment.content || 'N/A'}
        </p>

        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center">
            {assignment.instructor?.name && assignment.instructor.name !== 'N/A'
              ? assignment.instructor.name.substring(0, 2).toUpperCase()
              : 'GV'}
          </div>
          <span>Posted by {assignment.instructor?.name || 'N/A'}</span>
        </div>
      </div>

      {/* Card 3: Additional Files & Due Date */}
      <div className="saf-overview-card bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          ADDITIONAL FILES & DUE DATE
        </div>

        <div className="space-y-1.5 text-xs text-slate-700">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock size={14} className="text-amber-500 shrink-0" />
            <span className="font-bold text-slate-800">DUE DATE:</span>
          </div>
          <p className="text-xs text-slate-700 pl-5 font-mono">
            {assignment.dueDate}
          </p>
        </div>

        <div className="text-xs font-bold flex items-center justify-between pt-1 border-t border-slate-100">
          <span className="text-slate-500 font-medium">Evaluation Score</span>
          <span
            className={`font-semibold px-2 py-0.5 rounded font-mono ${
              score != null
                ? 'bg-emerald-50 text-emerald-700 font-bold'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {score != null ? `${Number(score).toFixed(2)} / ${assignment.maxScore ?? 10}` : 'SCORE: N/A'}
          </span>
        </div>

        <div className="pt-2 space-y-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Resources Attached
            </span>
            {assignment.additionalFiles && assignment.additionalFiles.length > 0 ? (
              assignment.additionalFiles.map((file) => (
                <a
                  key={file.id}
                  href={file.url || '#'}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (file.materialId && file.assignmentId) {
                      try {
                        const res = await AssignmentService.getMaterialDownloadUrl(file.assignmentId, file.materialId);
                        const downloadUrl = res?.data?.download_url || res?.download_url;
                        if (downloadUrl) {
                          window.open(downloadUrl, '_blank');
                          return;
                        }
                      } catch (err) {
                        console.error('Download material failed:', err);
                      }
                    }
                    if (file.url && file.url !== '#') {
                      window.open(file.url, '_blank');
                    } else {
                      alert(`Tải file tài liệu: ${file.name}`);
                    }
                  }}
                  className="flex items-center justify-between bg-slate-50 hover:bg-blue-50/60 p-2.5 rounded-xl border border-slate-200/80 transition group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={15} className="text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 truncate">
                        {file.name}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {file.size}
                      </span>
                    </div>
                  </div>
                  <Download
                    size={14}
                    className="text-slate-400 group-hover:text-blue-600 shrink-0"
                  />
                </a>
              ))
            ) : (
              <div className="text-[11px] text-slate-400 italic">
                Chưa có tài liệu đính kèm (N/A)
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   5. SUB-COMPONENT: AI AUDIT LOG CARD (SUMMARY VIEW)
   ========================================================================== */

/**
 * Helper kiểm tra tiêu chí Rubric đã điền đầy đủ cả 3 mục text:
 * 1. prompt
 * 2. response / responseSummary
 * 3. reflection / studentReflection
 * Tuyệt đối không tính khi chỉ chọn dropdown mà chưa có text.
 */
export function isRubricDeclaredComplete(item?: any): boolean {
  if (!item || typeof item !== 'object') return false;
  const prompt = (item.prompt || item.prompt_used || item.promptUsed || item.promptContent || '').trim();
  const response = (item.responseSummary || item.response || item.aiResponseSummary || item.ai_response_summary || item.aiResponse || '').trim();
  const reflection = (item.reflection || item.studentReflection || item.student_reflection || item.selfReflection || '').trim();
  return prompt.length > 0 && response.length > 0 && reflection.length > 0;
}

interface AiAuditLogCardProps {
  declarations: Record<RubricKey, AiDeclarationRubric>;
  scopes?: AiScope[];
  transparencyScore?: number;
  lastEditedAt?: string | null;
  version?: number;
}

export const AiAuditLogCard: React.FC<AiAuditLogCardProps> = ({
  declarations,
  scopes,
  transparencyScore = 95,
  lastEditedAt,
  version = 1,
}) => {
  const [expandedKey, setExpandedKey] = useState<RubricKey | null>(null);
  const [activeScopeIdx, setActiveScopeIdx] = useState(0);
  const rubricKeys: RubricKey[] = [
    'decomposition',
    'pattern',
    'abstraction',
    'algorithmic',
    'reflection',
  ];

  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const dragStartXRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Wheel listener: chuyển con lăn chuột dọc (deltaY) thành cuộn ngang cho chuột cắm dây/chuột rời
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth && e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !tabsContainerRef.current) return;
    setIsDraggingTabs(true);
    hasMovedRef.current = false;
    dragStartXRef.current = e.pageX;
    scrollStartLeftRef.current = tabsContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const hasScopes = Array.isArray(scopes) && scopes.length > 0;
  const activeDeclarations = (hasScopes
    ? (scopes![Math.min(activeScopeIdx, scopes!.length - 1)]?.declarations || declarations)
    : declarations) || INITIAL_DECLARATIONS;
  const totalCompleted = hasScopes
    ? scopes!.reduce((acc, s) => acc + rubricKeys.filter(k => isRubricDeclaredComplete(s?.declarations?.[k])).length, 0)
    : rubricKeys.filter(k => isRubricDeclaredComplete(declarations?.[k])).length;
  const totalRubrics = hasScopes ? scopes!.length * 5 : 5;
  const completedCount = rubricKeys.filter(k => isRubricDeclaredComplete(activeDeclarations?.[k])).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
      {/* Header Audit Log */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
            <Brain size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                AI Audit Log Status (ART-AI)
              </h4>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck size={12} />
                <span>Verified Transparency</span>
              </span>
              {version > 1 && (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Version {version}.0
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Computational Thinking audit trail across 5 rubrics.
              {lastEditedAt && ` Last revised: ${lastEditedAt}`}
            </p>
          </div>
        </div>

        {/* Score Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          <Sparkles size={14} className="text-amber-500" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
              Transparency Score
            </span>
            <span className="text-xs font-extrabold text-slate-800">
              {transparencyScore}% ({totalCompleted}/{totalRubrics} Rubrics)
            </span>
          </div>
        </div>
      </div>

      {/* SCOPE TABS (multi-scope mode) */}
      {hasScopes && scopes!.length > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => tabsContainerRef.current?.scrollBy({ left: -140, behavior: 'smooth' })}
            className="p-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 transition cursor-pointer shrink-0"
            title="Cuộn sang trái"
          >
            <ChevronLeft size={13} />
          </button>

          <div
            ref={tabsContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`flex gap-1.5 overflow-x-auto pb-1.5 edux-tab-scroll flex-1 max-w-full ${
              isDraggingTabs ? 'is-dragging' : ''
            }`}
          >
            {scopes!.map((scope, idx) => {
              const sc = rubricKeys.filter(k => isRubricDeclaredComplete(scope.declarations[k])).length;
              const isAct = idx === Math.min(activeScopeIdx, scopes!.length - 1);
              return (
                <button
                  key={scope.scopeId || idx}
                  type="button"
                  onClick={() => {
                    if (hasMovedRef.current) return;
                    setActiveScopeIdx(idx);
                    setExpandedKey(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer whitespace-nowrap transition select-none ${
                    isAct ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <span>{scope.scope_title || scope.title || `Khai báo ${idx + 1}`}</span>
                  <span className={`text-[9px] font-bold px-1.5 rounded ${
                    isAct ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>{sc}/5</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => tabsContainerRef.current?.scrollBy({ left: 140, behavior: 'smooth' })}
            className="p-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 transition cursor-pointer shrink-0"
            title="Cuộn sang phải"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Rubric Breakdown List */}
      <div className="space-y-2.5">
        {rubricKeys.map((key, idx) => {
          const item = activeDeclarations?.[key] || INITIAL_DECLARATIONS[key];
          const meta = RUBRIC_METADATA[key];
          const Icon = meta.icon;
          const isExpanded = expandedKey === key;
          const badge = getDecisionBadgeStyle(item?.decision);

          return (
            <div
              key={key}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-150"
            >
              <div
                onClick={() => setExpandedKey(isExpanded ? null : key)}
                className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <Icon size={16} className="text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {meta.title}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate hidden sm:block">
                      {meta.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {item?.aiTool || 'ChatGPT'}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${badge?.bg || 'bg-amber-50'} ${badge?.text || 'text-amber-700'} ${badge?.border || 'border-amber-200'}`}
                  >
                    {item?.decision || 'Partially Modified'}
                  </span>

                  <span className="p-1 text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-slate-50/40 border-t border-slate-100 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
                    {/* CỘT 1: PROMPT INPUT */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Prompt / Input Used
                      </span>
                      <div className="flex-1 min-h-[100px] max-h-48 overflow-y-auto custom-scroll p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                        {item?.prompt || (
                          <span className="italic text-slate-400 font-sans">No prompt recorded.</span>
                        )}
                      </div>
                    </div>

                    {/* CỘT 2: AI RESPONSE */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        AI Response Summary
                      </span>
                      <div className="flex-1 min-h-[100px] max-h-48 overflow-y-auto custom-scroll p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-[11px] text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                        {item?.responseSummary || (
                          <span className="italic text-slate-400">No summary recorded.</span>
                        )}
                      </div>
                    </div>

                    {/* CỘT 3: STUDENT REFLECTION */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Student's Self-Reflection
                      </span>
                      <div className="flex-1 min-h-[100px] max-h-48 overflow-y-auto custom-scroll p-3 rounded-xl bg-amber-50/40 border border-amber-100 text-[11px] font-medium text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                        {item?.reflection || (
                          <span className="italic text-slate-400 font-normal">No reflection recorded.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ==========================================================================
   6. SUB-COMPONENT: SUBMISSION STATUS VIEW (CHẾ ĐỘ A: VIEW_STATUS)
   ========================================================================== */

interface SubmissionStatusViewProps {
  submission: SubmissionData;
  onAddOrEditClick: () => void;
  maxScore?: number;
  isLateBlocked?: boolean;
  dueDate?: string;
}

export const SubmissionStatusView: React.FC<SubmissionStatusViewProps> = ({
  submission,
  onAddOrEditClick,
  maxScore = 10,
  isLateBlocked = false,
  dueDate = 'N/A',
}) => {
  const isDraft = submission.status === 'Draft';
  const isGraded = submission.status === 'Graded' || submission.score != null || submission.grade?.score != null;
  const isSubmitted = submission.status === 'Submitted' || isGraded;
  const finalScore = submission.score ?? submission.grade?.score;

  // Chuẩn hóa điểm 5 Rubric để luôn hiển thị chính xác thang 2.0 / rubric (tổng 10.0)
  const rubricDetails = React.useMemo(() => {
    const r = submission.rubrics || submission.grade?.rubrics;
    if (r && r.decomposition !== undefined) {
      return {
        decomposition: Number(r.decomposition || 0),
        pattern: Number(r.pattern || 0),
        abstraction: Number(r.abstraction || 0),
        algorithmic: Number(r.algorithmic || 0),
        reflection: Number(r.reflection || 0),
      };
    }
    if (r && (r.r1 !== undefined || r.r2 !== undefined || r.r3 !== undefined)) {
      const sum = (r.r1 || 0) + (r.r2 || 0) + (r.r3 || 0);
      const part = Math.min(2, parseFloat((sum / 5).toFixed(2)));
      return {
        decomposition: part,
        pattern: part,
        abstraction: part,
        algorithmic: part,
        reflection: Math.min(2, parseFloat((sum - part * 4).toFixed(2))),
      };
    }
    if (finalScore != null) {
      const num = Number(finalScore);
      const part = Math.min(2, Math.max(0, parseFloat((num / 5).toFixed(2))));
      return {
        decomposition: part,
        pattern: part,
        abstraction: part,
        algorithmic: part,
        reflection: Math.min(2, Math.max(0, parseFloat((num - part * 4).toFixed(2)))),
      };
    }
    return null;
  }, [submission.rubrics, submission.grade?.rubrics, finalScore]);

  return (
    <div className="space-y-6">
      {/* Header với Tiêu đề & Nút Hành động */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Submission Status
            </h2>
            {isSubmitted && submission.version && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                v{submission.version}.0
              </span>
            )}
            {isDraft && (
              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                <Bookmark size={11} className="text-amber-600" />
                <span>Bản nháp (Draft - Chưa nộp chính thức)</span>
              </span>
            )}
            {isGraded && (
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                Score: {Number(finalScore).toFixed(2)} / 10
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of student file submission and ART-AI transparency audit log.
          </p>
        </div>

        {isLateBlocked ? (
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-xs font-bold uppercase tracking-wide cursor-not-allowed">
            <AlertCircle size={15} />
            <span>Hết hạn nộp</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAddOrEditClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition shadow-xs cursor-pointer ${
              isSubmitted
                ? 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50'
                : isDraft
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white shadow-amber-500/20'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white shadow-orange-500/20'
            }`}
          >
            {isSubmitted ? (
              <>
                <Edit3 size={15} />
                <span>{isGraded ? 'EDIT SUBMISSION (GRADED)' : 'EDIT SUBMISSION'}</span>
              </>
            ) : isDraft ? (
              <>
                <Edit3 size={15} />
                <span>TIẾP TỤC CHỈNH SỬA BẢN NHÁP</span>
              </>
            ) : (
              <>
                <Plus size={15} />
                <span>ADD SUBMISSION</span>
              </>
            )}
          </button>
        )}
      </div>

      {isLateBlocked && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700 font-medium">
          <AlertCircle size={18} className="text-rose-500 shrink-0" />
          <div>
            <span>Hạn nộp bài đã kết thúc{dueDate && dueDate !== 'N/A' ? ` (${dueDate})` : ''}. Bài tập này không cho phép nộp muộn.</span>
          </div>
        </div>
      )}

      {/* Bảng thông tin trạng thái bài nộp chuẩn EduX */}
      <div className="space-y-5">
        {/* Hàng 1: SUBMISSION STATUS & SUBMISSION TIME */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              SUBMISSION STATUS
            </div>
            {isGraded ? (
              <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1 rounded-full">
                <CheckCircle2 size={13} className="text-indigo-600" />
                <span>Graded (Đã chấm điểm)</span>
              </span>
            ) : isDraft ? (
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full">
                <Bookmark size={13} className="text-amber-600" />
                <span>Bản nháp (Draft - Chưa nộp chính thức)</span>
              </span>
            ) : isSubmitted ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-full">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Submitted</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium px-3 py-1 rounded-full">
                <AlertCircle size={13} className="text-slate-400" />
                <span>No submission</span>
              </span>
            )}
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              SUBMISSION TIME
            </div>
            <div className="space-y-0.5">
              {isDraft ? (
                <>
                  <span className="text-xs text-amber-700 font-semibold block">
                    Chưa nộp chính thức (Bản nháp)
                  </span>
                  {submission.lastEditedAt && (
                    <span className="text-[11px] text-slate-500 block">
                      Lưu gần nhất: {submission.lastEditedAt}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-xs text-slate-700 font-mono font-medium block">
                    {submission.submittedAt
                      ? `${submission.submittedAt} (GMT+07)`
                      : '—'}
                  </span>
                  {submission.lastEditedAt && submission.lastEditedAt !== submission.submittedAt && (
                    <span className="text-[10px] text-slate-400 italic block">
                      (Edited: {submission.lastEditedAt})
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* KẾT QUẢ ĐÁNH GIÁ (EVALUATION RESULT) - ĐÃ TỐI GIẢN HÓA */}
        {isGraded && (
          <div className="pt-2 border-t border-slate-100">
            <div className="bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border border-indigo-100 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Kết quả đánh giá (Evaluation Result)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Điểm số chính thức và nhận xét từ giảng viên
                  </p>
                </div>
                
                <div className="inline-flex items-baseline gap-1.5 bg-white border-2 border-indigo-200 px-4 py-2 rounded-xl shadow-xs self-start sm:self-auto">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Final Grade:</span>
                  <span className="text-2xl font-black text-indigo-600">
                    {finalScore != null ? Number(finalScore).toFixed(2) : 'N/A'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    / {Number(submission.grade?.max_score ?? maxScore ?? 10).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Nhận xét của Giảng viên */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nhận xét của Giảng viên
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {submission.feedback || submission.grade?.feedback || 'Chưa có nhận xét'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hàng 2: LINK/FILE ASSIGNMENT */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            LINK / FILE ASSIGNMENT
          </div>
          {submission.file ? (
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileCode size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {submission.file.name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {formatFileSize(submission.file.size)} • {isDraft ? 'Bản nháp (Draft file - Chưa nộp)' : 'Active submission file'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert(`Downloading: ${submission.file?.name}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              — No file attached yet.
            </div>
          )}
        </div>

        {/* Hàng 3: FEEDBACK (khi chưa có điểm) */}
        {!isGraded && (
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            FEEDBACK
          </div>
          <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
            {isDraft
              ? (submission.feedback || 'Bản nháp đang được lưu an toàn. Nhấn "Tiếp tục chỉnh sửa bản nháp" để hoàn tất và nộp chính thức.')
              : isSubmitted
              ? submission.feedback ||
                'No feedback yet. Submitted successfully. Waiting for grading.'
              : '—'}
          </div>
        </div>
        )}

        {/* Hàng 4: AI AUDIT LOG STATUS */}
        <div className="pt-2 border-t border-slate-100">
          {isSubmitted || (isDraft && (submission.scopes?.length || Object.values(submission.declarations || {}).some(d => d?.prompt || d?.isCompleted))) ? (
            <AiAuditLogCard
              declarations={submission.declarations}
              scopes={submission.scopes}
              transparencyScore={submission.transparencyScore || 95}
              lastEditedAt={submission.lastEditedAt}
              version={submission.version || 1}
            />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-2 bg-slate-50/30">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Brain size={20} />
              </div>
              <h4 className="text-xs font-bold text-slate-700">
                AI Audit Log Not Recorded
              </h4>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Once you submit your project file and declare GenAI interactions,
                your 5-rubric transparency audit log will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   7. SUB-COMPONENT: STEP 1 - FILE UPLOADER (TỐI GIẢN & HỖ TRỢ ĐA ĐỊNH DẠNG)
   ========================================================================== */

interface FileUploaderProps {
  currentFile: SubmissionFile | null;
  isEditMode: boolean;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onCancel: () => void;
  onNext: () => void;
  aiDeclarationRequired?: boolean;
  onSubmitDirect?: () => void;
  isSubmittingPayload?: boolean;
  onSaveDraft?: () => void;
  isSavingDraft?: boolean;
  isUploadingFile?: boolean;
  uploadProgress?: number | null;
  autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onRunSanityCheck?: () => void;
  isSanityChecking?: boolean;
}

const ALLOWED_FILE_EXTENSIONS = [
  'java', 'py', 'cpp', 'c', 'cs', 'js', 'ts', 'html', 'css',
  'zip', 'rar', '7z', 'tar', 'gz',
  'pdf', 'docx', 'doc'
];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export const FileUploader: React.FC<FileUploaderProps> = ({
  currentFile,
  isEditMode,
  onFileSelect,
  onFileRemove,
  onCancel,
  onNext,
  aiDeclarationRequired = true,
  onSubmitDirect,
  isSubmittingPayload = false,
  isUploadingFile = false,
  uploadProgress = null,
  autoSaveStatus = 'idle',
  onRunSanityCheck,
  isSanityChecking = false,
}) => {
  const isAiRequired = Boolean(aiDeclarationRequired ?? false);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive size={24} className="text-amber-600" />;
    }
    if (['java', 'py', 'cpp', 'c', 'cs', 'js', 'ts', 'html', 'css'].includes(ext)) {
      return <FileCode size={24} className="text-indigo-600" />;
    }
    return <FileText size={24} className="text-blue-600" />;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length > 1) {
        alert('Vui lòng nén toàn bộ các file thành một tệp .ZIP duy nhất trước khi nộp!');
        return;
      }
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length > 1) {
        alert('Vui lòng nén toàn bộ các file thành một tệp .ZIP duy nhất trước khi nộp!');
        return;
      }
      validateAndProcessFile(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndProcessFile = (file: File) => {
    const nameLower = file.name.toLowerCase();
    const ext = nameLower.split('.').pop() || '';
    const isTarGz = nameLower.endsWith('.tar.gz');

    if (!ALLOWED_FILE_EXTENSIONS.includes(ext) && !isTarGz) {
      alert('Định dạng tệp không được hỗ trợ! Vui lòng chọn tệp mã nguồn (.java, .py, .cpp, .js...), tài liệu (.pdf, .docx) hoặc tệp nén (.zip, .rar).');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert('Tệp vượt quá dung lượng cho phép (Tối đa 50MB)!');
      return;
    }

    onFileSelect(file);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onFileRemove();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 tracking-wide uppercase">
          <UploadCloud size={16} className="text-blue-600" />
          <span>{isEditMode ? 'STEP 1: SUBMISSION FILE MANAGEMENT' : 'STEP 1: UPLOAD SUBMISSION FILE'}</span>
        </div>
      </div>

      {/* THANH TIẾN TRÌNH KHI ĐANG TỰ ĐỘNG UPLOAD FILE LÊN SERVER */}
      {isUploadingFile && (
        <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/70 flex items-center gap-3.5 shadow-2xs animate-in fade-in duration-200">
          <RefreshCw size={20} className="animate-spin text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center text-xs font-bold text-blue-900 mb-1.5">
              <span>Đang tự động lưu file lên đám mây...</span>
              {uploadProgress != null && <span>{uploadProgress}%</span>}
            </div>
            <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress != null ? uploadProgress : 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TRẠNG THÁI A: ĐÃ CÓ FILE NỘP TRƯỚC ĐÓ HOẶC VỪA CHỌN FILE MỚI */}
      {currentFile ? (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                {getFileIcon(currentFile.name)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-bold text-slate-800 truncate" title={currentFile.name}>
                    {currentFile.name}
                  </p>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0 flex items-center gap-1">
                    <Cloud size={11} className="text-emerald-600" />
                    <span>{isEditMode ? 'Tệp bài nộp hiện tại' : 'Đã lưu tạm (Cloud)'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {formatFileSize(currentFile.size)} • Sẵn sàng để nộp bài
                </p>
              </div>
            </div>

            {/* Nút icon X (Xóa file) */}
            <button
              type="button"
              disabled={isUploadingFile}
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0 disabled:opacity-40"
              title="Xóa tệp này để tải lên tệp mới"
            >
              <X size={18} />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 italic pl-1 flex items-center gap-1.5">
            <Cloud size={13} className="text-emerald-600 shrink-0" />
            <span>Tệp đã được tự động lưu ngầm an toàn. Bạn có thể giữ nguyên để tiếp tục hoặc bấm <strong>[✕]</strong> để đổi tệp khác.</span>
          </p>
        </div>
      ) : (
        /* TRẠNG THÁI B: CHƯA CÓ FILE HOẶC ĐÃ XÁC NHẬN XÓA FILE CŨ */
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploadingFile && fileInputRef.current?.click()}
            className={`saf-dropzone ${isDragging ? 'saf-dropzone--active' : ''} ${isUploadingFile ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-3 shadow-xs">
              <UploadCloud size={24} />
            </div>
            <p className="text-xs font-bold text-slate-800">
              Kéo thả tệp bài làm vào đây hoặc nhấn để chọn tệp
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              Hỗ trợ các định dạng mã nguồn (.java, .py, .cpp, .js), tài liệu (.pdf, .docx) hoặc tệp nén (.zip, .rar). Tối đa 50MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              disabled={isUploadingFile}
              onChange={handleNativeChange}
              accept=".java,.py,.cpp,.c,.cs,.js,.ts,.html,.css,.zip,.rar,.7z,.tar.gz,.pdf,.docx,.doc"
              className="hidden"
            />
          </div>

          {/* Quy tắc bắt buộc: Nộp nhiều file phải nén ZIP */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Quy tắc bắt buộc:</span> Nếu bài làm có nhiều tệp tin hoặc thư mục mã nguồn dự án, vui lòng đóng gói thành một tệp tin duy nhất định dạng <strong>.ZIP</strong> trước khi nộp.
            </div>
          </div>
        </div>
      )}

      {/* Buttons Step 1 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="saf-btn-outline w-full sm:w-auto"
        >
          {isEditMode ? 'Discard Changes / Back' : 'Cancel / Back to Status'}
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Silent Auto-Save Status Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-600">
            {isUploadingFile || autoSaveStatus === 'saving' ? (
              <>
                <RefreshCw size={12} className="animate-spin text-blue-600" />
                <span>Đang tự động lưu...</span>
              </>
            ) : autoSaveStatus === 'saved' || currentFile ? (
              <>
                <Cloud size={13} className="text-emerald-600" />
                <span className="text-emerald-700">Đã lưu tạm</span>
              </>
            ) : (
              <>
                <Cloud size={13} className="text-slate-400" />
                <span className="text-slate-400">Tự động lưu bật</span>
              </>
            )}
          </div>

          {/* Quick AI Sanity Check Button */}
          {currentFile && onRunSanityCheck && (
            <button
              type="button"
              disabled={isUploadingFile || isSanityChecking}
              onClick={onRunSanityCheck}
              title="Chẩn đoán nhanh lỗi logic, độ lệch đề và khai báo AI trước khi nộp chính thức (Không ảnh hưởng đến điểm số)."
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {isSanityChecking ? (
                <>
                  <Loader2 size={13} className="animate-spin text-purple-600" />
                  <span>Đang kiểm tra AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-purple-600" />
                  <span>Kiểm tra nhanh bằng AI</span>
                </>
              )}
            </button>
          )}

          {!isAiRequired ? (
            <button
              type="button"
              disabled={isSubmittingPayload || isUploadingFile}
              onClick={() => {
                if (!currentFile) {
                  alert('Vui lòng chọn hoặc tải lên tệp bài nộp trước khi nộp!');
                  return;
                }
                if (onSubmitDirect) onSubmitDirect();
              }}
              className="saf-btn-primary flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>
                {isSubmittingPayload
                  ? 'Submitting...'
                  : (isEditMode ? 'Update Assignment' : 'Nộp bài (Submit Final)')}
              </span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isUploadingFile}
              onClick={() => {
                if (!currentFile) {
                  alert('Vui lòng chọn hoặc tải lên tệp bài nộp trước khi tiếp tục!');
                  return;
                }
                onNext();
              }}
              className="saf-btn-primary flex items-center gap-1.5"
            >
              <span>{isEditMode ? 'Next: Edit AI Declaration' : 'Next: AI Declaration'}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* MODAL CONFIRM DELETE FILE */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Xác nhận xóa tệp bài nộp?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thao tác này sẽ gỡ tệp bài làm hiện tại khỏi phiên nộp bài.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Tệp bài làm hiện tại sẽ bị gỡ bỏ. Bạn sẽ cần tải lên tệp bài làm mới để hoàn tất việc nộp lại bài tập.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer shadow-xs"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   8. SUB-COMPONENT: STEP 2 - AI RUBRIC FORM (MULTI-SCOPE)
   ========================================================================== */

function makeDefaultDeclarations(): Record<RubricKey, AiDeclarationRubric> {
  const keys: RubricKey[] = ['decomposition', 'pattern', 'abstraction', 'algorithmic', 'reflection'];
  const result = {} as Record<RubricKey, AiDeclarationRubric>;
  keys.forEach(k => { result[k] = { ...INITIAL_DECLARATIONS[k], isModified: false }; });
  return result;
}

function makeDefaultScope(idx: number): AiScope {
  const id = `scope-${Date.now()}-${idx + 1}`;
  return {
    id,
    scopeId: id,
    scope_title: `Khai báo ${idx + 1}`,
    title: `Khai báo ${idx + 1}`,
    scope_description: '',
    description: '',
    declarations: makeDefaultDeclarations(),
  };
}

interface AiRubricFormProps {
  scopes: AiScope[];
  isEditMode: boolean;
  onScopesChange: (scopes: AiScope[]) => void;
  onPreviousStep: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmittingPayload: boolean;
  onSaveDraft?: () => void;
  isSavingDraft?: boolean;
  autoSaveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  onRunSanityCheck?: () => void;
  isSanityChecking?: boolean;
}

export const AiRubricForm: React.FC<AiRubricFormProps> = ({
  scopes,
  isEditMode,
  onScopesChange,
  onPreviousStep,
  onCancel,
  onSubmit,
  isSubmittingPayload,
  autoSaveStatus = 'idle',
  onRunSanityCheck,
  isSanityChecking = false,
}) => {
  const [activeScopeIdx, setActiveScopeIdx] = useState(0);
  const [activeKey, setActiveKey] = useState<RubricKey>('decomposition');
  const rubricKeys: RubricKey[] = [
    'decomposition',
    'pattern',
    'abstraction',
    'algorithmic',
    'reflection',
  ];

  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const dragStartXRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // ── Scope helpers ──────────────────────────────────────────────────────────
  const safeIdx = Math.min(activeScopeIdx, scopes.length - 1);
  const currentScope = scopes[safeIdx];
  const declarations = currentScope?.declarations || makeDefaultDeclarations();

  // Wheel listener: chuyển con lăn chuột dọc (deltaY) thành cuộn ngang cho chuột cắm dây/chuột rời
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth && e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Cuộn tab đang chọn vào tầm nhìn
  useEffect(() => {
    if (!tabsContainerRef.current) return;
    const activeTab = tabsContainerRef.current.children[safeIdx] as HTMLElement;
    if (activeTab && typeof activeTab.scrollIntoView === 'function') {
      activeTab.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [safeIdx]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !tabsContainerRef.current) return;
    setIsDraggingTabs(true);
    hasMovedRef.current = false;
    dragStartXRef.current = e.pageX;
    scrollStartLeftRef.current = tabsContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

  const handleScopeTitleChange = (idx: number, val: string) => {
    const next = scopes.map((s, i) => i === idx ? { ...s, title: val, scope_title: val } : s);
    onScopesChange(next);
  };

  const handleScopeDescChange = (idx: number, val: string) => {
    const next = scopes.map((s, i) => i === idx ? { ...s, description: val, scope_description: val } : s);
    onScopesChange(next);
  };

  const handleAddScope = () => {
    const newScope = makeDefaultScope(scopes.length);
    onScopesChange([...scopes, newScope]);
    setActiveScopeIdx(scopes.length);
    setActiveKey('decomposition');
  };

  const handleRemoveScope = (idx: number) => {
    if (scopes.length <= 1) return;
    const confirmDelete = window.confirm(`Bạn có chắc chắn muốn xóa khai báo "${scopes[idx]?.title || `Khai báo ${idx + 1}`}" không?`);
    if (!confirmDelete) return;
    const next = scopes.filter((_, i) => i !== idx);
    onScopesChange(next);
    setActiveScopeIdx(Math.max(0, idx - 1));
  };

  const handlePrevScope = () => {
    if (safeIdx > 0) {
      setActiveScopeIdx(safeIdx - 1);
      setActiveKey('decomposition');
    }
  };

  const handleNextScope = () => {
    if (safeIdx < scopes.length - 1) {
      setActiveScopeIdx(safeIdx + 1);
      setActiveKey('decomposition');
    }
  };

  const handleDeclarationChange = (
    key: RubricKey,
    field: RubricFormField,
    value: string
  ) => {
    const next = scopes.map((s, i) => {
      if (i !== safeIdx) return s;
      const current = s.declarations[key] || INITIAL_DECLARATIONS[key];
      const updatedItem: AiDeclarationRubric = {
        ...current,
        [field]: value as any,
        isModified: true,
      };
      // Chỉ tính hoàn thành khi ĐÃ ĐIỀN ĐỦ cả 3 mục text: Prompt, Response, Reflection
      const hasContent = isRubricDeclaredComplete(updatedItem);
      updatedItem.isCompleted = hasContent;
      return { ...s, declarations: { ...s.declarations, [key]: updatedItem } };
    });
    onScopesChange(next);
  };

  const activeMeta = RUBRIC_METADATA[activeKey];
  const activeItem = declarations[activeKey];
  const ActiveIcon = activeMeta.icon;

  const currentIdx = rubricKeys.indexOf(activeKey);
  const completedCount = rubricKeys.filter((k) => isRubricDeclaredComplete(declarations[k])).length;
  const modifiedCount = rubricKeys.filter((k) => declarations[k]?.isModified).length;

  const handleNextRubric = () => {
    if (currentIdx < rubricKeys.length - 1) {
      setActiveKey(rubricKeys[currentIdx + 1]);
    }
  };

  const handlePrevRubric = () => {
    if (currentIdx > 0) {
      setActiveKey(rubricKeys[currentIdx - 1]);
    }
  };

  const totalCompleted = scopes.reduce(
    (acc, s) => acc + rubricKeys.filter(k => isRubricDeclaredComplete(s.declarations[k])).length, 0
  );
  const totalRubrics = scopes.length * 5;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wide uppercase">
          <Brain size={16} />
          <span>{isEditMode ? 'STEP 2: EDIT AI DECLARATIONS (MULTI-SCOPE)' : 'STEP 2: MULTI-SCOPE AI AUDIT (REQUIRED)'}</span>
        </div>
        <span className="text-[11px] text-slate-500 border border-slate-200 rounded-full px-3 py-1 font-medium bg-slate-50">
          {totalCompleted} / {totalRubrics} Rubrics hoàn thành ({scopes.length} Khai báo)
        </span>
      </div>

      {/* Edit Mode notice */}
      {isEditMode && modifiedCount > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-900">
          <Brain size={14} className="text-amber-600 shrink-0" />
          <span>Bạn đã chỉnh sửa <strong>{modifiedCount}</strong> tiêu chí trong phiên này.</span>
        </div>
      )}

      {/* ── SCOPE TABS & CONTROLS ─────────────────────────────────────────── */}
      <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Nút mũi tên cuộn sang trái */}
          <button
            type="button"
            onClick={() => {
              tabsContainerRef.current?.scrollBy({ left: -160, behavior: 'smooth' });
            }}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 transition cursor-pointer shrink-0"
            title="Cuộn sang trái"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Tabs */}
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
              const scopeCompleted = rubricKeys.filter(k => isRubricDeclaredComplete(scope.declarations[k])).length;
              const isActive = idx === safeIdx;
              return (
                <button
                  key={scope.scopeId || scope.id || idx}
                  type="button"
                  onClick={() => {
                    if (hasMovedRef.current) return;
                    setActiveScopeIdx(idx);
                    setActiveKey('decomposition');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 border select-none ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  <span>{scope.scope_title || scope.title || `Khai báo ${idx + 1}`}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>{scopeCompleted}/5</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleAddScope}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 border border-dashed border-indigo-300 transition cursor-pointer whitespace-nowrap shrink-0 select-none"
            >
              <Plus size={13} />
              <span>+ Thêm mục khai báo</span>
            </button>
          </div>

          {/* Nút mũi tên cuộn sang phải */}
          <button
            type="button"
            onClick={() => {
              tabsContainerRef.current?.scrollBy({ left: 160, behavior: 'smooth' });
            }}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 transition cursor-pointer shrink-0"
            title="Cuộn sang phải"
          >
            <ChevronRight size={14} />
          </button>

          {/* Quick Nav & Delete */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={safeIdx === 0}
              onClick={handlePrevScope}
              title="Khai báo trước"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={12} />
              <span>Khai báo trước</span>
            </button>

            <button
              type="button"
              disabled={safeIdx === scopes.length - 1}
              onClick={handleNextScope}
              title="Khai báo tiếp theo"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Khai báo tiếp theo</span>
              <ArrowRight size={12} />
            </button>

            {scopes.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveScope(safeIdx)}
                title="Xóa khai báo này"
                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Xóa khai báo</span>
              </button>
            )}
          </div>
        </div>

        {/* Scope title & description editor */}
        <div className="pt-2 border-t border-slate-200/70 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="saf-input-label">
              Tiêu đề phân rã / Khai báo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={currentScope?.scope_title || currentScope?.title || ''}
              onChange={(e) => handleScopeTitleChange(safeIdx, e.target.value)}
              placeholder="ví dụ: Backend Architecture, Frontend UI..."
              className="saf-input text-xs font-semibold"
            />
          </div>
          <div className="md:col-span-8">
            <label className="saf-input-label">
              Mô tả phạm vi / kỹ thuật của module này
            </label>
            <textarea
              rows={2}
              value={currentScope?.scope_description || currentScope?.description || ''}
              onChange={(e) => handleScopeDescChange(safeIdx, e.target.value)}
              placeholder="Mô tả tóm tắt phạm vi kỹ thuật, công nghệ áp dụng cho khai báo này..."
              className="saf-textarea text-xs"
            />
          </div>
        </div>
      </div>


      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Danh sách 5 Rubrics bên trái */}
        <div className="col-span-12 md:col-span-4 space-y-2">
          {rubricKeys.map((key, index) => {
            const meta = RUBRIC_METADATA[key];
            const item = declarations[key];
            const isActive = activeKey === key;
            const isDone = isRubricDeclaredComplete(item);
            const isEdited = item?.isModified;
            const hasAnyText = Boolean(
              (item?.prompt || '').trim() ||
              (item?.responseSummary || '').trim() ||
              (item?.reflection || '').trim()
            );
            const isPartially = hasAnyText && !isDone;

            return (
              <div
                key={key}
                onClick={() => setActiveKey(key)}
                className={`saf-rubric-item ${
                  isActive ? 'saf-rubric-item--active' : ''
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-blue-600 text-white'
                      : isPartially
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isDone ? <Check size={12} /> : index + 1}
                </span>

                <div className="leading-tight min-w-0 flex-1">
                  <div
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-blue-900' : 'text-slate-700'
                    }`}
                  >
                    {meta.title}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span
                      className={`text-[10px] uppercase font-semibold ${
                        isEdited
                          ? 'text-amber-600 font-bold'
                          : isDone
                          ? 'text-emerald-600 font-bold'
                          : isPartially
                          ? 'text-amber-500 font-medium'
                          : 'text-slate-400'
                      }`}
                    >
                      {isEdited ? 'EDITED' : isDone ? 'DECLARED' : isPartially ? 'INCOMPLETE' : 'NOT DECLARED'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {item.aiTool}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form chi tiết bên phải */}
        <div className="col-span-12 md:col-span-8 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3 border-b border-slate-200/80 pb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm shrink-0">
              <ActiveIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800">
                  {activeMeta.title}
                </h4>
                {activeItem?.isModified && (
                  <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Modified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {activeMeta.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="saf-input-label">
                AI Tool Used <span className="text-rose-500">*</span>
              </label>
              <select
                value={activeItem?.aiTool || 'ChatGPT'}
                onChange={(e) =>
                  handleDeclarationChange(activeKey, 'aiTool', e.target.value)
                }
                className="saf-select"
              >
                {AI_TOOLS.map((tool) => (
                  <option key={tool} value={tool}>
                    {tool}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="saf-input-label">
                Your Decision <span className="text-rose-500">*</span>
              </label>
              <select
                value={activeItem?.decision || 'Partially Modified'}
                onChange={(e) =>
                  handleDeclarationChange(activeKey, 'decision', e.target.value)
                }
                className="saf-select"
              >
                {AI_DECISIONS.map((dec) => (
                  <option key={dec} value={dec}>
                    {dec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="saf-input-label">
              Prompt / Input Used <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={activeItem?.prompt || ''}
              onChange={(e) =>
                handleDeclarationChange(activeKey, 'prompt', e.target.value)
              }
              placeholder={activeMeta.placeholderPrompt}
              className="saf-textarea"
            />
          </div>

          <div>
            <label className="saf-input-label">
              AI Response Summary <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={activeItem?.responseSummary || ''}
              onChange={(e) =>
                handleDeclarationChange(activeKey, 'responseSummary', e.target.value)
              }
              placeholder={activeMeta.placeholderResponse}
              className="saf-textarea"
            />
          </div>

          <div>
            <label className="saf-input-label">
              Student Self-Reflection & Evaluation{' '}
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={activeItem?.reflection || ''}
              onChange={(e) =>
                handleDeclarationChange(activeKey, 'reflection', e.target.value)
              }
              placeholder={activeMeta.placeholderReflection}
              className="saf-textarea"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={handlePrevRubric}
              className="saf-btn-nav"
            >
              <ChevronDown size={14} className="rotate-90" />
              <span>Previous Rubric</span>
            </button>

            <button
              type="button"
              disabled={currentIdx === rubricKeys.length - 1}
              onClick={handleNextRubric}
              className="saf-btn-nav"
            >
              <span>Next Rubric</span>
              <ChevronDown size={14} className="-rotate-90" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onPreviousStep}
            className="saf-btn-outline"
          >
            <ArrowLeft size={14} />
            <span>Quay lại tệp</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="saf-btn-outline"
          >
            Hủy
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Silent Auto-Save Status Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-600">
            {autoSaveStatus === 'saving' ? (
              <>
                <RefreshCw size={12} className="animate-spin text-blue-600" />
                <span>Đang tự động lưu...</span>
              </>
            ) : autoSaveStatus === 'saved' ? (
              <>
                <Cloud size={13} className="text-emerald-600" />
                <span className="text-emerald-700">Đã lưu tạm</span>
              </>
            ) : autoSaveStatus === 'error' ? (
              <>
                <AlertCircle size={12} className="text-rose-500" />
                <span className="text-rose-600">Lỗi lưu tạm</span>
              </>
            ) : (
              <>
                <Cloud size={13} className="text-slate-400" />
                <span className="text-slate-400">Tự động lưu bật</span>
              </>
            )}
          </div>

          {/* Quick AI Sanity Check Button */}
          {onRunSanityCheck && (
            <button
              type="button"
              disabled={isSubmittingPayload || isSanityChecking}
              onClick={onRunSanityCheck}
              title="Chẩn đoán nhanh lỗi logic, độ lệch đề và khai báo AI trước khi nộp chính thức (Không ảnh hưởng đến điểm số)."
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {isSanityChecking ? (
                <>
                  <Loader2 size={13} className="animate-spin text-purple-600" />
                  <span>Đang kiểm tra AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-purple-600" />
                  <span>Kiểm tra nhanh bằng AI</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            disabled={isSubmittingPayload}
            onClick={onSubmit}
            className="saf-btn-dark"
          >
            {isSubmittingPayload ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>{isEditMode ? 'Đang cập nhật bài nộp...' : 'Đang nộp bài...'}</span>
              </>
            ) : (
              <>
                <span>{isEditMode ? 'Cập nhật bài nộp & Khai báo AI' : 'Nộp bài chính thức (Submit Final)'}</span>
                <CheckCircle2 size={14} className="text-emerald-400" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   8b. SUB-COMPONENT: PRE-SUBMISSION AI SANITY FEEDBACK PANEL
   ========================================================================== */

interface PreSubmissionSanityPanelProps {
  result: SanityCheckResult;
  isSanityChecking?: boolean;
  onReRun?: () => void;
  onClose: () => void;
}

export const PreSubmissionSanityPanel: React.FC<PreSubmissionSanityPanelProps> = ({
  result,
  isSanityChecking = false,
  onReRun,
  onClose,
}) => {
  return (
    <div className="mt-4 p-4 rounded-xl border border-purple-200 bg-purple-50/40 text-sm transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100 mb-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-base">🔍</span>
          <h4 className="font-semibold text-gray-800">Kết quả Pre-Check Sanity</h4>
          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
            Formative Feedback • Không tính điểm
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onReRun && (
            <button
              type="button"
              onClick={onReRun}
              disabled={isSanityChecking}
              className="text-xs text-purple-700 hover:text-purple-900 bg-white hover:bg-purple-50 border border-purple-200 px-2 py-1 rounded-md transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              title="Kiểm tra lại sau khi bạn đã chỉnh sửa file hoặc nội dung khai báo"
            >
              <RefreshCw size={11} className={isSanityChecking ? 'animate-spin' : ''} />
              <span>{isSanityChecking ? 'Đang kiểm tra...' : 'Kiểm tra lại'}</span>
            </button>
          )}
          <button 
            type="button"
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition cursor-pointer"
            title="Đóng nhận xét"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="space-y-3">
        {/* 1. Độ khớp đề bài */}
        <div className="flex items-start gap-2">
          <span className="shrink-0 text-base leading-none">
            {result.relevance_status === 'MATCH' ? '✅' : '⚠️'}
          </span>
          <p className="text-gray-700 leading-relaxed">
            <strong className="font-medium text-gray-900">Độ khớp đề bài: </strong>
            {result.relevance_status === 'MATCH' ? 'Đạt yêu cầu' : 'Cần kiểm tra lại'}
            {result.relevance_reason && ` (${result.relevance_reason})`}
          </p>
        </div>

        {/* 2. Điểm cần lưu ý trước khi chốt nộp */}
        {result.diagnostic_warnings && result.diagnostic_warnings.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base leading-none">⚠️</span>
              <strong className="font-medium text-amber-900">Điểm cần lưu ý trước khi chốt nộp:</strong>
            </div>
            <ul className="pl-6 space-y-1 list-disc text-gray-700 marker:text-amber-500">
              {result.diagnostic_warnings.map((warn: string, index: number) => (
                <li key={index} className="leading-relaxed">{warn}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Gợi ý nhanh */}
        {result.micro_suggestions && result.micro_suggestions.length > 0 && (
          <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-purple-100">
            <span className="shrink-0 text-base leading-none">💡</span>
            <div className="text-gray-700 leading-relaxed">
              <strong className="font-medium text-gray-900">Gợi ý nhanh: </strong>
              {Array.isArray(result.micro_suggestions) 
                ? result.micro_suggestions.join(' ') 
                : result.micro_suggestions}
            </div>
          </div>
        )}

        {/* 4. Footer chú thích */}
        <div className="pt-2 text-xs text-gray-500 flex items-center gap-1.5 border-t border-purple-100/60">
          <span>ℹ️</span>
          <span>Đây là nhận xét tham khảo từ AI, không ảnh hưởng điểm số và không chặn quyền nộp bài của bạn.</span>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   9. MAIN CONTAINER: STUDENT ASSIGNMENT FLOW ORCHESTRATOR
   ========================================================================== */

interface StudentAssignmentFlowProps {
  initialAssignment?: Assignment;
  initialSubmission?: SubmissionData;
  onBackToCourse?: () => void;
  onSubmitApiHandler?: (payload: {
    assignmentId: string;
    file: File | SubmissionFile;
    declarations: Record<RubricKey, AiDeclarationRubric>;
    scopes?: AiScope[];
    isEdit: boolean;
    isDraft?: boolean;
  }) => Promise<boolean>;
  onSaveDraftApiHandler?: (payload: {
    assignmentId: string;
    file: File | SubmissionFile;
    declarations: Record<RubricKey, AiDeclarationRubric>;
    scopes?: AiScope[];
    isEdit: boolean;
    isDraft?: boolean;
  }) => Promise<boolean>;
  onSaveDraftFile?: (file: File, onUploadProgress?: (progressEvent: any) => void) => Promise<any>;
  onRemoveDraftFile?: () => Promise<any>;
  onSaveDraftDeclarations?: (payload: { scopes?: any[]; declarations?: any; note?: string }) => Promise<any>;
  onRunSanityCheck?: (payload: { scopes?: any[]; ai_declarations?: any }) => Promise<any>;
}

export const EMPTY_SUBMISSION_STATE: SubmissionData = {
  status: 'No submission',
  submittedAt: null,
  file: null,
  declarations: INITIAL_DECLARATIONS,
};

export default function StudentAssignmentFlow({
  initialAssignment = DEFAULT_ASSIGNMENT,
  initialSubmission = null,
  onBackToCourse,
  onSubmitApiHandler,
  onSaveDraftApiHandler,
  onSaveDraftFile,
  onRemoveDraftFile,
  onSaveDraftDeclarations,
  onRunSanityCheck,
}: StudentAssignmentFlowProps) {
  // State Machine Quản lý 2 Chế độ chính
  const [viewMode, setViewMode] = useState<ViewMode>('VIEW_STATUS');
  const [formStep, setFormStep] = useState<FormStep>(1);

  // Core Data States
  const [assignment, setAssignment] = useState<Assignment>(initialAssignment);
  const [submission, setSubmission] = useState<SubmissionData>(initialSubmission || EMPTY_SUBMISSION_STATE);

  // Silent Auto-Save States
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Pre-Submission AI Sanity Check States
  const [isSanityChecking, setIsSanityChecking] = useState(false);
  const [sanityCheckResult, setSanityCheckResult] = useState<SanityCheckResult | null>(null);
  const [showSanityPanel, setShowSanityPanel] = useState(false);

  // Dọn dẹp debounce timer khi unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Sync state with incoming props
  React.useEffect(() => {
    if (initialAssignment) {
      setAssignment(initialAssignment);
    }
  }, [initialAssignment]);

  React.useEffect(() => {
    if (initialSubmission) {
      setSubmission(initialSubmission);
      setDraftFile(initialSubmission.file);
      if (initialSubmission.declarations) {
        setDraftDeclarations(initialSubmission.declarations);
      }
      if (initialSubmission.scopes && initialSubmission.scopes.length > 0) {
        setDraftScopes(initialSubmission.scopes);
      }
    } else {
      setSubmission(EMPTY_SUBMISSION_STATE);
      setDraftFile(null);
      setDraftDeclarations(INITIAL_DECLARATIONS);
      setDraftScopes(getInitialScopes(EMPTY_SUBMISSION_STATE));
    }
  }, [initialSubmission]);

  // Edit Mode Flag: true nếu bài đã nộp trước đó
  const isEditMode = submission.status === 'Submitted' || submission.status === 'Graded';

  // Kiểm tra hạn nộp bài
  const isDeadlinePassed = Boolean(assignment.deadlineRaw && new Date() > new Date(assignment.deadlineRaw));
  const isLateBlocked = isDeadlinePassed && assignment.allowLateSubmission === false;

  // Draft States trong Form
  const [draftFile, setDraftFile] = useState<SubmissionFile | null>(submission.file);
  const [draftRawFile, setDraftRawFile] = useState<File | null>(null);
  const [draftDeclarations, setDraftDeclarations] = useState<
    Record<RubricKey, AiDeclarationRubric>
  >(submission.declarations);

  // Multi-Scope draft
  const getInitialScopes = (sub: SubmissionData): AiScope[] => {
    if (sub.scopes && sub.scopes.length > 0) return sub.scopes;
    // Migrate legacy single-scope to multi-scope
    return [{
      scopeId: 'scope-default',
      title: 'Khai báo chung',
      scope_title: 'Khai báo chung',
      description: '',
      scope_description: '',
      declarations: sub.declarations || makeDefaultDeclarations(),
    }];
  };

  const [draftScopes, setDraftScopes] = useState<AiScope[]>(getInitialScopes(submission));

  // Loading, Toast, Confirmation Modal States
  const [isSubmittingPayload, setIsSubmittingPayload] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenForm = () => {
    if (isLateBlocked) {
      alert('Hạn nộp bài đã kết thúc và bài tập này không cho phép nộp muộn!');
      return;
    }

    // Populate draft state from existing submission
    setDraftFile(submission.file);
    setDraftRawFile(null);
    
    // Deep clone declarations
    const clonedDeclarations = {} as Record<RubricKey, AiDeclarationRubric>;
    const keys: RubricKey[] = ['decomposition', 'pattern', 'abstraction', 'algorithmic', 'reflection'];
    keys.forEach(k => {
      clonedDeclarations[k] = {
        ...(submission.declarations?.[k] || INITIAL_DECLARATIONS[k]),
        isModified: false,
      };
    });
    setDraftDeclarations(clonedDeclarations);

    // Clone scopes
    setDraftScopes(getInitialScopes(submission).map(s => ({
      ...s,
      declarations: Object.fromEntries(
        keys.map(k => [k, { ...(s.declarations[k] || INITIAL_DECLARATIONS[k]), isModified: false }])
      ) as Record<RubricKey, AiDeclarationRubric>,
    })));

    setFormStep(1);
    setViewMode('FORM');
  };

  const handleCancelForm = () => {
    setViewMode('VIEW_STATUS');
    setFormStep(1);
  };

  // Pre-Submission AI Sanity Check (Chẩn đoán nhanh bài làm bằng AI)
  const handleRunSanityCheck = async () => {
    // 1. Kiểm tra đã có file bài làm chưa
    if (!draftFile && !draftRawFile && !submission.file) {
      showToast('⚠️ Vui lòng tải lên tệp bài làm trước khi kiểm tra nhanh bằng AI.');
      return;
    }

    try {
      setIsSanityChecking(true);
      const payload = {
        scopes: draftScopes,
        ai_declarations: draftDeclarations,
      };

      let resData: any;
      if (onRunSanityCheck) {
        resData = await onRunSanityCheck(payload);
      } else {
        const response = await SubmissionService.runSanityCheck(assignment.id, payload);
        resData = response?.data || response;
      }

      const result: SanityCheckResult = resData?.data || resData;
      setSanityCheckResult(result);
      setShowSanityPanel(true);
      showToast('✨ Đã hoàn thành chẩn đoán bài làm bằng AI.');
    } catch (error: any) {
      console.error('Error during pre-submission sanity check:', error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể kiểm tra bài làm bằng AI lúc này. Vui lòng thử lại sau.';
      alert(errorMsg);
    } finally {
      setIsSanityChecking(false);
    }
  };

  // Tự động tải file và Silent Auto-Save lên server ngay khi chọn/kéo thả file
  const handleAutoSaveDraftFile = async (file: File) => {
    setDraftRawFile(file);
    const tempFileMeta: SubmissionFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
    setDraftFile(tempFileMeta);
    setIsUploadingFile(true);
    setAutoSaveStatus('saving');
    setUploadProgress(0);

    try {
      const progressHandler = (progressEvent: any) => {
        if (progressEvent.total) {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      };

      let res: any;
      if (onSaveDraftFile) {
        res = await onSaveDraftFile(file, progressHandler);
      } else {
        res = await SubmissionService.saveDraftFile(assignment.id, file, progressHandler);
      }

      const savedFile = res?.data?.file || res?.data?.files?.[0];
      const finalFileMeta: SubmissionFile = {
        name: savedFile?.name || file.name,
        size: savedFile?.size || file.size,
        type: savedFile?.type || file.type,
        lastModified: file.lastModified,
        url: savedFile?.url,
      };

      setDraftFile(finalFileMeta);
      setSubmission((prev) => ({
        ...prev,
        id: res?.data?.submission_id || prev.id,
        status: prev.status === 'Submitted' || prev.status === 'Graded' ? prev.status : 'Draft',
        file: finalFileMeta,
      }));
      setAutoSaveStatus('saved');
    } catch (err: any) {
      console.error('Silent file auto-save failed:', err);
      setAutoSaveStatus('error');
    } finally {
      setIsUploadingFile(false);
      setUploadProgress(null);
    }
  };

  // Tự động xóa file trong draft ngầm
  const handleAutoRemoveDraftFile = async () => {
    setDraftFile(null);
    setDraftRawFile(null);
    setAutoSaveStatus('saving');

    try {
      if (onRemoveDraftFile) {
        await onRemoveDraftFile();
      } else {
        await SubmissionService.removeDraftFile(assignment.id);
      }
      setSubmission((prev) => ({ ...prev, file: null }));
      setAutoSaveStatus('saved');
    } catch (err: any) {
      console.warn('Remove draft file failed:', err);
      setAutoSaveStatus('saved');
    }
  };

  // Debounce Auto-Save Text Khai báo AI (1.5 giây sau khi dừng gõ)
  const handleScopesChangeWithDebounce = (nextScopes: AiScope[]) => {
    setDraftScopes(nextScopes);
    if (nextScopes[0]?.declarations) {
      setDraftDeclarations(nextScopes[0].declarations);
    }
    setAutoSaveStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const notePayload = JSON.stringify({
          version: '2.0',
          scopes: nextScopes,
          declarations: nextScopes[0]?.declarations || draftDeclarations,
          isDraft: true,
          savedAt: new Date().toISOString(),
        });

        if (onSaveDraftDeclarations) {
          await onSaveDraftDeclarations({
            scopes: nextScopes,
            declarations: nextScopes[0]?.declarations || draftDeclarations,
            note: notePayload,
          });
        } else {
          await SubmissionService.saveDraftDeclarations(assignment.id, {
            scopes: nextScopes,
            ai_declarations: nextScopes[0]?.declarations || draftDeclarations,
            note: notePayload,
          });
        }

        setAutoSaveStatus('saved');
        setSubmission((prev) => ({
          ...prev,
          status: prev.status === 'Submitted' || prev.status === 'Graded' ? prev.status : 'Draft',
          scopes: nextScopes,
          declarations: nextScopes[0]?.declarations || draftDeclarations,
        }));
      } catch (err) {
        console.error('Debounce auto-save declarations failed:', err);
        setAutoSaveStatus('error');
      }
    }, 1500);
  };

  // 2. Kích hoạt Modal xác nhận nộp bài chính thức
  const handleTriggerSubmitFinal = () => {
    if (isLateBlocked) {
      alert('Hạn nộp bài đã kết thúc và bài tập này không cho phép nộp muộn!');
      return;
    }

    const effectiveFile = draftRawFile || draftFile;
    if (!effectiveFile) {
      alert('Vui lòng chọn hoặc tải lên tệp bài nộp tại Bước 1 trước khi nộp chính thức!');
      setFormStep(1);
      return;
    }

    // Kiểm tra khai báo AI bắt buộc
    if (assignment.aiDeclarationRequired !== false) {
      let completedCount = 0;
      if (draftScopes && draftScopes.length > 0) {
        draftScopes.forEach(s => {
          Object.values(s.declarations || {}).forEach(d => {
            if (isRubricDeclaredComplete(d)) completedCount++;
          });
        });
      } else {
        const rubricKeys: RubricKey[] = ['decomposition', 'pattern', 'abstraction', 'algorithmic', 'reflection'];
        completedCount = rubricKeys.filter(k => isRubricDeclaredComplete(draftDeclarations[k])).length;
      }

      const minRequired = assignment.minAiInteractions || 1;
      if (completedCount < minRequired) {
        alert(`Bài tập yêu cầu hoàn thiện tối thiểu ${minRequired} tiêu chí khai báo AI tương tác trước khi nộp chính thức! (Hiện có: ${completedCount})`);
        setFormStep(2);
        return;
      }
    }

    setShowSubmitConfirmModal(true);
  };

  // 3. Thực thi nộp bài chính thức (sau khi sinh viên bấm Xác nhận trong modal)
  const executeFinalSubmit = async () => {
    setShowSubmitConfirmModal(false);
    await handleSubmitAssignment();
  };

  // Logic nộp bài chính thức (Submit Final / Update)
  const handleSubmitAssignment = async () => {
    if (isLateBlocked) {
      alert('Hạn nộp bài đã kết thúc và bài tập này không cho phép nộp muộn!');
      return;
    }

    // Determine effective file
    const effectiveFile = draftRawFile || draftFile;

    if (!effectiveFile) {
      alert('Vui lòng chọn hoặc tải lên tệp bài nộp tại Bước 1!');
      setFormStep(1);
      return;
    }

    try {
      setIsSubmittingPayload(true);

      // Nếu truyền REST API Handler bên ngoài (FormData Multipart)
      if (onSubmitApiHandler) {
        await onSubmitApiHandler({
          assignmentId: assignment.id,
          file: draftRawFile || effectiveFile,
          declarations: draftDeclarations,
          scopes: draftScopes,
          isEdit: isEditMode,
          isDraft: false,
        });
      } else {
        // Giả lập network latency 800ms
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Tính toán AI Transparency Score tự động
      const rubricKeys: RubricKey[] = [
        'decomposition',
        'pattern',
        'abstraction',
        'algorithmic',
        'reflection',
      ];
      const completedCount = rubricKeys.filter(
        (k) => isRubricDeclaredComplete(draftDeclarations[k])
      ).length;
      const calculatedScore = Math.min(
        100,
        Math.max(60, completedCount * 18 + 10)
      );

      const now = new Date();
      const formattedTimestamp = now
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      // Cập nhật State sang SUBMITTED (hoặc tăng version nếu edit)
      const currentVer = submission.version || 1;
      const newSubmissionData: SubmissionData = {
        status: 'Submitted',
        submittedAt: submission.submittedAt || formattedTimestamp,
        lastEditedAt: formattedTimestamp,
        version: isEditMode ? currentVer + 1 : 1,
        file: effectiveFile,
        feedback: submission.feedback || 'Chưa có nhận xét. Bài nộp đã nộp chính thức thành công và đang chờ giảng viên chấm điểm.',
        transparencyScore: calculatedScore,
        declarations: draftDeclarations,
        scopes: draftScopes,
      };

      setSubmission(newSubmissionData);

      // Tự động chuyển State về VIEW_STATUS
      setViewMode('VIEW_STATUS');
      setFormStep(1);

      showToast(
        isEditMode
          ? `Cập nhật bài nộp và khai báo AI thành công (Phiên bản v${newSubmissionData.version}.0)!`
          : 'Nộp bài chính thức và gửi đến giảng viên thành công!'
      );
    } catch (err: any) {
      console.error('Submission error:', err);
      const serverMessage = err.response?.data?.message || err.message || '';
      let friendlyMsg = 'Có lỗi xảy ra khi gửi bài. Vui lòng thử lại!';

      if (serverMessage === 'DEADLINE_PASSED_AND_LATE_SUBMISSION_NOT_ALLOWED') {
        friendlyMsg = 'Hạn nộp bài đã kết thúc và bài tập này không cho phép nộp muộn!';
      } else if (serverMessage === 'NOT_ENROLLED_IN_CLASS') {
        friendlyMsg = 'Bạn chưa được ghi danh vào lớp học này!';
      } else if (
        serverMessage === 'ONLY_STUDENT_CAN_SUBMIT' ||
        serverMessage.includes('Insufficient permissions') ||
        serverMessage.includes('403')
      ) {
        friendlyMsg = 'Tài khoản hiện tại không có quyền nộp bài cho sinh viên!';
      } else if (serverMessage.startsWith('AI_DECLARATION_REQUIRED')) {
        friendlyMsg = serverMessage.replace('AI_DECLARATION_REQUIRED: ', '');
      } else if (serverMessage === 'SUBMISSION_EMPTY_CONTENT') {
        friendlyMsg = 'Vui lòng đính kèm tệp bài nộp hoặc ghi chú!';
      } else if (serverMessage === 'ASSIGNMENT_NOT_PUBLISHED') {
        friendlyMsg = 'Bài tập này chưa được công bố!';
      } else if (serverMessage === 'SUBMISSION_LOCKED') {
        friendlyMsg = 'Bài nộp đã bị khóa!';
      } else if (serverMessage) {
        friendlyMsg = serverMessage;
      }

      alert(friendlyMsg);
    } finally {
      setIsSubmittingPayload(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] text-slate-700 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button
            type="button"
            onClick={onBackToCourse || (() => alert('Navigate to Home'))}
            className="hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to {assignment.courseCode || 'N/A'}</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400 truncate max-w-xs sm:max-w-md">
            {assignment.courseTitle || 'N/A'}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-bold">{assignment.title || 'N/A'}</span>
        </nav>

        {/* Header Tiêu đề & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {assignment.title}
              </h1>
              {submission.status === 'Graded' ? (
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>Graded</span>
                </span>
              ) : submission.status === 'Submitted' ? (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Check size={12} />
                  <span>Submitted</span>
                </span>
              ) : submission.status === 'Draft' ? (
                <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                  <Bookmark size={12} />
                  <span>Bản nháp (Draft - Chưa nộp chính thức)</span>
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Course: <span className="font-semibold">{assignment.courseCode || 'N/A'}</span> • Due Date: {assignment.dueDate || 'N/A'}
            </p>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full border self-start sm:self-auto ${
              submission.status === 'Graded'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : submission.status === 'Submitted'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : submission.status === 'Draft'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {submission.status === 'Draft' ? 'Bản nháp (Draft)' : submission.status}
          </span>
        </div>

        {/* Layout 2 Cột (Trái: 1/3, Phải: 2/3) */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI */}
          <div className="col-span-12 lg:col-span-4">
            <AssignmentOverview
              assignment={assignment}
              activeAssignmentTitle={assignment.title}
              score={submission.score != null ? submission.score : (submission.status === 'Submitted' || submission.status === 'Graded' ? assignment.score : null)}
            />
          </div>

          {/* CỘT PHẢI (State Container) */}
          <div className="col-span-12 lg:col-span-8 saf-card bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            {viewMode === 'VIEW_STATUS' ? (
              /* CHẾ ĐỘ A: VIEW_STATUS */
              <SubmissionStatusView
                submission={submission}
                onAddOrEditClick={handleOpenForm}
                maxScore={assignment.maxScore ?? 10}
                isLateBlocked={isLateBlocked}
                dueDate={assignment.dueDate}
              />
            ) : (
              /* CHẾ ĐỘ B: FORM STEPPER (ADD HOẶC EDIT) */
              <div className="space-y-6">
                {/* Stepper Header (1 -> 2) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        {isEditMode
                          ? (assignment.aiDeclarationRequired !== false ? 'Edit Submission & AI Declaration' : 'Edit Submission File')
                          : submission.status === 'Draft'
                          ? 'Tiếp tục chỉnh sửa bản nháp'
                          : 'Submit Assignment'}
                      </h2>
                      {isEditMode ? (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                          Editing Mode
                        </span>
                      ) : submission.status === 'Draft' ? (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-300">
                          Draft Mode
                        </span>
                      ) : null}

                      {/* Auto-Save Indicator (Top Header) */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 border border-slate-200/90 text-slate-600">
                        {autoSaveStatus === 'saving' || isUploadingFile ? (
                          <>
                            <RefreshCw size={11} className="animate-spin text-blue-600" />
                            <span className="text-blue-700">Đang tự động lưu...</span>
                          </>
                        ) : autoSaveStatus === 'saved' || draftFile || submission.status === 'Draft' ? (
                          <>
                            <Cloud size={12} className="text-emerald-600" />
                            <span className="text-emerald-700">Đã lưu tạm (Cloud)</span>
                          </>
                        ) : autoSaveStatus === 'error' ? (
                          <>
                            <AlertCircle size={11} className="text-rose-500" />
                            <span className="text-rose-600">Lỗi lưu tạm</span>
                          </>
                        ) : (
                          <>
                            <Cloud size={12} className="text-slate-400" />
                            <span className="text-slate-400">Tự động lưu bật</span>
                          </>
                        )}
                      </div>

                      {/* Pre-Submission AI Sanity Check Trigger Button */}
                      <button
                        type="button"
                        onClick={handleRunSanityCheck}
                        disabled={isSanityChecking || isUploadingFile}
                        title="Chẩn đoán nhanh lỗi logic, độ lệch đề và khai báo AI trước khi nộp chính thức (Không ảnh hưởng đến điểm số)."
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
                      >
                        {isSanityChecking ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-purple-600" />
                            <span>Đang kiểm tra AI...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} className="text-purple-600" />
                            <span>Kiểm tra nhanh bằng AI</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {assignment.aiDeclarationRequired !== false ? (
                        <>
                          Step {formStep} of 2 •{' '}
                          {formStep === 1
                            ? isEditMode || submission.status === 'Draft' ? 'File Management' : 'File Upload'
                            : 'Computational Thinking Rubrics'}
                        </>
                      ) : (
                        'Upload your assignment submission file to complete'
                      )}
                    </p>
                  </div>

                  {assignment.aiDeclarationRequired !== false && (
                    <div className="flex items-center gap-2">
                      {/* Step 1 Indicator */}
                      <button
                        type="button"
                        onClick={() => setFormStep(1)}
                        className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center transition cursor-pointer ${
                          formStep === 1
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {formStep > 1 ? <Check size={14} /> : 1}
                      </button>

                      {/* Step Connector */}
                      <div
                        className={`w-8 h-0.5 transition ${
                          formStep === 2 ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />

                      {/* Step 2 Indicator */}
                      <button
                        type="button"
                        onClick={() => setFormStep(2)}
                        className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-xs transition cursor-pointer ${
                          formStep === 2
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            formStep === 2
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          2
                        </span>
                        <span className="text-[10px] tracking-wider uppercase">
                          AI_DECLARATION
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Pre-submission AI Sanity Feedback Panel */}
                {showSanityPanel && sanityCheckResult && (
                  <PreSubmissionSanityPanel
                    result={sanityCheckResult}
                    isSanityChecking={isSanityChecking}
                    onReRun={handleRunSanityCheck}
                    onClose={() => {
                      setShowSanityPanel(false);
                      setSanityCheckResult(null);
                    }}
                  />
                )}

                {/* Form Step Body */}
                {formStep === 1 ? (
                  <FileUploader
                    currentFile={draftFile}
                    isEditMode={isEditMode}
                    onFileSelect={handleAutoSaveDraftFile}
                    onFileRemove={handleAutoRemoveDraftFile}
                    onCancel={handleCancelForm}
                    onNext={() => setFormStep(2)}
                    aiDeclarationRequired={assignment.aiDeclarationRequired !== false}
                    onSubmitDirect={handleTriggerSubmitFinal}
                    isSubmittingPayload={isSubmittingPayload}
                    isUploadingFile={isUploadingFile}
                    uploadProgress={uploadProgress}
                    autoSaveStatus={autoSaveStatus}
                    onRunSanityCheck={handleRunSanityCheck}
                    isSanityChecking={isSanityChecking}
                  />
                ) : (
                  <AiRubricForm
                    scopes={draftScopes}
                    isEditMode={isEditMode}
                    onScopesChange={handleScopesChangeWithDebounce}
                    onPreviousStep={() => setFormStep(1)}
                    onCancel={handleCancelForm}
                    onSubmit={handleTriggerSubmitFinal}
                    isSubmittingPayload={isSubmittingPayload}
                    autoSaveStatus={autoSaveStatus}
                    onRunSanityCheck={handleRunSanityCheck}
                    isSanityChecking={isSanityChecking}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal xác nhận nộp bài chính thức */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Xác nhận nộp bài chính thức
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Chuyển trạng thái từ bản nháp sang nộp bài hoàn tất
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>Thông báo quan trọng:</span>
              </div>
              <p className="leading-relaxed">
                Bạn có chắc chắn muốn nộp bài chính thức? Sau khi nộp, bài làm sẽ được chuyển đến giảng viên để chấm điểm.
              </p>
            </div>

            {/* Chi tiết tệp & AI declaration sẽ nộp */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tệp bài nộp:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[220px]">
                  {(draftRawFile || draftFile)?.name || 'Chưa có tệp'}
                </span>
              </div>
              {assignment.aiDeclarationRequired !== false && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Khai báo AI Audit:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <Check size={13} />
                    Đã hoàn thiện các tiêu chí khai báo AI
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmittingPayload}
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy / Kiểm tra lại
              </button>
              <button
                type="button"
                disabled={isSubmittingPayload}
                onClick={executeFinalSubmit}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmittingPayload ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Đang nộp bài...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Xác nhận nộp bài</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
