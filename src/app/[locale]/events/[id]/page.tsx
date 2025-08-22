import { redirect } from 'next/navigation';
import { RUNTIME_FEATURES } from '@/lib/utils';

// Force dynamic rendering to prevent build-time prerendering
export const dynamic = 'force-dynamic';

export default function LocalizedEventDetailPage() {
  // Redirect to dashboard if events are not visible
  if (!RUNTIME_FEATURES.EVENTS_VISIBLE) {
    redirect('/dashboard');
  }

  // If events are visible, this would render the full event detail page
  // For now, just redirect since events are hidden
  redirect('/dashboard');
}
