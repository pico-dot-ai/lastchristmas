'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
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

export function UserCard({ initialProfile, initialEmail = '' }: UserCardProps) {
  const [email, setEmail] = useState(initialEmail);
  const [user, setUser] = useState<UserProfile | null>(initialProfile);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSessionResolved, setIsSessionResolved] = useState(true);
  const [profileDraft, setProfileDraft] = useState<UpdateProfileInput>({
    displayName: initialProfile?.displayName ?? '',
    firstName: initialProfile?.firstName ?? '',
    lastName: initialProfile?.lastName ?? '',
    dob: initialProfile?.dob ?? null,
  });
  const isSupabaseReady = isSupabaseConfigured();

  useEffect(() => {
    setProfileDraft({
      displayName: user?.displayName ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      dob: user?.dob ?? null,
    });
    if (user?.email) {
      setEmail(user.email);
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

    try {
      const { error } = await requestMagicLink(email);
      if (error) {
        setStatusMessage(error.message);
      } else {
        setStatusMessage('Check your email for the magic link.');
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

    try {
      await signOut();
      setUser(null);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Unable to sign out. Confirm Supabase configuration.',
      );
    }
  };

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    setStatusMessage('');

    try {
      const updated = await updateProfile(profileDraft);
      setUser(updated);
      setStatusMessage('Profile updated.');
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Unable to update your profile right now.',
      );
    } finally {
      setIsSavingProfile(false);
    }
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

  return (
    <section className="card">
      <div className="card__header">
        <p className="card__eyebrow">Auth & Users</p>
        <h2 className="card__title">{greeting}</h2>
        <p className="card__subtitle">
          Use your email address to receive a secure, passwordless magic link via Supabase.
        </p>
      </div>

      {user ? (
        <div className="card__section">
          <div className="user-avatar">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt="User avatar"
                width={96}
                height={96}
                className="user-avatar__image"
                unoptimized
              />
            ) : (
              <div className="user-avatar__placeholder" aria-hidden />
            )}
            <label className="button button--secondary">
              {isUploadingAvatar ? 'Uploading...' : 'Upload avatar'}
              <input
                type="file"
                accept="image/*"
                className="user-avatar__input"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
              />
            </label>
          </div>

          <dl className="user-details">
            <div className="user-details__row">
              <dt>ID</dt>
              <dd>{user.id}</dd>
            </div>
            <div className="user-details__row">
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="user-details__row">
              <dt>Display name</dt>
              <dd>{user.displayName}</dd>
            </div>
            <div className="user-details__row">
              <dt>First name</dt>
              <dd>{user.firstName}</dd>
            </div>
            <div className="user-details__row">
              <dt>Last name</dt>
              <dd>{user.lastName}</dd>
            </div>
            <div className="user-details__row">
              <dt>Date of birth</dt>
              <dd>{user.dob ?? '—'}</dd>
            </div>
          </dl>

          <form className="card__section auth-form" onSubmit={handleProfileSave}>
            <label htmlFor="displayName" className="auth-form__label">
              Display name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={profileDraft.displayName ?? ''}
              onChange={(event) =>
                setProfileDraft((current) => ({ ...current, displayName: event.target.value }))
              }
              className="auth-form__input"
              placeholder="Display name"
            />

            <label htmlFor="firstName" className="auth-form__label">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={profileDraft.firstName ?? ''}
              onChange={(event) =>
                setProfileDraft((current) => ({ ...current, firstName: event.target.value }))
              }
              className="auth-form__input"
              placeholder="First name"
            />

            <label htmlFor="lastName" className="auth-form__label">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={profileDraft.lastName ?? ''}
              onChange={(event) =>
                setProfileDraft((current) => ({ ...current, lastName: event.target.value }))
              }
              className="auth-form__input"
              placeholder="Last name"
            />

            <label htmlFor="dob" className="auth-form__label">
              Date of birth
            </label>
            <input
              id="dob"
              name="dob"
              type="date"
              value={profileDraft.dob ?? ''}
              onChange={(event) =>
                setProfileDraft((current) => ({ ...current, dob: event.target.value || null }))
              }
              className="auth-form__input"
            />

            <button className="button" type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Save profile'}
            </button>
          </form>

          <button type="button" className="button button--secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      ) : (
        <form className="card__section auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email" className="auth-form__label">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="auth-form__input"
            placeholder="you@example.com"
            required
          />
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send magic link'}
          </button>
        </form>
      )}

      {statusMessage ? <p className="card__status">{statusMessage}</p> : null}
    </section>
  );
}
