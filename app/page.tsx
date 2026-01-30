'use client';

import { useRouter } from 'next/navigation';
import LobbyScreen from '@/components/lobby/LobbyScreen';

export default function Home() {
  const router = useRouter();

  const handleStartGame = (matchId: string, seed: number, playerName: string, sessionId: string, duration?: number, hardMode?: boolean, startedAt?: string) => {
    // Navigate to multiplayer game with match configuration
    const params = new URLSearchParams({
      matchId,
      seed: seed.toString(),
      playerName,
      sessionId,
      ...(duration && { duration: duration.toString() }),
      ...(hardMode !== undefined && { hardMode: hardMode.toString() }),
      ...(startedAt && { startedAt }),
    });
    router.push(`/game/multiplayer?${params.toString()}`);
  };

  return <LobbyScreen onStartGame={handleStartGame} />;
}
