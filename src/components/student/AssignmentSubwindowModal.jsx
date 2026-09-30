import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Briefcase, AlertCircle, Plus, Calendar } from 'lucide-react';
import AssignmentService from '../../services/assignment.service';

export default function AssignmentSubwindowModal({ isOpen, onClose, classId, classCode, role = 'student' }) {
    const navigate = useNavigate();

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [deadline, setDeadline] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

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

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!title || !deadline) return;
        setCreating(true);
        try {
            await AssignmentService.createAssignment({
                class_id: classId,
                title,
                deadline: new Date(deadline).toISOString(),
                description,
                max_score: 10,
                weight: 10,
                publish_status: 'published'
            });
            setIsCreating(false);
            setTitle('');
            setDeadline('');
            setDescription('');
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
                    maxWidth: '640px', maxHeight: '85vh', overflow: 'hidden', 
                    boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' 
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-ink)', margin: 0 }}>
                        {isCreating ? 'Create Global Assignment' : `Assignments of ${classCode || 'Class'}`}
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
                                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px', resize: 'vertical' }} placeholder="Enter instructions or description"></textarea>
                            </div>
                        </form>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-ink)', fontWeight: '600' }}>
                                    <th style={{ paddingBottom: '12px' }}>Title</th>
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
                                        <td style={{ padding: '16px 8px', fontWeight: '500', color: 'var(--color-ink)' }}>{item.title}</td>
                                        <td style={{ padding: '16px 8px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-ink-soft)' }}>{item.dueDate || new Date(item.deadline).toLocaleString()}</td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <span onClick={() => handleNavigate(item.id)} style={{ color: 'var(--color-primary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>CONTENT</span>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
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
                            <button className="btn" onClick={() => setIsCreating(false)} style={{ backgroundColor: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-ink-soft)', padding: '8px 20px', fontSize: '12px', fontWeight: 'bold' }}>
                                CANCEL
                            </button>
                            <button className="btn" onClick={handleCreate} disabled={creating} style={{ backgroundColor: 'var(--color-primary)', border: 'none', color: '#fff', padding: '8px 20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
