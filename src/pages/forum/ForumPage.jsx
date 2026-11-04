import React, { useEffect, useState } from 'react';
import { Heart, MessageCircle, Send, ExternalLink, Plus, Search, Reply, X, Smile, Image, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ForumService from '../../services/forum.service';
import FlashcardService from '../../services/flashcard.service';
import ClassService from '../../services/class.service';

const initialForm = { title: '', content: '', flashcardDeckId: '', visibility: 'PUBLIC', classIds: [], isAnonymous: false, postType: 'DISCUSSION' };

export default function ForumPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canPost = ['student', 'lecturer', 'admin'].includes(user?.role);
  const [posts, setPosts] = useState([]);
  const [decks, setDecks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({ q: '', author: '', classId: '', page: 1, type: '', sort: 'latest' });
  const [totalPages, setTotalPages] = useState(1);
  const [commentText, setCommentText] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [replyTo, setReplyTo] = useState({});
  const [showComposer, setShowComposer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profileStats, setProfileStats] = useState(null);
  const [loungeText, setLoungeText] = useState('');
  const [loungeMessages, setLoungeMessages] = useState([
    { id: 'welcome-1', name: 'EDUX Community', text: 'Chào mừng mọi người đến khu vực tán gẫu linh tinh!', time: 'Vừa xong' },
    { id: 'welcome-2', name: 'EDUX Community', text: 'Hãy giữ cuộc trò chuyện văn minh và hỗ trợ nhau nhé.', time: 'Vừa xong' },
  ]);

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
    ForumService.getMyStats().then((result) => setProfileStats(result.data || result)).catch(() => {});
  }, [canPost, filters.page, filters.q, filters.author, filters.classId, filters.type, filters.sort]);

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
        postType: form.postType,
        isAnonymous: user?.role === 'student' ? form.isAnonymous : false,
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

  const sendLoungeMessage = (event) => {
    event.preventDefault();
    const text = loungeText.trim();
    if (!text) return;
    setLoungeMessages((items) => [...items, { id: `local-${Date.now()}`, name: user?.full_name || 'Bạn', text, time: 'Vừa xong' }]);
    setLoungeText('');
  };

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 80px', color: '#f2f5f8' }}>
      <div style={forumLayout}>
      <section style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div><p style={{ color: 'var(--color-primary-dark)', fontWeight: 800, letterSpacing: 1, margin: 0 }}>EDUX COMMUNITY</p><h1 style={{ margin: '6px 0', fontSize: '2rem', color: 'var(--color-ink)' }}>Diễn đàn học tập</h1><p style={{ color: 'var(--color-ink-muted)', margin: 0 }}>Trao đổi bài học, FlashCard và kinh nghiệm học tập cùng cộng đồng EDUX.</p></div>
        {canPost && <button className="btn btn-primary" onClick={() => setShowComposer((v) => !v)}><Plus size={17} /> Đăng bài</button>}
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #eadbd2', marginBottom: 16, overflowX: 'auto' }}>
        {[['', 'Thảo luận'], ['CONFESSION', 'Confession mới'], ['popular', 'Xem nhiều']].map(([value, label]) => {
          const active = value === 'popular' ? filters.sort === 'popular' : filters.type === value && filters.sort === 'latest';
          return <button key={label} type="button" onClick={() => setFilters((prev) => ({ ...prev, type: value === 'popular' ? '' : value, sort: value === 'popular' ? 'popular' : 'latest', page: 1 }))} style={{ border: 0, borderBottom: active ? '3px solid #f27024' : '3px solid transparent', background: 'transparent', padding: '12px 18px', fontWeight: 800, color: active ? '#202938' : '#68738a', cursor: 'pointer', whiteSpace: 'nowrap' }}>{label}</button>;
        })}
      </div>
      {error && <div style={{ color: '#b42318', background: '#fff1f0', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>{error}</div>}
      {showComposer && canPost && <form onSubmit={submitPost} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Tạo bài đăng</h3>
        <select value={form.postType} onChange={(e) => setForm({ ...form, postType: e.target.value })} style={inputStyle}><option value="DISCUSSION">Hỏi đáp / Thảo luận</option><option value="CONFESSION">Confession</option></select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '-2px 0 12px', color: 'var(--color-primary-dark)', fontSize: 13, fontWeight: 700 }}><span style={typeBadge}>{form.postType === 'CONFESSION' ? 'Confession' : 'Hỏi đáp'}</span><span>Về chủ đề bạn muốn chia sẻ</span></div>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tiêu đề / chủ đề bài đăng" required style={inputStyle} />
        <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Nội dung trao đổi..." required rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        {user?.role === 'student' ? <><div style={{ background: '#fff8f2', borderRadius: 10, padding: 10, marginBottom: 12, color: '#8c7166', fontSize: 13 }}>Bài đăng của sinh viên được hiển thị công khai trong cộng đồng.</div><label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}><input type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })} />Đăng ẩn danh</label></> : <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value, classIds: [] })} style={inputStyle}><option value="PUBLIC">Công khai toàn hệ thống</option><option value="CLASS_ONLY">Chỉ chia sẻ cho lớp tôi dạy</option></select>}
        {form.visibility === 'CLASS_ONLY' && <div style={{ border: '1px solid #e8d8cc', borderRadius: 10, padding: 12, marginBottom: 12 }}><strong style={{ display: 'block', marginBottom: 8 }}>Chọn lớp nhận bài đăng</strong>{classes.length === 0 ? <small>Chưa có lớp được phân công.</small> : classes.map((item) => <label key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}><input type="checkbox" checked={form.classIds.includes(item.id)} onChange={(e) => setForm((prev) => ({ ...prev, classIds: e.target.checked ? [...prev.classIds, item.id] : prev.classIds.filter((id) => id !== item.id) }))} />{item.class_code || item.code || item.name}</label>)}</div>}
        <select value={form.flashcardDeckId} onChange={(e) => setForm({ ...form, flashcardDeckId: e.target.value })} style={inputStyle}><option value="">Không gắn FlashCard</option>{decks.map((d) => <option key={d.id} value={d.id}>{d.title}{d.subject_name ? ` — ${d.subject_name}` : ''}</option>)}</select>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button type="button" className="btn" onClick={() => setShowComposer(false)}>Hủy</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Đang đăng...' : 'Đăng bài'}</button></div>
      </form>}
      <form onSubmit={(event) => { event.preventDefault(); setFilters((prev) => ({ ...prev, page: 1 })); }} style={quickSearchStyle}>
        <input value={filters.q} onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }))} placeholder="Tìm kiếm nhanh theo từ khóa..." aria-label="Tìm kiếm nhanh theo từ khóa" style={quickSearchInputStyle} />
      </form>
      {loading ? <div style={{ padding: 32, textAlign: 'center', color: '#aeb9c8' }}>Đang tải bài đăng...</div> : posts.length === 0 ? <div style={emptyStyle}>Chưa có bài đăng nào.</div> : <div style={forumTableStyle}>
        <div style={forumTableHeader}><span>Chủ đề</span><span>Forum</span><span>Reply</span><span>View</span><span>Ngày</span><span>Author</span></div>
        {posts.map((post, index) => <article key={post.id} style={cardStyle}>
        <div style={{ ...topicCell, cursor: 'pointer' }} onClick={() => navigate(`/${user?.role || 'student'}/forum/${post.id}`)}><span style={rowNumber}>{(filters.page - 1) * 10 + index + 1}</span><div style={avatarStyle}>{(post.is_anonymous ? '?' : (post.author_name || 'E')[0]).toUpperCase()}</div><div style={{ minWidth: 0, overflow: 'hidden' }}><strong style={{ color: 'var(--color-ink)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</strong><span style={topicMeta}>{post.post_type === 'CONFESSION' ? 'Confession' : 'Hỏi đáp'}{post.subject_code ? ` · ${post.subject_code}` : ''}</span></div></div>
        <span style={tableCell}><span style={forumBadge}>?&nbsp; {post.post_type === 'CONFESSION' ? 'Confession' : 'Thảo luận'}</span></span>
        <span style={tableCell}>{post.comment_count || 0}</span>
        <span style={tableCell}>{post.view_count || 0}</span>
        <time style={tableCell}>{new Date(post.created_at).toLocaleDateString('vi-VN')}</time>
        <span style={{ ...tableCell, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={avatarSmall}>{(post.is_anonymous ? '?' : (post.author_name || 'E')[0]).toUpperCase()}</span> {post.is_anonymous ? 'Ẩn danh' : (post.author_name || 'EDUX User')}</span>
        <div style={postBody}><p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-ink-muted)', lineHeight: 1.6, margin: 0 }}>{post.content}</p>
        {(post.subject_name || post.flashcard_deck_id) && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>{post.subject_name && <span style={tagStyle}>{post.subject_code || 'Môn học'} · {post.subject_name}</span>}{post.flashcard_deck_id && <button type="button" style={linkStyle} onClick={() => openFlashcard(post)}><ExternalLink size={14} /> Mở FlashCard{post.flashcard_title ? `: ${post.flashcard_title}` : ''}</button>}</div>}
        <div style={{ display: 'flex', gap: 18, borderTop: '1px solid #293545', paddingTop: 12, marginTop: 12 }}><button type="button" style={actionStyle} onClick={() => toggleLike(post.id)}><Heart size={17} fill={post.liked_by_me ? '#ef6820' : 'none'} color={post.liked_by_me ? '#ef6820' : 'currentColor'} /> {post.like_count || 0}</button><button type="button" style={actionStyle} onClick={() => toggleComments(post.id)} aria-expanded={Boolean(expandedComments[post.id])}><MessageCircle size={17} /> Mở bình luận</button></div>
        {expandedComments[post.id] && <div style={{ marginTop: 14, borderTop: '1px solid #f1e7df', paddingTop: 12 }}>
          {(commentsByPost[post.id] || []).length === 0 ? <p style={{ color: '#8c7166', fontSize: 13 }}>Chưa có bình luận. Hãy bắt đầu trao đổi.</p> : (commentsByPost[post.id] || []).map((comment) => <div key={comment.id} style={{ background: '#fff8f5', borderRadius: 10, padding: '9px 12px', marginBottom: 8, marginLeft: comment.parent_id ? 28 : 0 }}><strong style={{ fontSize: 13 }}>{comment.author_name || 'EDUX User'}</strong><p style={{ margin: '4px 0 6px', whiteSpace: 'pre-wrap', color: '#4e596b' }}>{comment.content}</p><button type="button" style={{ ...actionStyle, fontSize: 12 }} onClick={() => setReplyTo((prev) => ({ ...prev, [post.id]: comment.id }))}><Reply size={14} /> Trả lời</button>{replyTo[post.id] === comment.id && <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><input autoFocus value={commentText[post.id] || ''} onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(post.id, comment.id); } }} placeholder="Viết câu trả lời..." style={{ ...inputStyle, margin: 0 }} /><button type="button" className="btn btn-primary" onClick={() => submitComment(post.id, comment.id)}><Send size={16} /></button><button type="button" className="btn" onClick={() => setReplyTo((prev) => ({ ...prev, [post.id]: null }))}><X size={16} /></button></div>}</div>)}
          <div style={{ display: 'flex', gap: 8 }}><input value={commentText[post.id] || ''} onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(post.id, replyTo[post.id] || null); } }} placeholder={replyTo[post.id] ? 'Viết câu trả lời...' : 'Viết bình luận...'} style={{ ...inputStyle, margin: 0 }} /><button type="button" className="btn btn-primary" onClick={() => submitComment(post.id, replyTo[post.id] || null)}><Send size={16} /></button></div>
        </div>}</div>
      </article>)}
      </div>}
      {!loading && totalPages > 1 && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20 }}><button type="button" className="btn" disabled={filters.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}>Trước</button><span>Trang {filters.page} / {totalPages}</span><button type="button" className="btn" disabled={filters.page >= totalPages} onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}>Sau</button></div>}
      <section style={loungeStyle}>
        <div style={loungeHeader}><div><h2 style={{ margin: 0, fontSize: 22, color: 'var(--color-ink)' }}><MessageCircle size={24} /> Tán gẫu linh tinh</h2><div style={{ color: 'var(--color-ink-muted)', fontSize: 13, marginTop: 8 }}><strong style={{ color: 'var(--color-ink)' }}>Tán gẫu linh tinh</strong> <span style={onlineBadge}>●</span> {loungeMessages.length} tin nhắn</div></div><MoreHorizontal size={22} color="var(--color-ink-muted)" /></div>
        <div style={loungeMessagesStyle}>{loungeMessages.map((item) => <div key={item.id} style={loungeMessageStyle}><span style={loungeAvatar}>{(item.name || 'E')[0].toUpperCase()}</span><div style={{ minWidth: 0, flex: 1 }}><div><strong style={{ color: 'var(--color-primary-dark)' }}>{item.name}</strong><span style={{ color: 'var(--color-ink-muted)', marginLeft: 8, fontSize: 12 }}>{item.time}</span></div><div style={{ color: 'var(--color-ink)', lineHeight: 1.45 }}>{item.text}</div></div></div>)}</div>
        <form onSubmit={sendLoungeMessage} style={loungeComposer}><div style={{ display: 'flex', gap: 12, color: 'var(--color-primary-dark)' }}><Smile size={19} /><strong>B</strong><em>I</em><Image size={19} /></div><input value={loungeText} onChange={(e) => setLoungeText(e.target.value)} placeholder="Viết tin nhắn công khai..." aria-label="Viết tin nhắn công khai" style={loungeInput} /><button type="submit" style={loungeSend}><Send size={17} /></button></form>
      </section>
      </section>
      <aside style={profileCard}>
        <div style={profileTop}><div style={profileAvatar}>{(user?.full_name || user?.email || 'E')[0].toUpperCase()}</div><div style={{ minWidth: 0 }}><strong style={{ color: 'var(--color-ink)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profileStats?.display_name || user?.full_name || user?.email || 'EDUX User'}</strong><span style={{ color: 'var(--color-ink-muted)', fontSize: 13 }}>{user?.role === 'lecturer' ? 'Giảng viên' : user?.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}</span></div></div>
        <div style={statRow}><span>Bài viết</span><strong>{profileStats?.post_count ?? 0}</strong></div>
        <div style={statRow}><span>Điểm reaction</span><strong>{profileStats?.reaction_score ?? 0}</strong></div>
      </aside>
      </div>
    </main>
  );
}

