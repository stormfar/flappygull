'use client';

import { useEffect, useState } from 'react';
import { supabase, type LeaderboardEntry } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface MatchResultsProps {
  matchId: string;
  sessionId: string;
  onClose: () => void;
}

export default function MatchResults({ matchId, sessionId, onClose }: MatchResultsProps) {
  const router = useRouter();
  const [results, setResults] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Add a small delay to ensure score submissions have time to complete
        await new Promise(resolve => setTimeout(resolve, 800));

        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('match_id', matchId)
          .order('total_score', { ascending: false });

        if (error) {
          console.error('Error fetching match results - table may not exist:', error);
          // Show empty results if table doesn't exist
          setResults([]);
        } else {
          setResults(data || []);
        }
      } catch (err) {
        console.error('Error fetching match results:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
        <div className="text-white text-2xl font-bold" style={{ fontFamily: 'monospace' }}>
          LOADING RESULTS...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      {/* Celebration confetti effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-4xl animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${-50 + Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          >
            {['🎉', '🎊', '⭐', '✨', '🏆'][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      <div className="relative w-full max-w-2xl bg-white rounded-lg border-4 border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 border-b-4 border-gray-800">
          <h1 className="text-center text-4xl font-black text-white" style={{ fontFamily: 'monospace' }}>
            🏁 MATCH COMPLETE! 🏁
          </h1>
          {myRank === 1 && (
            <p className="text-center text-2xl font-bold text-white mt-2" style={{ fontFamily: 'monospace' }}>
              🎉 YOU WON! 🎉
            </p>
          )}
          {myResult && myRank > 1 && (
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
            <div className="space-y-2">
              {results.map((result, index) => {
              const rank = index + 1;
              const isMe = result.session_id === sessionId;

              return (
                <div
                  key={result.id}
                  className={`rounded border-4 px-4 py-3 flex items-center justify-between ${
                    isMe
                      ? 'border-yellow-600 bg-yellow-100 shadow-[4px_4px_0_rgba(0,0,0,0.3)]'
                      : rank <= 3
                      ? 'border-gray-800 bg-white shadow-[2px_2px_0_rgba(0,0,0,0.2)]'
                      : 'border-gray-600 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="w-12 text-center">
                      <span className="text-2xl font-black" style={{ fontFamily: 'monospace' }}>
                        {getRankEmoji(rank)}
                      </span>
                    </div>

                    {/* Player name */}
                    <div>
                      <p className={`text-xl font-black ${isMe ? 'text-yellow-900' : 'text-gray-900'}`} style={{ fontFamily: 'monospace' }}>
                        {result.player_name}
                        {isMe && <span className="ml-2 text-sm">(YOU)</span>}
                      </p>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'monospace' }}>
                        Best Flight: {result.best_flight}m
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className={`text-3xl font-black ${isMe ? 'text-yellow-900' : 'text-gray-900'}`} style={{ fontFamily: 'monospace' }}>
                      {result.total_score}
                    </p>
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'monospace' }}>
                      TOTAL
                    </p>
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
