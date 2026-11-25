import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { profileConfig } from '../config/profile.config';
import {
  type ChessPlatform,
  type ChessPlatformData,
  fetchChessComProfile,
  fetchLichessProfile,
  getFallbackChessComData,
  getFallbackLichessData,
  isConfiguredChessComUsername,
  isConfiguredLichessUsername,
  readCachedChessPlatform,
  writeCachedChessPlatform,
} from '../lib/chess';
import { ChessContext, type ChessContextValue } from './useChess';

export function ChessProvider({ children }: { children: ReactNode }) {
  const chessComUser = profileConfig.chess.chessCom.username;
  const lichessUser = profileConfig.chess.lichess.username;

  const hasChessCom = isConfiguredChessComUsername(chessComUser);
  const hasLichess = isConfiguredLichessUsername(lichessUser);

  const initialChessComCache = useMemo(
    () => (hasChessCom ? readCachedChessPlatform('chesscom', chessComUser) : null),
    [hasChessCom, chessComUser],
  );
  const initialLichessCache = useMemo(
    () => (hasLichess ? readCachedChessPlatform('lichess', lichessUser) : null),
    [hasLichess, lichessUser],
  );

  const [chessCom, setChessCom] = useState<ChessPlatformData>(() => {
    if (initialChessComCache) return initialChessComCache.data;
    if (!hasChessCom) return getFallbackChessComData('unconfigured');
    return { ...getFallbackChessComData('unconfigured'), status: 'loading' };
  });

  const [lichess, setLichess] = useState<ChessPlatformData>(() => {
    if (initialLichessCache) return initialLichessCache.data;
    if (!hasLichess) return getFallbackLichessData('unconfigured');
    return { ...getFallbackLichessData('unconfigured'), status: 'loading' };
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const syncPlatform = useCallback(
    async (
      platform: ChessPlatform,
      forceRefresh = false,
      signal?: AbortSignal,
    ) => {
      if (platform === 'chesscom') {
        if (!isConfiguredChessComUsername(chessComUser)) {
          setChessCom(getFallbackChessComData('unconfigured'));
          return;
        }
        if (!forceRefresh) {
          const cached = readCachedChessPlatform('chesscom', chessComUser);
          if (cached) {
            setChessCom(cached.data);
            return;
          }
        }
        try {
          const live = await fetchChessComProfile(chessComUser, signal);
          if (signal?.aborted) return;
          writeCachedChessPlatform('chesscom', chessComUser, live);
          setChessCom(live);
        } catch {
          if (signal?.aborted) return;
          setChessCom(getFallbackChessComData('error'));
        }
        return;
      }

      if (!isConfiguredLichessUsername(lichessUser)) {
        setLichess(getFallbackLichessData('unconfigured'));
        return;
      }
      if (!forceRefresh) {
        const cached = readCachedChessPlatform('lichess', lichessUser);
        if (cached) {
          setLichess(cached.data);
          return;
        }
      }
      try {
        const live = await fetchLichessProfile(lichessUser, signal);
        if (signal?.aborted) return;
        writeCachedChessPlatform('lichess', lichessUser, live);
        setLichess(live);
      } catch {
        if (signal?.aborted) return;
        setLichess(getFallbackLichessData('error'));
      }
    },
    [chessComUser, lichessUser],
  );

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (hasChessCom && !initialChessComCache) {
      void (async () => {
        try {
          const live = await fetchChessComProfile(chessComUser, controller.signal);
          if (!active || controller.signal.aborted) return;
          writeCachedChessPlatform('chesscom', chessComUser, live);
          setChessCom(live);
        } catch {
          if (!active || controller.signal.aborted) return;
          setChessCom(getFallbackChessComData('error'));
        }
      })();
    }

    if (hasLichess && !initialLichessCache) {
      void (async () => {
        try {
          const live = await fetchLichessProfile(lichessUser, controller.signal);
          if (!active || controller.signal.aborted) return;
          writeCachedChessPlatform('lichess', lichessUser, live);
          setLichess(live);
        } catch {
          if (!active || controller.signal.aborted) return;
          setLichess(getFallbackLichessData('error'));
        }
      })();
    }

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    hasChessCom,
    hasLichess,
    initialChessComCache,
    initialLichessCache,
    chessComUser,
    lichessUser,
  ]);

  const refresh = useCallback(
    async (platform?: ChessPlatform) => {
      setIsRefreshing(true);
      try {
        if (platform) {
          await syncPlatform(platform, true);
        } else {
          await Promise.all([
            syncPlatform('chesscom', true),
            syncPlatform('lichess', true),
          ]);
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [syncPlatform],
  );

  const topOverallRating = useMemo(() => {
    const candidates: Array<{
      platform: ChessPlatform;
      label: string;
      rating: number;
    }> = [];
    if (chessCom.status === 'live' && chessCom.topRating) {
      candidates.push({ platform: 'chesscom', ...chessCom.topRating });
    }
    if (lichess.status === 'live' && lichess.topRating) {
      candidates.push({ platform: 'lichess', ...lichess.topRating });
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.rating - a.rating);
    return candidates[0];
  }, [chessCom.status, chessCom.topRating, lichess.status, lichess.topRating]);

  const value = useMemo<ChessContextValue>(
    () => ({
      chessCom,
      lichess,
      isRefreshing,
      topOverallRating,
      refresh,
    }),
    [chessCom, lichess, isRefreshing, topOverallRating, refresh],
  );

  return <ChessContext.Provider value={value}>{children}</ChessContext.Provider>;
}
