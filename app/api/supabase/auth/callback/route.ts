import { createSupabaseRouteHandlerClient } from '@/lib/supabase.server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) {
    console.error('Missing code');
    // return the user to an error page with instructions
    return NextResponse.redirect('/auth/auth-code-error');
  }

  const supabase = createSupabaseRouteHandlerClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(error);
    // return the user to an error page with instructions
    return NextResponse.redirect('/auth/auth-code-error');
  }

  return NextResponse.redirect(next);
}