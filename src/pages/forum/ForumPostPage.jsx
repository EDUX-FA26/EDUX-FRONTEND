import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Reply, Send, Image, Link, Smile, Paperclip } from 'lucide-react';
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

  const load = async () => {
    try { const result = await ForumService.getPost(postId); setPost(result.data || result); }
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
  const chooseCommentFiles = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5 - commentAttachments.length).filter((file) => file.size <= 2 * 1024 * 1024);
    const encoded = await Promise.all(files.map((file) => new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: reader.result }); reader.readAsDataURL(file); })));
    setCommentAttachments((prev) => [...prev, ...encoded].slice(0, 5)); event.target.value = '';
  };

  if (loading) return <main style={pageStyle}>Đang tải bài đăng...</main>;
  if (!post) return <main style={pageStyle}><p>{error || 'Không tìm thấy bài đăng.'}</p><button className="btn" onClick={() => navigate(-1)}>Quay lại</button></main>;
  return <main style={pageStyle}>
    <button type="button" className="btn" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Quay lại diễn đàn</button>
    {error && <div style={errorStyle}>{error}</div>}
    <div style={followRow}><span style={topicBadge}>{post.post_type === 'CONFESSION' ? 'Confession' : 'Hỏi Đáp'}</span><strong style={topicTitle}>{post.subject_code || post.title}</strong><span style={topicMeta}>{post.is_anonymous ? 'Ẩn danh' : (post.author_name || 'EDUX User')} · {new Date(post.created_at).toLocaleDateString('vi-VN')}</span></div>
    <article style={postShell}>
      <aside style={authorCard}><div style={authorAvatar}>{(post.is_anonymous ? '?' : (post.author_name || 'E')[0]).toUpperCase()}</div><strong style={authorName}>{post.is_anonymous ? 'Ẩn danh' : (post.author_name || 'EDUX User')}</strong><span style={authorRole}>{post.author_role === 'lecturer' ? 'Giảng viên' : 'Thành viên'}</span><div style={authorStats}><span>Tham gia</span><b>EDUX</b><span>Bài viết</span><b>—</b><span>Reaction</span><b>{post.like_count || 0}</b></div></aside>
      <div style={postContent}><div style={postMetaRow}><span>{new Date(post.created_at).toLocaleDateString('vi-VN')}</span><span>#1</span></div><h1 style={{ margin: '14px 0 8px', fontSize: 20, color: 'var(--color-ink)' }}>{post.title}</h1><p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--color-ink)', margin: 0 }}>{post.content}</p>
      {Array.isArray(post.attachments) && post.attachments.length > 0 && <div style={attachmentsStyle}><strong>Tệp đính kèm</strong>{post.attachments.map((file) => file.type?.startsWith('image/') ? <a key={`${file.name}-${file.size}`} href={file.dataUrl} download={file.name} target="_blank" rel="noreferrer" style={imageAttachment}><img src={file.dataUrl} alt={file.name} style={imagePreview} /><span>{file.name} ↓</span></a> : <a key={`${file.name}-${file.size}`} href={file.dataUrl} download={file.name} target="_blank" rel="noreferrer" style={attachmentLink}>{file.name} <span>↓</span></a>)}</div>}
      <div style={postActions}><button type="button" style={replyStyle}><Heart size={16} /> Like</button><button type="button" style={replyStyle} onClick={() => document.querySelector('textarea')?.focus()}><Reply size={16} /> Trả lời</button></div></div>
    </article>
    <section style={detailCard}><h2 style={{ marginTop: 0 }}>Bình luận ({post.comments?.length || 0})</h2>{(post.comments || []).map((item) => <div key={item.id} style={{ ...commentItem, marginLeft: item.parent_id ? 28 : 0 }}><div style={commentAvatar}>{(item.author_name || 'E')[0].toUpperCase()}</div><div style={{ minWidth: 0, flex: 1 }}><strong style={{ color: 'var(--color-ink)' }}>{item.author_id === user?.id ? 'Bạn' : (item.author_name || 'EDUX User')}</strong><p style={{ margin: '6px 0', color: 'var(--color-ink-muted)', whiteSpace: 'pre-wrap' }}>{item.content}</p>{Array.isArray(item.attachments) && item.attachments.map((file) => <a key={file.name} href={file.dataUrl} download={file.name} style={commentAttachment}>{file.name} ↓</a>)}<button type="button" style={replyStyle} onClick={() => setReplyTo(item.id)}><Reply size={14} /> Trả lời</button></div></div>)}<div style={replyComposer}><div style={replyAvatar}>{(user?.full_name || user?.email || 'E')[0].toUpperCase()}</div><div style={replyEditor}><div style={replyToolbar}><button type="button" style={toolButton}><strong>B</strong></button><button type="button" style={toolButton}><em>I</em></button><button type="button" style={toolButton}><span>Tᵀ</span></button><button type="button" style={toolButton}><Link size={17} /></button><button type="button" style={toolButton} onClick={() => commentFileRef.current?.click()}><Image size={17} /></button><button type="button" style={toolButton} onClick={() => commentFileRef.current?.click()}><Paperclip size={17} /></button><button type="button" style={toolButton}><Smile size={17} /></button><input ref={commentFileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={chooseCommentFiles} style={{ display: 'none' }} /></div><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={replyTo ? 'Viết câu trả lời...' : 'Viết bình luận...'} style={replyTextarea} />{commentAttachments.length > 0 && <div style={commentFiles}>{commentAttachments.map((file, index) => <span key={file.name}>{file.name}<button type="button" onClick={() => setCommentAttachments((prev) => prev.filter((_, i) => i !== index))}>×</button></span>)}</div>}<div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 12px 12px' }}><button type="button" className="btn btn-primary" onClick={sendComment}><Reply size={16} /> Trả lời</button></div></div></div></section>
  </main>;
}

