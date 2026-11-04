import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AssignmentService from '../../services/assignment.service';
import SubmissionService from '../../services/submission.service';
import MockSubmissionService from '../../services/mockSubmissionService';
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

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                if (id && !id.startsWith('asm-')) {
                    try {
                        const res = await AssignmentService.getAssignmentDetail(id);
                        const data = res?.data || res;
                        if (data) setAssignment(data);
                    } catch (e) {}

                    try {
                        const subData = await SubmissionService.getMySubmissions({ assignment_id: id });
                        let sub = null;
                        if (subData && subData.data && subData.data.length > 0) {
                            sub = subData.data[0];
                        }

                        const mock = await MockSubmissionService.getMySubmission(id);
                        const db = MockSubmissionService.getInitialDatabase ? MockSubmissionService.getInitialDatabase() : {};
                        const localGraded = (sub?.id && db[sub.id]) || (sub?.student_code && db[sub.student_code]) || db['sub-de181802'] || mock;

                        const rawMergedScore = localGraded?.grade?.score ?? localGraded?.score ?? sub?.score ?? null;
                        const mergedScore = rawMergedScore != null ? Number(rawMergedScore) : null;
                        const mergedFeedback = localGraded?.grade?.feedback ?? localGraded?.feedback ?? sub?.feedback ?? null;
                        const mergedRubrics = localGraded?.grade?.rubrics ?? localGraded?.rubrics ?? sub?.rubrics ?? null;
                        const isGradedStatus = mergedScore !== null || sub?.status === 'graded' || sub?.status === 'GRADED' || localGraded?.status === 'GRADED';

                        if (sub) {
                            sub = {
                                ...sub,
                                score: mergedScore,
                                feedback: mergedFeedback,
                                rubrics: mergedRubrics,
                                grade: localGraded?.grade || (mergedScore != null ? { score: mergedScore, feedback: mergedFeedback, rubrics: mergedRubrics } : null),
                                status: isGradedStatus ? 'GRADED' : sub.status,
                            };
                            setSubmission(sub);
                            try {
                                const detail = await SubmissionService.getSubmissionById(sub.id);
                                if (detail.success) setDetailedSubmission(detail.data);
                            } catch (err) {}
                        } else if (localGraded) {
                            setSubmission({
                                ...localGraded,
                                score: mergedScore,
                                feedback: mergedFeedback,
                                rubrics: mergedRubrics,
                                grade: localGraded?.grade || (mergedScore != null ? { score: mergedScore, feedback: mergedFeedback, rubrics: mergedRubrics } : null),
                                status: isGradedStatus ? 'GRADED' : (localGraded.status || 'SUBMITTED'),
                            });
                        }
                    } catch (e) {
                        const mock = await MockSubmissionService.getMySubmission(id);
                        if (mock) setSubmission(mock);
                    }
                } else {
                    const mock = await MockSubmissionService.getMySubmission(id || 'asg-swd392-01');
                    if (mock) setSubmission(mock);
                }
            } catch (error) {
                console.error("Failed to fetch assignment or submission:", error);
                const mock = await MockSubmissionService.getMySubmission(id || 'asg-swd392-01');
                if (mock) setSubmission(mock);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

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

    const title =
        submission?.assignment_title ||
        assignment?.title ||
        titleMap[id] ||
        `Assignment ${id}`;

    const isGraded =
        submission?.status === 'graded' ||
        submission?.status === 'GRADED' ||
        submission?.status === 'Graded' ||
        submission?.score != null ||
        submission?.grade?.score != null;

    const rawEffectiveScore = submission?.score ?? submission?.grade?.score ?? null;
    const effectiveScore = rawEffectiveScore != null ? Number(rawEffectiveScore) : null;
    const effectiveFeedback = submission?.feedback ?? submission?.grade?.feedback ?? '';
    let effectiveRubrics = submission?.rubrics ?? submission?.grade?.rubrics ?? null;

    if (!effectiveRubrics && MockSubmissionService.getInitialDatabase) {
        const db = MockSubmissionService.getInitialDatabase();
        const local = (submission?.id && db[submission.id]) || (submission?.student_code && db[submission.student_code]) || db['sub-de181802'];
        if (local && (local.rubrics || local.grade?.rubrics)) {
            effectiveRubrics = local.rubrics || local.grade?.rubrics;
        }
    }

    // Format Assignment for StudentAssignmentFlow
    const formattedAssignment = {
        id: id || 'asm-1',
        title: title || 'N/A',
        courseCode: assignment?.course_code || assignment?.subject_code || assignment?.class_code || 'N/A',
        courseTitle: assignment?.course_name || assignment?.subject_name || assignment?.class_name || 'N/A',
        dueDate: assignment?.deadline ? formatDateDMY(assignment.deadline) : 'N/A',
        content: assignment?.description || 'N/A',
        instructions: assignment?.instructions || 'N/A',
        maxScore: assignment?.max_score != null ? assignment.max_score : 10,
        weight: assignment?.weight != null ? assignment.weight : null,
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
            : (!id || id.startsWith('asm-') ? [
                { id: 'f1', name: 'Project_Specification_v2.pdf', size: '1.8 MB', url: '#' },
                { id: 'f2', name: 'C4_Model_Template.drawio', size: '640 KB', url: '#' }
            ] : []),
        score: effectiveScore,
        aiDeclarationRequired: assignment?.ai_declaration_required !== false,
        minAiInteractions: assignment?.min_ai_interactions != null ? Number(assignment.min_ai_interactions) : 1,
        maxAiInteractions: assignment?.max_ai_interactions != null ? Number(assignment.max_ai_interactions) : 20,
    };

    // Format Submission data from backend if present, else fallback
    let formattedSubmission = null;

    if (submission) {
        let submittedFile = null;
        if (detailedSubmission && detailedSubmission.versions && detailedSubmission.versions.length > 0) {
            const latestVer = detailedSubmission.versions[0];
            let files = [];
            try {
                files = typeof latestVer.files === 'string' ? JSON.parse(latestVer.files) : latestVer.files;
            } catch (e) {}
            if (files && files.length > 0) {
                submittedFile = {
                    name: files[0].name || files[0].filename || 'SE18D01_VietKhoa_C4Diagrams.pdf',
                    size: files[0].size || 3420000,
                    type: files[0].type || 'application/pdf',
                    url: files[0].url
                };
            }
        } else if (submission.file) {
            submittedFile = {
                name: submission.file.name || 'SE18D01_TranThiB_BackendArchitecture.zip',
                size: submission.file.size || 4850000,
                type: submission.file.mimeType || 'application/zip',
                url: submission.file.url
            };
        }

        if (!submittedFile) {
            submittedFile = {
                name: 'SE18D01_VietKhoa_C4Diagrams.pdf',
                size: 3420000,
                type: 'application/pdf'
            };
        }

        // Parse declarations & scopes using normalizeAuditData
        let parsedDeclarations = INITIAL_DECLARATIONS;
        let parsedScopes = null;
        try {
            const noteData = detailedSubmission?.versions?.[0]?.note || submission?.note;
            if (noteData) {
                const normalized = normalizeAuditData(noteData);
                if (normalized.scopes && normalized.scopes.length > 0) {
                    parsedScopes = normalized.scopes;
                    parsedDeclarations = normalized.scopes[0].declarations || parsedDeclarations;
                }
            }
        } catch (e) {}

        formattedSubmission = {
            status: isGraded ? 'Graded' : 'Submitted',
            submittedAt: submission.submitted_at || submission.submittedAt || '2026-03-24 14:20:00',
            lastEditedAt: submission.updated_at || submission.lastUpdatedAt || '2026-03-24 14:20:00',
            version: detailedSubmission?.versions?.length || submission.version || 1,
            file: submittedFile,
            feedback: effectiveFeedback || (isGraded ? 'Bài nộp đã được chấm điểm hoàn tất.' : 'No feedback yet. Submitted successfully. Waiting for grading.'),
            transparencyScore: submission.transparencyScore || submission.aiAuditLog?.transparencyScore || 94,
            declarations: parsedDeclarations,
            scopes: parsedScopes || submission.scopes,
            score: effectiveScore,
            grade: submission.grade || (effectiveScore != null ? { score: effectiveScore, feedback: effectiveFeedback, rubrics: effectiveRubrics } : null),
            rubrics: effectiveRubrics,
        };
    }

    // Handle API Submit & Update
    const handleApiSubmit = async ({ assignmentId, file, declarations, scopes, isEdit }) => {
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
            declarations: declarations || scopes?.[0]?.declarations, // for backward compat
            isEdit,
            submittedAt: new Date().toISOString()
        });

        if (id && !id.startsWith('asm-')) {
            await SubmissionService.submitAssignment(id, rawFile, notePayload);
        } else {
            // Simulated delay for mock assignments
            await new Promise((resolve) => setTimeout(resolve, 800));
        }

        // Refresh submission data
        try {
            const subData = await SubmissionService.getMySubmissions({ assignment_id: id });
            if (subData && subData.data && subData.data.length > 0) {
                setSubmission(subData.data[0]);
                const detail = await SubmissionService.getSubmissionById(subData.data[0].id);
                if (detail.success) setDetailedSubmission(detail.data);
            }
        } catch (err) {
            console.error(err);
        }

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
            initialSubmission={formattedSubmission || undefined}
            onBackToCourse={() => navigate('/student/classes')}
            onSubmitApiHandler={handleApiSubmit}
        />
    );
}