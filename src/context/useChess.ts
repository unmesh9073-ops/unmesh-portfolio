import { createContext, useContext } from 'react';
import type { ChessPlatform, ChessPlatformData } from '../lib/chess';

export interface ChessContextValue {
  chessCom: ChessPlatformData;
  lichess: ChessPlatformData;
  isRefreshing: boolean;
  topOverallRating: { platform: ChessPlatform; label: string; rating: number } | null;
  refresh: (platform?: ChessPlatform) => Promise<void>;
}

export const ChessContext = createContext<ChessContextValue | undefined>(undefined);

export function useChess(): ChessContextValue {
  const ctx = useContext(ChessContext);
  if (!ctx) {
    throw new Error('useChess must be used within a ChessProvider');
  }
  return ctx;
}
