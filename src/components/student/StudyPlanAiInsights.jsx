import React, { useState, useEffect } from 'react';
import LearningService from '../../services/learning.service';
import {
  Sparkles,
  BrainCircuit,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function StudyPlanAiInsights({
  planId,
  selectedDayNumber,
  selectedDayDetail,
  onRefresh,
}) {
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  // Day feedback state
  const [dayFeedback, setDayFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Reset khi planId hoặc ngày học thay đổi
  useEffect(() => {
    setDayFeedback(null);
    setFeedbackError(null);
  }, [selectedDayDetail?.planDayId]);

  useEffect(() => {
    setInsights(null);
    setInsightsError(null);
    setShowInsights(false);
  }, [planId]);

  async function handleLoadInsights() {
    if (!planId) return;
    setLoadingInsights(true);
    setInsightsError(null);
    try {
      const res = await LearningService.getStudyPlanAiInsights(planId);
      if (res?.success && res?.data) {
        setInsights(res.data);
        setShowInsights(true);
      } else {
        setInsightsError('Không tải được gợi ý học tập.');
      }
    } catch (err) {
      console.warn('Load AI insights error:', err);
      setInsightsError(err.response?.data?.message || 'Không thể kết nối đến trợ lý học tập AI.');
    } finally {
      setLoadingInsights(false);
    }
  }

  async function handleLoadDayFeedback(planDayId) {
    if (!planDayId) return;
    setLoadingFeedback(true);
    setFeedbackError(null);
    try {
      const res = await LearningService.getStudyPlanDayAiFeedback(planDayId);
      if (res?.success && res?.data) {
        setDayFeedback(res.data);
        setShowFeedbackModal(true);
      } else {
        setFeedbackError('Chưa có nhận xét cho ngày học này.');
      }
    } catch (err) {
      console.warn('Load day AI feedback error:', err);
      setFeedbackError(err.response?.data?.message || 'Chưa thể tải nhận xét bài làm.');
    } finally {
      setLoadingFeedback(false);
    }
  }

  if (!planId) return null;

  const currentDayInsight = insights?.dayInsights?.find(
    (d) => d.day === selectedDayNumber
  );

  const isDaySubmitted = selectedDayDetail?.isCompleted || selectedDayDetail?.submitted;

  return (
    <div
      style={{
        borderRadius: '16px',
        border: '1.5px solid var(--color-border, #f5ebe1)',
        backgroundColor: '#ffffff',
        padding: '18px 20px',
        marginTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: 'rgba(242, 112, 36, 0.12)',
              color: 'var(--color-primary, #f27024)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h4
              style={{
                fontSize: '0.9375rem',
                fontWeight: 800,
                color: 'var(--color-ink, #1f1b17)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Trợ lý học tập AI (Learning Coach)
              {insights && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor:
                      insights.source === 'gemini'
                        ? 'rgba(242, 112, 36, 0.12)'
                        : '#f1f5f9',
                    color:
                      insights.source === 'gemini'
                        ? 'var(--color-primary, #f27024)'
                        : '#64748b',
                  }}
                >
                  {insights.source === 'gemini' ? 'Gemini AI' : 'Gợi ý chuẩn'}
                </span>
              )}
            </h4>
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-ink-muted, #545f73)',
                margin: '2px 0 0',
              }}
            >
              Giải thích lộ trình 7 ngày và gợi ý các bước học hiệu quả
            </p>
          </div>
        </div>

        {/* CTA Xem gợi ý */}
        {!showInsights ? (
          <button
            onClick={handleLoadInsights}
            disabled={loadingInsights}
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              backgroundColor: 'var(--color-primary, #f27024)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {loadingInsights ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <Lightbulb size={14} />
                Xem giải thích AI
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setShowInsights(false)}
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            Thu gọn <ChevronUp size={14} />
          </button>
        )}
      </div>

      {/* Error state */}
      {insightsError && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#dc2626',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} /> {insightsError}
        </div>
      )}

      {/* Body: Plan summary & Day guidance */}
      {showInsights && insights && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Tóm tắt toàn bộ kế hoạch 7 ngày */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-primary-bg, #fff8f5)',
              border: '1px solid var(--color-border, #f5ebe1)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'var(--color-primary-dark, #a04100)',
                textTransform: 'uppercase',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <BrainCircuit size={14} /> Tóm tắt kế hoạch 7 ngày
            </div>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-ink, #1f1b17)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {insights.summary}
            </p>
          </div>

          {/* Hướng dẫn chi tiết cho ngày đang chọn */}
          {currentDayInsight ? (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1.5px solid var(--color-border, #f5ebe1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    color: 'var(--color-primary, #f27024)',
                  }}
                >
                  Gợi ý ngày {selectedDayNumber}: {selectedDayDetail?.topicName || ''}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--color-ink-muted, #545f73)',
                  }}
                >
                  {selectedDayDetail?.durationMinutes} phút • {selectedDayDetail?.targetQuestions} câu
                </span>
              </div>

              {/* Lý do xếp lịch */}
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-ink, #1f1b17)',
                  margin: 0,
                  fontStyle: 'italic',
                }}
              >
                "{currentDayInsight.why}"
              </p>

              {/* Các bước học cụ thể */}
              {Array.isArray(currentDayInsight.steps) && currentDayInsight.steps.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--color-ink-muted, #545f73)',
                    }}
                  >
                    Các bước học đề xuất:
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      marginTop: '6px',
                    }}
                  >
                    {currentDayInsight.steps.map((step, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                          fontSize: '0.8125rem',
                          color: 'var(--color-ink, #1f1b17)',
                        }}
                      >
                        <span
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#f1f5f9',
                            color: 'var(--color-ink-muted, #545f73)',
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-ink-muted, #545f73)',
                margin: 0,
              }}
            >
              Chọn một ngày trong lịch 7 ngày để xem hướng dẫn chi tiết.
            </p>
          )}

          {/* Phản hồi sau nộp bài (chỉ hiển thị khi ngày đã hoàn thành) */}
          {isDaySubmitted && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(22, 163, 74, 0.06)',
                border: '1px solid rgba(22, 163, 74, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} style={{ color: '#16a34a' }} />
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 800,
                      color: '#16a34a',
                    }}
                  >
                    Ngày học đã hoàn thành
                  </span>
                </div>

                {!dayFeedback && (
                  <button
                    onClick={() => handleLoadDayFeedback(selectedDayDetail?.planDayId)}
                    disabled={loadingFeedback}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {loadingFeedback ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        Đang lấy nhận xét...
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        Nhận xét bài làm
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Feedback inline */}
              {dayFeedback && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginTop: '4px',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--color-ink, #1f1b17)',
                      margin: 0,
                    }}
                  >
                    <strong>Đánh giá:</strong> {dayFeedback.whatWentWell}
                  </p>
                  {Array.isArray(dayFeedback.nextSteps) && dayFeedback.nextSteps.length > 0 && (
                    <div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#15803d',
                        }}
                      >
                        Khuyến nghị tiếp theo:
                      </span>
                      <ul
                        style={{
                          margin: '4px 0 0',
                          paddingLeft: '18px',
                          fontSize: '0.8125rem',
                          color: 'var(--color-ink, #1f1b17)',
                        }}
                      >
                        {dayFeedback.nextSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
