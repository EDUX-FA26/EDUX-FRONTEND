import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PersonalizedLearningSection from '../../components/student/PersonalizedLearningSection';

export default function PersonalizedLearningPage() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PersonalizedLearningSection key={user?.id || 'guest'} />
    </div>
  );
}


