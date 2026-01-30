'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PracticeGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const playerName = searchParams.get('playerName');
    const hardMode = searchParams.get('hardMode') === 'true';

    if (!playerName) {
      console.error('Missing player name');
      router.push('/');
      return;
    }

    // Dynamically import Phaser to avoid SSR issues
    const loadGame = async () => {
      if (typeof window === 'undefined') return;

      const { initGame } = await import('@/game');
      const { v4: uuidv4 } = await import('uuid');

      if (gameContainerRef.current && !gameInstanceRef.current) {
        // Create a minimal match config for practice mode to enable hard mode
        const practiceConfig = hardMode ? {
          matchId: 'practice',
          seed: Date.now(),
          playerName,
          sessionId: uuidv4(),
          hardMode: true,
        } : undefined;

        gameInstanceRef.current = initGame('game-container', practiceConfig);
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
  }, [searchParams, router]);

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
      {/* Home button overlay - top right */}
      <button
        onClick={handleGoHome}
        className="absolute top-4 right-4 z-50 rounded border-4 border-gray-800 bg-red-500 px-4 py-2 text-lg font-black text-white transition-all hover:bg-red-400 hover:scale-105 active:scale-95 shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
        style={{ fontFamily: 'monospace' }}
        title="Return to Home"
      >
        🏠 HOME
      </button>

      {/* Practice mode indicator */}
      <div
        className={`absolute top-4 left-4 z-50 rounded border-4 border-gray-800 px-4 py-2 text-lg font-black text-white shadow-[4px_4px_0_rgba(0,0,0,0.3)] ${
          searchParams.get('hardMode') === 'true' ? 'bg-red-500' : 'bg-blue-500'
        }`}
        style={{ fontFamily: 'monospace' }}
      >
        {searchParams.get('hardMode') === 'true' ? '🔥 PRACTICE HARD' : '🎯 PRACTICE MODE'}
      </div>

      <div
        id="game-container"
        ref={gameContainerRef}
        className="rounded-lg shadow-2xl"
      />
    </div>
  );
}

export default function PracticeGamePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading practice mode...</div>
      </div>
    }>
      <PracticeGame />
    </Suspense>
  );
}
