import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import FlashcardService from '../../services/flashcard.service';
import ClassService from '../../services/class.service';
import {
  Plus, Pencil, Trash2, Globe, Lock, Layers, BookOpen,
  BarChart2, ChevronDown, ChevronUp, X, Save, Eye,
  CheckCircle, RefreshCw, Zap, AlertTriangle, ArrowLeft,
  Users, Share2,
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

function Modal({ title, onClose, children, width = '560px', padding = '16px 20px' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
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

        {!isEdit && (
          <Field label="Hiển thị">
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { val: false, label: '🔒 Riêng tư', desc: 'Chỉ mình bạn xem được' },
                { val: true,  label: '🌐 Công khai', desc: 'Mọi sinh viên đều thấy' },
              ].map(({ val, label, desc }) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_public: val }))}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    borderColor: form.is_public === val ? 'var(--color-primary)' : 'var(--color-border)',
                    background: form.is_public === val ? 'var(--color-primary-card)' : 'var(--color-surface)',
                  }}
                >
                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: form.is_public === val ? 'var(--color-primary-dark)' : 'var(--color-ink)', margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--color-ink-muted)', margin: 0 }}>{desc}</p>
                </button>
              ))}
            </div>
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

// ─── Card Form Modal ──────────────────────────────────────────────────────────

function CardFormModal({ deckId, card, onClose, onSaved }) {
  const isEdit = !!card;
  const [form, setForm] = useState({
    type: card?.type || 'essay',
    question: card?.question || '',
    answer: card?.answer || '',
    explanation: card?.explanation || '',
    difficulty: card?.difficulty || 'medium',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) { setError('Câu hỏi và đáp án không được để trống'); return; }
    setSaving(true); setError(null);
    try {
      if (isEdit) {
        await FlashcardService.updateCard(deckId, { ...form, cardId: card.id });
      } else {
        await FlashcardService.createCard(deckId, form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? '✏️ Sửa thẻ' : '➕ Thêm thẻ mới'} onClose={onClose} width="580px" padding="16px 20px">
      <form onSubmit={handleSubmit}>
        <Field label="Loại thẻ">
          <div style={{ display: 'flex', gap: '8px' }}>
            {[{ val: 'essay', label: '📝 Tự luận' }, { val: 'multiple_choice', label: '🔘 Trắc nghiệm' }].map(({ val, label }) => (
              <button key={val} type="button" onClick={() => setForm(f => ({ ...f, type: val }))} style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1.5px solid', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.15s', fontFamily: 'var(--font-sans)', borderColor: form.type === val ? 'var(--color-primary)' : 'var(--color-border)', background: form.type === val ? 'var(--color-primary-card)' : 'var(--color-surface)', color: form.type === val ? 'var(--color-primary-dark)' : 'var(--color-ink-muted)' }}>
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Câu hỏi" required>
          <textarea rows={2} style={{ ...inputStyle, minHeight: '40px', resize: 'vertical', padding: '6px 10px' }} value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="Nhập câu hỏi..." />
        </Field>

        <Field label="Đáp án" required>
          <textarea rows={2} style={{ ...inputStyle, minHeight: '40px', resize: 'vertical', padding: '6px 10px' }} value={form.answer} onChange={e => setForm(f => ({ ...f, answer: e.target.value }))} placeholder="Nhập đáp án chính xác..." />
        </Field>

        <Field label="Giải thích (tùy chọn)">
          <textarea rows={1} style={{ ...inputStyle, minHeight: '34px', resize: 'vertical', padding: '6px 10px' }} value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} placeholder="Giải thích thêm (hiển thị sau khi lật thẻ)..." />
        </Field>

        <Field label="Độ khó">
          <div style={{ display: 'flex', gap: '8px' }}>
            {Object.entries(DIFF_META).map(([val, { label, color, bg }]) => (
              <button key={val} type="button" onClick={() => setForm(f => ({ ...f, difficulty: val }))} style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1.5px solid', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.15s', fontFamily: 'var(--font-sans)', borderColor: form.difficulty === val ? color : 'var(--color-border)', background: form.difficulty === val ? bg : 'var(--color-surface)', color: form.difficulty === val ? color : 'var(--color-ink-muted)' }}>
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
          <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 18px', borderRadius: '8px', background: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '0.8125rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-sans)' }}>
            <Save style={{ width: '14px', height: '14px' }} />
            {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm thẻ'}
          </button>
        </div>
      </form>
    </Modal>
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

function DeckRow({ deck, onEdit, onDelete, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardModal, setCardModal] = useState(null);
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
          card={cardModal === 'create' ? null : cardModal}
          onClose={() => setCardModal(null)}
          onSaved={() => { setCardModal(null); loadDeckDetails(); }}
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
              </div>
            </div>

            {/* Cards list */}
            {loadingCards ? (
              [1,2].map(i => <div key={i} className="skeleton" style={{ width: '100%', height: '56px', borderRadius: '10px', marginBottom: '8px' }} />)
            ) : cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-ink-muted)', background: 'var(--color-primary-bg)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                <Layers style={{ width: '28px', height: '28px', opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.8125rem' }}>Chưa có thẻ nào. Nhấn "Thêm thẻ" để bắt đầu.</p>
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
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {card.question}
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          → {card.answer}
                        </p>
                      </div>
                      {/* Diff badge */}
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: dm.bg, color: dm.color, flexShrink: 0, marginTop: '2px' }}>
                        {dm.label}
                      </span>
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
    localStorage.setItem('lecturer_last_subject_id', subjectId);
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
              navigate('/lecturer/flashcards?select=true');
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
