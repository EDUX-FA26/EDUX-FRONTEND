import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ChevronRight, FileText, ChevronDown, Briefcase, UploadCloud, X as XIcon, File as FileIcon, CheckCircle, AlertCircle } from 'lucide-react';
import AssignmentService from '../../services/assignment.service';
import SubmissionService from '../../services/submission.service';
import ClassService from '../../services/class.service';
import GradingService from '../../services/grading.service';
import { formatDateDMY } from '../../helper/dateFormat';

export default function LecturerAssignmentDetailPage() {
    const { id } = useParams();
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- STATE DÀNH CHO MODAL CHẤM ĐIỂM ---
    const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
    const [isSavingGrade, setIsSavingGrade] = useState(false);

    // --- STATE DÀNH CHO TOAST NOTIFICATION (ALERT NHỎ) ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    const fetchDetail = async () => {
        try {
            if (id && !id.startsWith('asm-')) {
                const assignDataRaw = await AssignmentService.getAssignmentDetail(id);
                const assignData = assignDataRaw.data || assignDataRaw;
                setAssignment(assignData);

                let classMembers = [];
                if (assignData && assignData.class_id) {
                    try {
                        const membersRes = await ClassService.getClassMembers(assignData.class_id);
                        if (membersRes && membersRes.data) {
                            classMembers = membersRes.data;
                        }
                    } catch (e) {
                        console.error("Failed to fetch class members", e);
                    }
                }

                const subData = await SubmissionService.getAssignmentSubmissions(id);
                let submissionsData = [];
                if (subData && subData.data) {
                    submissionsData = subData.data;
                }

                if (classMembers.length > 0) {
                    const combined = classMembers.map(m => {
                        const sub = submissionsData.find(s => s.student_id === m.student_id);
                        if (sub) return sub;
                        return {
                            id: `missing-${m.student_id}`,
                            student_id: m.student_id,
                            student_name: m.full_name || m.student_name,
                            student_email: m.email || m.student_email,
                            student_code: m.student_code,
                            status: 'Missing',
                            latest_files: null,
                            latest_note: null,
                            submitted_at: null
                        };
                    });
                    setSubmissions(combined);
                } else {
                    setSubmissions(submissionsData);
                }
            }
        } catch (error) {
            console.error("Failed to fetch assignment details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleDownloadFile = async (submissionId, fileId) => {
        try {
            const res = await SubmissionService.getSubmissionFile(submissionId, fileId);
            if (res.success && res.data.url) {
                const a = document.createElement("a");
                a.href = res.data.url;
                a.target = "_blank";
                a.download = "";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error("Failed to download file:", error);
            showToast("Có lỗi xảy ra khi tải file.", "error");
        }
    };

    const handleOpenGradeModal = (submission) => {
        setSelectedSubmission(submission);

        // Lấy score/feedback từ object submission hoặc grade lồng bên trong
        const currentScore = submission.score ?? submission.grade?.score ?? '';
        const currentFeedback = submission.feedback ?? submission.grade?.feedback ?? '';

        setGradeForm({
            score: currentScore !== null ? currentScore : '',
            feedback: currentFeedback
        });
        setIsGradingModalOpen(true);
    };

    const handleSaveGrade = async () => {
        if (gradeForm.score === '') {
            showToast('Vui lòng nhập điểm!', 'error');
            return;
        }

        setIsSavingGrade(true);
        try {
            const parsedMaxScore = Number(assignment?.max_score) || 10;

            const payload = {
                score: Number(gradeForm.score),
                feedback: gradeForm.feedback,
                maxScore: parsedMaxScore,
                max_score: parsedMaxScore
            };

            const gradeId = selectedSubmission.grade_id || selectedSubmission.gradeId || selectedSubmission.grade?.id;

            if (gradeId) {
                await GradingService.updateGrade(gradeId, payload);
                showToast("Cập nhật điểm thành công!", "success");
            } else {
                await GradingService.createGrade({
                    ...payload,
                    submissionId: selectedSubmission.id,
                    submission_id: selectedSubmission.id
                });
                showToast("Chấm điểm thành công!", "success");
            }

            setIsGradingModalOpen(false);
            await fetchDetail();

        } catch (error) {
            console.error("Lỗi khi chấm điểm:", error.response?.data);
            const errorMsg = error.response?.data?.message || "Có lỗi xảy ra khi chấm điểm";

            if (errorMsg === "Grade already exists for this submission") {
                showToast("Lỗi: Bài nộp này đã có điểm trong hệ thống.", "error");
            } else {
                showToast("Lỗi: " + errorMsg, "error");
            }
        } finally {
            setIsSavingGrade(false);
        }
    };

    const titleMap = {
        '2': 'Assignment 2',
        '4': 'Assignment 4',
        'project': 'Nộp Project',
        '3': 'Assignment 3',
        '1': 'Assignment 1',
        'asm-1': 'React Fundamental Exercises',
        'asm-2': 'State Management Project',
        'asm-3': 'Node.js Express API',
        'asm-4': 'MongoDB Aggregation',
        'asm-5': 'Final Backend Architecture'
    };

    const title = assignment?.title || titleMap[id] || `Assignment ${id}`;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1152px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px 0', position: 'relative' }}>

            {/* TOAST ALERT TỰ ĐỘNG THÔNG BÁO */}
            {toast.show && createPortal(
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981',
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    zIndex: 100000,
                    fontSize: '13px',
                    fontWeight: '600',
                    animation: 'fadeIn 0.3s ease-in-out'
                }}>
                    {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                    <span>{toast.message}</span>
                </div>,
                document.body
            )}

            {/* Breadcrumbs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '500' }}>
                <Link to="/lecturer/classes" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Home</Link>
                <span style={{ color: 'var(--color-ink-muted)' }}>/</span>
                <Link to="/lecturer/classes/mock-1" style={{ color: 'var(--color-primary)', textDecoration: 'none', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Server-Side development with NodeJS...
                </Link>
                <span style={{ color: 'var(--color-ink-muted)' }}>/</span>
                <span style={{ color: 'var(--color-ink-soft)' }}>{title}</span>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-ink)', margin: 0, letterSpacing: '-0.5px' }}>{title}</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
                <style>{`
                    @media (min-width: 1024px) {
                        .assignment-layout { grid-template-columns: 4fr 8fr !important; }
                    }
                `}</style>
                <div className="assignment-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', width: '100%', gridColumn: '1 / -1' }}>

                    {/* CỘT TRÁI */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--color-ink)', fontSize: '14px', cursor: 'pointer', marginBottom: '12px' }}>
                                <span>Table of contents</span>
                                <ChevronDown size={14} style={{ color: 'var(--color-ink-muted)' }} />
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-ink-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                ASSIGNMENTS
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-primary-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Briefcase size={12} />
                                    </span>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>{title}</span>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-ink-muted)' }}>N/A</span>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px' }}>
                            <h3 style={{ fontWeight: 'bold', color: 'var(--color-ink)', fontSize: '14px', margin: '0 0 12px 0' }}>Content</h3>
                            <p style={{ fontSize: '12px', color: 'var(--color-ink-soft)', margin: 0 }}>{title}</p>
                        </div>

                        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                ADDITIONAL FILES
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-ink-soft)' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--color-ink)' }}>DUE DATE:</span> 2026-03-25 12:50:00
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                <span style={{ color: 'var(--color-ink-soft)', fontWeight: 'normal' }}>(GMT+07)</span>
                                <span style={{ color: 'var(--color-danger)' }}> - MAX SCORE: {assignment?.max_score || 10}</span>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: Student Submissions */}
                    <div className="card" style={{ padding: '24px', minHeight: '350px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-ink)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                            Student Submissions
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-ink-muted)' }}>
                                        <th style={{ padding: '8px' }}>Student</th>
                                        <th style={{ padding: '8px' }}>Status</th>
                                        <th style={{ padding: '8px' }}>Submitted At</th>
                                        <th style={{ padding: '8px' }}>File/Link</th>
                                        <th style={{ padding: '8px' }}>Score</th>
                                        <th style={{ padding: '8px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.length > 0 ? submissions.map((sub, index) => {
                                        let files = [];
                                        try {
                                            if (sub.latest_files) {
                                                files = typeof sub.latest_files === 'string' ? JSON.parse(sub.latest_files) : sub.latest_files;
                                            }
                                        } catch (e) { }

                                        // Xác định điểm hiện tại
                                        const currentScore = sub.score ?? sub.grade?.score;
                                        const maxScore = assignment?.max_score || 10;
                                        const isGraded = currentScore !== undefined && currentScore !== null;

                                        return (
                                            <tr key={sub.id || index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                <td style={{ padding: '8px', fontWeight: 'bold' }}>
                                                    {sub.student_name || sub.student_email || 'Unknown Student'}
                                                    <div style={{ fontSize: '10px', color: 'var(--color-ink-muted)' }}>{sub.student_code || ''}</div>
                                                </td>
                                                <td style={{ padding: '8px' }}>
                                                    {sub.status === 'submitted' ? (
                                                        <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', padding: '4px 8px', fontSize: '10px', border: '1px solid #16a34a', borderRadius: '4px' }}>Submitted</span>
                                                    ) : (
                                                        <span className="badge" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-ink-soft)', padding: '4px 8px', fontSize: '10px', borderRadius: '4px' }}>{sub.status || 'Missing'}</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '8px' }}>{formatDateDMY(sub.submitted_at)}</td>                                                <td style={{ padding: '8px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {files && files.length > 0 ? files.map(file => (
                                                            <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <FileIcon size={12} style={{ color: 'var(--color-primary)' }} />
                                                                <a
                                                                    href="#"
                                                                    style={{ fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}
                                                                    onClick={(e) => { e.preventDefault(); handleDownloadFile(sub.id, file.id); }}
                                                                >
                                                                    {file.name}
                                                                </a>
                                                            </div>
                                                        )) : (
                                                            <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>-</span>
                                                        )}
                                                        {sub.latest_note && (
                                                            <div style={{ fontSize: '10px', color: 'var(--color-ink-soft)', fontStyle: 'italic', marginTop: '4px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                Note: {sub.latest_note}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* CỘT HIỂN THỊ ĐIỂM SỐ */}
                                                <td style={{ padding: '8px' }}>
                                                    {isGraded ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', fontSize: '13px' }}>
                                                                {currentScore} / {maxScore}
                                                            </span>
                                                            {sub.feedback && (
                                                                <span style={{ fontSize: '10px', color: 'var(--color-ink-muted)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sub.feedback}>
                                                                    {sub.feedback}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: 'var(--color-ink-muted)', fontSize: '11px' }}>Chưa chấm</span>
                                                    )}
                                                </td>

                                                {/* CỘT THAO TÁC */}
                                                <td style={{ padding: '8px' }}>
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{
                                                            padding: '4px 12px',
                                                            fontSize: '10px',
                                                            opacity: sub.status === 'Missing' ? 0.5 : 1,
                                                            cursor: sub.status === 'Missing' ? 'not-allowed' : 'pointer',
                                                            backgroundColor: isGraded ? 'var(--color-border)' : undefined,
                                                            color: isGraded ? 'var(--color-ink)' : undefined
                                                        }}
                                                        disabled={sub.status === 'Missing'}
                                                        onClick={() => handleOpenGradeModal(sub)}
                                                    >
                                                        {isGraded ? 'Sửa điểm' : 'Grade'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '16px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>No submissions yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL CHẤM ĐIỂM */}
            {isGradingModalOpen && selectedSubmission && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center' // 🟢 Đã sửa từ 'justify' thành 'justifyContent'
                }}>
                    <div className="card animate-fade-in" style={{
                        width: '100%',
                        maxWidth: '400px',
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--color-ink)' }}>
                                Chấm bài: {selectedSubmission.student_name || selectedSubmission.student_email}
                            </h2>
                            <button onClick={() => setIsGradingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)' }}>
                                <XIcon size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-ink)' }}>
                                    Điểm số (Max: {assignment?.max_score || 10}) <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="number"
                                    max={assignment?.max_score || 10} min={0} step="0.5"
                                    value={gradeForm.score}
                                    onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', outline: 'none' }}
                                    placeholder="Nhập điểm số..."
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-ink)' }}>
                                    Nhận xét (Feedback)
                                </label>
                                <textarea
                                    rows={3}
                                    value={gradeForm.feedback}
                                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', outline: 'none', resize: 'vertical' }}
                                    placeholder="Nhập nhận xét..."
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button
                                onClick={() => setIsGradingModalOpen(false)}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveGrade}
                                disabled={isSavingGrade}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', cursor: isSavingGrade ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}
                            >
                                {isSavingGrade ? 'Đang lưu...' : 'Lưu điểm'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}