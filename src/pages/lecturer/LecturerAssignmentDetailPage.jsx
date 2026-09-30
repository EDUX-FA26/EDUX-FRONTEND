import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, FileText, ChevronDown, Briefcase, UploadCloud, X as XIcon, File as FileIcon } from 'lucide-react';
import AssignmentService from '../../services/assignment.service';
import SubmissionService from '../../services/submission.service';
import ClassService from '../../services/class.service';

export default function LecturerAssignmentDetailPage() {
    const { id } = useParams();
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                if (id && !id.startsWith('asm-')) {
                    const assignDataRaw = await AssignmentService.getAssignmentDetail(id);
                    const assignData = assignDataRaw.data || assignDataRaw;
                    setAssignment(assignData);

                    let classMembers = [];
                    if (assignData && assignData.class_id) {
                        try {
                            const membersRes = await ClassService.getClassMembers(assignData.class_id);
                            if (membersRes && membersRes.data) {
                                classMembers = membersRes.data;
                            }
                        } catch (e) {
                            console.error("Failed to fetch class members", e);
                        }
                    }

                    const subData = await SubmissionService.getAssignmentSubmissions(id);
                    let submissionsData = [];
                    if (subData && subData.data) {
                        submissionsData = subData.data;
                    }

                    // Merge class members with submissions
                    if (classMembers.length > 0) {
                        const combined = classMembers.map(m => {
                            const sub = submissionsData.find(s => s.student_id === m.student_id);
                            if (sub) return sub;
                            return {
                                id: `missing-${m.student_id}`,
                                student_id: m.student_id,
                                student_name: m.full_name || m.student_name,
                                student_email: m.email || m.student_email,
                                student_code: m.student_code,
                                status: 'Missing',
                                latest_files: null,
                                latest_note: null,
                                submitted_at: null
                            };
                        });
                        setSubmissions(combined);
                    } else {
                        setSubmissions(submissionsData);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch assignment details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    const handleDownloadFile = async (submissionId, fileId) => {
        try {
            const res = await SubmissionService.getSubmissionFile(submissionId, fileId);
            if (res.success && res.data.url) {
                const a = document.createElement("a");
                a.href = res.data.url;
                a.target = "_blank";
                a.download = "";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error("Failed to download file:", error);
            alert("Có lỗi xảy ra khi tải file.");
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
    
    const title = assignment?.title || titleMap[id] || `Assignment \${id}`;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1152px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px 0' }}>
            
            {/* Breadcrumbs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '500' }}>
                <Link to="/lecturer/classes" style={{ color: 'var(--color-primary)', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>Home</Link>
                <span style={{ color: 'var(--color-ink-muted)' }}>/</span>
                <Link to="/lecturer/classes/mock-1" style={{ color: 'var(--color-primary)', textDecoration: 'none', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                    Server-Side development with NodeJS...
                </Link>
                <span style={{ color: 'var(--color-ink-muted)' }}>/</span>
                <span style={{ color: 'var(--color-ink-soft)' }}>{title}</span>
            </nav>

            {/* Page Title & Submit Action Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-ink)', margin: 0, letterSpacing: '-0.5px' }}>{title}</h1>
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
                                    {submissions.length > 0 ? submissions.map((sub, index) => {
                                        let files = [];
                                        try {
                                            if (sub.latest_files) {
                                                files = typeof sub.latest_files === 'string' ? JSON.parse(sub.latest_files) : sub.latest_files;
                                            }
                                        } catch(e){}

                                        return (
                                        <tr key={sub.id || index} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>
                                                {sub.student_name || sub.student_email || 'Unknown Student'}
                                                <div style={{ fontSize: '10px', color: 'var(--color-ink-muted)' }}>{sub.student_code || ''}</div>
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                {sub.status === 'submitted' ? (
                                                    <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', padding: '4px 8px', fontSize: '10px', border: '1px solid #16a34a' }}>Submitted</span>
                                                ) : (
                                                    <span className="badge" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-ink-soft)', padding: '4px 8px', fontSize: '10px' }}>{sub.status || 'Missing'}</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '8px' }}>{sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : '-'}</td>
                                            <td style={{ padding: '8px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {files && files.length > 0 ? files.map(file => (
                                                        <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <FileIcon size={12} style={{ color: 'var(--color-primary)' }} />
                                                            <a 
                                                                href="#" 
                                                                style={{ fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}
                                                                onClick={(e) => { e.preventDefault(); handleDownloadFile(sub.id, file.id); }}
                                                                onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} 
                                                                onMouseLeave={e => e.currentTarget.style.textDecoration='none'}
                                                            >
                                                                {file.name}
                                                            </a>
                                                        </div>
                                                    )) : (
                                                        <span style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>-</span>
                                                    )}
                                                    {sub.latest_note && (
                                                        <div style={{ fontSize: '10px', color: 'var(--color-ink-soft)', fontStyle: 'italic', marginTop: '4px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            Note: {sub.latest_note}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '10px', opacity: sub.status === 'Missing' ? 0.5 : 1, cursor: sub.status === 'Missing' ? 'not-allowed' : 'pointer' }} disabled={sub.status === 'Missing'} onClick={() => alert('Grade feature coming soon')}>Grade</button>
                                            </td>
                                        </tr>
                                    )}) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '16px', textAlign: 'center', color: 'var(--color-ink-muted)' }}>No submissions yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
