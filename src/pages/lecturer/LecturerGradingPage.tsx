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
import MockSubmissionService, { parseZipFileToTree, MOCK_ZIP_TREE_CASE_1 } from '../../services/mockSubmissionService';
import { SubmissionFile } from '../../types/submission';
import { normalizeAuditData } from '../../helper/aiAuditHelper';

export default function LecturerGradingPage() {
  const { assignmentId, submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState<boolean>(true);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>(DEFAULT_STUDENT);
  const stateData = location.state as any;
  const initialCourseName =
    stateData?.courseTitle ||
    stateData?.courseName ||
    stateData?.subjectName ||
    DEFAULT_COURSE_INFO.courseTitle;

  const [courseInfo, setCourseInfo] = useState<CourseClassInfo>({
    courseCode: stateData?.subjectCode || stateData?.classCode || stateData?.className || DEFAULT_COURSE_INFO.courseCode,
    courseTitle: initialCourseName,
    courseName: initialCourseName,
    subjectName: stateData?.subjectName || stateData?.courseName || initialCourseName,
    className: stateData?.className || stateData?.classCode || DEFAULT_COURSE_INFO.className,
    assignmentTitle: stateData?.assignmentTitle || DEFAULT_COURSE_INFO.assignmentTitle,
    classId: stateData?.class_id || stateData?.classId,
    assignmentId: assignmentId || stateData?.assignmentId,
  });
  const [submissionFile, setSubmissionFile] = useState<SubmissionCodeFile>({
    name: 'SE18D01_TranThiB_BackendArchitecture.ts',
    lines: DEFAULT_SUBMISSION_CODE_LINES,
  });
  const [currentFile, setCurrentFile] = useState<SubmissionFile | undefined>(undefined);
  const [aiDeclarations, setAiDeclarations] = useState<AiDeclarationPhase[]>(DEFAULT_AI_DECLARATIONS);
  const [existingGradeId, setExistingGradeId] = useState<string | null>(null);
  const [resolvedAssignmentId, setResolvedAssignmentId] = useState<string | null>(
    assignmentId || stateData?.assignment_id || stateData?.assignmentId || null
  );
  const [initialScores, setInitialScores] = useState<RubricScores>({
    abstraction: 0,
    implementation: 0,
    verification: 0,
    ai_interaction: 0,
    // pattern: 0,
    // abstraction: 0,
    // algorithmic: 0,
    reflection: 0,
  });
  const [initialFeedback, setInitialFeedback] = useState<string>('');

  useEffect(() => {
    const loadGradingData = async () => {
      try {
        setLoading(true);

        // State passed from parent listing page if available
        if (assignmentId) {
          setResolvedAssignmentId(assignmentId);
        } else if (stateData?.assignment_id || stateData?.assignmentId) {
          setResolvedAssignmentId(stateData.assignment_id || stateData.assignmentId);
        }

        // 1. Load Assignment info
        if (assignmentId && !assignmentId.startsWith('asm-')) {
          try {
            const assignRes = await AssignmentService.getAssignmentDetail(assignmentId);
            const assign = assignRes?.data || assignRes;
            if (assign) {
              const resolvedCourseName =
                assign.subject_name ||
                assign.course_name ||
                assign.subject?.name ||
                assign.class?.subject?.name ||
                assign.class_name ||
                stateData?.courseTitle ||
                stateData?.courseName ||
                stateData?.subjectName ||
                'Software Architecture and Design';

              setCourseInfo({
                courseCode: assign.subject_code || assign.class_code || assign.course_code || stateData?.subjectCode || stateData?.classCode || 'SE1801',
                courseTitle: resolvedCourseName,
                courseName: resolvedCourseName,
                subjectName: assign.subject_name || assign.subject?.name || stateData?.subjectName || resolvedCourseName,
                className: assign.class_name || assign.class_code || stateData?.className || stateData?.classCode || 'SE1801',
                assignmentTitle: assign.title || stateData?.assignmentTitle || 'Backend Architecture C4 Model',
                classId: assign.class_id || assign.classId || stateData?.class_id || stateData?.classId,
                assignmentId: assignmentId || assign.id,
              });
            }
          } catch (e) {
            console.warn('Assignment load failed, using fallback/state', e);
          }
        }

        // 2. Load Submission info
        let subDataLoaded = false;
        if (submissionId && !submissionId.startsWith('mock-') && !submissionId.startsWith('sub-')) {
          try {
            const subRes = await SubmissionService.getSubmissionById(submissionId, true);
            const subData = subRes?.data || subRes;

            if (subData) {
              subDataLoaded = true;
              if (subData.assignment_id || subData.assignmentId) {
                setResolvedAssignmentId(subData.assignment_id || subData.assignmentId);
              }
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
                const rubricsObj = subData.rubrics || gradeObj.rubrics;

                if (rubricsObj && rubricsObj.abstraction !== undefined && rubricsObj.implementation !== undefined) {
                  setInitialScores(rubricsObj);
                } else if (rubricsObj && (rubricsObj.decomposition !== undefined || rubricsObj.pattern !== undefined)) {
                  const totalOld = (rubricsObj.decomposition || 0) + (rubricsObj.pattern || 0) + (rubricsObj.abstraction || 0) + (rubricsObj.algorithmic || 0) + (rubricsObj.reflection || 0);
                  const ratio = totalOld > 0 ? totalOld / 10 : 0;
                  setInitialScores({
                    abstraction: parseFloat((2.0 * ratio).toFixed(2)),
                    implementation: parseFloat((3.0 * ratio).toFixed(2)),
                    verification: parseFloat((2.5 * ratio).toFixed(2)),
                    ai_interaction: parseFloat((1.5 * ratio).toFixed(2)),
                    reflection: parseFloat((1.0 * ratio).toFixed(2)),
                  });
                } else if (rubricsObj && (rubricsObj.r1 !== undefined || rubricsObj.r2 !== undefined)) {
                  const sum = (rubricsObj.r1 || 0) + (rubricsObj.r2 || 0) + (rubricsObj.r3 || 0);
                  const ratio = sum > 0 ? sum / 10 : 0;
                  setInitialScores({
                    abstraction: parseFloat((2.0 * ratio).toFixed(2)),
                    implementation: parseFloat((3.0 * ratio).toFixed(2)),
                    verification: parseFloat((2.5 * ratio).toFixed(2)),
                    ai_interaction: parseFloat((1.5 * ratio).toFixed(2)),
                    reflection: parseFloat((1.0 * ratio).toFixed(2)),
                  });
                } else {
                  const ratio = scoreNum > 0 ? scoreNum / 10 : 0;
                  setInitialScores({
                    abstraction: parseFloat((2.0 * ratio).toFixed(2)),
                    implementation: parseFloat((3.0 * ratio).toFixed(2)),
                    verification: parseFloat((2.5 * ratio).toFixed(2)),
                    ai_interaction: parseFloat((1.5 * ratio).toFixed(2)),
                    reflection: parseFloat((1.0 * ratio).toFixed(2)),
                  });
                }
                setInitialFeedback(subData.feedback || gradeObj.feedback || '');
              }

              // Submission Files
              let files: any[] = [];
              if (subData.versions && subData.versions.length > 0) {
                const latestVer = subData.versions[0];
                try {
                  files = typeof latestVer.files === 'string' ? JSON.parse(latestVer.files) : latestVer.files;
                } catch (e) {}

                if (latestVer.note) {
                  try {
                    const normalized = normalizeAuditData(latestVer.note);
                    if (normalized && normalized.scopes && normalized.scopes.length > 0) {
                      const decs = normalized.scopes[0].declarations;
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

              // Fallback to stateData files if versions was empty
              if ((!files || files.length === 0) && stateData?.latest_files) {
                try {
                  files = typeof stateData.latest_files === 'string' ? JSON.parse(stateData.latest_files) : stateData.latest_files;
                } catch (e) {}
              }

              if (files && files.length > 0) {
                const firstFile = files[0];
                const fileName = firstFile.name || firstFile.filename || 'SE18D01_TranThiB_BackendArchitecture.ts';
                const isZip = fileName.toLowerCase().endsWith('.zip');
                const isPdf = fileName.toLowerCase().endsWith('.pdf');
                const isCode = /\.(ts|tsx|js|jsx|py|java|cpp|c|cs|html|css|json|md|txt|sql|xml|yml|yaml)$/i.test(fileName);

                let presignedUrl = firstFile.url || '';
                let extractedTree = undefined;
                let textContent = undefined;

                // Lấy Presigned URL thật từ Backend S3 nếu file có ID
                if (firstFile.id && submissionId && !submissionId.startsWith('mock-')) {
                  try {
                    const fileRes = await SubmissionService.getSubmissionFile(submissionId, firstFile.id);
                    const fileData = fileRes?.data || fileRes;
                    if (fileData?.url) {
                      presignedUrl = fileData.url;
                    }
                  } catch (err) {
                    console.warn('[ART-AI] Failed to get presigned URL from SubmissionService:', err);
                  }
                }

                // Nếu có presigned URL, tải trực tiếp dữ liệu thật để giải nén hoặc hiển thị
                if (presignedUrl) {
                  if (isZip) {
                    try {
                      const zipRes = await fetch(presignedUrl);
                      if (zipRes.ok) {
                        const blob = await zipRes.blob();
                        extractedTree = await parseZipFileToTree(blob);
                      }
                    } catch (err) {
                      console.warn('[ART-AI] Could not parse zip from presigned URL, using fallback:', err);
                      extractedTree = MOCK_ZIP_TREE_CASE_1;
                    }
                  } else if (isCode) {
                    try {
                      const textRes = await fetch(presignedUrl);
                      if (textRes.ok) {
                        textContent = await textRes.text();
                      }
                    } catch (err) {
                      console.warn('[ART-AI] Could not fetch code text from presigned URL:', err);
                    }
                  }
                } else if (isZip) {
                  extractedTree = MOCK_ZIP_TREE_CASE_1;
                }

                const resolvedFile: SubmissionFile = {
                  name: fileName,
                  url: presignedUrl,
                  size: firstFile.size || 0,
                  mimeType: firstFile.type || (isZip ? 'application/zip' : isPdf ? 'application/pdf' : 'text/plain'),
                  fileType: isZip ? 'zip' : isPdf ? 'pdf' : isCode ? 'code' : 'other',
                  extractedTree: extractedTree && extractedTree.length > 0 ? extractedTree : (isZip ? MOCK_ZIP_TREE_CASE_1 : undefined),
                  textContent: textContent || (isCode ? DEFAULT_SUBMISSION_CODE_LINES.join('\n') : undefined),
                };

                setCurrentFile(resolvedFile);
                setSubmissionFile({
                  name: fileName,
                  size: firstFile.size,
                  url: presignedUrl,
                  content: textContent,
                  lines: textContent ? textContent.split('\n') : DEFAULT_SUBMISSION_CODE_LINES,
                });
              }
            }
          } catch (e) {
            console.warn('Real backend submission load failed, trying MockSubmissionService', e);
          }
        }

        // Fallback to MockSubmissionService (Case 1, Case 2, Case 3, etc.)
        if (!subDataLoaded) {
          try {
            const mockSub = await MockSubmissionService.getSubmissionById(
              assignmentId || 'asg-swd392-01',
              submissionId || 'sub-de181802'
            );
            if (mockSub) {
              if (mockSub.assignmentId) {
                setResolvedAssignmentId(mockSub.assignmentId);
              }
              setStudentInfo({
                name: mockSub.studentName,
                code: mockSub.studentCode,
                email: mockSub.studentEmail || 'tranb.de181802@fpt.edu.vn',
                aiRiskLevel: mockSub.aiRiskLevel || 'low',
                aiRiskLabel: mockSub.aiRiskLabel || 'low AI-transparency risk',
              });

              if (mockSub.file) {
                setCurrentFile(mockSub.file);
                setSubmissionFile({
                  name: mockSub.file.name,
                  size: mockSub.file.size,
                  url: mockSub.file.url,
                  lines: DEFAULT_SUBMISSION_CODE_LINES,
                });
              }

              // Xử lý Empty State nếu không khai báo AI
              if (!mockSub.aiAuditLog || !mockSub.aiAuditLog.isDeclared) {
                setAiDeclarations([]);
              } else {
                setAiDeclarations([
                  {
                    phaseKey: 'reflection',
                    phaseName: 'AI REFLECTION',
                    badgeBg: 'bg-purple-50',
                    badgeText: 'text-purple-700',
                    aiTool: mockSub.aiAuditLog.reflection?.aiTool || 'Claude 3.5 Sonnet',
                    decision: (mockSub.aiAuditLog.reflection?.decision as any) || 'Fully Accepted',
                    decisionBg: mockSub.aiAuditLog.reflection?.decision === 'Rejected' ? 'bg-rose-50' : 'bg-emerald-50',
                    decisionText: mockSub.aiAuditLog.reflection?.decision === 'Rejected' ? 'text-rose-700' : 'text-emerald-700',
                    prompt: mockSub.aiAuditLog.reflection?.prompt || '',
                    aiResponseSummary: mockSub.aiAuditLog.reflection?.responseSummary || '',
                    studentReflection: mockSub.aiAuditLog.reflection?.reflection || '',
                  },
                  {
                    phaseKey: 'decomposition',
                    phaseName: 'DECOMPOSITION',
                    badgeBg: 'bg-blue-50',
                    badgeText: 'text-blue-700',
                    aiTool: mockSub.aiAuditLog.decomposition?.aiTool || 'ChatGPT-4o',
                    decision: (mockSub.aiAuditLog.decomposition?.decision as any) || 'Partially Modified',
                    decisionBg: 'bg-blue-50',
                    decisionText: 'text-blue-700',
                    prompt: mockSub.aiAuditLog.decomposition?.prompt || '',
                    aiResponseSummary: mockSub.aiAuditLog.decomposition?.responseSummary || '',
                    studentReflection: mockSub.aiAuditLog.decomposition?.reflection || '',
                  },
                  {
                    phaseKey: 'pattern',
                    phaseName: 'PATTERN RECOGNITION',
                    badgeBg: 'bg-indigo-50',
                    badgeText: 'text-indigo-700',
                    aiTool: mockSub.aiAuditLog.pattern?.aiTool || 'GitHub Copilot',
                    decision: (mockSub.aiAuditLog.pattern?.decision as any) || 'Heavily Adapted',
                    decisionBg: 'bg-amber-50',
                    decisionText: 'text-amber-700',
                    prompt: mockSub.aiAuditLog.pattern?.prompt || '',
                    aiResponseSummary: mockSub.aiAuditLog.pattern?.responseSummary || '',
                    studentReflection: mockSub.aiAuditLog.pattern?.reflection || '',
                  },
                  {
                    phaseKey: 'abstraction',
                    phaseName: 'ABSTRACTION',
                    badgeBg: 'bg-cyan-50',
                    badgeText: 'text-cyan-700',
                    aiTool: mockSub.aiAuditLog.abstraction?.aiTool || 'ChatGPT-4o',
                    decision: (mockSub.aiAuditLog.abstraction?.decision as any) || 'Fully Accepted',
                    decisionBg: 'bg-emerald-50',
                    decisionText: 'text-emerald-700',
                    prompt: mockSub.aiAuditLog.abstraction?.prompt || '',
                    aiResponseSummary: mockSub.aiAuditLog.abstraction?.responseSummary || '',
                    studentReflection: mockSub.aiAuditLog.abstraction?.reflection || '',
                  },
                  {
                    phaseKey: 'algorithmic',
                    phaseName: 'ALGORITHMIC THINKING',
                    badgeBg: 'bg-teal-50',
                    badgeText: 'text-teal-700',
                    aiTool: mockSub.aiAuditLog.algorithmic?.aiTool || 'Gemini 1.5 Pro',
                    decision: (mockSub.aiAuditLog.algorithmic?.decision as any) || 'Rejected',
                    decisionBg: 'bg-rose-50',
                    decisionText: 'text-rose-700',
                    prompt: mockSub.aiAuditLog.algorithmic?.prompt || '',
                    aiResponseSummary: mockSub.aiAuditLog.algorithmic?.responseSummary || '',
                    studentReflection: mockSub.aiAuditLog.algorithmic?.reflection || '',
                  },
                ]);
              }

              const activeRubrics = mockSub.rubrics || mockSub.grade?.rubrics;
              const activeScore = mockSub.score ?? mockSub.grade?.score;
              const activeFeedback = mockSub.feedback || mockSub.grade?.feedback;

              if (activeRubrics && activeRubrics.abstraction !== undefined && activeRubrics.implementation !== undefined) {
                setInitialScores(activeRubrics);
              } else if (activeRubrics && (activeRubrics.decomposition !== undefined || activeRubrics.pattern !== undefined)) {
                const totalOld = (activeRubrics.decomposition || 0) + (activeRubrics.pattern || 0) + (activeRubrics.abstraction || 0) + (activeRubrics.algorithmic || 0) + (activeRubrics.reflection || 0);
                const ratio = totalOld > 0 ? totalOld / 10 : 0;
                setInitialScores({
                  abstraction: parseFloat((2.0 * ratio).toFixed(2)),
                  implementation: parseFloat((3.0 * ratio).toFixed(2)),
                  verification: parseFloat((2.5 * ratio).toFixed(2)),
                  ai_interaction: parseFloat((1.5 * ratio).toFixed(2)),
                  reflection: parseFloat((1.0 * ratio).toFixed(2)),
                });
              } else if (activeRubrics && (activeRubrics.r1 !== undefined || activeRubrics.r2 !== undefined)) {
                const sum = (activeRubrics.r1 || 0) + (activeRubrics.r2 || 0) + (activeRubrics.r3 || 0);
                const ratio = sum > 0 ? sum / 10 : 0;
                setInitialScores({
                  abstraction: parseFloat((2.0 * ratio).toFixed(2)),
                  implementation: parseFloat((3.0 * ratio).toFixed(2)),
                  verification: parseFloat((2.5 * ratio).toFixed(2)),
                  ai_interaction: parseFloat((1.5 * ratio).toFixed(2)),
                  reflection: parseFloat((1.0 * ratio).toFixed(2)),
                });
              } else if (activeScore != null) {
                const sc = Number(activeScore);
                const ratio = sc > 0 ? sc / 10 : 0;
                setInitialScores({
                  abstraction: parseFloat((2.0 * ratio).toFixed(2)),
                  implementation: parseFloat((3.0 * ratio).toFixed(2)),
                  verification: parseFloat((2.5 * ratio).toFixed(2)),
                  ai_interaction: parseFloat((1.5 * ratio).toFixed(2)),
                  reflection: parseFloat((1.0 * ratio).toFixed(2)),
                });
              }
              if (activeFeedback) {
                setInitialFeedback(activeFeedback);
              }
            }
          } catch (err) {
            console.warn('Mock submission load also failed, using defaults', err);
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
    const isMock = !submissionId || submissionId.startsWith('mock-') || submissionId.startsWith('sub-');
    const gradePayload = {
      score: payload.score,
      feedback: payload.feedback,
      maxScore: 10,
      max_score: 10,
      isDraft: true,
      rubrics: payload.rubrics,
      aiCompliance: payload.aiComplianceStatus,
    };

    try {
      if (isMock) {
        await MockSubmissionService.gradeSubmission(submissionId || 'sub-de181802', {
          score: payload.score,
          feedback: payload.feedback,
          rubrics: payload.rubrics,
          aiComplianceStatus: payload.aiComplianceStatus,
          isDraft: true,
        });
      } else if (existingGradeId) {
        await GradingService.updateGrade(existingGradeId, gradePayload);
      } else if (submissionId) {
        const res = await GradingService.createGrade({
          ...gradePayload,
          submissionId,
          submission_id: submissionId,
        });
        if (res && res.data && res.data.id) {
          setExistingGradeId(res.data.id);
        }
      }
    } catch (err) {
      console.warn('[ART-AI] Save draft error:', err);
      if (submissionId) {
        await MockSubmissionService.gradeSubmission(submissionId, {
          score: payload.score,
          feedback: payload.feedback,
          rubrics: payload.rubrics,
          aiComplianceStatus: payload.aiComplianceStatus,
          isDraft: true,
        }).catch(() => {});
      }
    }
  };

  const [publishedScore, setPublishedScore] = useState<number | null>(null);

  // Handle Publish Grade
  const handlePublishGrade = async (payload: GradePayload) => {
    setPublishedScore(payload.score);
    const isMock = !submissionId || submissionId.startsWith('mock-') || submissionId.startsWith('sub-');
    const targetAssignmentId =
      assignmentId ||
      resolvedAssignmentId ||
      (location.state as any)?.assignment_id ||
      (location.state as any)?.assignmentId;

    const gradePayload = {
      score: payload.score,
      feedback: payload.feedback,
      maxScore: 10,
      max_score: 10,
      isDraft: false,
      rubrics: payload.rubrics,
      aiCompliance: payload.aiComplianceStatus,
    };

    // Luôn lưu vào MockSubmissionService & localStorage để đồng bộ ngay lập tức cho cả 2 luồng
    try {
      await MockSubmissionService.gradeSubmission(submissionId || 'sub-de181802', {
        score: payload.score,
        feedback: payload.feedback,
        rubrics: payload.rubrics,
        aiComplianceStatus: payload.aiComplianceStatus,
        isDraft: false,
      });

      try {
        localStorage.setItem(
          'edux_latest_grade',
          JSON.stringify({
            score: payload.score,
            feedback: payload.feedback,
            rubrics: payload.rubrics,
            submissionId: submissionId || 'sub-de181802',
            studentCode: studentInfo.code,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (e) {}
    } catch (e) {
      console.warn('[ART-AI] Mock storage sync error:', e);
    }

    try {
      if (!isMock) {
        if (existingGradeId) {
          await GradingService.updateGrade(existingGradeId, gradePayload);
        } else if (submissionId) {
          const res = await GradingService.createGrade({
            ...gradePayload,
            submissionId,
            submission_id: submissionId,
          });
          if (res && res.data && res.data.id) {
            setExistingGradeId(res.data.id);
          }
        }
      }
    } catch (err) {
      console.warn('[ART-AI] Grade publish API failed, falling back to mock state:', err);
    }
  };

  // Handle Request Resubmit
  const handleRequestResubmit = async (reason: string) => {
    console.log(`[ART-AI] Request Resubmit for submission ${submissionId}: ${reason}`);
    try {
      if (submissionId) {
        await MockSubmissionService.requestResubmit(submissionId, reason);
      }
    } catch (e) {
      console.warn('[ART-AI] Request resubmit error:', e);
    }
    setTimeout(() => {
      handleBack();
    }, 800);
  };

  // Handle Back: Quay về trang danh sách các bài nộp của sinh viên
  const handleBack = (explicitScore?: number) => {
    const finalScore = explicitScore ?? publishedScore;
    const targetAssignmentId =
      assignmentId ||
      resolvedAssignmentId ||
      (location.state as any)?.assignment_id ||
      (location.state as any)?.assignmentId;

    if (targetAssignmentId) {
      navigate(`/lecturer/assignments/${targetAssignmentId}`, {
        state: {
          message: finalScore != null
            ? `Đã công bố điểm ${Number(finalScore).toFixed(2)}/10 thành công!`
            : 'Đã công bố điểm bài nộp thành công!',
          type: 'success',
          refresh: Date.now(),
          updatedScore: finalScore,
          gradedSubmissionId: submissionId,
        },
      });
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#f8fafc] text-slate-700 w-full h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Đang tải hồ sơ chấm điểm ART-AI...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden m-0 p-0">
      <LecturerAcademicEvaluation
        student={studentInfo}
        courseInfo={courseInfo}
        submissionFile={submissionFile}
        file={currentFile}
        aiDeclarations={aiDeclarations}
        initialRubrics={initialScores}
        initialFeedback={initialFeedback}
        onBack={handleBack}
        onSaveDraft={handleSaveDraft}
        onPublishGrade={handlePublishGrade}
        onRequestResubmit={handleRequestResubmit}
      />
    </div>
  );
}
