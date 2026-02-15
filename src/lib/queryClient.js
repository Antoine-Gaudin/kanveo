// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 min — données considérées fraîches
      gcTime: 10 * 60 * 1000,      // 10 min — durée en cache après unmount
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
