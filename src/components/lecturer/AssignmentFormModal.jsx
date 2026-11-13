import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X as XIcon, Edit3, Plus, UploadCloud, FileText, Trash2, Calendar, ShieldCheck, Sparkles, AlertCircle, Scale, CheckCircle2, Layers } from 'lucide-react';
import ClassService from '../../services/class.service';

export const DEFAULT_RUBRIC_CONFIGS = [
    {
        criterion_key: 'PROBLEM_ABSTRACTION',
        criterion_name: 'Problem Abstraction & Solution Design',
        is_enabled: true,
        weight_percent: 20,
        display_order: 1,
    },
    {
        criterion_key: 'IMPLEMENTATION_QUALITY',
        criterion_name: 'Implementation & Code Quality',
        is_enabled: true,
        weight_percent: 30,
        display_order: 2,
    },
    {
        criterion_key: 'CRITICAL_EVALUATION',
        criterion_name: 'Critical Evaluation & Verification',
        is_enabled: true,
        weight_percent: 25,
        display_order: 3,
    },
    {
        criterion_key: 'AI_INTERACTION',
        criterion_name: 'AI Interaction & Prompt Engineering',
        is_enabled: true,
        weight_percent: 15,
        display_order: 4,
    },
    {
        criterion_key: 'METACOGNITIVE_REFLECTION',
        criterion_name: 'Metacognitive Reflection & Transparency',
        is_enabled: true,
        weight_percent: 10,
        display_order: 5,
    },
];

