import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { locales } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'ms',
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  const pathname = request.nextUrl.pathname;

  // Allow static assets, API routes and special paths to bypass maintenance
  const isAssetRequest =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_vercel') ||
    /\.[^/]+$/.test(pathname);

  // Localized maintenance path e.g. /ms/maintenance or /en/maintenance
  const isMaintenancePath = /^\/(ms|en)\/maintenance\/?$/.test(pathname);

  if (isMaintenanceMode && !isAssetRequest && !isMaintenancePath) {
    const localeMatch = pathname.match(/^\/(ms|en)(\/|$)/);
    const locale = localeMatch ? localeMatch[1] : 'ms';
    const url = new URL(`/${locale}/maintenance`, request.url);
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/',
    '/(ms|en)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ]
};