import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Briefcase, AlertCircle } from 'lucide-react';
import AssignmentService from '../../services/assignment.service';

export default function AssignmentSubwindowModal({ isOpen, onClose, classId }) {
    const navigate = useNavigate();

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && classId) {
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
        }
    }, [isOpen, classId]);

    const handleNavigate = (assignmentId) => {
        onClose();
        navigate(`/student/assignments/${assignmentId}`);
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
            {/* Modal Box */}
            <div 
                className="card"
                style={{ 
                    backgroundColor: '#fff', borderRadius: '16px', width: '100%', 
                    maxWidth: '640px', maxHeight: '85vh', overflow: 'hidden', 
                    boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column' 
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--color-ink)', margin: 0 }}>Assignment of class SE18D01</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: 'var(--radius-sm)' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body / Table */}
                <div style={{ padding: '24px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-ink)', fontWeight: '600' }}>
                                <th style={{ paddingBottom: '12px' }}>Title</th>
                                <th style={{ paddingBottom: '12px' }}>DueDate</th>
                                <th style={{ paddingBottom: '12px' }}>Content</th>
                                <th style={{ paddingBottom: '12px' }}>Link</th>
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
                                            <span>Click</span>
                                        </div>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{ padding: '8px 24px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn" onClick={onClose} style={{ backgroundColor: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', padding: '6px 20px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        CANCEL
                    </button>
                </div>
            </div>
        </div>
    );
}
