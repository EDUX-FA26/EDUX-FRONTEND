import React, { useState, useEffect, useRef } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { askAiChat } from '../../services/aiChat.service';
import { useSchool } from '../../contexts/SchoolContext';

const suggestions = ['Bài tập sắp đến hạn?', 'Thông báo mới có gì?', 'Học kỳ hiện tại là gì?'];

export default function AIChatBox() {
  const { activeSchool } = useSchool();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Chào bạn! Mình có thể tra lớp, học kỳ, bài tập, thông báo và flashcard.' },
  ]);

  const currentSchoolIdRef = useRef(activeSchool?.id);
  const abortControllerRef = useRef(null);

  // Reset cuộc hội thoại & hủy các request đang bay khi chuyển trường để ngăn rò rỉ và Race Condition
  useEffect(() => {
    currentSchoolIdRef.current = activeSchool?.id;

    // Hủy request của trường cũ đang dở dang
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setLoading(false);
    setMessages([
      { role: 'assistant', text: 'Chào bạn! Mình có thể tra lớp, học kỳ, bài tập, thông báo và flashcard.' },
    ]);
  }, [activeSchool?.id]);

  const send = async (value = message) => {
    const text = value.trim();
    if (!text || loading) return;

    const requestSchoolId = activeSchool?.id;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessage('');
    setMessages((items) => [...items, { role: 'user', text }]);
    setLoading(true);

    try {
      const result = await askAiChat(text, { signal: controller.signal });
      // Kiểm tra race condition: Chỉ cập nhật nếu người dùng vẫn đang ở đúng trường đã gửi request
      if (currentSchoolIdRef.current === requestSchoolId) {
        setMessages((items) => [
          ...items,
          { role: 'assistant', text: result.answer || 'Mình chưa tìm thấy thông tin phù hợp.' },
        ]);
      }
    } catch (error) {
      // Bỏ qua lỗi do chủ động hủy request khi chuyển trường
      if (error?.name === 'CanceledError' || error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
        return;
      }
      if (currentSchoolIdRef.current === requestSchoolId) {
        setMessages((items) => [
          ...items,
          { role: 'assistant', text: error.response?.data?.message || 'Không thể kết nối trợ lý. Vui lòng thử lại.' },
        ]);
      }
    } finally {
      if (currentSchoolIdRef.current === requestSchoolId) {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 120, fontFamily: 'var(--font-sans)' }}>
      {open && (
        <section aria-label="EDUX AI Assistant" style={{ width: 360, maxWidth: 'calc(100vw - 32px)', height: 480, marginBottom: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 18, boxShadow: '0 16px 44px rgba(30, 20, 10, .18)' }}>
          <header style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'white', background: 'var(--color-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Bot size={19} /><strong>EDUX AI</strong></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" style={{ color: 'white', background: 'transparent', border: 0, cursor: 'pointer' }}><X size={18} /></button>
          </header>
          <div style={{ flex: 1, padding: 14, overflowY: 'auto', background: 'var(--color-primary-bg)' }}>
            {messages.map((item, index) => (
              <div key={`${item.role}-${index}`} style={{ display: 'flex', justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
                <div style={{ maxWidth: '84%', padding: '9px 11px', borderRadius: 12, whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.45, color: item.role === 'user' ? 'white' : 'var(--color-ink)', background: item.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface)', border: item.role === 'user' ? 0 : '1px solid var(--color-border)' }}>{item.text}</div>
              </div>
            ))}
            {loading && <div style={{ color: 'var(--color-ink-muted)', fontSize: 12 }}>Đang tra cứu...</div>}
            {messages.length === 1 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>{suggestions.map((item) => <button key={item} type="button" onClick={() => send(item)} style={{ padding: '6px 9px', borderRadius: 999, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-primary-dark)', cursor: 'pointer', fontSize: 11 }}>{item}</button>)}</div>}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); send(); }} style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} placeholder="Hỏi EDUX AI..." aria-label="Câu hỏi" style={{ minWidth: 0, flex: 1, padding: '9px 10px', borderRadius: 10, border: '1px solid var(--color-border)', outline: 'none', background: 'var(--color-primary-bg)' }} />
            <button type="submit" disabled={loading || !message.trim()} aria-label="Gửi" style={{ width: 38, border: 0, borderRadius: 10, color: 'white', background: 'var(--color-primary)', cursor: loading ? 'wait' : 'pointer', opacity: loading || !message.trim() ? .55 : 1 }}><Send size={16} /></button>
          </form>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Mở EDUX AI" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', border: 0, borderRadius: 999, color: 'white', background: 'var(--color-primary)', boxShadow: '0 8px 22px rgba(245, 105, 27, .32)', cursor: 'pointer', fontWeight: 700 }}><MessageCircle size={19} /> AI hỗ trợ</button>
    </div>
  );
}
