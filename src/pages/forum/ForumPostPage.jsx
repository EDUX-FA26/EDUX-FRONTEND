import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Reply, Send, Image, Link, Smile, Paperclip, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ForumService from '../../services/forum.service';

export default function ForumPostPage() {
  const { user } = useAuth();
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentAttachments, setCommentAttachments] = useState([]);
  const commentFileRef = useRef(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [likeBusy, setLikeBusy] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [showMoreRelated, setShowMoreRelated] = useState(false);

  const load = async () => {
    setLoading(true); window.scrollTo({ top: 0, behavior: 'smooth' });
    try { const result = await ForumService.getPost(postId); const loadedPost = result.data || result; setPost(loadedPost); setShowMoreRelated(false); ForumService.listPosts({ subjectId: loadedPost.subject_id || '', type: 'ALL', limit: 12, sort: 'latest' }).then((response) => { const payload = response?.data || response; const rows = Array.isArray(payload) ? payload : (payload?.data || []); const currentTags = new Set((Array.isArray(loadedPost.tags) ? loadedPost.tags : []).map((tag) => String(tag).toLowerCase().replace(/^#/, ''))); const matches = rows.filter((item) => item.id !== loadedPost.id && (!currentTags.size || (Array.isArray(item.tags) && item.tags.some((tag) => currentTags.has(String(tag).toLowerCase().replace(/^#/, '')))))); setRelatedPosts(matches.slice(0, 12)); }).catch(() => setRelatedPosts([])); }
    catch (err) { setError(err.response?.data?.message || 'Không thể tải bài đăng.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [postId]);

  const sendComment = async () => {
    if (!comment.trim()) return;
    try {
      const result = await ForumService.addComment(postId, { content: comment.trim(), parentId: replyTo, attachments: commentAttachments });
      setPost((prev) => ({ ...prev, comments: [...(prev.comments || []), { ...(result.data || result), author_id: user?.id, author_name: user?.full_name || 'Bạn', author_role: user?.role }] }));
      setComment(''); setReplyTo(null); setCommentAttachments([]);
    } catch (err) { setError(err.response?.data?.message || 'Không thể gửi bình luận.'); }
  };
  const togglePostLike = async () => {
    if (likeBusy) return;
    setLikeBusy(true);
    try {
      const result = await ForumService.toggleLike(postId);
      const liked = result.data?.liked ?? result.liked;
      setPost((prev) => ({ ...prev, liked_by_me: liked, like_count: Math.max(0, (prev.like_count || 0) + (liked ? 1 : -1)) }));
    } catch (err) { setError(err.response?.data?.message || 'Không thể cập nhật lượt thích.'); }
    finally { setLikeBusy(false); }
  };
  const chooseCommentFiles = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5 - commentAttachments.length).filter((file) => file.size <= 2 * 1024 * 1024);
    const encoded = await Promise.all(files.map((file) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: reader.result }); reader.readAsDataURL(file); })));
    setCommentAttachments((prev) => [...prev, ...encoded].slice(0, 5)); event.target.value = '';
  };

  if (loading) return <main className="forum-post-page" style={pageStyle}>Đang tải bài đăng...</main>;
  if (!post) return <main className="forum-post-page" style={pageStyle}><p>{error || 'Không tìm thấy bài đăng.'}</p><button className="btn" onClick={() => navigate(`/${user?.role || 'student'}/forum`)}>Quay lại diễn đàn</button></main>;
  const imageAttachments = (post.attachments || []).filter((file) => file.type?.startsWith('image/'));
  return <main className="forum-post-page" style={pageStyle}>
    <button type="button" className="btn" onClick={() => navigate(`/${user?.role || 'student'}/forum`)}><ArrowLeft size={16} /> Quay lại diễn đàn</button>
    {error && <div style={errorStyle}>{error}</div>}
    <div style={followRow}><span style={topicBadge}>{post.flashcard_deck_id ? 'Flashcard' : (post.post_type === 'CONFESSION' ? 'Confession' : 'Thảo luận')}</span><strong style={topicTitle}>[{post.subject_code || 'EDUX'}] {post.subject_name || 'Cộng đồng học tập'}</strong>{(Array.isArray(post.tags) ? post.tags : []).map((tag) => <span key={tag} style={postTag}>#{String(tag).replace(/^#/, '')}</span>)}<span style={topicMeta}>{post.is_anonymous ? 'Ẩn danh' : (post.author_name || 'EDUX User')} · {new Date(post.created_at).toLocaleDateString('vi-VN')}</span></div>
    <article style={postShell}>
      <aside style={authorCard}><div style={authorAvatar}>{(post.is_anonymous ? '?' : (post.author_name || 'E')[0]).toUpperCase()}</div><strong style={authorName}>{post.is_anonymous ? 'Ẩn danh' : (post.author_name || 'EDUX User')}</strong><span style={authorRole}>{post.author_role === 'lecturer' ? 'Giảng viên' : 'Thành viên'}</span><div style={authorStats}><span>Tham gia</span><b>EDUX</b><span>Bài viết</span><b>{post.author_post_count ?? 0}</b><span>Reaction</span><b>{post.author_reaction_score ?? 0}</b></div></aside>
      <div style={postContent}><div style={postMetaRow}><span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span><span>{post.visibility === 'CLASS_ONLY' ? 'Chỉ lớp đang học' : 'Công khai EDUX'}</span></div><h1 style={{ margin: '14px 0 8px', fontSize: 28, lineHeight: 1.3, color: 'var(--color-ink)' }}>{post.title}</h1><p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--color-ink)', margin: 0 }}>{post.content}</p>{post.flashcard_deck_id && <div style={flashcardLink}><div><strong>🔗 Bộ Flashcard liên kết</strong><small>{post.flashcard_title || 'Mở bộ Flashcard của môn học này'}</small></div><button type="button" onClick={() => navigate(user?.role === 'lecturer' ? `/lecturer/flashcards/subject/${post.subject_id}` : `/student/flashcards/${post.flashcard_deck_id}/study`)}>Mở Flashcard →</button></div>}
        {Array.isArray(post.attachments) && post.attachments.length > 0 && <div style={attachmentsStyle}><strong>Tệp đính kèm</strong>{imageAttachments.length > 0 && <div style={imageGallery}>{imageAttachments.slice(0, 4).map((file, index) => <button type="button" key={`${file.name}-${file.size}`} style={imageAttachment} onClick={() => setLightboxIndex(index)}><img src={file.dataUrl} alt={file.name} style={imagePreview} />{index === 3 && imageAttachments.length > 4 && <span style={moreOverlay}>+{imageAttachments.length - 4}</span>}</button>)}</div>}{post.attachments.filter((file) => !file.type?.startsWith('image/')).map((file) => <a key={`${file.name}-${file.size}`} href={file.dataUrl} download={file.name} target="_blank" rel="noreferrer" style={attachmentLink}>{file.name} <span>↓</span></a>)}</div>}
        <div style={postActions}><button type="button" style={replyStyle} disabled={likeBusy} onClick={togglePostLike}><Heart size={16} fill={post.liked_by_me ? 'currentColor' : 'none'} /> {post.liked_by_me ? 'Đã thích' : 'Like'} {post.like_count || 0}</button><button type="button" style={replyStyle} onClick={() => document.querySelector('textarea')?.focus()}><Reply size={16} /> Trả lời</button></div></div>
    </article>
    <section style={detailCard}><h2 style={{ marginTop: 0 }}>Bình luận ({post.comments?.length || 0})</h2>{(post.comments || []).map((item) => <div key={item.id} style={{ ...commentItem, marginLeft: item.parent_id ? 28 : 0 }}><div style={commentAvatar}>{(item.author_name || 'E')[0].toUpperCase()}</div><div style={{ minWidth: 0, flex: 1 }}><strong style={{ color: 'var(--color-ink)' }}>{item.author_id === user?.id ? 'Bạn' : (item.author_name || 'EDUX User')}</strong><p style={{ margin: '6px 0', color: 'var(--color-ink-muted)', whiteSpace: 'pre-wrap' }}>{item.content}</p>{Array.isArray(item.attachments) && item.attachments.map((file) => <a key={file.name} href={file.dataUrl} download={file.name} style={commentAttachment}>{file.name} ↓</a>)}<button type="button" style={replyStyle} onClick={() => setReplyTo(item.id)}><Reply size={14} /> Trả lời</button></div></div>)}<div style={replyComposer}><div style={replyAvatar}>{(user?.full_name || user?.email || 'E')[0].toUpperCase()}</div><div style={replyEditor}><div style={replyToolbar}><button type="button" style={toolButton}><strong>B</strong></button><button type="button" style={toolButton}><em>I</em></button><button type="button" style={toolButton}><span>Tᵀ</span></button><button type="button" style={toolButton}><Link size={17} /></button><button type="button" style={toolButton} onClick={() => commentFileRef.current?.click()}><Image size={17} /></button><button type="button" style={toolButton} onClick={() => commentFileRef.current?.click()}><Paperclip size={17} /></button><button type="button" style={toolButton}><Smile size={17} /></button><input ref={commentFileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={chooseCommentFiles} style={{ display: 'none' }} /></div><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={replyTo ? 'Viết câu trả lời...' : 'Viết bình luận...'} style={replyTextarea} />{commentAttachments.length > 0 && <div style={commentFiles}>{commentAttachments.map((file, index) => <span key={file.name}>{file.name}<button type="button" onClick={() => setCommentAttachments((prev) => prev.filter((_, i) => i !== index))}>×</button></span>)}</div>}<div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 12px 12px' }}><button type="button" className="btn btn-primary" onClick={sendComment}><Reply size={16} /> Trả lời</button></div></div></div></section>
    <aside style={contextAside}><div style={contextCard}><h3 style={contextTitle}>THÔNG TIN MÔN HỌC <span style={{ float: 'right', background: '#fff0e9', color: '#aa3000', borderRadius: 5, padding: '2px 5px', fontSize: 9 }}>{post.subject_code || 'EDUX'}</span></h3><strong style={{ display: 'block', fontSize: 13 }}>{post.subject_name || 'Cộng đồng học tập'}</strong><p style={contextText}>Lớp học và nội dung được đồng bộ từ hệ thống EDUX.</p><div style={{ marginTop: 10, padding: 10, borderRadius: 9, background: '#f7f3f0', fontSize: 11 }}><b>Phạm vi bài viết</b><br />{post.visibility === 'CLASS_ONLY' ? 'Chỉ lớp đang học' : 'Toàn bộ sinh viên EDUX'}</div></div><div style={contextCard}><h3 style={contextTitle}>NỘI QUY THẢO LUẬN EDUX</h3><p style={contextText}>• Đặt tiêu đề rõ ràng, đúng chủ đề.<br />• Tôn trọng giảng viên và bạn học.<br />• Không chia sẻ tài liệu hoặc đề thi trái phép.</p></div><div style={contextCard}><h3 style={contextTitle}>THẢO LUẬN LIÊN QUAN</h3><div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{relatedPosts.length ? <> {relatedPosts.slice(0, showMoreRelated ? 12 : 3).map((item) => <button type="button" key={item.id} onClick={() => navigate(`/${user?.role || 'student'}/forum/${item.id}`)} style={{ border: 0, textAlign: 'left', background: '#f7f3f0', borderRadius: 8, padding: 9, cursor: 'pointer' }}><span style={{ display: 'inline-block', color: '#12608c', background: '#e8f4ff', borderRadius: 4, padding: '2px 5px', fontSize: 9, fontWeight: 800 }}>{item.subject_code || 'EDUX'}</span><strong style={{ display: 'block', marginTop: 4, fontSize: 11, color: '#1c1b1a' }}>{item.title}</strong><small style={{ display: 'block', marginTop: 3, color: '#8e7068' }}>{item.comment_count || 0} phản hồi · {item.like_count || 0} thích</small></button>)}{relatedPosts.length > 3 && <button type="button" onClick={() => setShowMoreRelated((value) => !value)} style={{ border: 0, background: "transparent", color: "#aa3000", fontWeight: 800, fontSize: 11, cursor: "pointer", textAlign: "left" }}>{showMoreRelated ? "Thu gọn" : "Xem thêm…"}</button>}</> : <p style={contextText}>Chưa có bài viết cùng môn hoặc tag.</p>}</div></div></aside>    {lightboxIndex !== null && imageAttachments[lightboxIndex] && <div style={lightbox} onClick={() => setLightboxIndex(null)}><button type="button" style={lightboxClose} onClick={() => setLightboxIndex(null)}><X size={26} /></button><button type="button" style={{ ...lightboxArrow, left: 20 }} onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + imageAttachments.length) % imageAttachments.length); }}><ChevronLeft size={34} /></button><img src={imageAttachments[lightboxIndex].dataUrl} alt={imageAttachments[lightboxIndex].name} style={lightboxImage} onClick={(e) => e.stopPropagation()} /><button type="button" style={{ ...lightboxArrow, right: 20 }} onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % imageAttachments.length); }}><ChevronRight size={34} /></button><span style={lightboxCount}>{lightboxIndex + 1} / {imageAttachments.length}</span></div>}
  </main>;
}

