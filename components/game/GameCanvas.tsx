'use client';

import { useEffect, useRef } from 'react';

export default function GameCanvas() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Dynamically import Phaser to avoid SSR issues
    const loadGame = async () => {
      if (typeof window === 'undefined') return;

      const { initGame } = await import('@/game');

      if (gameContainerRef.current && !gameInstanceRef.current) {
        gameInstanceRef.current = initGame('game-container');
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
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div
        id="game-container"
        ref={gameContainerRef}
        className="rounded-lg shadow-2xl"
      />
    </div>
  );
}
