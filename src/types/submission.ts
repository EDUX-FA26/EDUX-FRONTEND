/**
 * Academic Research Transparency & AI Audit System (ART-AI)
 * Data Contract & Schema Definitions between FE (React/TypeScript) and BE
 */

export type AiTool =
  | 'ChatGPT'
  | 'ChatGPT-4o'
  | 'Claude'
  | 'Claude 3.5 Sonnet'
  | 'Gemini'
  | 'Gemini 1.5 Pro'
  | 'GitHub Copilot'
  | 'Cursor'
  | 'Other';

export type AiDecision =
  | 'Fully Accepted'
  | 'Partially Modified'
  | 'Heavily Adapted'
  | 'Rejected';

export type SubmissionStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'GRADED';

export type FileType = 'pdf' | 'zip' | 'docx' | 'code' | 'other';

export type AiRiskLevel = 'low' | 'medium' | 'high';

export type AiComplianceStatus = 'compliant' | 'minor_discrepancy' | 'violation';

/**
 * 1 tiêu chí trong 5 tiêu chí Computational Thinking / AI Reflection
 */
export interface AiPhaseItem {
  aiTool: AiTool | string;
  decision: AiDecision | string;
  prompt: string;
  responseSummary: string;
  reflection: string;
}

/**
 * Bản khai báo AI Audit Log gồm 5 tiêu chí Computational Thinking
 */
export interface AiAuditDeclaration {
  decomposition: AiPhaseItem;
  pattern: AiPhaseItem;
  abstraction: AiPhaseItem;
  algorithmic: AiPhaseItem;
  reflection: AiPhaseItem;
  transparencyScore?: number; // 0 -> 100
  isDeclared: boolean;
}

/**
 * Thông tin file đính kèm
 */
export interface SubmissionFile {
  name: string;
  url: string;
  size: number; // in bytes
  mimeType: string;
  fileType: FileType;
  rawFile?: File; // file đối tượng nếu vừa upload từ browser
  extractedTree?: ZipTreeNode[]; // cấu trúc cây thư mục nếu là file zip
  textContent?: string; // nội dung text nếu là file code đơn lẻ
}

/**
 * Kết quả chấm điểm của Giảng viên
 */
export interface SubmissionGrade {
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
  gradedBy?: string;
  rubrics?: {
    r1: number; // Code Quality & Structure (0-4)
    r2: number; // Functionality & Correctness (0-4)
    r3: number; // Documentation & AI Declaration (0-2)
  };
  aiComplianceStatus?: AiComplianceStatus;
  isDraft?: boolean;
}

/**
 * Model chính bài nộp của sinh viên
 */
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  studentEmail?: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  lastUpdatedAt?: string | null;
  file: SubmissionFile | null;
  aiAuditLog: AiAuditDeclaration | null;
  grade: SubmissionGrade | null;
  aiRiskLevel?: AiRiskLevel;
  aiRiskLabel?: string;
  resubmitRequested?: boolean;
  resubmitReason?: string;
}

/**
 * Cấu trúc Node trong cây thư mục GitHub-style khi xem file ZIP
 */
export interface ZipTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  extension?: string;
  children?: ZipTreeNode[];
  content?: string; // Source code hoặc text của file
}

/**
 * Payload khi Sinh viên nộp bài (Submit)
 */
export interface SubmitAssignmentPayload {
  file: File | null;
  fileMeta?: {
    name: string;
    size: number;
    mimeType: string;
    fileType: FileType;
  };
  aiAuditLog: AiAuditDeclaration | null;
  note?: string;
}

/**
 * Payload khi Giảng viên lưu điểm (Draft hoặc Publish)
 */
export interface GradeSubmissionPayload {
  score: number;
  feedback: string;
  rubrics?: {
    r1: number;
    r2: number;
    r3: number;
  };
  aiComplianceStatus?: AiComplianceStatus;
  isDraft?: boolean;
}

/**
 * Payload khi Giảng viên yêu cầu nộp lại (Resubmit Request)
 */
export interface RequestResubmitPayload {
  submissionId: string;
  reason: string;
}
