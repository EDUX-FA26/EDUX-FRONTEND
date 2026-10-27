import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, AlertCircle } from 'lucide-react';
import TodoService from '../../services/todo.service';
import ClassService from '../../services/class.service';
import FlashcardService from '../../services/flashcard.service';

export default function TodoModal({ isOpen, onClose, todo = null, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('TODO');
  const [dueDate, setDueDate] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [flashcardDeckId, setFlashcardDeckId] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (todo) {
        setTitle(todo.title || '');
        setDescription(todo.description || '');
        setPriority(todo.priority || 'MEDIUM');
        setStatus(todo.status || 'TODO');
        setDueDate(todo.dueDate ? todo.dueDate.slice(0, 10) : '');
        setSubjectId(todo.subject?.id || '');
        setFlashcardDeckId(todo.flashcardDeck?.id || '');
      } else {
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setStatus('TODO');
        setDueDate('');
        setSubjectId('');
        setFlashcardDeckId('');
      }
      setError(null);

      // Load subjects
      ClassService.getMyClasses().then((res) => {
        const classes = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const map = new Map();
        classes.forEach((c) => {
          if (c.subject_id && !map.has(c.subject_id)) {
            map.set(c.subject_id, { id: c.subject_id, name: c.subject_name || 'Môn học' });
          }
        });
        setSubjects([...map.values()]);
      }).catch(() => {});

      // Load flashcard decks
      FlashcardService.getDecks({ limit: 50 }).then((res) => {
        setDecks(res.data || []);
      }).catch(() => {});
    }
  }, [isOpen, todo]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Tiêu đề không được để trống');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      dueDate: dueDate || null,
      subjectId: subjectId || null,
      flashcardDeckId: flashcardDeckId || null,
    };

    try {
      if (todo) {
        await TodoService.update(todo.id, payload);
      } else {
        await TodoService.create(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg === 'DUPLICATE_TODO') {
        setError('Nhiệm vụ cùng tên đang mở đã tồn tại.');
      } else {
        setError(msg || 'Không thể lưu nhiệm vụ, vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-orange-50/50">
          <h2 className="text-lg font-bold text-gray-800">
            {todo ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={200}
              placeholder="VD: Ôn tập chương 3 Đạo hàm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              placeholder="Ghi chú thêm về mục tiêu, tài liệu cần đọc..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-orange-500"
              >
                <option value="LOW">Thấp (LOW)</option>
                <option value="MEDIUM">Trung bình (MEDIUM)</option>
                <option value="HIGH">Cao (HIGH) 🔥</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold outline-none focus:border-orange-500"
              >
                <option value="TODO">Cần làm (TODO)</option>
                <option value="IN_PROGRESS">Đang làm (IN_PROGRESS)</option>
                <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Hạn hoàn thành
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
            />
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 block">
              Liên kết học tập (Tuỳ chọn)
            </span>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Môn học</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
              >
                <option value="">— Không liên kết —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Bộ Flashcard</label>
              <select
                value={flashcardDeckId}
                onChange={(e) => setFlashcardDeckId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
              >
                <option value="">— Không liên kết —</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:bg-orange-600 transition disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : (todo ? 'Lưu thay đổi' : 'Tạo nhiệm vụ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

