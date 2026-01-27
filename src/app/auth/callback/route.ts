import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getDashboardUrl } from '@/lib/utils/dashboard';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const returnUrl = requestUrl.searchParams.get('returnUrl');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', data.user.id)
        .maybeSingle();

      // If user hasn't completed onboarding, redirect to onboarding page
      if (!profile || !profile.onboarding_completed) {
        // Determine locale from returnUrl or default to 'ms'
        const locale = returnUrl?.match(/^\/(en|ms)\//)?.[1] || 'ms';
        const onboardingUrl = `/${locale}/onboarding`;
        
        const response = NextResponse.redirect(`${requestUrl.origin}${onboardingUrl}`);
        // Store returnUrl in a cookie as backup (expires in 5 minutes) for after onboarding
        if (returnUrl) {
          response.cookies.set('returnUrl', returnUrl, {
            maxAge: 300, // 5 minutes
            httpOnly: false,
            sameSite: 'lax',
          });
        }
        return response;
      }

      // User has completed onboarding, proceed with normal redirect
      // Get correct dashboard URL based on admin status
      const dashboardUrl = await getDashboardUrl(data.user.id);
      // Redirect to returnUrl if provided, otherwise correct dashboard
      let redirectTo = returnUrl ? decodeURIComponent(returnUrl) : dashboardUrl;
      
      // Ensure redirectTo has locale prefix (default to 'ms' if missing)
      if (!redirectTo.startsWith('/ms/') && !redirectTo.startsWith('/en/')) {
        redirectTo = `/ms${redirectTo.startsWith('/') ? redirectTo : '/' + redirectTo}`;
      }
      
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

  // If there's an error or no code, redirect to login (with locale prefix)
  return NextResponse.redirect(`${requestUrl.origin}/ms/login`);
}
