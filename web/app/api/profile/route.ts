import { NextRequest, NextResponse } from 'next/server';
import { getRouteHandlerSupabaseClient } from '../../lib/supabase/server';
import { fetchOrCreateProfile, upsertProfileForUser } from '../../modules/user/profile-service';

export async function GET(request: NextRequest) {
  const supabase = getRouteHandlerSupabaseClient(request);
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await fetchOrCreateProfile(supabase, user);
    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load profile.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = getRouteHandlerSupabaseClient(request);
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  try {
    const profile = await upsertProfileForUser(supabase, user, {
      displayName: body.displayName,
      firstName: body.firstName,
      lastName: body.lastName,
      dob: body.dob ?? null,
      avatarUrl: body.avatarUrl,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update profile.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
