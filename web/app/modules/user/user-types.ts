export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  dob: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
  challenges?: UserChallenge[];
};

export type UserChallenge = {
  name: string;
  status: 'in' | 'out';
};
