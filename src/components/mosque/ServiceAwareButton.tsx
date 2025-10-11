'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Lock, Info } from 'lucide-react';

interface ServiceAwareButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  serviceId: string;
  enabledServices: string[];
  disabledMessage?: string;
  showServiceStatus?: boolean;
}

const SERVICE_LABELS: Record<string, string> = {
  daily_prayers: 'Daily Prayers',
  friday_prayers: 'Friday Prayers',
  khairat_management: 'Khairat Management',
  kariah_management: 'Kariah Management',
  events_management: 'Events Management',
  donations: 'Donations',
  announcements: 'Announcements',
  mosque_profile: 'Public Profile'
};

export function ServiceAwareButton({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'default',
  className = '',
  serviceId,
  enabledServices,
  disabledMessage,
  showServiceStatus = false
}: ServiceAwareButtonProps) {
  const isServiceEnabled = enabledServices.includes(serviceId);
  const isDisabled = disabled || !isServiceEnabled;
  const serviceName = SERVICE_LABELS[serviceId] || serviceId;

  const defaultDisabledMessage = `This feature requires ${serviceName} to be enabled by the mosque administrator.`;

  const button = (
    <Button
      onClick={isServiceEnabled ? onClick : undefined}
      disabled={isDisabled}
      variant={isServiceEnabled ? variant : 'outline'}
      size={size}
      className={`${className} ${!isServiceEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
      {!isServiceEnabled && <Lock className="h-4 w-4 ml-2" />}
    </Button>
  );

  if (!isServiceEnabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-medium mb-1">{serviceName} Not Available</p>
              <p className="text-sm text-muted-foreground">
                {disabledMessage || defaultDisabledMessage}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (showServiceStatus) {
    return (
      <div className="flex items-center gap-2">
        {button}
        <Badge variant="secondary" className="text-xs">
          <Info className="h-3 w-3 mr-1" />
          {serviceName}
        </Badge>
      </div>
    );
  }

  return button;
}
