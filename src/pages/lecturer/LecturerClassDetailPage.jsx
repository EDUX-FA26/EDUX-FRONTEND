import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ClassService from '../../services/class.service';
import AssignmentService from '../../services/assignment.service';
import {
    ChevronRight, Clock, Folder, FilePenLine, RotateCw, Calendar, Code, AlertCircle, Users,
    Flame,
    Download,
    Sparkles,
    Bot,
    Briefcase,
    Eye,
    Layers
} from 'lucide-react';
import { PlusCircle, FileText, Upload, Trash2 } from 'lucide-react';
import AssignmentSubwindowModal from '../../components/student/AssignmentSubwindowModal';
import AssignmentFormModal from '../../components/lecturer/AssignmentFormModal';
import AssignmentDescriptionModal from '../../components/common/AssignmentDescriptionModal';
import ConfirmDeleteAssignmentModal from '../../components/common/ConfirmDeleteAssignmentModal';
import ClassMembersModal from "../../components/lecturer/ClassMembersModal";
import { ClassAiAdvisorModal } from '../../components/lecturer/ClassAiAdvisorModal';
export default function LecturerClassDetailPage() {
    const { classId } = useParams();
    const navigate = useNavigate();

    const [classData, setClassData] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSlotId, setSelectedSlotId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewAll, setViewAll] = useState(false);
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    // States cho Slot Assignment và Description Modal
    const [classAssignments, setClassAssignments] = useState([]);
    const [selectedDescAssignment, setSelectedDescAssignment] = useState(null);
    const [slotCreateTargetId, setSlotCreateTargetId] = useState(null);
    const [isSlotCreateModalOpen, setIsSlotCreateModalOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);
    const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);
    const [isSlotCreating, setIsSlotCreating] = useState(false);
    const slotSubmitLockRef = useRef(false);

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
            let parsedSlots = Array.isArray(sData) ? sData : sData.data || [];

            if (parsedSlots.length < 20) {
                const existingLength = parsedSlots.length;
                const mockSlots = Array.from({ length: 20 - existingLength }, (_, i) => {
                    const slotNum = existingLength + i + 1;
                    return {
                        id: `mock-slot-${slotNum}`,
                        _id: `mock-slot-${slotNum}`,
                        slot_number: slotNum,
                        date: new Date(Date.now() + i * 86400000).toISOString(),
                        time: slotNum % 2 === 0 ? '12:30 - 14:45' : '15:00 - 17:15',
                        title: `Session ${slotNum}: Introduction and Concepts`,
                        content: `Detailed content for session ${slotNum}`
                    };
                });
                parsedSlots = [...parsedSlots, ...mockSlots];
            }




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
                setSelectedSlotId(prev => prev && parsedSlots.some(s => (s.id || s._id) === prev) ? prev : (parsedSlots[0].id || parsedSlots[0]._id));
            }

            setError(null);
        } catch (err) {
            // Fallback to mock data if API fails or if it's a mock class
            setClassData({
                id: classId,
                subject_code: classId === 'mock-2' ? 'SWD392' : classId === 'mock-3' ? 'MMA301' : 'PRJ301',
                subject_name: classId === 'mock-2' ? 'Software Architecture and Design' : classId === 'mock-3' ? 'Mobile Application Development' : 'Java Web Application Development',
                class_code: 'SE20A09',
                class_name: 'SE20A09',
                owner_name: 'LoiNX',
                lecturer_name: 'LoiNX'
            });

            const mockSlots = Array.from({ length: 20 }, (_, i) => ({
                id: `mock-slot-${i + 1}`,
                _id: `mock-slot-${i + 1}`,
                slot_number: i + 1,
                date: new Date(Date.now() + i * 86400000).toISOString(),
                time: i % 2 === 0 ? '12:30 - 14:45' : '15:00 - 17:15',
                title: `Session ${i + 1}: Introduction and Concepts`,
                content: `Detailed content for session ${i + 1}`
            }));

            setSlots(mockSlots);
            setSelectedSlotId(mockSlots[0].id);
            setError(null); // Clear error since we are using mock data
        } finally {
            setLoading(false);
        }
    }, [classId]);

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

    if (loading) {
        return (
            <div className="w-full flex flex-col gap-4" style={{ width: '100%' }}>
                <div className="skeleton" style={{ width: '33%', height: '24px' }}></div>
                <div className="skeleton" style={{ width: '66%', height: '48px' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 7fr', gap: '20px', marginTop: '8px' }}>
                    <div className="skeleton" style={{ height: '80px' }}></div>
                    <div className="skeleton" style={{ height: '256px' }}></div>
                    <div className="skeleton" style={{ height: '384px' }}></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full flex items-center gap-2" style={{ width: '100%', padding: '16px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: 'var(--radius-md)' }}>
                <AlertCircle size={20} />
                <span>{error}</span>
            </div>
        );
    }

    if (!classData) return null;

    const selectedSlot = slots.find(s => (s.id || s._id) === selectedSlotId);

    const totalPages = Math.ceil(slots.length / 10);
    const displayedSlots = viewAll ? slots : slots.slice((currentPage - 1) * 10, currentPage * 10);

    return (
        <div className="animate-fade-in w-full flex flex-col gap-4 relative" style={{ width: '100%' }}>
            {/* Breadcrumb */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                <Link to="/lecturer/classes" style={{ textDecoration: 'none', color: 'var(--color-ink-muted)' }} onMouseEnter={(e) => e.target.style.textDecoration = 'underline'} onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>My Teaching Courses</Link>
                <ChevronRight size={14} />
                <span style={{ color: 'var(--color-ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '600px' }}>
                    {classData.subject_name || classData.name || 'Class Detail'}
                </span>
            </nav>

            {/* Tiêu đề khóa học & Owner */}
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
                <button className="btn btn-secondary" style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}>
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

            {/* Layout 3 cột: Classes | Slots | Class sessions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '8px', alignItems: 'start' }}>
                {/* Fixed Grid for PC */}
                <style>{`
                    @media (min-width: 900px) {
                        .class-detail-grid { grid-template-columns: 2fr 3fr 7fr !important; }
                    }
                `}</style>
                <div className="class-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', width: '100%', gridColumn: '1 / -1' }}>

                    {/* Cột 1: Classes */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-ink)' }}>Classes</span>
                            <span style={{ color: 'var(--color-ink-muted)', fontSize: '11px' }}>1 class</span>
                        </div>
                        <div className="card" style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', flexShrink: 0 }}></span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{classData.class_code || classData.class_name || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Cột 2: Slots list */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-ink)' }}>Slots</span>
                            <span style={{ color: 'var(--color-ink-muted)', fontSize: '11px' }}>{slots.length} sessions</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '460px', overflowY: 'auto', paddingRight: '4px' }}>
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

                        {/* Phân trang Slot */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-ink-muted)', paddingTop: '8px', borderTop: '1px solid var(--color-border)', marginTop: '8px' }}>
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
                    <div className="card" style={{ padding: '20px', minHeight: '380px', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                            <div>
                                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-ink)', margin: '0 0 2px 0' }}>Class sessions</h2>
                                <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>{slots.length} sessions • Page {viewAll ? 'All' : currentPage} of {totalPages || 1}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                                Updated <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>just now</span>
                            </div>
                        </div>

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

                                <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'center' }}>
                                    <button className="btn btn-primary" style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => alert('Create Test')}>
                                        <PlusCircle size={14} /> Create Test
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        onClick={() => {
                                            setSlotCreateTargetId(selectedSlot.id || selectedSlot._id);
                                            setIsSlotCreateModalOpen(true);
                                        }}
                                    >
                                        <FileText size={14} /> + Thêm bài tập
                                    </button>
                                    <button className="btn btn-secondary" style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => alert('Upload Material')}>
                                        <Upload size={14} /> Upload Material
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ marginTop: '32px', fontSize: '12px', color: 'var(--color-ink-muted)', textAlign: 'center' }}>
                                Please select a slot to view details.
                            </div>
                        )}

                        {/* Nút dọc nổi CLASS TOOLS bên phải */}
                        <div style={{
                            position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                            backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRight: 0,
                            boxShadow: 'var(--shadow-sm)', padding: '12px 4px', borderRadius: '4px 0 0 4px',
                            fontSize: '10px', color: 'var(--color-primary)', fontWeight: 'bold',
                            writingMode: 'vertical-rl', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            <Code size={12} style={{ writingMode: 'horizontal-tb', transform: 'rotate(-90deg)' }} />
                            <span>CLASS TOOLS</span>
                        </div>
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
        </div>
    );
}


