'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuthState } from '@/hooks/useAuth.v2';
export default function UserSubmissionsDashboard() {
  const { profile } = useAuthState();
  const canManageMosque =
    profile?.role === 'super_admin' || profile?.role === 'mosque_admin';
  return (
    <div className="space-y-6">
      {' '}
      <div>
        {' '}
        <h1 className="text-2xl font-bold mb-2">Mosque Management</h1>{' '}
        <p className="text-gray-600">
          {' '}
          Manage your mosque profile and information{' '}
        </p>{' '}
      </div>{' '}
      {canManageMosque ? (
        <Card>
          {' '}
          <CardHeader>
            {' '}
            <CardTitle className="flex items-center gap-2">
              {' '}
              <Building className="h-5 w-5" /> Mosque Profile Management{' '}
            </CardTitle>{' '}
          </CardHeader>{' '}
          <CardContent className="space-y-4">
            {' '}
            <p className="text-gray-600">
              {' '}
              You can now directly manage your mosque profile without the need
              for submissions and approvals. Click the button below to access
              the mosque profile management page.{' '}
            </p>{' '}
            <Link href="/mosque-profile">
              {' '}
              <Button className="flex items-center gap-2">
                {' '}
                <Building className="h-4 w-4" /> Manage Mosque Profile{' '}
                <ArrowRight className="h-4 w-4" />{' '}
              </Button>{' '}
            </Link>{' '}
          </CardContent>{' '}
        </Card>
      ) : (
        <Card>
          {' '}
          <CardHeader>
            {' '}
            <CardTitle>Access Restricted</CardTitle>{' '}
          </CardHeader>{' '}
          <CardContent>
            {' '}
            <Alert>
              {' '}
              <AlertDescription>
                {' '}
                You don't have permission to manage mosque profiles. Please
                contact your administrator if you need access.{' '}
              </AlertDescription>{' '}
            </Alert>{' '}
          </CardContent>{' '}
        </Card>
      )}{' '}
    </div>
  );
}
