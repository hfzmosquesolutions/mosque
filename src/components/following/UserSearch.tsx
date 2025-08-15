'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Loader2, UserX } from 'lucide-react';
import { searchUsersToFollow } from '@/lib/api/following';
import { FollowButton } from './FollowButton';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

interface UserSearchResult {
  id: string;
  full_name: string;
  profile_picture_url?: string;
  is_profile_private: boolean;
  is_following?: boolean;
}

interface UserSearchProps {
  onUserFollow?: (userId: string) => void;
  excludeUserIds?: string[]; // Users to exclude from search results
  maxResults?: number;
}

export function UserSearch({
  onUserFollow,
  excludeUserIds = [],
  maxResults = 10,
}: UserSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const response = await searchUsersToFollow(searchQuery, 1, maxResults);

        // Filter out excluded users and current user
        const filteredResults = response.data.filter(
          (userResult: any) =>
            userResult.id !== user?.id &&
            !excludeUserIds.includes(userResult.id)
        );

        setResults(filteredResults as UserSearchResult[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search users');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [user?.id, excludeUserIds, maxResults]
  );

  useEffect(() => {
    debouncedSearch(query);

    // Cleanup function to cancel debounced calls
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);

  const handleFollowChange = (userId: string) => {
    // Update the local state to reflect the follow change
    setResults((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, is_following: !user.is_following }
          : user
      )
    );

    // Call the parent callback if provided
    onUserFollow?.(userId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Find Users to Follow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="text-center py-8">
            <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              No users found matching "{query}"
            </p>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="space-y-3">
            {results.map((userResult) => (
              <div
                key={userResult.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={userResult.profile_picture_url} />
                    <AvatarFallback>
                      {userResult.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link
                      href={`/users/${userResult.id}`}
                      className="font-medium hover:underline"
                    >
                      {userResult.full_name}
                    </Link>
                    {userResult.is_profile_private && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Private
                      </Badge>
                    )}
                  </div>
                </div>

                <FollowButton
                  userId={userResult.id}
                  userName={userResult.full_name}
                  variant="outline"
                  size="sm"
                  onFollowChange={() => handleFollowChange(userResult.id)}
                />
              </div>
            ))}
          </div>
        )}

        {!hasSearched && !loading && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              Start typing to search for users to follow
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
