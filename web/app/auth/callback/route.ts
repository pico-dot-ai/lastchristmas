import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseEnv } from '../../lib/supabase/server';

export async function GET(request: NextRequest) {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();
  const code = request.nextUrl.searchParams.get('code');
  const redirectUrl = new URL('/', request.url);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        response.cookies.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${redirectUrl.toString()}?error=${encodeURIComponent(error.message ?? 'Auth error')}`);
    }
  }

  return response;
}