const pageStyle = {
  position: 'relative',
  width: '100%',
  maxWidth: 'none',
  boxSizing: 'border-box',
  margin: '0 auto',
  padding: '24px 28px 80px',
  background: '#fdf9f6',
  minHeight: '100vh',
};
const contextAside = { position: 'absolute', top: 76, right: 28, width: 'calc(30% - 18px)', display: 'flex', flexDirection: 'column', gap: 12 };
const contextCard = { background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 2px 9px rgba(31,27,23,.07)', color: 'var(--color-ink)' };
const contextTitle = { margin: '0 0 10px', fontSize: 12, fontWeight: 800, color: '#852400' };
const contextText = { margin: 0, color: 'var(--color-ink-muted)', fontSize: 11, lineHeight: 1.55 };
const detailCard = { width: 'calc(70% - 18px)', boxSizing: 'border-box', background: '#fff', border: '0', borderRadius: 14, padding: 24, marginTop: 16, boxShadow: '0 3px 14px rgba(31,27,23,.07)' };
const followRow = { width: 'calc(70% - 18px)', boxSizing: 'border-box', background: 'transparent', border: 0, borderRadius: 10, padding: '10px 0 16px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-ink)', flexWrap: 'wrap' };
const topicBadge = { background: '#aa3000', color: '#fff', borderRadius: 999, padding: '6px 11px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase' };
const topicTitle = { fontSize: 13, fontWeight: 700, color: '#5a4139' };
const topicMeta = { color: 'var(--color-ink-muted)', fontSize: 12, marginLeft: 'auto' };
const postTag = { background: '#ffe0d8', color: '#a52a0a', borderRadius: 999, padding: '4px 8px', fontSize: 10, fontWeight: 800 };
const flashcardLink = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18, padding: '12px 14px', background: '#e8f4ff', border: '1px solid #b9ddf5', borderRadius: 10, color: '#075985' };
const breadcrumb = { margin: '8px 0', color: 'var(--color-ink-muted)', fontSize: 13 };
const postShell = { width: 'calc(70% - 18px)', boxSizing: 'border-box', display: 'block', background: '#fff', border: '0', borderRadius: 14, padding: 24, boxShadow: '0 3px 14px rgba(31,27,23,.07)' };
const authorCard = {
  background: '#f7f3f0',
  border: 0,
  borderRadius: 12,
  padding: 14,
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12,
  minWidth: 0,
  minHeight: 0,
  boxSizing: 'border-box',
};
const authorAvatar = { width: 46, height: 46, borderRadius: '50%', background: '#ffdbd0', color: '#852400', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0 };
const authorName = { color: 'var(--color-primary-dark)', fontSize: 17 };
const authorRole = { color: 'var(--color-ink-muted)', fontSize: 13, marginTop: 3 };
const authorStats = { width: 'auto', margin: '0 0 0 auto', display: 'flex', gap: 14, textAlign: 'left', color: 'var(--color-ink-muted)', fontSize: 11 };
const postContent = { minWidth: 0, padding: '18px 0 0' };
const postMetaRow = { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2bfb5', padding: '4px 0 10px', color: 'var(--color-ink-muted)', fontSize: 12 };
const postActions = { display: 'flex', justifyContent: 'flex-end', gap: 18, borderTop: '1px solid var(--color-border)', marginTop: 20, paddingTop: 12 };
const badge = { display: 'inline-block', background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 800 };
const inputStyle = { flex: 1, border: '1px solid var(--color-border-medium)', borderRadius: 9, padding: '11px 13px', background: 'var(--color-surface)', color: 'var(--color-ink)' };
const replyStyle = { border: 0, background: 'transparent', color: 'var(--color-primary-dark)', cursor: 'pointer', display: 'inline-flex', gap: 5, alignItems: 'center' };
const errorStyle = { marginTop: 14, color: '#b42318', background: '#fff1f0', padding: 10, borderRadius: 8 };
const replyComposer = { display: 'flex', gap: 14, marginTop: 22, padding: 0, alignItems: 'flex-start' };
const commentItem = { display: 'flex', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--color-border)' };
const commentAvatar = { width: 34, height: 34, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 };
const replyAvatar = { width: 68, height: 68, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, flexShrink: 0, marginTop: 2 };
const replyToolbar = { display: 'flex', gap: 18, alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-primary-dark)' };
const replyEditor = { flex: 1, minWidth: 0, border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', background: 'var(--color-surface)' };
const replyTextarea = { width: '100%', minHeight: 108, boxSizing: 'border-box', resize: 'vertical', border: 0, background: 'var(--color-surface)', color: 'var(--color-ink)', padding: 14, font: 'inherit', outline: 0 };
const toolButton = { border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', display: 'inline-flex', padding: 0, font: 'inherit' };
const commentFiles = { display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 12px 8px' };
const commentAttachment = { display: 'block', color: 'var(--color-primary-dark)', background: 'var(--color-primary-card)', borderRadius: 6, padding: '4px 8px', textDecoration: 'none', width: 'fit-content', fontSize: 13 };
const attachmentsStyle = { marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--color-ink)', padding: 14, background: '#f7f3f0', borderRadius: 12, border: '1px solid #e2bfb5' };
const attachmentLink = { color: 'var(--color-primary-dark)', background: 'var(--color-primary-card)', borderRadius: 8, padding: '9px 12px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between' };
const imageGallery = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, maxHeight: 430, overflowY: 'auto', padding: 8, background: 'var(--color-primary-card)', borderRadius: 8 };
const imageAttachment = { color: 'var(--color-primary-dark)', background: 'var(--color-surface)', borderRadius: 7, padding: 6, display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, fontSize: 12 };
const imagePreview = { width: '100%', height: 120, borderRadius: 5, objectFit: 'cover', display: 'block' };
const moreOverlay = { display: 'block', marginTop: -34, marginBottom: 14, alignSelf: 'center', background: 'rgba(0,0,0,.62)', color: '#fff', borderRadius: 999, padding: '5px 10px', fontWeight: 800, zIndex: 1 };
const lightbox = { position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.86)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 };
const lightboxImage = { maxWidth: 'min(90vw, 1100px)', maxHeight: '86vh', objectFit: 'contain', borderRadius: 8 };
const lightboxClose = { position: 'absolute', top: 20, right: 24, border: 0, background: 'transparent', color: '#fff', cursor: 'pointer' };
const lightboxArrow = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', border: 0, borderRadius: '50%', width: 48, height: 48, background: 'rgba(255,255,255,.16)', color: '#fff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const lightboxCount = { position: 'absolute', bottom: 20, color: '#fff', fontWeight: 700 };
