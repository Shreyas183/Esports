import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tournament, CreateTournamentForm } from '@/types';
import TournamentService from '@/services/tournaments';
import { toast } from '@/hooks/use-toast';

// Query keys for React Query
export const tournamentKeys = {
  all: ['tournaments'] as const,
  lists: () => [...tournamentKeys.all, 'list'] as const,
  list: (filters: string) => [...tournamentKeys.lists(), { filters }] as const,
  details: () => [...tournamentKeys.all, 'detail'] as const,
  detail: (id: string) => [...tournamentKeys.details(), id] as const,
  organizer: (organizerId: string) => [...tournamentKeys.all, 'organizer', organizerId] as const,
  featured: () => [...tournamentKeys.all, 'featured'] as const,
  status: (status: Tournament['status']) => [...tournamentKeys.all, 'status', status] as const,
};

// Hook for fetching all tournaments
export const useTournaments = () => {
  return useQuery({
    queryKey: tournamentKeys.lists(),
    queryFn: TournamentService.getAllTournaments,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for fetching tournaments by status
export const useTournamentsByStatus = (status: Tournament['status']) => {
  return useQuery({
    queryKey: tournamentKeys.status(status),
    queryFn: () => TournamentService.getTournamentsByStatus(status),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook for fetching tournaments by organizer
export const useTournamentsByOrganizer = (organizerId: string) => {
  return useQuery({
    queryKey: tournamentKeys.organizer(organizerId),
    queryFn: () => TournamentService.getTournamentsByOrganizer(organizerId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!organizerId,
  });
};

// Hook for fetching featured tournaments
export const useFeaturedTournaments = (limit: number = 5) => {
  return useQuery({
    queryKey: tournamentKeys.featured(),
    queryFn: () => TournamentService.getFeaturedTournaments(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook for fetching a single tournament
export const useTournament = (id: string) => {
  return useQuery({
    queryKey: tournamentKeys.detail(id),
    queryFn: () => TournamentService.getTournament(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
};

// Hook for creating a tournament
export const useCreateTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      data, 
      organizerId, 
      organizerName 
    }: { 
      data: CreateTournamentForm; 
      organizerId: string; 
      organizerName: string; 
    }) => TournamentService.createTournament(data, organizerId, organizerName),
    onSuccess: (tournamentId) => {
      toast({
        title: "Success",
        description: "Tournament created successfully",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: tournamentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tournamentKeys.featured() });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive",
      });
    },
  });
};

// Hook for updating a tournament
export const useUpdateTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: Partial<Tournament>; 
    }) => TournamentService.updateTournament(id, data),
    onSuccess: (_, { id }) => {
      toast({
        title: "Success",
        description: "Tournament updated successfully",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: tournamentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tournamentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tournamentKeys.featured() });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update tournament",
        variant: "destructive",
      });
    },
  });
};

// Hook for deleting a tournament
export const useDeleteTournament = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => TournamentService.deleteTournament(id),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tournament deleted successfully",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: tournamentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tournamentKeys.featured() });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete tournament",
        variant: "destructive",
      });
    },
  });
};

// Hook for tournament registrations
export const useTournamentRegistrations = (tournamentId: string) => {
  return useQuery({
    queryKey: [...tournamentKeys.detail(tournamentId), 'registrations'],
    queryFn: () => TournamentService.getTournamentRegistrations(tournamentId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!tournamentId,
  });
};

// Hook for tournament matches
export const useTournamentMatches = (tournamentId: string) => {
  return useQuery({
    queryKey: [...tournamentKeys.detail(tournamentId), 'matches'],
    queryFn: () => TournamentService.getTournamentMatches(tournamentId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!tournamentId,
  });
};

// Hook for tournament bracket
export const useTournamentBracket = (tournamentId: string) => {
  return useQuery({
    queryKey: [...tournamentKeys.detail(tournamentId), 'bracket'],
    queryFn: () => TournamentService.getTournamentBracket(tournamentId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!tournamentId,
  });
};

// Custom hook for tournament search and filtering
export const useTournamentSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState<Tournament['gameType'] | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<Tournament['status'] | 'all'>('all');

  const { data: tournaments, isLoading, error } = useTournaments();

  const filteredTournaments = useCallback(() => {
    if (!tournaments) return [];

    return tournaments.filter(tournament => {
      const matchesSearch = tournament.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tournament.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGame = selectedGame === 'all' || tournament.gameType === selectedGame;
      const matchesStatus = selectedStatus === 'all' || tournament.status === selectedStatus;

      return matchesSearch && matchesGame && matchesStatus;
    });
  }, [tournaments, searchTerm, selectedGame, selectedStatus]);

  return {
    tournaments: filteredTournaments(),
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    selectedGame,
    setSelectedGame,
    selectedStatus,
    setSelectedStatus,
  };
};
