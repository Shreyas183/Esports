import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { UserRole } from '@/types';
import { toast } from './use-toast';

// Hook for checking user permissions
export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = useCallback((role: UserRole) => {
    return user?.role === role;
  }, [user?.role]);

  const hasAnyRole = useCallback((roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  const isAdmin = useCallback(() => {
    return hasRole('admin');
  }, [hasRole]);

  const isOrganizer = useCallback(() => {
    return hasAnyRole(['organizer', 'admin']);
  }, [hasAnyRole]);

  const isPlayer = useCallback(() => {
    return hasAnyRole(['player', 'organizer', 'admin']);
  }, [hasAnyRole]);

  const isViewer = useCallback(() => {
    return hasAnyRole(['viewer', 'player', 'organizer', 'admin']);
  }, [hasAnyRole]);

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isOrganizer,
    isPlayer,
    isViewer,
  };
};

// Hook for user profile management
export const useUserProfile = () => {
  const { user, updateUserProfile } = useAuth();

  const updateGameId = useCallback(async (gameType: 'BGMI' | 'FREE_FIRE', gameId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateUserProfile({
        gameIds: {
          ...user.gameIds,
          [gameType]: gameId
        }
      });
    } catch (error) {
      console.error('Error updating game ID:', error);
    }
  }, [user, updateUserProfile]);

  const updateDisplayName = useCallback(async (displayName: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateUserProfile({ displayName });
    } catch (error) {
      console.error('Error updating display name:', error);
    }
  }, [user, updateUserProfile]);

  const updatePhotoURL = useCallback(async (photoURL: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateUserProfile({ photoURL });
    } catch (error) {
      console.error('Error updating photo URL:', error);
    }
  }, [user, updateUserProfile]);

  return {
    updateGameId,
    updateDisplayName,
    updatePhotoURL,
  };
};

// Hook for authentication status
export const useAuthStatus = () => {
  const { user, loading } = useAuth();

  const isAuthenticated = !!user;
  const isAnonymous = user?.role === 'viewer';
  const isVerified = user && user.role !== 'viewer';

  return {
    isAuthenticated,
    isAnonymous,
    isVerified,
    loading,
  };
};

// Hook for role-based navigation
export const useRoleNavigation = () => {
  const { user } = useAuth();
  const { isAdmin, isOrganizer, isPlayer } = usePermissions();

  const getDefaultRoute = useCallback(() => {
    if (!user) return '/auth';
    
    if (isAdmin()) return '/dashboard';
    if (isOrganizer()) return '/dashboard';
    if (isPlayer()) return '/dashboard';
    
    return '/dashboard';
  }, [user, isAdmin, isOrganizer, isPlayer]);

  const getAvailableRoutes = useCallback(() => {
    const routes = ['/dashboard'];
    
    if (isOrganizer()) {
      routes.push('/tournament/create');
    }
    
    if (isPlayer()) {
      routes.push('/teams');
    }
    
    return routes;
  }, [isOrganizer, isPlayer]);

  return {
    getDefaultRoute,
    getAvailableRoutes,
  };
};