const pageStyle = { maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' };
const detailCard = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 24, marginTop: 16 };
const followRow = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-ink)' };
const topicBadge = { background: '#fff26a', color: '#3d3700', borderRadius: 8, padding: '5px 9px', fontWeight: 800 };
const topicTitle = { fontSize: 24, fontWeight: 500 };
const topicMeta = { color: 'var(--color-ink-muted)', fontSize: 13 };
const breadcrumb = { margin: '18px 0', color: 'var(--color-ink-muted)', fontSize: 13 };
const postShell = { display: 'grid', gridTemplateColumns: '190px minmax(0,1fr)', gap: 14, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 10 };
const authorCard = { background: 'var(--color-primary-card)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 12, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 240 };
const authorAvatar = { width: 112, height: 112, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, fontWeight: 800, marginBottom: 10 };
const authorName = { color: 'var(--color-primary-dark)', fontSize: 17 };
const authorRole = { color: 'var(--color-ink-muted)', fontSize: 13, marginTop: 3 };
const authorStats = { width: '100%', marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: 5, textAlign: 'left', color: 'var(--color-ink-muted)', fontSize: 12 };
const postContent = { minWidth: 0, padding: '2px 10px 0' };
const postMetaRow = { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', padding: '4px 0 10px', color: 'var(--color-ink-muted)', fontSize: 13 };
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
const attachmentsStyle = { marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--color-ink)' };
const attachmentLink = { color: 'var(--color-primary-dark)', background: 'var(--color-primary-card)', borderRadius: 8, padding: '9px 12px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between' };
const imageAttachment = { color: 'var(--color-primary-dark)', background: 'var(--color-primary-card)', borderRadius: 8, padding: 8, textDecoration: 'none', display: 'inline-flex', flexDirection: 'column', gap: 6, width: 'fit-content' };
const imagePreview = { maxWidth: 420, maxHeight: 280, borderRadius: 6, objectFit: 'contain', display: 'block' };
