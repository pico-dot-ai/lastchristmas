import { UserCard } from './modules/user/components/user-card';

export default function HomePage() {
  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">Last Christmas</h1>
        <p className="page__subtitle">
          Manage your session with Supabase passwordless magic links and keep your user info handy.
        </p>
      </header>

      <div className="page__content">
        <UserCard />
      </div>
    </main>
  );
}
