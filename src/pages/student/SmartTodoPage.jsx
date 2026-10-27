import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Plus, Search, Filter, Calendar, Clock, Sparkles,
  Flame, CheckCircle2, Circle, AlertCircle, BookOpen, Trash2, Edit2, Play, ExternalLink
} from 'lucide-react';
import TodoService from '../../services/todo.service';
import TodoModal from '../../components/todos/TodoModal';
import { formatShortDate } from '../../helper/focusFormat';

const PRIORITY_BADGE = {
  HIGH: { label: 'Cao 🔥', bg: 'bg-red-50 text-red-600 border-red-200' },
  MEDIUM: { label: 'Trung bình', bg: 'bg-orange-50 text-orange-600 border-orange-200' },
  LOW: { label: 'Thấp', bg: 'bg-gray-50 text-gray-600 border-gray-200' },
};

const SOURCE_LABEL = {
  MANUAL: 'Thủ công',
  STUDY_PLANNER: 'Study Plan',
  AI_SUGGESTED: 'AI đề xuất',
};

export default function SmartTodoPage() {
  const navigate = useNavigate();

  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter;
      if (sourceFilter !== 'ALL') params.sourceType = sourceFilter;
      if (search.trim()) params.q = search.trim();

      const [todoRes, statsRes, sugRes] = await Promise.all([
        TodoService.list(params),
        TodoService.getStats(),
        TodoService.getStudyPlanSuggestions().catch(() => ({ data: [] })),
      ]);

      setTodos(todoRes.data.items || []);
      setStats(statsRes.data || null);
      setSuggestions(sugRes.data || []);
    } catch (err) {
      console.error('Failed to load todos:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, sourceFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleStatus = async (todo) => {
    const nextStatus = todo.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      await TodoService.changeStatus(todo.id, nextStatus);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xoá nhiệm vụ này?')) return;
    try {
      await TodoService.remove(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFromPlan = async (planDayId) => {
    try {
      await TodoService.createFromStudyPlan(planDayId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartFocus = (todoId) => {
    navigate(`/student/focus?todoId=${todoId}`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="text-orange-500" size={26} />
            Smart Todo & Lộ trình học tập
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý tập trung mọi nhiệm vụ cá nhân, liên kết Study Plan và mở Focus Room học sâu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/student/focus')}
            className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700 hover:bg-orange-100 transition shadow-sm"
          >
            <Play size={16} />
            Mở Focus Room
          </button>

          <button
            onClick={() => { setEditingTodo(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition shadow-md shadow-orange-500/25"
          >
            <Plus size={18} />
            Tạo nhiệm vụ
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tổng nhiệm vụ</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-gray-900">{stats.total}</span>
              <span className="text-xs font-bold text-gray-500">Hoàn thành {stats.completionRate}%</span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-500">Đang thực hiện</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-orange-600">{stats.byStatus.IN_PROGRESS}</span>
              <span className="text-xs font-bold text-gray-400">{stats.byStatus.TODO} cần làm</span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đã hoàn thành</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-600">{stats.byStatus.COMPLETED}</span>
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">Quá hạn</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-black text-red-600">{stats.overdue}</span>
              <span className="text-xs font-bold text-gray-400">Hôm nay: {stats.dueToday}</span>
            </div>
          </div>
        </div>
      )}

      {/* Study Planner Suggestions Banner (Nếu có ngày học chưa làm Todo) */}
      {suggestions.length > 0 && (
        <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50/70 to-amber-50/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-orange-500" />
              <h2 className="text-sm font-bold text-orange-950 uppercase tracking-wider">
                Gợi ý ôn tập từ Study Planner 7 ngày
              </h2>
            </div>
            <button
              onClick={() => navigate('/student/study-plan')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              Xem lộ trình <ExternalLink size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {suggestions.slice(0, 3).map((s) => (
              <div key={s.planDayId} className="flex flex-col justify-between rounded-xl bg-white p-3.5 border border-orange-100 shadow-sm">
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="font-bold text-orange-600">Ngày {s.day} • {s.subject.code || s.subject.name}</span>
                    <span>{formatShortDate(s.studyDate)}</span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-800 line-clamp-1">{s.topic.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{s.reason || `${s.targetQuestions} câu trắc nghiệm AI`}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-400">
                    {s.activity === 'review' ? 'Ôn tập' : 'Khảo sát'} • ~{s.durationMinutes}p
                  </span>
                  {s.todoId ? (
                    <span className="text-xs font-bold text-emerald-600">✓ Đã thêm Todo</span>
                  ) : (
                    <button
                      onClick={() => handleAddFromPlan(s.planDayId)}
                      className="rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-orange-600 transition"
                    >
                      + Thêm vào Todo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'TODO', label: 'Cần làm' },
            { id: 'IN_PROGRESS', label: 'Đang làm' },
            { id: 'COMPLETED', label: 'Đã xong' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Extra Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-60">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhiệm vụ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-1.5 text-xs outline-none focus:border-orange-500"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 outline-none focus:border-orange-500"
          >
            <option value="ALL">Mọi độ ưu tiên</option>
            <option value="HIGH">Ưu tiên cao 🔥</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="LOW">Thấp</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 outline-none focus:border-orange-500"
          >
            <option value="ALL">Mọi nguồn</option>
            <option value="MANUAL">Thủ công</option>
            <option value="STUDY_PLANNER">Study Plan</option>
            <option value="AI_SUGGESTED">AI đề xuất</option>
          </select>
        </div>
      </div>

      {/* Todo List */}
      {loading ? (
        <div className="py-16 text-center text-sm font-semibold text-gray-400">
          Đang tải danh sách nhiệm vụ...
        </div>
      ) : todos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <CheckSquare size={36} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-700">Chưa có nhiệm vụ nào</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Tạo nhiệm vụ thủ công hoặc thêm bài học từ Study Planner để bắt đầu phiên học tập trung.
          </p>
          <button
            onClick={() => { setEditingTodo(null); setModalOpen(true); }}
            className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow hover:bg-orange-600 transition"
          >
            + Tạo nhiệm vụ ngay
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {todos.map((todo) => {
            const isDone = todo.status === 'COMPLETED';
            const priorityBadge = PRIORITY_BADGE[todo.priority] || PRIORITY_BADGE.MEDIUM;

            return (
              <div
                key={todo.id}
                className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-4 bg-white transition hover:shadow-md ${
                  isDone ? 'border-gray-100 bg-gray-50/60 opacity-80' : 'border-gray-200/80 shadow-sm'
                }`}
              >
                {/* Left check & info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(todo)}
                    className="mt-0.5 shrink-0 text-gray-400 hover:text-orange-500 transition"
                  >
                    {isDone ? (
                      <CheckCircle2 size={22} className="text-emerald-500" />
                    ) : (
                      <Circle size={22} />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`font-bold text-sm ${
                          isDone ? 'line-through text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {todo.title}
                      </h4>

                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${priorityBadge.bg}`}>
                        {priorityBadge.label}
                      </span>

                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                        {SOURCE_LABEL[todo.sourceType] || todo.sourceType}
                      </span>

                      {todo.isOverdue && !isDone && (
                        <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          Quá hạn
                        </span>
                      )}
                    </div>

                    {todo.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{todo.description}</p>
                    )}

                    {/* Metadata tags */}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                      {todo.dueDate && (
                        <span className={`flex items-center gap-1 ${todo.isOverdue ? 'text-red-500 font-bold' : ''}`}>
                          <Calendar size={13} /> Hạn: {formatShortDate(todo.dueDate)}
                        </span>
                      )}

                      {todo.subject && (
                        <span className="flex items-center gap-1 text-orange-600 font-medium">
                          📚 {todo.subject.name}
                        </span>
                      )}

                      {todo.studyPlanDay && (
                        <span className="flex items-center gap-1 text-purple-600 font-medium">
                          🎯 Ngày {todo.studyPlanDay.day} Study Plan
                        </span>
                      )}

                      {todo.flashcardDeck && (
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          🃏 {todo.flashcardDeck.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!isDone && (
                    <button
                      onClick={() => handleStartFocus(todo.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-500 hover:text-white transition"
                      title="Bắt đầu học trong Focus Room"
                    >
                      <Play size={14} /> Focus
                    </button>
                  )}

                  <button
                    onClick={() => { setEditingTodo(todo); setModalOpen(true); }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    title="Chỉnh sửa"
                  >
                    <Edit2 size={15} />
                  </button>

                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                    title="Xóa nhiệm vụ"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <TodoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        todo={editingTodo}
        onSuccess={loadData}
      />
    </div>
  );
}

