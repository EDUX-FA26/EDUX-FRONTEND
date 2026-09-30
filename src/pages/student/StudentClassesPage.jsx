import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ClassService from '../../services/class.service';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Search, RotateCw, FolderOpen, ArrowRight, AlertCircle } from 'lucide-react';

export default function StudentClassesPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const activeSemester = searchParams.get('semester') || 'TERM1';

    const fetchClasses = () => {
        setLoading(true);
        ClassService.getStudentClasses(user?.id, { semester: activeSemester })
            .then(res => {
                const listData = res?.data || res || [];
                let parsedClasses = Array.isArray(listData) ? listData : listData.data || [];
                
                setClasses(parsedClasses);
                setError(null);
            })
            .catch(err => {
                setClasses([]);
                setError(err.response?.data?.message || 'Lỗi API. Hiển thị dữ liệu mẫu.');
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchClasses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSemester]);

    const handleSemesterChange = (semester) => {
        setSearchParams({ semester });
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1152px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            
            {/* Header Greeting & Title */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '8px' }}>
                <div>
                    <p style={{ fontSize: '12px', color: 'var(--color-ink-muted)', marginBottom: '4px' }}>Welcome back, Student</p>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-ink)', margin: 0 }}>My Courses</h1>
                </div>
                <button className="btn btn-secondary" onClick={fetchClasses} style={{ height: '36px', fontSize: '13px', padding: '0 12px' }}>
                    <RotateCw size={16} /> Refresh
                </button>
            </div>

            {/* Banner */}
            <div style={{ backgroundColor: 'var(--color-accent-teal-light)', border: '1px solid var(--color-accent-teal)', color: 'var(--color-accent-teal)', fontSize: '12px', padding: '10px 16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>Cached 10 min ago. Data auto-refreshes every 60 min.</span>
            </div>

            {/* Khung Semester & Danh sách môn học */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                
                {/* Sidebar Semester */}
                <div className="card" style={{ width: '180px', padding: '16px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                        <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--color-ink)' }}>Semesters</span>
                        <span className="badge badge-teal">6</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-ink-soft)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Trial</div>
                        
                        <div style={{ fontSize: '10px', color: 'var(--color-ink-soft)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Summer</div>
                        {['SUMMER_2026', 'SUMMER_2025'].map(sem => (
                            <div 
                                key={sem}
                                onClick={() => handleSemesterChange(sem)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '13px',
                                    transition: '0.2s',
                                    backgroundColor: activeSemester === sem ? 'var(--color-primary)' : 'transparent',
                                    color: activeSemester === sem ? '#fff' : 'var(--color-ink)'
                                }}
                            >
                                {sem.split('_')[1]}
                            </div>
                        ))}

                        <div style={{ fontSize: '10px', color: 'var(--color-ink-soft)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Spring</div>
                        {['TERM1'].map(sem => (
                            <div 
                                key={sem}
                                onClick={() => handleSemesterChange(sem)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '13px',
                                    transition: '0.2s',
                                    backgroundColor: activeSemester === sem ? 'var(--color-primary)' : 'transparent',
                                    color: activeSemester === sem ? '#fff' : 'var(--color-ink)'
                                }}
                            >
                                {sem.split('_')[1]}
                            </div>
                        ))}

                        <div style={{ fontSize: '10px', color: 'var(--color-ink-soft)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Fall</div>
                        {['FALL_2026', 'FALL_2025'].map(sem => (
                            <div 
                                key={sem}
                                onClick={() => handleSemesterChange(sem)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '13px',
                                    transition: '0.2s',
                                    backgroundColor: activeSemester === sem ? 'var(--color-primary)' : 'transparent',
                                    color: activeSemester === sem ? '#fff' : 'var(--color-ink)'
                                }}
                            >
                                {sem.split('_')[1]}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cards Grid Container */}
                <div style={{ flex: '1', minWidth: 0 }}>
                    {/* Search Bar */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                        <div style={{ position: 'relative', width: '280px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-soft)' }} />
                            <input type="text" className="input" placeholder="Search courses..." style={{ paddingLeft: '36px' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {loading ? (
                            <>
                                <div className="skeleton" style={{ height: '200px' }}></div>
                                <div className="skeleton" style={{ height: '200px' }}></div>
                                <div className="skeleton" style={{ height: '200px' }}></div>
                            </>
                        ) : error && classes.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', padding: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius-md)', border: '1px solid rgba(220, 38, 38, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        ) : classes.length === 0 ? (
                            <div className="card" style={{ gridColumn: '1 / -1', padding: '48px 0', textAlign: 'center', color: 'var(--color-ink-muted)' }}>
                                <FolderOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                                <p style={{ fontSize: '14px', fontWeight: '500' }}>Không tìm thấy lớp học nào trong học kỳ này.</p>
                            </div>
                        ) : (
                            classes.map(course => (
                                <div className="card" key={course.id || course._id} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                                            {course.subject_code || 'CODE'}
                                        </div>
                                        <span className="badge badge-orange">General</span>
                                    </div>
                                    
                                    <div>
                                        
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '4px 0', color: 'var(--color-ink)', lineHeight: '1.4' }}>{course.subject_name || course.name}</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>Class: <strong>{course.class_code || course.class_name || 'N/A'}</strong> | GV: <strong>{course.lecturer_name || 'Chưa cập nhật'}</strong></p>
                                    </div>
                                    
                                    <div 
                                        onClick={() => navigate(`/student/classes/${course.id || course._id}`)}
                                        style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: 'var(--color-ink-muted)', cursor: 'pointer' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-ink-muted)'; }}
                                    >
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FolderOpen size={16} /> Vào lớp học</span>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
