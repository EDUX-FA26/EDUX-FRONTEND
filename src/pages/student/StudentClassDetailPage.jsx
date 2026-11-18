import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import ClassService from '../../services/class.service';
import AssignmentService from '../../services/assignment.service';
import SlotHistoriesModal from '../../components/modals/SlotHistoriesModal';
import {
    ChevronRight, Clock, Folder, FilePenLine, RotateCw, Calendar, Code, AlertCircle,
    Users,
    Flame,
    FolderKanban,
    FileText,
    Eye,
    Layers,
    Briefcase,
    Download,
    Image as ImageIcon,
    Archive,
    FileCode,
    File
} from 'lucide-react';
import ProjectWorkspace from
    '../../components/student/ProjectWorkspace';
import AssignmentSubwindowModal from '../../components/student/AssignmentSubwindowModal';
import AssignmentDescriptionModal from '../../components/common/AssignmentDescriptionModal';
import MaterialPreviewModal, { formatBytes } from '../../components/modals/MaterialPreviewModal';
import ClassMaterialService from '../../services/classMaterial.service';
import { createPortal } from 'react-dom';

export default function StudentClassDetailPage() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [classData, setClassData] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewAll, setViewAll] = useState(false);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [isSlotHistoriesOpen, setIsSlotHistoriesOpen] = useState(false);
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // States cho Slot Assignment và Description Modal
    const [classAssignments, setClassAssignments] = useState([]);
    const [selectedDescAssignment, setSelectedDescAssignment] = useState(null);

    // States cho Slot Materials Preview
    const [selectedPreviewMaterial, setSelectedPreviewMaterial] = useState(null);

    useEffect(() => {
        if (!selectedSlotId) return;
        let isCurrent = true;
        ClassMaterialService.getSlotMaterials(selectedSlotId, classId)
            .then(res => {
                if (!isCurrent) return;
                const list = res?.data || res || [];
                setSlots(prev => prev.map(s => ((s.id || s._id) === selectedSlotId ? { ...s, materials: list } : s)));
            })
            .catch(err => {
                console.warn('Could not refresh slot materials:', err);
            });
        return () => { isCurrent = false; };
    }, [selectedSlotId, classId]);

    const getMaterialFileIcon = (fileName = '', fileType = '') => {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        const mime = (fileType || '').toLowerCase();
        if (mime.includes('pdf') || ext === 'pdf') {
            return <FileText size={16} className="text-rose-500" />;
        }
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || mime.startsWith('image/')) {
            return <ImageIcon size={16} className="text-purple-500" />;
        }
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return <Archive size={16} className="text-amber-500" />;
        }
        if (['doc', 'docx'].includes(ext)) {
            return <FileText size={16} className="text-blue-500" />;
        }
        if (['ppt', 'pptx'].includes(ext)) {
            return <FileText size={16} className="text-orange-500" />;
        }
        if (['xls', 'xlsx'].includes(ext)) {
            return <FileText size={16} className="text-emerald-500" />;
        }
        if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'html', 'css', 'json', 'txt', 'md'].includes(ext) || mime.startsWith('text/')) {
            return <FileCode size={16} className="text-emerald-500" />;
        }
        return <File size={16} className="text-slate-500" />;
    };

    const handleDirectDownload = async (mat, e) => {
        if (e) e.stopPropagation();
        try {
            let url = mat.download_url || mat.url;
            if (!url && mat.id) {
                const res = await ClassMaterialService.downloadMaterial(mat.id);
                const data = res.data || res;
                url = data.download_url || data.url;
            }
            if (url) {
                const link = document.createElement('a');
                link.href = url;
                link.download = mat.file_name || 'download';
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }
        } catch (err) {
            console.warn('Direct download fetch failed, opening preview modal:', err);
        }
        setSelectedPreviewMaterial(mat);
    };

    // Hàm gọi API lấy danh sách học viên
    const handleOpenMembersModal = async () => {
        setIsMembersModalOpen(true);
        try {
            setLoadingMembers(true);
            const res = await ClassService.getClassMembers(classId);
            const data = res?.data || res || [];
            setMembers(Array.isArray(data) ? data : data.data || []);
        } catch (err) {
            console.error("Failed to fetch members", err);
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const classRes = await ClassService.getClassDetail(classId);
            const slotsRes = await ClassService.getClassSlots(classId);

            const cData = classRes?.data || classRes || {};
            setClassData(cData);

            const sData = slotsRes?.data || slotsRes || [];
            const parsedSlots = Array.isArray(sData) ? sData : sData.data || [];

            setSlots(parsedSlots);

            // Fetch class assignments để đồng bộ vào từng Slot
            try {
                const asgRes = await AssignmentService.getClassAssignments(classId);
                const aData = asgRes?.data || asgRes || [];
                setClassAssignments(Array.isArray(aData) ? aData : aData.data || []);
            } catch (aErr) {
                console.warn('Failed to load class assignments for student:', aErr);
            }

            if (parsedSlots.length > 0) {
                const targetSlotId = location.state?.slotId;
                const targetSlotNumber = location.state?.slotNumber;
                let foundIdx = -1;
                if (targetSlotId && parsedSlots.some(s => (s.id || s._id) === targetSlotId)) {
                    foundIdx = parsedSlots.findIndex(s => (s.id || s._id) === targetSlotId);
                    setSelectedSlotId(targetSlotId);
                } else if (targetSlotNumber && parsedSlots.some(s => s.slot_number === targetSlotNumber)) {
                    foundIdx = parsedSlots.findIndex(s => s.slot_number === targetSlotNumber);
                    const match = parsedSlots[foundIdx];
                    setSelectedSlotId(match.id || match._id);
                } else {
                    setSelectedSlotId(prev => prev && parsedSlots.some(s => (s.id || s._id) === prev) ? prev : (parsedSlots[0].id || parsedSlots[0]._id));
                }

                if (foundIdx >= 0) {
                    setCurrentPage(Math.floor(foundIdx / 10) + 1);
                }
            } else {
                setSelectedSlotId(null);
            }

            setError(null);
        } catch (err) {
            console.error('Failed to fetch class details for student:', err);
            setClassData(null);
            setSlots([]);
            setSelectedSlotId(null);
            setError(err.response?.data?.message || err.message || 'Không thể tải thông tin lớp học.');
        } finally {
            setLoading(false);
        }
    }, [classId, location.state]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Lắng nghe thay đổi slot khi điều hướng từ modal trong cùng trang
    useEffect(() => {
        if (location.state && slots.length > 0) {
            const targetSlotId = location.state.slotId;
            const targetSlotNumber = location.state.slotNumber;
            let foundIdx = -1;
            if (targetSlotId && slots.some(s => (s.id || s._id) === targetSlotId)) {
                foundIdx = slots.findIndex(s => (s.id || s._id) === targetSlotId);
                setSelectedSlotId(targetSlotId);
            } else if (targetSlotNumber && slots.some(s => s.slot_number === targetSlotNumber)) {
                foundIdx = slots.findIndex(s => s.slot_number === targetSlotNumber);
                const match = slots[foundIdx];
                if (match) setSelectedSlotId(match.id || match._id);
            }
            if (foundIdx >= 0) {
                setCurrentPage(Math.floor(foundIdx / 10) + 1);
            }
        }
    }, [location.state, slots]);

    const handleSlotClick = (slotId) => {
        setSelectedSlotId(slotId);
    };

    if (loading || !classData) {
        if (error) {
            return (
                <div className="w-full flex items-center justify-between gap-4" style={{ width: '100%', padding: '16px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                    <button className="btn btn-secondary" onClick={fetchData} style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RotateCw size={14} /> Thử lại
                    </button>
                </div>
            );
        }

        return (
            <div className="animate-fade-in h-[calc(100vh-64px)] w-full max-w-full min-w-0 overflow-hidden flex flex-col px-6 pt-4 pb-5 box-border">
                <div className="skeleton mb-2" style={{ width: '200px', height: '20px' }}></div>
                <div className="skeleton mb-3" style={{ width: '400px', height: '36px' }}></div>
                <div className="skeleton mb-4" style={{ width: '500px', height: '32px' }}></div>
                <div className="flex-1 min-h-0 flex gap-5 w-full overflow-hidden">
                    <div className="w-48 shrink-0 h-full skeleton rounded-2xl"></div>
                    <div className="w-56 shrink-0 h-full skeleton rounded-2xl"></div>
                    <div className="flex-1 min-w-0 h-full skeleton rounded-3xl"></div>
                </div>
            </div>
        );
    }

    const selectedSlot = slots.find(s => (s.id || s._id) === selectedSlotId);

    const totalPages = Math.ceil(slots.length / 10);
    const displayedSlots = viewAll ? slots : slots.slice((currentPage - 1) * 10, currentPage * 10);

    return (
        <div className="animate-fade-in h-[calc(100vh-64px)] w-full max-w-full min-w-0 overflow-hidden flex flex-col px-6 pt-4 pb-5 box-border relative">
            {/* Header trên cùng: Breadcrumb + Tiêu đề + Actions Bar */}
            <div className="shrink-0 mb-4 flex flex-col gap-2.5">
                {/* Breadcrumb */}
                <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                    <Link to="/student/classes" style={{ textDecoration: 'none', color: 'var(--color-ink-muted)' }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>My Courses</Link>
                    <ChevronRight size={14} />
                    <span style={{ color: 'var(--color-ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '600px' }}>
                        {classData.subject_name || classData.name || 'Class Detail'}
                    </span>
                </nav>

                {/* Tiêu đề khóa học & Owner */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-ink)', margin: '0 0 4px 0' }}>
                            {classData.subject_name || classData.name || 'Unnamed Class'}
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                            <span style={{ color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>{classData.subject_code || 'CODE'}</span>
                            <span style={{ color: 'var(--color-ink-muted)' }}>• {classData.class_code || classData.class_name || 'N/A'}</span>
                        </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                        Owner <span style={{ fontWeight: 'bold', color: 'var(--color-ink)' }}>{classData.owner_name || classData.lecturer_name || 'N/A'}</span>
                    </div>
                </div>

                {/* Action Buttons Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <button
                        type="button"
                        onClick={() => setIsSlotHistoriesOpen(true)}
                        className="btn btn-secondary cursor-pointer"
                        style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
                    >
                        <Clock size={14} /> Slot histories
                    </button>
                    <button className="btn" onClick={() => navigate(`/student/classes/${classId}/materials`)} style={{ backgroundColor: 'var(--color-accent-teal)', color: '#fff', padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}>
                        <Folder size={14} /> Materials
                    </button>
                    {/* NÚT MEMBERS MỚI THÊM */}
                    <button
                        className="btn"
                        onClick={handleOpenMembersModal}
                        style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Users size={14} /> Members
                    </button>
                    <button
                        className="btn"
                        onClick={() => navigate(`/student/classes/${classId}/projects`)}
                        style={{
                            backgroundColor: '#0d9488',
                            color: '#fff',
                            padding: '0 12px',
                            height: '32px',
                            fontSize: '12px',
                            borderRadius: 'var(--radius-sm)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                        }}
                    >
                        <FolderKanban size={14} />
                        Projects
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsAssignmentModalOpen(true)} style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}>
                        <FilePenLine size={14} /> Assignments
                    </button>
                    <button className="btn btn-secondary" onClick={fetchData} style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}>
                        <RotateCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* Layout 3 cột: Classes | Slots | Class sessions */}
            <div className="flex-1 min-h-0 flex gap-5 w-full overflow-hidden">
                {/* Cột 1: Classes */}
                <div className="w-48 shrink-0 h-full flex flex-col overflow-hidden">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px' }} className="shrink-0">
                        <span style={{ fontWeight: 'bold', color: 'var(--color-ink)' }}>Classes</span>
                        <span style={{ color: 'var(--color-ink-muted)', fontSize: '11px' }}>1 class</span>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 custom-scroll" style={{ scrollbarWidth: 'thin' }}>
                        <div className="card" style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', flexShrink: 0 }}></span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{classData.class_code || classData.class_name || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Cột 2: Slots list */}
                <div className="w-56 shrink-0 h-full flex flex-col overflow-hidden">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px' }} className="shrink-0">
                        <span style={{ fontWeight: 'bold', color: 'var(--color-ink)' }}>Slots</span>
                        <span style={{ color: 'var(--color-ink-muted)', fontSize: '11px' }}>{slots.length} sessions</span>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 space-y-2.5 custom-scroll" style={{ scrollbarWidth: 'thin' }}>
                        {displayedSlots.length === 0 ? (
                            <div className="card" style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: 'var(--color-ink-muted)' }}>No slots available</div>
                        ) : displayedSlots.map((slot, index) => {
                            const isSelected = (slot.id || slot._id) === selectedSlotId;
                            return (
                                <div
                                    key={slot.id || slot._id || index}
                                    onClick={() => handleSlotClick(slot.id || slot._id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s',
                                        backgroundColor: isSelected ? 'var(--color-surface)' : 'var(--color-surface)',
                                        border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                                    }}
                                >
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0, transition: '0.2s',
                                        backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-primary-bg)',
                                        color: isSelected ? '#fff' : 'var(--color-ink)'
                                    }}>
                                        {slot.slot_number || index + 1}
                                    </div>
                                    <div style={{ fontSize: '10px', lineHeight: '1.2', color: 'var(--color-ink)', fontWeight: '600', overflow: 'hidden' }}>
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slot.date ? new Date(slot.date).toLocaleDateString('vi-VN') : 'N/A'}</div>
                                        <div style={{ color: 'var(--color-ink-muted)', fontWeight: '400', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slot.time || 'N/A'}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Phân trang Slot (cố định ở đáy cột Slots) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-ink-muted)', paddingTop: '8px', borderTop: '1px solid var(--color-border)', marginTop: '8px' }} className="shrink-0">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{ background: 'none', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.3 : 1, padding: '0 4px', color: 'inherit' }}
                        >
                            &lt;
                        </button>
                        <span style={{ fontWeight: '500', color: 'var(--color-ink)' }}>{currentPage} / {totalPages || 1}</span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            style={{ background: 'none', border: 'none', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.3 : 1, padding: '0 4px', color: 'inherit' }}
                        >
                            &gt;
                        </button>
                        <button
                            onClick={() => setViewAll(!viewAll)}
                            style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: 'var(--color-ink)', cursor: 'pointer' }}
                        >
                            {viewAll ? 'Pages' : 'All'}
                        </button>
                    </div>
                </div>

                {/* Cột 3: Nội dung chi tiết Class sessions */}
                <div
                    className="card flex-1 min-w-0 h-full bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden relative"
                    style={{
                        background: 'var(--color-surface, #fff)',
                        borderColor: 'var(--color-border, rgba(226, 232, 240, 0.8))',
                    }}
                >
                    <div
                        className="shrink-0 px-6 pt-5 pb-3.5 border-b border-slate-100 flex justify-between items-center"
                        style={{ borderBottomColor: 'var(--color-border, #f1f5f9)' }}
                    >
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-ink)', margin: '0 0 2px 0' }}>Class sessions</h2>
                            <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>{slots.length} sessions • Page {viewAll ? 'All' : currentPage} of {totalPages || 1}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                            Updated <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>just now</span>
                        </div>
                    </div>

                    <div
                        className="flex-1 min-h-0 overflow-y-auto p-6 custom-scroll"
                        style={{ scrollbarWidth: 'thin' }}
                    >
                        {selectedSlot ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-bg)', border: '1px solid var(--color-border)' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                                        {selectedSlot.slot_number || slots.findIndex(s => s === selectedSlot) + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-ink)', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                                            {selectedSlot.title || selectedSlot.content || 'Course Introduction...'}
                                        </h4>
                                        <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal' }}>
                                            <Calendar size={14} />
                                            <span>{selectedSlot.date ? new Date(selectedSlot.date).toLocaleDateString('vi-VN') : 'N/A'} {selectedSlot.time || ''}</span>
                                        </div>
                                    </div>
                                </div>

                                {(!selectedSlot.title && !selectedSlot.content) && (
                                    <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-ink-muted)', textAlign: 'center' }}>
                                        This slot has no specific detailed content yet.
                                    </div>
                                )}

                                {/* Danh sách bài tập được gắn cho Slot này (Student View) */}
                                {(() => {
                                    const currentSlotAssignments = (selectedSlot?.assignments && Array.isArray(selectedSlot.assignments) && selectedSlot.assignments.length > 0)
                                        ? selectedSlot.assignments
                                        : classAssignments.filter(a => (a.slot_id && (a.slot_id === selectedSlot?.id || a.slot_id === selectedSlot?._id)) || (a.session_id && (a.session_id === selectedSlot?.id || a.session_id === selectedSlot?._id)));
                                    return (
                                        <div style={{ marginTop: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                                    <FileText size={14} className="text-orange-500" />
                                                    <span>Bài tập của buổi học (Slot {selectedSlot.slot_number || slots.findIndex(s => s === selectedSlot) + 1})</span>
                                                </h5>
                                                <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                                                    {currentSlotAssignments.length} bài tập
                                                </span>
                                            </div>

                                            {currentSlotAssignments.length === 0 ? (
                                                <div style={{ padding: '12px', borderRadius: '8px', border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-surface)', fontSize: '11px', color: 'var(--color-ink-muted)', textAlign: 'center' }}>
                                                    Không có bài tập nào được giao riêng trong buổi học này.
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {currentSlotAssignments.map(asg => (
                                                        <div key={asg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#fff', gap: '10px' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontWeight: '600', fontSize: '12px', color: 'var(--color-ink)' }}>
                                                                    {asg.title}
                                                                </div>
                                                                <div
                                                                    onClick={() => setSelectedDescAssignment(asg)}
                                                                    className="cursor-pointer hover:text-orange-600 transition flex items-center gap-1 group text-[11px] text-slate-500 mt-1"
                                                                >
                                                                    <span className="line-clamp-1 group-hover:text-orange-600">
                                                                        {asg.description || asg.content || 'Xem mô tả...'}
                                                                    </span>
                                                                    <Eye size={12} className="text-slate-400 group-hover:text-orange-500 shrink-0" />
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                                <span style={{ fontSize: '10px', color: 'var(--color-ink-muted)' }}>
                                                                    {asg.deadline ? new Date(asg.deadline).toLocaleDateString('vi-VN') : ''}
                                                                </span>
                                                                <button
                                                                    onClick={() => navigate(`/student/assignments/${asg.id}`, { state: { classId } })}
                                                                    className="btn btn-primary"
                                                                    style={{ padding: '4px 8px', fontSize: '11px', height: '24px' }}
                                                                >
                                                                    Làm bài
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Danh sách tài liệu học tập của Slot này */}
                                {(() => {
                                    const currentSlotMaterials = Array.isArray(selectedSlot?.materials) ? selectedSlot.materials : [];
                                    const slotNum = selectedSlot.slot_number || selectedSlot.slotNumber || slots.findIndex(s => s === selectedSlot) + 1;
                                    return (
                                        <div style={{ marginTop: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                                    <Folder size={14} className="text-orange-500" />
                                                    <span>Tài liệu học tập của buổi học (Slot {slotNum})</span>
                                                </h5>
                                                <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                                                    {currentSlotMaterials.length} tài liệu
                                                </span>
                                            </div>

                                            {currentSlotMaterials.length === 0 ? (
                                                <div style={{ padding: '12px', borderRadius: '8px', border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-surface)', fontSize: '11px', color: 'var(--color-ink-muted)', textAlign: 'center' }}>
                                                    Chưa có tài liệu học tập nào được đính kèm cho Slot này.
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {currentSlotMaterials.map(mat => (
                                                        <div
                                                            key={mat.id}
                                                            onClick={() => setSelectedPreviewMaterial(mat)}
                                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#fff', gap: '10px' }}
                                                            className="cursor-pointer hover:border-orange-300 hover:shadow-2xs transition group"
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                    {getMaterialFileIcon(mat.file_name, mat.file_type)}
                                                                </div>
                                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                                    <div style={{ fontWeight: '600', fontSize: '12px', color: 'var(--color-ink)' }} className="group-hover:text-orange-600 transition truncate" title={mat.title || mat.file_name}>
                                                                        {mat.title || mat.file_name}
                                                                    </div>
                                                                    <div style={{ fontSize: '10px', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                                        <span className="truncate">{mat.file_name}</span>
                                                                        <span>•</span>
                                                                        <span className="shrink-0">{formatBytes(mat.file_size)}</span>
                                                                        {mat.created_at && (
                                                                            <>
                                                                                <span>•</span>
                                                                                <span className="shrink-0">{new Date(mat.created_at).toLocaleDateString('vi-VN')}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    {mat.description && (
                                                                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                                                            {mat.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedPreviewMaterial(mat);
                                                                    }}
                                                                    className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                                                                    title="Xem trực tiếp tài liệu"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleDirectDownload(mat, e)}
                                                                    className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition cursor-pointer"
                                                                    title="Tải xuống tài liệu"
                                                                >
                                                                    <Download size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </>
                        ) : (
                            <div style={{ marginTop: '32px', fontSize: '12px', color: 'var(--color-ink-muted)', textAlign: 'center' }}>
                                Please select a slot to view details.
                            </div>
                        )}
                    </div>

                    {/* Nút dọc nổi CLASS TOOLS bên phải */}
                    <div style={{
                        position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRight: 0,
                        boxShadow: 'var(--shadow-sm)', padding: '12px 4px', borderRadius: '4px 0 0 4px',
                        fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold',
                        writingMode: 'vertical-rl', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', zIndex: 10
                    }}>
                        <Code size={12} style={{ writingMode: 'horizontal-tb', transform: 'rotate(-90deg)' }} />
                        <span>CLASS TOOLS</span>
                    </div>
                </div>
            </div>

            {/* Assignment Modal */}
            {isAssignmentModalOpen && createPortal(
                <AssignmentSubwindowModal
                    isOpen={isAssignmentModalOpen}
                    onClose={() => setIsAssignmentModalOpen(false)}
                    classId={classId}
                    classCode={classData?.class_code || classData?.class_name}
                    role="student"
                />,
                document.body
            )}

            {/* Sub-window xem trọn vẹn Description bài tập (Student View) */}
            {selectedDescAssignment && (
                <AssignmentDescriptionModal
                    isOpen={!!selectedDescAssignment}
                    onClose={() => setSelectedDescAssignment(null)}
                    assignment={selectedDescAssignment}
                    onOpenAssignment={(id) => navigate(`/student/assignments/${id}`, { state: { classId } })}
                />
            )}

            {/* Modal Class Members */}
            {isMembersModalOpen && createPortal(
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '20px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)' }}>

                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: 'var(--color-ink)' }}>
                                    Class Members ({members.length})
                                </h3>
                                <span style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                                    {classData?.class_code || classData?.class_name}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsMembersModalOpen(false)}
                                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-ink-muted)' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
                            {loadingMembers ? (
                                <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: 'var(--color-ink-muted)' }}>
                                    Loading members...
                                </div>
                            ) : members.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: 'var(--color-ink-muted)' }}>
                                    No members found in this class.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {members.map((member, idx) => {
                                        const streak = member.currentStreak || 0;
                                        const fullName = member.fullName || member.full_name || member.name || 'N/A';
                                        const studentCode = member.studentCode || member.student_code || member.email || 'No Code';

                                        return (
                                            <div
                                                key={member.studentId || member.student_id || idx}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                                                        {fullName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-ink)' }}>
                                                            {fullName}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                                                            {studentCode}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Khối bên phải: Badge Streak + Badge Role */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {/* Badge Streak */}
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        backgroundColor: streak > 0 ? '#fff7ed' : '#f3f4f6',
                                                        color: streak > 0 ? '#ea580c' : '#9ca3af',
                                                        border: `1px solid ${streak > 0 ? '#ffedd5' : '#e5e7eb'}`
                                                    }}>
                                                        <Flame size={13} fill={streak > 0 ? '#f97316' : 'none'} color={streak > 0 ? '#ea580c' : '#9ca3af'} />
                                                        <span>{streak} {streak === 1}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--color-border)', textAlign: 'right' }}>
                            <button className="btn btn-secondary" onClick={() => setIsMembersModalOpen(false)} style={{ padding: '0 16px', height: '32px', fontSize: '12px' }}>
                                Close
                            </button>
                        </div>

                    </div>
                </div>,
                document.body
            )}

            {/* Modal Slot Histories */}
            <SlotHistoriesModal
                isOpen={isSlotHistoriesOpen}
                onClose={() => setIsSlotHistoriesOpen(false)}
                role="student"
                onSelectSlot={(cls, slot, slotNumber) => {
                    setIsSlotHistoriesOpen(false);
                    if (cls.id === classId) {
                        let targetId = slot?.id;
                        let targetIdx = -1;
                        if (targetId) {
                            targetIdx = slots.findIndex(s => (s.id || s._id) === targetId);
                        }
                        if (targetIdx === -1) {
                            targetIdx = slots.findIndex(s => s.slot_number === slotNumber);
                            if (targetIdx >= 0) targetId = slots[targetIdx].id || slots[targetIdx]._id;
                        }
                        if (targetId) {
                            setSelectedSlotId(targetId);
                            if (targetIdx >= 0) {
                                setCurrentPage(Math.floor(targetIdx / 10) + 1);
                            }
                        }
                    } else {
                        navigate(`/student/classes/${cls.id}`, { state: { slotId: slot?.id, slotNumber } });
                    }
                }}
                onSelectClass={(cls) => {
                    setIsSlotHistoriesOpen(false);
                    if (cls.id === classId) {
                        fetchData();
                    } else {
                        navigate(`/student/classes/${cls.id}`);
                    }
                }}
            />

            {/* Modal Xem trước tài liệu học tập */}
            {selectedPreviewMaterial && (
                <MaterialPreviewModal
                    isOpen={Boolean(selectedPreviewMaterial)}
                    onClose={() => setSelectedPreviewMaterial(null)}
                    material={selectedPreviewMaterial}
                />
            )}
        </div>
    );
}
