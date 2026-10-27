import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AssignmentService from '../../services/assignment.service';
import SubmissionService from '../../services/submission.service';
import { formatDateDMY } from '../../helper/dateFormat';
import StudentAssignmentFlow, {
  INITIAL_DECLARATIONS
} from '../../components/student/StudentAssignmentFlow';

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
                    const data = await AssignmentService.getAssignmentDetail(id);
                    setAssignment(data);

                    const subData = await SubmissionService.getMySubmissions({ assignment_id: id });
                    if (subData && subData.data && subData.data.length > 0) {
                        const sub = subData.data[0];
                        setSubmission(sub);
                        try {
                            const detail = await SubmissionService.getSubmissionById(sub.id);
                            if (detail.success) setDetailedSubmission(detail.data);
                        } catch (err) {
                            console.error("Get submission detail error:", err);
                        }
                    } else {
                        setSubmission(null);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch assignment or submission:", error);
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

    // Format Assignment for StudentAssignmentFlow
    const formattedAssignment = {
        id: id || 'asm-1',
        title: title,
        courseCode: assignment?.class_code || 'SWD392',
        courseTitle: assignment?.class_name || 'Server-Side development with NodeJS, Express, and PostgreSQL',
        dueDate: assignment?.deadline ? formatDateDMY(assignment.deadline) : '2026-03-25 12:50:00 (GMT+07)',
        content: assignment?.description || 'Design and implement the high-concurrency Backend Architecture with C4 model specifications. Students must submit full architectural documentation and declare all GenAI tools employed across the 5 Computational Thinking rubrics.',
        instructor: {
            name: assignment?.lecturer_name || 'Dr. Alan Smith',
            role: 'Lecturer in Software Engineering'
        },
        additionalFiles: [
            { id: 'f1', name: 'Project_Specification_v2.pdf', size: '1.8 MB', url: '#' },
            { id: 'f2', name: 'C4_Model_Template.drawio', size: '640 KB', url: '#' }
        ],
        score: submission?.score ?? null
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
        }

        if (!submittedFile) {
            submittedFile = {
                name: 'SE18D01_VietKhoa_C4Diagrams.pdf',
                size: 3420000,
                type: 'application/pdf'
            };
        }

        // Parse declarations if saved in note, or populate with defaults
        let parsedDeclarations = INITIAL_DECLARATIONS;
        try {
            const noteData = detailedSubmission?.versions?.[0]?.note;
            if (noteData && noteData.startsWith('{')) {
                const json = JSON.parse(noteData);
                if (json.declarations) parsedDeclarations = json.declarations;
            }
        } catch (e) {}

        formattedSubmission = {
            status: 'Submitted',
            submittedAt: submission.submitted_at || submission.last_submitted_at || '2026-03-24 14:20:00',
            lastEditedAt: submission.updated_at || '2026-03-24 14:20:00',
            version: detailedSubmission?.versions?.length || 1,
            file: submittedFile,
            feedback: submission.feedback || 'No feedback yet. Submitted successfully. Waiting for grading.',
            transparencyScore: 94,
            declarations: parsedDeclarations
        };
    }

    // Handle API Submit & Update
    const handleApiSubmit = async ({ assignmentId, file, declarations, isEdit }) => {
        const rawFile = file instanceof File ? file : null;
        const notePayload = JSON.stringify({
            declarations,
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