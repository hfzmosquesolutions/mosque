'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { followUser, unfollowUser, isFollowingUser } from '@/lib/api/following';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface FollowButtonProps {
  userId: string;
  userName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  userName,
  variant = 'default',
  size = 'default',
  className,
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check initial following status
  useEffect(() => {
    const checkFollowingStatus = async () => {
      try {
        const following = await isFollowingUser(userId);
        setIsFollowing(following);
      } catch (error) {
        console.error('Error checking following status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkFollowingStatus();
  }, [userId]);

  const handleFollowToggle = async () => {
    setIsLoading(true);

    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
        onFollowChange?.(false);
        toast.success(`You are no longer following ${userName}`);
      } else {
        await followUser(userId);
        setIsFollowing(true);
        onFollowChange?.(true);
        toast.success(`You are now following ${userName}`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update following status'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      className={className}
      onClick={handleFollowToggle}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
}
