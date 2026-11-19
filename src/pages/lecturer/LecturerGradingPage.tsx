import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
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
import TopicService from '../../services/topic.service';
import { parseZipFileToTree } from '../../services/mockSubmissionService';
import { SubmissionFile } from '../../types/submission';
import { normalizeAuditData } from '../../helper/aiAuditHelper';

export default function LecturerGradingPage() {
  const { assignmentId, submissionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState<number>(0);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>(DEFAULT_STUDENT);
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(false);
  const [savedAiEvaluation, setSavedAiEvaluation] = useState<any>(null);
  const stateData = location.state as any;
  const initialCourseName =
    stateData?.courseTitle ||
    stateData?.courseName ||
    stateData?.subjectName ||
    '';

  const [courseInfo, setCourseInfo] = useState<CourseClassInfo>({
    courseCode: stateData?.subjectCode || stateData?.classCode || stateData?.className || '',
    courseTitle: initialCourseName,
    courseName: initialCourseName,
    subjectName: stateData?.subjectName || stateData?.courseName || initialCourseName,
    className: stateData?.className || stateData?.classCode || '',
    assignmentTitle: stateData?.assignmentTitle || '',
    classId: stateData?.class_id || stateData?.classId,
    assignmentId: assignmentId || stateData?.assignmentId,
    subjectId: stateData?.subject_id || stateData?.subjectId,
  });
  const [submissionFile, setSubmissionFile] = useState<SubmissionCodeFile>({
    name: '',
    lines: [],
  });
  const [currentFile, setCurrentFile] = useState<SubmissionFile | undefined>(undefined);
  const [aiDeclarations, setAiDeclarations] = useState<AiDeclarationPhase[]>([]);
  const [auditRawData, setAuditRawData] = useState<any>(null);
  const [noAiUsed, setNoAiUsed] = useState<boolean>(false);
  const [noAiNote, setNoAiNote] = useState<string>('');
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
        setSavedAiEvaluation(null);
        setInitialFeedback('');
        setExistingGradeId(null);
        setInitialScores({
          abstraction: 0,
          implementation: 0,
          verification: 0,
          ai_interaction: 0,
          reflection: 0,
        });

        // State passed from parent listing page if available
        if (assignmentId) {
          setResolvedAssignmentId(assignmentId);
        } else if (stateData?.assignment_id || stateData?.assignmentId) {
          setResolvedAssignmentId(stateData.assignment_id || stateData.assignmentId);
        }

        let resolvedSubjectId: string | undefined = stateData?.subject_id || stateData?.subjectId;

        // 1. Load Assignment info
        if (assignmentId) {
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

              resolvedSubjectId =
                assign.subject_id ||
                assign.subjectId ||
                assign.subject?.id ||
                assign.class?.subject_id ||
                assign.class?.subjectId ||
                resolvedSubjectId;

              const assignCourseTopics = Array.isArray(assign.course_topics) ? assign.course_topics : undefined;
              const assignHasTopics = typeof assign.has_course_topics === 'boolean'
                ? assign.has_course_topics
                : (assignCourseTopics ? assignCourseTopics.length > 0 : undefined);

              if (assignCourseTopics) {
                setTopics(assignCourseTopics);
              }

              setCourseInfo({
                courseCode: assign.subject_code || assign.class_code || assign.course_code || stateData?.subjectCode || stateData?.classCode || 'SE1801',
                courseTitle: resolvedCourseName,
                courseName: resolvedCourseName,
                subjectName: assign.subject_name || assign.subject?.name || stateData?.subjectName || resolvedCourseName,
                className: assign.class_name || assign.class_code || stateData?.className || stateData?.classCode || 'SE1801',
                assignmentTitle: assign.title || stateData?.assignmentTitle || 'Backend Architecture C4 Model',
                classId: assign.class_id || assign.classId || stateData?.class_id || stateData?.classId,
                assignmentId: assignmentId || assign.id,
                subjectId: resolvedSubjectId,
                rubric_configs: assign.rubric_configs,
                ai_declaration_required: assign.ai_declaration_required !== false,
                course_topics: assignCourseTopics,
                has_course_topics: assignHasTopics,
              });

              if (resolvedSubjectId) {
                setIsLoadingTopics(true);
                try {
                  const tRes = await TopicService.getTopics(resolvedSubjectId);
                  const list = tRes?.data || tRes || [];
                  const topicList = Array.isArray(list) ? list : [];
                  setTopics(topicList);
                  setCourseInfo((prev) => ({
                    ...prev,
                    course_topics: topicList,
                    has_course_topics: topicList.length > 0,
                  }));
                } catch (tErr) {
                  console.warn('[ART-AI] Failed to load topics for subject:', tErr);
                  setTopics([]);
                  setCourseInfo((prev) => ({
                    ...prev,
                    course_topics: [],
                    has_course_topics: false,
                  }));
                } finally {
                  setIsLoadingTopics(false);
                }
              }
            }
          } catch (e) {
            console.warn('Assignment load failed, using fallback/state', e);
          }
        }

        // 2. Load Submission info
        let subDataLoaded = false;
        if (submissionId) {
          try {
            const subRes = await SubmissionService.getSubmissionById(submissionId, true);
            const subData = subRes?.data || subRes;

            if (subData) {
              subDataLoaded = true;
              if (subData.assignment_id || subData.assignmentId) {
                setResolvedAssignmentId(subData.assignment_id || subData.assignmentId);
              }

              if (!resolvedSubjectId) {
                const fallbackSubjectId =
                  subData.subject_id ||
                  subData.subjectId ||
                  subData.assignment?.subject_id ||
                  subData.assignment?.subjectId ||
                  subData.assignment?.class?.subject_id;
                if (fallbackSubjectId) {
                  resolvedSubjectId = fallbackSubjectId;
                  setCourseInfo((prev) => ({ ...prev, subjectId: fallbackSubjectId }));
                  setIsLoadingTopics(true);
                  try {
                    const tRes = await TopicService.getTopics(fallbackSubjectId);
                    const list = tRes?.data || tRes || [];
                    setTopics(Array.isArray(list) ? list : []);
                  } catch (e) {
                    console.warn('[ART-AI] Failed to load topics from subData fallback:', e);
                  } finally {
                    setIsLoadingTopics(false);
                  }
                }
              }

              // Student Info
              setStudentInfo({
                name: subData.student_name || stateData?.student_name || 'Sinh viên',
                code: subData.student_code || stateData?.student_code || '',
                email: subData.student_email || stateData?.student_email || '',
                aiRiskLevel: (subData.ai_risk_level as any) || 'low',
                aiRiskLabel: subData.ai_risk_label || 'low AI-transparency risk',
              });

              const subCourseTopics = Array.isArray(subData.course_topics) ? subData.course_topics : undefined;
              const subHasTopics = typeof subData.has_course_topics === 'boolean'
                ? subData.has_course_topics
                : (subCourseTopics ? subCourseTopics.length > 0 : undefined);
              if (subCourseTopics) {
                setTopics(subCourseTopics);
              }
              const recTopics = subData.recommended_topics || subData.ai_evaluation_data?.recommended_topics || [];
              setCourseInfo((prev) => ({
                ...prev,
                course_topics: subCourseTopics || prev.course_topics,
                has_course_topics: subHasTopics ?? prev.has_course_topics,
                recommended_topics: recTopics,
              }));

              // Existing Grade if already graded
              const savedRubrics = subData.rubrics || subData.grade?.rubrics;
              const hasSavedGrade = subData.grade || subData.score != null;

              if (hasSavedGrade) {
                const gradeObj = subData.grade || {};
                setExistingGradeId(gradeObj.id || subData.grade_id || null);
                const scoreNum = Number(subData.score || gradeObj.score || 0);

                if (savedRubrics && savedRubrics.abstraction !== undefined && savedRubrics.implementation !== undefined) {
                  setInitialScores(savedRubrics);
                } else if (savedRubrics && (savedRubrics.decomposition !== undefined || savedRubrics.pattern !== undefined)) {
                  const totalOld = (savedRubrics.decomposition || 0) + (savedRubrics.pattern || 0) + (savedRubrics.abstraction || 0) + (savedRubrics.algorithmic || 0) + (savedRubrics.reflection || 0);
                  const ratio = totalOld > 0 ? totalOld / 10 : 0;
                  setInitialScores({
                    abstraction: parseFloat((2.0 * ratio).toFixed(2)),
                    implementation: parseFloat((3.0 * ratio).toFixed(2)),
                    verification: parseFloat((2.5 * ratio).toFixed(2)),
                    ai_interaction: parseFloat((1.5 * ratio).toFixed(2)),
                    reflection: parseFloat((1.0 * ratio).toFixed(2)),
                  });
                } else if (savedRubrics && (savedRubrics.r1 !== undefined || savedRubrics.r2 !== undefined)) {
                  const sum = (savedRubrics.r1 || 0) + (savedRubrics.r2 || 0) + (savedRubrics.r3 || 0);
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
                const officialFeedback = subData.grade?.lecturer_feedback || subData.grade?.feedback || subData.lecturer_feedback || subData.feedback || '';
                setInitialFeedback(officialFeedback);
              } else {
                setInitialFeedback('');
                if (subData.ai_evaluation_data || subData.ai_rubric_scores) {
                  // Chưa chấm điểm thủ công nhưng đã có bản ghi Snapshot AI Evaluation lưu trong DB
                  const aiScores = subData.ai_rubric_scores || subData.ai_evaluation_data?.rubric_scores;
                  if (aiScores) {
                    setInitialScores(aiScores);
                  }
                }
              }

              if (subData.ai_evaluation_data || subData.ai_evaluation) {
                setSavedAiEvaluation(subData.ai_evaluation_data || subData.ai_evaluation);
              }

              // Submission Files
              let files: any[] = [];
              if (subData.versions && subData.versions.length > 0) {
                const latestVer = subData.versions[0];
                try {
                  files = typeof latestVer.files === 'string' ? JSON.parse(latestVer.files) : latestVer.files;
                } catch (e) {}

                if (latestVer.note) {
                  setAuditRawData(latestVer.note);
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
              } else if (subData.note) {
                setAuditRawData(subData.note);
              }

              let isZeroAi = Boolean(
                subData.no_ai_used === true ||
                subData.no_ai_used === 'true' ||
                subData.noAiUsed === true ||
                subData.noAiUsed === 'true' ||
                stateData?.no_ai_used === true ||
                stateData?.no_ai_used === 'true' ||
                stateData?.noAiUsed === true ||
                stateData?.noAiUsed === 'true'
              );
              let studentNoAiNote =
                subData.no_ai_note ||
                subData.noAiNote ||
                stateData?.no_ai_note ||
                stateData?.noAiNote ||
                '';

              const rawNote = (subData.versions && subData.versions[0]?.note) || subData.note || stateData?.latest_note;
              if (rawNote) {
                try {
                  const normalized: any = normalizeAuditData(rawNote);
                  if (normalized?.no_ai_used) {
                    isZeroAi = true;
                    if (!studentNoAiNote && normalized.no_ai_note) {
                      studentNoAiNote = normalized.no_ai_note;
                    }
                  }
                } catch (e) {}
              }

              setNoAiUsed(isZeroAi);
              setNoAiNote(studentNoAiNote);

              // Fallback to stateData files if versions was empty
              if ((!files || files.length === 0) && stateData?.latest_files) {
                try {
                  files = typeof stateData.latest_files === 'string' ? JSON.parse(stateData.latest_files) : stateData.latest_files;
                } catch (e) {}
              }

              if (files && files.length > 0) {
                const firstFile = files[0];
                const fileName = firstFile.name || firstFile.filename || 'submission_file';
                const isZip = fileName.toLowerCase().endsWith('.zip');
                const isPdf = fileName.toLowerCase().endsWith('.pdf');
                const isCode = /\.(ts|tsx|js|jsx|py|java|cpp|c|cs|html|css|json|md|txt|sql|xml|yml|yaml)$/i.test(fileName);

                let presignedUrl = firstFile.url || '';
                let extractedTree = undefined;
                let textContent = undefined;

                // Lấy Presigned URL thật từ Backend S3 nếu file có ID
                if (firstFile.id && submissionId) {
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
                      console.warn('[ART-AI] Could not parse zip from presigned URL:', err);
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
                }

                const resolvedFile: SubmissionFile = {
                  name: fileName,
                  url: presignedUrl,
                  size: firstFile.size || 0,
                  mimeType: firstFile.type || (isZip ? 'application/zip' : isPdf ? 'application/pdf' : 'text/plain'),
                  fileType: isZip ? 'zip' : isPdf ? 'pdf' : isCode ? 'code' : 'other',
                  extractedTree: extractedTree && extractedTree.length > 0 ? extractedTree : undefined,
                  textContent: textContent || undefined,
                };

                setCurrentFile(resolvedFile);
                setSubmissionFile({
                  name: fileName,
                  size: firstFile.size,
                  url: presignedUrl,
                  content: textContent,
                  lines: textContent ? textContent.split('\n') : [
                    `// File: ${fileName}`,
                    `// Kích thước: ${firstFile.size || 0} bytes`,
                    `// Trạng thái: ${presignedUrl ? 'Đã tải thành công' : 'Chưa có bản xem trước trực tiếp'}`
                  ],
                });
              }
            }
          } catch (e: any) {
            console.warn('Real backend submission load failed:', e);
            setErrorMessage('Không thể kết nối máy chủ để tải bài nộp. Vui lòng kiểm tra lại đường truyền mạng.');
          }
        }

        if (!subDataLoaded) {
          setErrorMessage('Không tìm thấy dữ liệu bài nộp của sinh viên.');
        }
      } catch (err: any) {
        console.warn('Load grading data failed:', err);
        setErrorMessage(err?.message || 'Có lỗi xảy ra khi tải dữ liệu bài nộp.');
      } finally {
        setLoading(false);
      }
    };

    loadGradingData();
  }, [assignmentId, submissionId, location.state, reloadTick]);

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

    try {
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
    } catch (err) {
      console.warn('[ART-AI] Save draft error:', err);
    }
  };

  const [publishedScore, setPublishedScore] = useState<number | null>(null);

  // Handle Publish Grade
  const handlePublishGrade = async (payload: GradePayload) => {
    setPublishedScore(payload.score);
    const gradePayload = {
      score: payload.score,
      feedback: payload.feedback,
      maxScore: 10,
      max_score: 10,
      isDraft: false,
      rubrics: payload.rubrics,
      aiCompliance: payload.aiComplianceStatus,
    };

    try {
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
    } catch (err) {
      console.warn('[ART-AI] Grade publish API failed:', err);
      throw err;
    }
  };

  // Handle Request Resubmit
  const handleRequestResubmit = async (reason: string) => {
    try {
      if (submissionId) {
        await SubmissionService.reviewSubmission(submissionId, { status: 'submitted', note: reason });
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

  if (errorMessage && (!studentInfo || !studentInfo.code)) {
    return (
      <div className="bg-[#f8fafc] text-slate-700 w-full h-full flex flex-col items-center justify-center space-y-4 p-6">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
          <AlertTriangle size={24} />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold text-slate-800">Không thể tải hồ sơ bài nộp</h3>
          <p className="text-xs text-slate-500 max-w-sm">{errorMessage}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleBack()}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setReloadTick((v) => v + 1);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full w-full max-w-full min-w-0 overflow-hidden overflow-x-hidden m-0 p-0">
      <LecturerAcademicEvaluation
        student={studentInfo}
        courseInfo={courseInfo}
        rubricConfigs={(courseInfo as any)?.rubric_configs || (courseInfo as any)?.rubricConfigs}
        submissionFile={submissionFile}
        file={currentFile}
        aiDeclarations={aiDeclarations}
        auditData={auditRawData}
        noAiUsed={noAiUsed}
        noAiNote={noAiNote}
        topics={topics}
        isLoadingTopics={isLoadingTopics}
        hasCourseTopics={(courseInfo as any)?.has_course_topics}
        savedEvaluation={savedAiEvaluation}
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
