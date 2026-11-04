import React, { useEffect, useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, Reply, Send } from 'lucide-react';
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
    </article>
    <section style={detailCard}><h2 style={{ marginTop: 0 }}>Bình luận ({post.comments?.length || 0})</h2>{(post.comments || []).map((item) => <div key={item.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)', marginLeft: item.parent_id ? 28 : 0 }}><strong>{item.author_name || 'EDUX User'}</strong><p style={{ margin: '6px 0', color: 'var(--color-ink-muted)' }}>{item.content}</p><button type="button" style={replyStyle} onClick={() => setReplyTo(item.id)}><Reply size={14} /> Trả lời</button></div>)}<div style={{ display: 'flex', gap: 8, marginTop: 16 }}><input value={comment} onChange={(e) => setComment(e.target.value)} placeholder={replyTo ? 'Viết câu trả lời...' : 'Viết bình luận...'} style={inputStyle} /><button type="button" className="btn btn-primary" onClick={sendComment}><Send size={16} /></button></div></section>
  </main>;
}

const pageStyle = { maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' };
const detailCard = { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: 24, marginTop: 16 };
const badge = { display: 'inline-block', background: 'var(--color-primary-card)', color: 'var(--color-primary-dark)', borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 800 };
const inputStyle = { flex: 1, border: '1px solid var(--color-border-medium)', borderRadius: 9, padding: '11px 13px', background: 'var(--color-surface)', color: 'var(--color-ink)' };
const replyStyle = { border: 0, background: 'transparent', color: 'var(--color-primary-dark)', cursor: 'pointer', display: 'inline-flex', gap: 5, alignItems: 'center' };
const errorStyle = { marginTop: 14, color: '#b42318', background: '#fff1f0', padding: 10, borderRadius: 8 };
