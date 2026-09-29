import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, FileText, ChevronDown, Briefcase, UploadCloud, X as XIcon, File as FileIcon } from 'lucide-react';
import AssignmentService from '../../services/assignment.service';
import SubmissionService from '../../services/submission.service';

export default function StudentAssignmentDetailPage() {
    const { id } = useParams();
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
                <Link to="/student/classes" style={{ color: 'var(--color-primary)', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>Home</Link>
                <span style={{ color: 'var(--color-ink-muted)' }}>/</span>
                <Link to="/student/classes/mock-1" style={{ color: 'var(--color-primary)', textDecoration: 'none', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                    Server-Side development with NodeJS...
                </Link>
                <span style={{ color: 'var(--color-ink-muted)' }}>/</span>
                <span style={{ color: 'var(--color-ink-soft)' }}>{title}</span>
            </nav>

            {/* Page Title & Submit Action Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-ink)', margin: 0, letterSpacing: '-0.5px' }}>{title}</h1>
                <button 
                    className="btn" 
                    onClick={() => setIsSubmitting(!isSubmitting)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: isSubmitting ? 'var(--color-surface)' : 'var(--color-primary-bg)', color: isSubmitting ? 'var(--color-ink)' : 'var(--color-primary-dark)', border: isSubmitting ? '1px solid var(--color-border)' : '1px solid var(--color-primary)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                    <FileText size={16} />
                    {isSubmitting ? 'CANCEL SUBMISSION' : 'SUBMIT ASSIGNMENT'}
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
                        
                        {isSubmitting ? (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-ink)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                                    Your Submission
                                </div>

                                {/* Drag and Drop File Upload */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>Upload File (ZIP, PDF, DOCX...)</label>
                                    
                                    {!submitForm.file ? (
                                        <div 
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setIsDragging(false);
                                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                                    setSubmitForm({ ...submitForm, file: e.dataTransfer.files[0] });
                                                }
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                border: isDragging ? '2px dashed var(--color-primary)' : '2px dashed var(--color-border)',
                                                backgroundColor: isDragging ? 'var(--color-primary-bg)' : 'var(--color-surface)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: '32px 16px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <UploadCloud size={32} style={{ color: isDragging ? 'var(--color-primary)' : 'var(--color-ink-muted)' }} />
                                            <div style={{ fontSize: '13px', color: 'var(--color-ink)' }}>
                                                <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Click to upload</span> or drag and drop
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--color-ink-soft)' }}>
                                                Maximum file size 50 MB
                                            </div>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files.length > 0) {
                                                        setSubmitForm({ ...submitForm, file: e.target.files[0] });
                                                    }
                                                }}
                                                style={{ display: 'none' }} 
                                            />
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', backgroundColor: 'var(--color-primary-bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
                                                    <FileIcon size={20} />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-ink)' }}>{submitForm.file.name}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--color-ink-soft)' }}>{(submitForm.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setSubmitForm({ ...submitForm, file: null })}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-ink-muted)' }}
                                            >
                                                <XIcon size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <hr style={{ flex: 1, borderColor: 'var(--color-border)' }} />
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>OR</span>
                                    <hr style={{ flex: 1, borderColor: 'var(--color-border)' }} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>Link (Google Drive, GitHub, etc.)</label>
                                    <input 
                                        type="url" 
                                        placeholder="https://..." 
                                        value={submitForm.link}
                                        onChange={(e) => setSubmitForm({...submitForm, link: e.target.value})}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
                                    />
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-ink)' }}>Comment / Message</label>
                                    <textarea 
                                        placeholder="Add a comment to your submission..."
                                        rows="4"
                                        value={submitForm.comment}
                                        onChange={(e) => setSubmitForm({...submitForm, comment: e.target.value})}
                                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '13px', resize: 'vertical' }}
                                    ></textarea>
                                </div>

                                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={() => setIsSubmitting(false)}
                                        style={{ padding: '8px 16px', fontSize: '12px', fontWeight: '600' }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 'bold', opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
                                    >
                                        <UploadCloud size={16} />
                                        {submitting ? 'SAVING...' : 'SAVE CHANGES'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Hàng 1 */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                            SUBMISSION STATUS
                                        </div>
                                        <span className="badge" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-ink-soft)', padding: '4px 12px', fontSize: '12px' }}>
                                            Missing
                                        </span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                            SUBMISSION TIME
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'var(--color-ink-soft)', fontWeight: '500' }}>
                                            (GMT+07)
                                        </span>
                                    </div>
                                </div>

                                {/* Hàng 2 */}
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                        LINK/FILE ASSIGNMENT
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                                        {/* Trống theo hình */}
                                    </div>
                                </div>

                                {/* Hàng 3 */}
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                        COMMENT
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-ink)' }}>
                                        —
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                </div>
            </div>
        </div>
    );
}
