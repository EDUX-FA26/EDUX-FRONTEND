import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import ProjectWorkspace from '../../components/student/ProjectWorkspace';
import '../../components/student/ProjectWorkspace.css';

export default function StudentProjectsPage() {
  const { classId } = useParams();
  const navigate = useNavigate();

  return (
    <main className="edux-projects-page">
      <nav className="edux-projects-breadcrumb" aria-label="Breadcrumb">
        <button type="button" onClick={() => navigate('/student/classes')}>
          <Home size={15} /> Lớp học
        </button>
        <ChevronRight size={14} aria-hidden="true" />
        <button type="button" onClick={() => navigate(`/student/classes/${classId}`)}>
          Chi tiết lớp
        </button>
        <ChevronRight size={14} aria-hidden="true" />
        <span aria-current="page">Projects</span>
      </nav>

      <button
        type="button"
        className="edux-projects-back"
        onClick={() => navigate(`/student/classes/${classId}`)}
      >
        <ArrowLeft size={16} /> Quay lại lớp học
      </button>

      <ProjectWorkspace classId={classId} />
    </main>
  );
}
