'use client';

interface GameInfoModalProps {
  onClose: () => void;
}

export default function GameInfoModal({ onClose }: GameInfoModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-lg border-4 border-gray-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-500 p-4 border-b-4 border-gray-800 flex items-center justify-between">
          <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'monospace' }}>
            📖 HOW TO PLAY
          </h2>
          <button
            onClick={onClose}
            className="rounded border-2 border-white bg-red-500 px-3 py-1 text-lg font-black text-white transition-all hover:bg-red-400 hover:scale-105"
            style={{ fontFamily: 'monospace' }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-gradient-to-b from-sky-50 to-blue-50">
          {/* Game Overview */}
          <div className="rounded border-4 border-sky-500 bg-white p-4">
            <h3 className="text-xl font-black text-gray-900 mb-2" style={{ fontFamily: 'monospace' }}>
              🎮 THE GAME
            </h3>
            <p className="text-gray-700" style={{ fontFamily: 'monospace' }}>
              Guide your seagull through obstacles by tapping SPACE or clicking the screen to flap.
              Survive as long as possible within the time limit to rack up points!
            </p>
          </div>

          {/* Scoring System */}
          <div className="rounded border-4 border-amber-500 bg-white p-4">
            <h3 className="text-xl font-black text-gray-900 mb-3" style={{ fontFamily: 'monospace' }}>
              💯 SCORING SYSTEM
            </h3>
            <div className="space-y-2 text-gray-700" style={{ fontFamily: 'monospace' }}>
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                <div>
                  <strong>Distance = Points:</strong> Every metre flown = 1 base point
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                <div>
                  <strong>Multipliers:</strong> Every 100m increases your multiplier by 1x (100m = x2, 200m = x3, etc.)
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                <div>
                  <strong>Tokens:</strong> Collect coins and stars for +10 bonus points (multiplied by your current multiplier!)
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                <div>
                  <strong>Multiple Attempts:</strong> You have 60 seconds (or custom duration) to make as many attempts as you want. Your <strong>total score</strong> accumulates across all attempts!
                </div>
              </div>
            </div>
          </div>

          {/* Speed Increases */}
          <div className="rounded border-4 border-red-500 bg-white p-4">
            <h3 className="text-xl font-black text-gray-900 mb-3" style={{ fontFamily: 'monospace' }}>
              ⚡ DIFFICULTY
            </h3>
            <div className="space-y-2 text-gray-700" style={{ fontFamily: 'monospace' }}>
              <div className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <div>
                  <strong>Normal Mode:</strong> Game speed increases by 20% every 50 metres
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <div>
                  <strong>Hard Mode:</strong> Game speed increases by 40% every 50 metres (for the truly brave!)
                </div>
              </div>
            </div>
          </div>

          {/* Multiplayer */}
          <div className="rounded border-4 border-purple-500 bg-white p-4">
            <h3 className="text-xl font-black text-gray-900 mb-3" style={{ fontFamily: 'monospace' }}>
              👥 MULTIPLAYER
            </h3>
            <div className="space-y-2 text-gray-700" style={{ fontFamily: 'monospace' }}>
              <div className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <div>
                  <strong>Fair Competition:</strong> All players face the exact same obstacles (same seed)
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <div>
                  <strong>Ghost Seagulls:</strong> See other players&apos; seagulls in real-time as coloured ghosts
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                <div>
                  <strong>Live Leaderboard:</strong> Watch rankings update in real-time during the match
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="rounded border-4 border-green-500 bg-white p-4">
            <h3 className="text-xl font-black text-gray-900 mb-3" style={{ fontFamily: 'monospace' }}>
              💡 PRO TIPS
            </h3>
            <div className="space-y-2 text-gray-700" style={{ fontFamily: 'monospace' }}>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <div>
                  Use <strong>Practice Mode</strong> to master the controls before competing
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <div>
                  Long flights with multipliers are worth MORE than many short flights
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <div>
                  Don&apos;t give up after crashing - you have the full time limit to keep trying!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-4 border-gray-800 bg-white">
          <button
            onClick={onClose}
            className="w-full rounded border-4 border-gray-800 bg-blue-500 px-6 py-3 text-xl font-black text-white transition-all hover:bg-blue-400 hover:scale-105 active:scale-95 shadow-[4px_4px_0_rgba(0,0,0,0.3)]"
            style={{ fontFamily: 'monospace' }}
          >
            GOT IT! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
