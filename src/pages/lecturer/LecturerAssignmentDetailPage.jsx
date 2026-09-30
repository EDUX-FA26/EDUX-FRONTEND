import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import AssignmentService from '../../services/assignment.service';
import SubmissionService from '../../services/submission.service';
import { Briefcase, CheckCircle, ChevronDown } from 'lucide-react';

export default function LecturerAssignmentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitForm, setSubmitForm] = useState({ link: '', comment: '', file: null });
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef(null);

    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                // If id is our mock 'asm-1', don't call backend to avoid 404 error logs in console for mock data
                if (id && !id.startsWith('asm-')) {
                    const data = await AssignmentService.getAssignmentDetail(id);
                    setAssignment(data);
                }
            } catch (error) {
                console.error("Failed to fetch assignment:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const note = submitForm.link ? `${submitForm.comment}\nLink: ${submitForm.link}` : submitForm.comment;

            if (id && id.startsWith('asm-')) {
                // Simulate API call for dummy data
                await new Promise(resolve => setTimeout(resolve, 1000));
                alert("Nộp bài thành công (Mô phỏng cho dữ liệu giả định)!");
            } else {
                // Call real API for DB data
                await SubmissionService.submitAssignment(id, submitForm.file, note);
                alert("Nộp bài thành công lên hệ thống!");
            }

            setIsSubmitting(false);
            // In a real app, we would re-fetch the submission status here
        } catch (error) {
            console.error("Submit failed:", error);
            alert(error.response?.data?.message || "Có lỗi xảy ra khi nộp bài");
        } finally {
            setSubmitting(false);
        }
    };

    const titleMap = {
        '2': 'Assignment 2',
        '4': 'Assignment 4',
        'project': 'Nộp Project',
        '3': 'Assignment 3',
        '1': 'Assignment 1',
        'asm-1': 'React Fundamental Exercises',
        'asm-2': 'State Management Project',
        'asm-3': 'Node.js Express API',
        'asm-4': 'MongoDB Aggregation',
        'asm-5': 'Final Backend Architecture'
    };

    const title = assignment?.title || titleMap[id] || `Assignment ${id}`;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1152px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px 0' }}>

            {/* Breadcrumbs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '500' }}>
                <Link to="/lecturer/classes" style={{ color: 'var(--color-primary)', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Home</Link>
                <span style={{ color: 'var(--color-ink-muted)' }}>/</span>
                <Link to="/lecturer/classes/mock-1" style={{ color: 'var(--color-primary)', textDecoration: 'none', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                    Server-Side development with NodeJS...
                </Link>
                <span style={{ color: 'var(--color-ink-muted)' }}>/</span>
                <span style={{ color: 'var(--color-ink-soft)' }}>{title}</span>
            </nav>

            {/* Page Title & Submit Action Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-ink)', margin: 0, letterSpacing: '-0.5px' }}>{title}</h1>

                {/* 🔴 NÚT NAVIGATE CHUYỂN SANG TRANG CHẤM ĐIỂM */}
                <button
                    onClick={() => navigate(`/lecturer/assignments/${id}/grade`)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 16px', backgroundColor: 'var(--color-primary)', color: 'white',
                        border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    <CheckCircle size={18} /> Chấm bài (Grade Submissions)
                </button>
            </div>

            {/* Main Layout: 2 Cột */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
                <style>{`
                    @media (min-width: 1024px) {
                        .assignment-layout { grid-template-columns: 4fr 8fr !important; }
                    }
                `}</style>
                <div className="assignment-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', width: '100%', gridColumn: '1 / -1' }}>

                    {/* CỘT TRÁI */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Card 1: Table of contents */}
                        <div className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 'bold', color: 'var(--color-ink)', fontSize: '14px', cursor: 'pointer', marginBottom: '12px' }}>
                                <span>Table of contents</span>
                                <ChevronDown size={14} style={{ color: 'var(--color-ink-muted)' }} />
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-ink-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                                ASSIGNMENTS
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-primary-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Briefcase size={12} />
                                    </span>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>{title}</span>
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-ink-muted)' }}>N/A</span>
                            </div>
                        </div>

                        {/* Card 2: Content */}
                        <div className="card" style={{ padding: '20px' }}>
                            <h3 style={{ fontWeight: 'bold', color: 'var(--color-ink)', fontSize: '14px', margin: '0 0 12px 0' }}>Content</h3>
                            <p style={{ fontSize: '12px', color: 'var(--color-ink-soft)', margin: 0 }}>{title}</p>
                        </div>

                        {/* Card 3: Additional Files & Due Date */}
                        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                ADDITIONAL FILES
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-ink-soft)' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--color-ink)' }}>DUE DATE:</span> 2026-03-25 12:50:00
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                <span style={{ color: 'var(--color-ink-soft)', fontWeight: 'normal' }}>(GMT+07)</span>
                                <span style={{ color: 'var(--color-danger)' }}> - SCORE: N/A</span>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: Khung Submission Status Lớn / Form Nộp */}
                    <div className="card" style={{ padding: '24px', minHeight: '350px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-ink)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                            Student Submissions
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-ink-muted)' }}>
                                        <th style={{ padding: '8px' }}>Student</th>
                                        <th style={{ padding: '8px' }}>Status</th>
                                        <th style={{ padding: '8px' }}>Submitted At</th>
                                        <th style={{ padding: '8px' }}>File/Link</th>
                                        <th style={{ padding: '8px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Dummy Data */}
                                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>Nguyen Van A</td>
                                        <td style={{ padding: '8px' }}><span className="badge badge-green">Submitted</span></td>
                                        <td style={{ padding: '8px' }}>2026-03-24 10:15</td>
                                        <td style={{ padding: '8px', color: 'var(--color-primary)' }}>project.zip</td>
                                        <td style={{ padding: '8px' }}><button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }}>Grade</button></td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>Tran Thi B</td>
                                        <td style={{ padding: '8px' }}><span className="badge badge-red">Missing</span></td>
                                        <td style={{ padding: '8px' }}>-</td>
                                        <td style={{ padding: '8px' }}>-</td>
                                        <td style={{ padding: '8px' }}>-</td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '8px', fontWeight: 'bold' }}>Le Van C</td>
                                        <td style={{ padding: '8px' }}><span className="badge badge-green">Submitted</span></td>
                                        <td style={{ padding: '8px' }}>2026-03-24 15:30</td>
                                        <td style={{ padding: '8px', color: 'var(--color-primary)' }}>github link</td>
                                        <td style={{ padding: '8px' }}><button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }}>Grade</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

