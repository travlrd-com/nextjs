import { env } from '@/lib/env.server';
import { createSupabaseForRouteHandler } from '@/lib/supabase.server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const supabase = createSupabaseForRouteHandler();
  const { searchParams } = new URL(request.url);


  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (!(token_hash && type)) {
    console.error('Missing token_hash or type');
    return NextResponse.json({ error: { message: "'Missing token_hash or type in the URL." } }, { status: 400 });
  }


  let userSessionData; {
    const response = await supabase.auth.verifyOtp({ type, token_hash });

    if (response.error) {
      console.error(response.error.message);
      return NextResponse.json({ error: { message: "We couldn't verify the OTP." } }, { status: 400 });
    }

    userSessionData = response.data;
  }


  update_user_data: {
    if (!userSessionData.user) {
      console.error('Missing user data');
      return NextResponse.json({ error: { message: "We didn't receive user session data from Supabase." } }, { status: 400 });
    }

    const result = await supabase
      .from('users')
      .insert({
        user_id: userSessionData.user.id,
        email: userSessionData.user.email,
        full_name: userSessionData.user.user_metadata.full_name,
        // profile_picture_src: userSessionData.user.user_metadata.profile_picture_src,
      });

    if (result.error) {
      console.error('Error inserting user into database');
      console.error(result.error);
      return NextResponse.json({ error: { message: "We couldn't insert the user into the database." } }, { status: 400 });
    }
  }


  if (type === "email_change") {
    return NextResponse.redirect(`${env.NEXT_PUBLIC_ORIGIN}/profile`);
  }

  const next = searchParams.get('next') ?? '/';
  return NextResponse.redirect(`${env.NEXT_PUBLIC_ORIGIN}${next}`);
}