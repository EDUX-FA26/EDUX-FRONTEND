import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Check, X, Plus, ChevronDown, ChevronRight, Sparkles,
  BookmarkCheck
} from 'lucide-react';
import TodoService from '../../services/todo.service';

/** Icon 6 chấm kéo thả (Grip dots: cố định kích thước 8px x 12px không bao giờ bị phóng to) */
function GripDotsIcon({ className = 'text-white/35' }) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="currentColor"
      className={className}
      style={{
        width: '8px',
        height: '12px',
        minWidth: '8px',
        maxWidth: '8px',
        minHeight: '12px',
        maxHeight: '12px',
        flexShrink: 0,
        display: 'inline-block',
      }}
    >
      <circle cx="2" cy="2" r="1.1" />
      <circle cx="6" cy="2" r="1.1" />
      <circle cx="2" cy="6" r="1.1" />
      <circle cx="6" cy="6" r="1.1" />
      <circle cx="2" cy="10" r="1.1" />
      <circle cx="6" cy="10" r="1.1" />
    </svg>
  );
}

/** Nhánh nối hình chữ L trong cây phân cấp Tree View (└) */
function TreeBranchLIcon({ className = 'text-white/35' }) {
  return (
    <svg
      width="12"
      height="16"
      viewBox="0 0 12 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      style={{
        width: '12px',
        height: '16px',
        minWidth: '12px',
        maxWidth: '12px',
        minHeight: '16px',
        maxHeight: '16px',
        flexShrink: 0,
        display: 'inline-block',
      }}
    >
      <path d="M3 0v9h7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Tách nhóm/cha từ description: [group:Tên Nhóm] Nội dung */
function parseTodoItem(item) {
  let group = null;
  let cleanDesc = item.description || '';
  const match = cleanDesc.match(/^\[group:(.+?)\]\s*/);
  if (match) {
    group = match[1];
    cleanDesc = cleanDesc.replace(/^\[group:(.+?)\]\s*/, '');
  } else if (item.sourceType === 'STUDY_PLANNER') {
    group = 'Study Planner';
  }
  return {
    ...item,
    group,
    cleanDesc,
  };
}

// Bộ nhiệm vụ mẫu chuẩn theo ảnh chụp người dùng gửi
const SAMPLE_STUDY_TASKS = [
  { id: 'sample-1', title: 'Say Hi', status: 'COMPLETED', group: null, priority: 'MEDIUM' },
  { id: 'sample-2', title: 'Timer', status: 'COMPLETED', group: 'Study Mode', priority: 'MEDIUM' },
  { id: 'sample-3', title: 'To-Do-List', status: 'TODO', group: 'Study Mode', priority: 'MEDIUM' },
  { id: 'sample-4', title: 'Atmosphere', status: 'TODO', group: 'Study Mode', priority: 'MEDIUM' },
  { id: 'sample-5', title: 'Playlist', status: 'TODO', group: 'Study Mode', priority: 'MEDIUM' },
  { id: 'sample-6', title: 'Journal', status: 'TODO', group: 'Study Mode', priority: 'MEDIUM' },
];

