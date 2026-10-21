import React, { useState, useEffect } from 'react';
import LearningService from '../../services/learning.service';
import MathText from '../common/MathText';
import {
  X, Sparkles, AlertTriangle, CheckCircle2,
  XCircle, Clock, BookOpen, Send, RefreshCw,
  HelpCircle, Award, BrainCircuit, ArrowRight
} from 'lucide-react';

export default function StudyQuizModal({ planDayId, dayInfo, onClose, onSubmitted }) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  const [dayData, setDayData] = useState(null);
  const [answers, setAnswers] = useState({}); // { [questionId]: 'A' | 'B' | 'C' | 'D' }
  const [submissionResult, setSubmissionResult] = useState(null);

  // 1. Fetch study day details on load
  const loadDay = async () => {
    try {
      setLoading(true);
      setError(null);
      setWarning(null);

      const res = await LearningService.getStudyPlanDay(planDayId);
      const data = res.data;
      setDayData(data);

      // If already submitted, fetch results directly to prevent re-submission
      if (data.submitted) {
        const resultRes = await LearningService.getStudyPlanDayResult(planDayId);
        setSubmissionResult(resultRes.data);
      } else if (data.contentStatus === 'unavailable') {
        setWarning('Chủ đề này hiện chưa có đủ học liệu flashcard trong hệ thống để AI tạo câu hỏi.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Không thể tải thông tin buổi học. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (planDayId) {
      loadDay();
    }
  }, [planDayId]);

  // 2. Trigger Gemini AI to generate questions for this day
  const handleGenerateQuestions = async () => {
    try {
      setGenerating(true);
      setError(null);
      setWarning(null);

      const res = await LearningService.generateStudyPlanDay(planDayId);
      const data = res.data;

      if (data.contentStatus === 'unavailable') {
        setWarning('Chủ đề này hiện chưa có đủ học liệu flashcard trong hệ thống để AI tạo câu hỏi.');
      }

      // Reload day to get fresh questions
      await loadDay();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Không thể tạo câu hỏi từ AI. Vui lòng thử lại sau.'
      );
    } finally {
      setGenerating(false);
    }
  };

  // 3. Select an answer
  const handleSelectOption = (questionId, key) => {
    if (dayData?.submitted || submissionResult) return; // Prevent selection after submission
    setAnswers(prev => ({
      ...prev,
      [questionId]: key
    }));
  };

  // 4. Submit answers
  const handleSubmit = async () => {
    const questions = dayData?.questions || [];
    if (!questions.length) return;

    // Check if all questions are answered
    const unanswered = questions.some(q => !answers[q.id || q.questionId]);
    if (unanswered) {
      if (!window.confirm('Bạn vẫn còn câu hỏi chưa chọn đáp án. Bạn có chắc chắn muốn nộp bài ngay bây giờ?')) {
        return;
      }
    }

    const payload = questions.map(q => {
      const qId = q.id || q.questionId;
      return {
        questionId: qId,
        selectedAnswer: answers[qId] || 'A' // fallback if user confirmed
      };
    });

    try {
      setSubmitting(true);
      setError(null);

      const res = await LearningService.submitStudyPlanDay(planDayId, payload);
      setSubmissionResult(res.data);
      if (onSubmitted) {
        onSubmitted(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg === 'STUDY_DAY_ALREADY_SUBMITTED') {
        setError('Bài học này đã được nộp trước đó. Đang tải kết quả...');
        const resultRes = await LearningService.getStudyPlanDayResult(planDayId);
        setSubmissionResult(resultRes.data);
      } else {
        setError(msg || 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const questions = dayData?.questions || [];
  const answeredCount = questions.filter(q => Boolean(answers[q.id || q.questionId])).length;
  const isAllAnswered = questions.length > 0 && answeredCount === questions.length;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface, #ffffff)',
        borderRadius: '24px',
        maxWidth: '820px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--color-border, #f1f5f9)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border, #e2e8f0)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #fff8f5 0%, #ffffff 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              backgroundColor: 'rgba(242, 112, 36, 0.12)',
              color: 'var(--color-primary, #f27024)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BrainCircuit size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: '6px',
                  backgroundColor: 'var(--color-primary-card, #fcf2eb)',
                  color: 'var(--color-primary-dark, #a04100)'
                }}>
                  {dayData?.day ? `Ngày ${dayData.day}` : 'Buổi học'}
                </span>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-ink, #0f172a)', margin: 0 }}>
                  {dayData?.topicName || dayInfo?.topicName || 'Luyện tập AI'}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8125rem', color: 'var(--color-ink-muted, #64748b)', marginTop: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BookOpen size={13} /> {questions.length} câu hỏi
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} /> ~15 phút
                </span>
                {submissionResult && (
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, color: '#16a34a',
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    <CheckCircle2 size={13} /> Đã hoàn thành ({submissionResult.scorePercent}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--color-ink-muted, #94a3b8)', padding: '6px',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <RefreshCw className="animate-spin" size={36} style={{ color: 'var(--color-primary, #f27024)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--color-ink-muted, #64748b)', fontSize: '0.9375rem' }}>Đang tải bài học...</p>
            </div>
          ) : generating ? (
            /* Gemini Generation Loading State */
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              backgroundColor: 'var(--color-primary-bg, #fff8f5)',
              borderRadius: '20px', border: '1.5px dashed var(--color-primary-light, #ffdbcc)'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                backgroundColor: '#ffffff', boxShadow: '0 8px 24px rgba(242, 112, 36, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', color: 'var(--color-primary, #f27024)'
              }}>
                <Sparkles size={32} className="animate-pulse" />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary-dark, #a04100)', margin: '0 0 8px' }}>
                Gemini AI đang sinh câu hỏi...
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted, #64748b)', maxWidth: '460px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                Hệ thống đang đối chiếu kiến thức và tự động tạo ra 5 câu trắc nghiệm cá nhân hoá cùng công thức toán học chuẩn xác cho bạn. Quá trình này có thể mất vài giây.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary, #f27024)' }}>
                <RefreshCw size={16} className="animate-spin" /> Vui lòng chờ trong giây lát...
              </div>
            </div>
          ) : submissionResult ? (
            /* Results View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                borderRadius: '20px', padding: '24px',
                background: submissionResult.scorePercent >= 70
                  ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                  : submissionResult.scorePercent >= 50
                    ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                    : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '16px',
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                    Kết quả đã lưu
                  </span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1, marginTop: '4px' }}>
                    {submissionResult.scorePercent}%
                  </div>
                  <p style={{ fontSize: '0.875rem', margin: '6px 0 0', opacity: 0.95 }}>
                    Đúng {submissionResult.correctAnswers}/{submissionResult.totalQuestions} câu • Bài học này đã hoàn thành và điểm số đã được lưu.
                  </p>
                </div>

                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: '10px 18px', borderRadius: '12px',
                  fontSize: '0.8125rem', fontWeight: 700
                }}>
                  Không thể nộp lại
                </div>
              </div>

              {/* Review Questions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink, #0f172a)', margin: 0 }}>
                  Xem lại lời giải chi tiết
                </h3>

                {submissionResult.results?.map((q, idx) => {
                  let options = q.options;
                  if (typeof options === 'string') {
                    try { options = JSON.parse(options); } catch { options = []; }
                  }

                  return (
                    <div
                      key={q.questionId || idx}
                      style={{
                        padding: '16px 18px', borderRadius: '14px',
                        border: `1.5px solid ${q.isCorrect ? 'rgba(22, 163, 74, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        backgroundColor: q.isCorrect ? 'rgba(240, 253, 244, 0.5)' : 'rgba(254, 242, 242, 0.5)',
                        display: 'flex', flexDirection: 'column', gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px',
                            backgroundColor: q.isCorrect ? '#16a34a' : '#ef4444', color: '#ffffff', flexShrink: 0
                          }}>
                            Câu {q.questionOrder || idx + 1}
                          </span>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-ink, #1e293b)' }}>
                            <MathText content={q.question} />
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.8125rem', fontWeight: 700,
                          color: q.isCorrect ? '#16a34a' : '#ef4444', flexShrink: 0
                        }}>
                          {q.isCorrect ? '✓ Đúng' : '✗ Sai'}
                        </span>
                      </div>

                      {/* Options */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                        {Array.isArray(options) && options.map(opt => {
                          const isCorrectOpt = q.correctAnswer === opt.key;
                          const isSelected = q.selectedAnswer === opt.key;

                          let bg = '#ffffff';
                          let borderColor = 'var(--color-border, #e2e8f0)';
                          let textColor = 'var(--color-ink, #1e293b)';

                          if (isCorrectOpt) {
                            bg = 'rgba(22, 163, 74, 0.12)';
                            borderColor = '#16a34a';
                            textColor = '#15803d';
                          } else if (isSelected && !q.isCorrect) {
                            bg = 'rgba(239, 68, 68, 0.12)';
                            borderColor = '#ef4444';
                            textColor = '#b91c1c';
                          }

                          return (
                            <div
                              key={opt.key}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '8px 12px', borderRadius: '8px',
                                border: `1.5px solid ${borderColor}`,
                                backgroundColor: bg, color: textColor, fontSize: '0.875rem'
                              }}
                            >
                              <span style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
                                backgroundColor: isCorrectOpt ? '#16a34a' : (isSelected ? '#ef4444' : '#f1f5f9'),
                                color: (isCorrectOpt || isSelected) ? '#ffffff' : '#64748b'
                              }}>
                                {opt.key}
                              </span>
                              <div style={{ flex: 1, fontWeight: isCorrectOpt || isSelected ? 600 : 400 }}>
                                <MathText content={opt.text} />
                              </div>
                              {isCorrectOpt && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>(Đáp án đúng)</span>}
                              {isSelected && !isCorrectOpt && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>(Bạn đã chọn)</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div style={{
                          marginTop: '4px', padding: '10px 12px', borderRadius: '8px',
                          backgroundColor: '#ffffff', border: '1px solid var(--color-border, #e2e8f0)',
                          fontSize: '0.8125rem', color: 'var(--color-ink-muted, #475569)'
                        }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-primary-dark, #a04100)', marginBottom: '3px' }}>
                            💡 Lời giải chi tiết:
                          </div>
                          <MathText content={q.explanation} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : questions.length === 0 ? (
            /* Day Not Generated Yet */
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              backgroundColor: 'var(--color-primary-bg, #fff8f5)',
              borderRadius: '20px', border: '1.5px dashed var(--color-primary-light, #ffdbcc)'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                backgroundColor: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: 'var(--color-primary, #f27024)'
              }}>
                <BrainCircuit size={28} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-ink, #0f172a)', margin: '0 0 6px' }}>
                Buổi học chưa có bộ câu hỏi
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-ink-muted, #64748b)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.6 }}>
                Hệ thống AI sẽ tạo bộ 5 câu hỏi ôn tập dựa trên các lỗi bạn thường gặp trong chủ đề <strong>{dayData?.topicName}</strong>.
              </p>

              {warning && (
                <div style={{
                  marginBottom: '20px', padding: '12px 16px', borderRadius: '12px',
                  backgroundColor: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.25)',
                  color: '#c2410c', fontSize: '0.875rem', textAlign: 'left',
                  display: 'flex', alignItems: 'flex-start', gap: '10px'
                }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{warning}</div>
                </div>
              )}

              <button
                onClick={handleGenerateQuestions}
                disabled={generating}
                className="btn btn-primary"
                style={{
                  padding: '12px 28px', borderRadius: '14px',
                  fontSize: '0.9375rem', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', boxShadow: '0 8px 20px rgba(242, 112, 36, 0.25)'
                }}
              >
                <Sparkles size={18} />
                Tạo 5 câu luyện tập AI ngay
              </button>
            </div>
          ) : (
            /* Quiz Active: Taking the Quiz */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                <div style={{
                  padding: '12px 16px', borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#dc2626', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <AlertTriangle size={18} /> {error}
                </div>
              )}

              {/* Progress counter */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 18px', borderRadius: '14px',
                backgroundColor: 'var(--color-primary-card, #fcf2eb)',
                border: '1px solid var(--color-border, #f5ebe1)'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary-dark, #a04100)' }}>
                  Tiến độ làm bài: {answeredCount}/{questions.length} câu
                </div>
                <div style={{
                  width: '140px', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%`,
                    height: '100%', backgroundColor: 'var(--color-primary, #f27024)',
                    borderRadius: '9999px', transition: 'width 0.2s ease'
                  }} />
                </div>
              </div>

              {/* Question list */}
              {questions.map((q, qIndex) => {
                const qId = q.id || q.questionId;
                let options = q.options;
                if (typeof options === 'string') {
                  try { options = JSON.parse(options); } catch { options = []; }
                }

                const selectedKey = answers[qId];

                return (
                  <div
                    key={qId || qIndex}
                    style={{
                      padding: '20px', borderRadius: '18px',
                      border: '1px solid var(--color-border, #e2e8f0)',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex', flexDirection: 'column', gap: '14px'
                    }}
                  >
                    {/* Question Title */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        backgroundColor: selectedKey ? 'var(--color-primary, #f27024)' : '#f1f5f9',
                        color: selectedKey ? '#ffffff' : '#64748b',
                        fontWeight: 800, fontSize: '0.8125rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {q.questionOrder || qIndex + 1}
                      </span>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-ink, #0f172a)', lineHeight: 1.6, flex: 1 }}>
                        <MathText content={q.question} />
                      </div>
                    </div>

                    {/* Options list */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      {Array.isArray(options) && options.map(opt => {
                        const isChosen = selectedKey === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => handleSelectOption(qId, opt.key)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px',
                              padding: '12px 16px', borderRadius: '12px',
                              border: `1.5px solid ${isChosen ? 'var(--color-primary, #f27024)' : 'var(--color-border, #e2e8f0)'}`,
                              backgroundColor: isChosen ? 'var(--color-primary-bg, #fff8f5)' : '#ffffff',
                              color: isChosen ? 'var(--color-primary-dark, #a04100)' : 'var(--color-ink, #1e293b)',
                              fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              border: `2px solid ${isChosen ? 'var(--color-primary, #f27024)' : '#cbd5e1'}`,
                              backgroundColor: isChosen ? 'var(--color-primary, #f27024)' : '#ffffff',
                              color: isChosen ? '#ffffff' : '#64748b',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                            }}>
                              {opt.key}
                            </span>
                            <div style={{ flex: 1, fontWeight: isChosen ? 600 : 400 }}>
                              <MathText content={opt.text} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-border, #e2e8f0)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: '#fafaf9'
        }}>
          <div>
            {!submissionResult && questions.length > 0 && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-ink-muted, #64748b)' }}>
                {isAllAnswered ? 'Đã hoàn thành tất cả các câu!' : `Còn ${questions.length - answeredCount} câu chưa chọn`}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{
                padding: '10px 20px', borderRadius: '12px',
                fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer'
              }}
            >
              {submissionResult ? 'Đóng' : 'Để sau'}
            </button>

            {!submissionResult && questions.length > 0 && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  padding: '10px 24px', borderRadius: '12px',
                  fontWeight: 700, fontSize: '0.875rem',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(242, 112, 36, 0.25)'
                }}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Đang chấm điểm...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Nộp bài
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

