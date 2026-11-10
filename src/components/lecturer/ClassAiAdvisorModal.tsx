import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Users, 
  ShieldAlert, 
  Lightbulb, 
  X, 
  RotateCcw,
  History
} from 'lucide-react';

interface AdvisoryOverview {
  submission_rate_text?: string;
  avg_ai_transparency?: string;
}

interface AdvisoryItem {
  id: string;
  assignment_id: string;
  assignment_title: string;
  is_latest: boolean;
  generated_at: string;
  class_overview?: AdvisoryOverview;
  common_error_clusters?: string[];
  next_slot_recommendation?: string;
}

interface ClassAiAdvisorData {
  has_data: boolean;
  latest_advisory_id: string;
  advisories: AdvisoryItem[];
}

interface ClassAiAdvisorModalProps {
  classId: string;
  isOpen: boolean;
  onClose: () => void;
  advisorData: ClassAiAdvisorData | null;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export const ClassAiAdvisorModal: React.FC<ClassAiAdvisorModalProps> = ({
  isOpen,
  onClose,
  advisorData,
  onRefresh,
  isRefreshing
}) => {
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    if (advisorData?.advisories?.length) {
      setSelectedId(advisorData.advisories[0].id);
    }
  }, [advisorData]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !advisorData?.has_data || !advisorData?.advisories?.length) return null;

  const currentItem = advisorData.advisories.find((item: AdvisoryItem) => item.id === selectedId) || advisorData.advisories[0];
  const isLatest = currentItem.id === advisorData.advisories[0].id;

  const formattedDate = currentItem.generated_at
    ? new Date(currentItem.generated_at).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-all animate-fadeIn"
      onClick={onClose}
    >
      {/* Subwindow Dialog Container */}
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Subwindow */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border-b border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-slate-800 text-base">
                  Trợ lý Sư phạm Lớp học (AI Class Advisor)
                </h3>
                {isLatest ? (
                  <span className="text-[11px] font-medium text-purple-700 bg-purple-100/80 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Khuyến nghị Slot tới
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <History className="w-3 h-3" /> Lịch sử lưu trữ{formattedDate ? ` - ${formattedDate}` : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng hợp bài tập: <span className="font-medium text-slate-700">{currentItem.assignment_title}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: History Selector & Re-run */}
        <div className="px-6 py-2.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Chọn bài tập / Slot:</span>
            {advisorData.advisories.length > 1 ? (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="font-medium text-slate-700 bg-white border border-slate-200 rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-xs cursor-pointer"
              >
                {advisorData.advisories.map((adv: AdvisoryItem, index: number) => (
                  <option key={adv.id} value={adv.id}>
                    {index === 0 ? `📍 Mới nhất: ${adv.assignment_title}` : `🕒 ${adv.assignment_title}`}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-medium text-slate-700">{currentItem.assignment_title}</span>
            )}
          </div>

          {isLatest && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition disabled:opacity-50"
              title="Phân tích lại dữ liệu mới nhất"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
              <span>Chạy lại</span>
            </button>
          )}
        </div>

        {/* Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* 1. Thống kê vĩ mô */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="text-slate-500 font-medium">Tỷ lệ nộp bài</div>
                <div className="text-slate-800 font-semibold mt-0.5">
                  {currentItem.class_overview?.submission_rate_text || 'Chưa có thông tin nộp bài'}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="text-slate-500 font-medium">Minh bạch AI trung bình</div>
                <div className="text-slate-800 font-semibold mt-0.5">
                  {currentItem.class_overview?.avg_ai_transparency || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Cụm lỗi kỹ thuật */}
          {currentItem.common_error_clusters && currentItem.common_error_clusters.length > 0 && (
            <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-amber-900 font-medium text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">Cụm lỗi kỹ thuật & điểm mù chung của lớp:</span>
              </div>
              <ul className="space-y-1.5 pl-5 text-xs text-slate-700 list-disc marker:text-amber-500">
                {currentItem.common_error_clusters.map((cluster: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">{cluster}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Đề xuất định hướng buổi học */}
          {currentItem.next_slot_recommendation && (
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="text-xs leading-relaxed text-slate-700">
                <strong className="text-indigo-950 font-semibold block mb-1">
                  Định hướng buổi học kế tiếp:
                </strong>
                {currentItem.next_slot_recommendation}
              </div>
            </div>
          )}
        </div>

        {/* Footer Subwindow */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassAiAdvisorModal;

