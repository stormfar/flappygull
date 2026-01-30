'use client';

import { useState, useEffect } from 'react';
import { supabase, type Match, type MatchPlayer, type LeaderboardEntry } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import FlyingSeagulls from './FlyingSeagull';
import GameInfoModal from './GameInfoModal';
import BeachBackground from './BeachBackground';

interface LobbyScreenProps {
  onStartGame: (matchId: string, seed: number, playerName: string, sessionId: string, duration?: number, hardMode?: boolean, startedAt?: string) => void;
  onStartPractice?: (playerName: string) => void;
}

type LobbyView = 'menu' | 'create' | 'join' | 'waiting';

export default function LobbyScreen({ onStartGame }: LobbyScreenProps) {
  const [view, setView] = useState<LobbyView>('menu');
  const [playerName, setPlayerName] = useState('');
  const [matchCode, setMatchCode] = useState('');
  const [sessionId] = useState(() => uuidv4());

  // Match state
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Match settings (for host)
  const [matchDuration, setMatchDuration] = useState(60); // Default 1 minute
  const [hardMode, setHardMode] = useState(false);

  // Practice mode settings
  const [practiceHardMode, setPracticeHardMode] = useState(false);

  // Global leaderboard
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardDuration, setLeaderboardDuration] = useState(120); // Default to 2 minutes
  const [leaderboardHardMode, setLeaderboardHardMode] = useState(false); // Default to normal mode

  // Info modal
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Load saved name from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    const savedName = localStorage.getItem('flappygull_player_name');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // Fetch global leaderboard when filters change
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*, matches!inner(duration, hard_mode)')
        .eq('matches.duration', leaderboardDuration)
        .eq('matches.hard_mode', leaderboardHardMode)
        .order('total_score', { ascending: false })
        .limit(10);

      if (!error && data) {
        setGlobalLeaderboard(data);
      }
    };

    fetchLeaderboard();
  }, [leaderboardDuration, leaderboardHardMode]);

  // Save player name to localStorage when it changes
  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('flappygull_player_name', name);
  };

  // Subscribe to match updates when in waiting room
  useEffect(() => {
    if (!currentMatch || view !== 'waiting') return;

    console.log('Setting up subscriptions for match:', currentMatch.id);

    // Define fetchPlayers inside useEffect to avoid stale closure
    const fetchPlayers = async () => {
      const { data, error } = await supabase
        .from('match_players')
        .select('*')
        .eq('match_id', currentMatch.id)
        .order('joined_at', { ascending: true });

      if (!error && data) {
        console.log('Fetched players:', data.length);
        setPlayers(data);
      } else if (error) {
        console.error('Error fetching players:', error);
      }
    };

    // Subscribe to match updates
    const matchChannel = supabase.channel(`match:${currentMatch.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${currentMatch.id}`,
        },
        (payload) => {
          console.log('Match update received:', payload);
          if (payload.new) {
            const updatedMatch = payload.new as Match;
            setCurrentMatch(updatedMatch);

            // Start game when match becomes active
            if (updatedMatch.status === 'active') {
              onStartGame(updatedMatch.id, updatedMatch.seed, playerName, sessionId, updatedMatch.duration, updatedMatch.hard_mode, updatedMatch.started_at);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Match channel subscription status:', status);
      });

    // Subscribe to player updates
    const playersChannel = supabase.channel(`match_players:${currentMatch.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_players',
          filter: `match_id=eq.${currentMatch.id}`,
        },
        (payload) => {
          console.log('Player update received:', payload);
          // Refetch players when changes occur
          fetchPlayers();
        }
      )
      .subscribe((status) => {
        console.log('Players channel subscription status:', status);
      });

    // Initial fetch
    fetchPlayers();

    // Polling fallback - refresh every 2 seconds to ensure we catch updates
    // This ensures the host sees new players even if Realtime isn't working
    const pollingInterval = setInterval(() => {
      fetchPlayers();
    }, 2000);

    return () => {
      clearInterval(pollingInterval);
      matchChannel.unsubscribe();
      playersChannel.unsubscribe();
    };
  }, [currentMatch, view, onStartGame, playerName, sessionId]);

  const handleCreateMatch = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the create_match function with settings
      const { data, error: createError } = await supabase.rpc('create_match', {
        p_duration: matchDuration,
        p_hard_mode: hardMode,
      });

      if (createError) throw createError;
      if (!data || data.length === 0) throw new Error('Failed to create match');

      const matchData = data[0];

      // Join the match as the first player
      const { error: joinError } = await supabase
        .from('match_players')
        .insert({
          match_id: matchData.match_id,
          player_name: playerName.trim(),
          session_id: sessionId,
        });

      if (joinError) throw joinError;

      // Fetch the full match details
      const { data: matchDetails, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchData.match_id)
        .single();

      if (fetchError) throw fetchError;

      setCurrentMatch(matchDetails);
      setMatchCode(matchData.match_code);
      setView('waiting');
    } catch (err) {
      console.error('Error creating match:', err);
      setError('Failed to create match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMatch = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!matchCode.trim()) {
      setError('Please enter a match code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find match by code
      const { data: matchData, error: findError } = await supabase
        .from('matches')
        .select('*')
        .eq('match_code', matchCode.toUpperCase())
        .single();

      if (findError || !matchData) {
        setError('Match not found. Please check the code.');
        setLoading(false);
        return;
      }

      // Check if match is still waiting
      if (matchData.status !== 'waiting') {
        setError('This match has already started or ended.');
        setLoading(false);
        return;
      }

      // Check player count
      const { count } = await supabase
        .from('match_players')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', matchData.id);

      if (count && count >= matchData.max_players) {
        setError('This match is full.');
        setLoading(false);
        return;
      }

      // Join the match
      const { error: joinError } = await supabase
        .from('match_players')
        .insert({
          match_id: matchData.id,
          player_name: playerName.trim(),
          session_id: sessionId,
        });

      if (joinError) {
        // Check if already joined
        if (joinError.code === '23505') {
          setError('You have already joined this match.');
        } else {
          throw joinError;
        }
        setLoading(false);
        return;
      }

      setCurrentMatch(matchData);
      setView('waiting');
    } catch (err) {
      console.error('Error joining match:', err);
      setError('Failed to join match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = async () => {
    if (!currentMatch) return;

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', currentMatch.id);

      if (updateError) throw updateError;

      // Game will start via the realtime subscription
    } catch (err) {
      console.error('Error starting match:', err);
      setError('Failed to start match. Please try again.');
      setLoading(false);
    }
  };

  const handleLeaveMatch = async () => {
    if (!currentMatch) return;

    try {
      await supabase
        .from('match_players')
        .delete()
        .eq('match_id', currentMatch.id)
        .eq('session_id', sessionId);

      setCurrentMatch(null);
      setPlayers([]);
      setView('menu');
    } catch (err) {
      console.error('Error leaving match:', err);
    }
  };

  const isHost = players.length > 0 && players[0].session_id === sessionId;

  if (view === 'menu') {
    return (
      <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
        {/* Beach background with sprites */}
        <BeachBackground />

        {/* Flying seagulls animation */}
        <FlyingSeagulls />

        <div className="w-full max-w-6xl relative z-10 px-4">
          {/* Pixelated game logo */}
          <div className="text-center space-y-4 mb-8">
            <div className="inline-block relative">
              <h1 className="text-6xl font-black text-white tracking-wider drop-shadow-[0_4px_0_rgba(0,0,0,0.3)] transform -rotate-2" style={{
                fontFamily: 'monospace',
                textShadow: '3px 3px 0 #f59e0b, 6px 6px 0 rgba(0,0,0,0.2)'
              }}>
                FLAPPY
              </h1>
              <h1 className="text-6xl font-black text-amber-400 tracking-wider drop-shadow-[0_4px_0_rgba(0,0,0,0.3)] transform rotate-1" style={{
                fontFamily: 'monospace',
                textShadow: '3px 3px 0 #ea580c, 6px 6px 0 rgba(0,0,0,0.2)'
              }}>
                GULL
              </h1>
            </div>
            <div className="flex items-center justify-center gap-3">
              <p className="text-white text-xl font-bold drop-shadow-lg" style={{ fontFamily: 'monospace' }}>
                How does it look like?
              </p>
              <button
                onClick={() => setShowInfoModal(true)}
                className="rounded-full border-2 border-white bg-blue-500 w-10 h-10 flex items-center justify-center text-white text-lg font-black transition-all hover:bg-blue-400 hover:scale-110 active:scale-95 shadow-lg"
                style={{ fontFamily: 'monospace' }}
                title="How to Play"
              >
                ?
              </button>
            </div>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card with pixel-art style border */}
          <div className="bg-white rounded-lg shadow-2xl border-4 border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-500 to-blue-500 p-4 border-b-4 border-gray-800">
              <h2 className="text-white text-center text-2xl font-bold" style={{ fontFamily: 'monospace' }}>
                ENTER NAME
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <input
                  id="playerName"
                  type="text"
                  maxLength={50}
                  value={playerName}
                  onChange={(e) => handlePlayerNameChange(e.target.value)}
                  className="block w-full rounded border-4 border-gray-800 px-4 py-3 text-gray-900 text-lg font-bold focus:border-amber-500 focus:outline-none"
                  placeholder="Captain Feathers"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              {error && (
                <div className="rounded border-4 border-red-600 bg-red-100 p-3 text-red-800 font-bold" style={{ fontFamily: 'monospace' }}>
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => setView('create')}
                  disabled={!playerName.trim()}
                  className="w-full rounded border-4 border-gray-800 bg-green-500 px-6 py-4 text-xl font-black text-white transition-all hover:bg-green-400 hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
                  style={{ fontFamily: 'monospace' }}
                >
                  🎮 CREATE MATCH
                </button>

                <button
                  onClick={() => setView('join')}
                  disabled={!playerName.trim()}
                  className="w-full rounded border-4 border-gray-800 bg-amber-500 px-6 py-4 text-xl font-black text-white transition-all hover:bg-amber-400 hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
                  style={{ fontFamily: 'monospace' }}
                >
                  🚪 JOIN MATCH
                </button>

                <button
                  onClick={() => window.location.href = `/game/practice?playerName=${encodeURIComponent(playerName)}&hardMode=${practiceHardMode}`}
                  disabled={!playerName.trim()}
                  className="w-full rounded border-4 border-gray-800 bg-blue-500 px-6 py-4 text-xl font-black text-white transition-all hover:bg-blue-400 hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[4px_4px_0_rgba(0,0,0,0.3)] flex items-center justify-between"
                  style={{ fontFamily: 'monospace' }}
                >
                  <span>🎯 PRACTICE MODE</span>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm">🔥 Hard Mode</span>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setPracticeHardMode(!practiceHardMode);
                      }}
                      className={`rounded border-2 px-2 py-1 text-sm font-black transition-all hover:scale-105 cursor-pointer ${
                        practiceHardMode
                          ? 'border-white bg-white text-blue-600'
                          : 'border-white bg-blue-600 text-white'
                      }`}
                      style={{ fontFamily: 'monospace' }}
                    >
                      {practiceHardMode ? 'ON' : 'OFF'}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Global Leaderboard */}
          <div className="bg-white rounded-lg shadow-2xl border-4 border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 border-b-4 border-gray-800">
              <h2 className="text-white text-center text-2xl font-bold mb-3" style={{ fontFamily: 'monospace' }}>
                🏆 TOP 10 ALL-TIME 🏆
              </h2>
              {/* Filters */}
              <div className="flex gap-3 justify-center">
                {/* Duration Dropdown */}
                <select
                  value={leaderboardDuration}
                  onChange={(e) => setLeaderboardDuration(Number(e.target.value))}
                  className="flex-1 rounded border-2 border-white bg-white px-3 py-2 text-sm font-black text-purple-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                  style={{ fontFamily: 'monospace' }}
                >
                  <option value={30}>⏱️ 30 seconds</option>
                  <option value={60}>⏱️ 1 minute</option>
                  <option value={90}>⏱️ 1.5 minutes</option>
                  <option value={120}>⏱️ 2 minutes</option>
                </select>

                {/* Difficulty Dropdown */}
                <select
                  value={leaderboardHardMode ? 'hard' : 'normal'}
                  onChange={(e) => setLeaderboardHardMode(e.target.value === 'hard')}
                  className="flex-1 rounded border-2 border-white bg-white px-3 py-2 text-sm font-black text-purple-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                  style={{ fontFamily: 'monospace' }}
                >
                  <option value="normal">⚡ Normal</option>
                  <option value="hard">🔥 Hard</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-b from-purple-50 to-pink-50 max-h-96 overflow-y-auto">
              {globalLeaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xl font-black text-gray-600 mb-2" style={{ fontFamily: 'monospace' }}>
                    NO RECORDS YET
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {globalLeaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

                    return (
                      <div
                        key={entry.id}
                        className={`rounded border-4 px-3 py-2 flex items-center justify-between ${
                          rank <= 3
                            ? 'border-gray-800 bg-white shadow-[2px_2px_0_rgba(0,0,0,0.2)]'
                            : 'border-gray-600 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Rank */}
                          <div className="w-10 text-center">
                            <span className="text-xl font-black" style={{ fontFamily: 'monospace' }}>
                              {rankEmoji}
                            </span>
                          </div>

                          {/* Player info */}
                          <div>
                            <p className="text-lg font-black text-gray-900" style={{ fontFamily: 'monospace' }}>
                              {entry.player_name}
                            </p>
                            <p className="text-xs text-gray-600" style={{ fontFamily: 'monospace' }}>
                              {new Date(entry.played_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })} • Best: {entry.best_flight}m
                            </p>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <p className="text-2xl font-black text-gray-900" style={{ fontFamily: 'monospace' }}>
                            {entry.total_score}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          </div>
          {/* End grid */}
        </div>

        {/* Info Modal */}
        {showInfoModal && <GameInfoModal onClose={() => setShowInfoModal(false)} />}
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
        {/* Beach background with sprites */}
        <BeachBackground />

        {/* Flying seagulls animation */}
        <FlyingSeagulls />

        <div className="w-full max-w-md space-y-6 relative z-10 px-4">
          <div className="bg-white rounded-lg shadow-2xl border-4 border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 border-b-4 border-gray-800">
              <h2 className="text-white text-center text-2xl font-bold" style={{ fontFamily: 'monospace' }}>
                🎮 CREATE MATCH
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded border-4 border-sky-500 bg-sky-50 p-4">
                <p className="text-gray-800 font-bold" style={{ fontFamily: 'monospace' }}>
                  👤 PLAYING AS:
                </p>
                <p className="text-xl text-gray-900 font-black mt-1" style={{ fontFamily: 'monospace' }}>
                  {playerName}
                </p>
              </div>

              {/* Match Duration Selector */}
              <div className="rounded border-4 border-amber-500 bg-amber-50 p-4">
                <p className="text-gray-800 font-bold mb-3" style={{ fontFamily: 'monospace' }}>
                  ⏱️ MATCH DURATION:
                </p>
                <div className="flex gap-2">
                  {[30, 60, 90, 120].map((seconds) => (
                    <button
                      key={seconds}
                      onClick={() => setMatchDuration(seconds)}
                      className={`flex-1 rounded border-4 px-3 py-2 font-black transition-all hover:scale-105 ${
                        matchDuration === seconds
                          ? 'border-amber-600 bg-amber-300 shadow-[2px_2px_0_rgba(0,0,0,0.3)]'
                          : 'border-gray-600 bg-white'
                      }`}
                      style={{ fontFamily: 'monospace' }}
                    >
                      {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hard Mode Toggle */}
              <div className="rounded border-4 border-red-500 bg-red-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-800 font-bold" style={{ fontFamily: 'monospace' }}>
                      🔥 HARD MODE
                    </p>
                    <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'monospace' }}>
                      Speed increases at double the rate
                    </p>
                  </div>
                  <button
                    onClick={() => setHardMode(!hardMode)}
                    className={`rounded border-4 px-4 py-2 font-black transition-all hover:scale-105 ${
                      hardMode
                        ? 'border-red-600 bg-red-400 text-white shadow-[2px_2px_0_rgba(0,0,0,0.3)]'
                        : 'border-gray-600 bg-white text-gray-600'
                    }`}
                    style={{ fontFamily: 'monospace' }}
                  >
                    {hardMode ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded border-4 border-red-600 bg-red-100 p-3 text-red-800 font-bold" style={{ fontFamily: 'monospace' }}>
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleCreateMatch}
                  disabled={loading}
                  className="w-full rounded border-4 border-gray-800 bg-green-500 px-6 py-4 text-xl font-black text-white transition-all hover:bg-green-400 hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
                  style={{ fontFamily: 'monospace' }}
                >
                  {loading ? '⏳ CREATING...' : '✨ HOST GAME'}
                </button>

                <button
                  onClick={() => {
                    setView('menu');
                    setError(null);
                  }}
                  disabled={loading}
                  className="w-full rounded border-4 border-gray-800 bg-gray-500 px-6 py-4 text-xl font-black text-white transition-all hover:bg-gray-400 hover:scale-105 active:scale-95 disabled:cursor-not-allowed shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
                  style={{ fontFamily: 'monospace' }}
                >
                  ◀️ BACK
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Modal */}
        {showInfoModal && <GameInfoModal onClose={() => setShowInfoModal(false)} />}
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
        {/* Beach background with sprites */}
        <BeachBackground />

        {/* Flying seagulls animation */}
        <FlyingSeagulls />

        <div className="w-full max-w-md space-y-6 relative z-10 px-4">
          <div className="bg-white rounded-lg shadow-2xl border-4 border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 border-b-4 border-gray-800">
              <h2 className="text-white text-center text-2xl font-bold" style={{ fontFamily: 'monospace' }}>
                🚪 JOIN MATCH
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded border-4 border-sky-500 bg-sky-50 p-4">
                <p className="text-gray-800 font-bold" style={{ fontFamily: 'monospace' }}>
                  👤 PLAYING AS:
                </p>
                <p className="text-xl text-gray-900 font-black mt-1" style={{ fontFamily: 'monospace' }}>
                  {playerName}
                </p>
              </div>

              <div>
                <label htmlFor="matchCode" className="block text-sm font-bold text-gray-800 mb-2" style={{ fontFamily: 'monospace' }}>
                  🔑 MATCH CODE:
                </label>
                <input
                  id="matchCode"
                  type="text"
                  maxLength={6}
                  value={matchCode}
                  onChange={(e) => setMatchCode(e.target.value.toUpperCase())}
                  className="block w-full rounded border-4 border-gray-800 px-4 py-3 text-center text-3xl font-bold uppercase text-gray-900 tracking-widest focus:border-amber-500 focus:outline-none"
                  placeholder="ABC123"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              {error && (
                <div className="rounded border-4 border-red-600 bg-red-100 p-3 text-red-800 font-bold" style={{ fontFamily: 'monospace' }}>
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleJoinMatch}
                  disabled={loading || !matchCode.trim()}
                  className="w-full rounded border-4 border-gray-800 bg-amber-500 px-6 py-4 text-xl font-black text-white transition-all hover:bg-amber-400 hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
                  style={{ fontFamily: 'monospace' }}
                >
                  {loading ? '⏳ JOINING...' : '🚀 JOIN GAME'}
                </button>

                <button
                  onClick={() => {
                    setView('menu');
                    setError(null);
                    setMatchCode('');
                  }}
                  disabled={loading}
                  className="w-full rounded border-4 border-gray-800 bg-gray-500 px-6 py-4 text-xl font-black text-white transition-all hover:bg-gray-400 hover:scale-105 active:scale-95 disabled:cursor-not-allowed shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
                  style={{ fontFamily: 'monospace' }}
                >
                  ◀️ BACK
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Modal */}
        {showInfoModal && <GameInfoModal onClose={() => setShowInfoModal(false)} />}
      </div>
    );
  }

  if (view === 'waiting') {
    return (
      <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
        {/* Beach background with sprites */}
        <BeachBackground />

        {/* Flying seagulls animation */}
        <FlyingSeagulls />

        <div className="w-full max-w-2xl space-y-6 relative z-10 px-4">
          <div className="bg-white rounded-lg shadow-2xl border-4 border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 border-b-4 border-gray-800">
              <h2 className="text-white text-center text-2xl font-bold" style={{ fontFamily: 'monospace' }}>
                ⏳ WAITING ROOM
              </h2>
              <div className="mt-3 text-center">
                <p className="text-white text-sm font-bold mb-1" style={{ fontFamily: 'monospace' }}>
                  🔑 MATCH CODE:
                </p>
                <div className="inline-block rounded border-4 border-white bg-purple-700 px-6 py-2">
                  <p className="text-4xl font-black tracking-widest text-white" style={{ fontFamily: 'monospace' }}>
                    {matchCode || currentMatch?.match_code}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Match Settings */}
              <div className="rounded border-4 border-amber-500 bg-amber-50 p-4">
                <p className="text-gray-800 font-bold mb-3" style={{ fontFamily: 'monospace' }}>
                  ⚙️ MATCH SETTINGS:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded border-2 border-amber-600 bg-white p-2 text-center">
                    <p className="text-xs text-gray-600" style={{ fontFamily: 'monospace' }}>DURATION</p>
                    <p className="text-lg font-black text-gray-900" style={{ fontFamily: 'monospace' }}>
                      {currentMatch && currentMatch.duration < 60 ? `${currentMatch.duration}s` : `${(currentMatch?.duration || 60) / 60}m`}
                    </p>
                  </div>
                  <div className={`rounded border-2 p-2 text-center ${currentMatch?.hard_mode ? 'border-red-600 bg-red-100' : 'border-gray-400 bg-gray-100'}`}>
                    <p className="text-xs text-gray-600" style={{ fontFamily: 'monospace' }}>DIFFICULTY</p>
                    <p className="text-lg font-black" style={{ fontFamily: 'monospace', color: currentMatch?.hard_mode ? '#DC2626' : '#4B5563' }}>
                      {currentMatch?.hard_mode ? '🔥 HARD' : '⚡ NORMAL'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-900" style={{ fontFamily: 'monospace' }}>
                    👥 PLAYERS ({players.length}/{currentMatch?.max_players || 8})
                  </h3>
                  {isHost && (
                    <span className="rounded border-2 border-yellow-600 bg-yellow-400 px-3 py-1 text-xs font-black text-yellow-900" style={{ fontFamily: 'monospace' }}>
                      👑 HOST
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between rounded border-4 border-gray-800 bg-gradient-to-r from-sky-100 to-blue-100 px-4 py-3 shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-gray-800 bg-sky-500 text-white text-xl font-black" style={{ fontFamily: 'monospace' }}>
                          {player.player_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-lg" style={{ fontFamily: 'monospace' }}>
                            {player.player_name}
                            {player.session_id === sessionId && (
                              <span className="ml-2 text-sm text-sky-600">(YOU)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {index === 0 && (
                        <span className="rounded border-2 border-yellow-600 bg-yellow-300 px-2 py-1 text-xs font-black text-yellow-900" style={{ fontFamily: 'monospace' }}>
                          👑 HOST
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded border-4 border-red-600 bg-red-100 p-3 text-red-800 font-bold" style={{ fontFamily: 'monospace' }}>
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-3">
                {isHost && (
                  <button
                    onClick={handleStartMatch}
                    disabled={loading || players.length < 2}
                    className="w-full rounded border-4 border-gray-800 bg-green-500 px-6 py-4 text-xl font-black text-white transition-all hover:bg-green-400 hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
                    style={{ fontFamily: 'monospace' }}
                  >
                    {loading ? '⏳ STARTING...' : players.length < 2 ? '⏳ WAITING...' : '🚀 START MATCH!'}
                  </button>
                )}

                {!isHost && (
                  <div className="rounded border-4 border-yellow-600 bg-yellow-100 p-4 text-center">
                    <p className="text-yellow-900 font-bold text-lg" style={{ fontFamily: 'monospace' }}>
                      ⏳ WAITING FOR HOST...
                    </p>
                  </div>
                )}

                <button
                  onClick={handleLeaveMatch}
                  disabled={loading}
                  className="w-full rounded border-4 border-gray-800 bg-red-500 px-6 py-4 text-xl font-black text-white transition-all hover:bg-red-400 hover:scale-105 active:scale-95 disabled:cursor-not-allowed shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
                  style={{ fontFamily: 'monospace' }}
                >
                  ❌ LEAVE MATCH
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Modal */}
        {showInfoModal && <GameInfoModal onClose={() => setShowInfoModal(false)} />}
      </div>
    );
  }

  return null;
}
