import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Layers, Clock, FileText, ExternalLink } from 'lucide-react';

export interface AssignmentDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: {
    id?: string;
    title?: string;
    description?: string;
    content?: string;
    deadline?: string;
    dueDate?: string;
    slot_id?: string;
    slot_number?: number;
    session_no?: number;
    slot_title?: string;
    slot_date?: string;
    slot_time?: string;
    max_score?: number;
    weight?: number;
    class_code?: string;
  } | null;
  onOpenAssignment?: (assignmentId: string) => void;
}

export default function AssignmentDescriptionModal({
  isOpen,
  onClose,
  assignment,
  onOpenAssignment,
}: AssignmentDescriptionModalProps) {
  // Đóng modal khi nhấn phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !assignment) return null;

  const slotNo = assignment.slot_number || assignment.session_no;
  let slotDateStr = '';
  if (assignment.slot_date) {
    try {
      slotDateStr = new Date(assignment.slot_date).toLocaleDateString('vi-VN');
    } catch {
      slotDateStr = '';
    }
  }

  const deadlineDisplay = assignment.dueDate || (assignment.deadline ? new Date(assignment.deadline).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : 'Không giới hạn');

  const fullDescription = (assignment.description || assignment.content || '').trim();

  return createPortal(
    <div
      className="fixed top-16 bottom-0 left-0 right-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assignment-desc-title"
    >
      <div
        className="w-full max-w-2xl max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-50/80 to-white">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {slotNo ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                  <Layers className="w-3 h-3 text-orange-600" />
                  Slot {slotNo}{slotDateStr ? ` • ${slotDateStr}` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <Layers className="w-3 h-3 text-slate-500" />
                  Bài tập chung toàn khóa
                </span>
              )}

              {assignment.max_score != null && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Tối đa: {assignment.max_score}đ
                </span>
              )}

              {assignment.weight != null && assignment.weight > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Trọng số: {assignment.weight}%
                </span>
              )}
            </div>

            <h3 id="assignment-desc-title" className="text-base font-bold text-slate-900 leading-snug break-words">
              {assignment.title || 'Chi tiết bài tập'}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Hạn nộp: <strong className="text-slate-700 font-semibold">{deadlineDisplay}</strong></span>
              {assignment.slot_time && (
                <>
                  <span className="text-slate-300">•</span>
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{assignment.slot_time}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            title="Đóng (ESC)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Independent scroll) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Nội dung mô tả bài tập (Description)</span>
            </div>

            {fullDescription ? (
              <div className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-4.5 rounded-xl border border-slate-200/70 font-sans selection:bg-orange-100">
                {fullDescription}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 italic bg-slate-50/40 rounded-xl border border-dashed border-slate-200">
                Giảng viên chưa cung cấp mô tả chi tiết cho bài tập này.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-[11px] text-slate-400">
            Bấm <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded font-mono text-slate-600 shadow-2xs">ESC</kbd> hoặc click ngoài để đóng
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors border border-slate-200 bg-white"
            >
              Đóng
            </button>

            {onOpenAssignment && assignment.id && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAssignment(assignment.id!);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>Xem chi tiết bài tập</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

