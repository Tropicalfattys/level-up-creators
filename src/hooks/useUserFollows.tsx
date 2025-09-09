
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface FollowedCreator {
  id: string;
  user_id: string;
  handle: string;
  avatar_url?: string;
  headline?: string;
}

export const useUserFollows = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch follows from database with current user profile data
  const { data: followedCreators = [], isLoading } = useQuery({
    queryKey: ['user-follows', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get follow relationships first
      const { data: follows, error: followsError } = await supabase
        .from('user_follows')
        .select('followed_user_id')
        .eq('follower_id', user.id);

      if (followsError) {
        console.error('Error fetching follows:', followsError);
        return [];
      }

      if (!follows || follows.length === 0) return [];

      const userIds = follows.map(f => f.followed_user_id);

      // Get user profiles for followed creators with avatar_url
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, handle, avatar_url')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching user profiles:', usersError);
        return [];
      }

      // Get creator data for headlines
      const { data: creators, error: creatorsError } = await supabase
        .from('creators')
        .select('user_id, headline')
        .in('user_id', userIds);

      if (creatorsError) {
        console.error('Error fetching creator data:', creatorsError);
      }

      // Combine the data
      return users.map(user => {
        const creator = creators?.find(c => c.user_id === user.id);
        return {
          id: user.id,
          user_id: user.id,
          handle: user.handle || '',
          avatar_url: user.avatar_url, // Now included since database functions return avatar_url
          headline: creator?.headline || undefined
        };
      }) as FollowedCreator[];
    },
    enabled: !!user?.id,
  });

  // No localStorage migration needed - keep it simple

  // Add follow mutation
  const addFollowMutation = useMutation({
    mutationFn: async (creator: FollowedCreator) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          followed_user_id: creator.user_id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-follows', user?.id] });
    },
  });

  // Remove follow mutation
  const removeFollowMutation = useMutation({
    mutationFn: async (creatorUserId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followed_user_id', creatorUserId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-follows', user?.id] });
    },
  });

  const addFollow = (creator: FollowedCreator) => {
    addFollowMutation.mutate(creator);
  };

  const removeFollow = (creatorUserId: string) => {
    removeFollowMutation.mutate(creatorUserId);
  };

  const isFollowing = (creatorUserId: string) => {
    return followedCreators.some(c => c.user_id === creatorUserId);
  };

  return {
    followedCreators,
    addFollow,
    removeFollow,
    isFollowing,
    isLoading: isLoading || addFollowMutation.isPending || removeFollowMutation.isPending
  };
};
