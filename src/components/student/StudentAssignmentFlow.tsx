import React, { useState, useRef } from 'react';
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
  Clock,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  Edit3,
  Plus,
  Check,
  FileCode,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  X,
  Briefcase,
  History,
  FileCheck2,
  Undo2
} from 'lucide-react';
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

export type SubmissionStatus = 'No submission' | 'Submitted' | 'Graded';

export type RubricFormField =
  | 'aiTool'
  | 'decision'
  | 'prompt'
  | 'responseSummary'
  | 'reflection';

export interface Assignment {
  id: string;
  title: string;
  courseCode: string;
  courseTitle: string;
  dueDate: string;
  content: string;
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
  status: SubmissionStatus;
  submittedAt: string | null;
  lastEditedAt?: string | null;
  version?: number;
  file: SubmissionFile | null;
  feedback?: string;
  transparencyScore?: number; // 0 - 100%
  declarations: Record<RubricKey, AiDeclarationRubric>;
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

function getDecisionBadgeStyle(decision: AiDecision): {
  bg: string;
  text: string;
  border: string;
} {
  switch (decision) {
    case 'Fully Accepted':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'Partially Modified':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'Heavily Adapted':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'Rejected':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
  }
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

            {/* Peer assignments for realism */}
            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-500">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded bg-slate-100 text-slate-400 flex items-center justify-center text-xs shrink-0">
                  <FileText size={12} />
                </span>
                <span className="text-xs font-medium truncate">
                  Assignment 1: RESTful Architecture
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">10/10</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-500">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded bg-slate-100 text-slate-400 flex items-center justify-center text-xs shrink-0">
                  <FileText size={12} />
                </span>
                <span className="text-xs font-medium truncate">
                  Assignment 2: PostgreSQL Index Tuning
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">9.5/10</span>
            </div>
          </div>
        )}
      </div>

      {/* Card 2: Content */}
      <div className="saf-overview-card bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">Content</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {assignment.content}
        </p>

        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-slate-500 text-xs">
          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px] flex items-center justify-center">
            {assignment.instructor.name.substring(0, 2).toUpperCase()}
          </div>
          <span>Posted by {assignment.instructor.name}</span>
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
            className={`font-semibold px-2 py-0.5 rounded ${
              score != null
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {score != null ? `${score} / 10` : 'SCORE: N/A'}
          </span>
        </div>

        {assignment.additionalFiles && assignment.additionalFiles.length > 0 && (
          <div className="pt-2 space-y-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Resources Attached
            </span>
            {assignment.additionalFiles.map((file) => (
              <a
                key={file.id}
                href={file.url || '#'}
                onClick={(e) => {
                  e.preventDefault();
                  alert(`Downloading ${file.name}`);
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
   5. SUB-COMPONENT: AI AUDIT LOG CARD (SUMMARY VIEW)
   ========================================================================== */

interface AiAuditLogCardProps {
  declarations: Record<RubricKey, AiDeclarationRubric>;
  transparencyScore?: number;
  lastEditedAt?: string | null;
  version?: number;
}

export const AiAuditLogCard: React.FC<AiAuditLogCardProps> = ({
  declarations,
  transparencyScore = 95,
  lastEditedAt,
  version = 1,
}) => {
  const [expandedKey, setExpandedKey] = useState<RubricKey | null>(null);
  const rubricKeys: RubricKey[] = [
    'decomposition',
    'pattern',
    'abstraction',
    'algorithmic',
    'reflection',
  ];

  const completedCount = rubricKeys.filter(
    (k) => declarations[k]?.isCompleted
  ).length;

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
              {transparencyScore}% ({completedCount}/5 Rubrics)
            </span>
          </div>
        </div>
      </div>

      {/* Rubric Breakdown List */}
      <div className="space-y-2.5">
        {rubricKeys.map((key, idx) => {
          const item = declarations[key];
          const meta = RUBRIC_METADATA[key];
          const Icon = meta.icon;
          const isExpanded = expandedKey === key;
          const badge = getDecisionBadgeStyle(item.decision);

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
                    {item.aiTool}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {item.decision}
                  </span>

                  <span className="p-1 text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 bg-slate-50/40 border-t border-slate-100 text-xs space-y-3 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Prompt / Input Used
                    </span>
                    <p className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-wrap">
                      {item.prompt || 'No prompt recorded.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      AI Response Summary
                    </span>
                    <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {item.responseSummary || 'No summary recorded.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Student's Critical Self-Reflection
                    </span>
                    <p className="p-2.5 rounded-lg bg-blue-50/40 border border-blue-100 text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {item.reflection || 'No reflection recorded.'}
                    </p>
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
}

export const SubmissionStatusView: React.FC<SubmissionStatusViewProps> = ({
  submission,
  onAddOrEditClick,
}) => {
  const isSubmitted = submission.status === 'Submitted';

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
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of student file submission and ART-AI transparency audit log.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddOrEditClick}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition shadow-xs cursor-pointer ${
            isSubmitted
              ? 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50'
              : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white shadow-orange-500/20'
          }`}
        >
          {isSubmitted ? (
            <>
              <Edit3 size={15} />
              <span>EDIT SUBMISSION</span>
            </>
          ) : (
            <>
              <Plus size={15} />
              <span>ADD SUBMISSION</span>
            </>
          )}
        </button>
      </div>

      {/* Bảng thông tin trạng thái bài nộp chuẩn EduX */}
      <div className="space-y-5">
        {/* Hàng 1: SUBMISSION STATUS & SUBMISSION TIME */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              SUBMISSION STATUS
            </div>
            {isSubmitted ? (
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
            </div>
          </div>
        </div>

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
                    {formatFileSize(submission.file.size)} • Active submission file
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

        {/* Hàng 3: FEEDBACK */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            FEEDBACK
          </div>
          <div className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
            {isSubmitted
              ? submission.feedback ||
                'No feedback yet. Submitted successfully. Waiting for grading.'
              : '—'}
          </div>
        </div>

        {/* Hàng 4: AI AUDIT LOG STATUS */}
        <div className="pt-2 border-t border-slate-100">
          {isSubmitted ? (
            <AiAuditLogCard
              declarations={submission.declarations}
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
   7. SUB-COMPONENT: STEP 1 - FILE UPLOADER (HỖ TRỢ EDIT MODE CỤ THỂ)
   ========================================================================== */

interface FileUploaderProps {
  selectedFile: SubmissionFile | null;
  existingFile: SubmissionFile | null;
  isEditMode: boolean;
  fileMode: 'keep' | 'replace';
  onFileModeChange: (mode: 'keep' | 'replace') => void;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onCancel: () => void;
  onNext: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  selectedFile,
  existingFile,
  isEditMode,
  fileMode,
  onFileModeChange,
  onFileSelect,
  onFileRemove,
  onCancel,
  onNext,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (file: File) => {
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSizeBytes) {
      alert('Tệp vượt quá dung lượng cho phép (Tối đa 10MB)!');
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className="space-y-6">
      {/* Banner phân biệt chế độ EDIT SUBMISSION */}
      {isEditMode && (
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
          <History size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed text-amber-900">
            <span className="font-bold">Edit Submission Mode:</span> Bạn đang cập nhật bài nộp đã có. 
            Bạn có thể <strong>giữ nguyên tệp hiện tại</strong> hoặc <strong>tải lên tệp thay thế mới</strong>.
            Các khai báo AI ở Bước 2 cũng đã được nạp sẵn để bạn dễ dàng chỉnh sửa.
          </div>
        </div>
      )}

      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 tracking-wide uppercase">
          <UploadCloud size={16} className="text-blue-600" />
          <span>{isEditMode ? 'STEP 1: SUBMISSION FILE MANAGEMENT' : 'STEP 1: UPLOAD SUBMISSION FILE'}</span>
        </div>

        {/* Tab chuyển đổi trong Edit Mode: Giữ tệp cũ vs Thay thế tệp */}
        {isEditMode && existingFile && (
          <div className="saf-segmented-group">
            <button
              type="button"
              onClick={() => onFileModeChange('keep')}
              className={`saf-segmented-btn ${
                fileMode === 'keep' ? 'saf-segmented-btn--active' : ''
              }`}
            >
              Keep Existing File
            </button>
            <button
              type="button"
              onClick={() => onFileModeChange('replace')}
              className={`saf-segmented-btn ${
                fileMode === 'replace' ? 'saf-segmented-btn--active' : ''
              }`}
            >
              Replace with New File
            </button>
          </div>
        )}
      </div>

      {/* Hiển thị tệp hiện tại trong Edit Mode (khi chọn 'keep') */}
      {isEditMode && fileMode === 'keep' && existingFile && (
        <div className="saf-file-kept-box space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileCheck2 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {existingFile.name}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Current Version Kept
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {formatFileSize(existingFile.size)} • Originally submitted file
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onFileModeChange('replace')}
              className="text-xs font-bold text-blue-600 hover:underline px-3 py-1.5 rounded-lg hover:bg-blue-50 transition cursor-pointer"
            >
              Replace this file
            </button>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-emerald-200/50 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <span>Tệp này sẽ được giữ nguyên khi bạn lưu. Bạn có thể nhấn <strong>"Next: AI Declaration"</strong> ngay để chỉnh sửa các tiêu chí AI.</span>
          </div>
        </div>
      )}

      {/* Giao diện Upload File (khi tạo mới HOẶC khi edit mode chọn 'replace') */}
      {(!isEditMode || fileMode === 'replace') && (
        <>
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`saf-dropzone ${
                isDragging ? 'saf-dropzone--active' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg mb-3 shadow-xs">
                <UploadCloud size={24} />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {isEditMode
                  ? 'Click to browse or drop replacement file'
                  : 'Click to browse or drag and drop your submission file'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supported formats: PDF, ZIP, RAR, DOCX, TXT (Max 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleNativeChange}
                accept=".pdf,.zip,.rar,.docx,.txt"
                className="hidden"
              />
            </div>
          ) : (
            <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/30 flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <FileCode size={24} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {selectedFile.name}
                    </p>
                    {isEditMode && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        New Replacement File
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {formatFileSize(selectedFile.size)} • Ready for declaration
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isEditMode && existingFile && (
                  <button
                    type="button"
                    onClick={() => onFileModeChange('keep')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 cursor-pointer"
                  >
                    <Undo2 size={13} />
                    <span>Revert to original</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-blue-600 hover:underline px-2 py-1 cursor-pointer"
                >
                  Change file
                </button>
                <button
                  type="button"
                  onClick={onFileRemove}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 size={16} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleNativeChange}
                  accept=".pdf,.zip,.rar,.docx,.txt"
                  className="hidden"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Buttons Step 1 */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="saf-btn-outline"
        >
          {isEditMode ? 'Discard Changes / Back' : 'Cancel / Back to Status'}
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isEditMode && !selectedFile) {
              alert('Vui lòng chọn hoặc tải lên tệp bài nộp trước khi tiếp tục!');
              return;
            }
            if (isEditMode && fileMode === 'replace' && !selectedFile) {
              alert('Bạn đang chọn thay thế tệp, vui lòng chọn tệp mới hoặc chuyển sang "Keep Existing File"!');
              return;
            }
            onNext();
          }}
          className="saf-btn-primary"
        >
          <span>{isEditMode ? 'Next: Edit AI Declaration' : 'Next: AI Declaration'}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

/* ==========================================================================
   8. SUB-COMPONENT: STEP 2 - AI RUBRIC FORM (HỖ TRỢ EDIT MODE CỤ THỂ)
   ========================================================================== */

interface AiRubricFormProps {
  declarations: Record<RubricKey, AiDeclarationRubric>;
  isEditMode: boolean;
  onDeclarationChange: (
    key: RubricKey,
    field: RubricFormField,
    value: string
  ) => void;
  onPreviousStep: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmittingPayload: boolean;
}

export const AiRubricForm: React.FC<AiRubricFormProps> = ({
  declarations,
  isEditMode,
  onDeclarationChange,
  onPreviousStep,
  onCancel,
  onSubmit,
  isSubmittingPayload,
}) => {
  const [activeKey, setActiveKey] = useState<RubricKey>('decomposition');
  const rubricKeys: RubricKey[] = [
    'decomposition',
    'pattern',
    'abstraction',
    'algorithmic',
    'reflection',
  ];

  const activeMeta = RUBRIC_METADATA[activeKey];
  const activeItem = declarations[activeKey];
  const ActiveIcon = activeMeta.icon;

  const currentIdx = rubricKeys.indexOf(activeKey);
  const completedCount = rubricKeys.filter((k) => declarations[k].isCompleted).length;
  const modifiedCount = rubricKeys.filter((k) => declarations[k].isModified).length;

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

  return (
    <div className="space-y-6">
      {/* Thông báo trong Edit Mode */}
      {isEditMode && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3">
          <Brain size={18} className="text-blue-600 mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed text-blue-900">
            <span className="font-bold">Edit AI Declarations:</span> Dữ liệu khai báo từ bài nộp trước đã được điền sẵn.
            Bạn có thể cập nhật Prompt, tóm tắt phản hồi AI hoặc điều chỉnh lại phần Đánh giá/Tự phản chiếu của mình.
            {modifiedCount > 0 && (
              <span className="block mt-1 font-semibold text-amber-700">
                • Bạn đã chỉnh sửa {modifiedCount} / 5 tiêu chí trong phiên này.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wide uppercase">
          <Brain size={16} />
          <span>{isEditMode ? 'STEP 2: EDIT AI DECLARATIONS' : 'STEP 2: AI DECLARATION (REQUIRED)'}</span>
        </div>
        <span className="text-[11px] text-slate-500 border border-slate-200 rounded-full px-3 py-1 font-medium bg-slate-50">
          Completed: {completedCount} / 5 Rubrics
        </span>
      </div>

      <div className="grid grid-cols-12 gap-5 items-start">
        {/* Danh sách 5 Rubrics bên trái */}
        <div className="col-span-12 md:col-span-4 space-y-2">
          {rubricKeys.map((key, index) => {
            const meta = RUBRIC_METADATA[key];
            const item = declarations[key];
            const isActive = activeKey === key;
            const isDone = item.isCompleted;
            const isEdited = item.isModified;

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
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {isEdited ? 'EDITED' : isDone ? 'DECLARED' : 'NOT DECLARED'}
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
                {activeItem.isModified && (
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
                value={activeItem.aiTool}
                onChange={(e) =>
                  onDeclarationChange(activeKey, 'aiTool', e.target.value)
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
                value={activeItem.decision}
                onChange={(e) =>
                  onDeclarationChange(activeKey, 'decision', e.target.value)
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
              value={activeItem.prompt}
              onChange={(e) =>
                onDeclarationChange(activeKey, 'prompt', e.target.value)
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
              value={activeItem.responseSummary}
              onChange={(e) =>
                onDeclarationChange(activeKey, 'responseSummary', e.target.value)
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
              value={activeItem.reflection}
              onChange={(e) =>
                onDeclarationChange(activeKey, 'reflection', e.target.value)
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
            <span>Back to File</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="saf-btn-outline"
          >
            Cancel
          </button>
        </div>

        <button
          type="button"
          disabled={isSubmittingPayload}
          onClick={onSubmit}
          className="saf-btn-dark"
        >
          {isSubmittingPayload ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>{isEditMode ? 'Updating Submission...' : 'Submitting Assignment...'}</span>
            </>
          ) : (
            <>
              <span>{isEditMode ? 'Update Submission & Audit Log' : 'Submit Assignment'}</span>
              <CheckCircle2 size={14} className="text-emerald-400" />
            </>
          )}
        </button>
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
    isEdit: boolean;
  }) => Promise<boolean>;
}

export default function StudentAssignmentFlow({
  initialAssignment = DEFAULT_ASSIGNMENT,
  initialSubmission = SAMPLE_SUBMITTED_STATE,
  onBackToCourse,
  onSubmitApiHandler,
}: StudentAssignmentFlowProps) {
  // State Machine Quản lý 2 Chế độ chính
  const [viewMode, setViewMode] = useState<ViewMode>('VIEW_STATUS');
  const [formStep, setFormStep] = useState<FormStep>(1);

  // Core Data States
  const [assignment] = useState<Assignment>(initialAssignment);
  const [submission, setSubmission] = useState<SubmissionData>(initialSubmission);

  // Edit Mode Flag: true nếu bài đã nộp trước đó
  const isEditMode = submission.status === 'Submitted';

  // File Management State trong Edit Mode: 'keep' (giữ file cũ) hoặc 'replace' (tải file mới)
  const [fileMode, setFileMode] = useState<'keep' | 'replace'>(
    isEditMode && submission.file ? 'keep' : 'replace'
  );

  // Draft States trong Form
  const [draftFile, setDraftFile] = useState<SubmissionFile | null>(submission.file);
  const [draftRawFile, setDraftRawFile] = useState<File | null>(null);
  const [draftDeclarations, setDraftDeclarations] = useState<
    Record<RubricKey, AiDeclarationRubric>
  >(submission.declarations);

  // Loading & Toast States
  const [isSubmittingPayload, setIsSubmittingPayload] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleOpenForm = () => {
    // Populate draft state from existing submission
    setDraftFile(submission.file);
    setDraftRawFile(null);
    setFileMode(isEditMode && submission.file ? 'keep' : 'replace');
    
    // Deep clone declarations to prevent mutating viewMode state directly
    const clonedDeclarations = {} as Record<RubricKey, AiDeclarationRubric>;
    const keys: RubricKey[] = ['decomposition', 'pattern', 'abstraction', 'algorithmic', 'reflection'];
    keys.forEach(k => {
      clonedDeclarations[k] = {
        ...(submission.declarations?.[k] || INITIAL_DECLARATIONS[k]),
        isModified: false,
      };
    });
    setDraftDeclarations(clonedDeclarations);

    setFormStep(1);
    setViewMode('FORM');
  };

  const handleCancelForm = () => {
    setViewMode('VIEW_STATUS');
    setFormStep(1);
  };

  const handleDeclarationChange = (
    key: RubricKey,
    field: RubricFormField,
    value: string
  ) => {
    setDraftDeclarations((prev) => {
      const current = prev[key] || INITIAL_DECLARATIONS[key];
      const updatedItem: AiDeclarationRubric = {
        ...current,
        [field]: value as any,
        isModified: true, // Mark that this field was modified in edit session
      };

      const hasContent =
        (updatedItem.prompt || '').trim().length > 0 &&
        (updatedItem.reflection || '').trim().length > 0;

      updatedItem.isCompleted = hasContent;

      return {
        ...prev,
        [key]: updatedItem,
      };
    });
  };

  // Logic khi bấm "Submit Assignment" hoặc "Update Submission"
  const handleSubmitAssignment = async () => {
    // Determine effective file
    let effectiveFile: SubmissionFile | null = null;

    if (isEditMode && fileMode === 'keep') {
      effectiveFile = submission.file;
    } else {
      effectiveFile = draftFile || (draftRawFile ? {
        name: draftRawFile.name,
        size: draftRawFile.size,
        type: draftRawFile.type,
      } : null);
    }

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
          isEdit: isEditMode,
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
        (k) => draftDeclarations[k].isCompleted
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
        feedback: submission.feedback || 'No feedback yet. Submitted successfully. Waiting for grading.',
        transparencyScore: calculatedScore,
        declarations: draftDeclarations,
      };

      setSubmission(newSubmissionData);

      // Tự động chuyển State về VIEW_STATUS
      setViewMode('VIEW_STATUS');
      setFormStep(1);

      showToast(
        isEditMode
          ? `Cập nhật bài nộp và khai báo AI thành công (Phiên bản v${newSubmissionData.version}.0)!`
          : 'Nộp bài và khai báo AI thành công!'
      );
    } catch (err: any) {
      console.error('Submission error:', err);
      alert('Có lỗi xảy ra khi gửi bài. Vui lòng thử lại!');
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
            <span>Back to {assignment.courseCode}</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400 truncate max-w-xs sm:max-w-md">
            {assignment.courseTitle}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-bold">{assignment.title}</span>
        </nav>

        {/* Header Tiêu đề & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {assignment.title}
              </h1>
              {submission.status === 'Submitted' && (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Check size={12} />
                  <span>Submitted</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Course: <span className="font-semibold">{assignment.courseCode}</span> • Due Date: {assignment.dueDate}
            </p>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-full border self-start sm:self-auto ${
              submission.status === 'Submitted'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {submission.status}
          </span>
        </div>

        {/* Layout 2 Cột (Trái: 1/3, Phải: 2/3) */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI */}
          <div className="col-span-12 lg:col-span-4">
            <AssignmentOverview
              assignment={assignment}
              activeAssignmentTitle={assignment.title}
              score={submission.status === 'Submitted' ? assignment.score : null}
            />
          </div>

          {/* CỘT PHẢI (State Container) */}
          <div className="col-span-12 lg:col-span-8 saf-card bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
            {viewMode === 'VIEW_STATUS' ? (
              /* CHẾ ĐỘ A: VIEW_STATUS */
              <SubmissionStatusView
                submission={submission}
                onAddOrEditClick={handleOpenForm}
              />
            ) : (
              /* CHẾ ĐỘ B: FORM STEPPER (ADD HOẶC EDIT) */
              <div className="space-y-6">
                {/* Stepper Header (1 -> 2) */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        {isEditMode
                          ? 'Edit Submission & AI Declaration'
                          : 'Submit Assignment'}
                      </h2>
                      {isEditMode && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                          Editing Mode
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Step {formStep} of 2 •{' '}
                      {formStep === 1
                        ? isEditMode ? 'File Management' : 'File Upload'
                        : 'Computational Thinking Rubrics'}
                    </p>
                  </div>

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
                </div>

                {/* Form Step Body */}
                {formStep === 1 ? (
                  <FileUploader
                    selectedFile={draftFile}
                    existingFile={submission.file}
                    isEditMode={isEditMode}
                    fileMode={fileMode}
                    onFileModeChange={(mode) => setFileMode(mode)}
                    onFileSelect={(file) => {
                      setDraftRawFile(file);
                      setDraftFile({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: file.lastModified,
                      });
                    }}
                    onFileRemove={() => {
                      setDraftFile(null);
                      setDraftRawFile(null);
                    }}
                    onCancel={handleCancelForm}
                    onNext={() => setFormStep(2)}
                  />
                ) : (
                  <AiRubricForm
                    declarations={draftDeclarations}
                    isEditMode={isEditMode}
                    onDeclarationChange={handleDeclarationChange}
                    onPreviousStep={() => setFormStep(1)}
                    onCancel={handleCancelForm}
                    onSubmit={handleSubmitAssignment}
                    isSubmittingPayload={isSubmittingPayload}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
