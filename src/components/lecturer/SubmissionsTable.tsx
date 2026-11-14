import React, { useState } from 'react';
import { Eye, File as FileIcon, Minus } from 'lucide-react';
import { AIAuditDetailModal } from './AIAuditQuickViewHover';
import { formatDateDMY } from '../../helper/dateFormat';

export interface SubmissionItem {
  id: string;
  student_id?: string;
  student_name?: string;
  student_code?: string;
  student_email?: string;
  status?: string;
  submitted_at?: string;
  latest_files?: any;
  latest_note?: string;
  has_declared_audit?: boolean;
  ai_declarations?: any[];
  ai_audit_log?: any;
  aiAuditLog?: any;
  declarations?: any;
  note?: string;
  score?: number | null;
  feedback?: string | null;
  grade?: { score?: number; feedback?: string };
  rubrics?: any;
  [key: string]: any;
}

export interface SubmissionsTableProps {
  submissions: SubmissionItem[];
  assignment?: any;
  onOpenAuditModal?: (sub: SubmissionItem) => void;
  onDownloadFile?: (submissionId: string, fileId: string) => void;
  onGradeSubmission?: (sub: SubmissionItem) => void;
  className?: string;
}

/**
 * Kiểm tra điều kiện khai báo AI Audit Log
 */
export const isAuditDeclared = (sub: any): boolean => {
  if (!sub) return false;
  if (typeof sub.has_declared_audit === 'boolean') return sub.has_declared_audit;
  if (Array.isArray(sub.ai_declarations)) return sub.ai_declarations.length > 0;
  if (sub.ai_audit_log && typeof sub.ai_audit_log === 'object') {
    return Object.keys(sub.ai_audit_log).length > 0;
  }
  // Safe fallback cho local mock / dữ liệu note thô
  const raw = sub.declarations || sub.aiAuditLog || sub.latest_note || sub.note;
  if (raw) {
    try {
      const parsed = typeof raw === 'string'
        ? JSON.parse(raw.startsWith('Note:') ? raw.slice(5).trim() : raw)
        : raw;
      if (parsed?.isDeclared && parsed?.completedCount > 0) return true;
      if (parsed?.completedCount && parsed.completedCount > 0) return true;
      if (Array.isArray(parsed?.scopes)) {
        return parsed.scopes.some((s: any) =>
          s?.completedCount > 0 ||
          (s?.declarations && Object.values(s.declarations).some((d: any) => (d?.prompt || d?.prompt_used) && (d?.response || d?.responseSummary)))
        );
      }
      if (parsed?.declarations && typeof parsed.declarations === 'object') {
        return Object.values(parsed.declarations).some((d: any) => (d?.prompt || d?.prompt_used) && (d?.response || d?.responseSummary));
      }
    } catch (e) {}
  }
  return false;
};

