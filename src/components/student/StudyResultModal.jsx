import React, { useState, useEffect } from 'react';
import LearningService from '../../services/learning.service';
import MathText from '../common/MathText';
import {
  X, CheckCircle2, XCircle, Award, Calendar,
  HelpCircle, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';

export default function StudyResultModal({ planDayId, dayInfo, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchResult() {
      try {
        setLoading(true);
        setError(null);
        const res = await LearningService.getStudyPlanDayResult(planDayId);
        if (!cancelled) {
          setResultData(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
            'Không thể tải kết quả bài làm. Vui lòng thử lại.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (planDayId) {
      fetchResult();
    }

    return () => { cancelled = true; };
  }, [planDayId]);

  if (!planDayId) return null;

  const score = resultData?.scorePercent ?? 0;
  const isHigh = score >= 70;
  const isMedium = score >= 50 && score < 70;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', overflowY: 'auto',
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface, #ffffff)',
        borderRadius: '24px',
        maxWidth: '760px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--color-border, #f1f5f9)',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border, #e2e8f0)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #fff8f5 0%, #ffffff 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              backgroundColor: isHigh ? 'rgba(22, 163, 74, 0.12)' : 'rgba(242, 112, 36, 0.12)',
              color: isHigh ? '#16a34a' : 'var(--color-primary, #f27024)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Award size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-ink, #0f172a)', margin: 0 }}>
                Kết quả bài ôn tập: {dayInfo?.topicName || 'Chi tiết buổi học'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8125rem', color: 'var(--color-ink-muted, #64748b)', marginTop: '2px' }}>
                {dayInfo?.day && <span>Ngày {dayInfo.day}</span>}
                {resultData?.submittedAt && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    {new Date(resultData.submittedAt).toLocaleDateString('vi-VN')} {new Date(resultData.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <RefreshCw className="animate-spin" size={36} style={{ color: 'var(--color-primary, #f27024)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--color-ink-muted, #64748b)', fontSize: '0.9375rem' }}>Đang tải kết quả bài làm...</p>
            </div>
          ) : error ? (
            <div style={{
              padding: '24px', borderRadius: '16px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              textAlign: 'center', color: '#dc2626'
            }}>
              <AlertCircle size={32} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontWeight: 600 }}>{error}</p>
            </div>
          ) : resultData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Score Banner */}
              <div style={{
                borderRadius: '20px',
                padding: '24px',
                background: isHigh
                  ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                  : isMedium
                    ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                    : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '16px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
              }}>
                <div>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', opacity: 0.9,
                    display: 'inline-flex', alignItems: 'center', gap: '4px'
                  }}>
                    <Sparkles size={14} /> Điểm tổng kết
                  </span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1, marginTop: '4px' }}>
                    {score}%
                  </div>
                  <p style={{ fontSize: '0.875rem', margin: '6px 0 0', opacity: 0.95 }}>
                    {isHigh ? 'Làm bài rất tốt! Bạn đã nắm chắc chủ đề này.' : isMedium ? 'Kết quả khá tốt! Hãy chú ý các câu sai bên dưới.' : 'Cần ôn luyện thêm về chủ đề này để cải thiện kết quả!'}
                  </p>
                </div>

                <div style={{
                  display: 'flex', gap: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  padding: '12px 20px', borderRadius: '16px',
                  backdropFilter: 'blur(4px)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{resultData.correctAnswers}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Đúng</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{resultData.incorrectAnswers}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Sai</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{resultData.totalQuestions}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Tổng số câu</div>
                  </div>
                </div>
              </div>

              {/* Questions Review */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-ink, #0f172a)', margin: 0 }}>
                  Chi tiết từng câu hỏi ({resultData.results?.length || 0})
                </h3>

                {resultData.results?.map((q, idx) => {
                  let options = q.options;
                  if (typeof options === 'string') {
                    try { options = JSON.parse(options); } catch { options = []; }
                  }

                  return (
                    <div
                      key={q.questionId || idx}
                      style={{
                        padding: '18px 20px',
                        borderRadius: '16px',
                        border: `1.5px solid ${q.isCorrect ? 'rgba(22, 163, 74, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        backgroundColor: q.isCorrect ? 'rgba(240, 253, 244, 0.5)' : 'rgba(254, 242, 242, 0.5)',
                        display: 'flex', flexDirection: 'column', gap: '12px',
                      }}
                    >
                      {/* Question Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                          <span style={{
                            fontSize: '0.8125rem', fontWeight: 800,
                            padding: '2px 8px', borderRadius: '6px',
                            backgroundColor: q.isCorrect ? '#16a34a' : '#ef4444',
                            color: '#ffffff', flexShrink: 0, marginTop: '2px'
                          }}>
                            Câu {q.questionOrder || idx + 1}
                          </span>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-ink, #1e293b)', lineHeight: 1.5 }}>
                            <MathText content={q.question} />
                          </div>
                        </div>

                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          fontSize: '0.8125rem', fontWeight: 700,
                          color: q.isCorrect ? '#16a34a' : '#ef4444',
                          flexShrink: 0
                        }}>
                          {q.isCorrect ? (
                            <>
                              <CheckCircle2 size={18} /> Đúng
                            </>
                          ) : (
                            <>
                              <XCircle size={18} /> Sai
                            </>
                          )}
                        </div>
                      </div>

                      {/* Options */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '4px' }}>
                        {Array.isArray(options) && options.map((opt) => {
                          const isSelected = q.selectedAnswer === opt.key;
                          const isCorrectOpt = q.correctAnswer === opt.key;

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
                                padding: '10px 14px', borderRadius: '10px',
                                border: `1.5px solid ${borderColor}`,
                                backgroundColor: bg,
                                color: textColor,
                                fontSize: '0.875rem',
                              }}
                            >
                              <span style={{
                                width: '26px', height: '26px', borderRadius: '50%',
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
                              {isCorrectOpt && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
                                  (Đáp án đúng)
                                </span>
                              )}
                              {isSelected && !isCorrectOpt && (
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>
                                  (Bạn đã chọn)
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div style={{
                          marginTop: '6px',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--color-border, #e2e8f0)',
                          fontSize: '0.8125rem',
                          color: 'var(--color-ink-muted, #475569)',
                        }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontWeight: 700, color: 'var(--color-primary-dark, #a04100)',
                            marginBottom: '4px'
                          }}>
                            <HelpCircle size={14} />
                            Giải thích chi tiết:
                          </div>
                          <div style={{ lineHeight: 1.6 }}>
                            <MathText content={q.explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-border, #e2e8f0)',
          display: 'flex', justifyContent: 'flex-end',
          backgroundColor: '#fafaf9'
        }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{
              padding: '8px 20px', borderRadius: '12px',
              fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

