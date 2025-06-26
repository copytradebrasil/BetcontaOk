import { useQuery } from "@tanstack/react-query";

export function useAdminAuth() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/auth/status"],
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 30000, // Cache for 30 seconds to prevent excessive requests
  });

  return {
    isAuthenticated: data?.authenticated || false,
    isLoading,
    refetch,
  };
}