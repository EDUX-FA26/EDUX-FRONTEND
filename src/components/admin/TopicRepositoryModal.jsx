import React, { useCallback, useEffect, useRef, useState } from 'react';
import TopicService from '../../services/topic.service';
import '../../pages/module-pages.css';

const parseApiError = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export default function TopicRepositoryModal({ subject, onClose }) {
  const [activeTab, setActiveTab] = useState('canonical'); // 'canonical' | 'proposals'
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Modals inside Topic Repository
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editTopic, setEditTopic] = useState(null);
  const [legacyTopic, setLegacyTopic] = useState(null);
  const [proposalTopic, setProposalTopic] = useState(null);
  const [aliasTopic, setAliasTopic] = useState(null);
  const [toggleTopic, setToggleTopic] = useState(null);

  // Form states
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch topics
  const loadTopics = useCallback(async () => {
    if (!subject?.id) return;
    setLoading(true);
    setError('');
    try {
      const params = {
        includeAll: true,
        page,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (activeTab === 'proposals') {
        params.status = statusFilter === 'rejected' ? 'rejected' : 'pending_approval';
      } else {
        if (statusFilter === 'legacy') {
          params.status = 'approved';
          params.reviewRequired = true;
        } else if (statusFilter === 'confirmed') {
          params.status = 'approved';
          params.reviewRequired = false;
        } else if (statusFilter === 'inactive') {
          params.isActive = false;
        } else if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
      }

      const res = await TopicService.getTopics(subject.id, params);
      if (res.data?.items) {
        setTopics(res.data.items);
        setTotal(res.data.total ?? res.data.items.length);
      } else if (Array.isArray(res.data)) {
        setTopics(res.data);
        setTotal(res.data.length);
      } else {
        setTopics([]);
        setTotal(0);
      }
    } catch (err) {
      setError(parseApiError(err, 'Không thể tải danh mục Topic. Vui lòng thử lại.'));
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [subject?.id, activeTab, statusFilter, search, page]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  // Statistics
  const confirmedCount = topics.filter(
    (t) => t.status === 'approved' && t.review_required === false && t.is_active !== false
  ).length;
  const legacyCount = topics.filter(
    (t) => t.status === 'approved' && t.review_required === true
  ).length;
  const pendingCount = topics.filter((t) => t.status === 'pending_approval').length;
  const inactiveCount = topics.filter((t) => t.is_active === false).length;

  // Clear feedback alert after 4s
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Handle Create Canonical Topic
  const handleCreateTopic = async (payload) => {
    setFormSubmitting(true);
    setModalError('');
    try {
      await TopicService.createTopic({
        subjectId: subject.id,
        name: payload.name.trim(),
        code: payload.code?.trim() || null,
        description: payload.description?.trim() || '',
      });
      setCreateModalOpen(false);
      setActionSuccess('Đã tạo Canonical Topic chuẩn thành công.');
      await loadTopics();
    } catch (err) {
      setModalError(parseApiError(err, 'Không thể tạo Topic.'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Edit Topic
  const handleUpdateTopic = async (payload) => {
    setFormSubmitting(true);
    setModalError('');
    try {
      await TopicService.updateTopic(editTopic.id, {
        name: payload.name.trim(),
        code: payload.code?.trim() || null,
        description: payload.description?.trim() || '',
      });
      setEditTopic(null);
      setActionSuccess('Đã cập nhật Topic thành công.');
      await loadTopics();
    } catch (err) {
      setModalError(parseApiError(err, 'Không thể cập nhật Topic.'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Confirm Legacy Topic
  const handleConfirmLegacy = async (payload) => {
    setFormSubmitting(true);
    setModalError('');
    try {
      await TopicService.confirmLegacyTopic(legacyTopic.id, {
        code: payload.code?.trim() || null,
        name: payload.name?.trim(),
        description: payload.description?.trim(),
        reviewNote: payload.reviewNote?.trim() || '',
      });
      setLegacyTopic(null);
      setActionSuccess('Đã thẩm định và xác nhận Topic legacy thành công.');
      await loadTopics();
    } catch (err) {
      setModalError(parseApiError(err, 'Không thể xác nhận Topic legacy.'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Review Proposal (Approve / Reject)
  const handleReviewProposal = async (payload) => {
    setFormSubmitting(true);
    setModalError('');
    try {
      await TopicService.reviewProposal(proposalTopic.id, payload);
      setProposalTopic(null);
      setActionSuccess(
        payload.status === 'approved' ? 'Đã phê duyệt đề xuất Topic thành công.' : 'Đã từ chối đề xuất Topic.'
      );
      await loadTopics();
    } catch (err) {
      setModalError(parseApiError(err, 'Không thể xử lý đề xuất Topic.'));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Toggle Status (Deactivate / Reactivate)
  const handleToggleStatus = async () => {
    if (!toggleTopic) return;
    setFormSubmitting(true);
    setModalError('');
    try {
      const nextActive = !toggleTopic.is_active;
      await TopicService.toggleTopicStatus(toggleTopic.id, nextActive);
      setToggleTopic(null);
      setActionSuccess(
        nextActive ? 'Đã kích hoạt lại Topic.' : 'Đã ngừng sử dụng Topic (vẫn bảo toàn lịch sử).'
      );
      await loadTopics();
    } catch (err) {
      setModalError(parseApiError(err, 'Không thể thay đổi trạng thái Topic.'));
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div
      className="module-modal"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ zIndex: 1100 }}
    >
      <section
        className="module-modal__panel card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-repo-title"
        style={{ maxWidth: 1060, width: '95vw', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="module-modal__header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="module-page__eyebrow" style={{ margin: 0 }}>Kho Canonical Topic</span>
              <span className="module-badge module-badge--primary" style={{ fontSize: '0.75rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, marginRight: 4 }}>domain</span>
                School Context
              </span>
              <span className="module-code" style={{ fontSize: '0.85rem' }}>{subject?.code}</span>
            </div>
            <h2 id="topic-repo-title" style={{ margin: '6px 0 0', fontSize: '1.4rem' }}>
              {subject?.name}
            </h2>
            <p className="module-page__subtitle" style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>
              Mô hình phẳng <strong>School → Subject → Topic</strong> (không qua Chapter). Mọi Flashcard, bài tập và lộ trình AI Study Plan liên kết trực tiếp với UUID của Topic chuẩn.
            </p>
          </div>
          <button
            className="module-icon-button"
            type="button"
            onClick={onClose}
            aria-label="Đóng kho Topic"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Global Notifications */}
        {actionSuccess && (
          <div className="module-alert" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#047857', border: '1px solid #10b981', marginTop: 12 }}>
            <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
            {actionSuccess}
          </div>
        )}
        {error && (
          <div className="module-alert" role="alert" style={{ marginTop: 12 }}>
            <span className="material-symbols-outlined" aria-hidden="true">error</span>
            {error}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadTopics}
              style={{ marginLeft: 'auto', padding: '4px 8px', fontSize: '0.78rem' }}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Statistics Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 14 }}>
          <div className="card" style={{ padding: '12px 14px', background: 'var(--color-surface-muted)' }}>
            <div className="module-secondary-text" style={{ fontSize: '0.78rem' }}>Topic chuẩn đã duyệt</div>
            <div className="module-primary-text" style={{ fontSize: '1.25rem', marginTop: 2, color: '#059669', fontWeight: 700 }}>
              {confirmedCount}
            </div>
            <div className="module-secondary-text" style={{ fontSize: '0.72rem' }}>Sẵn sàng cho Flashcard mới</div>
          </div>

          <div
            className="card"
            style={{
              padding: '12px 14px',
              background: legacyCount > 0 ? 'rgba(245, 158, 11, 0.08)' : 'var(--color-surface-muted)',
              border: legacyCount > 0 ? '1px solid #f59e0b' : '1px solid var(--color-border)',
            }}
          >
            <div className="module-secondary-text" style={{ fontSize: '0.78rem', color: legacyCount > 0 ? '#b45309' : undefined }}>
              Legacy cần rà soát
            </div>
            <div className="module-primary-text" style={{ fontSize: '1.25rem', marginTop: 2, color: '#d97706', fontWeight: 700 }}>
              {legacyCount}
            </div>
            <div className="module-secondary-text" style={{ fontSize: '0.72rem' }}>Dữ liệu cũ cần thẩm định</div>
          </div>

          <div className="card" style={{ padding: '12px 14px', background: 'var(--color-surface-muted)' }}>
            <div className="module-secondary-text" style={{ fontSize: '0.78rem' }}>Đề xuất chờ duyệt</div>
            <div className="module-primary-text" style={{ fontSize: '1.25rem', marginTop: 2, color: '#2563eb', fontWeight: 700 }}>
              {pendingCount}
            </div>
            <div className="module-secondary-text" style={{ fontSize: '0.72rem' }}>Từ Giảng viên bộ môn</div>
          </div>

          <div className="card" style={{ padding: '12px 14px', background: 'var(--color-surface-muted)' }}>
            <div className="module-secondary-text" style={{ fontSize: '0.78rem' }}>Ngừng hoạt động</div>
            <div className="module-primary-text" style={{ fontSize: '1.25rem', marginTop: 2, color: '#6b7280', fontWeight: 700 }}>
              {inactiveCount}
            </div>
            <div className="module-secondary-text" style={{ fontSize: '0.72rem' }}>Bảo lưu lịch sử sinh viên</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--color-border)', marginTop: 16, paddingBottom: 6 }}>
          <button
            type="button"
            className={`btn ${activeTab === 'canonical' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem' }}
            onClick={() => {
              setActiveTab('canonical');
              setStatusFilter('all');
              setPage(1);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>category</span>
            Kho Topic môn học
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'proposals' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', position: 'relative' }}
            onClick={() => {
              setActiveTab('proposals');
              setStatusFilter('pending_approval');
              setPage(1);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rate_review</span>
            Đề xuất từ Giảng viên
            {pendingCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '1px 6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  marginLeft: 6,
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 12, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            <div className="module-search" style={{ minWidth: 220, maxWidth: 360 }}>
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <input
                className="module-input"
                placeholder="Tìm theo tên, mã hoặc alias..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {activeTab === 'canonical' ? (
              <select
                className="module-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                style={{ width: 'auto', minWidth: 170 }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="confirmed">Đã xác nhận chuẩn</option>
                <option value="legacy">Legacy cần rà soát ({legacyCount})</option>
                <option value="inactive">Đã ngừng sử dụng</option>
              </select>
            ) : (
              <select
                className="module-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                style={{ width: 'auto', minWidth: 170 }}
              >
                <option value="pending_approval">Chờ duyệt</option>
                <option value="rejected">Bị từ chối</option>
                <option value="all">Tất cả đề xuất</option>
              </select>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                setModalError('');
                setImportModalOpen(true);
              }}
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>upload_file</span>
              Import Excel
            </button>

            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setModalError('');
                setCreateModalOpen(true);
              }}
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Thêm Topic chuẩn
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ marginTop: 12 }}>
          {loading ? (
            <div className="module-state" style={{ padding: '36px 0' }}>
              <div className="module-state__icon">
                <span className="material-symbols-outlined">progress_activity</span>
              </div>
              <h3 style={{ margin: '8px 0 0' }}>Đang tải danh mục Topic...</h3>
            </div>
          ) : topics.length === 0 ? (
            <div className="module-state" style={{ padding: '36px 0' }}>
              <div className="module-state__icon">
                <span className="material-symbols-outlined">folder_open</span>
              </div>
              <h3 style={{ margin: '8px 0 0' }}>Chưa có Topic phù hợp</h3>
              <p className="module-secondary-text">
                {activeTab === 'proposals'
                  ? 'Hiện không có đề xuất nào từ giảng viên cần xử lý.'
                  : 'Hãy bấm "Thêm Topic chuẩn" để tạo chủ đề học thuật đầu tiên cho môn này.'}
              </p>
            </div>
          ) : (
            <div className="module-table-wrap">
              <table className="module-table">
                <thead>
                  <tr>
                    <th style={{ width: 110 }}>Mã Topic</th>
                    <th>Tên Topic & Mô tả</th>
                    <th style={{ width: 110 }}>Alias</th>
                    <th style={{ width: 110 }}>Flashcards</th>
                    <th style={{ width: 140 }}>Trạng thái</th>
                    <th style={{ width: 140, textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((t) => {
                    const isLegacy = t.status === 'approved' && t.review_required === true;
                    const isConfirmed = t.status === 'approved' && t.review_required === false;
                    const isPending = t.status === 'pending_approval';
                    const isRejected = t.status === 'rejected';

                    return (
                      <tr key={t.id} style={{ opacity: t.is_active === false ? 0.6 : 1 }}>
                        {/* Code */}
                        <td>
                          {t.code ? (
                            <span className="module-code">{t.code}</span>
                          ) : (
                            <span className="module-secondary-text" style={{ fontStyle: 'italic', fontSize: '0.78rem' }}>
                              (Chưa có mã)
                            </span>
                          )}
                        </td>

                        {/* Name & Description */}
                        <td>
                          <div className="module-primary-text" style={{ fontWeight: 600 }}>
                            {t.name}
                          </div>
                          {t.description && (
                            <div
                              className="module-secondary-text"
                              style={{
                                fontSize: '0.8rem',
                                marginTop: 2,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {t.description}
                            </div>
                          )}
                          {t.review_note && (
                            <div
                              style={{
                                fontSize: '0.74rem',
                                color: isRejected ? '#b91c1c' : '#4b5563',
                                background: 'var(--color-surface-muted)',
                                padding: '2px 6px',
                                borderRadius: 4,
                                marginTop: 4,
                                display: 'inline-block',
                              }}
                            >
                              Ghi chú: {t.review_note}
                            </div>
                          )}
                        </td>

                        {/* Aliases */}
                        <td>
                          <button
                            type="button"
                            className="module-badge"
                            onClick={() => {
                              setModalError('');
                              setAliasTopic(t);
                            }}
                            title="Quản lý từ đồng nghĩa / Alias"
                            style={{ cursor: 'pointer', background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13, marginRight: 2 }}>tag</span>
                            {t.alias_count ?? 0} alias
                          </button>
                        </td>

                        {/* Flashcards Count */}
                        <td>
                          <span
                            className="module-badge"
                            title={`${t.flashcard_count ?? 0} flashcards đang gắn topic này`}
                            style={{ background: Number(t.flashcard_count) > 0 ? 'rgba(37, 99, 235, 0.1)' : undefined }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13, marginRight: 2 }}>style</span>
                            {t.flashcard_count ?? 0} thẻ
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td>
                          {t.is_active === false ? (
                            <span className="module-badge module-badge--muted">Ngừng HĐ</span>
                          ) : isLegacy ? (
                            <span
                              className="module-badge"
                              style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#b45309', border: '1px solid #f59e0b' }}
                              title="Topic cũ từ hệ thống trước, chưa được School Admin xác nhận học thuật"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 13, marginRight: 2 }}>warning</span>
                              Legacy cần duyệt
                            </span>
                          ) : isConfirmed ? (
                            <span className="module-badge module-badge--success" title="Đã được School Admin xác nhận chuẩn">
                              <span className="material-symbols-outlined" style={{ fontSize: 13, marginRight: 2 }}>verified</span>
                              Đã xác nhận
                            </span>
                          ) : isPending ? (
                            <span className="module-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#1d4ed8' }}>
                              Chờ duyệt
                            </span>
                          ) : isRejected ? (
                            <span className="module-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#b91c1c' }}>
                              Từ chối
                            </span>
                          ) : null}
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="module-row__actions" style={{ justifyContent: 'flex-end', gap: 4 }}>
                            {/* Nút xác nhận legacy nếu là legacy */}
                            {isLegacy && (
                              <button
                                className="module-icon-button"
                                type="button"
                                onClick={() => {
                                  setModalError('');
                                  setLegacyTopic(t);
                                }}
                                title="Thẩm định & Xác nhận Topic legacy này"
                                style={{ color: '#d97706' }}
                              >
                                <span className="material-symbols-outlined">rule</span>
                              </button>
                            )}

                            {/* Nút duyệt đề xuất nếu pending */}
                            {isPending && (
                              <button
                                className="module-icon-button"
                                type="button"
                                onClick={() => {
                                  setModalError('');
                                  setProposalTopic(t);
                                }}
                                title="Phê duyệt hoặc từ chối đề xuất"
                                style={{ color: '#2563eb' }}
                              >
                                <span className="material-symbols-outlined">fact_check</span>
                              </button>
                            )}

                            {/* Nút sửa */}
                            <button
                              className="module-icon-button"
                              type="button"
                              onClick={() => {
                                setModalError('');
                                setEditTopic(t);
                              }}
                              title="Chỉnh sửa Topic"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>

                            {/* Nút quản lý alias */}
                            <button
                              className="module-icon-button"
                              type="button"
                              onClick={() => {
                                setModalError('');
                                setAliasTopic(t);
                              }}
                              title="Quản lý Alias"
                            >
                              <span className="material-symbols-outlined">label</span>
                            </button>

                            {/* Nút bật/tắt active (không hard delete) */}
                            <button
                              className={`module-icon-button ${t.is_active !== false ? 'module-icon-button--danger' : ''}`}
                              type="button"
                              onClick={() => {
                                setModalError('');
                                setToggleTopic(t);
                              }}
                              title={t.is_active !== false ? 'Ngừng sử dụng Topic' : 'Kích hoạt lại Topic'}
                            >
                              <span className="material-symbols-outlined">
                                {t.is_active !== false ? 'block' : 'restart_alt'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Tạo Topic chuẩn */}
        {createModalOpen && (
          <TopicFormModal
            title="Thêm Canonical Topic chuẩn mới"
            initialData={{ code: '', name: '', description: '' }}
            saving={formSubmitting}
            error={modalError}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={handleCreateTopic}
          />
        )}

        {/* Modal: Chỉnh sửa Topic */}
        {editTopic && (
          <TopicFormModal
            title="Chỉnh sửa Canonical Topic"
            initialData={{
              code: editTopic.code || '',
              name: editTopic.name || '',
              description: editTopic.description || '',
            }}
            saving={formSubmitting}
            error={modalError}
            onClose={() => setEditTopic(null)}
            onSubmit={handleUpdateTopic}
          />
        )}

        {/* Modal: Xác nhận Legacy */}
        {legacyTopic && (
          <ConfirmLegacyModal
            topic={legacyTopic}
            saving={formSubmitting}
            error={modalError}
            onClose={() => setLegacyTopic(null)}
            onSubmit={handleConfirmLegacy}
          />
        )}

        {/* Modal: Duyệt đề xuất */}
        {proposalTopic && (
          <ReviewProposalModal
            proposal={proposalTopic}
            saving={formSubmitting}
            error={modalError}
            onClose={() => setProposalTopic(null)}
            onSubmit={handleReviewProposal}
          />
        )}

        {/* Modal: Quản lý Alias */}
        {aliasTopic && (
          <AliasManagerModal
            topic={aliasTopic}
            onClose={() => {
              setAliasTopic(null);
              loadTopics();
            }}
          />
        )}

        {/* Dialog: Xác nhận ngừng / kích hoạt lại */}
        {toggleTopic && (
          <ToggleStatusDialog
            topic={toggleTopic}
            saving={formSubmitting}
            error={modalError}
            onClose={() => setToggleTopic(null)}
            onConfirm={handleToggleStatus}
          />
        )}

        {/* Modal: Import Excel */}
        {importModalOpen && (
          <TopicExcelImportModal
            subject={subject}
            onClose={() => setImportModalOpen(false)}
            onSuccess={(msg) => {
              setImportModalOpen(false);
              setActionSuccess(msg || 'Import Topic từ Excel thành công!');
              loadTopics();
            }}
          />
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-Modal: Form Tạo / Sửa Topic chuẩn
// ─────────────────────────────────────────────
function TopicFormModal({ title, initialData, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="module-modal" style={{ zIndex: 1200 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="module-modal__panel card" style={{ maxWidth: 520 }}>
        <div className="module-modal__header">
          <h3>{title}</h3>
          <button className="module-icon-button" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="module-form-grid" style={{ marginTop: 12 }}>
            <div className="module-field">
              <label htmlFor="t-code">Mã Topic (Code)</label>
              <input
                id="t-code"
                className="module-input"
                placeholder="VD: PTR_BASIC"
                value={form.code}
                onChange={(e) => setForm((curr) => ({ ...curr, code: e.target.value.toUpperCase() }))}
                maxLength={80}
              />
              <span className="module-secondary-text" style={{ fontSize: '0.72rem' }}>
                Mã định danh duy nhất trong môn học (không bắt buộc, chữ in hoa).
              </span>
            </div>
            <div className="module-field module-field--full">
              <label htmlFor="t-name">Tên Topic *</label>
              <input
                id="t-name"
                className="module-input"
                placeholder="VD: Con trỏ và Quản lý bộ nhớ"
                value={form.name}
                onChange={(e) => setForm((curr) => ({ ...curr, name: e.target.value }))}
                maxLength={255}
                required
                autoFocus
              />
            </div>
            <div className="module-field module-field--full">
              <label htmlFor="t-desc">Mô tả học thuật & Ranh giới kiến thức</label>
              <textarea
                id="t-desc"
                className="module-textarea"
                placeholder="Mô tả phạm vi kiến thức của Topic để hệ thống gợi ý và phân loại chính xác..."
                value={form.description}
                onChange={(e) => setForm((curr) => ({ ...curr, description: e.target.value }))}
                maxLength={4000}
                rows={4}
              />
            </div>
          </div>

          {error && (
            <div className="module-alert" role="alert" style={{ marginTop: 12 }}>
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <div className="module-modal__actions" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" type="button" onClick={onClose} disabled={saving}>
              Hủy
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving || !form.name.trim()}>
              {saving ? 'Đang lưu...' : 'Lưu Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-Modal: Xác nhận Topic legacy (32 records baseline)
// ─────────────────────────────────────────────
function ConfirmLegacyModal({ topic, saving, error, onClose, onSubmit }) {
  const [code, setCode] = useState(topic.code || '');
  const [name, setName] = useState(topic.name || '');
  const [description, setDescription] = useState(topic.description || '');
  const [reviewNote, setReviewNote] = useState(topic.review_note || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ code, name, description, reviewNote });
  };

  return (
    <div className="module-modal" style={{ zIndex: 1200 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="module-modal__panel card" style={{ maxWidth: 580 }}>
        <div className="module-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: '#d97706', fontSize: 24 }}>rule</span>
            <h3 style={{ margin: 0 }}>Thẩm định & Xác nhận Topic Legacy</h3>
          </div>
          <button className="module-icon-button" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div style={{ padding: 12, borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', marginTop: 12, fontSize: '0.82rem', color: '#92400e' }}>
          <strong>Lưu ý quan trọng:</strong> Topic này thuộc 32 Topic lịch sử mang cờ <code>review_required = true</code>. Thao tác xác nhận sẽ <strong>giữ nguyên UUID</strong> và bảo toàn toàn bộ Flashcards/lịch sử sinh viên liên kết, đồng thời đưa Topic vào danh mục chính thức cho các câu hỏi mới.
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
          <div className="module-form-grid">
            <div className="module-field">
              <label htmlFor="leg-code">Gán Mã Topic chuẩn (Code)</label>
              <input
                id="leg-code"
                className="module-input"
                placeholder="VD: PTR_MEM_01"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={80}
              />
            </div>
            <div className="module-field module-field--full">
              <label htmlFor="leg-name">Tên Topic chuẩn hóa *</label>
              <input
                id="leg-name"
                className="module-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={255}
                required
              />
            </div>
            <div className="module-field module-field--full">
              <label htmlFor="leg-desc">Mô tả học thuật</label>
              <textarea
                id="leg-desc"
                className="module-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={4000}
                rows={3}
              />
            </div>
            <div className="module-field module-field--full">
              <label htmlFor="leg-note">Ghi chú thẩm định của School Admin</label>
              <input
                id="leg-note"
                className="module-input"
                placeholder="VD: Đã rà soát khớp đề cương môn học học kỳ FA26"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                maxLength={2000}
              />
            </div>
          </div>

          {error && (
            <div className="module-alert" role="alert" style={{ marginTop: 12 }}>
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <div className="module-modal__actions" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" type="button" onClick={onClose} disabled={saving}>
              Hủy
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Đang xác nhận...' : 'Xác nhận đạt chuẩn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-Modal: Duyệt đề xuất từ Giảng viên
// ─────────────────────────────────────────────
function ReviewProposalModal({ proposal, saving, error, onClose, onSubmit }) {
  const parsedCodeMatch =
    !proposal.code && proposal.description
      ? proposal.description.match(/^\[Mã gợi ý:\s*([^\]]+)\]\s*([\s\S]*)$/)
      : null;

  const initialCode = proposal.code || (parsedCodeMatch ? parsedCodeMatch[1].trim() : '');
  const initialDescription = parsedCodeMatch
    ? parsedCodeMatch[2].trim()
    : proposal.description || '';

  const [code, setCode] = useState(initialCode);
  const [name, setName] = useState(proposal.name || '');
  const [description, setDescription] = useState(initialDescription);
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState('');

  const handleApprove = (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setLocalError('Tên Topic không được để trống khi phê duyệt');
      return;
    }
    if (!code.trim()) {
      setLocalError('Mã Topic chính thức (Code) là bắt buộc khi phê duyệt Topic chuẩn');
      return;
    }
    setLocalError('');
    onSubmit({
      status: 'approved',
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      reviewNote: note.trim(),
    });
  };

  const handleReject = () => {
    if (!note.trim()) {
      setLocalError('Vui lòng nhập lý do / ghi chú phản hồi khi từ chối đề xuất');
      return;
    }
    setLocalError('');
    onSubmit({
      status: 'rejected',
      reviewNote: note.trim(),
    });
  };

  return (
    <div
      className="module-modal"
      style={{ zIndex: 1200 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="module-modal__panel card" style={{ maxWidth: 580 }}>
        <div className="module-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: 24 }}>
              fact_check
            </span>
            <h3 style={{ margin: 0 }}>Phê duyệt Đề xuất Topic</h3>
          </div>
          <button className="module-icon-button" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Thông tin ban đầu từ Giảng viên */}
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: 'var(--color-surface-muted)',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="module-secondary-text" style={{ fontSize: '0.75rem' }}>
                Đề xuất ban đầu từ Giảng viên:
              </div>
              <div className="module-primary-text" style={{ fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>
                {proposal.name}
              </div>
            </div>
            {initialCode && (
              <span className="module-code" style={{ fontSize: '0.8rem' }}>
                Gợi ý: {initialCode}
              </span>
            )}
          </div>
          {proposal.review_note && (
            <div style={{ marginTop: 6, fontSize: '0.8rem', color: '#4b5563' }}>
              <strong>Lý do từ Giảng viên:</strong> {proposal.review_note}
            </div>
          )}
        </div>

        <form onSubmit={handleApprove} style={{ marginTop: 14 }}>
          <div className="module-form-grid">
            <div className="module-field">
              <label htmlFor="rev-code">Mã Topic chính thức (Code) *</label>
              <input
                id="rev-code"
                className="module-input"
                placeholder="VD: GENEVA_ACCORDS_1954"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={80}
                required
              />
              <span className="module-field-hint" style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>
                Bắt buộc khi phê duyệt Topic chuẩn. Admin có thể chỉnh sửa trước khi duyệt.
              </span>
            </div>

            <div className="module-field module-field--full">
              <label htmlFor="rev-name">Tên Topic chính thức *</label>
              <input
                id="rev-name"
                className="module-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={255}
                required
              />
            </div>

            <div className="module-field module-field--full">
              <label htmlFor="rev-desc">Mô tả học thuật</label>
              <textarea
                id="rev-desc"
                className="module-textarea"
                placeholder="Mô tả nội dung học thuật cho Topic này..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={4000}
                rows={3}
              />
            </div>

            <div className="module-field module-field--full">
              <label htmlFor="rev-note">Ghi chú phản hồi của School Admin</label>
              <textarea
                id="rev-note"
                className="module-textarea"
                placeholder="Ghi chú phản hồi cho giảng viên (bắt buộc nếu từ chối đề xuất)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={2000}
                rows={2}
              />
            </div>
          </div>

          {(localError || error) && (
            <div className="module-alert" role="alert" style={{ marginTop: 12 }}>
              <span className="material-symbols-outlined">error</span>
              {localError || error}
            </div>
          )}

          <div className="module-modal__actions" style={{ marginTop: 16 }}>
            <button className="btn btn-secondary" type="button" onClick={onClose} disabled={saving}>
              Đóng
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={saving}
              onClick={handleReject}
              style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
            >
              Từ chối đề xuất
            </button>
            <button className="btn btn-primary" type="submit" disabled={saving || !name.trim() || !code.trim()}>
              {saving ? 'Đang duyệt...' : 'Phê duyệt làm Topic chuẩn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-Modal: Quản lý Topic Aliases
// ─────────────────────────────────────────────
function AliasManagerModal({ topic, onClose }) {
  const [aliases, setAliases] = useState([]);
  const [newAlias, setNewAlias] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAliases = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await TopicService.getAliases(topic.id);
      setAliases(res.data || []);
    } catch (err) {
      setError(parseApiError(err, 'Không thể tải danh sách Alias.'));
    } finally {
      setLoading(false);
    }
  }, [topic.id]);

  useEffect(() => {
    loadAliases();
  }, [loadAliases]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newAlias.trim()) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await TopicService.addAlias(topic.id, newAlias.trim());
      setNewAlias('');
      setSuccess('Đã thêm Alias thành công.');
      await loadAliases();
    } catch (err) {
      setError(parseApiError(err, 'Không thể thêm Alias.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (aliasId) => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await TopicService.deleteAlias(topic.id, aliasId);
      setSuccess('Đã xóa Alias.');
      await loadAliases();
    } catch (err) {
      setError(parseApiError(err, 'Không thể xóa Alias.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="module-modal" style={{ zIndex: 1200 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="module-modal__panel card" style={{ maxWidth: 540 }}>
        <div className="module-modal__header">
          <div>
            <p className="module-page__eyebrow" style={{ margin: 0 }}>Từ đồng nghĩa (Synonyms)</p>
            <h3 style={{ margin: '4px 0 0' }}>Quản lý Alias: {topic.name}</h3>
          </div>
          <button className="module-icon-button" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="module-secondary-text" style={{ fontSize: '0.8rem', marginTop: 8 }}>
          Alias giúp hệ thống tự động nhận diện câu hỏi từ Excel hoặc AI matching khi giảng viên dùng cách viết khác. Không được trùng với tên Topic hoặc mã môn học khác.
        </p>

        {/* Form thêm alias */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            className="module-input"
            placeholder="Nhập tên Alias mới (VD: Con trỏ trong C)..."
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            maxLength={200}
            required
            autoFocus
          />
          <button className="btn btn-primary" type="submit" disabled={submitting || !newAlias.trim()} style={{ whiteSpace: 'nowrap' }}>
            {submitting ? 'Thêm...' : '+ Thêm Alias'}
          </button>
        </form>

        {error && (
          <div className="module-alert" role="alert" style={{ marginTop: 10 }}>
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}
        {success && (
          <div className="module-alert" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#047857', border: '1px solid #10b981', marginTop: 10 }}>
            <span className="material-symbols-outlined">check_circle</span>
            {success}
          </div>
        )}

        {/* Danh sách alias */}
        <div style={{ marginTop: 16 }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '0.88rem' }}>Danh sách Alias hiện có ({aliases.length})</h4>
          {loading ? (
            <div className="module-secondary-text" style={{ padding: 12 }}>Đang tải alias...</div>
          ) : aliases.length === 0 ? (
            <div className="module-secondary-text" style={{ padding: 12, background: 'var(--color-surface-muted)', borderRadius: 8 }}>
              Chưa có alias nào cho Topic này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {aliases.map((a) => (
                <span
                  key={a.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: 'var(--color-surface-muted)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                  }}
                >
                  {a.alias}
                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    disabled={submitting}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      color: '#9ca3af',
                    }}
                    title={`Xóa alias "${a.alias}"`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="module-modal__actions" style={{ marginTop: 20 }}>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-Modal: Xác nhận đổi trạng thái (Deactivate)
// ─────────────────────────────────────────────
function ToggleStatusDialog({ topic, saving, error, onClose, onConfirm }) {
  const isDeactivating = topic.is_active !== false;

  return (
    <div className="module-modal" style={{ zIndex: 1200 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="module-modal__panel card" style={{ maxWidth: 480 }}>
        <div className="module-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="material-symbols-outlined"
              style={{ color: isDeactivating ? '#dc2626' : '#16a34a', fontSize: 24 }}
            >
              {isDeactivating ? 'warning' : 'restart_alt'}
            </span>
            <h3 style={{ margin: 0 }}>
              {isDeactivating ? 'Ngừng sử dụng Topic?' : 'Kích hoạt lại Topic?'}
            </h3>
          </div>
          <button className="module-icon-button" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <p style={{ margin: 0 }}>
            Bạn có chắc muốn {isDeactivating ? 'ngừng sử dụng' : 'kích hoạt lại'} Topic <strong>“{topic.name}”</strong>?
          </p>
          {isDeactivating && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid #f87171',
                fontSize: '0.82rem',
                color: '#991b1b',
              }}
            >
              Hệ thống <strong>không xóa cứng</strong> Topic này để bảo toàn {topic.flashcard_count ?? 0} Flashcards và dữ liệu phân tích học tập lịch sử của sinh viên. Topic sẽ không hiển thị khi chọn chủ đề cho Flashcard mới.
            </div>
          )}
        </div>

        {error && (
          <div className="module-alert" role="alert" style={{ marginTop: 12 }}>
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        <div className="module-modal__actions" style={{ marginTop: 16 }}>
          <button className="btn btn-secondary" type="button" onClick={onClose} disabled={saving}>
            Hủy
          </button>
          <button
            className={`btn ${isDeactivating ? 'btn-danger' : 'btn-primary'}`}
            type="button"
            onClick={onConfirm}
            disabled={saving}
            style={isDeactivating ? { background: '#dc2626', color: '#fff', border: 'none' } : undefined}
          >
            {saving
              ? 'Đang xử lý...'
              : isDeactivating
              ? 'Xác nhận ngừng sử dụng'
              : 'Xác nhận kích hoạt lại'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-Modal: Import Canonical Topics bằng Excel
// ─────────────────────────────────────────────
function TopicExcelImportModal({ subject, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    setError('');
    try {
      const blob = await TopicService.downloadExcelTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `canonical_topics_template_example.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(parseApiError(err, 'Không thể tải file mẫu. Vui lòng thử lại sau.'));
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setError('');
    setImportResult(null);
    setPreviewResult(null);
    setPreviewing(true);

    try {
      const res = await TopicService.importExcel(subject.id, selectedFile, { preview: true });
      setPreviewResult(res);
    } catch (err) {
      setError(parseApiError(err, 'Không thể đọc file hoặc file không đúng định dạng.'));
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!file) {
      setError('Vui lòng chọn file Excel để import');
      return;
    }
    setImporting(true);
    setError('');

    try {
      const res = await TopicService.importExcel(subject.id, file, { preview: false });
      setImportResult(res);
      if (res.importedCount > 0) {
        onSuccess(`Đã import thành công ${res.importedCount} Topic chuẩn!`);
      }
    } catch (err) {
      setError(parseApiError(err, 'Có lỗi xảy ra khi import danh sách Topic.'));
    } finally {
      setImporting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validItems = previewResult?.validItems || [];
  const skippedDetails = previewResult?.skippedDetails || [];

  return (
    <div
      className="module-modal"
      style={{ zIndex: 1200 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="module-modal__panel card"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: 880, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="module-modal__header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: 24 }}>
                upload_file
              </span>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Import Topic chuẩn bằng Excel</h3>
            </div>
            <p className="module-secondary-text" style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>
              Môn học: <strong>{subject?.name}</strong> ({subject?.code}) • Mô hình phẳng Flat Topic (không có Chapter)
            </p>
          </div>
          <button className="module-icon-button" type="button" onClick={onClose} aria-label="Đóng">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Global Error */}
        {error && (
          <div className="module-alert" role="alert" style={{ marginTop: 12 }}>
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Success Alert if already imported */}
        {importResult && (
          <div
            className="module-alert"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#047857',
              border: '1px solid #10b981',
              marginTop: 12,
            }}
          >
            <span className="material-symbols-outlined">check_circle</span>
            <div>
              <strong>Import hoàn tất:</strong> Đã tạo thành công{' '}
              <strong>{importResult.importedCount}</strong> Topic chuẩn.
              {importResult.skippedCount > 0 && (
                <span> (Bỏ qua {importResult.skippedCount} dòng do trùng lặp hoặc thiếu thông tin).</span>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Template Download Banner */}
        <div
          style={{
            marginTop: 14,
            padding: '14px 16px',
            background: 'rgba(37, 99, 235, 0.04)',
            border: '1px solid rgba(37, 99, 235, 0.18)',
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '0.92rem', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lightbulb</span>
                Cấu trúc file mẫu Excel (.xlsx, .csv)
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-ink-muted)', lineHeight: 1.5 }}>
                File mẫu chuẩn gồm 4 cột ở dòng 1: <strong>Mã Topic</strong> (tùy chọn), <strong>Tên Topic</strong> (<span style={{ color: '#ef4444' }}>*bắt buộc</span>), <strong>Mô tả</strong> và <strong>Từ đồng nghĩa</strong> (phân cách bằng dấu chấm phẩy <code>;</code>).
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
              {downloading ? 'Đang tải mẫu...' : 'Tải file mẫu (.xlsx)'}
            </button>
          </div>
        </div>

        {/* Step 2: File Selector / Dropzone */}
        {!importResult && (
          <div style={{ marginTop: 14 }}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) handleFileChange(selected);
              }}
            />

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) handleFileChange(dropped);
                }}
                style={{
                  border: '2px dashed var(--color-border)',
                  borderRadius: 12,
                  padding: '28px 16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--color-surface-muted)',
                  transition: 'border-color 0.2s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--color-ink-muted)' }}>
                  upload_file
                </span>
                <p style={{ margin: '8px 0 2px', fontWeight: 600, fontSize: '0.9rem' }}>
                  Nhấp để chọn file hoặc kéo thả file Excel vào đây
                </p>
                <p className="module-secondary-text" style={{ margin: 0, fontSize: '0.78rem' }}>
                  Hỗ trợ định dạng .xlsx, .xls hoặc .csv (tối đa 10MB)
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--color-surface-muted)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: 24 }}>
                    description
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{file.name}</div>
                    <div className="module-secondary-text" style={{ fontSize: '0.76rem' }}>
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing || previewing}
                  >
                    Chọn file khác
                  </button>
                  <button
                    type="button"
                    className="module-icon-button"
                    onClick={() => {
                      setFile(null);
                      setPreviewResult(null);
                      setImportResult(null);
                      setError('');
                    }}
                    disabled={importing || previewing}
                    title="Hủy file"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview state & Table */}
        {previewing && (
          <div className="module-state" style={{ padding: '24px 0' }}>
            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', fontSize: 28 }}>
              progress_activity
            </span>
            <p style={{ margin: '8px 0 0', fontSize: '0.86rem' }}>Đang phân tích và kiểm tra tính hợp lệ của file Excel...</p>
          </div>
        )}

        {previewResult && !importResult && (
          <div style={{ marginTop: 14 }}>
            {/* Summary pills */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
              <span className="module-badge" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                Tổng số dòng: <strong>{previewResult.total}</strong>
              </span>
              <span
                className="module-badge"
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#047857',
                  border: '1px solid #10b981',
                  fontSize: '0.8rem',
                  padding: '4px 10px',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>check_circle</span>
                Sẵn sàng import: <strong>{previewResult.validCount}</strong>
              </span>
              {previewResult.invalidCount > 0 && (
                <span
                  className="module-badge"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#b91c1c',
                    border: '1px solid #ef4444',
                    fontSize: '0.8rem',
                    padding: '4px 10px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>warning</span>
                  Bỏ qua / lỗi: <strong>{previewResult.invalidCount}</strong>
                </span>
              )}
            </div>

            {/* Preview table */}
            <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <table className="module-table" style={{ fontSize: '0.82rem', margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: 50, textAlign: 'center' }}>Dòng</th>
                    <th style={{ width: 110 }}>Trạng thái</th>
                    <th style={{ width: 110 }}>Mã Topic</th>
                    <th style={{ minWidth: 160 }}>Tên Topic (*)</th>
                    <th>Mô tả</th>
                    <th style={{ minWidth: 140 }}>Từ đồng nghĩa</th>
                  </tr>
                </thead>
                <tbody>
                  {validItems.map((item, idx) => (
                    <tr key={`valid-${idx}`}>
                      <td style={{ textAlign: 'center', color: 'var(--color-ink-muted)' }}>{item.row || idx + 1}</td>
                      <td>
                        <span
                          className="module-badge module-badge--success"
                          style={{ fontSize: '0.72rem', padding: '2px 6px' }}
                        >
                          Hợp lệ
                        </span>
                      </td>
                      <td>
                        {item.code ? (
                          <span className="module-code" style={{ fontSize: '0.74rem' }}>{item.code}</span>
                        ) : (
                          <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.74rem' }}>(trống)</span>
                        )}
                      </td>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description || <span style={{ color: 'var(--color-ink-muted)' }}>-</span>}
                      </td>
                      <td>
                        {item.aliases?.length > 0 ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {item.aliases.map((al, aIdx) => (
                              <span
                                key={aIdx}
                                className="module-badge"
                                style={{ fontSize: '0.68rem', padding: '1px 5px', background: 'var(--color-surface-muted)' }}
                              >
                                {al}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-ink-muted)', fontSize: '0.74rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {skippedDetails.map((item, idx) => (
                    <tr key={`skipped-${idx}`} style={{ background: 'rgba(239, 68, 68, 0.04)' }}>
                      <td style={{ textAlign: 'center', color: '#b91c1c' }}>{item.row}</td>
                      <td>
                        <span
                          className="module-badge"
                          style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#b91c1c',
                            fontSize: '0.72rem',
                            padding: '2px 6px',
                          }}
                          title={item.reason}
                        >
                          Bỏ qua
                        </span>
                      </td>
                      <td>
                        {item.code ? (
                          <span className="module-code" style={{ fontSize: '0.74rem' }}>{item.code}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div style={{ color: '#b91c1c' }}>{item.name || '(Trống)'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#dc2626' }}>{item.reason}</div>
                      </td>
                      <td style={{ color: 'var(--color-ink-muted)' }}>-</td>
                      <td style={{ color: 'var(--color-ink-muted)' }}>-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="module-modal__actions" style={{ marginTop: 18, borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
          {importResult ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={onClose}
              style={{ fontSize: '0.85rem' }}
            >
              Hoàn tất & Đóng
            </button>
          ) : (
            <>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={onClose}
                disabled={importing}
                style={{ fontSize: '0.85rem' }}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleConfirmImport}
                disabled={importing || previewing || !file || (previewResult && previewResult.validCount === 0)}
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {importing ? 'progress_activity' : 'file_upload'}
                </span>
                {importing
                  ? 'Đang import dữ liệu...'
                  : previewResult
                  ? `Xác nhận Import (${previewResult.validCount} Topic)`
                  : 'Tiến hành Import'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

