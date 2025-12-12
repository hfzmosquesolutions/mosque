import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const returnUrl = requestUrl.searchParams.get('returnUrl');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Redirect to returnUrl if provided, otherwise dashboard
      const redirectTo = returnUrl ? decodeURIComponent(returnUrl) : '/dashboard';
      const response = NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);
      // Store returnUrl in a cookie as backup (expires in 5 minutes)
      if (returnUrl) {
        response.cookies.set('returnUrl', returnUrl, {
          maxAge: 300, // 5 minutes
          httpOnly: false,
          sameSite: 'lax',
        });
      }
      return response;
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
