import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import FlashcardService from '../../services/flashcard.service';
import ClassService from '../../services/class.service';
import TopicService from '../../services/topic.service';
import MathText from '../../components/common/MathText';
import LatexToolbar from '../../components/common/LatexToolbar';
import {
  Plus, Pencil, Trash2, Globe, Lock, Layers, BookOpen,
  BarChart2, ChevronDown, ChevronUp, X, Save, Eye,
  CheckCircle, RefreshCw, Zap, AlertTriangle, ArrowLeft,
  Users, Share2, FileSpreadsheet, Upload, Download, AlertCircle,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIFF_META = {
  easy:   { label: 'Dễ',         color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
  medium: { label: 'Trung bình', color: '#ca8a04', bg: 'rgba(202,138,4,0.1)' },
  hard:   { label: 'Khó',        color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
};

function Badge({ children, color = 'var(--color-ink-muted)', bg = 'var(--color-primary-bg)' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '0.6875rem', fontWeight: 700,
      padding: '3px 10px', borderRadius: '9999px',
      background: bg, color,
    }}>
      {children}
    </span>
  );
}

function IconBtn({ onClick, title, danger, disabled, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px', borderRadius: '8px', border: '1px solid',
        cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
        opacity: disabled ? 0.5 : 1,
        borderColor: hov ? (danger ? '#fca5a5' : 'var(--color-primary)') : 'var(--color-border)',
        background: hov ? (danger ? 'rgba(220,38,38,0.08)' : 'var(--color-primary-card)') : 'var(--color-surface)',
        color: hov ? (danger ? '#dc2626' : 'var(--color-primary-dark)') : 'var(--color-ink-muted)',
      }}
    >
      {children}
    </button>
  );
}

// ─── Modal backdrop ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children, width = '560px', padding = '16px 20px', zIndex = 200 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
    }}>
      <div className="animate-fade-in" style={{
        background: 'var(--color-surface)', borderRadius: '20px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: width,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px', borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-primary-bg)', flexShrink: 0,
        }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────

