import React, { useEffect, useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Reply, Send, Image, Link, Smile } from 'lucide-react';
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

  const load = async () => {
    try { const result = await ForumService.getPost(postId); setPost(result.data || result); }
    catch (err) { setError(err.response?.data?.message || 'Không thể tải bài đăng.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [postId]);

  const sendComment = async () => {
    if (!comment.trim()) return;
    try {
      const result = await ForumService.addComment(postId, { content: comment.trim(), parentId: replyTo });
      setPost((prev) => ({ ...prev, comments: [...(prev.comments || []), { ...(result.data || result), author_name: user?.full_name || 'Bạn', author_role: user?.role }] }));
      setComment(''); setReplyTo(null);
    } catch (err) { setError(err.response?.data?.message || 'Không thể gửi bình luận.'); }
  };

  if (loading) return <main style={pageStyle}>Đang tải bài đăng...</main>;
  if (!post) return <main style={pageStyle}><p>{error || 'Không tìm thấy bài đăng.'}</p><button className="btn" onClick={() => navigate(-1)}>Quay lại</button></main>;
  return <main style={pageStyle}>
    <button type="button" className="btn" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Quay lại diễn đàn</button>
    {error && <div style={errorStyle}>{error}</div>}
    <article style={detailCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><div><span style={badge}>{post.post_type === 'CONFESSION' ? 'Confession' : 'Hỏi đáp'}</span><h1 style={{ margin: '12px 0 6px' }}>{post.title}</h1><p style={{ color: 'var(--color-ink-soft)', margin: 0 }}>{post.is_anonymous ? 'Ẩn danh' : (post.author_name || 'EDUX User')} · {new Date(post.created_at).toLocaleString('vi-VN')}</p></div><div style={{ color: 'var(--color-ink-soft)', display: 'flex', gap: 12 }}><span><Heart size={16} /> {post.like_count || 0}</span><span><MessageCircle size={16} /> {post.comment_count || 0}</span><span>◉ {post.view_count || 0}</span></div></div>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--color-ink-muted)', marginTop: 26 }}>{post.content}</p>
      {Array.isArray(post.attachments) && post.attachments.length > 0 && <div style={attachmentsStyle}><strong>Tệp đính kèm</strong>{post.attachments.map((file) => <a key={`${file.name}-${file.size}`} href={file.dataUrl} download={file.name} target="_blank" rel="noreferrer" style={attachmentLink}>{file.name} <span>↓</span></a>)}</div>}
    </article>
    <section style={detailCard}><h2 style={{ marginTop: 0 }}>Bình luận ({post.comments?.length || 0})</h2>{(post.comments || []).map((item) => <div key={item.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', marginLeft: item.parent_id ? 28 : 0 }}><strong>{item.author_name || 'EDUX User'}</strong><p style={{ margin: '6px 0', color: 'var(--color-ink-muted)' }}>{item.content}</p><button type="button" style={replyStyle} onClick={() => setReplyTo(item.id)}><Reply size={14} /> Trả lời</button></div>)}<div style={replyComposer}><div style={replyAvatar}>{(user?.full_name || user?.email || 'E')[0].toUpperCase()}</div><div style={replyEditor}><div style={replyToolbar}><button type="button" style={toolButton}><strong>B</strong></button><button type="button" style={toolButton}><em>I</em></button><button type="button" style={toolButton}><span>Tᵀ</span></button><button type="button" style={toolButton}><Link size={17} /></button><button type="button" style={toolButton}><Image size={17} /></button><button type="button" style={toolButton}><Smile size={17} /></button></div><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={replyTo ? 'Viết câu trả lời...' : 'Viết bình luận...'} style={replyTextarea} /><div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 12px 12px' }}><button type="button" className="btn btn-primary" onClick={sendComment}><Reply size={16} /> Trả lời</button></div></div></div></section>
  </main>;
}

const pageStyle = { maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' };
const detailCard = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 24, marginTop: 16 };
const badge = { display: 'inline-block', background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 800 };
const inputStyle = { flex: 1, border: '1px solid var(--color-border-medium)', borderRadius: 9, padding: '11px 13px', background: 'var(--color-surface)', color: 'var(--color-ink)' };
const replyStyle = { border: 0, background: 'transparent', color: 'var(--color-primary-dark)', cursor: 'pointer', display: 'inline-flex', gap: 5, alignItems: 'center' };
const errorStyle = { marginTop: 14, color: '#b42318', background: '#fff1f0', padding: 10, borderRadius: 8 };
const replyComposer = { display: 'flex', gap: 14, marginTop: 22, padding: 0, alignItems: 'flex-start' };
const replyAvatar = { width: 68, height: 68, borderRadius: '50%', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, flexShrink: 0, marginTop: 2 };
const replyToolbar = { display: 'flex', gap: 18, alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-primary-dark)' };
const replyEditor = { flex: 1, minWidth: 0, border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', background: 'var(--color-surface)' };
const replyTextarea = { width: '100%', minHeight: 108, boxSizing: 'border-box', resize: 'vertical', border: 0, background: 'var(--color-surface)', color: 'var(--color-ink)', padding: 14, font: 'inherit', outline: 0 };
const toolButton = { border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer', display: 'inline-flex', padding: 0, font: 'inherit' };
const attachmentsStyle = { marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--color-ink)' };
const attachmentLink = { color: 'var(--color-primary-dark)', background: 'var(--color-primary-card)', borderRadius: 8, padding: '9px 12px', textDecoration: 'none', display: 'flex', justifyContent: 'space-between' };
