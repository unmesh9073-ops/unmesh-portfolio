import { profileConfig } from '../config/profile.config';

export type ChessPlatform = 'chesscom' | 'lichess';
export type ChessSyncStatus = 'loading' | 'live' | 'fallback';

export interface ChessRatingEntry {
  key: string;
  label: string;
  current: number;
  best?: number;
  prog?: number;
  games?: number;
  record?: { win: number; draw: number; loss: number };
}

export interface ChessMatchItem {
  id: string;
  opponent: string;
  opponentRating: number;
  timeClass: string;
  result: 'Win' | 'Loss' | 'Draw';
  opening?: string;
  accuracy?: number;
  playedAt: number;
  url: string;
}

export interface ChessPlatformData {
  platform: ChessPlatform;
  username: string;
  profileUrl: string;
  status: ChessSyncStatus;
  statusReason: 'unconfigured' | 'error' | 'live';
  ratings: ChessRatingEntry[];
  topRating: { label: string; rating: number } | null;
  recentGames: ChessMatchItem[];
  totalGames?: number;
}

interface ChessApiPlayer {
  username?: string;
  url?: string;
}

interface ChessApiStatBucket {
  last?: { rating?: number };
  best?: { rating?: number };
  record?: { win?: number; loss?: number; draw?: number };
}

interface ChessApiStats {
  chess_rapid?: ChessApiStatBucket;
  chess_blitz?: ChessApiStatBucket;
  chess_bullet?: ChessApiStatBucket;
  tactics?: { highest?: { rating?: number } };
}

interface ChessApiGameSide {
  username?: string;
  rating?: number;
  result?: string;
}

interface ChessApiGame {
  url?: string;
  time_class?: string;
  end_time?: number;
  white?: ChessApiGameSide;
  black?: ChessApiGameSide;
  accuracies?: { white?: number; black?: number };
}

interface LichessPerfBucket {
  games?: number;
  rating?: number;
  prog?: number;
}

interface LichessApiUser {
  id?: string;
  username?: string;
  url?: string;
  perfs?: {
    rapid?: LichessPerfBucket;
    blitz?: LichessPerfBucket;
    bullet?: LichessPerfBucket;
    classical?: LichessPerfBucket;
    puzzle?: LichessPerfBucket;
  };
  count?: {
    all?: number;
    win?: number;
    loss?: number;
    draw?: number;
  };
}

interface LichessPlayerSide {
  user?: { name?: string; id?: string };
  rating?: number;
}

interface LichessNdjsonGame {
  id?: string;
  speed?: string;
  status?: string;
  winner?: 'white' | 'black';
  lastMoveAt?: number;
  opening?: { name?: string };
  players?: {
    white?: LichessPlayerSide;
    black?: LichessPlayerSide;
  };
}