function Field({ label, required, children, style }) {
  return (
    <div style={{ marginBottom: '10px', ...style }}>
      <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-ink-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '9px 12px', borderRadius: '10px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-ink)', fontSize: '0.875rem',
  fontFamily: 'var(--font-sans)', outline: 'none',
  transition: 'border-color 0.15s',
};

// ─── Deck Form Modal ──────────────────────────────────────────────────────────

function DeckFormModal({ deck, onClose, onSaved, classInfo }) {
  const isEdit = !!deck;
  // Nếu có classInfo (chọn lớp rồi), tự động dùng subject_id của lớp
  const autoSubjectId = classInfo?.subject_id || '';
  const [form, setForm] = useState({
    title: deck?.title || '',
    description: deck?.description || '',
    subject_id: deck?.subject_id || autoSubjectId,
    is_public: deck?.is_public ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Tiêu đề không được để trống'); return; }
    if (!isEdit && !form.subject_id.trim()) { setError('Không tìm thấy môn học của lớp này'); return; }
    setSaving(true); setError(null);
    try {
      if (isEdit) {
        await FlashcardService.updateDeck(deck.id, { title: form.title, description: form.description });
      } else {
        await FlashcardService.createDeck({
          title: form.title,
          description: form.description,
          subject_id: form.subject_id,
          class_id: classInfo?.id || undefined,
          is_public: form.is_public,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? '✏️ Sửa bộ thẻ' : '➕ Tạo bộ thẻ mới'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {/* Thông tin lớp (read-only khi tạo mới) */}
        {!isEdit && classInfo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', borderRadius: '10px', marginBottom: '16px',
            background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)',
          }}>
            <Layers style={{ width: '16px', height: '16px', color: 'var(--color-primary)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>
                {classInfo.class_name || classInfo.class_code}
              </p>
              <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', margin: '2px 0 0' }}>
                {classInfo.subject_name} · {classInfo.class_code}
              </p>
            </div>
          </div>
        )}

        <Field label="Tiêu đề" required>
          <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="VD: Ôn tập PRN231 – Chương 1" />
        </Field>

        <Field label="Mô tả">
          <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả ngắn về nội dung bộ thẻ..." />
        </Field>

        {/* Chỉ hiển thị input Subject ID nếu KHÔNG có classInfo (trường hợp fallback) */}
        {!isEdit && !classInfo && (
          <Field label="Subject ID (UUID)" required>
            <input style={inputStyle} value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
              UUID của môn học trong hệ thống.
            </p>
          </Field>
        )}

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: '0.8125rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: '9px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Hủy
          </button>
          <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '9px', background: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-sans)' }}>
            <Save style={{ width: '14px', height: '14px' }} />
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo bộ thẻ'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Topic Proposal Modal ──────────────────────────────────────────────────

function TopicProposalModal({ subjectId, onClose, onProposed, zIndex = 1000 }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên Topic đề xuất');
      return;
    }
    if (!subjectId) {
      setError('Không xác định được môn học (subjectId). Vui lòng thử lại sau.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const trimmedCode = code.trim().toUpperCase();
      const trimmedDesc = description.trim();

      await TopicService.createProposal({
        subjectId,
        name: name.trim(),
        code: trimmedCode || undefined,
        description: trimmedDesc || undefined,
        reason: reason.trim() || undefined,
      });
      setSuccess(true);
      if (onProposed) onProposed();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đề xuất Topic');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="💡 Đề xuất Canonical Topic mới" onClose={onClose} width="520px" zIndex={zIndex}>
      {success ? (
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <CheckCircle style={{ width: '48px', height: '48px', color: '#16a34a', margin: '0 auto 12px' }} />
          <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: 'var(--color-ink)' }}>Gửi đề xuất thành công!</h4>
          <p style={{ margin: '0 0 6px', fontSize: '0.8125rem', color: 'var(--color-ink)', fontWeight: 600 }}>
            Topic đang ở trạng thái <span style={{ color: '#ca8a04' }}>Chờ duyệt (pending_approval)</span>.
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
            Đề xuất đã được gửi tới School Admin để thẩm định. Sau khi được duyệt, bạn có thể làm mới danh mục để chọn Topic này.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.8125rem', color: 'var(--color-ink-muted)' }}>
            Hệ thống áp dụng mô hình chuẩn <strong>School → Subject → Topic</strong> (Flat Model). Mọi Topic mới cần được School Admin phê duyệt để đảm bảo tính đồng bộ cho sinh viên.
          </p>
          <Field label="Tên Topic đề xuất" required>
            <input
              type="text"
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Vòng lặp For và While..."
            />
          </Field>
          <Field label="Mã Topic gợi ý (tùy chọn)">
            <input
              type="text"
              style={inputStyle}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ví dụ: LOOP_FOR_WHILE"
            />
          </Field>
          <Field label="Mô tả tóm tắt">
            <textarea
              rows={2}
              style={{ ...inputStyle, minHeight: '50px', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tóm tắt kiến thức cốt lõi của Topic..."
            />
          </Field>
          <Field label="Lý do đề xuất">
            <input
              type="text"
              style={inputStyle}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Bổ sung câu hỏi kiểm tra kiến thức cho giáo trình mới..."
            />
          </Field>
          {error && (
            <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: '0.8125rem' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px', borderRadius: '8px',
                border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                color: 'var(--color-ink)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: '8px',
                background: 'var(--color-primary)', color: 'white',
                border: 'none', fontSize: '0.8125rem', fontWeight: 700,
                cursor: (submitting || !name.trim()) ? 'not-allowed' : 'pointer',
                opacity: (submitting || !name.trim()) ? 0.7 : 1,
              }}
            >
              {submitting ? 'Đang gửi...' : 'Gửi đề xuất'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ─── Card Form Modal ──────────────────────────────────────────────────────────

function CardFormModal({ deckId, subjectId, card, onClose, onSaved }) {
  const isEdit = !!card;
  const reviewCount = Number(card?.review_count || 0);
  const isCardLocked = isEdit && reviewCount > 0;
  const isTopicLocked = isCardLocked;
  const effectiveSubjectId = subjectId || card?.subject_id || card?.subjectId;

  // Khởi tạo options từ card (khi edit) hoặc 2 ô trống (khi tạo mới)
  const initOptions = () => {
    if (isEdit && Array.isArray(card.options) && card.options.length >= 2) {
      return card.options.map(String);
    }
    return ['', ''];
  };
  const initCorrectIdx = () => {
    if (isEdit && card.answer && Array.isArray(card.options)) {
      const idx = card.options.findIndex(
        (o) => String(o).trim().toLowerCase() === String(card.answer).trim().toLowerCase()
      );
      return idx >= 0 ? idx : 0;
    }
    return 0;
  };

  const [question, setQuestion] = useState(card?.question || '');
  const [topicId, setTopicId] = useState(card?.topic_id || '');
  const [canonicalTopics, setCanonicalTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);

  const [options, setOptions] = useState(initOptions);
  const [correctIdx, setCorrectIdx] = useState(initCorrectIdx);
  const [explanation, setExplanation] = useState(card?.explanation || '');
  const [difficulty, setDifficulty] = useState(card?.difficulty || 'medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [suggestingTopic, setSuggestingTopic] = useState(false);
  const [suggestedCandidates, setSuggestedCandidates] = useState([]);
  const [suggestError, setSuggestError] = useState(null);

  const handleSuggestTopic = async () => {
    if (!deckId) return;
    if (!question.trim()) {
      setSuggestError('Vui lòng nhập nội dung câu hỏi trước khi tìm gợi ý');
      return;
    }
    setSuggestingTopic(true);
    setSuggestError(null);
    try {
      const currentAnswer = options[correctIdx] || '';
      const res = await FlashcardService.getTopicSuggestions(deckId, {
        question: question.trim(),
        answer: currentAnswer.trim(),
        limit: 5,
      });
      const candidates = res?.data?.candidates || [];
      setSuggestedCandidates(candidates);
      if (candidates.length === 0) {
        setSuggestError('Không tìm thấy Topic phù hợp trong danh mục của môn học.');
      }
    } catch (err) {
      setSuggestError(err?.response?.data?.message || 'Không thể tìm gợi ý Topic lúc này');
    } finally {
      setSuggestingTopic(false);
    }
  };

  const fetchApprovedTopics = useCallback(async () => {
    if (!effectiveSubjectId) return;
    setLoadingTopics(true);
    try {
      const res = await TopicService.getTopics(effectiveSubjectId, {
        status: 'approved',
        reviewRequired: false,
        isActive: true,
        limit: 100,
      });
      const list = res?.data?.items || (Array.isArray(res?.data) ? res.data : (res?.data?.topics || []));
      setCanonicalTopics(list);
    } catch {
      // Ignore
    } finally {
      setLoadingTopics(false);
    }
  }, [effectiveSubjectId]);

  useEffect(() => {
    fetchApprovedTopics();
  }, [fetchApprovedTopics]);

  const handleOptionChange = (idx, val) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)));
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 2) return;
    const next = options.filter((_, i) => i !== idx);
    setCorrectIdx((prev) => {
      if (idx === prev) return 0;
      if (idx < prev) return prev - 1;
      return prev;
    });
    setOptions(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) { setError('Câu hỏi không được để trống'); return; }
    const filled = options.map((o) => o.trim()).filter(Boolean);
    if (filled.length < 2) { setError('Cần ít nhất 2 lựa chọn có nội dung'); return; }
    if (!options[correctIdx]?.trim()) { setError('Vui lòng chọn đáp án đúng hợp lệ'); return; }
    if (!topicId) { setError('Vui lòng chọn Canonical Topic chuẩn cho thẻ'); return; }

    const payload = {
      type: 'multiple_choice',
      question: question.trim(),
      options: options.map((o) => o.trim()).filter(Boolean),
      answer: options[correctIdx].trim(),
      explanation: explanation.trim(),
      difficulty,
      topicId: topicId,
    };

    setSaving(true); setError(null);
    try {
      if (isEdit) {
        await FlashcardService.updateCard(deckId, card.id, payload);
      } else {
        await FlashcardService.createCard(deckId, payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const currentTopicInCatalog = canonicalTopics.some((t) => t.id === topicId);
  const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <>
      <Modal title={isEdit ? (isCardLocked ? '🔒 Xem & Sửa thẻ (Đã có sinh viên ôn tập)' : '✏️ Sửa thẻ trắc nghiệm') : '➕ Thêm thẻ trắc nghiệm'} onClose={onClose} width="620px" padding="16px 20px">
        <form onSubmit={handleSubmit}>

          {/* Cảnh báo khóa toàn bộ nội dung khi thẻ đã có sinh viên ôn tập */}
          {isCardLocked && (
            <div style={{
              marginBottom: '14px', padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(234, 179, 8, 0.1)', border: '1.5px solid rgba(234, 179, 8, 0.3)',
              color: '#b45309', fontSize: '0.8125rem', lineHeight: 1.5,
            }}>
              <p style={{ margin: '0 0 2px', fontWeight: 700 }}>
                🔒 Thẻ này đã có {reviewCount} lượt sinh viên ôn tập
              </p>
              <p style={{ margin: 0, fontSize: '0.75rem' }}>
                Để bảo vệ lịch sử học tập, tính chính xác của Learning Analytics và AI Study Plan, câu hỏi, đáp án, các lựa chọn và Topic đã được khóa bảo vệ. Bạn chỉ có thể cập nhật giải thích đáp án.
              </p>
            </div>
          )}

          {/* Empty state nếu môn học chưa có topic nào được duyệt */}
          {!isCardLocked && !isEdit && canonicalTopics.length === 0 && !loadingTopics && (
            <div style={{
              marginBottom: '14px', padding: '12px 14px', borderRadius: '10px',
              background: 'rgba(220, 38, 38, 0.08)', border: '1.5px solid rgba(220, 38, 38, 0.25)',
              color: '#b91c1c', fontSize: '0.8125rem',
            }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700 }}>
                ⚠️ Môn học chưa có Canonical Topic chuẩn nào được duyệt
              </p>
              <p style={{ margin: '0 0 8px', fontSize: '0.75rem', lineHeight: 1.5 }}>
                Flashcard mới bắt buộc phải gắn với một Topic đã duyệt. Vui lòng gửi đề xuất Topic cho School Admin trước khi thêm thẻ.
              </p>
              <button
                type="button"
                onClick={() => setShowProposalModal(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '5px 12px', borderRadius: '6px',
                  background: '#dc2626', color: 'white', border: 'none',
                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                💡 Đề xuất Topic mới ngay
              </button>
            </div>
          )}

          {/* Câu hỏi */}
          <Field label="Câu hỏi" required>
            {!isCardLocked && <LatexToolbar onInsert={(f) => setQuestion(prev => prev ? prev + ' ' + f : f)} />}
            <textarea
              rows={2}
              disabled={isCardLocked}
              style={{
                ...inputStyle, minHeight: '44px',
                resize: isCardLocked ? 'none' : 'vertical', padding: '8px 10px',
                opacity: isCardLocked ? 0.75 : 1,
                backgroundColor: isCardLocked ? 'var(--color-primary-bg)' : 'var(--color-surface)',
                cursor: isCardLocked ? 'not-allowed' : 'text',
              }}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Nhập câu hỏi trắc nghiệm..."
            />
            {question.trim() && (
              <div style={{
                marginTop: '6px', padding: '8px 12px', borderRadius: '8px',
                background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)',
              }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary-dark)', display: 'block', marginBottom: '2px' }}>
                  👁️ Xem trước công thức câu hỏi:
                </span>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-ink)', lineHeight: 1.5 }}>
                  <MathText content={question} />
                </div>
              </div>
            )}
          </Field>

          {/* Canonical Topic Selector */}
          <Field label="Canonical Topic (Chủ đề chuẩn)" required>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                style={{
                  ...inputStyle,
                  padding: '8px 10px',
                  cursor: isTopicLocked ? 'not-allowed' : 'pointer',
                  backgroundColor: isTopicLocked ? 'var(--color-primary-bg)' : 'var(--color-surface)',
                  opacity: isTopicLocked ? 0.8 : 1,
                  flex: 1,
                }}
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                disabled={isTopicLocked}
              >
                <option value="">-- Chọn Canonical Topic đã duyệt --</option>
                {/* Giữ lại option nếu thẻ cũ có Topic Legacy chưa duyệt hoặc inactive */}
                {isEdit && card?.topic_id && !currentTopicInCatalog && (
                  <option value={card.topic_id}>
                    ⚠️ [Chủ đề cũ / Cần rà soát] {card.topic_name || card.topic_id}
                  </option>
                )}
                {canonicalTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code ? `[${t.code}] ` : ''}{t.name}
                  </option>
                ))}
              </select>

              {!isTopicLocked && (
                <button
                  type="button"
                  onClick={handleSuggestTopic}
                  disabled={suggestingTopic || !question.trim()}
                  title="Tìm gợi ý Topic chuẩn dựa trên nội dung câu hỏi và đáp án"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '8px 10px', borderRadius: '8px',
                    background: 'var(--color-primary-card)', border: '1px solid var(--color-primary)',
                    color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700,
                    cursor: (suggestingTopic || !question.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (suggestingTopic || !question.trim()) ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Zap style={{ width: '13px', height: '13px' }} />
                  {suggestingTopic ? 'Đang gợi ý...' : 'Gợi ý Topic'}
                </button>
              )}

              <button
                type="button"
                onClick={fetchApprovedTopics}
                disabled={loadingTopics}
                title="Làm mới danh mục Topic đã duyệt"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '8px 10px', borderRadius: '8px',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  color: 'var(--color-ink)', fontSize: '0.75rem', fontWeight: 600,
                  cursor: loadingTopics ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                }}
              >
                🔄 {loadingTopics ? 'Đang tải...' : 'Làm mới'}
              </button>
              <button
                type="button"
                onClick={() => setShowProposalModal(true)}
                title="Đề xuất Topic mới nếu chưa có trong danh mục"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '8px 12px', borderRadius: '8px',
                  background: 'var(--color-primary-card)', border: '1px solid var(--color-border)',
                  color: 'var(--color-primary-dark)', fontSize: '0.75rem', fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                💡 Đề xuất
              </button>
            </div>

            {/* Danh sách các pill gợi ý khi Lecturer bấm Gợi ý Topic */}
            {suggestedCandidates.length > 0 && (
              <div style={{
                marginTop: '8px', padding: '10px 12px', borderRadius: '8px',
                background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ink)', marginBottom: '6px' }}>
                  🎯 Gợi ý Topic khớp với nội dung (Bấm để chọn):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {suggestedCandidates.map((c) => {
                    const isSelected = topicId === c.topicId;
                    const pct = Math.round((c.score || 0) * 100);
                    return (
                      <button
                        key={c.topicId}
                        type="button"
                        onClick={() => setTopicId(c.topicId)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '5px 10px', borderRadius: '6px',
                          border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                          color: isSelected ? '#ffffff' : 'var(--color-ink)',
                          fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.15s ease-in-out',
                        }}
                      >
                        <span>{c.topicCode ? `[${c.topicCode}] ` : ''}{c.topicName}</span>
                        <span style={{
                          padding: '1px 5px', borderRadius: '4px',
                          background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--color-primary-bg)',
                          color: isSelected ? '#ffffff' : 'var(--color-primary-dark)',
                          fontSize: '0.6875rem', fontWeight: 700,
                        }}>
                          {pct}%
                        </span>
                        {isSelected && <span>✓ Đã chọn</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {suggestError && (
              <div style={{
                marginTop: '6px', fontSize: '0.75rem', color: '#dc2626',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <AlertCircle style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                <span>{suggestError}</span>
              </div>
            )}
          </Field>

        {/* Các lựa chọn */}
        <Field label="Các lựa chọn" required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {options.map((opt, idx) => {
              const isCorrect = idx === correctIdx;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', borderRadius: '10px',
                    border: `1.5px solid ${isCorrect ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: isCorrect ? 'var(--color-primary-card)' : 'var(--color-surface)',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Label chữ cái */}
                  <span style={{
                    width: '22px', height: '22px', flexShrink: 0,
                    borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 800,
                    background: isCorrect ? 'var(--color-primary)' : 'var(--color-border)',
                    color: isCorrect ? 'white' : 'var(--color-ink-muted)',
                  }}>
                    {OPTION_LABELS[idx]}
                  </span>

                  {/* Input text */}
                  <input
                    type="text"
                    disabled={isCardLocked}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Lựa chọn ${OPTION_LABELS[idx]}${isCorrect ? ' (đáp án đúng)' : ' (gây nhiễu)'}`}
                    style={{
                      flex: 1, padding: '6px 8px', border: 'none', outline: 'none',
                      background: 'transparent', fontSize: '0.875rem',
                      fontFamily: 'var(--font-sans)', color: 'var(--color-ink)',
                      cursor: isCardLocked ? 'not-allowed' : 'text',
                      opacity: isCardLocked ? 0.8 : 1,
                    }}
                  />

                  {/* Nút chọn đáp án đúng */}
                  <button
                    type="button"
                    disabled={isCardLocked}
                    onClick={() => setCorrectIdx(idx)}
                    title={isCorrect ? 'Đây là đáp án đúng' : 'Chọn làm đáp án đúng'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '4px 8px', borderRadius: '6px', border: '1px solid',
                      cursor: isCardLocked ? 'not-allowed' : 'pointer', fontSize: '0.6875rem', fontWeight: 700,
                      flexShrink: 0, fontFamily: 'var(--font-sans)',
                      borderColor: isCorrect ? 'var(--color-primary)' : 'var(--color-border)',
                      background: isCorrect ? 'var(--color-primary)' : 'transparent',
                      color: isCorrect ? 'white' : 'var(--color-ink-muted)',
                      opacity: isCardLocked ? 0.75 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {isCorrect ? '✓ Đúng' : 'Chọn'}
                  </button>

                  {/* Nút xóa */}
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    disabled={isCardLocked || options.length <= 2}
                    title="Xóa lựa chọn này"
                    style={{
                      width: '24px', height: '24px', borderRadius: '6px',
                      border: '1px solid var(--color-border)', background: 'transparent',
                      cursor: (isCardLocked || options.length <= 2) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--color-ink-muted)', opacity: (isCardLocked || options.length <= 2) ? 0.35 : 1,
                      flexShrink: 0, transition: 'all 0.15s',
                      fontSize: '0.875rem',
                    }}
                    onMouseEnter={(e) => { if (!isCardLocked && options.length > 2) { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.color = '#dc2626'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-ink-muted)'; }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          {/* Nút thêm lựa chọn */}
          {!isCardLocked && options.length < 6 && (
            <button
              type="button"
              onClick={handleAddOption}
              style={{
                marginTop: '8px',
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px',
                border: '1.5px dashed var(--color-border)',
                background: 'transparent', color: 'var(--color-ink-muted)',
                fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                width: '100%', justifyContent: 'center',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary-dark)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-ink-muted)'; }}
            >
              + Thêm lựa chọn ({options.length}/6)
            </button>
          )}

          <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', marginTop: '6px' }}>
            💡 Nhấn <strong>Chọn</strong> để đánh dấu đáp án đúng. Các lựa chọn còn lại là đáp án gây nhiễu.
          </p>
        </Field>

        {/* Giải thích */}
        <Field label="Giải thích đáp án (tùy chọn)">
          <textarea
            rows={2}
            style={{ ...inputStyle, minHeight: '40px', resize: 'vertical', padding: '6px 10px' }}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Giải thích vì sao đáp án đúng (hiển thị trong kết quả kiểm tra)..."
          />
          {explanation.trim() && (
            <div style={{
              marginTop: '6px', padding: '6px 10px', borderRadius: '8px',
              background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)',
            }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary-dark)', display: 'block', marginBottom: '2px' }}>
                👁️ Xem trước giải thích:
              </span>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink)', lineHeight: 1.5 }}>
                <MathText content={explanation} />
              </div>
            </div>
          )}
        </Field>

        {/* Độ khó */}
        <Field label="Độ khó">
          <div style={{ display: 'flex', gap: '8px' }}>
            {Object.entries(DIFF_META).map(([val, { label, color, bg }]) => (
              <button
                key={val} type="button"
                onClick={() => setDifficulty(val)}
                style={{
                  flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1.5px solid',
                  cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                  transition: 'all 0.15s', fontFamily: 'var(--font-sans)',
                  borderColor: difficulty === val ? color : 'var(--color-border)',
                  background: difficulty === val ? bg : 'var(--color-surface)',
                  color: difficulty === val ? color : 'var(--color-ink-muted)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        {error && (
          <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: '0.75rem', marginBottom: '10px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button type="button" onClick={onClose} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving || (!isEdit && canonicalTopics.length === 0)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 18px',
              borderRadius: '8px', background: 'var(--color-primary)', color: 'white',
              border: 'none', fontSize: '0.8125rem', fontWeight: 700,
              cursor: (saving || (!isEdit && canonicalTopics.length === 0)) ? 'not-allowed' : 'pointer',
              opacity: (saving || (!isEdit && canonicalTopics.length === 0)) ? 0.6 : 1,
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Save style={{ width: '14px', height: '14px' }} />
            {saving ? 'Đang lưu...' : isEdit ? (isCardLocked ? 'Lưu giải thích' : 'Lưu thay đổi') : 'Thêm thẻ'}
          </button>
        </div>
      </form>
    </Modal>

    {showProposalModal && (
      <TopicProposalModal
        subjectId={effectiveSubjectId}
        zIndex={1000}
        onClose={() => setShowProposalModal(false)}
        onProposed={fetchApprovedTopics}
      />
    )}
  </>
  );
}


// ─── ClassAccessModal ──────────────────────────────────────────────────

/**
 * Modal cho GV chọn lớp nào được nhìn thấy bộ thẻ này.
 * Tự load danh sách lớp cùng môn học của deck.
 */
function ClassAccessModal({ deck, onClose, onSaved }) {
  const [allClasses, setAllClasses] = useState([]);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [loadingInit, setLoadingInit] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Load danh sách lớp cùng môn + access hiện tại
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingInit(true);
      try {
        const [classRes, accessRes] = await Promise.all([
          ClassService.getMyClasses(),
          FlashcardService.getClassAccess(deck.id),
        ]);
        if (cancelled) return;

        // Chỉ giữ lớp cùng môn với deck
        const filtered = (classRes.data || []).filter(
          (c) => c.subject_id === deck.subject_id
        );
        setAllClasses(filtered);

        const currentIds = new Set((accessRes.data || []).map((a) => a.class_id));
        setCheckedIds(currentIds);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Không thể tải dữ liệu');
      } finally {
        if (!cancelled) setLoadingInit(false);
      }
    })();
    return () => { cancelled = true; };
  }, [deck.id, deck.subject_id]);

  const toggle = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === allClasses.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(allClasses.map((c) => c.id)));
    }
  };

  const handleSave = async () => {
    setSaving(true); setError(null); setNotice(null);
    try {
      const ids = Array.from(checkedIds);
      await FlashcardService.setClassAccess(deck.id, ids);
      setNotice(ids.length === 0
        ? 'Bộ thẻ đã được ẩn khỏi tất cả lớp.'
        : `Đã chia sẻ cho ${ids.length} lớp.`);
      setTimeout(() => { onSaved(); onClose(); }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const allChecked = allClasses.length > 0 && checkedIds.size === allClasses.length;
  const partChecked = checkedIds.size > 0 && checkedIds.size < allClasses.length;

  return (
    <Modal title={`🔒 Chia sẻ bộ thẻ — ${deck.title}`} onClose={onClose} width="500px">
      {/* Mô tả */}
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', marginTop: 0, marginBottom: '16px' }}>
        Chọn lớp nào được nhìn thấy bộ thẻ này. Sinh viên ở các lớp được chọn sẽ thấy và có thể học bộ thẻ.
      </p>

      {loadingInit ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '52px', borderRadius: '10px', background: 'var(--color-border)', animation: 'skeleton-pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : allClasses.length === 0 ? (
        <div style={{ padding: '30px 20px', textAlign: 'center', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
          <Users style={{ width: '28px', height: '28px', opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', margin: 0 }}>
            Không có lớp nào cùng môn <strong>{deck.subject_name}</strong>.
          </p>
        </div>
      ) : (
        <>
          {/* Chọn tất cả */}
          <button
            type="button"
            onClick={toggleAll}
            style={{
              width: '100%', padding: '10px 14px', marginBottom: '10px',
              borderRadius: '10px', border: '1.5px solid var(--color-border)',
              background: 'var(--color-primary-bg)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px',
              fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
          >
            {/* Checkbox */}
            <div style={{
              width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
              border: `2px solid ${allChecked || partChecked ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: allChecked ? 'var(--color-primary)' : partChecked ? 'var(--color-primary-card)' : 'var(--color-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {allChecked && <CheckCircle style={{ width: '12px', height: '12px', color: 'white' }} />}
              {partChecked && <span style={{ width: '8px', height: '2px', background: 'var(--color-primary)', display: 'block', borderRadius: '2px' }} />}
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink)' }}>
              {allChecked ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
              {allClasses.length} lớp
            </span>
          </button>

          {/* Danh sách lớp */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
            {allClasses.map((cls) => {
              const checked = checkedIds.has(cls.id);
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => toggle(cls.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '10px',
                    border: `1.5px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: checked ? 'var(--color-primary-card)' : 'var(--color-surface)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    fontFamily: 'var(--font-sans)', transition: 'all 0.15s',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                    border: `2px solid ${checked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: checked ? 'var(--color-primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {checked && <CheckCircle style={{ width: '12px', height: '12px', color: 'white' }} />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: checked ? 'var(--color-primary-dark)' : 'var(--color-ink)', margin: 0 }}>
                      {cls.class_name || cls.class_code}
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', margin: '2px 0 0' }}>
                      {cls.class_code}{cls.semester_name ? ` · ${cls.semester_name}` : ''}
                    </p>
                  </div>

                  {checked && (
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px',
                      borderRadius: '9999px', background: 'rgba(249,115,22,0.1)', color: 'var(--color-primary-dark)',
                    }}>
                      Đang chia sẻ
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Thông báo */}
      {notice && (
        <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(22,163,74,0.08)', color: '#16a34a', fontSize: '0.8125rem', fontWeight: 600 }}>
          ✔️ {notice}
        </div>
      )}
      {error && (
        <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      {/* Actions */}
      {!loadingInit && allClasses.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: '9px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '9px', background: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-sans)' }}
          >
            <Share2 style={{ width: '14px', height: '14px' }} />
            {saving ? 'Đang lưu...' : checkedIds.size === 0 ? 'Ẩn khỏi tất cả' : `Chia sẻ cho ${checkedIds.size} lớp`}
          </button>
        </div>
      )}
    </Modal>
  );
}

// ─── Excel Import Modal (4-step Wizard) ───────────────────────────────────────

function ExcelImportModal({ deckId, subjectId, onClose, onSaved }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'preview' | 'done'
  const [file, setFile] = useState(null);
  const [canonicalTopics, setCanonicalTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [previewData, setPreviewData] = useState(null);
  const [rowTopicSelections, setRowTopicSelections] = useState({});
  const [bulkRawTopic, setBulkRawTopic] = useState('');
  const [bulkTargetTopicId, setBulkTargetTopicId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const effectiveSubjectId = subjectId || previewData?.subjectId || previewData?.subject_id;

  const fetchApprovedTopics = useCallback(async () => {
    if (!effectiveSubjectId) return;
    setLoadingTopics(true);
    try {
      const res = await TopicService.getTopics(effectiveSubjectId, {
        status: 'approved',
        reviewRequired: false,
        isActive: true,
        limit: 100,
      });
      const list = res?.data?.items || (Array.isArray(res?.data) ? res.data : (res?.data?.topics || []));
      setCanonicalTopics(list);
    } catch {
      // Ignore
    } finally {
      setLoadingTopics(false);
    }
  }, [effectiveSubjectId]);

  useEffect(() => {
    fetchApprovedTopics();
  }, [fetchApprovedTopics]);

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await FlashcardService.downloadExcelTemplate(deckId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'flashcard_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch {
      alert('Không thể tải file mẫu. Vui lòng thử lại sau.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handlePreview = async (e) => {
    if (e) e.preventDefault();
    if (!file) {
      setError('Vui lòng chọn một file Excel (.xlsx, .xls) hoặc .csv');
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const res = await FlashcardService.previewImportCards(deckId, file);
      const data = res?.data || res;
      setPreviewData(data);

      // Phase 4: Do NOT auto-preselect topicId. Lecturer must explicitly confirm or use Bulk Actions.
      setRowTopicSelections({});
      setStep('preview');
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi phân tích file Excel');
    } finally {
      setUploading(false);
    }
  };

  const handleBulkAssign = (rawTopic, targetTopicId) => {
    if (!previewData?.rows) return;
    setRowTopicSelections((prev) => {
      const next = { ...prev };
      for (const r of previewData.rows) {
        if ((r.rawTopic || '').trim() === (rawTopic || '').trim()) {
          next[r.rowNumber] = targetTopicId;
        }
      }
      return next;
    });
  };

  const handleApplyAllSuggestions = () => {
    if (!previewData?.rows) return;
    setRowTopicSelections((prev) => {
      const next = { ...prev };
      for (const r of previewData.rows) {
        if (!next[r.rowNumber] && r.candidates && r.candidates.length > 0 && !r.isAmbiguous) {
          const topCandidate = r.candidates[0];
          if (topCandidate?.topicId) {
            next[r.rowNumber] = topCandidate.topicId;
          }
        }
      }
      return next;
    });
  };

  const handleRowTopicChange = (rowNumber, targetTopicId) => {
    setRowTopicSelections((prev) => ({
      ...prev,
      [rowNumber]: targetTopicId,
    }));
  };

  const handleConfirm = async () => {
    if (!previewData?.previewId) return;

    const validRows = (previewData.rows || []).filter(
      (r) => !r.validationErrors || r.validationErrors.length === 0
    );

    const missingRows = validRows.filter((r) => !rowTopicSelections[r.rowNumber]);
    if (missingRows.length > 0) {
      setError(`Còn ${missingRows.length} dòng chưa chọn Topic chuẩn. Vui lòng gán Canonical Topic cho toàn bộ câu hỏi trước khi lưu.`);
      return;
    }

    const payloadRows = validRows.map((r) => ({
      rowNumber: r.rowNumber,
      topicId: rowTopicSelections[r.rowNumber],
    }));

    setConfirming(true);
    setError(null);

    try {
      const res = await FlashcardService.confirmImportCards(deckId, {
        previewId: previewData.previewId,
        rows: payloadRows,
      });
      setResult(res?.data || res);
      setStep('done');
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu flashcards');
    } finally {
      setConfirming(false);
    }
  };

  const validRows = (previewData?.rows || []).filter(
    (r) => !r.validationErrors || r.validationErrors.length === 0
  );
  const validRowsCount = validRows.length;
  const errorRowsCount = (previewData?.rows || []).length - validRowsCount;
  const assignedCount = validRows.filter((r) => Boolean(rowTopicSelections[r.rowNumber])).length;
  const isAllAssigned = validRowsCount > 0 && assignedCount === validRowsCount;

  // Unique raw topics for bulk toolbar
  const uniqueRawTopics = Array.from(
    new Set(validRows.map((r) => (r.rawTopic || '').trim()))
  ).filter(Boolean);

  const getMatchBadge = (row) => {
    if (row.isAmbiguous) {
      return (
        <span
          style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#b45309', fontWeight: 700 }}
          title="Nhiều Topic có độ tương đồng sát nhau (cần xác nhận thủ công)"
        >
          ⚠️ Phân vân
        </span>
      );
    }
    if (!row.candidates || row.candidates.length === 0) {
      return (
        <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(100, 116, 139, 0.12)', color: '#64748b', fontWeight: 600 }}>
          Chưa khớp
        </span>
      );
    }
    const best = row.candidates[0];
    const scorePct = Math.round((best.score || 0) * 100);
    switch (best.matchType) {
      case 'exact_code':
        return (
          <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', fontWeight: 700 }} title="Khớp chính xác 100% mã Topic">
            ✓ Khớp mã
          </span>
        );
      case 'exact_name':
        return (
          <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', fontWeight: 700 }} title="Khớp chính xác 100% tên Topic">
            ✓ Khớp tên
          </span>
        );
      case 'exact_alias':
        return (
          <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(147, 51, 234, 0.12)', color: '#9333ea', fontWeight: 700 }} title="Khớp chính xác Alias phụ">
            ✓ Khớp alias
          </span>
        );
      case 'normalized':
        return (
          <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', fontWeight: 700 }} title="Khớp sau khi chuẩn hóa Unicode/bỏ dấu tiếng Việt">
            ✓ Không dấu
          </span>
        );
      case 'fuzzy':
        return (
          <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.12)', color: '#4f46e5', fontWeight: 700 }} title={`Độ tương đồng chữ: ${scorePct}%`}>
            ~ Gần đúng ({scorePct}%)
          </span>
        );
      case 'semantic':
        return (
          <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.15)', color: '#7e22ce', fontWeight: 700 }} title={`AI Semantic Match: ${scorePct}%`}>
            🤖 AI ({scorePct}%)
          </span>
        );
      default:
        return (
          <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', fontWeight: 600 }}>
            Gợi ý ({scorePct}%)
          </span>
        );
    }
  };

  return (
    <>
      <Modal
        title={
          step === 'upload'
            ? '📥 Nhập thẻ từ file Excel'
            : step === 'preview'
            ? '🔍 Xem trước & Khớp Canonical Topic (Phase 3)'
            : '✅ Kết quả nhập thẻ Excel'
        }
        onClose={onClose}
        width={step === 'preview' ? '920px' : '560px'}
      >
        {/* BƯỚC 1: UPLOAD & TEMPLATE */}
        {step === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {canonicalTopics.length === 0 && !loadingTopics && (
              <div style={{
                padding: '12px 14px', borderRadius: '10px',
                background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)',
                color: '#b45309', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                  <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>Chú ý: Môn học này hiện chưa có Canonical Topic chuẩn nào!</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: '1.4' }}>
                  Hệ thống yêu cầu các thẻ nhập vào phải khớp với Topic chuẩn của trường. Bạn có thể gửi đề xuất danh mục Topic ngay bây giờ để School Admin phê duyệt trước hoặc tiếp tục xem trước file.
                </p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setShowProposalModal(true)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px',
                      background: 'var(--color-primary)', color: 'white',
                      border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    + Đề xuất Topic mới ngay
                  </button>
                  <button
                    type="button"
                    onClick={fetchApprovedTopics}
                    style={{
                      padding: '6px 12px', borderRadius: '6px',
                      background: 'var(--color-surface)', color: 'var(--color-ink)',
                      border: '1px solid var(--color-border)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Làm mới danh mục Topic
                  </button>
                </div>
              </div>
            )}

            <div style={{
              padding: '14px 16px', borderRadius: '12px',
              background: 'var(--color-primary-card)', border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  Tải file mẫu Excel
                </p>
             
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    color: 'var(--color-ink)', fontSize: '0.8125rem', fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Download style={{ width: '14px', height: '14px' }} />
                  {downloadingTemplate ? 'Đang tải...' : 'Tải template (.xlsx)'}
                </button>
              </div>
            </div>

            <form onSubmit={handlePreview}>
              <Field label="Chọn file Excel từ máy tính (.xlsx, .xls, .csv)" required>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    setFile(e.target.files[0] || null);
                    setError(null);
                  }}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '12px 14px', borderRadius: '10px',
                    border: '1.5px dashed var(--color-border)',
                    background: 'var(--color-surface)', color: 'var(--color-ink)',
                    fontSize: '0.875rem', cursor: 'pointer',
                  }}
                />
              </Field>

              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(220,38,38,0.08)', color: '#dc2626',
                  fontSize: '0.8125rem', marginTop: '12px',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '9px 18px', borderRadius: '9px',
                    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                    color: 'var(--color-ink)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '9px 20px', borderRadius: '9px',
                    background: 'var(--color-primary)', color: 'white',
                    border: 'none', fontSize: '0.875rem', fontWeight: 700,
                    cursor: (uploading || !file) ? 'not-allowed' : 'pointer',
                    opacity: (uploading || !file) ? 0.6 : 1,
                  }}
                >
                  <Upload style={{ width: '14px', height: '14px' }} />
                  {uploading ? 'Đang phân tích...' : 'Tiếp tục: Xem trước & Khớp Topic'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* BƯỚC 2 & 3: PREVIEW, DETERMINISTIC MATCHING & TOPIC CONFIRMATION */}
        {step === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Thanh thống kê nhanh */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '10px', padding: '12px', borderRadius: '10px',
              background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)',
            }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>Tổng số dòng</span>
                <p style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-ink)' }}>
                  {previewData?.totalRows || 0}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: '#16a34a', textTransform: 'uppercase' }}>Hợp lệ</span>
                <p style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#16a34a' }}>
                  {validRowsCount}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.6875rem', color: isAllAssigned ? '#16a34a' : '#ca8a04', textTransform: 'uppercase' }}>Đã gán Topic chuẩn</span>
                <p style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 800, color: isAllAssigned ? '#16a34a' : '#ca8a04' }}>
                  {assignedCount} / {validRowsCount}
                </p>
              </div>
              {errorRowsCount > 0 && (
                <div>
                  <span style={{ fontSize: '0.6875rem', color: '#dc2626', textTransform: 'uppercase' }}>Dòng lỗi/bỏ qua</span>
                  <p style={{ margin: '2px 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#dc2626' }}>
                    {errorRowsCount}
                  </p>
                </div>
              )}
            </div>
            {/* Toolbar gán hàng loạt & Thao tác nhanh Phase 4 */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
              gap: '10px', padding: '10px 14px', borderRadius: '10px',
              background: 'var(--color-primary-card)', border: '1px solid var(--color-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                  ⚡ Thao tác nhanh:
                </span>
                <button
                  type="button"
                  onClick={handleApplyAllSuggestions}
                  style={{
                    padding: '5px 12px', borderRadius: '6px',
                    background: 'var(--color-primary)', color: '#ffffff',
                    border: 'none', fontSize: '0.75rem', fontWeight: 700,
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}
                  title="Tự động gán gợi ý hàng đầu cho tất cả các dòng chưa chọn Topic (trừ các dòng phân vân)"
                >
                  <Zap style={{ width: '12px', height: '12px' }} />
                  Áp dụng tất cả gợi ý ({validRows.filter(r => !rowTopicSelections[r.rowNumber] && r.candidates?.length > 0 && !r.isAmbiguous).length})
                </button>
              </div>

              {uniqueRawTopics.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>Gán theo nhóm Excel:</span>
                  <select
                    style={{
                      padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--color-border)',
                      fontSize: '0.75rem', background: 'var(--color-surface)', color: 'var(--color-ink)',
                      maxWidth: '140px',
                    }}
                    value={bulkRawTopic}
                    onChange={(e) => setBulkRawTopic(e.target.value)}
                  >
                    <option value="">-- Chọn Chủ đề Excel --</option>
                    {uniqueRawTopics.map((rt) => (
                      <option key={rt} value={rt}>{rt}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>→</span>
                  <select
                    style={{
                      padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--color-border)',
                      fontSize: '0.75rem', background: 'var(--color-surface)', color: 'var(--color-ink)',
                      maxWidth: '160px',
                    }}
                    value={bulkTargetTopicId}
                    onChange={(e) => setBulkTargetTopicId(e.target.value)}
                  >
                    <option value="">-- Chọn Topic chuẩn --</option>
                    {canonicalTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code ? `[${t.code}] ` : ''}{t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!bulkRawTopic || !bulkTargetTopicId}
                    onClick={() => {
                      handleBulkAssign(bulkRawTopic, bulkTargetTopicId);
                      setBulkRawTopic('');
                      setBulkTargetTopicId('');
                    }}
                    style={{
                      padding: '4px 10px', borderRadius: '6px',
                      background: (!bulkRawTopic || !bulkTargetTopicId) ? 'var(--color-border)' : 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      color: (!bulkRawTopic || !bulkTargetTopicId) ? 'var(--color-ink-muted)' : 'var(--color-ink)',
                      fontSize: '0.75rem', fontWeight: 600,
                      cursor: (!bulkRawTopic || !bulkTargetTopicId) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Gán nhóm
                  </button>
                </div>
              )}
            </div>

            {/* Bảng chi tiết từng câu hỏi & matching */}
            <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: 'var(--color-primary-bg)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: '45px' }}>Dòng</th>
                    <th style={{ padding: '8px 10px', minWidth: '220px' }}>Câu hỏi & Đáp án</th>
                    <th style={{ padding: '8px 10px', width: '130px' }}>Chủ đề Excel</th>
                    <th style={{ padding: '8px 10px', width: '90px' }}>Khớp gợi ý</th>
                    <th style={{ padding: '8px 10px', minWidth: '220px' }}>Topic Chuẩn được chọn (*)</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData?.rows?.map((row) => {
                    const hasError = row.validationErrors && row.validationErrors.length > 0;
                    const selectedTid = rowTopicSelections[row.rowNumber] || '';
                    return (
                      <tr
                        key={row.rowNumber}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          background: hasError ? 'rgba(220,38,38,0.04)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--color-ink-muted)' }}>
                          #{row.rowNumber}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <p style={{ margin: '0 0 2px', fontWeight: 600, color: 'var(--color-ink)' }}>
                            {row.question || '---'}
                          </p>
                          <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                            ✓ Đáp án: {row.answer || '---'}
                          </span>
                          {hasError && (
                            <div style={{ marginTop: '2px', color: '#dc2626', fontSize: '0.6875rem' }}>
                              ⚠️ {row.validationErrors.join('; ')}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--color-ink-muted)' }}>
                          {row.rawTopic ? `"${row.rawTopic}"` : <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Trống</span>}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {getMatchBadge(row)}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {hasError ? (
                            <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Bị bỏ qua do lỗi</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <select
                                style={{
                                  width: '100%', padding: '5px 8px', borderRadius: '6px',
                                  border: `1.5px solid ${selectedTid ? 'var(--color-primary)' : '#dc2626'}`,
                                  fontSize: '0.75rem', background: 'var(--color-surface)', color: 'var(--color-ink)',
                                }}
                                value={selectedTid}
                                onChange={(e) => handleRowTopicChange(row.rowNumber, e.target.value)}
                              >
                                <option value="">-- Chọn Canonical Topic (*) --</option>
                                {canonicalTopics.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.code ? `[${t.code}] ` : ''}{t.name}
                                  </option>
                                ))}
                              </select>

                              {/* Gợi ý candidate nhanh cho từng dòng */}
                              {row.candidates && row.candidates.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                                  {row.candidates.slice(0, 2).map((c) => {
                                    const isSelected = selectedTid === c.topicId;
                                    return (
                                      <button
                                        key={c.topicId}
                                        type="button"
                                        onClick={() => handleRowTopicChange(row.rowNumber, c.topicId)}
                                        title={`Gán: ${c.topicCode ? `[${c.topicCode}] ` : ''}${c.topicName} (${Math.round((c.score || 0) * 100)}%)`}
                                        style={{
                                          padding: '2px 6px', borderRadius: '4px',
                                          border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                          background: isSelected ? 'var(--color-primary-card)' : 'var(--color-surface)',
                                          color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-ink)',
                                          fontSize: '0.6875rem', fontWeight: isSelected ? 700 : 500,
                                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px',
                                          maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}
                                      >
                                        <span>{isSelected ? '✓ ' : '+ '}{c.topicCode ? `[${c.topicCode}] ` : ''}{c.topicName}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: '0.8125rem',
              }}>
                {error}
              </div>
            )}

            {canonicalTopics.length === 0 && (
              <div style={{
                padding: '12px 14px', borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#dc2626', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                  <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  <span>Không thể xác nhận: Môn học này chưa có Canonical Topic chuẩn!</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem' }}>
                  Hệ thống không cho phép lưu flashcard khi không có Topic chuẩn được phê duyệt. Vui lòng bấm <strong>"+ Đề xuất Topic mới nếu chưa có"</strong> ở thanh công cụ hoặc liên hệ School Admin để duyệt danh mục.
                </p>
              </div>
            )}

            {!isAllAssigned && canonicalTopics.length > 0 && (
              <div style={{
                padding: '8px 12px', borderRadius: '8px',
                background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)',
                color: '#b45309', fontSize: '0.75rem',
              }}>
                ⚠️ Còn <strong>{validRowsCount - assignedCount}</strong> câu hỏi chưa được gán Canonical Topic. Vui lòng chọn Topic chuẩn cho tất cả các dòng trước khi lưu.
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setStep('upload')}
                style={{
                  padding: '8px 16px', borderRadius: '8px',
                  border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                  color: 'var(--color-ink)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                ← Chọn file khác
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowProposalModal(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '8px 14px', borderRadius: '8px',
                    border: '1px solid var(--color-border)', background: 'var(--color-primary-card)',
                    color: 'var(--color-primary-dark)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                  }}
                  title="Đề xuất Topic mới nếu danh mục hiện tại chưa có"
                >
                  💡 Đề xuất Topic
                </button>

                <button
                  type="button"
                  onClick={fetchApprovedTopics}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '8px 14px', borderRadius: '8px',
                    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                    color: 'var(--color-ink)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                  }}
                  title="Làm mới danh mục Topic nếu School Admin vừa duyệt thêm"
                >
                  <RefreshCw style={{ width: '13px', height: '13px' }} className={loadingTopics ? 'animate-spin' : ''} />
                  Làm mới Topic
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirming || !isAllAssigned || canonicalTopics.length === 0 || validRowsCount === 0}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '8px 22px', borderRadius: '8px',
                    background: 'var(--color-primary)', color: 'white',
                    border: 'none', fontSize: '0.8125rem', fontWeight: 700,
                    cursor: (confirming || !isAllAssigned || canonicalTopics.length === 0 || validRowsCount === 0) ? 'not-allowed' : 'pointer',
                    opacity: (confirming || !isAllAssigned || canonicalTopics.length === 0 || validRowsCount === 0) ? 0.6 : 1,
                  }}
                >
                  <Save style={{ width: '14px', height: '14px' }} />
                  {confirming ? 'Đang lưu vào bộ thẻ...' : `Xác nhận & Lưu ${assignedCount} thẻ`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BƯỚC 4: KẾT QUẢ THÀNH CÔNG */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <CheckCircle style={{ width: '52px', height: '52px', color: '#16a34a', margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 8px', fontSize: '1.15rem', color: 'var(--color-ink)' }}>
              Nhập thẻ từ file Excel thành công!
            </h4>
            <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: 'var(--color-ink-muted)' }}>
              {result?.message || `Đã nhập thành công ${result?.importedCount || assignedCount} thẻ Flashcard với đầy đủ Canonical Topic chuẩn.`}
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 24px', borderRadius: '9px',
                background: 'var(--color-primary)', color: 'white',
                border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Xem danh sách thẻ vừa nhập
            </button>
          </div>
        )}
      </Modal>

      {showProposalModal && (
        <TopicProposalModal
          subjectId={effectiveSubjectId}
          zIndex={1000}
          onClose={() => setShowProposalModal(false)}
          onProposed={fetchApprovedTopics}
        />
      )}
    </>
  );
}

function DeckRow({ deck, onEdit, onDelete, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardModal, setCardModal] = useState(null);
  const [excelModal, setExcelModal] = useState(false);
  const [deletingCard, setDeletingCard] = useState(null);
  const [shareModal, setShareModal] = useState(false);
  const [notice, setNotice] = useState(null);
  const [accessCount, setAccessCount] = useState(null); // số lớp được phép

  const loadDeckDetails = useCallback(async () => {
    setLoadingCards(true);
    try {
      const deckRes = await FlashcardService.getDeckById(deck.id);
      setCards(deckRes.data?.cards || []);
    } catch { /* ignore */ }
    finally { setLoadingCards(false); }
  }, [deck.id]);

  // Load số lớp được share khi mount
  useEffect(() => {
    FlashcardService.getClassAccess(deck.id)
      .then((res) => setAccessCount((res.data || []).length))
      .catch(() => {});
  }, [deck.id]);

  const handleToggle = () => {
    if (!open) loadDeckDetails();
    setOpen((o) => !o);
  };

  const handleDeleteCard = async (card) => {
    if (!window.confirm(`Xóa thẻ: "${card.question.slice(0, 50)}..."?`)) return;
    setDeletingCard(card.id);
    try {
      await FlashcardService.deleteCard(deck.id, card.id);
      setCards(cs => cs.filter(c => c.id !== card.id));
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa thẻ');
    } finally { setDeletingCard(null); }
  };

  return (
    <>
      {shareModal && (
        <ClassAccessModal
          deck={deck}
          onClose={() => setShareModal(false)}
          onSaved={() => {
            onRefresh();
            // Reload access count
            FlashcardService.getClassAccess(deck.id)
              .then((res) => setAccessCount((res.data || []).length))
              .catch(() => {});
          }}
        />
      )}
      {cardModal !== null && (
        <CardFormModal
          deckId={deck.id}
          subjectId={deck.subject_id || deck.subjectId}
          card={cardModal === 'create' ? null : cardModal}
          onClose={() => setCardModal(null)}
          onSaved={() => { setCardModal(null); loadDeckDetails(); }}
        />
      )}
      {excelModal && (
        <ExcelImportModal
          deckId={deck.id}
          subjectId={deck.subject_id || deck.subjectId}
          onClose={() => setExcelModal(false)}
          onSaved={() => {
            loadDeckDetails();
            onRefresh();
          }}
        />
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
        {/* ── Deck header row ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 20px', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--color-border)' : 'none',
        }} onClick={handleToggle}>
          {/* Icon */}
          <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '10px', background: 'linear-gradient(135deg, var(--color-primary) 0%, #f97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers style={{ width: '18px', height: '18px', color: 'white' }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>{deck.title}</p>
              {accessCount != null && accessCount > 0
                ? <Badge color="#0891b2" bg="rgba(8,145,178,0.1)"><Globe style={{ width: '10px', height: '10px' }} /> {accessCount} lớp–Công khai</Badge>
                : <Badge><Lock style={{ width: '10px', height: '10px' }} /> Riêng tư</Badge>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', flexWrap: 'wrap' }}>
              {deck.subject_name && (
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', padding: '1px 8px', borderRadius: '4px' }}>
                  {deck.subject_code}
                </span>
              )}
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BookOpen style={{ width: '12px', height: '12px' }} />
                {deck.card_count ?? 0} thẻ
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
            {/* Nút Chia sẻ — thay thế Publish cũ */}
            <button
              onClick={() => setShareModal(true)}
              title="Quản lý quyền xem theo lớp"
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', borderRadius: '8px',
                background: accessCount ? 'rgba(8,145,178,0.1)' : 'rgba(249,115,22,0.1)',
                color: accessCount ? '#0891b2' : 'var(--color-primary-dark)',
                border: `1px solid ${accessCount ? 'rgba(8,145,178,0.3)' : 'rgba(249,115,22,0.3)'}`,
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Share2 style={{ width: '13px', height: '13px' }} />
              Chia sẻ
            </button>
            <IconBtn onClick={() => onEdit(deck)} title="Sửa bộ thẻ"><Pencil style={{ width: '14px', height: '14px' }} /></IconBtn>
            <IconBtn onClick={() => onDelete(deck)} title="Xóa bộ thẻ" danger><Trash2 style={{ width: '14px', height: '14px' }} /></IconBtn>
          </div>

          {/* Chevron */}
          <div style={{ color: 'var(--color-ink-soft)', flexShrink: 0 }}>
            {open ? <ChevronUp style={{ width: '18px', height: '18px' }} /> : <ChevronDown style={{ width: '18px', height: '18px' }} />}
          </div>
        </div>

        {/* ── Expanded panel ── */}
        {open && (
          <div style={{ padding: '20px' }}>
            {notice && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '0.8125rem', marginBottom: '12px', background: notice.type === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: notice.type === 'success' ? '#16a34a' : '#dc2626', border: `1px solid ${notice.type === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}` }}>
                {notice.text}
              </div>
            )}

            {/* Cards section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 12px' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen style={{ width: '16px', height: '16px', color: 'var(--color-primary)' }} />
                Danh sách thẻ ({cards.length})
              </h4>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={loadDeckDetails} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-ink-muted)', fontFamily: 'var(--font-sans)' }}>
                  <RefreshCw style={{ width: '12px', height: '12px' }} className={loadingCards ? 'animate-spin' : ''} />
                  Làm mới
                </button>
                <button
                  id={`btn-add-card-${deck.id}`}
                  onClick={() => setCardModal('create')}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
                >
                  <Plus style={{ width: '13px', height: '13px' }} /> Thêm thẻ
                </button>
                <button
                  id={`btn-import-excel-${deck.id}`}
                  onClick={() => setExcelModal(true)}
                  title="Nhập danh sách thẻ từ file Excel"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '6px 12px', borderRadius: '8px',
                    background: 'var(--color-surface)', color: 'var(--color-primary-dark)',
                    border: '1px solid var(--color-border)', fontSize: '0.75rem',
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                >
                  <FileSpreadsheet style={{ width: '13px', height: '13px', color: '#16a34a' }} />
                  Nhập Excel
                </button>
              </div>
            </div>

            {/* Cards list */}
            {loadingCards ? (
              [1,2].map(i => <div key={i} className="skeleton" style={{ width: '100%', height: '56px', borderRadius: '10px', marginBottom: '8px' }} />)
            ) : cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--color-ink-muted)', background: 'var(--color-primary-bg)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                <Layers style={{ width: '28px', height: '28px', opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.8125rem', margin: '0 0 12px' }}>Chưa có thẻ nào trong bộ thẻ này.</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={() => setCardModal('create')}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <Plus style={{ width: '13px', height: '13px' }} /> Thêm thẻ thủ công
                  </button>
                  <button
                    onClick={() => setExcelModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', background: 'var(--color-surface)', color: 'var(--color-primary-dark)', border: '1px solid var(--color-border)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <FileSpreadsheet style={{ width: '13px', height: '13px', color: '#16a34a' }} /> Nhập từ Excel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cards.map((card, idx) => {
                  const dm = DIFF_META[card.difficulty] || DIFF_META.medium;
                  return (
                    <div key={card.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      padding: '12px 14px', borderRadius: '10px',
                      background: 'var(--color-primary-bg)', border: '1px solid var(--color-border)',
                    }}>
                      {/* Index */}
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-ink-soft)', fontFamily: 'var(--font-mono)', minWidth: '20px', marginTop: '2px' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 4px', lineHeight: 1.5 }}>
                          <MathText content={card.question} />
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', margin: 0, lineHeight: 1.5 }}>
                          <span>→ </span><MathText content={card.answer} inline />
                        </p>
                      </div>
                      {/* Diff badge */}
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: dm.bg, color: dm.color, flexShrink: 0, marginTop: '2px' }}>
                        {dm.label}
                      </span>
                      {/* Topic badge */}
                      {card.topic_name && (
                        <span style={{
                          fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
                          background: card.topic_review_required ? 'rgba(234, 179, 8, 0.12)' : 'rgba(59, 130, 246, 0.1)',
                          color: card.topic_review_required ? '#b45309' : '#2563eb',
                          border: `1px solid ${card.topic_review_required ? 'rgba(234, 179, 8, 0.3)' : 'rgba(59, 130, 246, 0.25)'}`,
                          flexShrink: 0, marginTop: '2px', display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}>
                          {card.topic_review_required ? '⚠️ [Legacy] ' : '🏷️ '}
                          {card.topic_code ? `[${card.topic_code}] ` : ''}
                          {card.topic_name}
                        </span>
                      )}
                      {/* Edit / Delete */}
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <IconBtn onClick={() => setCardModal(card)} title="Sửa thẻ"><Pencil style={{ width: '12px', height: '12px' }} /></IconBtn>
                        <IconBtn onClick={() => handleDeleteCard(card)} title="Xóa thẻ" danger disabled={deletingCard === card.id}>
                          {deletingCard === card.id ? <RefreshCw style={{ width: '12px', height: '12px' }} className="animate-spin" /> : <Trash2 style={{ width: '12px', height: '12px' }} />}
                        </IconBtn>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LecturerFlashcardsPage() {
  const { t } = useLanguage();
  const { subjectId } = useParams();
  const navigate = useNavigate();

  // Thông tin môn học (lấy từ danh sách lớp của GV)
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [subjectLoading, setSubjectLoading] = useState(!!subjectId);

  const [decks, setDecks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deckModal, setDeckModal] = useState(null);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const LIMIT = 10;

  // Lấy thông tin môn từ danh sách lớp
  useEffect(() => {
    if (!subjectId) { setSubjectLoading(false); return; }
    setSubjectLoading(true);
    ClassService.getMyClasses()
      .then((res) => {
        const match = (res.data || []).find((c) => c.subject_id === subjectId);
        setSubjectInfo(match
          ? { id: match.subject_id, name: match.subject_name, code: match.subject_code }
          : null
        );
      })
      .catch(() => setSubjectInfo(null))
      .finally(() => setSubjectLoading(false));
  }, [subjectId]);

  const fetchDecks = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page, limit: LIMIT };
      if (subjectId) params.subject_id = subjectId;
      const res = await FlashcardService.getDecks(params);
      setDecks(res.data || []);
      setTotal(res.pagination?.total ?? (res.data?.length || 0));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách bộ thẻ.');
    } finally {
      setLoading(false);
    }
  }, [page, subjectId]);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  const handleDelete = async (deck) => {
    if (!window.confirm(`Xóa bộ thẻ "${deck.title}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(deck.id);
    try {
      await FlashcardService.deleteDeck(deck.id);
      fetchDecks();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa bộ thẻ');
    } finally { setDeleting(null); }
  };

  const handlePublish = async (deckId) => {
    await FlashcardService.publishDeck(deckId);
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;

  return (
    <>
      {deckModal !== null && (
        <DeckFormModal
          deck={deckModal === 'create' ? null : deckModal}
          onClose={() => setDeckModal(null)}
          onSaved={() => { setDeckModal(null); fetchDecks(); }}
          classInfo={subjectId ? { subject_id: subjectId, subject_name: subjectInfo?.name } : null}
        />
      )}

      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Breadcrumb ── */}
        {subjectId && (
          <button
            onClick={() => {
              localStorage.removeItem('lecturer_last_subject_id');
              navigate('/lecturer/flashcards');
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '9px',
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              color: 'var(--color-ink-muted)', fontSize: '0.8125rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)', alignSelf: 'flex-start',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary-dark)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-ink-muted)'; }}
          >
            <ArrowLeft style={{ width: '14px', height: '14px' }} />
            Chọn môn khác
          </button>
        )}

        {/* ── Hero Banner ── */}
        <div style={{
          borderRadius: '20px', padding: '28px 32px', color: 'white', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f2027 0%, #1e3a5f 50%, #0f2027 100%)',
        }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '260px', height: '260px', background: 'rgba(249,115,22,0.2)', borderRadius: '50%', filter: 'blur(70px)', transform: 'translate(60px, -60px)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#fed7aa', fontWeight: 600, marginBottom: '12px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />
              Quản lý Flashcard · Giảng viên
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Bộ thẻ ghi nhớ của tôi
            </h1>
            {/* Hiển thị tên môn học nếu đã chọn */}
            {subjectId && subjectInfo && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '10px',
                padding: '5px 14px', borderRadius: '9999px',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
              }}>
                <span style={{ fontSize: '0.75rem', color: '#e2e8f0', fontWeight: 600 }}>
                  📚 {subjectInfo.name}
                </span>
                {subjectInfo.code && (
                  <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>· {subjectInfo.code}</span>
                )}
              </div>
            )}
            {subjectId && !subjectInfo && !subjectLoading && (
              <p style={{ marginTop: '8px', color: '#94a3b8', fontSize: '0.875rem' }}>
                Tạo và quản lý các bộ flashcard cho sinh viên.
              </p>
            )}
            {!subjectId && (
              <p style={{ marginTop: '8px', color: '#94a3b8', fontSize: '0.875rem', maxWidth: '520px' }}>
                Tạo và quản lý các bộ flashcard cho sinh viên. Theo dõi tiến độ ôn luyện và công bố bộ thẻ khi hoàn chỉnh.
              </p>
            )}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
            {loading ? '...' : `${total} bộ thẻ`}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={fetchDecks}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '9px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink-muted)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              <RefreshCw style={{ width: '14px', height: '14px' }} className={loading ? 'animate-spin' : ''} />
              Làm mới
            </button>
            <button
              id="btn-create-deck"
              onClick={() => setDeckModal('create')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '9px', background: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Tạo bộ thẻ mới
            </button>
          </div>
        </div>

        {/* ── Deck list ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ width: '100%', height: '72px', borderRadius: '16px' }} />)}
          </div>
        ) : error ? (
          <div style={{ padding: '24px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', color: '#ef4444', textAlign: 'center', border: '1px solid rgba(220,38,38,0.2)' }}>
            <AlertTriangle style={{ width: '24px', height: '24px', display: 'block', margin: '0 auto 8px' }} />
            {error}
          </div>
        ) : decks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px dashed var(--color-border)' }}>
            <Layers style={{ width: '48px', height: '48px', opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 6px' }}>Chưa có bộ thẻ nào</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', margin: '0 0 16px' }}>Bắt đầu bằng cách tạo bộ thẻ đầu tiên.</p>
            <button onClick={() => setDeckModal('create')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '9px', background: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
              <Plus style={{ width: '15px', height: '15px' }} /> Tạo bộ thẻ đầu tiên
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {decks.map(deck => (
              <DeckRow
                key={deck.id}
                deck={deck}
                onEdit={setDeckModal}
                onDelete={handleDelete}
                onRefresh={fetchDecks}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink-muted)', fontSize: '0.8125rem', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontFamily: 'var(--font-sans)' }}>
              ← Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono)', borderColor: p === page ? 'var(--color-primary)' : 'var(--color-border)', background: p === page ? 'var(--color-primary-card)' : 'var(--color-surface)', color: p === page ? 'var(--color-primary-dark)' : 'var(--color-ink-muted)' }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-ink-muted)', fontSize: '0.8125rem', fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1, fontFamily: 'var(--font-sans)' }}>
              Tiếp →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
