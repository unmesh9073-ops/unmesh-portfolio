import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ThemeMode } from '../../config/profile.config';
import type { ChessBoardAngle } from '../../context/useSpatialWorld';

export interface ChessSceneProps {
  theme: ThemeMode;
  chessStep: number;
  chessAngle: ChessBoardAngle;
  isActive: boolean;
  prefersReducedMotion: boolean;
  position?: [number, number, number];
  scale?: number;
}

const BOARD_SIZE = 3.2;
const SQUARE_SIZE = BOARD_SIZE / 8;

function boardToWorld(file: number, rank: number): [number, number] {
  const x = (file - 3.5) * SQUARE_SIZE;
  const z = (3.5 - rank) * SQUARE_SIZE;
  return [x, z];
}

// 4 classic Ruy Lopez tactical sequences for the 6 sculptural pieces
// Pieces: [0: wK, 1: wR, 2: wB, 3: wN, 4: wP(e), 5: bN/bP]
const PIECE_SEQUENCES: ReadonlyArray<ReadonlyArray<[number, number]>> = [
  // 0: 1. e4 e5 — Central control
  [
    [4, 0], // wK e1
    [7, 0], // wR h1
    [5, 0], // wB f1
    [6, 0], // wN g1
    [4, 3], // wP e4
    [4, 4], // bP e5
  ],
  // 1: 2. Nf3 Nc6 — Development & tension
  [
    [4, 0], // wK e1
    [7, 0], // wR h1
    [5, 0], // wB f1
    [5, 2], // wN f3
    [4, 3], // wP e4
    [2, 5], // bN c6
  ],
  // 2: 3. Bb5 a6 — Ruy Lopez pin
  [
    [4, 0], // wK e1
    [7, 0], // wR h1
    [1, 4], // wB b5
    [5, 2], // wN f3
    [4, 3], // wP e4
    [0, 5], // bP a6
  ],
  // 3: 4. O-O — King safety & Rook activation
  [
    [6, 0], // wK g1
    [5, 0], // wR f1
    [1, 4], // wB b5
    [5, 2], // wN f3
    [4, 3], // wP e4
    [2, 5], // bN c6
  ],
];

function createPieceLathe(
  kind: 'king' | 'rook' | 'bishop' | 'knight' | 'pawn',
): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [];
  if (kind === 'king') {
    pts.push(
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.145, 0.0),
      new THREE.Vector2(0.145, 0.04),
      new THREE.Vector2(0.105, 0.09),
      new THREE.Vector2(0.065, 0.24),
      new THREE.Vector2(0.055, 0.44),
      new THREE.Vector2(0.1, 0.52),
      new THREE.Vector2(0.08, 0.58),
      new THREE.Vector2(0.025, 0.62),
      new THREE.Vector2(0.0, 0.66),
    );
  } else if (kind === 'rook') {
    pts.push(
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.135, 0.0),
      new THREE.Vector2(0.135, 0.04),
      new THREE.Vector2(0.095, 0.09),
      new THREE.Vector2(0.072, 0.24),
      new THREE.Vector2(0.072, 0.38),
      new THREE.Vector2(0.105, 0.43),
      new THREE.Vector2(0.105, 0.5),
      new THREE.Vector2(0.0, 0.5),
    );
  } else if (kind === 'bishop') {
    pts.push(
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.125, 0.0),
      new THREE.Vector2(0.125, 0.04),
      new THREE.Vector2(0.085, 0.085),
      new THREE.Vector2(0.055, 0.23),
      new THREE.Vector2(0.082, 0.37),
      new THREE.Vector2(0.055, 0.47),
      new THREE.Vector2(0.02, 0.53),
      new THREE.Vector2(0.0, 0.55),
    );
  } else if (kind === 'knight') {
    pts.push(
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.13, 0.0),
      new THREE.Vector2(0.13, 0.04),
      new THREE.Vector2(0.09, 0.09),
      new THREE.Vector2(0.065, 0.22),
      new THREE.Vector2(0.085, 0.34),
      new THREE.Vector2(0.045, 0.44),
      new THREE.Vector2(0.0, 0.47),
    );
  } else {
    pts.push(
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.11, 0.0),
      new THREE.Vector2(0.11, 0.035),
      new THREE.Vector2(0.075, 0.075),
      new THREE.Vector2(0.045, 0.2),
      new THREE.Vector2(0.065, 0.26),
      new THREE.Vector2(0.05, 0.32),
      new THREE.Vector2(0.0, 0.34),
    );
  }
  return new THREE.LatheGeometry(pts, 24);
}

