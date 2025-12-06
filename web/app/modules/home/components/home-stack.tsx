'use client';

import { useState } from 'react';
import { UserCard } from '../../user/components/user-card';
import { LittleWham } from '../../media-verification/components/little-wham';
import { type UserProfile } from '../../user/user-types';

type HomeStackProps = {
  initialProfile: UserProfile | null;
  initialEmail?: string;
};

export function HomeStack({ initialProfile, initialEmail }: HomeStackProps) {
  const [accent, setAccent] = useState<string>(initialProfile?.gradientColor ?? 'ocean');

  return (
    <div className="page__stack">
      <UserCard initialProfile={initialProfile} initialEmail={initialEmail} onAccentChange={setAccent} />
      <LittleWham gradientColor={accent} />
    </div>
  );
}
