'use client';

import { useEffect, useMemo, useState } from 'react';
import { requestMagicLink, signOut, getSession, onAuthStateChange } from '../../auth/auth-client';
import { getCurrentUserProfile, mapUserToProfile, type UserProfile } from '../user-client';

const formatEmailStatus = (isConfirmed: boolean) =>
  isConfirmed ? 'Verified email' : 'Email not yet verified';

export function UserCard() {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await getSession();
      if (data.session?.user) {
        setUser(mapUserToProfile(data.session.user));
      } else {
        const profile = await getCurrentUserProfile();
        setUser(profile);
      }
    };

    loadSession();

    const subscription = onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUserToProfile(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const greeting = useMemo(() => {
    if (user?.email) {
      return `Welcome back, ${user.email}`;
    }
    return 'Sign in to get started';
  }, [user?.email]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setStatusMessage('Sending magic link...');

    const { error } = await requestMagicLink(email);
    if (error) {
      setStatusMessage(error.message);
    } else {
      setStatusMessage('Check your email for the magic link.');
    }

    setIsSubmitting(false);
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
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