export default function AssignmentFormModal({
    isOpen,
    onClose,
    mode = 'create', // 'create' | 'edit'
    initialData = null,
    onSubmit,
    isSubmitting = false,
    customTitle = null,
    onDeleteExistingMaterial = null,
    classId = null,
    initialSlotId = null,
    slots = null,
}) {
    const fileInputRef = useRef(null);

    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState('');
    const [publishStatus, setPublishStatus] = useState('published');
    const [maxScore, setMaxScore] = useState(10);
    const [weight, setWeight] = useState(10);
    const [description, setDescription] = useState('');
    const [slotId, setSlotId] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [aiDeclarationRequired, setAiDeclarationRequired] = useState(true);
    const [rubricConfigs, setRubricConfigs] = useState(DEFAULT_RUBRIC_CONFIGS);
    const [newMaterials, setNewMaterials] = useState([]);
    const [existingMaterials, setExistingMaterials] = useState([]);

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        if (typeof bytes === 'string' && isNaN(bytes)) return bytes;
        const num = Number(bytes);
        if (num < 1024) return `${num} B`;
        if (num < 1048576) return `${(num / 1024).toFixed(1)} KB`;
        return `${(num / 1048576).toFixed(1)} MB`;
    };

    useEffect(() => {
        if (!isOpen) return;

        // Load danh sách Slots của lớp
        const targetClassId = classId || initialData?.class_id || initialData?.classId;
        if (Array.isArray(slots) && slots.length > 0) {
            setAvailableSlots(slots);
        } else if (targetClassId) {
            ClassService.getClassSlots(targetClassId)
                .then((res) => {
                    const list = res?.data || res || [];
                    setAvailableSlots(Array.isArray(list) ? list : []);
                })
                .catch(() => setAvailableSlots([]));
        }

        if (mode === 'edit' && initialData) {
            let deadlineFormatted = '';
            if (initialData.deadline) {
                try {
                    const d = new Date(initialData.deadline);
                    const pad = (n) => String(n).padStart(2, '0');
                    deadlineFormatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                } catch (e) {}
            }
            setTitle(initialData.title || '');
            setDeadline(deadlineFormatted);
            setPublishStatus(initialData.publish_status || 'published');
            setMaxScore(initialData.max_score ?? 10);
            setWeight(initialData.weight ?? 10);
            setDescription(initialData.description || '');
            setSlotId(initialData.slot_id || initialData.session_id || '');
            setAiDeclarationRequired(initialData.ai_declaration_required !== false);
            if (initialData.rubric_configs && Array.isArray(initialData.rubric_configs) && initialData.rubric_configs.length > 0) {
                setRubricConfigs(initialData.rubric_configs.map((c, i) => ({
                    criterion_key: c.criterion_key,
                    criterion_name: c.criterion_name,
                    is_enabled: c.is_enabled !== false,
                    weight_percent: Number(c.weight_percent) || 0,
                    display_order: Number(c.display_order) || (i + 1),
                })));
            } else {
                setRubricConfigs(DEFAULT_RUBRIC_CONFIGS);
            }
            setExistingMaterials(initialData.materials || []);
            setNewMaterials([]);
        } else {
            // Mode create: reset to blank/defaults
            setTitle('');
            setDeadline('');
            setPublishStatus('published');
            setMaxScore(10);
            setWeight(10);
            setDescription('');
            setSlotId(initialSlotId || initialData?.slot_id || initialData?.session_id || '');
            setAiDeclarationRequired(true);
            setRubricConfigs(DEFAULT_RUBRIC_CONFIGS);
            setExistingMaterials([]);
            setNewMaterials([]);
        }
    }, [isOpen, mode, initialData, classId, initialSlotId, slots]);

    const totalWeight = rubricConfigs
        .filter((c) => c.is_enabled)
        .reduce((sum, c) => sum + (Number(c.weight_percent) || 0), 0);
    const isWeightValid = !aiDeclarationRequired || totalWeight === 100;

    const handleAutoBalance = () => {
        const enabledIndices = rubricConfigs
            .map((c, i) => (c.is_enabled ? i : -1))
            .filter((i) => i !== -1);

        if (enabledIndices.length === 0) return;

        const baseWeight = Math.floor(100 / enabledIndices.length);
        let remainder = 100 - baseWeight * enabledIndices.length;

        setRubricConfigs((prev) =>
            prev.map((c) => {
                if (!c.is_enabled) {
                    return { ...c, weight_percent: 0 };
                }
                const extra = remainder > 0 ? 1 : 0;
                if (remainder > 0) remainder--;
                return { ...c, weight_percent: baseWeight + extra };
            })
        );
    };

    const handleToggleCriterion = (criterionKey) => {
        setRubricConfigs((prev) =>
            prev.map((c) => {
                if (c.criterion_key === criterionKey) {
                    return { ...c, is_enabled: !c.is_enabled };
                }
                return c;
            })
        );
    };

    const handleWeightChange = (criterionKey, val) => {
        const parsed = parseInt(val, 10);
        const safeVal = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
        setRubricConfigs((prev) =>
            prev.map((c) => (c.criterion_key === criterionKey ? { ...c, weight_percent: safeVal } : c))
        );
    };

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setNewMaterials((prev) => [...prev, ...files]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveNewFile = (indexToRemove) => {
        setNewMaterials((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !deadline) {
            alert('Vui lòng điền đủ tiêu đề và hạn nộp!');
            return;
        }

        if (aiDeclarationRequired && totalWeight !== 100) {
            alert(`Tổng trọng số của các tiêu chí được bật phải đạt chính xác 100%! Hiện tại là ${totalWeight}%.`);
            return;
        }

        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('deadline', new Date(deadline).toISOString());
        formData.append('publish_status', publishStatus || 'published');
        formData.append('max_score', String(maxScore ?? 10));
        formData.append('weight', String(weight ?? 10));
        formData.append('description', description.trim());
        formData.append('instructions', '');
        formData.append('slot_id', slotId || '');
        formData.append('session_id', slotId || '');
        formData.append('ai_declaration_required', String(aiDeclarationRequired));
        formData.append('allow_late_submission', 'false'); // Mặc định không cho nộp muộn
        formData.append('rubric_configs', JSON.stringify(rubricConfigs));

        newMaterials.forEach((file) => {
            formData.append('materials', file);
        });

        if (onSubmit) {
            await onSubmit(formData);
        }
    };

    const modalTitle = customTitle || (mode === 'edit' ? 'Chỉnh sửa bài tập (Edit Assignment)' : 'Tạo bài tập mới (Create Assignment)');

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.45)',
                backdropFilter: 'blur(2px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
            }}
            onClick={onClose}
        >
            <div
                className="card animate-fade-in"
                style={{
                    width: '100%',
                    maxWidth: '680px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                            style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--color-primary-bg, rgba(79, 70, 229, 0.08))',
                                color: 'var(--color-primary, #4f46e5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {mode === 'edit' ? <Edit3 size={17} /> : <Plus size={18} />}
                        </div>
                        <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--color-ink)' }}>
                            {modalTitle}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-ink-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '6px',
                        }}
                    >
                        <XIcon size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Tiêu đề */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                            Tiêu đề bài tập *
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                fontSize: '13px',
                                outline: 'none',
                            }}
                            placeholder="ví dụ: Assignment 1: Database Architecture..."
                        />
                    </div>

                    {/* Hạn nộp & Trạng thái */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                                Hạn nộp (Deadline) *
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                                Trạng thái công bố (Publish Status)
                            </label>
                            <select
                                value={publishStatus}
                                onChange={(e) => setPublishStatus(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    outline: 'none',
                                    backgroundColor: '#fff',
                                }}
                            >
                                <option value="published">Công bố ngay (Published)</option>
                                <option value="draft">Bản nháp (Draft)</option>
                                <option value="closed">Đã đóng (Closed)</option>
                            </select>
                        </div>
                    </div>

                    {/* Buổi học liên kết (Selection Slot) */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                            <Layers size={14} className="text-orange-500" />
                            <span>Buổi học liên kết (Selection Slot)</span>
                        </label>
                        <select
                            value={slotId}
                            onChange={(e) => setSlotId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                fontSize: '13px',
                                outline: 'none',
                                backgroundColor: '#fff',
                                color: slotId ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                            }}
                        >
                            <option value="">-- Không gắn Slot cụ thể (Bài tập chung toàn khóa) --</option>
                            {availableSlots.map((s) => {
                                const slotNo = s.slot_number || s.session_no;
                                const dateStr = s.date ? new Date(s.date).toLocaleDateString('vi-VN') : '';
                                const titleStr = s.title ? ` - ${s.title}` : '';
                                return (
                                    <option key={s.id} value={s.id}>
                                        Slot {slotNo}{dateStr ? ` (${dateStr})` : ''}{titleStr}
                                    </option>
                                );
                            })}
                        </select>
                        <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
                            {slotId ? 'Bài tập sẽ tự động xuất hiện trong chi tiết buổi học của Slot này.' : 'Bài tập sẽ hiển thị ở danh mục bài tập chung toàn khóa.'}
                        </div>
                    </div>

                    {/* Điểm tối đa & Trọng số */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                                Thang điểm tối đa
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={maxScore}
                                onChange={(e) => setMaxScore(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    outline: 'none',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                                Trọng số điểm (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    </div>

                    {/* Mô tả */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                            Mô tả bài tập (Description)
                        </label>
                        <textarea
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả nội dung, bối cảnh bài tập..."
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                fontSize: '13px',
                                outline: 'none',
                                resize: 'vertical',
                            }}
                        />
                    </div>
                    {/* CẤU HÌNH AI AUDIT LOG (TOGGLE & DYNAMIC RUBRIC CONFIG) */}
                    <div
                        style={{
                            border: '1px solid var(--color-border)',
                            borderRadius: '10px',
                            padding: '14px 16px',
                            backgroundColor: aiDeclarationRequired ? 'rgba(79, 70, 229, 0.03)' : 'var(--color-surface, #f8fafc)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>
                                    Yêu cầu khai báo AI Audit Log
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                                    Bật để yêu cầu sinh viên cung cấp bản giải trình minh bạch về việc sử dụng AI khi làm bài.
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '42px', height: '24px', flexShrink: 0, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={aiDeclarationRequired}
                                    onChange={(e) => setAiDeclarationRequired(e.target.checked)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span
                                    style={{
                                        position: 'absolute',
                                        cursor: 'pointer',
                                        inset: 0,
                                        backgroundColor: aiDeclarationRequired ? 'var(--color-primary, #4f46e5)' : '#cbd5e1',
                                        transition: '0.2s',
                                        borderRadius: '24px',
                                    }}
                                >
                                    <span
                                        style={{
                                            position: 'absolute',
                                            content: '""',
                                            height: '18px',
                                            width: '18px',
                                            left: aiDeclarationRequired ? '20px' : '3px',
                                            bottom: '3px',
                                            backgroundColor: 'white',
                                            transition: '0.2s',
                                            borderRadius: '50%',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        }}
                                    />
                                </span>
                            </label>
                        </div>

                        {/* KHU VỰC CẤU HÌNH TIÊU CHÍ RUBRIC & TRỌNG SỐ (%) */}
                        {aiDeclarationRequired && (
                            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(79, 70, 229, 0.15)', paddingTop: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Sparkles size={14} className="text-indigo-600" />
                                            <span>Cấu hình Tiêu chí Rubric & Trọng số AI (%)</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                            Tùy chỉnh bật/tắt từng tiêu chí và phân bổ trọng số (Tổng các tiêu chí bật bắt buộc bằng 100%).
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAutoBalance}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            padding: '4px 10px',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            color: '#4f46e5',
                                            backgroundColor: '#eef2ff',
                                            border: '1px solid #c7d2fe',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                        }}
                                        title="Tự động chia đều 100% cho các tiêu chí đang bật"
                                    >
                                        <Scale size={13} />
                                        <span>Chia đều %</span>
                                    </button>
                                </div>

                                {/* Criteria Rows */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {rubricConfigs.map((crit, idx) => {
                                        const isEnabled = crit.is_enabled !== false;
                                        return (
                                            <div
                                                key={crit.criterion_key}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 12px',
                                                    backgroundColor: isEnabled ? '#ffffff' : '#f8fafc',
                                                    border: `1px solid ${isEnabled ? '#e2e8f0' : '#f1f5f9'}`,
                                                    borderRadius: '8px',
                                                    opacity: isEnabled ? 1 : 0.55,
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                                    <input
                                                        type="checkbox"
                                                        id={`rubric-enable-${crit.criterion_key}`}
                                                        checked={isEnabled}
                                                        onChange={() => handleToggleCriterion(crit.criterion_key)}
                                                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#4f46e5' }}
                                                    />
                                                    <label
                                                        htmlFor={`rubric-enable-${crit.criterion_key}`}
                                                        style={{
                                                            fontSize: '12px',
                                                            fontWeight: isEnabled ? '600' : '400',
                                                            color: isEnabled ? '#1e293b' : '#94a3b8',
                                                            cursor: 'pointer',
                                                            userSelect: 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                        }}
                                                    >
                                                        <span style={{ color: '#6366f1', fontWeight: '700', fontSize: '11px' }}>#{idx + 1}</span>
                                                        <span>{crit.criterion_name}</span>
                                                    </label>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="1"
                                                            disabled={!isEnabled}
                                                            value={isEnabled ? crit.weight_percent : 0}
                                                            onChange={(e) => handleWeightChange(crit.criterion_key, e.target.value)}
                                                            style={{
                                                                width: '64px',
                                                                padding: '4px 22px 4px 8px',
                                                                textAlign: 'right',
                                                                fontSize: '12px',
                                                                fontWeight: '700',
                                                                fontFamily: 'monospace',
                                                                color: isEnabled ? '#0f172a' : '#94a3b8',
                                                                backgroundColor: isEnabled ? '#ffffff' : '#f1f5f9',
                                                                border: `1px solid ${isEnabled ? '#cbd5e1' : '#e2e8f0'}`,
                                                                borderRadius: '6px',
                                                                outline: 'none',
                                                                cursor: isEnabled ? 'text' : 'not-allowed',
                                                            }}
                                                        />
                                                        <span
                                                            style={{
                                                                position: 'absolute',
                                                                right: '7px',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                color: isEnabled ? '#64748b' : '#cbd5e1',
                                                                pointerEvents: 'none',
                                                            }}
                                                        >
                                                            %
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Real-time Validator Status Bar */}
                                <div
                                    style={{
                                        marginTop: '12px',
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        backgroundColor: totalWeight === 100 ? '#f0fdf4' : '#fef2f2',
                                        border: `1px solid ${totalWeight === 100 ? '#bbf7d0' : '#fecaca'}`,
                                        color: totalWeight === 100 ? '#166534' : '#991b1b',
                                    }}
                                >
                                    {totalWeight === 100 ? (
                                        <>
                                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                            <span>Tổng trọng số hiện tại: <strong>100% / 100%</strong> (Trạng thái: Hợp lệ ✔️)</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle size={16} className="text-rose-600 shrink-0" />
                                            <span>
                                                Tổng trọng số hiện tại: <strong>{totalWeight}% / 100%</strong>
                                                {' '}(Cần điều chỉnh {totalWeight > 100 ? `giảm ${totalWeight - 100}%` : `thêm ${100 - totalWeight}%`} để đạt 100%)
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* UPLOAD TÀI LIỆU MATERIALS */}
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--color-ink)' }}>
                            Tài liệu / Đề bài đính kèm (Materials)
                        </label>

                        {/* Hiện các file đã có trong chế độ Edit */}
                        {mode === 'edit' && existingMaterials && existingMaterials.length > 0 && (
                            <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>Tài liệu hiện có trên bài tập:</span>
                                {existingMaterials.map((mat) => (
                                    <div
                                        key={mat.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '6px 10px',
                                            borderRadius: '6px',
                                            backgroundColor: '#f8fafc',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '11px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                            <FileText size={13} style={{ color: 'var(--color-primary)' }} />
                                            <span style={{ fontWeight: '500', color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {mat.file_name}
                                            </span>
                                            <span style={{ color: 'var(--color-ink-muted)' }}>({formatFileSize(mat.file_size)})</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '600' }}>Đã tải lên</span>
                                            {onDeleteExistingMaterial && (
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        await onDeleteExistingMaterial(mat.id, mat.file_name);
                                                        setExistingMaterials((prev) => prev.filter((m) => m.id !== mat.id));
                                                    }}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--color-danger, #ef4444)',
                                                        cursor: 'pointer',
                                                        padding: '2px',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                    title="Xóa tài liệu này"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: '1.5px dashed var(--color-border, #cbd5e1)',
                                borderRadius: '10px',
                                padding: '14px',
                                textAlign: 'center',
                                backgroundColor: 'var(--color-surface, #f8fafc)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary, #4f46e5)')}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border, #cbd5e1)')}
                        >
                            <input
                                type="file"
                                multiple
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                <UploadCloud size={20} style={{ color: 'var(--color-primary, #4f46e5)' }} />
                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>
                                    {mode === 'edit' ? 'Nhấn để chọn file tài liệu mới đính kèm' : 'Nhấn để chọn file tài liệu hoặc đề bài đính kèm'}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                                    Hỗ trợ: PDF, DOCX, ZIP, PNG, JPG (Chọn nhiều file)
                                </div>
                            </div>
                        </div>

                        {/* Preview files to be uploaded */}
                        {newMaterials.length > 0 && (
                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: '600' }}>
                                    {mode === 'edit' ? 'Tài liệu mới sắp được tải lên:' : 'Tài liệu đã chọn:'}
                                </span>
                                {newMaterials.map((file, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '7px 10px',
                                            borderRadius: '6px',
                                            backgroundColor: 'var(--color-surface, #f1f5f9)',
                                            border: '1px solid var(--color-border, #e2e8f0)',
                                            fontSize: '12px',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                            <FileText size={14} style={{ color: 'var(--color-primary, #4f46e5)', shrink: 0 }} />
                                            <span style={{ fontWeight: '600', color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {file.name}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'var(--color-ink-muted)', fontFamily: 'monospace' }}>
                                                ({formatFileSize(file.size)})
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveNewFile(idx)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--color-danger, #ef4444)',
                                                cursor: 'pointer',
                                                padding: '2px',
                                            }}
                                            title="Xóa file này"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: '#fff',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                            }}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (aiDeclarationRequired && totalWeight !== 100)}
                            style={{
                                padding: '8px 22px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: (isSubmitting || (aiDeclarationRequired && totalWeight !== 100)) ? '#94a3b8' : 'var(--color-primary, #4f46e5)',
                                color: '#fff',
                                cursor: (isSubmitting || (aiDeclarationRequired && totalWeight !== 100)) ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                            }}
                            title={aiDeclarationRequired && totalWeight !== 100 ? `Tổng trọng số phải đạt đúng 100% (Hiện tại: ${totalWeight}%)` : ''}
                        >
                            {isSubmitting
                                ? (mode === 'edit' ? 'Đang cập nhật...' : 'Đang tạo...')
                                : (mode === 'edit' ? 'Update Assignment' : 'Create Assignment')}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
