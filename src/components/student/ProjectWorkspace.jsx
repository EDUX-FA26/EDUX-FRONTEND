import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight, CalendarCheck2, Check, CheckCircle2, ChevronLeft,
  CircleAlert, ClipboardList, Clock3, FolderKanban, LoaderCircle,
  Mail, Plus, RefreshCw, Send, Sparkles, Users, UserPlus, X,
} from 'lucide-react';
import { ProjectsService } from '../../services/projects.service';
import api from '../../config/axios.config';
import './ProjectWorkspace.css';
import ProjectKanban from './kanban/ProjectKanban';
import { useAuth } from '../../contexts/AuthContext';

function getError(error) {
  return error?.response?.data?.message || error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
}

function Avatar({ name, index = 0 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  const tones = ['amber', 'teal', 'violet', 'sky'];
  return <span className={`pw-avatar pw-avatar--${tones[index % tones.length]}`} title={name}>{initial}</span>;
}

export default function ProjectWorkspace({ classId }) {
  const { user } = useAuth();

  const currentUserId = user?.id ?? null;
  const [projects, setProjects] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteBusyId, setInviteBusyId] = useState(null);

  const loadData = useCallback(async ({ showLoader = true } = {}) => {
    if (!classId) return;
    if (showLoader) setLoading(true);
    setError('');
    try {
      const [pResponse, iResponse] = await Promise.all([
        ProjectsService.getMyProjects(),
        ProjectsService.getMyInvitations(),
      ]);
      setProjects((Array.isArray(pResponse?.data) ? pResponse.data : []).filter(p => p.class_id === classId));
      setInvitations((Array.isArray(iResponse?.data) ? iResponse.data : []).filter(i => i.class_id === classId));
    } catch (err) {
      setError(getError(err));
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [classId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    setSelectedProject(null);
    setShowCreate(false);
    setClassStudents([]);
    setSentInvitations([]);
    setInviteSearch('');
  }, [classId]);

  const createProject = async e => {
    e.preventDefault();
    if (busy || !projectName.trim()) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await ProjectsService.createProject({
        classId, name: projectName.trim(), description: description.trim(),
      });
      setProjectName(''); setDescription(''); setShowCreate(false);
      setNotice('Dự án đã được tạo. Bạn có thể mở dự án để mời thành viên.');
      await loadData({ showLoader: false });
      if (response?.data?.id) {
        const detail = await ProjectsService.getProject(response.data.id);
        setSelectedProject(detail.data);
        await refreshInviteCandidates(detail.data.id);
      }
    } catch (err) { setError(getError(err)); }
    finally { setBusy(false); }
  };

  const openProject = async projectId => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const response = await ProjectsService.getProject(projectId);
      setSelectedProject(response.data);
      setInviteSearch('');
      if (projects.some(p => p.id === projectId && p.my_role === 'owner')) {
        await refreshInviteCandidates(projectId);
      }
    } catch (err) { setError(getError(err)); }
    finally { setBusy(false); }
  };

  const refreshInviteCandidates = async (projectId) => {
    setInviteLoading(true);
    try {
      const [membersResponse, invitationsResponse, projectResponse] = await Promise.all([
        api.get(`/classes/${classId}/members`, {
          schoolScoped: true,
        }),
        ProjectsService.getProjectInvitations(projectId),
        ProjectsService.getProject(projectId),
      ]);
      const members = membersResponse?.data?.data;
      const sent = invitationsResponse?.data;
      setClassStudents(Array.isArray(members) ? members.filter(m => (m.membershipStatus || m.status) === 'active') : []);
      setSentInvitations(Array.isArray(sent) ? sent : []);
      setSelectedProject(current => current?.id === projectId ? projectResponse.data : current);
    } catch (err) {
      setError(getError(err));
    } finally {
      setInviteLoading(false);
    }
  };

  const sendInvitation = async studentId => {
    if (!isOwner || busy || inviteBusyId || !selectedProject || !studentId) return;
    setInviteBusyId(studentId);
    setError(''); setNotice('');
    try {
      await ProjectsService.inviteMember(selectedProject.id, studentId);
      setNotice('Đã gửi lời mời. Sinh viên cần chấp nhận để tham gia dự án.');
      await refreshInviteCandidates(selectedProject.id);
    } catch (err) { setError(getError(err)); }
    finally { setInviteBusyId(null); }
  };

  const inviteCandidates = classStudents
    .filter(student => {
      const keyword = inviteSearch.trim().toLocaleLowerCase('vi');
      return !keyword || [student.fullName, student.studentCode, student.email]
        .filter(Boolean)
        .some(value => String(value).toLocaleLowerCase('vi').includes(keyword));
    });

  const activeIds = new Set((selectedProject?.members || []).map(m => m.user_id));
  const invitationStatusById = new Map(sentInvitations.map(i => [i.user_id, i.status]));

  const respondInvitation = async (id, accept) => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (accept) await ProjectsService.acceptInvitation(id);
      else await ProjectsService.rejectInvitation(id);
      await loadData({ showLoader: false });
      setNotice(accept ? 'Bạn đã tham gia dự án thành công.' : 'Bạn đã từ chối lời mời.');
    } catch (err) { setError(getError(err)); }
    finally { setBusy(false); }
  };

  if (!classId) return <div className="pw-alert pw-alert--error">Thiếu mã lớp học.</div>;

  const ownedProject = projects.some(project => project.my_role === 'owner');
  const isOwner = selectedProject && projects.some(p => p.id === selectedProject.id && p.my_role === 'owner');

  return (
    <div className="pw-root">
      <section className="pw-hero">
        <div className="pw-hero__copy">
          <div className="pw-eyebrow"><Sparkles size={14} /> EDUX · AGILE WORKSPACE</div>
          <h1>Biến ý tưởng thành <span>đồ án thực tế.</span></h1>
          <p>Tạo nhóm, chia công việc và theo dõi tiến độ học phần ngay trên EduX — không cần chuyển sang Jira.</p>
          <div className="pw-hero__actions">
            <button className="pw-btn pw-btn--white" type="button" onClick={() => { setSelectedProject(null); setShowCreate(true); }} disabled={busy || ownedProject}>
              <Plus size={17} /> Tạo dự án mới
            </button>
            <button className="pw-btn pw-btn--hero-ghost" type="button" onClick={() => loadData()} disabled={loading || busy}>
              <RefreshCw size={16} className={loading ? 'pw-spin' : ''} /> Làm mới
            </button>
          </div>
        </div>
        <div className="pw-hero__art" aria-hidden="true">
          <div className="pw-hero__float pw-hero__float--one"><CheckCircle2 size={21} /> Teamwork</div>
          <div className="pw-hero__board">
            <span className="pw-hero__board-label">PROJECT BOARD</span>
            <div><i className="pw-dot pw-dot--pale" /><span /><b /></div>
            <div><i className="pw-dot pw-dot--orange" /><span /><b /></div>
            <div><i className="pw-dot pw-dot--green" /><span /><b /></div>
          </div>
          <div className="pw-hero__float pw-hero__float--two"><Users size={18} /> Collaborate</div>
        </div>
      </section>

      <div className="pw-stats">
        <div className="pw-stat"><span className="pw-stat__icon pw-stat__icon--orange"><FolderKanban size={21} /></span><div><strong>{loading ? '…' : projects.length}</strong><span>Dự án của tôi</span></div></div>
        <div className="pw-stat"><span className="pw-stat__icon pw-stat__icon--blue"><Mail size={21} /></span><div><strong>{loading ? '…' : invitations.length}</strong><span>Lời mời đang chờ</span></div></div>
        <div className="pw-stat"><span className="pw-stat__icon pw-stat__icon--green"><Users size={21} /></span><div><strong>{loading ? '…' : projects.filter(p => p.my_role === 'owner').length}</strong><span>Nhóm do tôi quản lý</span></div></div>
      </div>

      {error && <div className="pw-alert pw-alert--error" role="alert"><CircleAlert size={18} /><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Đóng"><X size={15} /></button></div>}
      {notice && <div className="pw-alert pw-alert--success" role="status"><CheckCircle2 size={18} /><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Đóng"><X size={15} /></button></div>}

      {showCreate && (
        <section className="pw-panel pw-create">
          <div className="pw-section-heading"><div><span className="pw-section-kicker">BẮT ĐẦU</span><h2>Tạo dự án mới</h2><p>Đặt tên cho đồ án. Bạn sẽ là người quản lý nhóm.</p></div><button type="button" className="pw-icon-btn" onClick={() => setShowCreate(false)} aria-label="Đóng" disabled={busy}><X size={19} /></button></div>
          <form onSubmit={createProject} className="pw-form">
            <label htmlFor="pw-project-name">Tên dự án <span>*</span></label>
            <input id="pw-project-name" className="pw-input" placeholder="Ví dụ: EduX Learning Management System" value={projectName} maxLength={200} required onChange={e => setProjectName(e.target.value)} />
            <label htmlFor="pw-project-description">Mô tả ngắn</label>
            <textarea id="pw-project-description" className="pw-input pw-textarea" placeholder="Nhóm của bạn sẽ xây dựng sản phẩm gì?" value={description} maxLength={5000} rows={3} onChange={e => setDescription(e.target.value)} />
            <div className="pw-form__actions"><button type="button" className="pw-btn pw-btn--outline" disabled={busy} onClick={() => setShowCreate(false)}>Hủy</button><button type="submit" className="pw-btn pw-btn--primary" disabled={busy || !projectName.trim()}>{busy ? <LoaderCircle className="pw-spin" size={16} /> : <Plus size={16} />} Tạo dự án</button></div>
          </form>
        </section>
      )}

      {invitations.length > 0 && (
        <section className="pw-panel">
          <div className="pw-section-heading"><div><span className="pw-section-kicker">LỜI MỜI</span><h2>Đang chờ bạn phản hồi <span className="pw-counter">{invitations.length}</span></h2><p>Tham gia nhóm sau khi chấp nhận lời mời.</p></div><Mail size={20} className="pw-heading-icon" /></div>
          <div className="pw-invitations">
            {invitations.map(inv => (
              <div key={inv.invitation_id} className="pw-invitation">
                <span className="pw-invitation__icon"><Mail size={20} /></span>
                <div className="pw-invitation__content"><strong>{inv.project_name}</strong><span>{inv.subject_name || inv.class_code} · Mời bởi {inv.inviter_name || 'Thành viên trong lớp'}</span></div>
                <div className="pw-invitation__actions"><button className="pw-btn pw-btn--outline pw-btn--small" disabled={busy} onClick={() => respondInvitation(inv.invitation_id, false)}><X size={15} /> Từ chối</button><button className="pw-btn pw-btn--primary pw-btn--small" disabled={busy} onClick={() => respondInvitation(inv.invitation_id, true)}><Check size={15} /> Chấp nhận</button></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedProject ? (
        <section className="pw-panel pw-detail">
          <button className="pw-text-back" type="button" onClick={() => setSelectedProject(null)}><ChevronLeft size={17} /> Tất cả dự án</button>
          <div className="pw-section-heading pw-detail__title"><div><span className="pw-section-kicker">PROJECT DETAILS</span><h2>{selectedProject.name}</h2><p>{selectedProject.description || 'Chưa có mô tả cho dự án này.'}</p></div><span className="pw-status">Đang hoạt động</span></div>
          <div className="pw-detail__summary"><span><FolderKanban size={16} /> {selectedProject.class_code || 'Lớp học'}</span><span><Users size={16} /> {(selectedProject.members || []).length} thành viên</span></div>
          <div className="pw-section-heading pw-members-title"><div><h3>Thành viên nhóm</h3><p>Danh sách sinh viên đã tham gia dự án.</p></div></div>
          <div className="pw-member-list">
            {(selectedProject.members || []).map((member, i) => (
              <div className="pw-member" key={member.user_id}><Avatar index={i} name={member.full_name || member.student_code} /><div><strong>{member.full_name || member.student_code || 'Sinh viên'}</strong><span>{member.student_code || ''}</span></div><span className={`pw-role ${member.role === 'owner' ? 'pw-role--owner' : ''}`}>{member.role === 'owner' ? 'Trưởng nhóm' : 'Thành viên'}</span></div>
            ))}
          </div>
          {isOwner && (
            <section className="pw-invite-form" aria-label="Mời thành viên">
              <div>
                <h3><UserPlus size={18} /> Mời thành viên cùng lớp</h3>
                <p>Tìm theo tên, mã sinh viên hoặc email. Chỉ thành viên đang học lớp này mới có thể nhận lời mời.</p>
              </div>
              <div className="pw-invite-search">
                <input
                  className="pw-input"
                  type="search"
                  value={inviteSearch}
                  onChange={e => setInviteSearch(e.target.value)}
                  placeholder="Tìm tên, MSSV hoặc email..."
                  aria-label="Tìm sinh viên trong lớp"
                />
                <button type="button" className="pw-btn pw-btn--outline" disabled={inviteLoading || busy} onClick={() => refreshInviteCandidates(selectedProject.id)}><RefreshCw size={15} /> Làm mới</button>
              </div>
              <div className="pw-candidates">
                {inviteLoading ? (
                  <div className="pw-candidates__empty"><LoaderCircle size={16} className="pw-spin" /> Đang tải sinh viên...</div>
                ) : inviteCandidates.length === 0 ? (
                  <div className="pw-candidates__empty">Không tìm thấy sinh viên phù hợp trong lớp.</div>
                ) : inviteCandidates.map((student, index) => {
                  const id = student.studentId;
                  const alreadyJoined = activeIds.has(id);
                  const invitationStatus = invitationStatusById.get(id);
                  const pending = invitationStatus === 'pending';
                  const displayName = student.fullName || student.studentCode || 'Sinh viên';
                  const canInvite = !alreadyJoined && !pending;
                  return (
                    <div className="pw-candidate" key={id}>
                      <Avatar name={displayName} index={index} />
                      <div className="pw-candidate__body">
                        <strong>{displayName}</strong>
                        <span>{student.studentCode || ''}{student.email ? ` · ${student.email}` : ''}</span>
                      </div>
                      {alreadyJoined ? (
                        <span className="pw-candidate__status pw-candidate__status--joined"><Check size={14} /> Đã tham gia</span>
                      ) : pending ? (
                        <span className="pw-candidate__status"><Clock3 size={14} /> Đang chờ</span>
                      ) : (
                        <button
                          type="button"
                          className="pw-btn pw-btn--primary pw-btn--small"
                          disabled={!canInvite || busy || !!inviteBusyId}
                          onClick={() => sendInvitation(id)}
                        >
                          {inviteBusyId === id ? <LoaderCircle className="pw-spin" size={14} /> : <Send size={14} />}
                          {inviteBusyId === id ? 'Đang gửi...' : 'Mời'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="pw-invite-tip">Người được mời sẽ nhìn thấy lời mời trong Project Workspace của chính họ.</p>
            </section>
          )}
          <ProjectKanban
            currentUserId={currentUserId}
            key={selectedProject.id}
            projectId={selectedProject.id}
            members={selectedProject.members || []}
            isOwner={Boolean(isOwner)}
          />
        </section>
      ) : (
        <section className="pw-section">
          <div className="pw-section-heading"><div><span className="pw-section-kicker">KHÔNG GIAN LÀM VIỆC</span><h2>Dự án của tôi</h2><p>Truy cập và quản lý các dự án thuộc lớp học này.</p></div>{projects.length > 0 && <span className="pw-counter">{projects.length} dự án</span>}</div>
          {loading ? (
            <div className="pw-empty pw-empty--loading"><LoaderCircle size={28} className="pw-spin" /><strong>Đang tải dự án…</strong></div>
          ) : projects.length === 0 ? (
            <div className="pw-empty"><div className="pw-empty__visual"><span className="pw-empty__orb pw-empty__orb--left" /><FolderKanban size={43} strokeWidth={1.6} /><span className="pw-empty__orb pw-empty__orb--right" /></div><span className="pw-empty__eyebrow">YOUR NEXT BIG IDEA STARTS HERE</span><h3>Chưa có dự án nào trong lớp</h3><p>Tạo dự án đầu tiên, mời bạn cùng lớp tham gia và bắt đầu hành trình xây dựng sản phẩm của nhóm.</p><button type="button" className="pw-btn pw-btn--primary" disabled={busy} onClick={() => setShowCreate(true)}><Plus size={17} /> Tạo dự án đầu tiên <ArrowRight size={16} /></button><div className="pw-empty__features"><span><CheckCircle2 size={15} /> Lập nhóm</span><span><ClipboardList size={15} /> Phân công công việc</span><span><CalendarCheck2 size={15} /> Báo cáo hằng ngày</span></div></div>
          ) : (
            <div className="pw-project-grid">{projects.map((project, i) => <article className="pw-project-card" key={project.id}><div className="pw-project-card__top"><span className="pw-project-card__icon"><FolderKanban size={23} /></span><span className="pw-status">Đang hoạt động</span></div><h3>{project.name}</h3><div className="pw-project-card__meta">{project.subject_name || 'Môn học'} · {project.class_code || ''}</div><p>{project.description || 'Chưa có mô tả cho dự án.'}</p><div className="pw-project-card__bottom"><span className="pw-role pw-role--owner">{project.my_role === 'owner' ? 'Trưởng nhóm' : 'Thành viên'}</span><button className="pw-project-card__open" type="button" disabled={busy} onClick={() => openProject(project.id)}>Mở dự án <ArrowRight size={16} /></button></div></article>)}</div>
          )}
        </section>
      )}
    </div>
  );
}
