import { env } from '@/lib/env.server';
import { createSupabaseForRouteHandler } from '@/lib/supabase.server';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    console.error('Missing code');
    // return the user to an error page with instructions
    return NextResponse.redirect(`${env.NEXT_PUBLIC_ORIGIN}/api/supabase/auth/callback/link-malformed/`);
  }

  const supabase = createSupabaseForRouteHandler();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(error);
    // return the user to an error page with instructions
    return NextResponse.redirect(`${env.NEXT_PUBLIC_ORIGIN}/api/supabase/auth/callback/link-did-not-work/`);
  }

  return NextResponse.redirect(next);
}