interface CachedPlatformPayload {
  version: 1;
  timestamp: number;
  data: ChessPlatformData;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const CHESSCOM_CACHE_PREFIX = 'unmesh-chess-com:v1:';
const LICHESS_CACHE_PREFIX = 'unmesh-lichess:v1:';

export function normalizeChessUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isConfiguredChessComUsername(username: string): boolean {
  const normalized = normalizeChessUsername(username);
  return normalized.length > 0 && normalized !== 'your_chess_com_username';
}

export function isConfiguredLichessUsername(username: string): boolean {
  const normalized = normalizeChessUsername(username);
  return normalized.length > 0 && normalized !== 'your_lichess_username';
}

export function getFallbackChessComData(
  reason: 'unconfigured' | 'error' = 'unconfigured',
): ChessPlatformData {
  const { chessCom } = profileConfig.chess;
  const configured = isConfiguredChessComUsername(chessCom.username);
  const displayUser = configured
    ? normalizeChessUsername(chessCom.username)
    : 'unmesh';

  return {
    platform: 'chesscom',
    username: displayUser,
    profileUrl: configured ? chessCom.profileUrl : 'https://www.chess.com',
    status: 'fallback',
    statusReason: reason,
    ratings: [
      {
        key: 'rapid',
        label: 'Rapid',
        current: 1380,
        best: 1425,
        record: { win: 64, draw: 8, loss: 42 },
      },
      {
        key: 'blitz',
        label: 'Blitz',
        current: 1245,
        best: 1290,
        record: { win: 92, draw: 11, loss: 76 },
      },
      {
        key: 'bullet',
        label: 'Bullet',
        current: 1160,
        best: 1210,
        record: { win: 48, draw: 4, loss: 44 },
      },
      {
        key: 'tactics',
        label: 'Puzzles',
        current: 1890,
        best: 1940,
      },
    ],
    topRating: { label: 'Rapid', rating: 1380 },
    recentGames: [
      {
        id: 'cc-preview-1',
        opponent: 'arjun_k24',
        opponentRating: 1392,
        timeClass: 'Rapid',
        result: 'Win',
        accuracy: 87.4,
        playedAt: Date.now() - 7_200_000,
        url: 'https://www.chess.com',
      },
      {
        id: 'cc-preview-2',
        opponent: 'tactical_nova',
        opponentRating: 1260,
        timeClass: 'Blitz',
        result: 'Win',
        accuracy: 83.1,
        playedAt: Date.now() - 21_600_000,
        url: 'https://www.chess.com',
      },
      {
        id: 'cc-preview-3',
        opponent: 'endgame_lab',
        opponentRating: 1410,
        timeClass: 'Rapid',
        result: 'Draw',
        accuracy: 85.0,
        playedAt: Date.now() - 86_400_000,
        url: 'https://www.chess.com',
      },
      {
        id: 'cc-preview-4',
        opponent: 'knight_fork99',
        opponentRating: 1288,
        timeClass: 'Blitz',
        result: 'Loss',
        accuracy: 78.2,
        playedAt: Date.now() - 172_800_000,
        url: 'https://www.chess.com',
      },
    ],
    totalGames: 389,
  };
}

export function getFallbackLichessData(
  reason: 'unconfigured' | 'error' = 'unconfigured',
): ChessPlatformData {
  const { lichess } = profileConfig.chess;
  const configured = isConfiguredLichessUsername(lichess.username);
  const displayUser = configured
    ? normalizeChessUsername(lichess.username)
    : 'unmesh';

  return {
    platform: 'lichess',
    username: displayUser,
    profileUrl: configured ? lichess.profileUrl : 'https://lichess.org',
    status: 'fallback',
    statusReason: reason,
    ratings: [
      {
        key: 'rapid',
        label: 'Rapid',
        current: 1545,
        prog: 18,
        games: 112,
      },
      {
        key: 'blitz',
        label: 'Blitz',
        current: 1410,
        prog: 12,
        games: 194,
      },
      {
        key: 'bullet',
        label: 'Bullet',
        current: 1320,
        prog: -6,
        games: 88,
      },
      {
        key: 'classical',
        label: 'Classical',
        current: 1610,
        prog: 24,
        games: 26,
      },
    ],
    topRating: { label: 'Classical', rating: 1610 },
    recentGames: [
      {
        id: 'li-preview-1',
        opponent: 'RuyLopezStudy',
        opponentRating: 1562,
        timeClass: 'Rapid',
        result: 'Win',
        opening: 'Ruy Lopez: Morphy Defense',
        playedAt: Date.now() - 10_800_000,
        url: 'https://lichess.org',
      },
      {
        id: 'li-preview-2',
        opponent: 'PuneTactics',
        opponentRating: 1425,
        timeClass: 'Blitz',
        result: 'Win',
        opening: 'Sicilian Defense: Najdorf',
        playedAt: Date.now() - 36_000_000,
        url: 'https://lichess.org',
      },
      {
        id: 'li-preview-3',
        opponent: 'EndgameTempo',
        opponentRating: 1588,
        timeClass: 'Rapid',
        result: 'Draw',
        opening: "Queen's Gambit Declined",
        playedAt: Date.now() - 96_000_000,
        url: 'https://lichess.org',
      },
      {
        id: 'li-preview-4',
        opponent: 'OpenFile_07',
        opponentRating: 1450,
        timeClass: 'Blitz',
        result: 'Loss',
        opening: 'Italian Game: Giuoco Piano',
        playedAt: Date.now() - 190_000_000,
        url: 'https://lichess.org',
      },
    ],
    totalGames: 420,
  };
}

function getCacheKey(platform: ChessPlatform, username: string): string {
  const prefix =
    platform === 'chesscom' ? CHESSCOM_CACHE_PREFIX : LICHESS_CACHE_PREFIX;
  return `${prefix}${normalizeChessUsername(username)}`;
}

export function readCachedChessPlatform(
  platform: ChessPlatform,
  username: string,
): CachedPlatformPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(getCacheKey(platform, username));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedPlatformPayload>;
    if (
      parsed.version !== 1 ||
      typeof parsed.timestamp !== 'number' ||
      !parsed.data
    ) {
      return null;
    }
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      return null;
    }
    return parsed as CachedPlatformPayload;
  } catch {
    return null;
  }
}

export function writeCachedChessPlatform(
  platform: ChessPlatform,
  username: string,
  data: ChessPlatformData,
): number {
  const timestamp = Date.now();
  if (typeof window === 'undefined') return timestamp;
  try {
    const payload: CachedPlatformPayload = {
      version: 1,
      timestamp,
      data,
    };
    window.localStorage.setItem(
      getCacheKey(platform, username),
      JSON.stringify(payload),
    );
  } catch {
    // Ignore storage quota or private-mode errors
  }
  return timestamp;
}

