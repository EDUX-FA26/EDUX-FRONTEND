import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ClassService from '../../services/class.service';
import {
    ChevronRight, Clock, Folder, FilePenLine, RotateCw, Calendar, Code, AlertCircle,
    Users,
    Flame
} from 'lucide-react';
import AssignmentSubwindowModal from '../../components/student/AssignmentSubwindowModal';
import { createPortal } from 'react-dom';

export default function StudentClassDetailPage() {
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
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

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

            if (parsedSlots.length > 0) {
                setSelectedSlotId(parsedSlots[0].id || parsedSlots[0]._id);
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

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSlotClick = (slotId) => {
        setSelectedSlotId(slotId);
    };

    if (loading) {
        return (
            <div style={{ maxWidth: '1152px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '16px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        <div className="animate-fade-in" style={{ maxWidth: '1152px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
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
                <button className="btn btn-secondary" style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}>
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
                <button className="btn btn-primary" onClick={() => setIsAssignmentModalOpen(true)} style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}>
                    <FilePenLine size={14} /> Assignments
                </button>
                <button className="btn btn-secondary" onClick={fetchData} style={{ padding: '0 12px', height: '32px', fontSize: '12px', borderRadius: 'var(--radius-sm)' }}>
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
                                    <div style={{ marginTop: '32px', fontSize: '12px', color: 'var(--color-ink-muted)', textAlign: 'center' }}>
                                        This slot has no specific detailed content yet.
                                    </div>
                                )}
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

            {/* Assignment Modal */}
            {isAssignmentModalOpen && createPortal(
                <AssignmentSubwindowModal
                    isOpen={isAssignmentModalOpen}
                    onClose={() => setIsAssignmentModalOpen(false)}
                    classId={classId}
                />,
                document.body
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
                                                        <span>{streak} {streak === 1 }</span>
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
        </div>
    );
}
