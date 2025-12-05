import { NextRequest, NextResponse } from 'next/server';
import { getRouteHandlerSupabaseClient } from '../../../lib/supabase/server';
import { upsertProfileForUser } from '../../../modules/user/profile-service';

const AVATAR_BUCKET = 'avatars';

export async function POST(request: NextRequest) {
  const supabase = getRouteHandlerSupabaseClient(request);
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const fileExt = file.name?.split('.').pop() || 'bin';
  const fileName = `${Date.now()}.${fileExt}`;
  const path = `${session.user.id}/${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError || !uploadData) {
    return NextResponse.json(
      { error: uploadError?.message ?? 'Unable to upload avatar.' },
      { status: 500 },
    );
  }

  try {
    const profile = await upsertProfileForUser(supabase, session.user, {
      avatarUrl: uploadData.path,
    });

    const { data: signed } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(uploadData.path, 60 * 60);

    return NextResponse.json({ profile: { ...profile, avatarUrl: signed?.signedUrl ?? null } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update avatar.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
