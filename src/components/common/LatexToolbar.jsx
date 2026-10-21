import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const LATEX_SNIPPETS = [
  { label: 'Phân số', formula: '$\\frac{a}{b}$', desc: 'Phân số a/b' },
  { label: 'Căn thức', formula: '$\\sqrt{x}$', desc: 'Căn bậc hai' },
  { label: 'Căn bậc n', formula: '$\\sqrt[n]{x}$', desc: 'Căn bậc n' },
  { label: 'Tích phân', formula: '$\\int_{a}^{b} f(x) \\, dx$', desc: 'Tích phân từ a đến b' },
  { label: 'Đạo hàm', formula: '$\\frac{df}{dx}$', desc: 'Đạo hàm' },
  { label: 'Giới hạn', formula: '$\\lim_{x \\to 0} f(x)$', desc: 'Giới hạn lim' },
  { label: 'Tổng Sigma', formula: '$\\sum_{i=1}^{n} a_i$', desc: 'Tổng từ 1 đến n' },
  {
    label: 'Ma trận 2x2',
    formula: '$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$',
    desc: 'Ma trận vuông cấp 2',
  },
  {
    label: 'Ma trận 3x3',
    formula: '$$\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}$$',
    desc: 'Ma trận vuông cấp 3',
  },
  { label: 'Mũ x²', formula: '$x^{2}$', desc: 'Lũy thừa' },
  { label: 'Chỉ số xᵢ', formula: '$x_{i}$', desc: 'Chỉ số dưới' },
  { label: 'π (Pi)', formula: '$\\pi$', desc: 'Số Pi' },
  { label: '∞ (Vô cùng)', formula: '$\\infty$', desc: 'Vô cực' },
  { label: '± (Cộng trừ)', formula: '$\\pm$', desc: 'Dấu cộng trừ' },
  { label: 'α (Alpha)', formula: '$\\alpha$', desc: 'Ký hiệu Alpha' },
  { label: 'β (Beta)', formula: '$\\beta$', desc: 'Ký hiệu Beta' },
  { label: 'θ (Theta)', formula: '$\\theta$', desc: 'Góc Theta' },
  { label: '≠ (Khác)', formula: '$\\neq$', desc: 'Không bằng' },
  { label: '≤ (Nhỏ hơn bằng)', formula: '$\\le$', desc: 'Nhỏ hơn hoặc bằng' },
  { label: '≥ (Lớn hơn bằng)', formula: '$\\ge$', desc: 'Lớn hơn hoặc bằng' },
];

export default function LatexToolbar({ onInsert }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      margin: '6px 0 10px',
      borderRadius: '10px',
      background: 'var(--color-primary-bg)',
      border: '1px solid var(--color-border)',
      overflow: 'hidden',
    }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 12px',
          background: 'transparent',
          border: 'none',
          color: 'var(--color-primary-dark)',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="var(--color-primary)" />
          Hỗ trợ công thức Toán học / LaTeX (Tích phân, Ma trận, Phân số, Giới hạn...)
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div style={{
          padding: '10px 12px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          {LATEX_SNIPPETS.map((snip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onInsert(snip.formula)}
              title={snip.desc}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-ink)',
                fontSize: '0.6875rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.color = 'var(--color-primary-dark)';
                e.currentTarget.style.background = 'var(--color-primary-card)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-ink)';
                e.currentTarget.style.background = 'var(--color-surface)';
              }}
            >
              + {snip.label}
            </button>
          ))}
          <div style={{ width: '100%', marginTop: '6px', fontSize: '0.6875rem', color: 'var(--color-ink-muted)' }}>
            💡 Mẹo: Bọc công thức trong <code>$...$</code> (dòng ngắn) hoặc <code>$$...$$</code> (dòng riêng).
          </div>
        </div>
      )}
    </div>
  );
}

