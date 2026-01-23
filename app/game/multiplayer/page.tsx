'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { MatchConfig } from '@/game';
import MatchResults from '@/components/game/MatchResults';

function MultiplayerGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [completedMatchId, setCompletedMatchId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get match configuration from URL params
    const matchId = searchParams.get('matchId');
    const seed = searchParams.get('seed');
    const playerName = searchParams.get('playerName');
    const currentSessionId = searchParams.get('sessionId');
    const duration = searchParams.get('duration');
    const hardMode = searchParams.get('hardMode');

    if (!matchId || !seed || !playerName || !currentSessionId) {
      console.error('Missing match configuration');
      return;
    }

    // Store sessionId for results display
    setSessionId(currentSessionId);

    const matchConfig: MatchConfig = {
      matchId,
      seed: parseInt(seed, 10),
      playerName,
      sessionId: currentSessionId,
      duration: duration ? parseInt(duration, 10) : undefined,
      hardMode: hardMode === 'true',
      onMatchEnd: (matchId: string) => {
        setCompletedMatchId(matchId);
        setShowResults(true);
      },
    };

    // Dynamically import Phaser to avoid SSR issues
    const loadGame = async () => {
      if (typeof window === 'undefined') return;

      const { initGame } = await import('@/game');

      if (gameContainerRef.current && !gameInstanceRef.current) {
        gameInstanceRef.current = initGame('game-container', matchConfig);
      }
    };

    loadGame();

    // Cleanup on unmount
    return () => {
      const cleanup = async () => {
        if (gameInstanceRef.current) {
          const { destroyGame } = await import('@/game');
          destroyGame(gameInstanceRef.current);
          gameInstanceRef.current = null;
        }
      };

      cleanup();
    };
  }, [searchParams]);

  const handleGoHome = async () => {
    // Clean up game instance before navigating
    if (gameInstanceRef.current) {
      const { destroyGame } = await import('@/game');
      destroyGame(gameInstanceRef.current);
      gameInstanceRef.current = null;
    }

    // Navigate back to home
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 relative">
      {/* Home button overlay - top left to avoid leaderboard overlap */}
      <button
        onClick={handleGoHome}
        className="absolute top-4 left-4 z-50 rounded border-4 border-gray-800 bg-red-500 px-4 py-2 text-lg font-black text-white transition-all hover:bg-red-400 hover:scale-105 active:scale-95 shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
        style={{ fontFamily: 'monospace' }}
        title="Return to Home"
      >
        🏠 HOME
      </button>

      <div
        id="game-container"
        ref={gameContainerRef}
        className="rounded-lg shadow-2xl"
      />

      {/* Match Results Modal */}
      {showResults && completedMatchId && sessionId && (
        <MatchResults
          matchId={completedMatchId}
          sessionId={sessionId}
          onClose={() => setShowResults(false)}
        />
      )}
    </div>
  );
}

export default function MultiplayerGamePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    }>
      <MultiplayerGame />
    </Suspense>
  );
}
