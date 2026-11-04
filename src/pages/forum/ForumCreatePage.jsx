import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Image, Link, Send, Smile, Paperclip } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ForumService from '../../services/forum.service';
import FlashcardService from '../../services/flashcard.service';
import ClassService from '../../services/class.service';
import { getSubjects } from '../../services/subject.service';

export default function ForumCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const postType = params.get('type') === 'CONFESSION' ? 'CONFESSION' : 'DISCUSSION';
  const attachFlashcard = params.get('attach') === 'flashcard' && user?.role === 'lecturer';
  const [form, setForm] = useState({ title: '', content: '', flashcardDeckId: '', visibility: 'PUBLIC', classIds: [], isAnonymous: postType === 'CONFESSION' });
  const [attachments, setAttachments] = useState([]); const contentRef = useRef(null); const fileRef = useRef(null);
  const [decks, setDecks] = useState([]); const [subjects, setSubjects] = useState([]); const [classes, setClasses] = useState([]); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const [flashcardSubjectId, setFlashcardSubjectId] = useState('');
  const flashcardSubjects = Array.from(new Map(decks.map((deck) => [deck.subject_id, { id: deck.subject_id, name: deck.subject_name || deck.subject_code || 'Môn học' }]).filter(([id]) => id)).values());
  const subjectOptions = subjects.length ? subjects : flashcardSubjects;
  const availableDecks = attachFlashcard && flashcardSubjectId ? decks.filter((deck) => deck.subject_id === flashcardSubjectId) : decks;

  useEffect(() => {
    FlashcardService.getDecks({ page: 1, limit: 100 }).then((r) => setDecks(r.data?.data || r.data || [])).catch(() => {});
    if (attachFlashcard) getSubjects({ page: 1, limit: 100 }).then((r) => setSubjects(r.data?.data || r.data || [])).catch(() => {});
    ClassService.getMyClasses().then((r) => setClasses(r.data?.data || r.data || [])).catch(() => {});
  }, [attachFlashcard]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    try {
      setSaving(true); setError('');
      await ForumService.createPost({ title: form.title.trim(), content: form.content.trim(), flashcardDeckId: user?.role === 'student' ? null : (form.flashcardDeckId || null), visibility: user?.role === 'student' ? 'PUBLIC' : form.visibility, classIds: form.visibility === 'CLASS_ONLY' ? form.classIds : [], postType, isAnonymous: user?.role === 'student' && postType === 'CONFESSION' ? form.isAnonymous : false, attachments });
      navigate(`/${user?.role || 'student'}/forum`);
    } catch (err) { setError(err.response?.data?.message || 'Không thể đăng bài.'); } finally { setSaving(false); }
  };

  const formatSelection = (prefix, suffix = prefix) => {
    const input = contentRef.current; if (!input) return;
    const start = input.selectionStart; const end = input.selectionEnd; const selected = form.content.slice(start, end) || 'nội dung';
    const content = `${form.content.slice(0, start)}${prefix}${selected}${suffix}${form.content.slice(end)}`;
    setForm((prev) => ({ ...prev, content }));
    requestAnimationFrame(() => { input.focus(); input.setSelectionRange(start + prefix.length, start + prefix.length + selected.length); });
  };
  const addLink = () => { const url = window.prompt('Nhập đường dẫn'); if (url?.trim()) formatSelection(`[`, `](${url.trim()})`); };
  const addEmoji = () => { const input = contentRef.current; const pos = input?.selectionStart ?? form.content.length; setForm((prev) => ({ ...prev, content: `${prev.content.slice(0, pos)}🙂${prev.content.slice(pos)}` })); };
  const chooseFiles = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5 - attachments.length).filter((file) => file.size <= 2 * 1024 * 1024);
    const encoded = await Promise.all(files.map((file) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: reader.result }); reader.readAsDataURL(file); })));
    setAttachments((prev) => [...prev, ...encoded].slice(0, 5));
    event.target.value = '';
  };

  return <main style={pageStyle}><button type="button" className="btn" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Quay lại diễn đàn</button>{!attachFlashcard && <div style={crumbStyle}>CỘNG ĐỒNG <span>›</span> <strong>{postType === 'CONFESSION' ? 'Confession' : 'Hỏi đáp'}</strong></div>}<form onSubmit={submit} style={formStyle}><div style={titleRow}><span style={attachFlashcard ? flashcardBadge : (postType === 'CONFESSION' ? confessionBadge : discussionBadge)}>{attachFlashcard ? 'Flashcard' : (postType === 'CONFESSION' ? 'Confession' : 'Hỏi Đáp')}</span><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tiêu đề" required style={titleInput} /></div><div style={{ color: 'var(--color-ink-muted)', margin: '12px 0 18px' }}>{attachFlashcard ? 'Chia sẻ bộ Flashcard theo môn học' : (postType === 'CONFESSION' ? 'Chia sẻ suy nghĩ hoặc câu chuyện của bạn' : 'Hỏi đáp về học tập, công nghệ hoặc các vấn đề khác')}</div><div style={toolbar}><button type="button" style={toolButton} onClick={() => formatSelection('**')}><strong>B</strong></button><button type="button" style={toolButton} onClick={() => formatSelection('*')}><em>I</em></button><button type="button" style={toolButton} onClick={addLink}><Link size={18} /></button><button type="button" style={toolButton} onClick={() => fileRef.current?.click()}><Image size={18} /></button><button type="button" style={toolButton} onClick={addEmoji}><Smile size={18} /></button><button type="button" style={toolButton} onClick={() => fileRef.current?.click()}><Paperclip size={18} /></button><input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={chooseFiles} style={{ display: 'none' }} /></div><textarea ref={contentRef} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder={attachFlashcard ? 'Nội dung giới thiệu Flashcard...' : (postType === 'CONFESSION' ? 'Bạn muốn chia sẻ điều gì?' : 'Nội dung câu hỏi của bạn...')} required rows={10} style={contentInput} />{attachments.length > 0 && <div style={fileList}>{attachments.map((file, index) => <span key={`${file.name}-${index}`}>{file.name}<button type="button" onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}>×</button></span>)}</div>}{error && <div style={errorStyle}>{error}</div>}{user?.role !== 'student' && attachFlashcard && <div><label style={fieldLabel}>Chọn môn học</label><select value={flashcardSubjectId} onChange={(e) => { setFlashcardSubjectId(e.target.value); setForm((prev) => ({ ...prev, flashcardDeckId: '' })); }} style={fieldStyle} required><option value="">Chọn môn học</option>{subjectOptions.map((subject) => <option key={subject.id} value={subject.id}>{subject.code ? `${subject.code} · ` : ''}{subject.name}</option>)}</select></div>}{user?.role !== 'student' && <div><label style={fieldLabel}>{attachFlashcard ? 'Chọn FlashCard thuộc môn đã chọn' : 'FlashCard liên quan'}</label><select value={form.flashcardDeckId} onChange={(e) => setForm({ ...form, flashcardDeckId: e.target.value })} style={fieldStyle} required={attachFlashcard} disabled={attachFlashcard && !flashcardSubjectId}><option value="">{attachFlashcard ? 'Chọn bộ FlashCard' : 'Không gắn FlashCard'}</option>{availableDecks.map((d) => <option key={d.id} value={d.id}>{d.subject_code ? `${d.subject_code} · ` : ''}{d.title}{d.subject_name ? ` — ${d.subject_name}` : ''}</option>)}</select></div>}{user?.role !== 'student' && <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value, classIds: [] })} style={fieldStyle}><option value="PUBLIC">Công khai toàn hệ thống</option><option value="CLASS_ONLY">Chỉ chia sẻ cho lớp tôi dạy</option></select>}{form.visibility === 'CLASS_ONLY' && <div style={classBox}>{classes.map((item) => <label key={item.id}><input type="checkbox" checked={form.classIds.includes(item.id)} onChange={(e) => setForm((p) => ({ ...p, classIds: e.target.checked ? [...p.classIds, item.id] : p.classIds.filter((id) => id !== item.id) }))} /> {item.class_code || item.code || item.name}</label>)}</div>}{postType === 'CONFESSION' && user?.role === 'student' && <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '10px 0' }}><input type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })} /> Đăng ẩn danh</label>}<div style={actions}><button type="button" className="btn" onClick={() => navigate(-1)}>Hủy</button><button className="btn btn-primary" disabled={saving}><Send size={16} /> {saving ? 'Đang đăng...' : 'Đăng bài'}</button></div></form></main>;
}

