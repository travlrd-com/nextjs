import { env } from '@/lib/env.server';
import { createSupabaseForRouteHandler } from '@/lib/supabase.server';
import { NextResponse } from 'next/server';
import { z } from 'zod';


export async function GET(request: Request) {
  const supabase = createSupabaseForRouteHandler();
  const { searchParams } = new URL(request.url);


  const code = searchParams.get('code');
  if (!code) {
    console.error('Missing code');
    return NextResponse.json({ error: { message: "We didn't receive a code from Google." } }, { status: 400 });
  }



  let userSessionData; {
    const response = await supabase.auth.exchangeCodeForSession(code);

    if (response.error) {
      console.error(response.error.message);
      return NextResponse.json({ error: { message: "We couldn't exchange the code for a session." } }, { status: 400 });
    }

    userSessionData = response.data;
  }


  let userMetaData; {
    const result = z.object({
      name: z.string(),
      email: z.string(),
      picture: z.string(),
      full_name: z.string(),
      avatar_url: z.string(),
    }).safeParse(userSessionData.user.user_metadata);

    if (result.success === false) {
      console.error('Invalid user metadata');
      console.error(result.error);
      return NextResponse.json({ error: { message: "The user data received from Google contained errors." } }, { status: 400 });
    }

    userMetaData = result.data;
  }


  save_user_data: {
    const result = await supabase
      .from('users')
      .upsert({
        user_id: userSessionData.user.id,
        email: userSessionData.user.email,
        full_name: userMetaData.full_name,
        profile_picture_src: userMetaData.avatar_url,
      });

    if (result.error) {
      console.error('Error inserting user into database');
      console.error(result.error);
      return NextResponse.json({ error: { message: "We couldn't save the metadata returned by Google." } }, { status: 400 });
    }

    break save_user_data;
  }


  const next = searchParams.get('next') ?? '/';
  return NextResponse.redirect(`${env.NEXT_PUBLIC_ORIGIN}${next}`);
}