function mapChessComResult(rawResult?: string): 'Win' | 'Loss' | 'Draw' {
  if (rawResult === 'win') return 'Win';
  if (
    rawResult === 'agreed' ||
    rawResult === 'repetition' ||
    rawResult === 'stalemate' ||
    rawResult === 'insufficient' ||
    rawResult === '50move' ||
    rawResult === 'timevsinsufficient'
  ) {
    return 'Draw';
  }
  return 'Loss';
}

function formatTimeClass(timeClass?: string): string {
  if (!timeClass) return 'Rapid';
  return timeClass.charAt(0).toUpperCase() + timeClass.slice(1);
}

function parseChessComBucket(
  key: string,
  label: string,
  bucket?: ChessApiStatBucket,
): ChessRatingEntry | null {
  const current = bucket?.last?.rating;
  if (typeof current !== 'number' || current <= 0) return null;
  const win = bucket?.record?.win ?? 0;
  const draw = bucket?.record?.draw ?? 0;
  const loss = bucket?.record?.loss ?? 0;
  return {
    key,
    label,
    current,
    best: typeof bucket?.best?.rating === 'number' ? bucket.best.rating : undefined,
    games: win + draw + loss,
    record: { win, draw, loss },
  };
}

export async function fetchChessComProfile(
  rawUsername: string,
  signal?: AbortSignal,
): Promise<ChessPlatformData> {
  const username = normalizeChessUsername(rawUsername);
  const baseUrl = `https://api.chess.com/pub/player/${encodeURIComponent(username)}`;

  const [playerRes, statsRes, archivesRes] = await Promise.all([
    fetch(baseUrl, { signal }),
    fetch(`${baseUrl}/stats`, { signal }),
    fetch(`${baseUrl}/games/archives`, { signal }),
  ]);

  if (!playerRes.ok || !statsRes.ok) {
    throw new Error(`Chess.com API error (${playerRes.status}/${statsRes.status})`);
  }

  const [playerJson, statsJson, archivesJson] = (await Promise.all([
    playerRes.json(),
    statsRes.json(),
    archivesRes.ok ? archivesRes.json() : Promise.resolve({ archives: [] }),
  ])) as [ChessApiPlayer, ChessApiStats, { archives?: string[] }];

  const ratings: ChessRatingEntry[] = [];
  const rapid = parseChessComBucket('rapid', 'Rapid', statsJson.chess_rapid);
  const blitz = parseChessComBucket('blitz', 'Blitz', statsJson.chess_blitz);
  const bullet = parseChessComBucket('bullet', 'Bullet', statsJson.chess_bullet);
  if (rapid) ratings.push(rapid);
  if (blitz) ratings.push(blitz);
  if (bullet) ratings.push(bullet);

  const tacticsPeak = statsJson.tactics?.highest?.rating;
  if (typeof tacticsPeak === 'number' && tacticsPeak > 0) {
    ratings.push({
      key: 'tactics',
      label: 'Puzzles',
      current: tacticsPeak,
      best: tacticsPeak,
    });
  }

  let topRating: { label: string; rating: number } | null = null;
  for (const entry of ratings) {
    if (entry.key !== 'tactics' && (!topRating || entry.current > topRating.rating)) {
      topRating = { label: entry.label, rating: entry.current };
    }
  }
  if (!topRating && ratings.length > 0) {
    topRating = { label: ratings[0].label, rating: ratings[0].current };
  }

  let recentGames: ChessMatchItem[] = [];
  const archiveUrls = Array.isArray(archivesJson.archives)
    ? archivesJson.archives
    : [];
  const latestArchiveUrl = archiveUrls[archiveUrls.length - 1];

  if (latestArchiveUrl) {
    const gamesRes = await fetch(latestArchiveUrl, { signal });
    if (gamesRes.ok) {
      const gamesJson = (await gamesRes.json()) as { games?: ChessApiGame[] };
      const gamesList = Array.isArray(gamesJson.games) ? gamesJson.games : [];
      recentGames = gamesList
        .slice(-4)
        .reverse()
        .map((game, idx) => {
          const isWhite =
            game.white?.username?.trim().toLowerCase() === username;
          const selfSide = isWhite ? game.white : game.black;
          const oppSide = isWhite ? game.black : game.white;
          const accuracy = isWhite
            ? game.accuracies?.white
            : game.accuracies?.black;

          return {
            id: game.url ?? `cc-game-${idx}`,
            opponent: oppSide?.username ?? 'Opponent',
            opponentRating: oppSide?.rating ?? 0,
            timeClass: formatTimeClass(game.time_class),
            result: mapChessComResult(selfSide?.result),
            accuracy: typeof accuracy === 'number' ? Number(accuracy.toFixed(1)) : undefined,
            playedAt: (game.end_time ?? Math.floor(Date.now() / 1000)) * 1000,
            url: game.url ?? playerJson.url ?? `https://www.chess.com/member/${username}`,
          };
        });
    }
  }

  const totalGames = ratings.reduce((sum, r) => sum + (r.games ?? 0), 0);

  return {
    platform: 'chesscom',
    username: playerJson.username ?? username,
    profileUrl: playerJson.url ?? `https://www.chess.com/member/${username}`,
    status: 'live',
    statusReason: 'live',
    ratings,
    topRating,
    recentGames,
    totalGames: totalGames > 0 ? totalGames : undefined,
  };
}

