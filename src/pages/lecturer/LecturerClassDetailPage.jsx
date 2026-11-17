import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ClassService from '../../services/class.service';
import AssignmentService from '../../services/assignment.service';
import SlotHistoriesModal from '../../components/modals/SlotHistoriesModal';
import {
    ChevronRight, Clock, Folder, FilePenLine, RotateCw, Calendar, Code, AlertCircle, Users,
    Flame,
    Download,
    Sparkles,
    Bot,
    Briefcase,
    Eye,
    Layers,
    Image as ImageIcon,
    Archive,
    FileCode,
    File
} from 'lucide-react';
import { PlusCircle, FileText, Upload, Trash2 } from 'lucide-react';
import AssignmentSubwindowModal from '../../components/student/AssignmentSubwindowModal';
import AssignmentFormModal from '../../components/lecturer/AssignmentFormModal';
import AssignmentDescriptionModal from '../../components/common/AssignmentDescriptionModal';
import ConfirmDeleteAssignmentModal from '../../components/common/ConfirmDeleteAssignmentModal';
import ClassMembersModal from "../../components/lecturer/ClassMembersModal";
import { ClassAiAdvisorModal } from '../../components/lecturer/ClassAiAdvisorModal';
import UploadSlotMaterialModal, { formatBytes } from '../../components/modals/UploadSlotMaterialModal';
import MaterialPreviewModal from '../../components/modals/MaterialPreviewModal';
import ClassMaterialService from '../../services/classMaterial.service';
export default function LecturerClassDetailPage() {
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
    const [isSlotHistoriesModalOpen, setIsSlotHistoriesModalOpen] = useState(false);

    // States cho Slot Assignment và Description Modal
    const [classAssignments, setClassAssignments] = useState([]);
    const [selectedDescAssignment, setSelectedDescAssignment] = useState(null);
    const [slotCreateTargetId, setSlotCreateTargetId] = useState(null);
    const [isSlotCreateModalOpen, setIsSlotCreateModalOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);
    const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);
    const [isSlotCreating, setIsSlotCreating] = useState(false);
    const slotSubmitLockRef = useRef(false);

    // States cho Slot Materials & Preview
    const [isUploadMaterialModalOpen, setIsUploadMaterialModalOpen] = useState(false);
    const [selectedPreviewMaterial, setSelectedPreviewMaterial] = useState(null);
    const [materialToDelete, setMaterialToDelete] = useState(null);
    const [isDeletingMaterial, setIsDeletingMaterial] = useState(false);

    const refreshSlotMaterials = useCallback(async (targetSlotId) => {
        if (!targetSlotId) return;
        try {
            const res = await ClassMaterialService.getSlotMaterials(targetSlotId, classId);
            const list = res?.data || res || [];
            setSlots(prev => prev.map(s => ((s.id || s._id) === targetSlotId ? { ...s, materials: list } : s)));
        } catch (err) {
            console.warn('Failed to refresh slot materials:', err);
        }
    }, [classId]);

    useEffect(() => {
        if (selectedSlotId) {
            refreshSlotMaterials(selectedSlotId);
        }
    }, [selectedSlotId, refreshSlotMaterials]);

    const handleDeleteMaterial = async () => {
        if (!materialToDelete || isDeletingMaterial) return;
        try {
            setIsDeletingMaterial(true);
            await ClassMaterialService.deleteSlotMaterial(materialToDelete.id);
            setSlots(prev => prev.map(s => {
                if (s.materials && Array.isArray(s.materials)) {
                    return {
                        ...s,
                        materials: s.materials.filter(m => m.id !== materialToDelete.id)
                    };
                }
                return s;
            }));
            setMaterialToDelete(null);
        } catch (err) {
            console.error('Failed to delete material:', err);
            alert('Không thể xóa tài liệu: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsDeletingMaterial(false);
        }
    };

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

    const handleCreateSlotAssignment = async (formData) => {
        if (slotSubmitLockRef.current || isSlotCreating) return;
        slotSubmitLockRef.current = true;
        setIsSlotCreating(true);

        try {
            formData.append('class_id', classId);
            await AssignmentService.createAssignment(formData);
            setIsSlotCreateModalOpen(false);
            await fetchData();
            slotSubmitLockRef.current = false;
            setIsSlotCreating(false);
        } catch (err) {
            slotSubmitLockRef.current = false;
            setIsSlotCreating(false);
            alert(err.response?.data?.message || 'Lỗi tạo bài tập');
            throw err;
        }
    };

    const handleConfirmDeleteAssignment = async (assignmentId, force = false) => {
        setIsDeletingAssignment(true);
        try {
            await AssignmentService.deleteAssignment(assignmentId, force);
            setAssignmentToDelete(null);
            await fetchData();
        } finally {
            setIsDeletingAssignment(false);
        }
    };

    // States cho AI Class Advisor Subwindow
    const [advisorData, setAdvisorData] = useState(null);
    const [isAdvisorModalOpen, setIsAdvisorModalOpen] = useState(false);
    const [isRefreshingAdvisor, setIsRefreshingAdvisor] = useState(false);
    const [isLoadingAdvisor, setIsLoadingAdvisor] = useState(false);

    // Đọc trạng thái bật/tắt tự động popup của riêng lớp hiện tại (mặc định là true nếu chưa từng tắt trong phiên này)
    const [isAutoPopupEnabled, setIsAutoPopupEnabled] = useState(() => {
        if (!classId) return true;
        const saved = sessionStorage.getItem(`art_ai_advisor_auto_${classId}`);
        return saved === null ? true : saved === 'true';
    });

    // Fetch dữ liệu AI Class Advisor
    const fetchAdvisorData = useCallback(async () => {
        if (!classId) return;
        try {
            setIsLoadingAdvisor(true);
            const res = await ClassService.getClassAiAdvisor(classId);
            const payload = res?.advisories ? res : (res?.data || res);
            if (payload && payload.has_data && Array.isArray(payload.advisories) && payload.advisories.length > 0) {
                setAdvisorData(payload);
            } else {
                setAdvisorData({ has_data: false, advisories: [] });
            }
        } catch (err) {
            console.warn('Could not fetch AI Advisor data:', err);
            setAdvisorData({ has_data: false, advisories: [] });
        } finally {
            setIsLoadingAdvisor(false);
        }
    }, [classId]);

    const handleOpenAdvisorModal = () => {
        if (!advisorData || !advisorData.has_data) {
            fetchAdvisorData();
        }
        setIsAdvisorModalOpen(true);
    };

    const handleCloseAdvisorModal = () => {
        setIsAdvisorModalOpen(false);
    };

    const handleRefreshAdvisor = async () => {
        if (isRefreshingAdvisor || !classId) return;
        try {
            setIsRefreshingAdvisor(true);
            const res = await ClassService.refreshClassAiAdvisor(classId);
            const payload = res?.data || res;
            if (payload && payload.has_data && payload.advisories?.length) {
                setAdvisorData(payload);
            }
        } catch (err) {
            console.error('Failed to refresh AI advisor:', err);
        } finally {
            setIsRefreshingAdvisor(false);
        }
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
                console.warn('Failed to load class assignments:', aErr);
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
            console.error('Failed to fetch class details:', err);
            setClassData(null);
            setSlots([]);
            setSelectedSlotId(null);
            setError(err.response?.data?.message || err.message || 'Không thể tải thông tin lớp học.');
        } finally {
            setLoading(false);
        }
    }, [classId, location.state]);

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

    // Đồng bộ lại state khi chuyển sang classId khác (ngăn chặn race condition giữa các lớp)
    useEffect(() => {
        if (!classId) return;
        const saved = sessionStorage.getItem(`art_ai_advisor_auto_${classId}`);
        setIsAutoPopupEnabled(saved === null ? true : saved === 'true');
        setIsAdvisorModalOpen(false);
        setAdvisorData(null);
    }, [classId]);

    useEffect(() => {
        fetchData();
        fetchAdvisorData();
    }, [fetchData, fetchAdvisorData]);

    // Kích hoạt tự động mở popup nếu: (1) Lớp có dữ liệu Advisor VÀ (2) Công tắc tự động của lớp đang BẬT
    useEffect(() => {
        if (
            !isLoadingAdvisor &&
            advisorData?.has_data &&
            Array.isArray(advisorData?.advisories) &&
            advisorData.advisories.length > 0 &&
            isAutoPopupEnabled
        ) {
            setIsAdvisorModalOpen(true);
        }
    }, [classId, advisorData, isLoadingAdvisor, isAutoPopupEnabled]);

    // Hàm xử lý khi giảng viên gạt công tắc Bật/Tắt
    const handleToggleAutoPopup = (nextValue) => {
        setIsAutoPopupEnabled(nextValue);
        sessionStorage.setItem(`art_ai_advisor_auto_${classId}`, String(nextValue));
    };

    const handleFullRefresh = () => {
        fetchData();
        fetchAdvisorData();
    };

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
                    <button className="btn btn-secondary" onClick={handleFullRefresh} style={{ fontSize: '12px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                    <Link to="/lecturer/classes" style={{ textDecoration: 'none', color: 'var(--color-ink-muted)' }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>My Teaching Courses</Link>
                    <ChevronRight size={14} />
                    <span style={{ color: 'var(--color-ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '600px' }}>
                        {classData.subject_name || classData.name || 'Class Detail'}
                    </span>
                </nav>

                {/* Tiêu đề khóa học & Advisor & Owner */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-ink)', margin: 0 }}>
                                {classData.subject_name || classData.name || 'Unnamed Class'}
                            </h1>

                            {/* Trigger Button Advisor: BẮT BUỘC luôn hiển thị ở Header cạnh tên môn học */}
                            <button
                                type="button"
                                onClick={handleOpenAdvisorModal}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-lg transition shadow-xs hover:shadow-sm cursor-pointer group"
                                title="Xem khuyến nghị giảng dạy AI cho buổi học (Advisor)"
                            >
                                <Bot className="w-4 h-4 text-purple-600 transition-transform group-hover:scale-110" />
                                <span>Advisor</span>
                                {advisorData?.has_data && (
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                                    </span>
                                )}
                            </button>
                        </div>
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
                        onClick={() => setIsSlotHistoriesModalOpen(true)}
                        className="btn btn-secondary cursor-pointer"
                        style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
                    >
                        <Clock size={14} /> Slot histories
                    </button>
                    <button className="btn" onClick={() => navigate(`/lecturer/classes/${classId}/materials`)} style={{ backgroundColor: 'var(--color-accent-teal)', color: '#fff', padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}>
                        <Folder size={14} /> Materials
                    </button>
                    {/* NÚT MEMBERS MỚI THÊM */}
                    <button
                        className="btn"
                        onClick={() => setIsMembersModalOpen(true)}
                        style={{
                            backgroundColor: "#4f46e5",
                            color: "#fff",
                            padding: "0 12px",
                            height: "32px",
                            fontSize: "12px",
                            borderRadius: "var(--radius-sm)",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <Users size={14} />
                        Members
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsAssignmentModalOpen(true)} style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}>
                        <FilePenLine size={14} /> Assignments
                    </button>
                    <button className="btn btn-secondary" onClick={handleFullRefresh} style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}>
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

                                {/* Danh sách bài tập được gắn cho Slot này */}
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
                                                    Chưa có bài tập nào được gắn riêng cho Slot này.
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
                                                                    onClick={() => navigate(`/lecturer/assignments/${asg.id}`)}
                                                                    className="btn btn-primary"
                                                                    style={{ padding: '4px 8px', fontSize: '11px', height: '24px' }}
                                                                >
                                                                    Open
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setAssignmentToDelete(asg);
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                                    title="Xóa bài tập này"
                                                                    aria-label="Xóa bài tập"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {(() => {
                                    const currentSlotMaterials = Array.isArray(selectedSlot?.materials) ? selectedSlot.materials : [];
                                    const slotNum = selectedSlot.slot_number || slots.findIndex(s => s === selectedSlot) + 1;
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
                                                    Chưa có tài liệu nào được tải lên cho buổi học này.
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
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setMaterialToDelete(mat);
                                                                    }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                                    title="Xóa tài liệu này"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '24px' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSlotCreateTargetId(selectedSlot.id || selectedSlot._id);
                                            setIsSlotCreateModalOpen(true);
                                        }}
                                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl px-4 py-2.5 text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
                                    >
                                        <PlusCircle size={15} />
                                        <span>+ Create Assignment</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsUploadMaterialModalOpen(true);
                                        }}
                                        className="bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 text-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs flex items-center gap-2 shadow-2xs transition cursor-pointer"
                                    >
                                        <Upload size={15} className="text-orange-500" />
                                        <span>Upload Material</span>
                                    </button>
                                </div>
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

            {/* Assignment Modal (Global List) */}
            {isAssignmentModalOpen && createPortal(
                <AssignmentSubwindowModal
                    isOpen={isAssignmentModalOpen}
                    onClose={() => setIsAssignmentModalOpen(false)}
                    classId={classId}
                    classCode={classData?.class_code || classData?.class_name}
                    role="lecturer"
                    onAssignmentCreated={fetchData}
                />,
                document.body
            )}

            {/* Sub-window xem trọn vẹn Description bài tập */}
            {selectedDescAssignment && (
                <AssignmentDescriptionModal
                    isOpen={!!selectedDescAssignment}
                    onClose={() => setSelectedDescAssignment(null)}
                    assignment={selectedDescAssignment}
                    onOpenAssignment={(id) => navigate(`/lecturer/assignments/${id}`)}
                />
            )}

            {/* Modal tạo bài tập trực tiếp từ Slot */}
            {isSlotCreateModalOpen && (
                <AssignmentFormModal
                    isOpen={isSlotCreateModalOpen}
                    onClose={() => {
                        if (!isSlotCreating) {
                            slotSubmitLockRef.current = false;
                            setIsSlotCreating(false);
                            setIsSlotCreateModalOpen(false);
                        }
                    }}
                    mode="create"
                    classId={classId}
                    initialSlotId={slotCreateTargetId}
                    slots={slots}
                    onSubmit={handleCreateSlotAssignment}
                    isSubmitting={isSlotCreating}
                    customTitle={`Tạo bài tập cho Slot ${selectedSlot?.slot_number || ''} - Lớp ${classData?.class_code || ''}`}
                />
            )}

            {/* Modal Xác nhận Xóa Bài tập */}
            {assignmentToDelete && (
                <ConfirmDeleteAssignmentModal
                    isOpen={Boolean(assignmentToDelete)}
                    onClose={() => setAssignmentToDelete(null)}
                    assignment={assignmentToDelete}
                    onConfirm={handleConfirmDeleteAssignment}
                    isDeleting={isDeletingAssignment}
                />
            )}

            <ClassMembersModal
                isOpen={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
                classId={classId}
                classData={classData}
            />

            {/* AI Class Advisor Subwindow Modal */}
            {isAdvisorModalOpen && createPortal(
                <ClassAiAdvisorModal
                    classId={classId}
                    isOpen={isAdvisorModalOpen}
                    onClose={handleCloseAdvisorModal}
                    advisorData={advisorData}
                    onRefresh={handleRefreshAdvisor}
                    isRefreshing={isRefreshingAdvisor || isLoadingAdvisor}
                    isAutoPopupEnabled={isAutoPopupEnabled}
                    onToggleAutoPopup={handleToggleAutoPopup}
                />,
                document.body
            )}

            {/* Modal Slot Histories */}
            <SlotHistoriesModal
                isOpen={isSlotHistoriesModalOpen}
                onClose={() => setIsSlotHistoriesModalOpen(false)}
                role="lecturer"
                onSelectSlot={(cls, slot, slotNumber) => {
                    setIsSlotHistoriesModalOpen(false);
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
                        navigate(`/lecturer/classes/${cls.id}`, { state: { slotId: slot?.id, slotNumber } });
                    }
                }}
                onSelectClass={(cls) => {
                    setIsSlotHistoriesModalOpen(false);
                    if (cls.id === classId) {
                        fetchData();
                    } else {
                        navigate(`/lecturer/classes/${cls.id}`);
                    }
                }}
            />

            {/* Modal Upload Slot Material */}
            {isUploadMaterialModalOpen && (
                <UploadSlotMaterialModal
                    isOpen={isUploadMaterialModalOpen}
                    onClose={() => setIsUploadMaterialModalOpen(false)}
                    slotId={selectedSlotId}
                    slotNumber={selectedSlot?.slot_number || slots.findIndex(s => s === selectedSlot) + 1}
                    slotTitle={selectedSlot?.title || ''}
                    classId={classId}
                    onSuccess={(createdMaterial) => {
                        if (createdMaterial) {
                            setSlots(prev => prev.map(s => {
                                if ((s.id || s._id) === selectedSlotId) {
                                    const existing = s.materials || [];
                                    const exists = existing.some(m => m.id === createdMaterial.id);
                                    return {
                                        ...s,
                                        materials: exists ? existing : [...existing, createdMaterial]
                                    };
                                }
                                return s;
                            }));
                        }
                        refreshSlotMaterials(selectedSlotId);
                    }}
                />
            )}

            {/* Modal Xem trước tài liệu học tập */}
            {selectedPreviewMaterial && (
                <MaterialPreviewModal
                    isOpen={Boolean(selectedPreviewMaterial)}
                    onClose={() => setSelectedPreviewMaterial(null)}
                    material={selectedPreviewMaterial}
                />
            )}

            {/* Modal Xác nhận Xóa Tài liệu */}
            {materialToDelete && createPortal(
                <div
                    className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => !isDeletingMaterial && setMaterialToDelete(null)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 p-6 flex flex-col gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Xóa tài liệu học tập</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Hành động này không thể hoàn tác</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            Bạn có chắc chắn muốn xóa tài liệu <strong>"{materialToDelete.title || materialToDelete.file_name}"</strong> khỏi buổi học này?
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                disabled={isDeletingMaterial}
                                onClick={() => setMaterialToDelete(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={isDeletingMaterial}
                                onClick={handleDeleteMaterial}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition cursor-pointer flex items-center gap-2 shadow-sm"
                            >
                                {isDeletingMaterial ? 'Đang xóa...' : 'Xóa tài liệu'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