const pageStyle = { maxWidth: 980, margin: '0 auto', padding: '28px 24px 80px' }; const crumbStyle = { margin: '22px 0 14px', color: 'var(--color-ink-muted)' }; const formStyle = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 18, boxShadow: 'var(--shadow-md)' }; const titleRow = { display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--color-border)', borderRadius: 10, padding: 10 }; const discussionBadge = { background: '#fff26a', color: '#3d3700', borderRadius: 999, padding: '4px 9px', fontSize: 12, fontWeight: 800 }; const flashcardBadge = { background: '#d9f5f1', color: '#087f73', borderRadius: 999, padding: '4px 9px', fontSize: 12, fontWeight: 800 }; const confessionBadge = { background: '#fce8f1', color: '#b42363', borderRadius: 999, padding: '4px 9px', fontSize: 12, fontWeight: 800 }; const titleInput = { flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: 'var(--color-ink)', font: 'inherit', fontSize: 22 }; const toolbar = { display: 'flex', gap: 18, color: 'var(--color-primary-dark)', padding: '12px 14px', border: '1px solid var(--color-border)', borderBottom: 0, borderRadius: '10px 10px 0 0' }; const contentInput = { width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 210, border: '1px solid var(--color-border)', borderRadius: '0 0 10px 10px', padding: 16, background: 'var(--color-surface)', color: 'var(--color-ink)', font: 'inherit', lineHeight: 1.6 }; const fieldLabel = { display: 'block', marginTop: 12, color: 'var(--color-ink)', fontWeight: 700, fontSize: 13 }; const fieldStyle = { width: '100%', marginTop: 6, border: '1px solid var(--color-border-medium)', borderRadius: 8, padding: 10, background: 'var(--color-surface)', color: 'var(--color-ink)', font: 'inherit' }; const classBox = { display: 'grid', gap: 8, marginTop: 12, padding: 12, border: '1px solid var(--color-border)', borderRadius: 8 }; const actions = { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }; const errorStyle = { color: '#b42318', background: '#fff1f0', padding: 10, borderRadius: 8, marginTop: 12 };
const toolButton = { border: 0, background: 'transparent', color: 'var(--color-primary-dark)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', font: 'inherit', padding: 0 };
const fileList = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 };
