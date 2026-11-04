import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Briefcase, AlertCircle, Plus, Calendar, ShieldCheck, UploadCloud, FileText, Trash2, Paperclip } from 'lucide-react';
import AssignmentService from '../../services/assignment.service';

export default function AssignmentSubwindowModal({ isOpen, onClose, classId, classCode, role = 'student' }) {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState('');
    const [description, setDescription] = useState('');
    const [aiDeclarationRequired, setAiDeclarationRequired] = useState(true);
    const [materials, setMaterials] = useState([]);
    const [creating, setCreating] = useState(false);

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const loadAssignments = () => {
        if (classId && (classId.startsWith('mock-') || !classId.includes('-'))) {
            setLoading(false);
            setAssignments([]);
            setError('This is a mock class. Please test with a real class from the DB.');
            return;
        }
        setLoading(true);
        AssignmentService.getClassAssignments(classId)
            .then(res => {
                const data = res?.data || res || [];
                let parsedData = Array.isArray(data) ? data : data.data || [];
                setAssignments(parsedData);
                setError(null);
            })
            .catch(err => {
                setAssignments([]);
                setError(err.response?.data?.message || 'Không thể tải danh sách bài tập hoặc lớp học chưa có bài tập.');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        if (isOpen && classId && !isCreating) {
            loadAssignments();
        }
    }, [isOpen, classId, isCreating]);

    const handleNavigate = (assignmentId) => {
        onClose();
        navigate(`/${role}/assignments/${assignmentId}`);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setMaterials(prev => [...prev, ...files]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveFile = (indexToRemove) => {
        setMaterials(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title || !deadline) return;

        setCreating(true);
        try {
            const formData = new FormData();
            formData.append('class_id', classId);
            formData.append('title', title);
            formData.append('deadline', new Date(deadline).toISOString());
            if (description) formData.append('description', description);
            formData.append('max_score', '10');
            formData.append('weight', '10');
            formData.append('ai_declaration_required', String(aiDeclarationRequired));
            formData.append('publish_status', 'published');

            materials.forEach((file) => {
                formData.append('materials', file);
            });

            await AssignmentService.createAssignment(formData);
            setIsCreating(false);
            setTitle('');
            setDeadline('');
            setDescription('');
            setAiDeclarationRequired(true);
            setMaterials([]);
            loadAssignments();
        } catch (err) {
            alert(err.response?.data?.message || 'Lỗi tạo assignment');
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="animate-fade-in"
            style={{ 
                position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', 
                backdropFilter: 'blur(1px)', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', zIndex: 1000, padding: '16px' 
            }}
            onClick={onClose}
        >
            <div 
                className="card"
                style={{ 
                    backgroundColor: '#fff', borderRadius: '16px', width: '100%', 
                    maxWidth: '680px', maxHeight: '90vh', overflow: 'hidden', 
                    boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' 
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-ink)', margin: 0 }}>
                        {isCreating ? 'Create Class Assignment' : `Assignments of ${classCode || 'Class'}`}
                    </h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: 'var(--radius-sm)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {isCreating ? (
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-ink)' }}>Title *</label>
                                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px' }} placeholder="Enter assignment title" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-ink)' }}>Deadline *</label>
                                <input type="datetime-local" required value={deadline} onChange={e => setDeadline(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-ink)' }}>Description</label>
                                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px', resize: 'vertical' }} placeholder="Enter instructions or description"></textarea>
                            </div>

                            {/* UPLOAD MATERIALS (TÀI LIỆU ĐÍNH KÈM ĐỀ BÀI) */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-ink)' }}>
                                    Tài liệu / Đề bài đính kèm (Materials)
                                </label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: '1.5px dashed var(--color-border, #cbd5e1)',
                                        borderRadius: '10px',
                                        padding: '16px',
                                        textAlign: 'center',
                                        backgroundColor: 'var(--color-surface, #f8fafc)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary, #4f46e5)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border, #cbd5e1)'}
                                >
                                    <input 
                                        type="file" 
                                        multiple 
                                        ref={fileInputRef} 
                                        onChange={handleFileSelect} 
                                        style={{ display: 'none' }} 
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(79, 70, 229, 0.08)', color: 'var(--color-primary, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <UploadCloud size={20} />
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>
                                            Nhấn để chọn file tài liệu hoặc đề bài đính kèm
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                                            Hỗ trợ: PDF, DOCX, ZIP, PNG, JPG (Chọn nhiều file)
                                        </div>
                                    </div>
                                </div>

                                {/* Preview Selected Materials */}
                                {materials.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {materials.map((file, idx) => (
                                            <div 
                                                key={idx} 
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    backgroundColor: 'var(--color-surface, #f1f5f9)',
                                                    border: '1px solid var(--color-border, #e2e8f0)',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                    <FileText size={16} style={{ color: 'var(--color-primary, #4f46e5)', shrink: 0 }} />
                                                    <span style={{ fontWeight: '600', color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {file.name}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)', fontFamily: 'monospace' }}>
                                                        ({formatFileSize(file.size)})
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFile(idx)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'var(--color-danger, #ef4444)',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                    title="Xóa file này"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* CẤU HÌNH AI AUDIT LOG (TOGGLE ĐƠN GIẢN) */}
                            <div style={{
                                border: '1px solid var(--color-border)',
                                borderRadius: '10px',
                                padding: '14px 16px',
                                backgroundColor: aiDeclarationRequired ? 'rgba(79, 70, 229, 0.03)' : 'var(--color-surface, #f8fafc)',
                                transition: 'all 0.2s ease'
                            }}>
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
                                            onChange={e => setAiDeclarationRequired(e.target.checked)}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span style={{
                                            position: 'absolute', cursor: 'pointer', inset: 0,
                                            backgroundColor: aiDeclarationRequired ? 'var(--color-primary, #4f46e5)' : '#cbd5e1',
                                            transition: '0.2s', borderRadius: '24px'
                                        }}>
                                            <span style={{
                                                position: 'absolute', content: '""', height: '18px', width: '18px',
                                                left: aiDeclarationRequired ? '20px' : '3px', bottom: '3px',
                                                backgroundColor: 'white', transition: '0.2s', borderRadius: '50%',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                            }} />
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-ink)', fontWeight: '600' }}>
                                    <th style={{ paddingBottom: '12px', textAlign: 'left' }}>Tiêu đề bài tập</th>
                                    <th style={{ paddingBottom: '12px' }}>DueDate</th>
                                    <th style={{ paddingBottom: '12px' }}>Content</th>
                                    <th style={{ paddingBottom: '12px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody style={{ color: 'var(--color-ink-soft)' }}>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '24px', textAlign: 'center' }}>
                                            <div className="skeleton" style={{ height: '32px', width: '100%' }}></div>
                                        </td>
                                    </tr>
                                ) : error && assignments.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '24px', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
                                                <AlertCircle size={16} />
                                                <span>{error}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    assignments.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-surface)', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '14px 8px', textAlign: 'left' }}>
                                            <div style={{ fontWeight: '600', color: 'var(--color-ink)' }}>{item.title}</div>
                                        </td>
                                        <td style={{ padding: '14px 8px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-ink-soft)' }}>
                                            {item.dueDate || (item.deadline ? new Date(item.deadline).toLocaleString() : 'N/A')}
                                        </td>
                                        <td style={{ padding: '14px 8px' }}>
                                            <span onClick={() => handleNavigate(item.id)} style={{ color: 'var(--color-primary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>CONTENT</span>
                                        </td>
                                        <td style={{ padding: '14px 8px' }}>
                                            <div onClick={() => handleNavigate(item.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: '500', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color='var(--color-primary-dark)'} onMouseLeave={e => e.currentTarget.style.color='var(--color-primary)'}>
                                                <span style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                                                    <Briefcase size={12} />
                                                </span>
                                                <span>Open</span>
                                            </div>
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--color-border)' }}>
                    {isCreating ? (
                        <>
                            <button className="btn" type="button" onClick={() => setIsCreating(false)} style={{ backgroundColor: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-ink-soft)', padding: '8px 20px', fontSize: '12px', fontWeight: 'bold' }}>
                                CANCEL
                            </button>
                            <button className="btn" type="button" onClick={handleCreate} disabled={creating} style={{ backgroundColor: 'var(--color-primary)', border: 'none', color: '#fff', padding: '8px 20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {creating ? 'CREATING...' : 'SAVE'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn" onClick={onClose} style={{ backgroundColor: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-ink-soft)', padding: '8px 20px', fontSize: '12px', fontWeight: 'bold' }}>
                                CLOSE
                            </button>
                            {role === 'lecturer' && (
                                <button className="btn" onClick={() => setIsCreating(true)} style={{ backgroundColor: 'var(--color-primary)', border: 'none', color: '#fff', padding: '8px 20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Plus size={14} /> CREATE ASSIGNMENT
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