export function ChessScene({
  theme,
  chessStep,
  chessAngle,
  isActive,
  prefersReducedMotion,
  position = [0, 0, 0],
  scale = 1,
}: ChessSceneProps) {
  const rootRef = useRef<THREE.Group>(null);
  const pieceRefs = useRef<Array<THREE.Group | null>>([]);
  const tileMeshRef = useRef<THREE.InstancedMesh>(null);

  const boardBaseMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const tileMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const frameMatRef = useRef<THREE.LineBasicMaterial>(null);
  const lightPieceMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const darkPieceMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const geometries = useMemo(
    () => ({
      king: createPieceLathe('king'),
      rook: createPieceLathe('rook'),
      bishop: createPieceLathe('bishop'),
      knight: createPieceLathe('knight'),
      pawn: createPieceLathe('pawn'),
      boardEdges: new THREE.EdgesGeometry(new THREE.BoxGeometry(BOARD_SIZE + 0.14, 0.08, BOARD_SIZE + 0.14)),
    }),
    [],
  );

  useEffect(() => {
    return () => {
      geometries.king.dispose();
      geometries.rook.dispose();
      geometries.bishop.dispose();
      geometries.knight.dispose();
      geometries.pawn.dispose();
      geometries.boardEdges.dispose();
    };
  }, [geometries]);

  // Populate 32 alternating chessboard squares
  useEffect(() => {
    const mesh = tileMeshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        if ((r + f) % 2 === 1) {
          const [wx, wz] = boardToWorld(f, r);
          dummy.position.set(wx, 0.045, wz);
          dummy.updateMatrix();
          mesh.setMatrixAt(idx++, dummy.matrix);
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  // Piece animation state (zero per-frame allocations)
  const animRef = useRef({
    lastStep: chessStep,
    moveProgress: 1,
    fromPos: Array.from({ length: 6 }, (_, i) => boardToWorld(PIECE_SEQUENCES[0][i][0], PIECE_SEQUENCES[0][i][1])),
    currPos: Array.from({ length: 6 }, (_, i) => boardToWorld(PIECE_SEQUENCES[0][i][0], PIECE_SEQUENCES[0][i][1])),
    colorScratch: new THREE.Color(),
    elapsed: 0,
  });

  useEffect(() => {
    const a = animRef.current;
    if (chessStep !== a.lastStep) {
      for (let i = 0; i < 6; i++) {
        a.fromPos[i] = [a.currPos[i][0], a.currPos[i][1]];
      }
      a.lastStep = chessStep;
      a.moveProgress = prefersReducedMotion ? 1 : 0;
    }
  }, [chessStep, prefersReducedMotion]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = animRef.current;
    if (isActive && !prefersReducedMotion) {
      a.elapsed += dt;
    }

    const isDark = theme === 'dark';

    // Theme-synced materials
    if (boardBaseMatRef.current) {
      a.colorScratch.set(isDark ? '#0D0E12' : '#EBECEF');
      boardBaseMatRef.current.color.lerp(a.colorScratch, 1 - Math.exp(-dt * 8));
    }
    if (tileMatRef.current) {
      a.colorScratch.set(isDark ? '#1B1E26' : '#CBD5E1');
      tileMatRef.current.color.lerp(a.colorScratch, 1 - Math.exp(-dt * 8));
    }
    if (frameMatRef.current) {
      a.colorScratch.set(isDark ? '#B8C7D9' : '#475B70');
      frameMatRef.current.color.lerp(a.colorScratch, 1 - Math.exp(-dt * 8));
    }
    if (lightPieceMatRef.current) {
      a.colorScratch.set(isDark ? '#E2E8F0' : '#F8FAFC');
      lightPieceMatRef.current.color.lerp(a.colorScratch, 1 - Math.exp(-dt * 8));
    }
    if (darkPieceMatRef.current) {
      a.colorScratch.set(isDark ? '#272B35' : '#1E293B');
      darkPieceMatRef.current.color.lerp(a.colorScratch, 1 - Math.exp(-dt * 8));
    }

    // Board angle orbit
    if (rootRef.current) {
      const targetRotX = chessAngle === 'isometric' ? 0.42 : 0.15;
      const baseRotY = chessAngle === 'isometric' ? -0.48 : 0.24;
      const driftY = prefersReducedMotion ? 0 : Math.sin(a.elapsed * 0.25) * 0.05;
      rootRef.current.rotation.x = THREE.MathUtils.damp(rootRef.current.rotation.x, targetRotX, 5.5, dt);
      rootRef.current.rotation.y = THREE.MathUtils.damp(rootRef.current.rotation.y, baseRotY + driftY, 5.5, dt);
    }

    // Parabolic piece transitions
    if (a.moveProgress < 1) {
      a.moveProgress = Math.min(1, a.moveProgress + dt * 2.1);
    }
    const smoothT = a.moveProgress * a.moveProgress * (3 - 2 * a.moveProgress);
    const seq = PIECE_SEQUENCES[chessStep % PIECE_SEQUENCES.length];

    for (let i = 0; i < 6; i++) {
      const grp = pieceRefs.current[i];
      if (!grp) continue;
      const [tx, tz] = boardToWorld(seq[i][0], seq[i][1]);
      const [fx, fz] = a.fromPos[i];
      const moved = Math.hypot(tx - fx, tz - fz) > 0.01;
      const x = THREE.MathUtils.lerp(fx, tx, smoothT);
      const z = THREE.MathUtils.lerp(fz, tz, smoothT);
      const arcY = moved && !prefersReducedMotion ? Math.sin(smoothT * Math.PI) * 0.42 : 0;
      a.currPos[i][0] = x;
      a.currPos[i][1] = z;
      grp.position.set(x, 0.05 + arcY, z);
    }
  });

  const pieceMeta: ReadonlyArray<{ geo: THREE.LatheGeometry; isLight: boolean }> = [
    { geo: geometries.king, isLight: true },
    { geo: geometries.rook, isLight: true },
    { geo: geometries.bishop, isLight: true },
    { geo: geometries.knight, isLight: true },
    { geo: geometries.pawn, isLight: true },
    { geo: geometries.knight, isLight: false },
  ];

  return (
    <group ref={rootRef} position={position} scale={scale} rotation={[0.42, -0.48, 0]}>
      {/* Board Base Slab */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[BOARD_SIZE + 0.14, 0.08, BOARD_SIZE + 0.14]} />
        <meshStandardMaterial
          ref={boardBaseMatRef}
          color={theme === 'dark' ? '#0D0E12' : '#EBECEF'}
          roughness={0.55}
          metalness={0.25}
        />
      </mesh>

      {/* Razor-thin outer bevel frame */}
      <lineSegments geometry={geometries.boardEdges}>
        <lineBasicMaterial
          ref={frameMatRef}
          color={theme === 'dark' ? '#B8C7D9' : '#475B70'}
          transparent
          opacity={0.42}
        />
      </lineSegments>

      {/* 32 Alternating Grid Tiles */}
      <instancedMesh ref={tileMeshRef} args={[undefined, undefined, 32]}>
        <boxGeometry args={[SQUARE_SIZE * 0.96, 0.014, SQUARE_SIZE * 0.96]} />
        <meshStandardMaterial
          ref={tileMatRef}
          color={theme === 'dark' ? '#1B1E26' : '#CBD5E1'}
          roughness={0.45}
          metalness={0.35}
        />
      </instancedMesh>

      {/* 6 Sculptural Lathe Pieces */}
      {pieceMeta.map((piece, idx) => (
        <group
          key={idx}
          ref={(el) => {
            pieceRefs.current[idx] = el;
          }}
          position={[0, 0.05, 0]}
        >
          <mesh geometry={piece.geo}>
            {piece.isLight ? (
              <meshPhysicalMaterial
                ref={idx === 0 ? lightPieceMatRef : undefined}
                color={theme === 'dark' ? '#E2E8F0' : '#F8FAFC'}
                roughness={0.16}
                metalness={0.18}
                transmission={0.28}
                thickness={0.3}
              />
            ) : (
              <meshStandardMaterial
                ref={idx === 5 ? darkPieceMatRef : undefined}
                color={theme === 'dark' ? '#272B35' : '#1E293B'}
                roughness={0.32}
                metalness={0.62}
              />
            )}
          </mesh>
        </group>
      ))}
    </group>
  );
}
