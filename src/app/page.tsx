'use client';

import { AIPersonalityWizard } from '@/components/creator/ai-wizard/AIPersonalityWizard';

export default function Home() {
  const handleComplete = (personality: any) => {
    console.log('Demo complete:', personality);
    alert('Demo completed! Check the console for personality data.');
  };

  return (
    <AIPersonalityWizard
      creatorId="demo-user"
      onComplete={handleComplete}
    />
  );
}
