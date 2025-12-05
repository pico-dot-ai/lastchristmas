export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string | null;
  gradientColor?: string | null;
  challenges?: UserChallenge[];
};

export type UserChallenge = {
  name: string;
  status: 'in' | 'out';
};
