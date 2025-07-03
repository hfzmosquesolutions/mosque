'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'super_admin' | 'mosque_admin' | 'ajk' | 'member';
  membershipId?: string;
  membershipType?: string;
  joinDate?: string;
  profilePhoto?: string;
  occupation?: string;
}

interface ProfileSummaryProps {
  user: User;
  showDetails?: boolean;
  className?: string;
}

export function ProfileSummary({
  user,
  showDetails = false,
  className = '',
}: ProfileSummaryProps) {
  const { t } = useLanguage();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'mosque_admin':
        return 'default';
      case 'ajk':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.profilePhoto} alt={user.name} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.name}
          </p>
          <p className="text-sm text-gray-500 truncate">{user.email}</p>
        </div>
        <Badge variant={getRoleColor(user.role)}>
          {t(`roles.${user.role}`)}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.profilePhoto} alt={user.name} />
            <AvatarFallback className="text-lg">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-xl">{user.name}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={getRoleColor(user.role)}>
                {t(`roles.${user.role}`)}
              </Badge>
              {user.membershipId && (
                <Badge variant="outline">{user.membershipId}</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">{user.phone}</span>
            </div>
          )}
          {user.occupation && (
            <div className="flex items-center space-x-2 text-sm">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">{user.occupation}</span>
            </div>
          )}
          {user.joinDate && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                {t('members.joinDate')}:{' '}
                {new Date(user.joinDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        {user.address && (
          <div className="flex items-start space-x-2 text-sm pt-2 border-t">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
            <span className="text-gray-600">{user.address}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