export default function SubmissionsTable({
  submissions = [],
  assignment,
  onOpenAuditModal,
  onDownloadFile,
  onGradeSubmission,
  className = '',
}: SubmissionsTableProps) {
  const [internalSelectedAuditSub, setInternalSelectedAuditSub] = useState<SubmissionItem | null>(null);

  const handleOpenAudit = (sub: SubmissionItem) => {
    if (onOpenAuditModal) {
      onOpenAuditModal(sub);
    } else {
      setInternalSelectedAuditSub(sub);
    }
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500 font-semibold">
            <th className="p-2">Student</th>
            <th className="p-2">Status</th>
            <th className="p-2">Submitted At</th>
            <th className="p-2">File/Link</th>
            <th className="p-2 text-center">AI Audit</th>
            <th className="p-2">Score</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(() => {
            const isAiTrackingEnabled = Boolean(
              assignment?.ai_declaration_required !== false &&
              assignment?.ai_tracking_enabled !== false &&
              assignment?.is_ai_enabled !== false
            );

            return submissions.length > 0 ? (
              submissions.map((sub, index) => {
                const isSubmitted = sub.status !== 'Missing' && sub.status !== 'missing' && !String(sub.id || '').startsWith('missing-');
                const hasDeclared = isSubmitted && isAuditDeclared(sub);
                let files: any[] = [];
                try {
                  if (sub.latest_files) {
                    files = typeof sub.latest_files === 'string' ? JSON.parse(sub.latest_files) : sub.latest_files;
                  }
                } catch (e) {}

                const currentScore = sub.score ?? sub.grade?.score;
                const maxScore = assignment?.max_score || 10;
                const isGraded = currentScore !== undefined && currentScore !== null;

                return (
                  <tr key={sub.id || index} className="hover:bg-slate-50/60 transition">
                    {/* Cột thông tin sinh viên */}
                    <td className="p-2 font-bold text-slate-900">
                      <div>{sub.student_name || sub.student_email || 'Unknown Student'}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{sub.student_code || ''}</div>
                    </td>

                    {/* Cột Trạng thái bài nộp */}
                    <td className="p-2">
                      {isGraded ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Graded
                        </span>
                      ) : sub.status === 'submitted' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          {sub.status || 'Missing'}
                        </span>
                      )}
                    </td>

                    {/* Cột Thời gian nộp */}
                    <td className="p-2 text-slate-600">
                      {sub.submitted_at ? formatDateDMY(sub.submitted_at) : 'N/A'}
                    </td>

                    {/* Cột File đính kèm */}
                    <td className="p-2">
                      <div className="flex flex-col gap-1">
                        {Array.isArray(files) && files.length > 0 ? (
                          files.map((file) => (
                            <div key={file.id || file.name} className="flex items-center gap-1">
                              <FileIcon className="w-3 h-3 text-indigo-600 shrink-0" />
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  onDownloadFile?.(sub.id, file.id);
                                }}
                                className="text-[11px] text-indigo-600 hover:underline font-medium truncate max-w-[150px]"
                              >
                                {file.name}
                              </a>
                            </div>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* 5. CỘT AI AUDIT (CHÍNH LÀ NƠI CHỨA ICON CON MẮT) */}
                    <td className="py-3 px-4 text-center">
                      {!isAiTrackingEnabled ? (
                        // 1. Bài tập không yêu cầu AI Audit
                        <span 
                          title="Bài tập không yêu cầu khai báo AI Audit" 
                          className="text-slate-300 inline-flex items-center justify-center cursor-default"
                        >
                          <Minus className="w-4 h-4"/>
                        </span>
                      ) : !isSubmitted ? (
                        // 2. Sinh viên chưa nộp bài
                        <button
                          type="button"
                          disabled
                          title="Sinh viên chưa nộp bài"
                          className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-slate-50 text-slate-300 opacity-30 cursor-not-allowed"
                        >
                          <Eye className="w-4 h-4"/>
                        </button>
                      ) : !hasDeclared ? (
                        // 3. Đã nộp bài nhưng không dùng / không khai báo AI
                        <button
                          type="button"
                          disabled
                          title="Sinh viên không khai báo sử dụng AI"
                          className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-slate-50 text-slate-400 opacity-40 cursor-not-allowed"
                        >
                          <Eye className="w-4 h-4"/>
                        </button>
                      ) : (
                        // 4. Đã khai báo AI đầy đủ
                        <button
                          type="button"
                          onClick={() => handleOpenAudit(sub)}
                          title="Xem chi tiết khai báo AI Audit"
                          className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4"/>
                        </button>
                      )}
                    </td>

                  {/* 6. Cột Điểm số */}
                  <td className="p-2">
                    {isGraded ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-indigo-600 text-xs">
                            {Number(currentScore).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400">/ {maxScore}</span>
                        </div>
                        {sub.feedback && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={sub.feedback}>
                            {sub.feedback}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Chưa chấm</span>
                    )}
                  </td>

                  {/* 7. Cột Thao tác */}
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      className="px-3 py-1 bg-orange-400 hover:bg-orange-500 text-white rounded-lg text-xs font-medium transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={sub.status === 'Missing'}
                      onClick={() => onGradeSubmission?.(sub)}
                    >
                      {isGraded ? 'Sửa điểm' : 'Grade'}
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} className="p-4 text-center text-slate-400">
                No submissions yet.
              </td>
            </tr>
          );
        })()}
        </tbody>
      </table>

      {/* MODAL XEM CHI TIẾT AI AUDIT LOG */}
      {internalSelectedAuditSub && (
        <AIAuditDetailModal
          isOpen={Boolean(internalSelectedAuditSub)}
          onClose={() => setInternalSelectedAuditSub(null)}
          declarationData={
            internalSelectedAuditSub.declarations ||
            internalSelectedAuditSub.ai_declarations ||
            internalSelectedAuditSub.aiAuditLog ||
            internalSelectedAuditSub.ai_audit_log ||
            internalSelectedAuditSub.latest_note ||
            internalSelectedAuditSub.note
          }
          studentName={internalSelectedAuditSub.student_name}
          studentCode={internalSelectedAuditSub.student_code}
        />
      )}
    </div>
  );
}

