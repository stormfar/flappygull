'use client';

import { useEffect, useState } from 'react';

interface SeagullFlight {
  id: number;
  startX: number;
  direction: 'left' | 'right';
  speed: number; // pixels per second
  altitude: number; // Y position
  size: number;
  createdAt: number; // timestamp for cleanup
}

export default function FlyingSeagulls() {
  const [seagulls, setSeagulls] = useState<SeagullFlight[]>([]);

  useEffect(() => {
    let nextId = 0; // Local variable instead of state
    let scheduleTimeout: NodeJS.Timeout | null = null;

    // Spawn a new seagull every 15-25 seconds (very reduced frequency)
    const spawnSeagull = () => {
      if (typeof window === 'undefined') return;

      const direction = Math.random() > 0.5 ? 'left' : 'right';
      const startX = direction === 'left' ? window.innerWidth + 100 : -100;

      // Speed categories: normal (300), fast (600), very fast (1200), LUDICROUS (2400)
      const speedOptions = [300, 300, 600, 600, 1200, 2400];
      const speed = speedOptions[Math.floor(Math.random() * speedOptions.length)];

      const newSeagull: SeagullFlight = {
        id: nextId++,
        startX,
        direction,
        speed,
        altitude: Math.random() * 50 + 10, // 10-60% from top
        size: Math.random() * 0.4 + 0.6, // 0.6-1.0x size
        createdAt: Date.now(),
      };

      setSeagulls((prev) => [...prev, newSeagull]);
    };

    // Initial spawn after a delay
    const initialTimer = setTimeout(spawnSeagull, 5000);

    // Regular spawning every 15-25 seconds (very reduced frequency)
    const scheduleNext = () => {
      const delay = Math.random() * 10000 + 15000; // 15-25 seconds
      scheduleTimeout = setTimeout(() => {
        spawnSeagull();
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    // Cleanup old seagulls every 2 seconds (remove any older than 15 seconds)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setSeagulls((prev) => prev.filter((seagull) => now - seagull.createdAt < 15000));
    }, 2000);

    return () => {
      clearTimeout(initialTimer);
      if (scheduleTimeout) {
        clearTimeout(scheduleTimeout);
      }
      clearInterval(cleanupInterval);
    };
  }, []); // Empty dependency array - run once on mount

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      {seagulls.map((seagull) => (
        <SeagullSprite key={seagull.id} flight={seagull} />
      ))}
    </div>
  );
}

function SeagullSprite({ flight }: { flight: SeagullFlight }) {
  const [position, setPosition] = useState(flight.startX);
  const [frame, setFrame] = useState<'flap_1' | 'flap_2' | 'flap_3' | 'glide'>(flight.speed > 800 ? 'flap_1' : 'glide');

  useEffect(() => {
    const startTime = Date.now();
    const directionMultiplier = flight.direction === 'left' ? -1 : 1; // left = negative X (moving from right to left)

    // Animate position
    let animationFrameId: number;
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newPosition = flight.startX + directionMultiplier * flight.speed * elapsed;

      setPosition(newPosition);

      // Continue if still potentially visible
      if (elapsed < 20) { // Max 20 seconds
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    // Flapping animation (cycle through frames faster for faster birds)
    const flapSpeed = Math.max(100, Math.min(200, 250 - (flight.speed / 15)));
    let frameIndex = 0;
    const frames: Array<'flap_1' | 'flap_2' | 'flap_3' | 'glide'> = flight.speed > 800
      ? ['flap_1', 'flap_2', 'flap_3', 'flap_2'] // Fast birds flap
      : ['glide', 'flap_1', 'glide', 'flap_1']; // Slow birds mostly glide

    const flapInterval = setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;
      setFrame(frames[frameIndex]);
    }, flapSpeed);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(flapInterval);
    };
  }, [flight]);

  const isLudicrous = flight.speed > 1500;

  // Sprite sheet frame coordinates from atlas
  const frameData: Record<string, {x: number, y: number, w: number, h: number}> = {
    'flap_1': { x: 5, y: 31, w: 375, h: 248 },
    'flap_2': { x: 386, y: 34, w: 386, h: 241 },
    'flap_3': { x: 775, y: 34, w: 380, h: 242 },
    'glide': { x: 12, y: 347, w: 361, h: 235 },
  };

  const currentFrame = frameData[frame];
  const scale = 0.3; // Scale down the sprite
  const displayWidth = currentFrame.w * scale;
  const displayHeight = currentFrame.h * scale;

  return (
    <div
      className="absolute"
      style={{
        left: `${position}px`,
        top: `${flight.altitude}%`,
        transform: `scale(${flight.size * (isLudicrous ? 1.3 : 1)}) ${flight.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}`,
        filter: isLudicrous ? 'blur(2px) brightness(1.2)' : 'drop-shadow(3px 3px 6px rgba(0,0,0,0.4))',
        opacity: isLudicrous ? 0.9 : 1,
        transition: 'none',
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
      }}
    >
      <div
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          backgroundImage: 'url(/assets/sprites/seagull_sprite_sheet.png)',
          backgroundPosition: `-${currentFrame.x * scale}px -${currentFrame.y * scale}px`,
          backgroundSize: `${1158 * scale}px ${620 * scale}px`,
          imageRendering: 'pixelated',
        }}
      />
      {isLudicrous && (
        <div
          className="absolute -right-8 top-1/2 -translate-y-1/2 text-3xl"
          style={{ animation: 'pulse 0.2s ease-in-out infinite' }}
        >
          💨💨
        </div>
      )}
    </div>
  );
}
