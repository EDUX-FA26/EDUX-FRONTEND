import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LecturerAcademicEvaluation, {
  StudentInfo,
  CourseClassInfo,
  SubmissionCodeFile,
  AiDeclarationPhase,
  RubricScores,
  GradePayload,
  DEFAULT_STUDENT,
  DEFAULT_COURSE_INFO,
  DEFAULT_AI_DECLARATIONS,
  DEFAULT_SUBMISSION_CODE_LINES
} from '../../components/lecturer/LecturerAcademicEvaluation';
import SubmissionService from '../../services/submission.service';
import AssignmentService from '../../services/assignment.service';
import GradingService from '../../services/grading.service';

export default function LecturerGradingPage() {
  const { assignmentId, submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState<boolean>(true);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>(DEFAULT_STUDENT);
  const [courseInfo, setCourseInfo] = useState<CourseClassInfo>(DEFAULT_COURSE_INFO);
  const [submissionFile, setSubmissionFile] = useState<SubmissionCodeFile>({
    name: 'SE18D01_TranThiB_BackendArchitecture.ts',
    lines: DEFAULT_SUBMISSION_CODE_LINES,
  });
  const [aiDeclarations, setAiDeclarations] = useState<AiDeclarationPhase[]>(DEFAULT_AI_DECLARATIONS);
  const [existingGradeId, setExistingGradeId] = useState<string | null>(null);
  const [initialScores, setInitialScores] = useState<RubricScores>({ r1: 0, r2: 0, r3: 0 });
  const [initialFeedback, setInitialFeedback] = useState<string>('');

  useEffect(() => {
    const loadGradingData = async () => {
      try {
        setLoading(true);

        // State passed from parent listing page if available
        const stateData = location.state as any;

        // 1. Load Assignment info
        if (assignmentId && !assignmentId.startsWith('asm-')) {
          try {
            const assignRes = await AssignmentService.getAssignmentDetail(assignmentId);
            const assign = assignRes?.data || assignRes;
            if (assign) {
              setCourseInfo({
                courseCode: assign.class_code || assign.course_code || 'SWD392',
                courseTitle: assign.class_name || assign.course_name || 'Software Architecture and Design',
                className: assign.class_name || assign.class_code || 'SE18D01',
                assignmentTitle: assign.title || 'Backend Architecture C4 Model',
              });
            }
          } catch (e) {
            console.warn('Assignment load failed, using fallback/state', e);
          }
        }

        // 2. Load Submission info
        if (submissionId && !submissionId.startsWith('mock-')) {
          try {
            const subRes = await SubmissionService.getSubmissionById(submissionId, true);
            const subData = subRes?.data || subRes;

            if (subData) {
              // Student Info
              setStudentInfo({
                name: subData.student_name || stateData?.student_name || 'Tran Thi B',
                code: subData.student_code || stateData?.student_code || 'DE181802',
                email: subData.student_email || stateData?.student_email || 'tranb.de181802@fpt.edu.vn',
                aiRiskLevel: (subData.ai_risk_level as any) || 'low',
                aiRiskLabel: subData.ai_risk_label || 'low AI-transparency risk',
              });

              // Existing Grade if already graded
              if (subData.grade || subData.score != null) {
                const gradeObj = subData.grade || {};
                setExistingGradeId(gradeObj.id || subData.grade_id || null);
                const scoreNum = Number(subData.score || gradeObj.score || 0);
                // Distribute score across rubrics proportionally if not individually broken down
                const r1Val = parseFloat((scoreNum * 0.4).toFixed(2));
                const r2Val = parseFloat((scoreNum * 0.4).toFixed(2));
                const r3Val = parseFloat((scoreNum - r1Val - r2Val).toFixed(2));
                setInitialScores({
                  r1: Math.min(4, Math.max(0, r1Val)),
                  r2: Math.min(4, Math.max(0, r2Val)),
                  r3: Math.min(2, Math.max(0, r3Val)),
                });
                setInitialFeedback(subData.feedback || gradeObj.feedback || '');
              }

              // Submission Files
              let files = [];
              if (subData.versions && subData.versions.length > 0) {
                const latestVer = subData.versions[0];
                try {
                  files = typeof latestVer.files === 'string' ? JSON.parse(latestVer.files) : latestVer.files;
                } catch (e) {}

                // Check note for AI Declarations JSON payload
                if (latestVer.note) {
                  try {
                    const parsedNote = typeof latestVer.note === 'string' ? JSON.parse(latestVer.note) : latestVer.note;
                    if (parsedNote && parsedNote.declarations) {
                      const decs = parsedNote.declarations;
                      // Map declarations into the 5 phases
                      const mappedPhases: AiDeclarationPhase[] = [
                        {
                          phaseKey: 'reflection',
                          phaseName: 'AI REFLECTION',
                          badgeBg: 'bg-purple-50',
                          badgeText: 'text-purple-700',
                          aiTool: decs.reflection?.aiTool || 'Claude 3.5 Sonnet',
                          decision: decs.reflection?.decision || 'Fully Accepted',
                          decisionBg: decs.reflection?.decision === 'Rejected' ? 'bg-rose-50' : 'bg-emerald-50',
                          decisionText: decs.reflection?.decision === 'Rejected' ? 'text-rose-700' : 'text-emerald-700',
                          prompt: decs.reflection?.prompt || '"Review this module architecture and point out critical code smells."',
                          aiResponseSummary: decs.reflection?.responseSummary || 'Suggested decomposing monolithic handlers into service layers.',
                          studentReflection: decs.reflection?.reflection || 'Acknowledged tight coupling and refactored logic into service layer.',
                        },
                        {
                          phaseKey: 'decomposition',
                          phaseName: 'DECOMPOSITION',
                          badgeBg: 'bg-blue-50',
                          badgeText: 'text-blue-700',
                          aiTool: decs.decomposition?.aiTool || 'ChatGPT-4o',
                          decision: decs.decomposition?.decision || 'Partially Modified',
                          decisionBg: 'bg-blue-50',
                          decisionText: 'text-blue-700',
                          prompt: decs.decomposition?.prompt || '"Help me break down the authentication process with JWT & Refresh token."',
                          aiResponseSummary: decs.decomposition?.responseSummary || 'Divided into 4 submodules: validation, token gen, cookie, middleware.',
                          studentReflection: decs.decomposition?.reflection || 'Kept the proposed 4 modules, altered token storage to secure cookies.',
                        },
                        {
                          phaseKey: 'pattern',
                          phaseName: 'PATTERN RECOGNITION',
                          badgeBg: 'bg-indigo-50',
                          badgeText: 'text-indigo-700',
                          aiTool: decs.pattern?.aiTool || 'GitHub Copilot',
                          decision: decs.pattern?.decision || 'Heavily Adapted',
                          decisionBg: 'bg-amber-50',
                          decisionText: 'text-amber-700',
                          prompt: decs.pattern?.prompt || '"Generate generic repository pattern for MongoDB CRUD operations."',
                          aiResponseSummary: decs.pattern?.responseSummary || 'Provided standard BaseRepository class using native Mongo client.',
                          studentReflection: decs.pattern?.reflection || 'Adapted types to fit project schema and added retry transactions.',
                        },
                        {
                          phaseKey: 'abstraction',
                          phaseName: 'ABSTRACTION',
                          badgeBg: 'bg-cyan-50',
                          badgeText: 'text-cyan-700',
                          aiTool: decs.abstraction?.aiTool || 'ChatGPT-4o',
                          decision: decs.abstraction?.decision || 'Fully Accepted',
                          decisionBg: 'bg-emerald-50',
                          decisionText: 'text-emerald-700',
                          prompt: decs.abstraction?.prompt || '"Abstract file upload handling into an independent storage provider."',
                          aiResponseSummary: decs.abstraction?.responseSummary || 'Created IStorageProvider interface with SeaweedFS & S3 adapters.',
                          studentReflection: decs.abstraction?.reflection || 'Implemented interface smoothly without leaking filesystem details.',
                        },
                        {
                          phaseKey: 'algorithmic',
                          phaseName: 'ALGORITHMIC THINKING',
                          badgeBg: 'bg-teal-50',
                          badgeText: 'text-teal-700',
                          aiTool: decs.algorithmic?.aiTool || 'Gemini 1.5 Pro',
                          decision: decs.algorithmic?.decision || 'Rejected',
                          decisionBg: 'bg-rose-50',
                          decisionText: 'text-rose-700',
                          prompt: decs.algorithmic?.prompt || '"Write optimal query to calculate real-time student participation."',
                          aiResponseSummary: decs.algorithmic?.responseSummary || 'Suggested client-side sorting and filter logic over full dataset.',
                          studentReflection: decs.algorithmic?.reflection || 'Rejected client-side approach; implemented MongoDB Aggregation pipeline instead.',
                        },
                      ];
                      setAiDeclarations(mappedPhases);
                    }
                  } catch (e) {}
                }
              }

              if (files && files.length > 0) {
                const firstFile = files[0];
                setSubmissionFile({
                  name: firstFile.name || firstFile.filename || 'SE18D01_TranThiB_BackendArchitecture.ts',
                  size: firstFile.size,
                  url: firstFile.url,
                  lines: DEFAULT_SUBMISSION_CODE_LINES,
                });
              }
            }
          } catch (e) {
            console.warn('Submission load failed, using mock data', e);
          }
        } else if (stateData) {
          // If state passed from table click
          if (stateData.student_name) {
            setStudentInfo({
              name: stateData.student_name,
              code: stateData.student_code || 'DE181802',
              email: stateData.student_email || '',
              aiRiskLevel: 'low',
              aiRiskLabel: 'low AI-transparency risk',
            });
          }
          if (stateData.score != null) {
            const sc = Number(stateData.score);
            const r1 = parseFloat((sc * 0.4).toFixed(2));
            const r2 = parseFloat((sc * 0.4).toFixed(2));
            const r3 = parseFloat((sc - r1 - r2).toFixed(2));
            setInitialScores({ r1, r2, r3 });
            setInitialFeedback(stateData.feedback || '');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadGradingData();
  }, [assignmentId, submissionId, location.state]);

  // Handle Save Draft
  const handleSaveDraft = async (payload: GradePayload) => {
    const gradePayload = {
      score: payload.score,
      feedback: payload.feedback,
      maxScore: 10,
      max_score: 10,
      isDraft: true,
      rubrics: payload.rubrics,
      aiCompliance: payload.aiComplianceStatus,
    };

    if (existingGradeId) {
      await GradingService.updateGrade(existingGradeId, gradePayload);
    } else if (submissionId && !submissionId.startsWith('mock-')) {
      const res = await GradingService.createGrade({
        ...gradePayload,
        submissionId,
        submission_id: submissionId,
      });
      if (res && res.data && res.data.id) {
        setExistingGradeId(res.data.id);
      }
    }
  };

  // Handle Publish Grade
  const handlePublishGrade = async (payload: GradePayload) => {
    const gradePayload = {
      score: payload.score,
      feedback: payload.feedback,
      maxScore: 10,
      max_score: 10,
      isDraft: false,
      rubrics: payload.rubrics,
      aiCompliance: payload.aiComplianceStatus,
    };

    if (existingGradeId) {
      await GradingService.updateGrade(existingGradeId, gradePayload);
    } else if (submissionId && !submissionId.startsWith('mock-')) {
      await GradingService.createGrade({
        ...gradePayload,
        submissionId,
        submission_id: submissionId,
      });
    }

    // Return to assignment details after short delay
    setTimeout(() => {
      handleBack();
    }, 1200);
  };

  // Handle Request Resubmit
  const handleRequestResubmit = async (reason: string) => {
    console.log(`[ART-AI] Request Resubmit for submission ${submissionId}: ${reason}`);
    // Simulate backend call or update status
    await new Promise((resolve) => setTimeout(resolve, 600));
  };

  // Handle Back
  const handleBack = () => {
    if (assignmentId) {
      navigate(`/lecturer/assignments/${assignmentId}`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f8fafc] text-slate-700 h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Đang tải hồ sơ chấm điểm ART-AI...</p>
      </div>
    );
  }

  return (
    <LecturerAcademicEvaluation
      student={studentInfo}
      courseInfo={courseInfo}
      submissionFile={submissionFile}
      aiDeclarations={aiDeclarations}
      initialRubrics={initialScores}
      initialFeedback={initialFeedback}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      onPublishGrade={handlePublishGrade}
      onRequestResubmit={handleRequestResubmit}
    />
  );
}