function parseLichessPerf(
  key: string,
  label: string,
  bucket?: LichessPerfBucket,
): ChessRatingEntry | null {
  if (!bucket || typeof bucket.rating !== 'number' || (bucket.games ?? 0) <= 0) {
    return null;
  }
  return {
    key,
    label,
    current: bucket.rating,
    prog: typeof bucket.prog === 'number' ? bucket.prog : undefined,
    games: bucket.games,
  };
}

export async function fetchLichessProfile(
  rawUsername: string,
  signal?: AbortSignal,
): Promise<ChessPlatformData> {
  const username = normalizeChessUsername(rawUsername);
  const encodedUser = encodeURIComponent(username);

  const [userRes, gamesRes] = await Promise.all([
    fetch(`https://lichess.org/api/user/${encodedUser}`, { signal }),
    fetch(
      `https://lichess.org/api/games/user/${encodedUser}?max=4&perfType=blitz,rapid,bullet,classical&opening=true`,
      {
        signal,
        headers: { Accept: 'application/x-ndjson' },
      },
    ).catch(() => null),
  ]);

  if (!userRes.ok) {
    throw new Error(`Lichess API error (${userRes.status})`);
  }

  const userJson = (await userRes.json()) as LichessApiUser;
  const ratings: ChessRatingEntry[] = [];

  const rapid = parseLichessPerf('rapid', 'Rapid', userJson.perfs?.rapid);
  const blitz = parseLichessPerf('blitz', 'Blitz', userJson.perfs?.blitz);
  const bullet = parseLichessPerf('bullet', 'Bullet', userJson.perfs?.bullet);
  const classical = parseLichessPerf('classical', 'Classical', userJson.perfs?.classical);
  const puzzle = parseLichessPerf('puzzle', 'Puzzles', userJson.perfs?.puzzle);

  if (rapid) ratings.push(rapid);
  if (blitz) ratings.push(blitz);
  if (bullet) ratings.push(bullet);
  if (classical) ratings.push(classical);
  if (puzzle && ratings.length < 4) ratings.push(puzzle);

  let topRating: { label: string; rating: number } | null = null;
  for (const entry of ratings) {
    if (entry.key !== 'puzzle' && (!topRating || entry.current > topRating.rating)) {
      topRating = { label: entry.label, rating: entry.current };
    }
  }
  if (!topRating && ratings.length > 0) {
    topRating = { label: ratings[0].label, rating: ratings[0].current };
  }

  let recentGames: ChessMatchItem[] = [];
  if (gamesRes && gamesRes.ok) {
    const ndjsonText = await gamesRes.text();
    const lines = ndjsonText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    recentGames = lines
      .map((line, idx): ChessMatchItem | null => {
        try {
          const game = JSON.parse(line) as LichessNdjsonGame;
          const whiteId = game.players?.white?.user?.id?.toLowerCase();
          const whiteName = game.players?.white?.user?.name?.toLowerCase();
          const isWhite = whiteId === username || whiteName === username;
          const oppSide = isWhite ? game.players?.black : game.players?.white;
          const myColor = isWhite ? 'white' : 'black';

          let result: 'Win' | 'Loss' | 'Draw' = 'Draw';
          if (game.winner) {
            result = game.winner === myColor ? 'Win' : 'Loss';
          }

          return {
            id: game.id ?? `li-game-${idx}`,
            opponent: oppSide?.user?.name ?? 'Anonymous',
            opponentRating: oppSide?.rating ?? 0,
            timeClass: formatTimeClass(game.speed),
            result,
            opening: game.opening?.name,
            playedAt: game.lastMoveAt ?? Date.now(),
            url: game.id
              ? `https://lichess.org/${game.id}`
              : userJson.url ?? `https://lichess.org/@/${username}`,
          };
        } catch {
          return null;
        }
      })
      .filter((item): item is ChessMatchItem => item !== null)
      .slice(0, 4);
  }

  return {
    platform: 'lichess',
    username: userJson.username ?? username,
    profileUrl: userJson.url ?? `https://lichess.org/@/${username}`,
    status: 'live',
    statusReason: 'live',
    ratings,
    topRating,
    recentGames,
    totalGames: userJson.count?.all,
  };
}
