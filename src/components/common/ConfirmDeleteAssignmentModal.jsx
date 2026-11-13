import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDeleteAssignmentModal({
    isOpen,
    onClose,
    assignment,
    onConfirm,
    isDeleting = false,
}) {
    const [warningNotice, setWarningNotice] = useState(null);
    const [forceRequired, setForceRequired] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setWarningNotice(null);
            setForceRequired(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !isDeleting) {
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isDeleting, onClose]);

    if (!isOpen || !assignment) return null;

    const handleDelete = async (force = false) => {
        try {
            await onConfirm(assignment.id, force);
            onClose();
        } catch (err) {
            const resData = err?.response?.data;
            if (resData?.code === 'SUBMISSIONS_EXIST') {
                setWarningNotice(`Bài tập này hiện đã có ${resData.submission_count || 'một số'} bài nộp của sinh viên. Nếu tiếp tục xóa, toàn bộ bài nộp và đánh giá liên quan sẽ bị xóa vĩnh viễn.`);
                setForceRequired(true);
            } else {
                alert(resData?.message || err.message || 'Lỗi khi xóa bài tập');
            }
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-150"
            style={{ zIndex: 1200 }}
            onClick={() => { if (!isDeleting) onClose(); }}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-red-50/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <Trash2 className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">
                            Xóa bài tập này?
                        </h4>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3 text-sm text-slate-600 leading-relaxed">
                    <p>
                        Bạn có chắc chắn muốn xóa bài tập <strong className="text-slate-900 font-semibold font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">[{assignment.title}]</strong>?
                    </p>
                    <p className="text-xs text-slate-500">
                        Hành động này sẽ gỡ bài tập khỏi buổi học (Slot) và không thể hoàn tác.
                    </p>

                    {warningNotice && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>{warningNotice}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDelete(forceRequired)}
                        disabled={isDeleting}
                        className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                        {isDeleting ? (
                            <span>Đang xóa...</span>
                        ) : forceRequired ? (
                            <span>Vẫn xóa toàn bộ</span>
                        ) : (
                            <span>Xóa bài tập</span>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