const inputStyle = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--color-border-medium)', borderRadius: 8, padding: '11px 13px', marginBottom: 12, font: 'inherit', background: 'var(--color-surface)', color: 'var(--color-ink)' };
const forumLayout = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 270px', gap: 18, alignItems: 'start' };
const profileCard = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 18, boxShadow: 'var(--shadow-md)', position: 'sticky', top: 92, alignSelf: 'start', zIndex: 3 };
const profileTop = { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, marginBottom: 12, borderBottom: '1px solid var(--color-border)' };
const profileAvatar = { width: 52, height: 52, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 };
const statRow = { display: 'flex', justifyContent: 'space-between', padding: '9px 0', color: 'var(--color-ink-muted)' };
const typeBadge = { background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', borderRadius: 999, padding: '4px 9px', fontSize: 12 };
const quickSearchStyle = { width: 'min(100%, 375px)', boxSizing: 'border-box', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 8, margin: '0 0 14px' };
const quickSearchInputStyle = { width: '100%', boxSizing: 'border-box', border: 0, outline: 0, borderRadius: 9, padding: '11px 14px', font: 'inherit', background: 'var(--color-primary-card)', color: 'var(--color-ink)' };
const loungeStyle = { marginTop: 22, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-md)' };
const loungeHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px 14px', borderBottom: '1px solid var(--color-border)' };
const onlineBadge = { color: '#76b82a', margin: '0 4px 0 8px' };
const loungeMessagesStyle = { height: 250, overflowY: 'auto', padding: '8px 20px' };
const loungeMessageStyle = { display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--color-border)' };
const loungeAvatar = { width: 30, height: 30, borderRadius: '50%', background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 };
const loungeComposer = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderTop: '1px solid var(--color-border)' };
const loungeInput = { flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: 'var(--color-ink)', font: 'inherit', padding: '8px 0' };
const loungeSend = { border: 0, background: 'var(--color-primary)', color: '#fff', borderRadius: 8, width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const forumTableStyle = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, maxHeight: 560, overflowY: 'auto', overflowX: 'auto', boxShadow: 'var(--shadow-md)' };
const forumTableHeader = { position: 'sticky', top: 0, zIndex: 2, display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 110px 80px 80px 100px 150px', gap: 10, alignItems: 'center', padding: '12px 16px', background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', fontSize: 13, fontWeight: 700 };
const cardStyle = { display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 110px 80px 80px 100px 150px', gap: 10, alignItems: 'center', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: '13px 16px', margin: 0, color: 'var(--color-ink)' };
const topicCell = { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, paddingBottom: 10 };
const tableCell = { color: 'var(--color-primary-dark)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 };
const forumBadge = { color: 'var(--color-primary-dark)', whiteSpace: 'nowrap' };
const avatarSmall = { width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 };
const postBody = { gridColumn: '1 / -1', minWidth: 0 };
const rowNumber = { color: 'var(--color-ink-muted)', width: 22, textAlign: 'center', fontSize: 13 };
const avatarStyle = { width: 30, height: 30, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 };
const topicMeta = { display: 'block', color: 'var(--color-primary-dark)', fontSize: 12, marginTop: 4 };
const emptyStyle = { background: 'var(--color-surface)', borderRadius: 14, padding: 48, textAlign: 'center', color: 'var(--color-ink-muted)' };
const tagStyle = { background: '#203147', color: '#72b3ff', borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 700 };
const linkStyle = { border: 0, background: '#163a42', color: '#5fe1d3', borderRadius: 999, padding: '5px 10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' };
const actionStyle = { border: 0, background: 'transparent', color: '#69aaff', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0 };
