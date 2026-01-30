'use client';

import { useEffect, useState } from 'react';
import { supabase, type LeaderboardEntry } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import BeachBackground from '@/components/lobby/BeachBackground';

interface MatchResultsProps {
  matchId: string;
  sessionId: string;
  onClose: () => void;
}

export default function MatchResults({ matchId, sessionId }: MatchResultsProps) {
  const router = useRouter();
  const [results, setResults] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayedResults, setDisplayedResults] = useState<LeaderboardEntry[]>([]);
  const [revealedPlayers, setRevealedPlayers] = useState<Set<string>>(new Set());
  const [playerPositions, setPlayerPositions] = useState<Map<string, number>>(new Map());
  const [isShuffling, setIsShuffling] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Reset all state when matchId changes
    setResults([]);
    setDisplayedResults([]);
    setRevealedPlayers(new Set());
    setPlayerPositions(new Map());
    setIsShuffling(false);
    setAnimationComplete(false);
    setLoading(true);

    let animationFrameId: number | null = null;
    let shuffleIntervalId: NodeJS.Timeout | null = null;

    const fetchResults = async () => {
      try {
        // Add a small delay to ensure score submissions have time to complete
        await new Promise(resolve => setTimeout(resolve, 800));

        // Fetch results - deduplicate by session_id to prevent duplicate players
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('match_id', matchId)
          .order('total_score', { ascending: false });

        if (error) {
          console.error('Error fetching match results - table may not exist:', error);
          setResults([]);
          setDisplayedResults([]);
        } else {
          // Deduplicate: keep only the highest score entry per session_id
          const deduplicated = new Map<string, LeaderboardEntry>();
          (data || []).forEach(entry => {
            const existing = deduplicated.get(entry.session_id);
            if (!existing || entry.total_score > existing.total_score) {
              deduplicated.set(entry.session_id, entry);
            }
          });
          const sortedResults = Array.from(deduplicated.values()).sort((a, b) => b.total_score - a.total_score);
          console.log('[MatchResults] Setting results:', sortedResults.length, 'players');
          setResults(sortedResults);

          // Start with shuffled order and hidden scores
          const shuffled = [...sortedResults].sort(() => Math.random() - 0.5);
          setDisplayedResults(shuffled);
          setRevealedPlayers(new Set()); // Ensure scores are hidden
          setIsShuffling(true); // Enable CSS transitions for shuffle phase

          // Phase 1: Gentle drumroll – fewer steps, longer interval, longer transition
          // so each move completes smoothly instead of overlapping
          const shuffleDuration = 2800;
          const shuffleStartTime = Date.now();
          let shuffleCount = 0;
          const maxShuffles = 4;
          const shuffleIntervalMs = 700; // Time between each shuffle step
          let lastOrder: LeaderboardEntry[] = shuffled;

          shuffleIntervalId = setInterval(() => {
            shuffleCount++;
            // Softer shuffle: swap 1–2 adjacent pairs so movement is subtle, not chaotic
            const newOrder = [...lastOrder];
            for (let s = 0; s < 2; s++) {
              const i = Math.floor(Math.random() * Math.max(1, newOrder.length - 1));
              if (i < newOrder.length - 1) {
                [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];
              }
            }
            lastOrder = newOrder;
            setDisplayedResults(newOrder);

            const shufflePositions = new Map<string, number>();
            const rowHeight = 88;
            newOrder.forEach((result, index) => {
              const finalIndex = sortedResults.findIndex(r => r.id === result.id);
              const offset = (index - finalIndex) * rowHeight;
              shufflePositions.set(result.id, offset);
            });
            setPlayerPositions(shufflePositions);

            const elapsed = Date.now() - shuffleStartTime;
            if (elapsed >= shuffleDuration || shuffleCount >= maxShuffles) {
              if (shuffleIntervalId) {
                clearInterval(shuffleIntervalId);
                shuffleIntervalId = null;
              }

              const finalShuffle = lastOrder;
              setIsShuffling(false); // Disable CSS transitions for smooth settle

              // Phase 2: Smooth settle into final positions
              const settleDuration = 1800;
              const settleStartTime = Date.now();
              const animationMap = new Map<string, { startIndex: number; targetIndex: number }>();
              sortedResults.forEach((result, index) => {
                const startIndex = finalShuffle.findIndex(r => r.id === result.id);
                animationMap.set(result.id, { startIndex, targetIndex: index });
              });

              const animateSettle = () => {
                const elapsed = Date.now() - settleStartTime;
                const progress = Math.min(elapsed / settleDuration, 1);

                // Ease out function for smooth animation
                const easedProgress = 1 - Math.pow(1 - progress, 3);

                // Calculate current positions
                const positions: Array<{ result: LeaderboardEntry; position: number }> = [];
                animationMap.forEach(({ startIndex, targetIndex }, id) => {
                  const result = sortedResults.find(r => r.id === id)!;
                  const currentPosition = startIndex + (targetIndex - startIndex) * easedProgress;
                  positions.push({ result, position: currentPosition });
                });

                // Sort by current position
                positions.sort((a, b) => a.position - b.position);
                const currentOrder = positions.map(p => p.result);

                // Store pixel positions
                const pixelPositions = new Map<string, number>();
                positions.forEach(({ result, position }) => {
                  const finalIndex = sortedResults.findIndex(r => r.id === result.id);
                  const rowHeight = 88;
                  const offset = (position - finalIndex) * rowHeight;
                  pixelPositions.set(result.id, offset);
                });

                setDisplayedResults([...currentOrder]);
                setPlayerPositions(new Map(pixelPositions));

                // Don't reveal scores during animation - only at the end

                if (progress < 1) {
                  animationFrameId = requestAnimationFrame(animateSettle);
                } else {
                  setDisplayedResults(sortedResults);
                  setRevealedPlayers(new Set(sortedResults.map(r => r.id)));
                  setPlayerPositions(new Map());
                  setAnimationComplete(true);
                }
              };

              // Start settle animation
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  animationFrameId = requestAnimationFrame(animateSettle);
                });
              });
            }
          }, shuffleIntervalMs);
        }
      } catch (err) {
        console.error('Error fetching match results:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();

    // Cleanup function
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (shuffleIntervalId !== null) {
        clearInterval(shuffleIntervalId);
      }
    };
  }, [matchId]);

  const myRank = results.findIndex(r => r.session_id === sessionId) + 1;
  const myResult = results.find(r => r.session_id === sessionId);

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  const handleHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div
        className="fixed z-50 flex items-center justify-center p-4 sm:p-8"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: '1rem',
        }}
      >
        <BeachBackground />
        <div className="relative z-10 text-white text-2xl font-bold drop-shadow-lg" style={{ fontFamily: 'monospace' }}>
          LOADING RESULTS...
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed z-50 flex items-center justify-center p-4 sm:p-8"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: '1rem',
      }}
    >
      {/* Beach background */}
      <BeachBackground />
      {/* Subtle celebration effect - just a couple of emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 11 }}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute text-3xl animate-bounce"
            style={{
              left: `${20 + i * 30}%`,
              top: `${10 + i * 15}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '2s',
            }}
          >
            {['🎉', '⭐', '🏆'][i]}
          </div>
        ))}
      </div>

      <div
        className="relative z-10 bg-white rounded-lg border-4 border-gray-800 shadow-2xl overflow-visible"
        style={{
          width: '100%',
          maxWidth: '56rem',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 border-b-4 border-gray-800 overflow-visible">
          <h1 className="text-center text-4xl font-black text-white whitespace-nowrap" style={{ fontFamily: 'monospace' }}>
            🏁 MATCH COMPLETE! 🏁
          </h1>
          {animationComplete && myRank === 1 && (
            <p className="text-center text-2xl font-bold text-white mt-2 whitespace-nowrap" style={{ fontFamily: 'monospace' }}>
              🎉 YOU WON! 🎉
            </p>
          )}
          {animationComplete && myResult && myRank > 1 && (
            <p className="text-center text-xl font-bold text-white mt-2" style={{ fontFamily: 'monospace' }}>
              YOU PLACED #{myRank}
            </p>
          )}
        </div>

        {/* Leaderboard */}
        <div className="p-6 max-h-96 overflow-y-auto bg-gradient-to-b from-sky-50 to-blue-100">
          {results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl font-black text-gray-600 mb-2" style={{ fontFamily: 'monospace' }}>
                NO SCORES YET
              </p>
              <p className="text-sm text-gray-500" style={{ fontFamily: 'monospace' }}>
                Run the leaderboard migration in Supabase to enable score tracking!
              </p>
              <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: 'monospace' }}>
                (supabase/003_leaderboard.sql)
              </p>
            </div>
          ) : (
            <div className="relative" style={{ minHeight: `${results.length * 88}px`, position: 'relative' }}>
              {displayedResults.length > 0 && displayedResults.map((result) => {
              // Find the actual rank in the sorted results
              const actualRank = results.findIndex(r => r.id === result.id) + 1;
              const isMe = result.session_id === sessionId;
              const isRevealed = revealedPlayers.has(result.id);

              // Get position offset for smooth animation
              const positionOffset = playerPositions.get(result.id) || 0;
              const targetIndex = results.findIndex(r => r.id === result.id);
              const targetY = targetIndex * 88; // 88px per row (80px height + 8px gap)

              return (
                <div
                  key={result.id}
                  className={`absolute left-0 right-0 rounded border-4 px-4 py-3 flex items-center justify-between ${
                    isMe
                      ? 'border-yellow-600 bg-yellow-100 shadow-[4px_4px_0_rgba(0,0,0,0.3)]'
                      : actualRank <= 3
                      ? 'border-gray-800 bg-white shadow-[2px_2px_0_rgba(0,0,0,0.2)]'
                      : 'border-gray-600 bg-gray-50'
                  }`}
                  style={{
                    top: `${targetY}px`,
                    transform: `translateY(${positionOffset}px)`,
                    opacity: isRevealed ? 1 : 0.8,
                    width: 'calc(100% - 0px)',
                    willChange: 'transform', // Optimize for animation
                    transition: isShuffling ? 'transform 0.55s cubic-bezier(0.33, 1, 0.68, 1)' : 'none',
                  }}
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="w-12 text-center">
                      <span className="text-2xl font-black" style={{ fontFamily: 'monospace' }}>
                        {isRevealed ? getRankEmoji(actualRank) : '?'}
                      </span>
                    </div>

                    {/* Player name */}
                    <div>
                      <p className={`text-xl font-black ${isMe ? 'text-yellow-900' : 'text-gray-900'}`} style={{ fontFamily: 'monospace' }}>
                        {result.player_name}
                        {isMe && <span className="ml-2 text-sm">(YOU)</span>}
                      </p>
                      {isRevealed ? (
                        <p className="text-sm text-gray-600" style={{ fontFamily: 'monospace' }}>
                          Best Flight: {result.best_flight}m
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400" style={{ fontFamily: 'monospace' }}>
                          ???
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    {isRevealed ? (
                      <>
                        <p className={`text-3xl font-black ${isMe ? 'text-yellow-900' : 'text-gray-900'}`} style={{ fontFamily: 'monospace' }}>
                          {result.total_score}
                        </p>
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>
                          TOTAL
                        </p>
                      </>
                    ) : (
                      <p className="text-3xl font-black text-gray-300" style={{ fontFamily: 'monospace' }}>
                        ???
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="p-6 border-t-4 border-gray-800 bg-white space-y-3">
          <button
            onClick={handleHome}
            className="w-full rounded border-4 border-gray-800 bg-green-500 px-6 py-4 text-xl font-black text-white transition-all hover:bg-green-400 hover:scale-105 active:scale-95 shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
            style={{ fontFamily: 'monospace' }}
          >
            🏠 BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  );
}
