import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Filter, Flame, Paperclip, Plus, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ForumService from '../../services/forum.service';
import { getSubjects } from '../../services/subject.service';

const PAGE_SIZE = 6;
const roles = { lecturer: 'Giảng viên', student: 'Sinh viên', admin: 'Quản trị viên' };

export default function ForumPageStitch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'student';
  const [posts, setPosts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({});
  const [counts, setCounts] = useState({ discussion: 0, confession: 0, popular: 0, flashcard: 0 });
  const [filter, setFilter] = useState({ q: '', type: 'DISCUSSION', author: '', authorId: '', subjectId: '', time: 'all', sort: 'latest', page: 1 });
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [jumpPage, setJumpPage] = useState('1');
  const [featuredPosts, setFeaturedPosts] = useState([]);

  const change = (key, value) => setFilter((prev) => ({ ...prev, [key]: value, ...(key === 'page' ? {} : { page: 1 }) }));
  const load = async () => {
    try {
      setLoading(true); setError('');
      const result = await ForumService.listPosts({ ...filter, limit: PAGE_SIZE });
      const payload = result?.data || {};
      const rows = Array.isArray(payload) ? payload : (payload.data || []);
      const orderedRows = filter.sort === 'popular'
        ? [...rows].sort((a, b) => (Number(b.view_count) || 0) - (Number(a.view_count) || 0) || new Date(b.created_at) - new Date(a.created_at))
        : rows;
      setPosts(orderedRows);
      setPages(Array.isArray(payload) ? 1 : (payload.totalPages || 1));
    } catch (e) { setError(e.response?.data?.message || 'Không thể tải diễn đàn.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    ForumService.getMyStats().then((r) => setStats(r?.data || r || {})).catch(() => {});
    getSubjects({ page: 1, limit: 100 }).then((r) => setSubjects(r?.data?.data || r?.data || [])).catch(() => {});
  }, [filter.q, filter.type, filter.author, filter.authorId, filter.subjectId, filter.time, filter.sort, filter.page]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      ForumService.listPosts({ type: 'DISCUSSION', limit: 1 }),
      ForumService.listPosts({ type: 'CONFESSION', limit: 1 }),
      ForumService.listPosts({ type: 'ALL', sort: 'popular', limit: 1 }),
      ForumService.listPosts({ type: 'FLASHCARD', limit: 1 }),
    ]).then((all) => {
      if (cancelled) return;
      const total = (r) => r?.data?.total ?? r?.total ?? 0;
      setCounts({ discussion: total(all[0]), confession: total(all[1]), popular: total(all[2]), flashcard: total(all[3]) });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      ForumService.listPosts({ type: 'ALL', sort: 'popular', limit: 8 }),
      ForumService.listPosts({ type: 'ALL', sort: 'comments', limit: 8 }),
    ]).then(([popularResult, commentsResult]) => {
      if (cancelled) return;
      const rowsOf = (result) => { const payload = result?.data || result; return Array.isArray(payload) ? payload : (payload?.data || []); };
      const merged = [...rowsOf(popularResult), ...rowsOf(commentsResult)].reduce((all, post) => all.some((item) => item.id === post.id) ? all : [...all, post], []);
      merged.sort((a, b) => ((Number(b.view_count) || 0) + (Number(b.comment_count) || 0) * 3) - ((Number(a.view_count) || 0) + (Number(a.comment_count) || 0) * 3));
      setFeaturedPosts(merged.slice(0, 3));
    }).catch(() => setFeaturedPosts([]));
    return () => { cancelled = true; };
  }, []);

  // The primary action opens the full create page directly, matching the HTML reference.
  useEffect(() => {
    if (showCreate) navigate(`/${role}/forum/new?type=DISCUSSION`);
  }, [showCreate, navigate, role]);

  const tabs = useMemo(() => [
    ['DISCUSSION', 'Thảo luận', counts.discussion], ['CONFESSION', 'Confession mới', counts.confession], ['POPULAR', 'Xem nhiều', counts.popular], ['FLASHCARD', 'Flashcard', counts.flashcard],
  ], [counts]);
  const currentPage = Math.min(filter.page, pages);
  useEffect(() => setJumpPage(String(currentPage)), [currentPage]);
  const pageItems = useMemo(() => {
    if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
    const items = [1];
    const start = Math.max(2, Math.min(currentPage - 1, pages - 4));
    const end = Math.min(pages - 1, Math.max(currentPage + 1, 5));
    if (start > 2) items.push('ellipsis-start');
    for (let page = start; page <= end; page += 1) items.push(page);
    if (end < pages - 1) items.push('ellipsis-end');
    items.push(pages);
    return items;
  }, [currentPage, pages]);
  const goToPage = (page) => change('page', Math.max(1, Math.min(pages, Number(page) || 1)));

  return <main className="forum-page-stitch" style={S.page}>
    <section style={S.hero}><div><span style={S.eyebrow}>● EDUX FORUM • FALL 2025</span><h1 style={S.heroTitle}>Diễn đàn học tập</h1><p style={S.heroText}>Trao đổi bài học, hỏi đáp đồ án và chia sẻ bộ FlashCard chuẩn cùng cộng đồng giảng viên &amp; sinh viên EDUX.</p></div><div style={S.heroActions}>{['student', 'lecturer', 'admin'].includes(role) && <button style={S.primary} onClick={() => setShowCreate(true)}><Plus size={17}/> Đăng bài</button>}{role === 'lecturer' && <button style={S.secondary} onClick={() => navigate('/lecturer/forum/new?type=DISCUSSION&attach=flashcard')}><Sparkles size={16}/> Đăng kèm FlashCard <b>GV</b></button>}</div></section>
    <section style={S.tabsBar}><div style={S.tabs}>{tabs.map(([value, label, count]) => { const selected = value === 'POPULAR' ? filter.sort === 'popular' : filter.type === value && filter.sort !== 'popular'; return <button key={value} style={{ ...S.tab, ...(selected ? S.tabActive : {}) }} onClick={() => setFilter((p) => ({ ...p, type: value === 'POPULAR' ? 'ALL' : value, sort: value === 'POPULAR' ? 'popular' : 'latest', page: 1 }))}>{label}<span style={{ ...S.badge, ...(selected ? S.badgeActive : {}) }}>{count}</span></button>; })}</div><span style={S.sync}><ShieldCheck size={14}/> Dữ liệu đồng bộ trực tiếp với phòng Đào tạo FPTU</span></section>
    <section style={S.filters}><label style={S.search}><Search size={17}/><input value={filter.q} onChange={(e) => change('q', e.target.value)} placeholder="Tìm kiếm tiêu đề, nội dung, giảng viên, môn học"/></label><select value={filter.subjectId} onChange={(e) => change('subjectId', e.target.value)} style={S.select}><option value="">Môn: Tất cả</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.code || subject.subject_code || subject.name}</option>)}</select><select value={filter.type} onChange={(e) => change('type', e.target.value)} style={S.select}><option value="ALL">Loại: Tất cả</option><option value="DISCUSSION">Thảo luận</option><option value="CONFESSION">Confession</option><option value="FLASHCARD">Flashcard</option></select><select value={filter.author} onChange={(e) => change('author', e.target.value)} style={S.select}><option value="">Tác giả: Tất cả</option><option value="lecturer">Giảng viên</option><option value="student">Sinh viên</option><option value="anonymous">Ẩn danh</option></select><select value={filter.time} onChange={(e) => change('time', e.target.value)} style={S.select}><option value="all">Thời gian: Mọi lúc</option><option value="today">Hôm nay</option><option value="week">Tuần này</option><option value="month">Tháng này</option></select><select value={filter.sort} onChange={(e) => change('sort', e.target.value)} style={S.select}><option value="latest">Mới nhất</option><option value="comments">Nhiều phản hồi</option><option value="popular">Lượt xem cao</option></select><Filter size={17} color="var(--color-primary)"/></section>
    <div style={S.grid}><section><div style={S.table}><div style={S.tableHead}><span>CHỦ ĐỀ &amp; MÔN HỌC</span><span>THỂ LOẠI</span><span>TƯƠNG TÁC</span><span>TÁC GIẢ &amp; GIỜ</span></div>{error && <div style={S.error}>{error}</div>}{loading ? <div style={S.empty}>Đang tải bài đăng...</div> : posts.length === 0 ? <div style={S.empty}>Chưa có bài đăng nào phù hợp.</div> : posts.map((post, index) => <article key={post.id} style={S.row} onClick={() => navigate(`/${role}/forum/${post.id}`)}><div style={S.topic}><span style={S.number}>{(currentPage - 1) * PAGE_SIZE + index + 1}</span><span style={S.avatar}>{(post.is_anonymous ? '?' : (post.author_name || 'E')[0]).toUpperCase()}</span><div style={{ minWidth: 0 }}><small style={S.course}><span style={postS.subjectCode}>{post.subject_code || 'EDUX'}</span><em>{post.subject_name || 'Cộng đồng học tập'}</em></small><strong style={S.title}>{post.title}</strong>{Array.isArray(post.attachments) && post.attachments.length > 0 && <span style={postS.attachment}><Paperclip size={11} /> Tài liệu đính kèm · {post.attachments.length}</span>}<p style={S.excerpt}>{post.content}</p></div></div><span style={S.type}>{post.flashcard_deck_id ? 'Flashcard' : post.post_type === 'CONFESSION' ? 'Confession' : 'Thảo luận'}</span><span style={S.interaction}>💬 {post.comment_count ?? post.comments_count ?? 0}<small>{post.view_count || 0} lượt xem</small></span><span style={S.author}><b>{post.is_anonymous ? 'Ẩn danh' : post.author_name || 'EDUX User'}</b><small>{new Date(post.created_at).toLocaleDateString('vi-VN')}</small></span></article>)}</div><div style={S.pagination}><span>Hiển thị <b>{posts.length}</b> / {pages > 1 ? `trang ${currentPage} · ` : ''}bài thảo luận</span><div style={S.pageControls}><button type="button" style={S.pageButton} disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>‹ Trước</button>{pageItems.map((item) => item.toString().startsWith('ellipsis') ? <span key={item} style={S.pageEllipsis}>…</span> : <button type="button" key={item} style={{ ...S.pageButton, ...(item === currentPage ? S.pageActive : {}) }} aria-current={item === currentPage ? 'page' : undefined} onClick={() => goToPage(item)}>{item}</button>)}<button type="button" style={S.pageButton} disabled={currentPage >= pages} onClick={() => goToPage(currentPage + 1)}>Sau ›</button><label style={S.pageJump}>Đi đến <input aria-label="Trang" type="number" min="1" max={pages} value={jumpPage} onChange={(e) => setJumpPage(e.target.value)} onBlur={() => goToPage(jumpPage)} onKeyDown={(e) => { if (e.key === 'Enter') goToPage(jumpPage); }} /> <span>/ {pages}</span></label></div></div><div style={S.banner}><Sparkles size={25} color="var(--color-primary)"/><div><strong>Hội thảo nghiên cứu &amp; Đồ án tốt nghiệp Fall 2025</strong><p>Đăng ký tham gia nộp đề tài trước ngày 30/11 để nhận hỗ trợ cố vấn.</p></div><button>Tìm hiểu thêm <ChevronRight size={15}/></button></div></section>
      <aside style={S.aside}><div style={S.card}><div style={S.profile}><span style={S.profileAvatar}>{(user?.full_name || user?.email || 'E')[0].toUpperCase()}</span><div><strong>{stats.display_name || user?.full_name || 'EDUX User'}</strong><small>{roles[role] || role}</small></div></div><div style={S.metrics}><Metric label="Bài viết" value={stats.post_count ?? 0}/><Metric label="Điểm tương tác" value={stats.reaction_score ?? 0}/><Metric label="Bình luận" value={stats.comment_count ?? 0}/><Metric label="Lượt thích nhận" value={stats.like_count ?? 0}/></div><button style={S.profileBtn} onClick={() => setFilter((p) => ({ ...p, authorId: user?.id || '', author: '', page: 1 }))}>Xem bài viết của tôi</button></div><div style={S.card}><h3>Chủ đề thảo luận nổi bật <Flame size={16} color="var(--color-primary)"/></h3>{featuredPosts.length ? featuredPosts.map((post, i) => <button type="button" style={{ ...S.trend, border: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }} key={post.id} onClick={() => navigate('/' + role + '/forum/' + post.id)}><b>#{i + 1}</b><span>{post.title}<small>{post.view_count || 0} lượt xem · {post.comment_count || 0} bình luận</small></span><ChevronRight size={14}/></button>) : <small style={{ color: '#8e7068' }}>Chưa có dữ liệu nổi bật.</small>}</div><div style={S.card}><h3><ShieldCheck size={16} color="var(--color-primary)"/> Quy định cộng đồng EDUX</h3><ul style={S.rules}><li>Tôn trọng đồng nghiệp, giảng viên và các quan điểm học thuật.</li><li>Không chia sẻ mã đề thi chính thức khi chưa được phép.</li><li>Giữ thảo luận đúng chủ đề và văn minh.</li></ul></div></aside></div>
    {showCreate && <div style={S.backdrop} onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}><div style={S.modal}><header style={S.modalHead}><h2>Tạo bài viết mới</h2><button onClick={() => setShowCreate(false)}><X size={20}/></button></header><p>Chọn loại bài đăng bạn muốn chia sẻ với cộng đồng EDUX.</p><div style={S.modalOptions}><button onClick={() => navigate(`/${role}/forum/new?type=DISCUSSION`)}>Thảo luận</button><button onClick={() => navigate(`/${role}/forum/new?type=CONFESSION`)}>Confession ẩn danh</button>{role === 'lecturer' && <button onClick={() => navigate('/lecturer/forum/new?type=DISCUSSION&attach=flashcard')}>Kèm FlashCard</button>}</div></div></div>}
  </main>;
}

