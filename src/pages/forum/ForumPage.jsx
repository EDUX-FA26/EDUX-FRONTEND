import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Send, ExternalLink, Plus, Search, Reply, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ForumService from '../../services/forum.service';
import FlashcardService from '../../services/flashcard.service';
import ClassService from '../../services/class.service';

const initialForm = { title: '', content: '', flashcardDeckId: '', visibility: 'PUBLIC', classIds: [] };

export default function ForumPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canPost = ['lecturer', 'admin'].includes(user?.role);
  const [posts, setPosts] = useState([]);
  const [decks, setDecks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({ q: '', author: '', classId: '', page: 1 });
  const [totalPages, setTotalPages] = useState(1);
  const [commentText, setCommentText] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [replyTo, setReplyTo] = useState({});
  const [showComposer, setShowComposer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = async () => {
    try {
      setLoading(true);
      const result = await ForumService.listPosts({ ...filters, limit: 10 });
      setPosts(result.data?.data || result.data || []);
      setTotalPages(result.data?.totalPages || result.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải diễn đàn.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    loadPosts();
    if (canPost) {
      FlashcardService.getDecks({ page: 1, limit: 100 }).then((result) => {
        setDecks(result.data?.data || result.data || []);
      }).catch(() => {});
    }
    ClassService.getMyClasses().then((result) => setClasses(result.data?.data || result.data || [])).catch(() => {});
  }, [canPost, filters.page, filters.q, filters.author, filters.classId]);

  const submitPost = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    try {
      setSaving(true); setError('');
      await ForumService.createPost({
        title: form.title.trim(), content: form.content.trim(),
        flashcardDeckId: form.flashcardDeckId || null,
        visibility: form.visibility,
        classIds: form.visibility === 'CLASS_ONLY' ? form.classIds : [],
      });
      setForm(initialForm); setShowComposer(false); setFilters((prev) => ({ ...prev, page: 1 })); await loadPosts();
    } catch (err) { setError(err.response?.data?.message || 'Không thể đăng bài.'); }
    finally { setSaving(false); }
  };

  const toggleLike = async (postId) => {
    const current = posts.find((post) => post.id === postId);
    if (!current) return;
    const nextLiked = !current.liked_by_me;
    setPosts((items) => items.map((post) => post.id === postId
      ? { ...post, liked_by_me: nextLiked, like_count: Math.max(0, (post.like_count || 0) + (nextLiked ? 1 : -1)) }
      : post));
    try {
      const result = await ForumService.toggleLike(postId);
      const liked = result.data?.liked ?? result.liked ?? nextLiked;
      setPosts((items) => items.map((post) => post.id === postId
        ? { ...post, liked_by_me: liked, like_count: Math.max(0, (post.like_count || 0) + (liked === nextLiked ? 0 : (liked ? 1 : -1))) }
        : post));
    } catch (err) {
      setPosts((items) => items.map((post) => post.id === postId ? current : post));
      setError(err.response?.data?.message || 'Không thể cập nhật lượt thích.');
    }
  };

  const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments((prev) => ({ ...prev, [postId]: false }));
      return;
    }
    try {
      const result = await ForumService.getPost(postId);
      setCommentsByPost((prev) => ({ ...prev, [postId]: result.data?.comments || result.comments || [] }));
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải bình luận.');
    }
  };

  const submitComment = async (postId, parentId = null) => {
    const content = commentText[postId]?.trim();
    if (!content) return;
    try {
      const result = await ForumService.addComment(postId, { content, parentId });
      const added = result.data || result;
      setCommentText((prev) => ({ ...prev, [postId]: '' }));
      setReplyTo((prev) => ({ ...prev, [postId]: null }));
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), { ...added, author_name: user?.full_name || 'Bạn', author_role: user?.role }],
      }));
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
      setPosts((items) => items.map((post) => post.id === postId
        ? { ...post, comment_count: (post.comment_count || 0) + 1 }
        : post));
    } catch (err) { setError(err.response?.data?.message || 'Không thể gửi bình luận.'); }
  };

  const openFlashcard = (post) => {
    if (!post.flashcard_deck_id) return;
    if (user?.role === 'student') navigate(`/student/flashcards/${post.flashcard_deck_id}/study`);
    else navigate('/lecturer/flashcards');
  };

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div><p style={{ color: '#bd4b0a', fontWeight: 800, letterSpacing: 1, margin: 0 }}>EDUX COMMUNITY</p><h1 style={{ margin: '6px 0', fontSize: '2rem' }}>Diễn đàn học tập</h1><p style={{ color: '#68738a', margin: 0 }}>Trao đổi bài học, FlashCard và kinh nghiệm học tập cùng cộng đồng EDUX.</p></div>
        {canPost && <button className="btn btn-primary" onClick={() => setShowComposer((v) => !v)}><Plus size={17} /> Đăng bài</button>}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); setFilters((prev) => ({ ...prev, page: 1 })); }} style={{ background: '#fff', border: '1px solid #f1dfd4', borderRadius: 16, padding: 14, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 260px', position: 'relative' }}><Search size={17} style={{ position: 'absolute', left: 12, top: 12, color: '#8c7166' }} /><input value={filters.q} onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))} placeholder="Tìm theo tiêu đề hoặc nội dung..." style={{ ...inputStyle, paddingLeft: 36, margin: 0 }} /></div>
          <input value={filters.author} onChange={(e) => setFilters((prev) => ({ ...prev, author: e.target.value }))} placeholder="Tìm theo giảng viên..." style={{ ...inputStyle, flex: '1 1 190px', margin: 0 }} />
          <select value={filters.classId} onChange={(e) => setFilters((prev) => ({ ...prev, classId: e.target.value, page: 1 }))} style={{ ...inputStyle, flex: '1 1 160px', margin: 0 }}><option value="">Tất cả lớp</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.class_code || item.code || item.name}</option>)}</select>
          <button className="btn btn-primary" type="submit"><Search size={16} /> Tìm</button>
        </div>
      </form>
      {error && <div style={{ color: '#b42318', background: '#fff1f0', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>{error}</div>}
      {showComposer && canPost && <form onSubmit={submitPost} style={{ background: '#fff', border: '1px solid #f1dfd4', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Tạo bài đăng</h3>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tiêu đề bài đăng" required style={inputStyle} />
        <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Nội dung trao đổi..." required rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value, classIds: [] })} style={inputStyle}><option value="PUBLIC">Công khai toàn hệ thống</option><option value="CLASS_ONLY">Chỉ chia sẻ cho lớp tôi dạy</option></select>
        {form.visibility === 'CLASS_ONLY' && <div style={{ border: '1px solid #e8d8cc', borderRadius: 10, padding: 12, marginBottom: 12 }}><strong style={{ display: 'block', marginBottom: 8 }}>Chọn lớp nhận bài đăng</strong>{classes.length === 0 ? <small>Chưa có lớp được phân công.</small> : classes.map((item) => <label key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}><input type="checkbox" checked={form.classIds.includes(item.id)} onChange={(e) => setForm((prev) => ({ ...prev, classIds: e.target.checked ? [...prev.classIds, item.id] : prev.classIds.filter((id) => id !== item.id) }))} />{item.class_code || item.code || item.name}</label>)}</div>}
        <select value={form.flashcardDeckId} onChange={(e) => setForm({ ...form, flashcardDeckId: e.target.value })} style={inputStyle}><option value="">Không gắn FlashCard</option>{decks.map((d) => <option key={d.id} value={d.id}>{d.title}{d.subject_name ? ` — ${d.subject_name}` : ''}</option>)}</select>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button type="button" className="btn" onClick={() => setShowComposer(false)}>Hủy</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Đang đăng...' : 'Đăng bài'}</button></div>
      </form>}
      {loading ? <div style={{ padding: 32, textAlign: 'center' }}>Đang tải bài đăng...</div> : posts.length === 0 ? <div style={emptyStyle}>Chưa có bài đăng nào.</div> : posts.map((post) => <article key={post.id} style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div><strong>{post.author_name || 'EDUX User'}</strong><span style={{ color: '#8c7166', marginLeft: 8, fontSize: 13 }}>{post.author_role}</span><h2 style={{ margin: '8px 0 5px', fontSize: '1.15rem' }}>{post.title}</h2></div><time style={{ color: '#8c7166', fontSize: 12 }}>{new Date(post.created_at).toLocaleDateString('vi-VN')}</time></div>
        <p style={{ whiteSpace: 'pre-wrap', color: '#4e596b', lineHeight: 1.6 }}>{post.content}</p>
        {(post.subject_name || post.flashcard_deck_id) && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>{post.subject_name && <span style={tagStyle}>{post.subject_code || 'Môn học'} · {post.subject_name}</span>}{post.flashcard_deck_id && <button type="button" style={linkStyle} onClick={() => openFlashcard(post)}><ExternalLink size={14} /> Mở FlashCard{post.flashcard_title ? `: ${post.flashcard_title}` : ''}</button>}</div>}
        <div style={{ display: 'flex', gap: 18, borderTop: '1px solid #f1e7df', paddingTop: 12 }}><button type="button" style={actionStyle} onClick={() => toggleLike(post.id)}><Heart size={17} fill={post.liked_by_me ? '#ef6820' : 'none'} color={post.liked_by_me ? '#ef6820' : 'currentColor'} /> {post.like_count || 0}</button><button type="button" style={actionStyle} onClick={() => toggleComments(post.id)} aria-expanded={Boolean(expandedComments[post.id])}><MessageCircle size={17} /> {post.comment_count || 0} Bình luận</button></div>
        {expandedComments[post.id] && <div style={{ marginTop: 14, borderTop: '1px solid #f1e7df', paddingTop: 12 }}>
          {(commentsByPost[post.id] || []).length === 0 ? <p style={{ color: '#8c7166', fontSize: 13 }}>Chưa có bình luận. Hãy bắt đầu trao đổi.</p> : (commentsByPost[post.id] || []).map((comment) => <div key={comment.id} style={{ background: '#fff8f5', borderRadius: 10, padding: '9px 12px', marginBottom: 8, marginLeft: comment.parent_id ? 28 : 0 }}><strong style={{ fontSize: 13 }}>{comment.author_name || 'EDUX User'}</strong><p style={{ margin: '4px 0 6px', whiteSpace: 'pre-wrap', color: '#4e596b' }}>{comment.content}</p><button type="button" style={{ ...actionStyle, fontSize: 12 }} onClick={() => setReplyTo((prev) => ({ ...prev, [post.id]: comment.id }))}><Reply size={14} /> Trả lời</button>{replyTo[post.id] === comment.id && <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><input autoFocus value={commentText[post.id] || ''} onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(post.id, comment.id); } }} placeholder="Viết câu trả lời..." style={{ ...inputStyle, margin: 0 }} /><button type="button" className="btn btn-primary" onClick={() => submitComment(post.id, comment.id)}><Send size={16} /></button><button type="button" className="btn" onClick={() => setReplyTo((prev) => ({ ...prev, [post.id]: null }))}><X size={16} /></button></div>}</div>)}
          <div style={{ display: 'flex', gap: 8 }}><input value={commentText[post.id] || ''} onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(post.id, replyTo[post.id] || null); } }} placeholder={replyTo[post.id] ? 'Viết câu trả lời...' : 'Viết bình luận...'} style={{ ...inputStyle, margin: 0 }} /><button type="button" className="btn btn-primary" onClick={() => submitComment(post.id, replyTo[post.id] || null)}><Send size={16} /></button></div>
        </div>}
      </article>)}
      {!loading && totalPages > 1 && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 }}><button type="button" className="btn" disabled={filters.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}>Trước</button><span>Trang {filters.page} / {totalPages}</span><button type="button" className="btn" disabled={filters.page >= totalPages} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}>Sau</button></div>}
    </main>
  );
}

const inputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid #e8d8cc', borderRadius: 10, padding: '11px 13px', marginBottom: 12, font: 'inherit' };
const cardStyle = { background: '#fff', border: '1px solid #f1dfd4', borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 4px 16px rgba(104,58,36,.04)' };
const emptyStyle = { background: '#fff', borderRadius: 16, padding: 48, textAlign: 'center', color: '#68738a' };
const tagStyle = { background: '#fff2e9', color: '#b64d12', borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 700 };
const linkStyle = { border: 0, background: '#e5f7f4', color: '#087d73', borderRadius: 999, padding: '5px 10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' };
const actionStyle = { border: 0, background: 'transparent', color: '#68738a', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0 };