export default function FocusTodoListWidget({
  activeTodoId,
  onSelectTodo,
  onSessionTodoChange,
}) {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showPresets, setShowPresets] = useState(false);

  // Danh sách các nhóm tuỳ chỉnh
  const [extraGroups, setExtraGroups] = useState(() => {
    try {
      const stored = localStorage.getItem('focus_room_extra_groups');
      return stored ? JSON.parse(stored) : ['Study Mode'];
    } catch {
      return ['Study Mode'];
    }
  });

  // State thêm nhiệm vụ con / nhiệm vụ mới
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskGroup, setNewTaskGroup] = useState('');

  // State thêm nhóm mới
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Presets & Gợi ý từ Study Planner 7 ngày
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [customPresets, setCustomPresets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('focus_todo_presets') || '[]');
    } catch {
      return [];
    }
  });

  // Tải danh sách todo từ backend (có fallback local storage)
  const loadTodos = useCallback(async () => {
    try {
      const res = await TodoService.list({ limit: 100 });
      const items = res.data?.items || [];
      if (items.length === 0) {
        const saved = localStorage.getItem('focus_room_local_todos');
        if (saved) {
          setTodos(JSON.parse(saved).map(parseTodoItem));
        } else {
          // Mặc định nạp bộ mẫu chuẩn ảnh nếu danh sách hoàn toàn trống
          setTodos(SAMPLE_STUDY_TASKS.map(parseTodoItem));
          localStorage.setItem('focus_room_local_todos', JSON.stringify(SAMPLE_STUDY_TASKS));
        }
      } else {
        setTodos(items.map(parseTodoItem));
      }
    } catch (err) {
      console.warn('Backend Todo list không khả dụng, dùng dữ liệu lưu trữ nội bộ:', err);
      const saved = localStorage.getItem('focus_room_local_todos');
      if (saved) {
        setTodos(JSON.parse(saved).map(parseTodoItem));
      } else {
        setTodos(SAMPLE_STUDY_TASKS.map(parseTodoItem));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Đồng bộ lưu trữ offline mỗi khi todos thay đổi
  const syncLocalTodos = (newTodos) => {
    try {
      localStorage.setItem('focus_room_local_todos', JSON.stringify(newTodos));
    } catch { }
  };

  // Tải gợi ý Study Planner khi mở Presets
  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const res = await TodoService.getStudyPlanSuggestions();
      setSuggestions(res.data || []);
    } catch (err) {
      console.error('Lỗi tải gợi ý Study Plan:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (showPresets) {
      loadSuggestions();
    }
  }, [showPresets, loadSuggestions]);

  // Phân loại Todos theo Cây Phân Cấp (Hierarchical Nested Groups & Tasks)
  const { standaloneTasks, groupedTasks, totalCount, completedCount } = useMemo(() => {
    const standalone = [];
    const groupsMap = {};

    extraGroups.forEach((g) => {
      groupsMap[g] = [];
    });

    let completed = 0;
    todos.forEach((t) => {
      if (t.status === 'COMPLETED') completed++;
      if (t.group) {
        if (!groupsMap[t.group]) groupsMap[t.group] = [];
        groupsMap[t.group].push(t);
      } else {
        standalone.push(t);
      }
    });

    return {
      standaloneTasks: standalone,
      groupedTasks: groupsMap,
      totalCount: todos.length,
      completedCount: completed,
    };
  }, [todos, extraGroups]);

  // Đổi trạng thái Todo (TODO <-> COMPLETED)
  const handleToggleStatus = async (task, e) => {
    e?.stopPropagation();
    const nextStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    const updated = todos.map((t) =>
      t.id === task.id
        ? { ...t, status: nextStatus, completedAt: nextStatus === 'COMPLETED' ? new Date().toISOString() : null }
        : t
    );
    setTodos(updated);
    syncLocalTodos(updated);

    try {
      await TodoService.changeStatus(task.id, nextStatus);
    } catch (err) {
      console.warn('Change status offline:', err.message);
    }
  };

  // Xoá Todo
  const handleDeleteTask = async (taskId, e) => {
    e?.stopPropagation();
    const updated = todos.filter((t) => t.id !== taskId);
    setTodos(updated);
    syncLocalTodos(updated);
    if (activeTodoId === taskId && onSessionTodoChange) {
      onSessionTodoChange(null);
    }

    try {
      await TodoService.remove(taskId);
    } catch (err) {
      console.warn('Remove todo offline:', err.message);
    }
  };

  // Xoá Group
  const handleDeleteGroup = async (groupName, e) => {
    e?.stopPropagation();
    const nextGroups = extraGroups.filter((g) => g !== groupName);
    setExtraGroups(nextGroups);
    localStorage.setItem('focus_room_extra_groups', JSON.stringify(nextGroups));

    const updated = todos.filter((t) => t.group !== groupName);
    setTodos(updated);
    syncLocalTodos(updated);

    const tasksToDelete = todos.filter((t) => t.group === groupName);
    for (const t of tasksToDelete) {
      try {
        await TodoService.remove(t.id);
      } catch { }
    }
  };

  // Tạo Task mới
  const handleCreateTask = async (e) => {
    e?.preventDefault();
    if (!newTaskTitle.trim()) {
      setIsAddingTask(false);
      return;
    }

    const title = newTaskTitle.trim();
    const group = newTaskGroup.trim();
    const description = group ? `[group:${group}]` : undefined;

    const tempId = 'task-' + Date.now();
    const newTask = {
      id: tempId,
      title,
      description: description || '',
      group: group || null,
      status: 'TODO',
      priority: 'MEDIUM',
    };

    const nextTodos = [...todos, newTask];
    setTodos(nextTodos);
    syncLocalTodos(nextTodos);

    if (group) {
      setCollapsedGroups((prev) => ({ ...prev, [group]: false }));
      if (!extraGroups.includes(group)) {
        const nextG = [...extraGroups, group];
        setExtraGroups(nextG);
        localStorage.setItem('focus_room_extra_groups', JSON.stringify(nextG));
      }
    }
    setNewTaskTitle('');
    setNewTaskGroup('');
    setIsAddingTask(false);

    try {
      const res = await TodoService.create({
        title,
        description,
        priority: 'MEDIUM',
      });
      if (res.data?.id) {
        setTodos((prev) =>
          prev.map((t) => (t.id === tempId ? parseTodoItem(res.data) : t))
        );
      }
    } catch (err) {
      console.warn('Tạo Todo offline:', err.response?.data || err.message);
    }
  };

  // Tạo Group mới
  const handleCreateGroup = (e) => {
    e?.preventDefault();
    if (!newGroupName.trim()) {
      setIsAddingGroup(false);
      return;
    }
    const groupName = newGroupName.trim();
    if (!extraGroups.includes(groupName)) {
      const nextGroups = [...extraGroups, groupName];
      setExtraGroups(nextGroups);
      localStorage.setItem('focus_room_extra_groups', JSON.stringify(nextGroups));
    }
    setNewTaskGroup(groupName);
    setIsAddingGroup(false);
    setIsAddingTask(true);
    setNewGroupName('');
  };

  // Nạp bộ mẫu chuẩn theo ảnh (1 chạm)
  const handleLoadSample = () => {
    setTodos(SAMPLE_STUDY_TASKS.map(parseTodoItem));
    syncLocalTodos(SAMPLE_STUDY_TASKS);
    setExtraGroups(['Study Mode']);
    localStorage.setItem('focus_room_extra_groups', JSON.stringify(['Study Mode']));
    setShowPresets(false);
  };

  // Thêm gợi ý từ Study Planner 7 ngày
  const handleAddFromPlan = async (planDayId) => {
    try {
      await TodoService.createFromStudyPlan(planDayId);
      await loadTodos();
      await loadSuggestions();
    } catch (err) {
      console.error('Lỗi thêm gợi ý Study Plan vào Todo:', err);
    }
  };

  // Lưu To-Do-List hiện tại thành Preset
  const handleSaveAsPreset = () => {
    const name = window.prompt('Nhập tên cho Preset này:', 'Study Session Preset');
    if (!name || !name.trim()) return;

    const presetTasks = todos.map((t) => ({
      title: t.title,
      group: t.group || null,
      priority: t.priority,
    }));

    const nextPresets = [...customPresets, { id: Date.now(), name: name.trim(), tasks: presetTasks }];
    setCustomPresets(nextPresets);
    localStorage.setItem('focus_todo_presets', JSON.stringify(nextPresets));
    alert(`Đã lưu preset "${name.trim()}" thành công!`);
  };

  // Áp dụng Preset
  const handleApplyPreset = async (preset) => {
    if (!preset.tasks || preset.tasks.length === 0) return;
    try {
      for (const t of preset.tasks) {
        const description = t.group ? `[group:${t.group}]` : undefined;
        await TodoService.create({
          title: t.title,
          description,
          priority: t.priority || 'MEDIUM',
        });
      }
      await loadTodos();
      setShowPresets(false);
    } catch (err) {
      console.error('Lỗi áp dụng Preset:', err.response?.data || err.message);
    }
  };

  const toggleGroupCollapse = (groupName) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  return (
    <div className="relative">
      {/* ── BẢNG TO-DO-LIST (Hierarchical Tree View chuẩn 100% theo ảnh) ── */}
      <div
        className="
          w-[320px] sm:w-[350px]
          rounded-2xl
          bg-[#181226]/85 backdrop-blur-2xl
          border border-white/10
          text-white
          shadow-2xl
          select-none
          overflow-hidden
          transition-all
        "
        style={{
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
          padding: '16px 20px',
        }}
      >
        {/* Header: To-Do-List (completed/total) + Presets button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-base font-semibold text-white tracking-wide">To-Do-List</span>
            <span className="text-xs text-white/50 tabular-nums">
              ({completedCount}/{totalCount})
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowPresets((prev) => !prev)}
            className={`
              rounded-full px-4 py-0.5 text-xs font-normal border transition-all active:scale-95
              ${showPresets
                ? 'bg-white text-[#181226] border-white shadow-sm'
                : 'border-white/35 text-white/80 hover:text-white hover:border-white/70 bg-transparent hover:bg-white/10'
              }
            `}
          >
            Presets
          </button>
        </div>

        {/* Divider thanh mảnh dưới Header */}
        <div className="w-full h-[1px] bg-white/15 mt-3 mb-2" />

        {/* Danh sách nhiệm vụ lồng nhau (Hierarchical Tree View List) */}
        <div
          className="max-h-[340px] overflow-y-auto space-y-1 pr-1 font-sans"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.15) transparent',
          }}
        >
          {loading ? (
            <div className="py-6 text-center text-xs text-white/40">Đang tải danh sách...</div>
          ) : todos.length === 0 && Object.keys(groupedTasks).length === 0 ? (
            <div className="py-7 text-center text-xs text-white/40 italic">
              Chưa có nhiệm vụ nào.<br />
            </div>
          ) : (
            <>
              {/* 1. Nhiệm vụ độc lập cấp cao nhất (ví dụ: Say Hi) */}
              {standaloneTasks.map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                const isLinked = activeTodoId === task.id;

                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTodo && onSelectTodo(task.id)}
                    className={`
                      group relative flex items-center justify-between gap-2 py-1.5 px-1 rounded-lg
                      transition-colors cursor-pointer
                      ${isLinked ? 'bg-white/10' : 'hover:bg-white/5'}
                    `}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Grip icon 6 chấm (cố định kích thước nhỏ gọn 8x12px) */}
                      <GripDotsIcon />

                      {/* Checkbox vuông bo tròn viền trắng */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(task, e)}
                        style={{
                          width: '16px',
                          height: '16px',
                          minWidth: '16px',
                          minHeight: '16px',
                          flexShrink: 0,
                        }}
                        className={`
                          rounded flex items-center justify-center transition-all cursor-pointer
                          ${isCompleted
                            ? 'bg-[#2dd4bf] border border-[#2dd4bf] shadow-sm text-[#181226]'
                            : 'border-[1.5px] border-white/50 bg-transparent hover:border-white'
                          }
                        `}
                      >
                        {isCompleted && <Check size={11} strokeWidth={3} />}
                      </button>

                      {/* Title: Say Hi */}
                      <span
                        className={`
                          text-sm truncate select-none leading-none
                          ${isCompleted
                            ? 'line-through text-[#2dd4bf]'
                            : 'text-white/90 group-hover:text-white'
                          }
                        `}
                        title={task.title}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Nút xoá ✕ */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      title="Xoá nhiệm vụ"
                      className="text-white/25 hover:text-white transition p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}

              {/* 2. Nhóm nhiệm vụ cấp cha & Các nhiệm vụ con phân nhánh (Tree View) */}
              {Object.entries(groupedTasks).map(([groupName, groupItems]) => {
                const isCollapsed = collapsedGroups[groupName];
                const groupCompleted = groupItems.filter((t) => t.status === 'COMPLETED').length;

                return (
                  <div key={groupName} className="pt-0.5">
                    {/* Header Nhóm (ví dụ: Study Mode (1/5) ✕) */}
                    <div
                      onClick={() => toggleGroupCollapse(groupName)}
                      className="group flex items-center justify-between gap-2 py-1.5 px-1 rounded-lg hover:bg-white/5 cursor-pointer text-white/90"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {/* Grip icon 6 chấm */}
                        <GripDotsIcon />

                        {/* Mũi tên thu gọn / mở rộng */}
                        <span className="shrink-0 text-white/60">
                          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                        </span>

                        {/* Tên nhóm: Study Mode */}
                        <span className="text-sm font-semibold text-white truncate">
                          {groupName}
                        </span>
                      </div>

                      {/* Phía bên phải: (1/5) và nút xoá ✕ */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/45 font-mono tabular-nums">
                          ({groupCompleted}/{groupItems.length})
                        </span>

                        <div className="flex items-center gap-1">
                          {/* Nút thêm nhánh con vào nhóm */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewTaskGroup(groupName);
                              setIsAddingTask(true);
                            }}
                            title={`Thêm nhánh con vào ${groupName}`}
                            className="opacity-60 hover:opacity-100 text-white/50 hover:text-white p-0.5 transition"
                          >
                            <Plus size={13} />
                          </button>

                          {/* Nút xoá nhóm ✕ */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteGroup(groupName, e)}
                            title={`Xoá nhóm ${groupName}`}
                            className="text-white/25 hover:text-white transition p-0.5"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Danh sách nhiệm vụ con phân nhánh (Nested Tasks với L-Branch └) */}
                    {!isCollapsed && (
                      <div className="space-y-0.5 mt-0.5">
                        {groupItems.length === 0 ? (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewTaskGroup(groupName);
                              setIsAddingTask(true);
                            }}
                            className="pl-5 py-1 text-xs text-white/35 italic hover:text-white/60 cursor-pointer flex items-center gap-1"
                          >
                            <TreeBranchLIcon />
                            <span>+ Thêm nhiệm vụ vào {groupName}...</span>
                          </div>
                        ) : (
                          groupItems.map((task) => {
                            const isCompleted = task.status === 'COMPLETED';
                            const isLinked = activeTodoId === task.id;

                            return (
                              <div
                                key={task.id}
                                onClick={() => onSelectTodo && onSelectTodo(task.id)}
                                className={`
                                  group relative flex items-center justify-between gap-2 py-1 pl-4 pr-1 rounded-lg
                                  transition-colors cursor-pointer
                                  ${isLinked ? 'bg-white/10' : 'hover:bg-white/5'}
                                `}
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  {/* Đường nhánh cây hình chữ L (Tree Branch └) */}
                                  <TreeBranchLIcon />

                                  {/* Grip icon 6 chấm */}
                                  <GripDotsIcon />

                                  {/* Checkbox vuông bo viền */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleStatus(task, e)}
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      minWidth: '16px',
                                      minHeight: '16px',
                                      flexShrink: 0,
                                    }}
                                    className={`
                                      rounded flex items-center justify-center transition-all cursor-pointer
                                      ${isCompleted
                                        ? 'bg-[#2dd4bf] border border-[#2dd4bf] shadow-sm text-[#181226]'
                                        : 'border-[1.5px] border-white/50 bg-transparent hover:border-white'
                                      }
                                    `}
                                  >
                                    {isCompleted && (
                                      <Check size={11} strokeWidth={3} />
                                    )}
                                  </button>

                                  {/* Tiêu đề nhiệm vụ con: Timer, To-Do-List, Atmosphere... */}
                                  <span
                                    className={`
                                      text-sm truncate select-none leading-none
                                      ${isCompleted
                                        ? 'line-through text-[#2dd4bf]'
                                        : 'text-white/90 group-hover:text-white'
                                      }
                                    `}
                                    title={task.title}
                                  >
                                    {task.title}
                                  </span>
                                </div>

                                {/* Nút xoá ✕ */}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteTask(task.id, e)}
                                  title="Xoá nhiệm vụ"
                                  className="text-white/25 hover:text-white transition p-0.5"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            );
                          })
                        )}

                        {/* Inline input thêm nhiệm vụ con vào nhóm */}
                        {isAddingTask && newTaskGroup === groupName && (
                          <form onSubmit={handleCreateTask} className="pl-4 pr-1 py-1 flex items-center gap-1.5 animate-fade-in">
                            <TreeBranchLIcon />
                            <GripDotsIcon />
                            <div
                              style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px' }}
                              className="rounded border border-dashed border-white/40 shrink-0"
                            />
                            <input
                              type="text"
                              autoFocus
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              placeholder={`Thêm vào ${groupName}... (Enter)`}
                              className="flex-1 bg-black/40 border border-teal-400/60 rounded px-2 py-0.5 text-xs text-white placeholder-white/40 outline-none"
                            />
                            <button type="submit" className="text-xs text-teal-300 font-bold hover:text-white px-1">Lưu</button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingTask(false);
                                setNewTaskTitle('');
                                setNewTaskGroup('');
                              }}
                              className="text-white/40 hover:text-white"
                            >
                              <X size={13} />
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* Form thêm nhiệm vụ độc lập ở cấp ngoài cùng */}
          {isAddingTask && !newTaskGroup && (
            <form onSubmit={handleCreateTask} className="mt-2 pt-1 flex items-center gap-1.5 px-1 animate-fade-in">
              <GripDotsIcon />
              <div
                style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px' }}
                className="rounded border border-dashed border-white/40 shrink-0"
              />
              <input
                type="text"
                autoFocus
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Tên nhiệm vụ mới... (Enter)"
                className="flex-1 bg-black/40 border border-teal-400/60 rounded px-2 py-1 text-xs text-white placeholder-white/40 outline-none"
              />
              <button
                type="submit"
                className="bg-teal-500 hover:bg-teal-400 text-[#181226] px-2 py-1 rounded text-xs font-bold transition"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskTitle('');
                }}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            </form>
          )}

          {/* Form thêm nhóm cha mới */}
          {isAddingGroup && (
            <form onSubmit={handleCreateGroup} className="mt-2 pt-1 flex items-center gap-1.5 px-1 animate-fade-in">
              <input
                type="text"
                autoFocus
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Tên nhóm mới (vd: Study Mode)..."
                className="flex-1 bg-black/40 border border-purple-400/60 rounded px-2 py-1 text-xs text-white placeholder-white/40 outline-none"
              />
              <button
                type="submit"
                className="bg-purple-500 hover:bg-purple-400 text-white px-2 py-1 rounded text-xs font-bold transition"
              >
                Tạo
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingGroup(false);
                  setNewGroupName('');
                }}
                className="text-white/50 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            </form>
          )}
        </div>

        {/* Divider thanh ngang hai bên có dấu bằng ở giữa: ── = ── */}
        <div className="flex items-center gap-2 my-2.5 text-white/25">
          <div className="flex-1 h-[1px] bg-white/15" />
          <span className="text-[11px] font-mono select-none px-1 text-white/35 leading-none">
            =
          </span>
          <div className="flex-1 h-[1px] bg-white/15" />
        </div>

        {/* Bottom Actions: + New Task và + New Group */}
        <div className="flex items-center justify-between text-xs text-white/50 pt-0.5 px-0.5">
          <button
            type="button"
            onClick={() => {
              setNewTaskGroup('');
              setIsAddingTask(true);
              setIsAddingGroup(false);
            }}
            className="flex items-center gap-1.5 hover:text-white transition py-0.5 px-1 rounded hover:bg-white/5 select-none"
          >
            <Plus size={13} />
            <span>New Task</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsAddingGroup(true);
              setIsAddingTask(false);
            }}
            className="flex items-center gap-1.5 hover:text-white transition py-0.5 px-1 rounded hover:bg-white/5 select-none"
          >
            <Plus size={13} />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* ── BẢNG PRESETS VINTAGE PAPER NOTE (Mở ra bên trái To-Do-List) ── */}
      {showPresets && (
        <div
          className="
            absolute right-[335px] sm:right-[365px] top-0 z-50
            w-[320px] sm:w-[350px]
            rounded-3xl
            border border-[#decaba]
            bg-[#faf5eb]
            text-[#45362e]
            shadow-2xl
            animate-fade-in
            select-none
            overflow-hidden
          "
          style={{
            padding: '24px 24px 20px 24px',
            boxShadow: '0 24px 48px -12px rgba(20,10,5,.4), 0 4px 12px rgba(0,0,0,.1)',
            maxHeight: 'calc(100vh - 120px)',
          }}
        >
          {/* Góc gấp giấy (vintage dog-ear folds) */}
          <div
            className="pointer-events-none absolute top-0 right-0 h-4 w-4 rounded-bl-md border-l border-b border-[#decaba] bg-[#ede0d0] shadow-sm"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 rounded-tr-md border-r border-t border-[#decaba] bg-[#ede0d0] shadow-sm"
            aria-hidden="true"
          />

          {/* Header Title: Presets */}
          <div className="text-center mb-3">
            <h3 className="text-lg font-bold text-[#45362e] tracking-tight">Presets</h3>
            <div className="w-full h-[1px] bg-[#decaba] mt-2" />
          </div>

          <div
            className="overflow-y-auto pr-1 space-y-3"
            style={{
              maxHeight: 'calc(100vh - 250px)',
              scrollbarWidth: 'thin',
              scrollbarColor: '#d7c4b1 transparent',
            }}
          >
            {/* Action: + Save To-Do-List as Preset */}
            <button
              type="button"
              onClick={handleSaveAsPreset}
              className="w-full flex items-center justify-start gap-2 text-xs font-semibold text-[#765b49] hover:text-[#45362e] py-1.5 px-2 rounded-lg hover:bg-[#ede0d0]/60 transition"
            >
              <Plus size={15} />
              <span>Save To-Do-List as Preset</span>
            </button>            

            {/* Custom Presets đã lưu */}
            {customPresets.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#967d6c]">
                  Bộ Preset của bạn
                </span>
                <div className="space-y-1">
                  {customPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#f2e7d8]/60 hover:bg-[#ede0d0] border border-[#e4d3c2] text-xs transition"
                    >
                      <span className="font-semibold text-[#45362e]">{preset.name}</span>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        Áp dụng
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PHẦN GỢI Ý ÔN TẬP TỪ STUDY PLANNER 7 NGÀY */}
            <div className="pt-2 border-t border-[#decaba]/80">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles size={14} className="text-orange-500 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#765b49]">
                  Gợi ý ôn tập từ Study Planner 7 ngày
                </span>
              </div>

              {loadingSuggestions ? (
                <div className="py-4 text-center text-xs text-[#8c7463]">
                  Đang tải gợi ý từ Study Plan...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="py-4 px-3 text-center text-xs text-[#8c7463] bg-[#ede0d0]/40 rounded-xl border border-[#decaba] leading-relaxed">
                  Chưa có gợi ý từ Study Plan 7 ngày. Bạn có thể vào mục <b>Study Planner</b> để tạo lộ trình học tập!
                </div>
              ) : (
                <div className="space-y-2">
                  {suggestions.map((item) => {
                    const alreadyAdded = Boolean(item.todoId);

                    return (
                      <div
                        key={item.planDayId}
                        className="p-2.5 rounded-xl bg-[#f3e9db] hover:bg-[#ede0d0] border border-[#e4d3c2] transition shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-[#ebded0] text-[#5c4636]">
                            Ngày {item.day}
                          </span>
                          <span className="text-[11px] text-[#765b49]">
                            {item.durationMinutes || 25} phút
                          </span>
                        </div>

                        <p className="text-xs font-bold text-[#45362e] truncate">
                          {item.subject?.code ? `[${item.subject.code}] ` : ''}
                          {item.subject?.name || 'Môn học'}
                        </p>
                        <p className="text-[11px] text-[#765b49] truncate mt-0.5">
                          {item.topic?.name || item.reason || 'Kế hoạch ôn tập trọng tâm'}
                        </p>

                        <div className="mt-2 flex items-center justify-between pt-1 border-t border-[#decaba]/60">
                          <span className="text-[10px] text-[#967d6c]">
                            {item.activity === 'review'
                              ? 'Ôn tập lý thuyết'
                              : item.activity === 'practice'
                                ? 'Luyện tập giải đề'
                                : 'Khảo sát năng lực'}
                          </span>

                          {alreadyAdded ? (
                            <span className="text-[11px] font-bold text-teal-700 flex items-center gap-1">
                              <BookmarkCheck size={13} />
                              Đã có trong To-Do
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddFromPlan(item.planDayId)}
                              className="text-[11px] font-bold bg-[#eb5e34] hover:bg-[#d9532b] text-white px-2.5 py-0.5 rounded-lg shadow-xs transition active:scale-95"
                            >
                              + Thêm vào To-Do
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Nút Close tròn màu cam ở đáy */}
          <div className="pt-3.5 mt-2 flex justify-center border-t border-[#decaba]">
            <button
              type="button"
              onClick={() => setShowPresets(false)}
              className="
                px-9 py-2 rounded-full
                bg-[#eb5e34] hover:bg-[#d9532b]
                text-white text-xs font-bold tracking-wide
                shadow-md transition active:scale-95
              "
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