function Metric({ label, value }) { return <div style={S.metric}><span>{label}</span><b>{value}</b></div>; }
const S = { page:{padding:'24px 28px 70px',background:'#fdf9f6',minHeight:'100vh'}, hero:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:24,padding:'32px 34px',borderRadius:16,background:'linear-gradient(110deg,#0d1527,#131d35 55%,#1c2849)',color:'#fff',marginBottom:18,boxShadow:'0 10px 28px rgba(20,30,48,.18)'}, eyebrow:{fontSize:11,fontWeight:800,padding:'6px 11px',borderRadius:999,background:'rgba(255,255,255,.14)',color:'#ffb59f',letterSpacing:'.08em'}, heroTitle:{margin:'13px 0 6px',fontSize:36,color:'#fff',letterSpacing:'-.02em'}, heroText:{margin:0,color:'rgba(255,255,255,.82)',maxWidth:700,fontSize:16,lineHeight:1.65}, heroActions:{display:'flex',flexDirection:'column',gap:9,alignItems:'stretch'}, primary:{border:0,borderRadius:9,padding:'11px 19px',background:'#aa3000',color:'#fff',fontWeight:800,cursor:'pointer',display:'flex',gap:7,alignItems:'center',justifyContent:'center'}, secondary:{border:0,borderRadius:9,padding:'10px 14px',background:'rgba(204,229,255,.16)',color:'#cce5ff',fontWeight:700,cursor:'pointer',display:'flex',gap:6,alignItems:'center'}, tabsBar:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:6,borderRadius:12,background:'#fff',marginBottom:14},tabs:{display:'flex',gap:5,overflowX:'auto'},tab:{border:0,borderRadius:9,padding:'9px 15px',background:'transparent',color:'#5a4139',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'},tabActive:{background:'#aa3000',color:'#fff'},badge:{marginLeft:6,padding:'2px 7px',borderRadius:999,background:'#f1edea',fontSize:11},badgeActive:{background:'rgba(255,255,255,.25)',color:'#fff'},sync:{display:'flex',alignItems:'center',gap:5,padding:'6px 10px',borderRadius:9,background:'#f7f3f0',fontSize:11,color:'#5a4139',whiteSpace:'nowrap'},filters:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',padding:12,borderRadius:12,background:'#fff',marginBottom:16},search:{display:'flex',alignItems:'center',gap:7,flex:'1 1 250px',height:40,padding:'0 11px',borderRadius:9,background:'#f7f3f0',color:'#5a4139'},select:{height:40,border:'1px solid #e2bfb5',borderRadius:9,padding:'0 9px',background:'#fff',color:'#1c1b1a',maxWidth:165},grid:{display:'grid',gridTemplateColumns:'minmax(0,2fr) minmax(290px,1fr)',gap:16},table:{background:'#fff',borderRadius:14,overflow:'hidden',boxShadow:'0 2px 8px rgba(31,27,23,.08)'},tableHead:{display:'grid',gridTemplateColumns:'minmax(0,6fr) minmax(90px,1.4fr) minmax(90px,1.4fr) minmax(150px,2fr)',gap:10,padding:'13px 16px',background:'#f7f3f0',color:'#852400',fontSize:10,fontWeight:800},row:{display:'grid',gridTemplateColumns:'minmax(0,6fr) minmax(90px,1.4fr) minmax(90px,1.4fr) minmax(150px,2fr)',gap:10,alignItems:'center',padding:'15px 16px',borderTop:'1px solid #e2bfb5',cursor:'pointer'},topic:{display:'flex',alignItems:'center',gap:9,minWidth:0},number:{width:18,color:'#5a4139',fontSize:12},avatar:{width:31,height:31,borderRadius:'50%',background:'#aa3000',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontWeight:800,flexShrink:0},course:{display:'block',fontSize:10,color:'#5a4139',marginBottom:3},courseEm:{fontStyle:'normal'},title:{display:'block',fontSize:14,color:'#1c1b1a',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'},excerpt:{fontSize:11,color:'#5a4139',margin:'3px 0',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'},type:{background:'#ffdbd0',color:'#852400',borderRadius:999,padding:'4px 8px',fontSize:10,fontWeight:800,width:'fit-content'},interaction:{display:'flex',flexDirection:'column',gap:3,color:'#852400',fontSize:12},author:{display:'flex',flexDirection:'column',gap:3,fontSize:11,color:'#1c1b1a'},empty:{padding:48,textAlign:'center',color:'#5a4139'},error:{padding:14,color:'#ba1a1a',background:'#fff1f0'},pagination:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 4px',color:'#5a4139',fontSize:12},pageControls:{display:'flex',alignItems:'center',gap:5},pageActive:{background:'#aa3000',color:'#fff'},banner:{display:'flex',alignItems:'center',gap:12,padding:18,marginTop:16,borderRadius:14,background:'#ffdbd0'},aside:{display:'flex',flexDirection:'column',gap:14},card:{background:'#fff',borderRadius:14,padding:17,boxShadow:'0 2px 8px rgba(31,27,23,.08)'},profile:{display:'flex',gap:10,alignItems:'center',paddingBottom:13,borderBottom:'1px solid #e2bfb5'},profileAvatar:{width:48,height:48,borderRadius:'50%',background:'#aa3000',color:'#fff',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:21,fontWeight:800},metrics:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:14},metric:{display:'flex',flexDirection:'column',gap:4,padding:10,borderRadius:10,background:'#ffdbd0',fontSize:11,color:'#5a4139'},profileBtn:{width:'100%',marginTop:12,border:0,borderRadius:9,padding:9,background:'#f1edea',cursor:'pointer',fontWeight:700},trend:{display:'flex',alignItems:'center',gap:8,padding:'9px 0',borderTop:'1px solid #e2bfb5',fontSize:11},rules:{paddingLeft:18,marginBottom:0,fontSize:11,lineHeight:1.6},backdrop:{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.45)'},modal:{width:'min(100% - 40px,620px)',background:'#fff',borderRadius:16,padding:22,boxShadow:'0 20px 60px rgba(0,0,0,.25)'},modalHead:{display:'flex',justifyContent:'space-between',alignItems:'center'},modalOptions:{display:'grid',gap:10,marginTop:18},modalOptionsBtn:{padding:14,border:'1px solid #e2bfb5',borderRadius:10,background:'#f7f3f0',textAlign:'left',cursor:'pointer'} };
const postS = { subjectCode: { display:'inline-block', padding:'2px 6px', borderRadius:4, background:'#dceeff', color:'#075985', fontWeight:800, fontSize:9, marginRight:5 }, attachment: { display:'inline-flex', alignItems:'center', gap:3, width:'fit-content', marginTop:4, padding:'3px 7px', borderRadius:5, background:'#e8f4ff', color:'#12608c', fontSize:9, fontWeight:700 } };
