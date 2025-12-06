'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getSession, onAuthStateChange, requestMagicLink, signOut } from '../../auth/auth-client';
import { isSupabaseConfigured } from '../../../lib/supabase/client';
import {
  fetchProfile,
  updateProfile,
  uploadAvatar,
  type UpdateProfileInput,
} from '../user-client';
import { type UserProfile } from '../user-types';

type UserCardProps = {
  initialProfile: UserProfile | null;
  initialEmail?: string;
};

type GradientOption = {
  id: string;
  gradient: string;
  accent: string;
};

export function UserCard({ initialProfile, initialEmail = '' }: UserCardProps) {
  const [email, setEmail] = useState(initialEmail);
  const [user, setUser] = useState<UserProfile | null>(initialProfile);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSessionResolved, setIsSessionResolved] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const hasTriggeredNewProfileEdit = useRef(false);
  const userRef = useRef<UserProfile | null>(initialProfile);
  const isNewProfileEdit = useRef(false);
  const [profileDraft, setProfileDraft] = useState<UpdateProfileInput>({
    displayName: initialProfile?.displayName ?? '',
    gradientColor: initialProfile?.gradientColor ?? null,
  });
  const isSupabaseReady = isSupabaseConfigured();

  useEffect(() => {
    userRef.current = user;
    if (isNewProfileEdit.current) {
      setProfileDraft({
        displayName: '',
        gradientColor: user?.gradientColor ?? null,
      });
    } else {
      setProfileDraft({
        displayName: user?.displayName ?? '',
        gradientColor: user?.gradientColor ?? null,
      });
    }
    if (user?.email) {
      setEmail(user.email);
    } else if (!user) {
      setEmail('');
    }
  }, [user]);

  useEffect(() => {
    if (!isSupabaseReady) {
      setStatusMessage(
        'Supabase environment variables are missing. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable authentication.',
      );
      return () => undefined;
    }

    const refreshProfile = async () => {
      try {
        const { data } = await getSession();
        if (!data.session) {
          setUser(null);
          setIsSessionResolved(true);
          return;
        }
        const profile = await fetchProfile();
        setUser(profile);

        if (!hasTriggeredNewProfileEdit.current && !initialProfile && !userRef.current && profile) {
          setProfileDraft((current) => ({ ...current, displayName: '' }));
          setIsEditing(true);
          hasTriggeredNewProfileEdit.current = true;
          isNewProfileEdit.current = true;
        }
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load authentication session. Confirm Supabase configuration.',
        );
      } finally {
        setIsSessionResolved(true);
      }
    };

    void refreshProfile();

    const subscription = onAuthStateChange((_event, session) => {
      if (session?.user) {
        void refreshProfile();
      } else {
        setUser(null);
        setIsSessionResolved(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [isSupabaseReady]);

  const greeting = useMemo(() => {
    if (user?.email) {
      return `Welcome back, ${user.email}`;
    }
    return 'Sign in to get started';
  }, [user?.email]);

  const gradientOptions: GradientOption[] = [
    { id: 'ocean', gradient: 'linear-gradient(135deg, #2563eb, #0ea5e9)', accent: '#6377cb' },
    { id: 'sunset', gradient: 'linear-gradient(135deg, #f97316, #fb7185)', accent: '#e08a24' },
    { id: 'forest', gradient: 'linear-gradient(135deg, #059669, #22c55e)', accent: '#17995a' },
    { id: 'twilight', gradient: 'linear-gradient(135deg, #7c3aed, #2563eb)', accent: '#6a3bc0' },
  ];

  const selectedGradient =
    gradientOptions.find((option) => option.id === profileDraft.gradientColor) ?? gradientOptions[0];

  const challengeBadges = user?.challenges ?? [];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    if (!isSupabaseReady) {
      setStatusMessage(
        'Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to continue.',
      );
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Sending magic link...');
    setMagicLinkSent(true);

    try {
      const { error } = await requestMagicLink(email);
      if (error) {
        setStatusMessage(error.message);
        setMagicLinkSent(false);
      } else {
        setStatusMessage('Check your email!');
      }
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Unable to request a magic link. Confirm Supabase configuration.',
      );
    }

    setIsSubmitting(false);
  };

  const handleLogout = async () => {
    if (!isSupabaseReady) {
      setStatusMessage(
        'Supabase auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to continue.',
      );
      return;
    }

    setStatusMessage('');
    try {
      const { error } = await signOut('global');
      if (error) {
        throw error;
      }
      setUser(null);
      setIsEditing(false);
      hasTriggeredNewProfileEdit.current = false;
      userRef.current = null;
      setEmail('');
      setProfileDraft({ displayName: '', gradientColor: null });
      setMagicLinkSent(false);
      isNewProfileEdit.current = false;
      setIsSessionResolved(true);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Unable to sign out. Confirm Supabase configuration.',
      );
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setIsSavingProfile(true);
    setStatusMessage('');

    try {
      const updated = await updateProfile({
        displayName: profileDraft.displayName,
        gradientColor: profileDraft.gradientColor ?? null,
      });
      setUser(updated);
      setIsEditing(false);
      isNewProfileEdit.current = false;
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Unable to update your profile right now.',
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveProfile();
  };

const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const file = event.target.files[0];
    setIsUploadingAvatar(true);
    setStatusMessage('');

    try {
      const updated = await uploadAvatar(file);
      setUser(updated);
      setStatusMessage('Avatar updated.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to upload avatar.');
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  if (!isSessionResolved) {
    return null;
  }

  const visibleStatusMessage =
    statusMessage && statusMessage.trim().toLowerCase() !== 'profile updated.';

  const cardClassName = 'user-card__container';

  return (
    <section className={cardClassName}>
      {user ? (
        <form
          className={`user-card user-card__shell ${isEditing ? 'user-card__shell--editing' : ''}`}
          onSubmit={handleProfileSave}
        >
          <div className="user-card__hero" style={{ background: selectedGradient.gradient }}>
            <div className="user-card__hero-bg" />
            {isEditing ? (
              <div className="user-card__palette" aria-label="Select gradient theme">
                {gradientOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`user-card__swatch ${
                      selectedGradient.id === option.id ? 'user-card__swatch--active' : ''
                    }`}
                    style={{ background: option.gradient }}
                    onClick={() =>
                      setProfileDraft((current) => ({ ...current, gradientColor: option.id }))
                    }
                    aria-pressed={selectedGradient.id === option.id}
                  >
                    <span className="user-card__swatch-ring" />
                  </button>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              className={`user-card__mode-button ${
                isEditing ? 'user-card__mode-button--confirm' : 'user-card__mode-button--edit'
              }`}
              aria-label={isEditing ? 'Save profile' : 'Edit profile'}
              onClick={isEditing ? () => void saveProfile() : () => setIsEditing(true)}
              disabled={isSavingProfile}
            >
              {isEditing ? (
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path d="M5 10.5 8.5 14 15 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12.5 3.5 16.5 7.5 7.5 16.5H3.5V12.5L12.5 3.5Z" />
                  <path d="M11.5 5.5 14.5 8.5" />
                </svg>
              )}
            </button>

            <div className="user-card__avatar-wrapper">
              <div
                className={`user-card__avatar ${
                  isEditing || !user.avatarUrl ? 'user-card__avatar--editable' : ''
                }`}
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt="User avatar"
                    width={120}
                    height={120}
                    className="user-card__avatar-image"
                    unoptimized
                  />
                ) : (
                  <div className="user-card__avatar-fallback" aria-hidden />
                )}
                {(isEditing || !user.avatarUrl) && (
                  <label className="user-card__avatar-upload" aria-label="Upload avatar">
                    {isUploadingAvatar ? (
                      <span className="avatar-dots" aria-hidden>
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : (
                      <span className="user-card__avatar-upload-icon">+</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="user-card__avatar-input"
                      onChange={handleAvatarChange}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="user-card__body">
            <div className="user-card__fields">
              <div className="user-card__field user-card__field--muted">
                <span className="user-card__field-text">{user.email}</span>
              </div>

              <div className="user-card__field user-card__field--primary">
                {isEditing ? (
                  <input
                    aria-label="Display Name"
                    className="user-card__input user-card__input--display"
                    placeholder="Display Name"
                    value={profileDraft.displayName ?? ''}
                    style={{ color: selectedGradient.accent }}
                    onChange={(event) =>
                      setProfileDraft((current) => ({
                        ...current,
                        displayName: event.target.value,
                      }))
                    }
                    disabled={isSavingProfile}
                  />
                ) : profileDraft.displayName ? (
                  <span
                    className="user-card__field-text"
                    style={{ color: selectedGradient.accent }}
                  >
                    {profileDraft.displayName}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="user-card__challenges">
              {challengeBadges.length ? (
                challengeBadges.map((challenge) => (
                  <div key={`${challenge.name}-${challenge.status}`} className="challenge-badge">
                    <span className="challenge-badge__label">{challenge.name}</span>
                    <span
                      className={`challenge-badge__pill ${
                        challenge.status === 'in'
                          ? 'challenge-badge__pill--in'
                          : 'challenge-badge__pill--out'
                      }`}
                    >
                      {challenge.status === 'in' ? 'IN!' : 'OUT!'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="user-card__challenges-empty">No challenges yet.</p>
              )}
            </div>

            <div className="user-card__actions">
              {isEditing ? (
                <button
                  type="button"
                  className="user-card__link user-card__link--danger"
                  onClick={() =>
                    setStatusMessage('Delete account is not available yet in this preview.')
                  }
                >
                  Delete account
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                className="user-card__link"
                onClick={(event) => {
                  event.preventDefault();
                  void handleLogout();
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form
          className="user-card user-card__shell user-card__shell--login user-card__shell--editing"
          onSubmit={handleSubmit}
        >
          <div className="user-card__hero" style={{ background: selectedGradient.gradient }}>
            <div className="user-card__hero-bg" />
            <div className="user-card__avatar-wrapper">
              <div className="user-card__avatar user-card__avatar--neutral">
                <Image
                  src="/drummer_boy.png"
                  alt="Default avatar"
                  width={120}
                  height={120}
                  className="user-card__avatar-image"
                  unoptimized
                />
              </div>
            </div>
          </div>

          <div className="user-card__body">
            <div className="user-card__fields">
              <div className="user-card__field user-card__field--primary user-card__field--login-email">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="user-card__input user-card__input--email"
                  placeholder="you@email.com"
                  required
                />
              </div>
            </div>

            <p className="user-card__login-copy">
              We like to keep things simple. Enter your email above and we&apos;ll send you a link to
              log in or create a new account. No passwords, no useless info. That&apos;s it!
            </p>

            <button
              className={`button ${magicLinkSent ? 'button--magic-sent' : 'button--magic'}`}
              type="submit"
              disabled={isSubmitting || magicLinkSent}
            >
              {magicLinkSent ? 'Check your email!' : isSubmitting ? 'Sending...' : 'Send magic link'}
            </button>
          </div>
        </form>
      )}

      {visibleStatusMessage ? <p className="card__status">{visibleStatusMessage}</p> : null}
    </section>
  );
}
