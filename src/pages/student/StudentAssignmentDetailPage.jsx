import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AssignmentService from '../../services/assignment.service';
import SubmissionService from '../../services/submission.service';
import { formatDateDMY } from '../../helper/dateFormat';
import StudentAssignmentFlow, {
  INITIAL_DECLARATIONS
} from '../../components/student/StudentAssignmentFlow';
import { normalizeAuditData } from '../../helper/aiAuditHelper';

export default function StudentAssignmentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [detailedSubmission, setDetailedSubmission] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDetail = async () => {
        try {
            if (id) {
                // 1. Fetch real assignment detail
                try {
                    const res = await AssignmentService.getAssignmentDetail(id);
                    const data = res?.data || res;
                    if (data) setAssignment(data);
                } catch (e) {
                    console.error("Failed to fetch assignment detail:", e);
                }

                // 2. Fetch real student submission for this assignment
                try {
                    const subData = await SubmissionService.getMySubmissions({ assignment_id: id });
                    let sub = null;
                    if (subData && subData.data && subData.data.length > 0) {
                        sub = subData.data[0];
                    }

                    if (sub && sub.id) {
                        try {
                            const detail = await SubmissionService.getSubmissionById(sub.id, true);
                            if (detail?.success && detail?.data) {
                                setDetailedSubmission(detail.data);
                                sub = {
                                    ...sub,
                                    ...detail.data
                                };
                            }
                        } catch (err) {
                            console.error("Failed to fetch detailed submission:", err);
                        }
                        setSubmission(sub);
                    } else {
                        setSubmission(null);
                        setDetailedSubmission(null);
                    }
                } catch (e) {
                    console.error("Failed to fetch student submission:", e);
                    setSubmission(null);
                    setDetailedSubmission(null);
                }
            }
        } catch (error) {
            console.error("Failed to load assignment page:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const title = submission?.assignment_title || assignment?.title || 'N/A';

    const rawEffectiveScore = submission?.score ?? detailedSubmission?.score ?? null;
    const effectiveScore = rawEffectiveScore != null ? Number(rawEffectiveScore) : null;
    const effectiveFeedback = submission?.feedback ?? detailedSubmission?.feedback ?? '';
    const isGraded = effectiveScore != null || submission?.status === 'graded' || submission?.status === 'GRADED' || submission?.status === 'Graded';

    // Format Assignment from DB for StudentAssignmentFlow
    const formattedAssignment = {
        id: id || '',
        title: title,
        courseCode: assignment?.course_code || assignment?.subject_code || assignment?.class_code || 'N/A',
        courseTitle: assignment?.course_name || assignment?.subject_name || assignment?.class_name || 'N/A',
        dueDate: assignment?.deadline ? formatDateDMY(assignment.deadline) : 'N/A',
        deadlineRaw: assignment?.deadline || null,
        allowLateSubmission: Boolean(assignment?.allow_late_submission),
        content: assignment?.description || 'N/A',
        maxScore: assignment?.max_score != null ? Number(assignment.max_score) : 10,
        weight: assignment?.weight != null ? Number(assignment.weight) : null,
        instructor: {
            name: assignment?.lecturer_name || assignment?.lecturer?.name || 'N/A',
            role: 'Giảng viên'
        },
        additionalFiles: (assignment?.materials && assignment.materials.length > 0)
            ? assignment.materials.map(m => ({
                id: m.id,
                name: m.file_name,
                size: typeof m.file_size === 'number'
                    ? (m.file_size > 1048576 ? `${(m.file_size / 1048576).toFixed(1)} MB` : `${(m.file_size / 1024).toFixed(1)} KB`)
                    : (m.file_size || 'N/A'),
                url: '#',
                materialId: m.id,
                assignmentId: assignment?.id || id
            }))
            : [],
        score: effectiveScore,
        aiDeclarationRequired: assignment?.ai_declaration_required !== false,
        minAiInteractions: assignment?.min_ai_interactions != null ? Number(assignment.min_ai_interactions) : 1,
        maxAiInteractions: assignment?.max_ai_interactions != null ? Number(assignment.max_ai_interactions) : 20,
    };

    // Format real Submission data from backend if present, else null
    let formattedSubmission = null;

    if (submission) {
        let submittedFile = null;
        const latestVer = detailedSubmission?.versions?.find(v => v.is_latest) || detailedSubmission?.versions?.[0];
        let files = [];
        if (latestVer?.files) {
            try {
                files = typeof latestVer.files === 'string' ? JSON.parse(latestVer.files) : latestVer.files;
            } catch (e) {}
        } else if (submission.latest_files) {
            try {
                files = typeof submission.latest_files === 'string' ? JSON.parse(submission.latest_files) : submission.latest_files;
            } catch (e) {}
        } else if (submission.file) {
            files = [submission.file];
        }

        if (files && files.length > 0) {
            const f = files[0];
            submittedFile = {
                id: f.id,
                name: f.name || f.filename || 'Submitted_File',
                size: Number(f.size || 0),
                type: f.type || f.mime_type || 'application/octet-stream',
                url: f.url || f.file_url
            };
        }

        // Parse declarations & scopes using normalizeAuditData
        let parsedDeclarations = INITIAL_DECLARATIONS;
        let parsedScopes = null;
        try {
            const noteData = latestVer?.note || submission?.latest_note || submission?.note;
            if (noteData) {
                const normalized = normalizeAuditData(noteData);
                if (normalized.scopes && normalized.scopes.length > 0) {
                    parsedScopes = normalized.scopes;
                    parsedDeclarations = normalized.scopes[0].declarations || parsedDeclarations;
                } else if (normalized.declarations) {
                    parsedDeclarations = normalized.declarations;
                }
            }
        } catch (e) {}

        const isDraft = submission.status === 'draft';
        const submissionTime = submission.submitted_at || latestVer?.submitted_at;
        const editedTime = submission.updated_at || latestVer?.updated_at || submission.last_submitted_at;

        let statusText = 'Submitted';
        if (isGraded) {
            statusText = 'Graded';
        } else if (isDraft) {
            statusText = 'Draft';
        }

        formattedSubmission = {
            id: submission.id,
            status: statusText,
            submittedAt: isDraft ? null : (submissionTime ? formatDateDMY(submissionTime) : 'N/A'),
            lastEditedAt: editedTime ? formatDateDMY(editedTime) : null,
            version: latestVer?.version_no || detailedSubmission?.versions?.length || submission.version || 1,
            file: submittedFile,
            feedback: effectiveFeedback || (isGraded ? 'Bài nộp đã được chấm điểm hoàn tất.' : isDraft ? 'Bản nháp đang được lưu an toàn. Hãy bấm "Nộp bài chính thức" khi hoàn tất.' : 'Chưa có nhận xét. Bài nộp đang chờ giảng viên chấm điểm.'),
            transparencyScore: submission.transparencyScore || (parsedScopes ? 95 : null),
            declarations: parsedDeclarations,
            scopes: parsedScopes || submission.scopes,
            score: effectiveScore,
            grade: {
                score: effectiveScore,
                max_score: submission.max_score || detailedSubmission?.max_score || 10,
                feedback: effectiveFeedback
            }
        };
    }

    // Handle API Submit (Lưu nháp hoặc Nộp chính thức)
    const handleApiSubmit = async ({ assignmentId, file, declarations, scopes, isEdit, isDraft }) => {
        const rawFile = file instanceof File ? file : null;
        const notePayload = JSON.stringify({
            version: "2.0",
            scopes: scopes || [
              {
                id: "default",
                scope_title: "Khai báo tổng quan",
                scope_description: "",
                declarations,
              }
            ],
            declarations: declarations || scopes?.[0]?.declarations,
            isEdit,
            isDraft: Boolean(isDraft),
            savedAt: new Date().toISOString()
        });

        if (id) {
            if (isDraft) {
                await SubmissionService.saveDraft(id, rawFile, notePayload);
            } else {
                await SubmissionService.submitFinal(id, rawFile, notePayload);
            }
        }

        // Refresh submission data
        await fetchDetail();
        return true;
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-8 space-y-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                <div className="h-10 bg-slate-200 rounded w-1/2"></div>
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-4 h-96 bg-slate-200 rounded-3xl"></div>
                    <div className="col-span-12 lg:col-span-8 h-96 bg-slate-200 rounded-3xl"></div>
                </div>
            </div>
        );
    }

    return (
        <StudentAssignmentFlow
            initialAssignment={formattedAssignment}
            initialSubmission={formattedSubmission}
            onBackToCourse={() => navigate('/student/classes')}
            onSubmitApiHandler={handleApiSubmit}
        />
    );
}
