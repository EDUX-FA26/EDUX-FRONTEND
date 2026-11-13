import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Layers, ExternalLink } from 'lucide-react';

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
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !assignment) return null;

  const slotNo = assignment.slot_number || assignment.session_no;
  const descriptionText = (assignment.description || assignment.content || '').trim();

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px] animate-in fade-in duration-150"
      style={{ zIndex: 1100 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
                Mô tả chi tiết (Description)
              </span>
              {slotNo ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                  <Layers className="w-2.5 h-2.5" /> Slot {slotNo}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  Toàn khóa
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-800 truncate mt-0.5">
              {assignment.title || 'Chi tiết bài tập'}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition shrink-0"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[55vh] overflow-y-auto text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {descriptionText || 'Không có mô tả chi tiết cho bài tập này.'}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
          {onOpenAssignment && assignment.id && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAssignment(assignment.id!);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-lg transition flex items-center gap-1"
            >
              <span>Xem chi tiết</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
