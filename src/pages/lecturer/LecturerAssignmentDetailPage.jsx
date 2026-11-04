import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { ChevronRight, FileText, ChevronDown, Briefcase, UploadCloud, X as XIcon, File as FileIcon, CheckCircle, AlertCircle, Sparkles, Settings, ShieldAlert, Edit3, Download, Trash2, Plus, Paperclip } from 'lucide-react';
import AssignmentService from '../../services/assignment.service';
import SubmissionService from '../../services/submission.service';
import ClassService from '../../services/class.service';
import GradingService from '../../services/grading.service';
import MockSubmissionService from '../../services/mockSubmissionService';
import { formatDateDMY } from '../../helper/dateFormat';
import AIAuditQuickViewHover from '../../components/lecturer/AIAuditQuickViewHover';

export default function LecturerAssignmentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- STATE DÀNH CHO MODAL CHẤM ĐIỂM ---
    const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
    const [isSavingGrade, setIsSavingGrade] = useState(false);

    const editFileInputRef = useRef(null);

    // --- STATE DÀNH CHO MODAL CHỈNH SỬA BÀI TẬP & CẤU HÌNH AI TRACKING ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editMaterials, setEditMaterials] = useState([]);
    const [editForm, setEditForm] = useState({
        title: '',
        deadline: '',
        description: '',
        instructions: '',
        max_score: 10,
        weight: 10,
        allow_late_submission: true,
        publish_status: 'published',
        ai_declaration_required: true,
    });

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        if (typeof bytes === 'string' && isNaN(bytes)) return bytes;
        const num = Number(bytes);
        if (num < 1024) return `${num} B`;
        if (num < 1048576) return `${(num / 1024).toFixed(1)} KB`;
        return `${(num / 1048576).toFixed(1)} MB`;
    };

    const handleOpenEditModal = () => {
        let deadlineFormatted = '';
        if (assignment?.deadline) {
            try {
                const d = new Date(assignment.deadline);
                const pad = (n) => String(n).padStart(2, '0');
                deadlineFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            } catch (e) {}
        }
        setEditForm({
            title: assignment?.title || '',
            deadline: deadlineFormatted,
            description: assignment?.description || '',
            instructions: assignment?.instructions || '',
            max_score: assignment?.max_score ?? 10,
            weight: assignment?.weight ?? 10,
            allow_late_submission: assignment?.allow_late_submission !== false,
            publish_status: assignment?.publish_status || 'published',
            ai_declaration_required: assignment?.ai_declaration_required !== false,
        });
        setEditMaterials([]);
        setIsEditModalOpen(true);
    };

    const handleEditFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setEditMaterials(prev => [...prev, ...files]);
        }
        if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
        }
    };

    const handleRemoveEditFile = (indexToRemove) => {
        setEditMaterials(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editForm.title || !editForm.deadline) {
            showToast('Vui lòng điền đủ tiêu đề và hạn nộp!', 'error');
            return;
        }

        setIsSavingEdit(true);
        try {
            const formData = new FormData();
            formData.append('title', editForm.title);
            formData.append('deadline', new Date(editForm.deadline).toISOString());
            if (editForm.description) formData.append('description', editForm.description);
            if (editForm.instructions) formData.append('instructions', editForm.instructions);
            formData.append('max_score', String(editForm.max_score ?? 10));
            formData.append('weight', String(editForm.weight ?? 0));
            formData.append('allow_late_submission', String(editForm.allow_late_submission));
            formData.append('publish_status', editForm.publish_status || 'published');
            formData.append('ai_declaration_required', String(editForm.ai_declaration_required));

            editMaterials.forEach(file => {
                formData.append('materials', file);
            });

            if (id && !id.startsWith('asm-')) {
                await AssignmentService.updateAssignment(id, formData);
                await fetchDetail();
            } else {
                setAssignment(prev => ({ ...prev, ...editForm }));
            }

            setEditMaterials([]);
            showToast('Cập nhật bài tập thành công!', 'success');
            setIsEditModalOpen(false);
        } catch (err) {
            console.error('Failed to update assignment:', err);
            showToast(err.response?.data?.message || 'Có lỗi khi cập nhật bài tập', 'error');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDownloadMaterial = async (materialId, fileName) => {
        try {
            const res = await AssignmentService.getMaterialDownloadUrl(id, materialId);
            const downloadUrl = res?.data?.download_url || res?.download_url;
            if (downloadUrl) {
                window.open(downloadUrl, '_blank');
            } else {
                showToast(`Không tìm thấy link tải cho ${fileName}`, 'error');
            }
        } catch (err) {
            console.error('Download material failed:', err);
            showToast('Lỗi khi lấy link tải tài liệu', 'error');
        }
    };

    const handleDeleteMaterial = async (materialId, fileName) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${fileName}"?`)) return;
        try {
            await AssignmentService.deleteMaterial(id, materialId);
            setAssignment(prev => ({
                ...prev,
                materials: (prev?.materials || []).filter(m => m.id !== materialId)
            }));
            showToast(`Đã xóa tài liệu "${fileName}"`, 'success');
        } catch (err) {
            console.error('Delete material failed:', err);
            showToast('Lỗi khi xóa tài liệu', 'error');
        }
    };

    // --- STATE DÀNH CHO TOAST NOTIFICATION (ALERT NHỎ) ---
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    // Hiển thị thông báo và làm mới dữ liệu khi vừa chuyển hướng từ trang chấm điểm Academic Grading về
    useEffect(() => {
        if (location.state?.message || location.state?.refresh) {
            if (location.state?.message) {
                showToast(location.state.message, location.state.type || 'success');
            }
            fetchDetail();
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const fetchDetail = async () => {
        try {
            if (id && !id.startsWith('asm-')) {
                const assignDataRaw = await AssignmentService.getAssignmentDetail(id);
                const assignData = assignDataRaw.data || assignDataRaw;

                // Enrich with class/subject details if not already present
                if (assignData && assignData.class_id && (!assignData.subject_name || !assignData.class_code)) {
                    try {
                        const classRes = await ClassService.getClassById(assignData.class_id);
                        const classObj = classRes?.data || classRes;
                        if (classObj) {
                            assignData.subject_name = assignData.subject_name || classObj.subject_name;
                            assignData.subject_code = assignData.subject_code || classObj.subject_code;
                            assignData.class_code = assignData.class_code || classObj.class_code;
                            assignData.class = classObj;
                        }
                    } catch (e) {
                        console.warn("Could not fetch extra class details:", e);
                    }
                }
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

                console.log('📦 SUBMISSION API RESPONSE:', subData);

                let submissionsData = [];

                if (subData && subData.data) {
                    submissionsData = subData.data;
                }

                console.log('📋 SUBMISSIONS DATA:', submissionsData);

                // ========================================
                // MERGE CLASS MEMBERS + SUBMISSIONS
                // ========================================

                const submissionMap = new Map(
                    submissionsData.map(sub => [sub.student_id, sub])
                );

                const classMemberIds = new Set(
                    classMembers
                        .map(member => member.studentId)
                        .filter(Boolean)
                );

                const db = MockSubmissionService.getInitialDatabase ? MockSubmissionService.getInitialDatabase() : {};

                const combined = classMembers.map(member => {
                    const studentId = member.studentId;

                    const submission = submissionMap.get(studentId);

                    if (submission) {
                        const isThisStudent = (submission.student_code && submission.student_code === 'DE181802') || (member.studentCode && member.studentCode === 'DE181802') || submission.student_id === 'std-01';
                        const localGraded = db[submission.id] || (submission.student_code && db[submission.student_code]) || (member.studentCode && db[member.studentCode]) || (isThisStudent ? db['sub-de181802'] : null);
                        const rawScore = localGraded?.grade?.score ?? localGraded?.score ?? submission.score ?? null;
                        const effectiveScore = rawScore != null ? Number(rawScore) : null;
                        const effectiveFeedback = localGraded?.grade?.feedback ?? localGraded?.feedback ?? submission.feedback ?? null;
                        const effectiveRubrics = localGraded?.grade?.rubrics ?? localGraded?.rubrics ?? submission.rubrics ?? null;
                        const isGradedStatus = effectiveScore !== null || submission.status === 'graded' || submission.status === 'GRADED' || localGraded?.status === 'GRADED';

                        return {
                            ...submission,
                            student_code:
                                submission.student_code ||
                                member.studentCode ||
                                '',
                            score: effectiveScore,
                            feedback: effectiveFeedback,
                            rubrics: effectiveRubrics,
                            status: isGradedStatus ? 'graded' : (submission.status || 'submitted'),
                            aiAuditLog: localGraded?.aiAuditLog || submission.aiAuditLog || null,
                            declarations: localGraded?.aiAuditLog || submission.declarations || null,
                        };
                    }

                    return {
                        id: `missing-${studentId}`,
                        student_id: studentId,
                        student_name: member.fullName || 'Unknown Student',
                        student_email: member.email || '',
                        student_code: member.studentCode || '',
                        status: 'Missing',
                        latest_files: [],
                        latest_note: null,
                        submitted_at: null,
                        score: null,
                        feedback: null,
                        grade_id: null,
                    };
                });

                const unmatchedSubmissions = submissionsData.filter(
                    submission => !classMemberIds.has(submission.student_id)
                ).map(sub => {
                    const isThisStudent = (sub.student_code && sub.student_code === 'DE181802') || sub.student_id === 'std-01';
                    const localGraded = db[sub.id] || (sub.student_code && db[sub.student_code]) || (isThisStudent ? db['sub-de181802'] : null);
                    const rawScore = localGraded?.grade?.score ?? localGraded?.score ?? sub.score ?? null;
                    const effectiveScore = rawScore != null ? Number(rawScore) : null;
                    const effectiveFeedback = localGraded?.grade?.feedback ?? localGraded?.feedback ?? sub.feedback ?? null;
                    const effectiveRubrics = localGraded?.grade?.rubrics ?? localGraded?.rubrics ?? sub.rubrics ?? null;
                    const isGradedStatus = effectiveScore !== null || sub.status === 'graded' || sub.status === 'GRADED' || localGraded?.status === 'GRADED';

                    return {
                        ...sub,
                        score: effectiveScore,
                        feedback: effectiveFeedback,
                        rubrics: effectiveRubrics,
                        status: isGradedStatus ? 'graded' : (sub.status || 'submitted'),
                        aiAuditLog: localGraded?.aiAuditLog || sub.aiAuditLog || null,
                        declarations: localGraded?.aiAuditLog || sub.declarations || null,
                    };
                });

                const deduplicateList = (list) => {
                    const studentMap = new Map();
                    for (const item of list) {
                        if (!item) continue;
                        const key = item.student_code || item.student_id || item.id;
                        if (!key) continue;

                        if (!studentMap.has(key)) {
                            studentMap.set(key, item);
                        } else {
                            const existing = studentMap.get(key);
                            const itemHasFiles = item.latest_files && item.latest_files.length > 0;
                            const existingHasFiles = existing.latest_files && existing.latest_files.length > 0;
                            const itemIsGraded = item.score !== null && item.score !== undefined;
                            const existingIsGraded = existing.score !== null && existing.score !== undefined;
                            const itemTime = item.submitted_at ? new Date(item.submitted_at).getTime() : 0;
                            const existingTime = existing.submitted_at ? new Date(existing.submitted_at).getTime() : 0;

                            if ((!existingIsGraded && itemIsGraded) || 
                                (!existingHasFiles && itemHasFiles) || 
                                (itemTime > existingTime)) {
                                studentMap.set(key, item);
                            }
                        }
                    }
                    return Array.from(studentMap.values());
                };

                if (combined.length === 0 && unmatchedSubmissions.length === 0) {
                    const mockList = await MockSubmissionService.getAllMockSubmissions();
                    const mappedMocks = mockList.map(m => ({
                        id: m.id,
                        student_id: m.studentId,
                        student_name: m.studentName,
                        student_email: m.studentEmail,
                        student_code: m.studentCode,
                        status: (m.grade?.score != null || m.score != null || m.status === 'GRADED') ? 'graded' : 'submitted',
                        submitted_at: m.submittedAt,
                        score: m.grade?.score ?? m.score ?? null,
                        feedback: m.grade?.feedback ?? m.feedback ?? null,
                        grade: m.grade,
                        rubrics: m.grade?.rubrics ?? m.rubrics ?? null,
                        latest_files: m.file ? [m.file] : [],
                        latest_note: m.aiAuditLog?.isDeclared ? 'AI Audit Log: 5 Rubrics Declared' : 'Manual Submission',
                        aiAuditLog: m.aiAuditLog,
                        declarations: m.aiAuditLog
                    }));
                    setSubmissions(deduplicateList(mappedMocks));
                } else {
                    setSubmissions(deduplicateList([
                        ...combined,
                        ...unmatchedSubmissions
                    ]));
                }
            } else {
                // Mock assignment fallback
                setAssignment({
                    id,
                    title: titleMap[id] || `Assignment ${id}`,
                    class_id: 'mock-1',
                    class_code: 'SE1801',
                    class_name: 'SE1801',
                    subject_name: 'Server-Side development with NodeJS',
                    course_name: 'Server-Side development with NodeJS',
                    max_score: 10,
                });
                const mockList = await MockSubmissionService.getAllMockSubmissions();
                const mappedMocks = mockList.map(m => ({
                    id: m.id,
                    student_id: m.studentId,
                    student_name: m.studentName,
                    student_email: m.studentEmail,
                    student_code: m.studentCode,
                    status: (m.grade?.score != null || m.status === 'GRADED') ? 'graded' : 'submitted',
                    submitted_at: m.submittedAt,
                    score: m.grade?.score ?? m.score ?? null,
                    feedback: m.grade?.feedback ?? m.feedback ?? null,
                    grade: m.grade,
                    rubrics: m.grade?.rubrics,
                    latest_files: m.file ? [m.file] : [],
                    latest_note: m.aiAuditLog?.isDeclared ? 'AI Audit Log: 5 Rubrics Declared' : 'Manual Submission',
                    aiAuditLog: m.aiAuditLog,
                    declarations: m.aiAuditLog
                }));
                const deduplicateList = (list) => {
                    const studentMap = new Map();
                    for (const item of list) {
                        if (!item) continue;
                        const key = item.student_code || item.student_id || item.id;
                        if (!key) continue;
                        if (!studentMap.has(key)) {
                            studentMap.set(key, item);
                        } else {
                            const existing = studentMap.get(key);
                            const itemIsGraded = item.score !== null && item.score !== undefined;
                            const existingIsGraded = existing.score !== null && existing.score !== undefined;
                            if (!existingIsGraded && itemIsGraded) {
                                studentMap.set(key, item);
                            }
                        }
                    }
                    return Array.from(studentMap.values());
                };
                setSubmissions(deduplicateList(mappedMocks));
            }
        } catch (error) {
            console.error("Failed to fetch assignment details:", error);
            try {
                const mockList = await MockSubmissionService.getAllMockSubmissions();
                const mappedMocks = mockList.map(m => ({
                    id: m.id,
                    student_id: m.studentId,
                    student_name: m.studentName,
                    student_email: m.studentEmail,
                    student_code: m.studentCode,
                    status: (m.grade?.score != null || m.status === 'GRADED') ? 'graded' : 'submitted',
                    submitted_at: m.submittedAt,
                    score: m.grade?.score ?? m.score ?? null,
                    feedback: m.grade?.feedback ?? m.feedback ?? null,
                    grade: m.grade,
                    rubrics: m.grade?.rubrics,
                    latest_files: m.file ? [m.file] : [],
                    latest_note: m.aiAuditLog?.isDeclared ? 'AI Audit Log: 5 Rubrics Declared' : 'Manual Submission',
                    aiAuditLog: m.aiAuditLog,
                    declarations: m.aiAuditLog
                }));
                const studentMap = new Map();
                for (const item of mappedMocks) {
                    const key = item.student_code || item.student_id || item.id;
                    if (key && !studentMap.has(key)) {
                        studentMap.set(key, item);
                    }
                }
                setSubmissions(Array.from(studentMap.values()));
            } catch (e) {}
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
            {(() => {
                const targetClassId = assignment?.class_id || assignment?.classId;
                const targetClassLink = targetClassId ? `/lecturer/classes/${targetClassId}` : '/lecturer/classes';
                const courseName =
                    assignment?.subject_name ||
                    assignment?.course_name ||
                    assignment?.class?.subject?.name ||
                    assignment?.class?.course?.name ||
                    assignment?.class_code ||
                    assignment?.class_name ||
                    'Lớp học';

                return (
                    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '500' }}>
                        <Link
                            to="/lecturer/classes"
                            style={{ color: 'var(--color-primary)', textDecoration: 'none', transition: 'color 0.15s' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-dark)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                        >
                            Home
                        </Link>
                        <span style={{ color: 'var(--color-ink-muted)' }}>/</span>
                        <Link
                            to={targetClassLink}
                            title={courseName}
                            style={{
                                color: 'var(--color-primary)',
                                textDecoration: 'none',
                                maxWidth: '320px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                transition: 'color 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-dark)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                        >
                            {courseName}
                        </Link>
                        <span style={{ color: 'var(--color-ink-muted)' }}>/</span>
                        <span
                            title={title}
                            style={{
                                color: 'var(--color-ink-soft)',
                                maxWidth: '360px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {title}
                        </span>
                    </nav>
                );
            })()}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-ink)', margin: 0, letterSpacing: '-0.5px' }}>{title}</h1>
                    {assignment?.ai_declaration_required !== false ? (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: '11px', fontWeight: '600',
                            padding: '3px 10px', borderRadius: '16px',
                            backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5',
                            border: '1px solid rgba(79, 70, 229, 0.2)'
                        }}>
                            <Sparkles size={12} /> AI Tracking: Enabled
                        </span>
                    ) : (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: '11px', fontWeight: '600',
                            padding: '3px 10px', borderRadius: '16px',
                            backgroundColor: 'var(--color-surface, #f1f5f9)', color: 'var(--color-ink-muted, #64748b)',
                            border: '1px solid var(--color-border, #e2e8f0)'
                        }}>
                            AI Tracking: Disabled
                        </span>
                    )}
                </div>
                <button
                    className="btn btn-secondary"
                    onClick={handleOpenEditModal}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    <Edit3 size={14} /> Chỉnh sửa bài tập
                </button>
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    ADDITIONAL FILES & MATERIALS
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                                    {assignment?.materials?.length || 0} tài liệu
                                </span>
                            </div>

                            <div style={{ fontSize: '12px', color: 'var(--color-ink-soft)' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--color-ink)' }}>DUE DATE:</span> {assignment?.deadline ? formatDateDMY(assignment.deadline) : '2026-03-25 12:50:00'}
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                <span style={{ color: 'var(--color-ink-soft)', fontWeight: 'normal' }}>(GMT+07)</span>
                                <span style={{ color: 'var(--color-danger)' }}> - MAX SCORE: {assignment?.max_score ?? 10}</span>
                                {assignment?.weight != null && (
                                    <span style={{ color: 'var(--color-primary, #4f46e5)' }}> - WEIGHT: {assignment.weight}%</span>
                                )}
                            </div>

                            {/* Render materials */}
                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>
                                    Tài liệu đề bài đính kèm
                                </span>
                                {assignment?.materials && assignment.materials.length > 0 ? (
                                    assignment.materials.map((mat) => (
                                        <div
                                            key={mat.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 10px',
                                                borderRadius: '8px',
                                                backgroundColor: 'var(--color-surface, #f8fafc)',
                                                border: '1px solid var(--color-border, #e2e8f0)',
                                                fontSize: '12px'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, paddingRight: '8px' }}>
                                                <FileText size={15} style={{ color: 'var(--color-primary, #4f46e5)', shrink: 0 }} />
                                                <span style={{ fontWeight: '600', color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={mat.file_name}>
                                                    {mat.file_name}
                                                </span>
                                                <span style={{ fontSize: '10px', color: 'var(--color-ink-muted)', fontFamily: 'monospace', shrink: 0 }}>
                                                    ({formatFileSize(mat.file_size)})
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', shrink: 0 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadMaterial(mat.id, mat.file_name)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--color-primary, #4f46e5)',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                    title="Tải xuống tài liệu"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMaterial(mat.id, mat.file_name)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--color-danger, #ef4444)',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                    title="Xóa tài liệu này"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', fontStyle: 'italic', padding: '4px 0' }}>
                                        Chưa có tài liệu đính kèm. Bạn có thể bấm "Chỉnh sửa bài tập" để tải lên file.
                                    </div>
                                )}
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
                                        <th style={{ padding: '8px', textAlign: 'center' }}>AI Audit</th>
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
                                                    {isGraded ? (
                                                        <span className="badge" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', padding: '4px 8px', fontSize: '10px', border: '1px solid #4f46e5', borderRadius: '4px', fontWeight: 'bold' }}>Graded</span>
                                                    ) : sub.status === 'submitted' ? (
                                                        <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', padding: '4px 8px', fontSize: '10px', border: '1px solid #16a34a', borderRadius: '4px' }}>Submitted</span>
                                                    ) : (
                                                        <span className="badge" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-ink-soft)', padding: '4px 8px', fontSize: '10px', borderRadius: '4px' }}>{sub.status || 'Missing'}</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '8px' }}>
                                                    {formatDateDMY(sub.submitted_at)}
                                                </td>

                                                <td style={{ padding: '8px' }}>
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
                                                        {/* Ẩn dòng JSON thô Note: {"declarations":...; chỉ hiển thị nếu là text note thuần tuý */}
                                                        {sub.latest_note && !sub.latest_note.includes('"declarations"') && !sub.latest_note.trim().startsWith('{') && (
                                                            <div style={{ fontSize: '10px', color: 'var(--color-ink-soft)', fontStyle: 'italic', marginTop: '4px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                Note: {sub.latest_note}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* CỘT AI AUDIT: NÚT ICON CON MẮT & HOVER QUICK VIEW */}
                                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                                    <AIAuditQuickViewHover
                                                        declarationData={sub.declarations || sub.aiAuditLog || sub.note || sub.latest_note}
                                                        studentName={sub.student_name}
                                                        studentCode={sub.student_code}
                                                    />
                                                </td>

                                                {/* CỘT HIỂN THỊ ĐIỂM SỐ */}
                                                <td style={{ padding: '8px' }}>
                                                    {isGraded ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                                <span style={{ fontWeight: 'bold', color: '#4f46e5', fontSize: '13px' }}>
                                                                    {Number(currentScore).toFixed(2)}
                                                                </span>
                                                                <span style={{ fontSize: '10px', color: 'var(--color-ink-muted)' }}>
                                                                    / {maxScore}
                                                                </span>
                                                            </div>
                                                            {sub.rubrics && (
                                                                <span style={{ fontSize: '9px', color: '#6366f1', fontWeight: '600' }}>
                                                                    5 Rubrics mapped
                                                                </span>
                                                            )}
                                                            {sub.feedback && (
                                                                <span style={{ fontSize: '10px', color: 'var(--color-ink-muted)', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sub.feedback}>
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
                                                        onClick={() => {
                                                            navigate(`/lecturer/assignments/${id}/submissions/${sub.id}/grade`, {
                                                                state: {
                                                                    ...sub,
                                                                    class_id: assignment?.class_id,
                                                                    classId: assignment?.class_id,
                                                                    className: assignment?.class_name || assignment?.class_code,
                                                                    classCode: assignment?.class_code,
                                                                    courseName: assignment?.subject_name || assignment?.course_name || assignment?.class_name,
                                                                    courseTitle: assignment?.subject_name || assignment?.course_name || assignment?.class_name,
                                                                    subjectName: assignment?.subject_name,
                                                                    subjectCode: assignment?.subject_code,
                                                                    assignmentTitle: assignment?.title,
                                                                    assignmentId: id,
                                                                }
                                                            });
                                                        }}
                                                    >
                                                        {isGraded ? 'Sửa điểm' : 'Grade'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '16px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>No submissions yet.</td>
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

            {/* MODAL CHỈNH SỬA BÀI TẬP */}
            {isEditModalOpen && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.45)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                }} onClick={() => setIsEditModalOpen(false)}>
                    <div 
                        className="card animate-fade-in" 
                        style={{
                            width: '100%',
                            maxWidth: '680px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            backgroundColor: '#fff',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: 'var(--shadow-lg)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '18px'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Edit3 size={16} />
                                </div>
                                <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--color-ink)' }}>
                                    Chỉnh sửa bài tập (Edit Assignment)
                                </h2>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)' }}>
                                <XIcon size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Tiêu đề */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                                    Tiêu đề bài tập *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.title}
                                    onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    placeholder="Nhập tiêu đề bài tập..."
                                />
                            </div>

                            {/* Hạn nộp & Trạng thái */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                                        Hạn nộp (Deadline) *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={editForm.deadline}
                                        onChange={e => setEditForm(prev => ({ ...prev, deadline: e.target.value }))}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                                        Trạng thái công bố (Publish Status)
                                    </label>
                                    <select
                                        value={editForm.publish_status}
                                        onChange={e => setEditForm(prev => ({ ...prev, publish_status: e.target.value }))}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}
                                    >
                                        <option value="draft">Bản nháp (Draft)</option>
                                        <option value="published">Công bố (Published)</option>
                                        <option value="closed">Đã đóng (Closed)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Điểm tối đa & Trọng số */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                                        Thang điểm tối đa
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={editForm.max_score}
                                        onChange={e => setEditForm(prev => ({ ...prev, max_score: e.target.value }))}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                                        Trọng số điểm (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={editForm.weight}
                                        onChange={e => setEditForm(prev => ({ ...prev, weight: e.target.value }))}
                                        style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* Mô tả */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                                    Mô tả bài tập (Description)
                                </label>
                                <textarea
                                    rows={2}
                                    value={editForm.description}
                                    onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Mô tả nội dung, yêu cầu tổng quan..."
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                                />
                            </div>

                            {/* Hướng dẫn nộp bài */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                                    Hướng dẫn làm bài & nộp bài (Instructions)
                                </label>
                                <textarea
                                    rows={2}
                                    value={editForm.instructions}
                                    onChange={e => setEditForm(prev => ({ ...prev, instructions: e.target.value }))}
                                    placeholder="Hướng dẫn chi tiết định dạng nộp, tiêu chí đánh giá..."
                                    style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                                />
                            </div>

                            {/* Cho phép nộp muộn (Allow Late Submission) */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface, #f8fafc)' }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>
                                        Cho phép sinh viên nộp muộn (Allow Late Submission)
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                                        Khi bật, sinh viên vẫn có thể nộp bài sau thời hạn deadline (hệ thống sẽ đánh dấu nộp muộn).
                                    </div>
                                </div>
                                <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '22px', flexShrink: 0, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={editForm.allow_late_submission}
                                        onChange={e => setEditForm(prev => ({ ...prev, allow_late_submission: e.target.checked }))}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute', cursor: 'pointer', inset: 0,
                                        backgroundColor: editForm.allow_late_submission ? 'var(--color-primary, #4f46e5)' : '#cbd5e1',
                                        transition: '0.2s', borderRadius: '22px'
                                    }}>
                                        <span style={{
                                            position: 'absolute', content: '""', height: '16px', width: '16px',
                                            left: editForm.allow_late_submission ? '19px' : '3px', bottom: '3px',
                                            backgroundColor: 'white', transition: '0.2s', borderRadius: '50%',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                        }} />
                                    </span>
                                </label>
                            </div>

                            {/* CẤU HÌNH AI AUDIT LOG (TOGGLE ĐƠN GIẢN) */}
                            <div style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: '10px',
                                padding: '14px 16px',
                                backgroundColor: editForm.ai_declaration_required ? 'rgba(79, 70, 229, 0.03)' : 'var(--color-surface, #f8fafc)',
                                transition: 'all 0.2s ease'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>
                                            Yêu cầu khai báo AI Audit Log
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                                            Bật để yêu cầu sinh viên cung cấp bản giải trình minh bạch về việc sử dụng AI khi làm bài.
                                        </div>
                                    </div>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '42px', height: '24px', flexShrink: 0, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={editForm.ai_declaration_required}
                                            onChange={e => setEditForm(prev => ({ ...prev, ai_declaration_required: e.target.checked }))}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span style={{
                                            position: 'absolute', cursor: 'pointer', inset: 0,
                                            backgroundColor: editForm.ai_declaration_required ? 'var(--color-primary, #4f46e5)' : '#cbd5e1',
                                            transition: '0.2s', borderRadius: '24px'
                                        }}>
                                            <span style={{
                                                position: 'absolute', content: '""', height: '18px', width: '18px',
                                                left: editForm.ai_declaration_required ? '20px' : '3px', bottom: '3px',
                                                backgroundColor: 'white', transition: '0.2s', borderRadius: '50%',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                            }} />
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* UPLOAD THÊM TÀI LIỆU MATERIALS */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                                    Tài liệu đính kèm (Materials)
                                </label>
                                
                                {/* Hiện các file đã có */}
                                {assignment?.materials && assignment.materials.length > 0 && (
                                    <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>Tài liệu hiện có trên hệ thống:</span>
                                        {assignment.materials.map(mat => (
                                            <div key={mat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                                    <FileText size={13} style={{ color: 'var(--color-primary)' }} />
                                                    <span style={{ fontWeight: '500', color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mat.file_name}</span>
                                                    <span style={{ color: 'var(--color-ink-muted)' }}>({formatFileSize(mat.file_size)})</span>
                                                </div>
                                                <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '600' }}>Đã tải lên</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div
                                    onClick={() => editFileInputRef.current?.click()}
                                    style={{
                                        border: '1.5px dashed var(--color-border, #cbd5e1)',
                                        borderRadius: '10px',
                                        padding: '14px',
                                        textAlign: 'center',
                                        backgroundColor: 'var(--color-surface, #f8fafc)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary, #4f46e5)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border, #cbd5e1)'}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        ref={editFileInputRef}
                                        onChange={handleEditFileSelect}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <UploadCloud size={20} style={{ color: 'var(--color-primary, #4f46e5)' }} />
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>
                                            Nhấn để chọn file tài liệu mới đính kèm
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                                            Hỗ trợ: PDF, DOCX, ZIP, PNG, JPG (Chọn nhiều file)
                                        </div>
                                    </div>
                                </div>

                                {/* Preview files to be uploaded */}
                                {editMaterials.length > 0 && (
                                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600' }}>Tài liệu mới sắp được tải lên:</span>
                                        {editMaterials.map((file, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '7px 10px',
                                                    borderRadius: '6px',
                                                    backgroundColor: 'var(--color-surface, #f1f5f9)',
                                                    border: '1px solid var(--color-border, #e2e8f0)',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                                    <FileText size={14} style={{ color: 'var(--color-primary, #4f46e5)', shrink: 0 }} />
                                                    <span style={{ fontWeight: '600', color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {file.name}
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: 'var(--color-ink-muted)', fontFamily: 'monospace' }}>
                                                        ({formatFileSize(file.size)})
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveEditFile(idx)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--color-danger, #ef4444)',
                                                        cursor: 'pointer',
                                                        padding: '2px'
                                                    }}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    style={{ padding: '8px 18px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingEdit}
                                    style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', cursor: isSavingEdit ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}
                                >
                                    {isSavingEdit ? 'Đang lưu...' : 'Lưu cập nhật'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
