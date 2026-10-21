import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LearningService from '../../services/learning.service';
import ClassService from '../../services/class.service';
import MathText from '../common/MathText';
import StudyQuizModal from './StudyQuizModal';
import StudyResultModal from './StudyResultModal';
import {
  Sparkles, Target, TrendingUp, TrendingDown,
  Minus, CheckCircle2, AlertTriangle, Calendar,
  Clock, ArrowRight, BookOpen, BrainCircuit,
  Award, RefreshCw, ChevronDown, ChevronRight, BarChart2
} from 'lucide-react';

export default function PersonalizedLearningSection() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [studyPlan, setStudyPlan] = useState(null);
  const [detailedDays, setDetailedDays] = useState([]);
  const [topicsPerf, setTopicsPerf] = useState(null);
  const [learningProfile, setLearningProfile] = useState(null);

  const [loadingPlan, setLoadingPlan] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [error, setError] = useState(null);

  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [activeQuizDayId, setActiveQuizDayId] = useState(null);
  const [activeResultDayId, setActiveResultDayId] = useState(null);
  const [showTopicDetails, setShowTopicDetails] = useState(false);

  // Reset state when user changes
  useEffect(() => {
    setSubjects([]);
    setSelectedSubjectId('');
    setStudyPlan(null);
    setDetailedDays([]);
    setTopicsPerf(null);
    setLearningProfile(null);
    setError(null);
  }, [user?.id]);

  // 1. Load active subjects for student
  useEffect(() => {
    let cancelled = false;
    async function loadStudentSubjects() {
      try {
        setLoadingSubjects(true);
        const res = await ClassService.getMyClasses();
        const classes = Array.isArray(res.data) ? res.data : (res.data?.data || []);

        const subjectMap = new Map();
        for (const cls of classes) {
          if (cls.subject_id && !subjectMap.has(cls.subject_id)) {
            subjectMap.set(cls.subject_id, {
              id: cls.subject_id,
              name: cls.subject_name || 'Môn học',
              code: cls.subject_code || '',
            });
          }
        }

        const list = [...subjectMap.values()];
        if (!cancelled) {
          setSubjects(list);
          if (list.length > 0) {
            setSelectedSubjectId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load student subjects:', err);
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    }

    loadStudentSubjects();
    return () => { cancelled = true; };
  }, [user?.id]);

  // 2. Fetch learning data & 7-day progress using existing BE APIs

  const loadLearningData = useCallback(async (subjectId) => {
    if (!subjectId) return;

    setLoadingPlan(true);
    setError(null);

    try {
      // Step A: Lấy thống kê chủ đề và hồ sơ học tập
      const [perfRes, profileRes] = await Promise.allSettled([
        LearningService.getTopicPerformance(subjectId),
        LearningService.getLearningProfile(subjectId),
      ]);

      const topics =
        perfRes.status === 'fulfilled'
          ? (perfRes.value.data?.topics || [])
          : [];
      console.log('[Topic Performance] Response:', perfRes);
      console.table(topics);
      const profile =
        profileRes.status === 'fulfilled'
          ? (profileRes.value.data || null)
          : null;

      setTopicsPerf(topics);
      setLearningProfile(profile);

      const topicNameMap = new Map();
      topics.forEach((t) => {
        topicNameMap.set(t.topicId, t.topicName);
      });

      // Step B: Kiểm tra người học đã làm bài chưa
      const totalAttempts = topics.reduce((sum, topic) => {
        return sum + Number(topic.totalAttempts || 0);
      }, 0);

      // Chỉ dùng nếu profile thực sự trả về thống kê này.
      const totalTestAnswers = Number(
        profile?.flashcardTests?.totalAnswers || 0
      );

      const hasLearningActivity =
        totalAttempts > 0 || totalTestAnswers > 0;

      if (!hasLearningActivity) {
        console.log(
          '[StudyPlan] Người học chưa có dữ liệu làm bài.'
        );

        setStudyPlan(null);
        setDetailedDays([]);
        setSelectedDayNumber(1);
        return;
      }

      // Step C: Chỉ gọi API study plan khi đã có dữ liệu làm bài
      let planData = null;

      try {
        const planRes =
          await LearningService.generateStudyPlan(subjectId);

        planData = planRes.data;
      } catch (planErr) {
        const msg = planErr.response?.data?.message;

        if (
          msg === 'NO_TOPICS_AVAILABLE' ||
          msg === 'NO_SCHEDULABLE_TOPICS'
        ) {
          setStudyPlan(null);
          setDetailedDays([]);
          return;
        }

        console.warn('Plan fetch issue:', planErr);
      }

      if (!planData || !Array.isArray(planData.days)) {
        setStudyPlan(null);
        setDetailedDays([]);
        return;
      }

      setStudyPlan(planData);

      // Step D: Lấy trạng thái chi tiết của từng ngày
      const dayOfWeekNames = [
        'CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7',
      ];

      const dayDetailPromises = planData.days.map(async (d) => {
        const date = new Date(`${d.studyDate}T00:00:00Z`);
        const dayOfWeek = dayOfWeekNames[date.getUTCDay()];
        const topicName =
          topicNameMap.get(d.topicId) || 'Chủ đề ôn tập';

        try {
          const dayRes =
            await LearningService.getStudyPlanDay(d.planDayId);

          const dayInfo = dayRes.data;

          let scorePercent = null;
          let submissionInfo = null;

          if (dayInfo.submitted) {
            try {
              const resultRes =
                await LearningService.getStudyPlanDayResult(
                  d.planDayId
                );

              scorePercent =
                resultRes.data?.scorePercent ?? null;

              submissionInfo = resultRes.data;
            } catch (_) { }
          }

          return {
            ...d,
            dayOfWeek,
            topicName: dayInfo.topicName || topicName,
            isCompleted: Boolean(dayInfo.submitted),
            contentStatus:
              dayInfo.contentStatus || d.contentStatus,
            scorePercent,
            submissionInfo,
          };
        } catch (_) {
          return {
            ...d,
            dayOfWeek,
            topicName,
            isCompleted: false,
            scorePercent: null,
          };
        }
      });

      const resolvedDays = await Promise.all(dayDetailPromises);

      setDetailedDays(resolvedDays);

      const firstIncomplete = resolvedDays.find(
        (d) => !d.isCompleted
      );

      setSelectedDayNumber(
        firstIncomplete ? firstIncomplete.day : 1
      );
    } catch (err) {
      console.error('Load learning data error:', err);
      setError('Không thể tải kế hoạch học tập cá nhân hóa.');
    } finally {
      setLoadingPlan(false);
    }
  }, []);


  useEffect(() => {
    if (selectedSubjectId) {
      loadLearningData(selectedSubjectId);
    }
  }, [selectedSubjectId, loadLearningData]);

  // 3. User manually triggers plan generation
  const handleGeneratePlan = async () => {
    if (!selectedSubjectId) return;
    try {
      setGeneratingPlan(true);
      setError(null);
      await loadLearningData(selectedSubjectId);
    } catch (err) {
      setError('Không thể tạo lịch ôn tập. Vui lòng thử lại sau.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  // 4. Compute metrics: Mastery %, Weakest Topic, Weekly Progress
  const metrics = useMemo(() => {
    const topics = topicsPerf || [];

    const totalAttemptsAll = topics.reduce((sum, t) => sum + (t.totalAttempts || 0), 0);
    const testAnswersCount = learningProfile?.flashcardTests?.totalAnswers || 0;
    const hasActivity = totalAttemptsAll > 0 || testAnswersCount > 0;

    let totalMastery = 0;
    let countedTopics = 0;
    for (const t of topics) {
      if (t.masteryEstimate !== null && t.masteryEstimate !== undefined) {
        totalMastery += t.masteryEstimate;
        countedTopics++;
      }
    }

    let overallMastery = 0;
    if (countedTopics > 0) {
      overallMastery = Math.round(totalMastery / countedTopics);
    } else if (hasActivity && learningProfile?.flashcardTests?.accuracy !== null && learningProfile?.flashcardTests?.accuracy !== undefined) {
      overallMastery = Math.round(learningProfile.flashcardTests.accuracy);
    } else {
      overallMastery = 0;
    }

    const attemptedTopics = topics.filter(t => (t.totalAttempts || 0) > 0);
    const reviewTopics = attemptedTopics.filter(t => t.needsReview || t.priority === 'high' || t.priority === 'medium');

    let weakTopic = null;
    let isDefaultTopic = false;

    if (reviewTopics.length > 0) {
      reviewTopics.sort((a, b) => {
        const accA = a.accuracy ?? 100;
        const accB = b.accuracy ?? 100;
        return accA - accB;
      });
      weakTopic = reviewTopics[0];
    } else if (attemptedTopics.length > 0) {
      const sorted = [...attemptedTopics].sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100));
      weakTopic = sorted[0];
    } else if (topics.length > 0) {
      weakTopic = topics[0];
      isDefaultTopic = true;
    }

    const completedDays = detailedDays.filter(d => d.isCompleted).length;
    const totalDays = detailedDays.length || 7;

    return {
      hasActivity,
      mastery: overallMastery,
      weakTopic,
      isDefaultTopic,
      completedDays,
      totalDays,
    };
  }, [topicsPerf, learningProfile, detailedDays]);

  const selectedDay = useMemo(() => {
    if (!detailedDays.length) return null;
    return detailedDays.find(d => d.day === selectedDayNumber) || detailedDays[0];
  }, [detailedDays, selectedDayNumber]);

  if (loadingSubjects) {
    return (
      <div style={{
        padding: '24px', borderRadius: '20px',
        backgroundColor: 'var(--color-surface, #ffffff)',
        border: '1px solid var(--color-border, #f1f5f9)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <RefreshCw className="animate-spin" size={20} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted)' }}>Đang tải lộ trình học cá nhân hóa...</span>
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return null;
  }

  return (
    <div style={{
      borderRadius: '24px',
      backgroundColor: 'var(--color-surface, #ffffff)',
      border: '1.5px solid var(--color-border, #f5ebe1)',
      boxShadow: '0 4px 20px rgba(242, 112, 36, 0.05)',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column', gap: '0',
    }}>
      {/* ── Top Header Bar with Subject Selector ── */}
      <div style={{
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #fff9f6 0%, #ffffff 100%)',
        borderBottom: '1px solid var(--color-border, #f5ebe1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            backgroundColor: 'rgba(242, 112, 36, 0.12)',
            color: 'var(--color-primary, #f27024)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink, #1f1b17)', margin: 0, letterSpacing: '-0.02em' }}>
                EduX – Học tập cá nhân hóa
              </h2>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700,
                backgroundColor: 'rgba(242, 112, 36, 0.12)',
                color: 'var(--color-primary-dark, #a04100)',
                padding: '2px 8px', borderRadius: '9999px', textTransform: 'uppercase'
              }}>
                AI Powered
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted, #545f73)', margin: '2px 0 0' }}>
              Hệ thống tự động phân tích lỗ hổng kiến thức và thiết kế lịch ôn tập 7 ngày riêng cho bạn
            </p>
          </div>
        </div>

        {/* Subject Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-ink-muted)' }}>
            Môn học:
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              style={{
                appearance: 'none',
                backgroundColor: '#ffffff',
                border: '1.5px solid var(--color-border-medium, #e0c0b2)',
                borderRadius: '12px',
                padding: '8px 36px 8px 14px',
                fontSize: '0.875rem', fontWeight: 700,
                color: 'var(--color-ink, #1f1b17)',
                cursor: 'pointer', outline: 'none'
              }}
            >
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} {sub.code ? `(${sub.code})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-ink-soft)' }} />
          </div>
        </div>
      </div>

      {/* ── Error Banner if any ── */}
      {error && (
        <div style={{
          margin: '16px 24px 0', padding: '12px 16px', borderRadius: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#dc2626', fontSize: '0.875rem',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* ── Main Dashboard Content ── */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loadingPlan ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <RefreshCw className="animate-spin" size={28} style={{ color: 'var(--color-primary)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.875rem' }}>Đang phân tích năng lực và tải lịch ôn tập...</p>
          </div>
        ) : (
          <>
            {/* ── 3 Key Stat Cards (Minh họa giao diện) ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px'
            }}>
              {/* 1. Mastery Card */}
              <div style={{
                borderRadius: '18px', padding: '18px 20px',
                backgroundColor: 'var(--color-primary-bg, #fff8f5)',
                border: '1.5px solid var(--color-border, #f5ebe1)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink-muted, #545f73)' }}>
                    Mastery
                  </span>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    backgroundColor: 'rgba(242, 112, 36, 0.15)',
                    color: 'var(--color-primary, #f27024)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Target size={18} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 900, color: metrics.hasActivity ? 'var(--color-primary, #f27024)' : 'var(--color-ink-muted, #94a3b8)', lineHeight: 1 }}>
                    {metrics.hasActivity ? `${metrics.mastery}%` : '0%'}
                  </span>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(0, metrics.mastery))}%`,
                      height: '100%',
                      backgroundColor: metrics.mastery >= 70 ? '#16a34a' : (metrics.mastery >= 50 ? 'var(--color-primary)' : '#94a3b8'),
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-soft, #8c7166)', marginTop: '4px', display: 'block' }}>
                    {metrics.hasActivity ? 'Mức độ làm chủ kiến thức môn học' : 'Chưa có dữ liệu làm bài để tính điểm'}
                  </span>
                </div>
              </div>

              {/* 2. Topic cần ôn Card */}
              <div style={{
                borderRadius: '18px', padding: '18px 20px',
                backgroundColor: 'var(--color-primary-bg, #fff8f5)',
                border: '1.5px solid var(--color-border, #f5ebe1)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink-muted, #545f73)' }}>
                    Topic cần ôn
                  </span>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    backgroundColor: !metrics.hasActivity || metrics.isDefaultTopic ? 'rgba(100, 116, 139, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                    color: !metrics.hasActivity || metrics.isDefaultTopic ? '#64748b' : '#dc2626',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <AlertTriangle size={18} />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-soft, #8c7166)', marginBottom: '2px' }}>
                    {metrics.hasActivity && metrics.weakTopic && !metrics.isDefaultTopic && metrics.weakTopic.accuracy !== null
                      ? `Độ chính xác ${metrics.weakTopic.accuracy}%`
                      : 'Chưa có dữ liệu bài test'}
                  </div>
                  <div style={{
                    fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-ink, #1f1b17)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {metrics.hasActivity && metrics.weakTopic && !metrics.isDefaultTopic
                      ? metrics.weakTopic.topicName
                      : 'Khảo sát năng lực ban đầu'}
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <span style={{
                    fontSize: '0.6875rem', fontWeight: 700,
                    backgroundColor: !metrics.hasActivity || metrics.isDefaultTopic
                      ? '#f1f5f9'
                      : (metrics.weakTopic?.priority === 'high' ? 'rgba(220,38,38,0.1)' : 'rgba(242,112,36,0.1)'),
                    color: !metrics.hasActivity || metrics.isDefaultTopic
                      ? '#64748b'
                      : (metrics.weakTopic?.priority === 'high' ? '#dc2626' : 'var(--color-primary-dark)'),
                    padding: '2px 8px', borderRadius: '4px'
                  }}>
                    {!metrics.hasActivity || metrics.isDefaultTopic
                      ? 'Cần khảo sát'
                      : (metrics.weakTopic?.priority === 'high' ? 'Ưu tiên cao' : 'Cần cải thiện')}
                  </span>
                </div>
              </div>

              {/* 3. Tiến độ tuần Card */}
              <div style={{
                borderRadius: '18px', padding: '18px 20px',
                backgroundColor: 'var(--color-primary-bg, #fff8f5)',
                border: '1.5px solid var(--color-border, #f5ebe1)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-ink-muted, #545f73)' }}>
                    Tiến độ tuần
                  </span>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    backgroundColor: 'rgba(22, 163, 74, 0.12)',
                    color: '#16a34a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Award size={18} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span style={{ fontSize: '2.25rem', fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>
                    {metrics.completedDays}/{metrics.totalDays}
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-ink-muted)' }}>
                    Ngày đã học
                  </span>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(metrics.completedDays / metrics.totalDays) * 100}%`,
                      height: '100%',
                      backgroundColor: '#16a34a',
                      borderRadius: '9999px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-ink-soft, #8c7166)', marginTop: '4px', display: 'block' }}>
                    {studyPlan ? `Bắt đầu từ: ${studyPlan.startsOn}` : 'Chưa có lịch tuần này'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── 7-Day Study Schedule (Lịch ôn tập 7 ngày) ── */}
            <div style={{
              borderRadius: '20px',
              border: '1.5px solid var(--color-border, #f5ebe1)',
              backgroundColor: '#ffffff',
              padding: '20px',
              display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-ink, #1f1b17)', margin: 0 }}>
                    Lịch ôn tập 7 ngày
                  </h3>
                </div>

                {(!studyPlan || !detailedDays.length) && (
                  <button
                    onClick={handleGeneratePlan}
                    disabled={generatingPlan}
                    className="btn btn-primary"
                    style={{
                      padding: '8px 18px', borderRadius: '10px',
                      fontSize: '0.8125rem', fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {generatingPlan ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Đang tạo lịch...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Tạo lịch ôn tập tuần này bằng AI
                      </>
                    )}
                  </button>
                )}
              </div>

              {!studyPlan || !detailedDays.length ? (
                /* Empty state when plan not yet generated */
                <div style={{
                  padding: '36px 20px', textAlign: 'center',
                  backgroundColor: 'var(--color-primary-bg, #fff8f5)',
                  borderRadius: '16px', border: '1.5px dashed var(--color-primary-light, #ffdbcc)'
                }}>
                  <BrainCircuit size={40} style={{ color: 'var(--color-primary)', margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 6px' }}>
                    Chưa có lịch ôn tập cho môn học này
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', maxWidth: '420px', margin: '0 auto 16px', lineHeight: 1.5 }}>
                    Hệ thống sẽ dựa trên các câu flashcard bạn đã làm sai và các chủ đề yếu để xếp lịch 7 ngày ôn tập cá nhân hóa.
                  </p>
                  <button
                    onClick={handleGeneratePlan}
                    disabled={generatingPlan}
                    className="btn btn-primary"
                    style={{
                      padding: '10px 24px', borderRadius: '12px',
                      fontWeight: 700, fontSize: '0.875rem',
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={16} />
                    {generatingPlan ? 'Đang tạo lịch...' : 'Bắt đầu tạo lịch ôn tập'}
                  </button>
                </div>
              ) : (
                /* 7 Days Pills strip */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '8px',
                    overflowX: 'auto', paddingBottom: '4px'
                  }}>
                    {detailedDays.map(d => {
                      const isSelected = d.day === selectedDayNumber;
                      const isDone = d.isCompleted;

                      return (
                        <button
                          key={d.planDayId || d.day}
                          onClick={() => setSelectedDayNumber(d.day)}
                          style={{
                            padding: '12px 6px',
                            borderRadius: '14px',
                            border: `2px solid ${isSelected ? 'var(--color-primary, #f27024)' : (isDone ? 'rgba(22, 163, 74, 0.4)' : 'var(--color-border, #f5ebe1)')}`,
                            backgroundColor: isSelected
                              ? 'var(--color-primary-card, #fcf2eb)'
                              : (isDone ? 'rgba(240, 253, 244, 0.6)' : '#ffffff'),
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 800,
                            color: isSelected ? 'var(--color-primary-dark, #a04100)' : 'var(--color-ink-muted, #545f73)'
                          }}>
                            {d.dayOfWeek || `N${d.day}`}
                          </span>

                          <span style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8125rem', fontWeight: 800,
                            backgroundColor: isDone ? '#16a34a' : (isSelected ? 'var(--color-primary, #f27024)' : '#f1f5f9'),
                            color: (isDone || isSelected) ? '#ffffff' : 'var(--color-ink-muted)'
                          }}>
                            {isDone ? '✓' : d.day}
                          </span>

                          <span style={{
                            fontSize: '0.625rem', fontWeight: 700,
                            color: isDone ? '#16a34a' : 'var(--color-ink-soft)'
                          }}>
                            {isDone ? (d.scorePercent !== null ? `${d.scorePercent}%` : 'Đã học') : 'Chưa học'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ── Selected Day Detail Card (Minh họa giao diện) ── */}
                  {selectedDay && (
                    <div style={{
                      borderRadius: '16px',
                      padding: '20px 24px',
                      backgroundColor: 'var(--color-primary-bg, #fff8f5)',
                      border: '1.5px solid var(--color-border-medium, #e0c0b2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '16px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 800,
                            padding: '2px 8px', borderRadius: '6px',
                            backgroundColor: selectedDay.isCompleted ? '#16a34a' : (selectedDay.activity === 'diagnostic' ? '#6366f1' : 'var(--color-primary)'),
                            color: '#ffffff'
                          }}>
                            {selectedDay.isCompleted
                              ? 'Đã hoàn thành'
                              : (selectedDay.activity === 'diagnostic' ? 'Khảo sát năng lực' : 'Sẵn sàng học')}
                          </span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-soft)' }}>
                            {selectedDay.studyDate} ({selectedDay.dayOfWeek})
                          </span>
                        </div>

                        <h4 style={{
                          fontSize: '1.125rem', fontWeight: 800,
                          color: 'var(--color-ink, #1f1b17)', margin: 0
                        }}>
                          Ngày {selectedDay.day} – {selectedDay.topicName}
                        </h4>

                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted)', margin: 0 }}>
                          {selectedDay.isCompleted ? (
                            <span style={{ fontWeight: 600, color: '#16a34a' }}>
                              {selectedDay.targetQuestions || 5} câu luyện tập AI • Điểm đã lưu: {selectedDay.scorePercent !== null ? `${selectedDay.scorePercent}%` : 'Đã chấm'}
                            </span>
                          ) : (
                            <span>
                              {selectedDay.targetQuestions || 5} câu luyện tập AI • Ước tính: {selectedDay.durationMinutes || 15} phút
                              {selectedDay.reason ? ` • Lý do: ${selectedDay.reason}` : ''}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {selectedDay.isCompleted ? (
                          <button
                            onClick={() => setActiveResultDayId(selectedDay.planDayId)}
                            className="btn btn-secondary"
                            style={{
                              padding: '10px 20px', borderRadius: '12px',
                              fontWeight: 700, fontSize: '0.875rem',
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              cursor: 'pointer', backgroundColor: '#ffffff',
                              border: '1.5px solid var(--color-border-medium)'
                            }}
                          >
                            <Award size={16} style={{ color: 'var(--color-primary)' }} />
                            Xem lại kết quả
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveQuizDayId(selectedDay.planDayId)}
                            className="btn btn-primary"
                            style={{
                              padding: '10px 22px', borderRadius: '12px',
                              fontWeight: 700, fontSize: '0.875rem',
                              display: 'inline-flex', alignItems: 'center', gap: '8px',
                              cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(242, 112, 36, 0.25)'
                            }}
                          >
                            <BrainCircuit size={16} />
                            Bắt đầu học ngay
                            <ArrowRight size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Topic Analytics Accordion / Grid (Biểu đồ năng lực từng Topic) ── */}
            <div style={{
              borderRadius: '20px',
              border: '1px solid var(--color-border, #f5ebe1)',
              backgroundColor: '#ffffff',
              padding: '18px 22px',
              display: 'flex', flexDirection: 'column', gap: '14px'
            }}>
              <div
                onClick={() => setShowTopicDetails(prev => !prev)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <BarChart2 size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-ink, #1f1b17)', margin: 0 }}>
                    Năng lực chi tiết theo từng Topic ({topicsPerf?.length || 0})
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                  {showTopicDetails ? 'Thu gọn' : 'Xem chi tiết'}
                  <ChevronRight size={16} style={{ transform: showTopicDetails ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }} />
                </div>
              </div>

              {showTopicDetails && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '12px', marginTop: '6px'
                }}>

                  {topicsPerf?.map(topic => {
                    const totalAttempts = Number(topic.totalAttempts ?? 0);
                    const totalAnswered = Number(topic.totalAnswered ?? 0);
                    const hasData = totalAttempts > 0 || totalAnswered > 0;

                    const isWeak =
                      topic.needsReview ||
                      topic.priority === 'high' ||
                      topic.priority === 'medium';

                    // Không tự mặc định Mastery thành 50% khi chưa có dữ liệu
                    const mastery = topic.masteryEstimate ?? 0;

                    const status = !hasData
                      ? 'Chưa học'
                      : topic.priority === 'high'
                        ? 'Cần ôn gấp'
                        : topic.priority === 'medium'
                          ? 'Cần cải thiện'
                          : topic.masteryEstimate == null
                            ? 'Chưa đủ dữ liệu'
                            : 'Nắm vững';

                    const statusStyle = !hasData || topic.masteryEstimate == null
                      ? {
                        backgroundColor: '#f1f5f9',
                        color: '#64748b'
                      }
                      : topic.priority === 'high'
                        ? {
                          backgroundColor: 'rgba(220,38,38,0.1)',
                          color: '#dc2626'
                        }
                        : topic.priority === 'medium'
                          ? {
                            backgroundColor: 'rgba(242,112,36,0.12)',
                            color: 'var(--color-primary-dark)'
                          }
                          : {
                            backgroundColor: 'rgba(22,163,74,0.1)',
                            color: '#16a34a'
                          };
                    return (
                      <div
                        key={topic.topicId}
                        style={{
                          padding: '14px 16px', borderRadius: '14px',
                          border: `1.5px solid ${isWeak ? 'rgba(242, 112, 36, 0.3)' : 'var(--color-border, #f5ebe1)'}`,
                          backgroundColor: isWeak ? 'var(--color-primary-bg, #fff8f5)' : '#ffffff',
                          display: 'flex', flexDirection: 'column', gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-ink)' }}>
                            {topic.topicName}
                          </span>

                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              ...statusStyle
                            }}
                          >
                            {status}
                          </span>

                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginBottom: '3px' }}>
                            <span>Mastery: {topic.masteryEstimate !== null ? `${topic.masteryEstimate}%` : 'Chưa đủ dữ liệu'}</span>
                            <span>Độ chính xác: {topic.accuracy !== null ? `${topic.accuracy}%` : '—'}</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(100, Math.max(0, mastery))}%`,
                              height: '100%',
                              backgroundColor: mastery >= 70 ? '#16a34a' : (mastery >= 50 ? 'var(--color-primary)' : '#dc2626'),
                              borderRadius: '9999px'
                            }} />
                          </div>
                        </div>

                        {/* Attempts & Trend */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--color-ink-soft)' }}>
                          <span>{topic.totalAttempts || 0} câu đã làm ({topic.correctAnswers || 0} đúng)</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {topic.trend === 'improving' ? (
                              <><TrendingUp size={12} color="#16a34a" /> Tiến bộ</>
                            ) : topic.trend === 'declining' ? (
                              <><TrendingDown size={12} color="#dc2626" /> Giảm sút</>
                            ) : (
                              <><Minus size={12} color="#64748b" /> Ổn định</>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── AI Practice Quiz Modal ── */}
      {activeQuizDayId && (
        <StudyQuizModal
          planDayId={activeQuizDayId}
          dayInfo={selectedDay}
          onClose={() => setActiveQuizDayId(null)}
          onSubmitted={() => {
            // Reload plan after quiz submission to update progress
            loadLearningData(selectedSubjectId);
          }}
        />
      )}

      {/* ── Review Submitted Result Modal ── */}
      {activeResultDayId && (
        <StudyResultModal
          planDayId={activeResultDayId}
          dayInfo={selectedDay}
          onClose={() => setActiveResultDayId(null)}
        />
      )}
    </div>
  );
}

