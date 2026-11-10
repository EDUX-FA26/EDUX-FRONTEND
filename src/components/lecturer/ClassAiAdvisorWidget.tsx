import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Users, 
  ShieldAlert, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  History
} from 'lucide-react';
import ClassService from '../../services/class.service';

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

export const ClassAiAdvisorWidget = ({ classId }: { classId: string }) => {
  const [data, setData] = useState<ClassAiAdvisorData | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch data từ GET /api/classes/:classId/ai-advisor
  useEffect(() => {
    let isMounted = true;
    const fetchAdvisor = async () => {
      try {
        const res = await ClassService.getClassAiAdvisor(classId);
        const payload: ClassAiAdvisorData = res?.data || res;
        if (isMounted && payload && payload.has_data && payload.advisories?.length) {
          setData(payload);
          setSelectedId(payload.advisories[0]?.id || '');
        }
      } catch (err) {
        console.error('Failed to fetch AI Class Advisor data:', err);
      }
    };

    if (classId) {
      fetchAdvisor();
    }

    return () => {
      isMounted = false;
    };
  }, [classId]);

  // Xử lý buộc phân tích lại bài mới nhất
  const handleRefresh = async () => {
    if (isRefreshing || !classId) return;
    try {
      setIsRefreshing(true);
      const res = await ClassService.refreshClassAiAdvisor(classId);
      const payload: ClassAiAdvisorData = res?.data || res;
      if (payload && payload.has_data && payload.advisories?.length) {
        setData(payload);
        setSelectedId(payload.advisories[0]?.id || '');
      }
    } catch (err) {
      console.error('Failed to refresh AI advisor:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!data || !data.has_data || !data.advisories?.length) return null;

  const currentItem = data.advisories.find((item: AdvisoryItem) => item.id === selectedId) || data.advisories[0];
  const isLatest = currentItem.id === data.advisories[0].id;

  const formattedDate = currentItem.generated_at
    ? new Date(currentItem.generated_at).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '';

  return (
    <div className="mb-6 rounded-2xl border border-purple-200/80 bg-gradient-to-br from-white via-purple-50/20 to-indigo-50/30 p-5 shadow-sm transition-all">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-purple-100/70 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-800 text-sm md:text-base">
                Trợ lý Sư phạm Lớp học (AI Class Advisor)
              </h3>
              {isLatest ? (
                <span className="text-[11px] font-medium text-purple-700 bg-purple-100/70 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Khuyến nghị Slot tới
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <History className="w-3 h-3" /> Lịch sử lưu trữ{formattedDate ? ` - ${formattedDate}` : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân tích từ bài tập: <span className="font-medium text-slate-700">{currentItem.assignment_title}</span>
            </p>
          </div>
        </div>

        {/* Action Controls & History Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Dropdown Lịch sử */}
          {data.advisories.length > 1 && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 transition shadow-xs"
            >
              {data.advisories.map((adv: AdvisoryItem, index: number) => (
                <option key={adv.id} value={adv.id}>
                  {index === 0 ? `📍 Mới nhất: ${adv.assignment_title}` : `🕒 ${adv.assignment_title}`}
                </option>
              ))}
            </select>
          )}

          {isLatest && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
              title="Phân tích lại bài tập mới nhất"
            >
              <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-600' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body Widget */}
      {!isCollapsed && (
        <div className="mt-4 space-y-4">
          {/* 1. Tóm tắt tình hình lớp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-white/90 rounded-xl border border-slate-100 flex items-center gap-3">
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

            <div className="p-3 bg-white/90 rounded-xl border border-slate-100 flex items-center gap-3">
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

          {/* 2. Điểm mù / Cụm lỗi phổ biến */}
          {currentItem.common_error_clusters && currentItem.common_error_clusters.length > 0 && (
            <div className="p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-xl">
              <div className="flex items-center gap-2 mb-2 text-amber-900 font-medium text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Cụm lỗi kỹ thuật & điểm mù chung của lớp:</span>
              </div>
              <ul className="space-y-1.5 pl-5 text-xs text-slate-700 list-disc marker:text-amber-500">
                {currentItem.common_error_clusters.map((cluster: string, i: number) => (
                  <li key={i} className="leading-relaxed">{cluster}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Đề xuất Slot học kế tiếp */}
          {currentItem.next_slot_recommendation && (
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="text-xs leading-relaxed text-slate-700">
                <strong className="text-indigo-950 font-semibold">Định hướng buổi học kế tiếp: </strong>
                {currentItem.next_slot_recommendation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClassAiAdvisorWidget;

