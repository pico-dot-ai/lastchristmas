import { getServerComponentSupabaseClient } from './lib/supabase/server';
import { fetchOrCreateProfile } from './modules/user/profile-service';
import { HomeStack } from './modules/home/components/home-stack';

// Ensure dynamic rendering so auth cookies are available.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await getServerComponentSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await fetchOrCreateProfile(supabase, user) : null;

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">Last Christmas</h1>
        <p className="page__subtitle">
          Manage your session with Supabase passwordless magic links and keep your user info handy.
        </p>
      </header>

      <div className="page__content">
        <HomeStack initialProfile={profile} initialEmail={user?.email ?? ''} />
      </div>
    </main>
  );
}
