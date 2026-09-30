import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, Briefcase, FileText, CheckCircle, AlertCircle, Clock, X as XIcon, Download, Link as LinkIcon } from 'lucide-react';
import AssignmentService from '../../services/assignment.service';
import SubmissionService from '../../services/submission.service';
import GradingService from '../../services/grading.service';

export default function LecturerAssignmentGradingPage() {
    const { id } = useParams();
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho Modal chấm điểm
    const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
    const [isSavingGrade, setIsSavingGrade] = useState(false);

    // Lấy dữ liệu từ Backend
    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Lấy thông tin chi tiết Assignment
            const asmRes = await AssignmentService.getAssignmentDetail(id);
            setAssignment(asmRes.data || asmRes); // Phụ thuộc vào cách backend trả { success, data } hay trả thẳng data

            // 2. Lấy danh sách bài nộp của Assignment
            const subRes = await SubmissionService.getSubmissionsByAssignment(id);
            // Chuẩn hoá dữ liệu trạng thái (MISSING, SUBMITTED, GRADED) nếu backend chưa làm
            const formattedSubmissions = (subRes.data || subRes).map(sub => {
                let status = 'MISSING';
                if (sub.id && sub.grade_id) status = 'GRADED';
                else if (sub.id && !sub.grade_id) status = 'SUBMITTED';

                return {
                    ...sub,
                    computedStatus: status
                };
            });
            setSubmissions(formattedSubmissions);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    // Mở modal chấm điểm
    const handleOpenGradeModal = (submission) => {
        setSelectedSubmission(submission);
        setGradeForm({
            score: submission.score !== null ? submission.score : '',
            feedback: submission.feedback || ''
        });
        setIsGradingModalOpen(true);
    };

    // Lưu điểm (GỌI API TẠO HOẶC CẬP NHẬT)
    const handleSaveGrade = async () => {
        if (gradeForm.score === '') {
            alert('Vui lòng nhập điểm!');
            return;
        }

        setIsSavingGrade(true);
        try {
            const payload = {
                score: Number(gradeForm.score),
                feedback: gradeForm.feedback,
                maxScore: assignment.max_score || 10
            };

            if (selectedSubmission.computedStatus === 'GRADED' && selectedSubmission.grade_id) {
                // Cập nhật điểm (UC 38)
                await GradingService.updateGrade(selectedSubmission.grade_id, payload);
            } else {
                // Tạo điểm mới (UC 37)
                await GradingService.createGrade({
                    submissionId: selectedSubmission.id,
                    ...payload
                });
            }
            
            setIsGradingModalOpen(false);
            alert("Lưu điểm thành công!");
            
            // Reload lại danh sách để có ID của grade mới nhất
            await fetchData();
            
        } catch (error) {
            console.error("Lỗi khi chấm điểm:", error);
            alert(error.response?.data?.message || "Có lỗi xảy ra khi chấm điểm");
        } finally {
            setIsSavingGrade(false);
        }
    };

    // Xuất file Excel (UC 42)
    const handleExportExcel = async () => {
        try {
            if (!assignment?.class_id) {
                alert('Không tìm thấy thông tin lớp học để xuất điểm.');
                return;
            }
            await GradingService.exportGradebook(assignment.class_id, 'xlsx');
        } catch (error) {
            console.error("Lỗi xuất file:", error);
            alert("Có lỗi khi tải bảng điểm.");
        }
    };

    // Helper render Badge trạng thái
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'GRADED':
                return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', backgroundColor: '#e6f4ea', color: '#1e8e3e', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12}/> Đã chấm</span>;
            case 'SUBMITTED':
                return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', backgroundColor: '#fef7e0', color: '#f9ab00', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> Chờ chấm</span>;
            case 'MISSING':
                return <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', backgroundColor: '#fce8e6', color: '#d93025', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12}/> Chưa nộp</span>;
            default:
                return null;
        }
    };

    if (loading && !assignment) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>Đang tải dữ liệu...</div>;
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1152px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px 0', position: 'relative' }}>
            
            {/* Breadcrumbs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '500' }}>
                <Link to="/lecturer/classes" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Classes</Link>
                <span style={{ color: 'var(--color-ink-muted)' }}>/</span>
                <span style={{ color: 'var(--color-ink-soft)' }}>{assignment?.title} - Grading</span>
            </nav>

            {/* Page Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-ink)', margin: 0 }}>
                    Chấm điểm: {assignment?.title}
                </h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
                <style>{`
                    @media (min-width: 1024px) {
                        .assignment-layout { grid-template-columns: 3.5fr 8.5fr !important; }
                    }
                    .table-row:hover { background-color: var(--color-surface); }
                `}</style>
                
                <div className="assignment-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', width: '100%', gridColumn: '1 / -1' }}>
                    
                    {/* --- CỘT TRÁI: THÔNG TIN ASSIGNMENT --- */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        
                        <div className="card" style={{ padding: '20px' }}>
                            <div style={{ fontSize: '10px', color: 'var(--color-ink-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                THÔNG TIN BÀI TẬP
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-primary-bg, #f0f4ff)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md, 8px)', padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#fff', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        <Briefcase size={16} />
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>{assignment?.title}</span>
                                        <span style={{ fontSize: '11px', color: 'var(--color-ink-soft)' }}>Thang điểm: {assignment?.max_score || 10}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                THỜI HẠN (DUE DATE)
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--color-ink)' }}>
                                <Clock size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--color-primary)' }}/>
                                {assignment?.due_date ? new Date(assignment.due_date).toLocaleString() : 'Không có thời hạn'} 
                            </div>
                            
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--color-border)' }}>
                                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginBottom: '8px' }}>Thống kê:</div>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                    <span style={{ color: '#1e8e3e', fontWeight: '600' }}>Đã chấm: {submissions.filter(s => s.computedStatus === 'GRADED').length}</span>
                                    <span style={{ color: '#f9ab00', fontWeight: '600' }}>Chờ chấm: {submissions.filter(s => s.computedStatus === 'SUBMITTED').length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- CỘT PHẢI: DANH SÁCH BÀI NỘP --- */}
                    <div className="card" style={{ padding: '0', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-ink)', margin: 0 }}>
                                Danh sách sinh viên nộp bài
                            </h3>
                            <button onClick={handleExportExcel} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Download size={14} /> Xuất bảng điểm
                            </button>
                        </div>
                        
                        <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', marginTop: '16px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-ink-muted)' }}>
                                        <th style={{ padding: '12px 8px', fontWeight: '600' }}>Sinh viên</th>
                                        <th style={{ padding: '12px 8px', fontWeight: '600' }}>Trạng thái</th>
                                        <th style={{ padding: '12px 8px', fontWeight: '600' }}>Thời gian nộp</th>
                                        <th style={{ padding: '12px 8px', fontWeight: '600' }}>Điểm</th>
                                        <th style={{ padding: '12px 8px', fontWeight: '600', textAlign: 'right' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.map((sub, index) => (
                                        <tr key={sub.id || index} className="table-row" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '12px 8px' }}>
                                                {/* Map theo key JSON backend trả về, ví dụ student_name, student_code */}
                                                <div style={{ fontWeight: '600', color: 'var(--color-ink)' }}>{sub.student_name || sub.full_name || 'N/A'}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>{sub.student_code || ''}</div>
                                            </td>
                                            <td style={{ padding: '12px 8px' }}>
                                                {renderStatusBadge(sub.computedStatus)}
                                            </td>
                                            <td style={{ padding: '12px 8px', color: 'var(--color-ink-soft)' }}>
                                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '-'}
                                            </td>
                                            <td style={{ padding: '12px 8px', fontWeight: 'bold', color: sub.score !== null ? 'var(--color-primary)' : 'var(--color-ink-muted)' }}>
                                                {sub.score != null ? `${sub.score}/${assignment?.max_score || 10}` : '-'}
                                            </td>
                                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => handleOpenGradeModal(sub)}
                                                    disabled={sub.computedStatus === 'MISSING'}
                                                    style={{ 
                                                        padding: '6px 16px', 
                                                        fontSize: '12px', 
                                                        borderRadius: '6px',
                                                        border: 'none',
                                                        backgroundColor: sub.computedStatus === 'MISSING' ? 'var(--color-border)' : 'var(--color-primary)',
                                                        color: sub.computedStatus === 'MISSING' ? 'var(--color-ink-muted)' : '#fff',
                                                        cursor: sub.computedStatus === 'MISSING' ? 'not-allowed' : 'pointer',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    {sub.computedStatus === 'GRADED' ? 'Sửa điểm' : 'Chấm bài'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {submissions.length === 0 && !loading && (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-ink-muted)' }}>
                                    Chưa có dữ liệu sinh viên
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODAL CHẤM ĐIỂM --- */}
            {isGradingModalOpen && selectedSubmission && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card animate-fade-in" style={{ 
                        width: '100%', maxWidth: '500px', backgroundColor: '#fff', 
                        borderRadius: '12px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' 
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--color-ink)' }}>
                                Chấm bài: {selectedSubmission.student_name || selectedSubmission.full_name}
                            </h2>
                            <button onClick={() => setIsGradingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)' }}>
                                <XIcon size={20} />
                            </button>
                        </div>

                        <div style={{ backgroundColor: 'var(--color-surface, #f8f9fa)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-ink-muted)', marginBottom: '8px' }}>BÀI NỘP CỦA SINH VIÊN</div>
                            {selectedSubmission.file_url && (
                                <a href={selectedSubmission.file_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '8px', fontWeight: '500' }}>
                                    <FileText size={16} /> Tải file đính kèm
                                </a>
                            )}
                            {selectedSubmission.note && (
                                <div style={{ fontSize: '13px', color: 'var(--color-ink)', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                    <strong>Ghi chú/Link:</strong> {selectedSubmission.note}
                                </div>
                            )}
                            {!selectedSubmission.file_url && !selectedSubmission.note && (
                                <div style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>Không có file hoặc ghi chú đính kèm.</div>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-ink)' }}>
                                    Điểm số (Max: {assignment?.max_score || 10}) <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input 
                                    type="number" 
                                    max={assignment?.max_score || 10}
                                    min={0}
                                    step="0.5"
                                    value={gradeForm.score}
                                    onChange={(e) => setGradeForm({...gradeForm, score: e.target.value})}
                                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', outline: 'none' }}
                                    placeholder="Nhập điểm..."
                                />
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-ink)' }}>
                                    Nhận xét (Feedback)
                                </label>
                                <textarea 
                                    rows={4}
                                    value={gradeForm.feedback}
                                    onChange={(e) => setGradeForm({...gradeForm, feedback: e.target.value})}
                                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', outline: 'none', resize: 'vertical' }}
                                    placeholder="Nhập nhận xét cho sinh viên..."
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button 
                                onClick={() => setIsGradingModalOpen(false)}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: '#fff', color: 'var(--color-ink)', cursor: 'pointer', fontWeight: '500' }}
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleSaveGrade}
                                disabled={isSavingGrade}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', cursor: isSavingGrade ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: isSavingGrade ? 0.7 : 1 }}
                            >
                                {isSavingGrade ? 'Đang lưu...' : 'Lưu điểm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}