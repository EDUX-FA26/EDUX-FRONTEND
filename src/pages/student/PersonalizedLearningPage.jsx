import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PersonalizedLearningSection from '../../components/student/PersonalizedLearningSection';

export default function PersonalizedLearningPage() {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in w-full max-w-[1600px] mx-auto min-w-0" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PersonalizedLearningSection key={user?.id || 'guest'} />
    </div>
  );
}


