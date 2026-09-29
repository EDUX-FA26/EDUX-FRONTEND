import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClassMaterialService from '../../services/classMaterial.service';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
    FileText, Download, Trash2, Plus, ArrowLeft, 
    UploadCloud, Calendar, User, File, AlertCircle, X, HardDrive 
} from 'lucide-react';

const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const num = Number(bytes);
    if (isNaN(num)) return '';
    if (num < 1024) return num + ' B';
    else if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
    else return (num / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function ClassMaterialsPage() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [userRole, setUserRole] = useState('student');

    // Modal Upload state
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    const fetchMaterials = useCallback(async () => {
        try {
            setLoading(true);
            const res = await ClassMaterialService.getClassMaterials(classId);
            const listData = res?.data || res || [];
            setMaterials(Array.isArray(listData) ? listData : listData.data || []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể tải danh sách tài liệu lớp học.');
        } finally {
            setLoading(false);
        }
    }, [classId]);

    useEffect(() => {
        fetchMaterials();
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser?.role) {
            setUserRole(storedUser.role);
        }
    }, [fetchMaterials]);

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile || !uploadTitle.trim()) {
            setUploadError('Vui lòng chọn file và nhập tiêu đề tài liệu.');
            return;
        }

        try {
            setUploading(true);
            setUploadError(null);

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('title', uploadTitle);
            formData.append('description', uploadDescription);

            await ClassMaterialService.uploadClassMaterial(classId, formData);

            setIsUploadModalOpen(false);
            setUploadTitle('');
            setUploadDescription('');
            setSelectedFile(null);
            fetchMaterials();
        } catch (err) {
            setUploadError(err.response?.data?.message || 'Upload tài liệu thất bại. Vui lòng thử lại.');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (materialId) => {
        try {
            const res = await ClassMaterialService.downloadMaterial(materialId);
            const downloadUrl = res?.data?.url || res?.url;
            if (downloadUrl) {
                window.open(downloadUrl, '_blank');
            } else {
                alert('Không lấy được đường dẫn tải xuống.');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi khi tải xuống tài liệu.');
        }
    };

    const handleDelete = async (materialId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này không?')) return;
        try {
            await ClassMaterialService.deleteMaterial(materialId);
            setMaterials(prev => prev.filter(item => item.id !== materialId && item._id !== materialId));
        } catch (err) {
            alert(err.response?.data?.message || 'Không thể xóa tài liệu.');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                <div className="skeleton" style={{ width: '200px', height: '32px', borderRadius: '8px' }} />
                <div className="skeleton" style={{ width: '100%', height: '140px', borderRadius: '20px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="skeleton" style={{ height: '72px', borderRadius: '14px' }} />
                    <div className="skeleton" style={{ height: '72px', borderRadius: '14px' }} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '20px', borderRadius: '14px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: '0.875rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', verticalAlign: 'middle', marginRight: '8px' }}>error</span>
                {error}
            </div>
        );
    }

    const canUpload = ['lecturer', 'admin'].includes(userRole);

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>

            {/* Nút quay lại */}
            <div>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none',
                        color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', padding: 0
                    }}
                >
                    <ArrowLeft style={{ width: '18px', height: '18px' }} />
                    Quay lại lớp học
                </button>
            </div>

            {/* Header Trang Tài liệu */}
            <div className="card" style={{ padding: '32px 36px', background: 'linear-gradient(135deg, #1e293b 0%, #2c3b52 100%)', color: 'white', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(255,255,255,0.08)' }}>
                        <FileText style={{ width: '48px', height: '48px', color: 'var(--color-primary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.15)', color: '#ffdbcc', padding: '3px 10px', borderRadius: '6px', letterSpacing: '0.05em' }}>
                                TÀI LIỆU HỌC TẬP
                            </span>
                            <span className="badge badge-orange">
                                {userRole === 'lecturer' ? 'Giảng viên' : userRole === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
                            </span>
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'white' }}>
                            Kho Tài Liệu Lớp Học
                        </h1>
                    </div>
                </div>

                {canUpload && (
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus style={{ width: '18px', height: '18px' }} />
                        Upload tài liệu mới
                    </button>
                )}
            </div>

            {/* Danh sách tài liệu */}
            <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-ink)' }}>
                    Danh sách tài liệu ({materials.length})
                </h3>

                {materials.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-ink-muted)' }}>
                        <File style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.4 }} />
                        <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Chưa có tài liệu nào được đăng tải cho lớp học này.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {materials.map((mat) => {
                            const materialId = mat.id || mat._id;
                            return (
                                <div 
                                    key={materialId} 
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '16px 20px', borderRadius: '14px', background: 'var(--color-primary-card)',
                                        border: '1px solid var(--color-border)', gap: '16px', flexWrap: 'wrap',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                                        <div style={{ padding: '10px', borderRadius: '10px', background: 'white', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                                            <FileText style={{ width: '24px', height: '24px' }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                                            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {mat.title}
                                            </h4>
                                            {mat.description && (
                                                <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {mat.description}
                                                </p>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.75rem', color: 'var(--color-ink-soft)', marginTop: '2px', flexWrap: 'wrap' }}>
                                                {mat.file_name && (
                                                    <span style={{ fontStyle: 'italic', color: 'var(--color-ink)' }}>
                                                        📎 {mat.file_name}
                                                    </span>
                                                )}
                                                {mat.file_size && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <HardDrive style={{ width: '13px', height: '13px' }} />
                                                        {formatFileSize(mat.file_size)}
                                                    </span>
                                                )}
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar style={{ width: '13px', height: '13px' }} />
                                                    {mat.created_at ? new Date(mat.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                                                </span>
                                                {mat.uploaded_by_name && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <User style={{ width: '13px', height: '13px' }} />
                                                        {mat.uploaded_by_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Các nút hành động */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            onClick={() => handleDownload(materialId)}
                                            className="btn btn-secondary"
                                            style={{ height: '38px', padding: '0 14px', fontSize: '0.8125rem' }}
                                            title="Tải xuống tài liệu"
                                        >
                                            <Download style={{ width: '16px', height: '16px' }} />
                                            Tải xuống
                                        </button>

                                        {canUpload && (
                                            <button
                                                onClick={() => handleDelete(materialId)}
                                                style={{
                                                    height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid #fee2e2',
                                                    background: '#fee2e2', color: '#dc2626', cursor: 'pointer', display: 'inline-flex',
                                                    alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
                                                }}
                                                title="Xóa tài liệu"
                                            >
                                                <Trash2 style={{ width: '16px', height: '16px' }} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Upload */}
            {isUploadModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(31, 27, 23, 0.5)', backdropFilter: 'blur(4px)', padding: '16px'
                }}>
                    <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '520px', background: 'var(--color-surface)', padding: '28px', borderRadius: '20px', boxShadow: 'var(--shadow-xl)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UploadCloud style={{ width: '22px', height: '22px', color: 'var(--color-primary)' }} />
                                Tải lên tài liệu lớp học
                            </h3>
                            <button 
                                onClick={() => setIsUploadModalOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', padding: '4px' }}
                            >
                                <X style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>

                        {uploadError && (
                            <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: '0.8125rem' }}>
                                {uploadError}
                            </div>
                        )}

                        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '6px' }}>
                                    Tiêu đề tài liệu <span style={{ color: 'var(--color-danger)' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Nhập tiêu đề tài liệu..."
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '6px' }}>
                                    Mô tả (Tuỳ chọn)
                                </label>
                                <textarea
                                    className="input"
                                    style={{ height: '80px', padding: '12px 16px', resize: 'vertical' }}
                                    placeholder="Nhập ghi chú ngắn về tài liệu..."
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink)', marginBottom: '6px' }}>
                                    Chọn tệp tin <span style={{ color: 'var(--color-danger)' }}>*</span>
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    style={{ fontSize: '0.875rem', color: 'var(--color-ink)' }}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    className="btn btn-secondary"
                                    disabled={uploading}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={uploading}
                                >
                                    {uploading ? 'Đang tải lên...' : 'Xác nhận tải lên'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}