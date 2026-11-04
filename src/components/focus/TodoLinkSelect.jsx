import React, { useCallback, useEffect, useState } from 'react';
import TodoService from '../../services/todo.service';
import { formatShortDate } from '../../helper/focusFormat';

/**
 * Chọn nhiệm vụ để gắn vào phiên học: Todo đang mở + gợi ý từ Study Plan.
 * Chọn gợi ý Study Plan → tạo Todo tham chiếu planDayId (idempotent) rồi gắn vào.
 */
export default function TodoLinkSelect({ value, onChange, disabled, className = '' }) {
  const [todos, setTodos] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [todoRes, planRes] = await Promise.all([
        TodoService.list({ status: 'TODO,IN_PROGRESS', limit: 50 }),
        TodoService.getStudyPlanSuggestions().catch(() => ({ data: [] })),
      ]);
      setTodos(todoRes.data.items);
      setSuggestions(planRes.data.filter((s) => !s.todoId));
      setError(null);
    } catch {
      setError('Không tải được danh sách nhiệm vụ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, value]);

  const handleChange = async (e) => {
    const raw = e.target.value;

    if (!raw) return onChange(null);

    if (raw.startsWith('todo:')) return onChange(raw.slice(5));

    if (raw.startsWith('plan:')) {
      setWorking(true);
      try {
        const res = await TodoService.createFromStudyPlan(raw.slice(5));
        await load();
        onChange(res.data.todo.id);
      } catch {
        setError('Không thể tạo nhiệm vụ từ Study Plan.');
      } finally {
        setWorking(false);
      }
    }
    return undefined;
  };

  // Todo đang gắn có thể đã hoàn thành/không nằm trong danh sách mở → vẫn hiển thị được
  const known = todos.some((t) => t.id === value);

  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-white/70" htmlFor="focus-todo-select">
        Đang làm nhiệm vụ
      </label>
      <select
        id="focus-todo-select"
        value={value ? `todo:${value}` : ''}
        onChange={handleChange}
        disabled={disabled || loading || working}
        className="w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-orange-400 disabled:opacity-60"
      >
        <option value="">— Không gắn nhiệm vụ —</option>

        {value && !known && <option value={`todo:${value}`}>Nhiệm vụ đã chọn</option>}

        {todos.length > 0 && (
          <optgroup label="Nhiệm vụ của tôi">
            {todos.map((t) => (
              <option key={t.id} value={`todo:${t.id}`}>
                {t.priority === 'HIGH' ? '🔥 ' : ''}
                {t.title}
                {t.dueDate ? ` (hạn ${formatShortDate(t.dueDate)})` : ''}
              </option>
            ))}
          </optgroup>
        )}

        {suggestions.length > 0 && (
          <optgroup label="Gợi ý từ Study Plan">
            {suggestions.map((s) => (
              <option key={s.planDayId} value={`plan:${s.planDayId}`}>
                Ngày {s.day} • {s.topic.name} ({formatShortDate(s.studyDate)})
              </option>
            ))}
          </optgroup>
        )}
      </select>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}

