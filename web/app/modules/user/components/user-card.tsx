'use client';

import { useEffect, useMemo, useState } from 'react';
import { requestMagicLink, signOut, getSession, onAuthStateChange } from '../../auth/auth-client';
import { isSupabaseConfigured } from '../../../lib/supabase/client';
import { getCurrentUserProfile, mapUserToProfile, type UserProfile } from '../user-client';

const formatEmailStatus = (isConfirmed: boolean) =>
  isConfirmed ? 'Verified email' : 'Email not yet verified';

export function UserCard() {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSupabaseReady = isSupabaseConfigured();

  useEffect(() => {
    if (!isSupabaseReady) {
      setStatusMessage(
        'Supabase environment variables are missing. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable authentication.',
      );
      return () => undefined;
    }

    const loadSession = async () => {
      try {
        const { data } = await getSession();
        if (data.session?.user) {
          setUser(mapUserToProfile(data.session.user));
        } else {
          const profile = await getCurrentUserProfile();
          setUser(profile);
        }
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load authentication session. Confirm Supabase configuration.',
        );
      }
    };

    void loadSession();

    const subscription = onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUserToProfile(session.user) : null);
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
              <dt>Status</dt>
              <dd>{formatEmailStatus(user.emailConfirmed)}</dd>
            </div>
          </dl>
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
