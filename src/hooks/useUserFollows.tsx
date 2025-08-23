
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface FollowedCreator {
  id: string;
  user_id: string;
  handle: string;
  avatar_url?: string;
  headline?: string;
}

export const useUserFollows = () => {
  const { user } = useAuth();
  const [followedCreators, setFollowedCreators] = useState<FollowedCreator[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    // Get followed creators from localStorage
    const followsKey = `user_follows_${user.id}`;
    const storedFollows = localStorage.getItem(followsKey);
    
    if (storedFollows) {
      try {
        const follows = JSON.parse(storedFollows);
        setFollowedCreators(follows);
      } catch (error) {
        console.error('Error parsing follows from localStorage:', error);
      }
    }
  }, [user?.id]);

  const addFollow = (creator: FollowedCreator) => {
    if (!user?.id) return;
    
    const followsKey = `user_follows_${user.id}`;
    const updatedFollows = [...followedCreators, creator];
    
    setFollowedCreators(updatedFollows);
    localStorage.setItem(followsKey, JSON.stringify(updatedFollows));
  };

  const removeFollow = (creatorUserId: string) => {
    if (!user?.id) return;
    
    const followsKey = `user_follows_${user.id}`;
    const updatedFollows = followedCreators.filter(c => c.user_id !== creatorUserId);
    
    setFollowedCreators(updatedFollows);
    localStorage.setItem(followsKey, JSON.stringify(updatedFollows));
  };

  const isFollowing = (creatorUserId: string) => {
    return followedCreators.some(c => c.user_id === creatorUserId);
  };

  return {
    followedCreators,
    addFollow,
    removeFollow,
    isFollowing
  };
};
