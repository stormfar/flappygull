'use client';

import { useEffect, useState, useRef } from 'react';

interface SeagullFlight {
  id: number;
  startX: number;
  direction: 'left' | 'right';
  speed: number; // pixels per second
  altitude: number; // Y position
  size: number;
  createdAt: number; // timestamp for cleanup
  state?: 'flying' | 'falling' | 'dead'; // Animation state
  shotAtX?: number; // X position when shot
  shotAtY?: number; // Y position when shot
}

export default function FlyingSeagulls() {
  const [seagulls, setSeagulls] = useState<SeagullFlight[]>([]);

  useEffect(() => {
    let nextId = 0; // Local variable instead of state
    let scheduleTimeout: NodeJS.Timeout | null = null;

    // Spawn a new seagull (with limit check)
    const spawnSeagull = () => {
      if (typeof window === 'undefined') return;

      setSeagulls((prev) => {
        // Count how many flying birds are currently on screen
        const flyingCount = prev.filter(s => s.state === 'flying' || s.state === undefined).length;
        
        // Limit to max 2 flying birds at once to avoid clutter
        if (flyingCount >= 2) {
          return prev; // Don't spawn if too many birds already flying
        }

        const direction = Math.random() > 0.5 ? 'left' : 'right';
        const startX = direction === 'left' ? window.innerWidth + 100 : -100;

      // Speed categories: normal (400), fast (600), very fast (1200), LUDICROUS (2400)
      // Increased slowest speed from 300 to 400
      const speedOptions = [400, 400, 600, 600, 1200, 2400];
      const speed = speedOptions[Math.floor(Math.random() * speedOptions.length)];

        const newSeagull: SeagullFlight = {
          id: nextId++,
          startX,
          direction,
          speed,
          altitude: Math.random() * 50 + 10, // 10-60% from top
          size: Math.random() * 0.4 + 0.6, // 0.6-1.0x size
          createdAt: Date.now(),
          state: 'flying',
        };

        return [...prev, newSeagull];
      });
    };

    // Initial spawn after a shorter delay
    const initialTimer = setTimeout(spawnSeagull, 2000);

    // Regular spawning every 2-5 seconds (very frequent)
    const scheduleNext = () => {
      const delay = Math.random() * 3000 + 2000; // 2-5 seconds
      scheduleTimeout = setTimeout(() => {
        spawnSeagull();
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    // Cleanup old seagulls every 3 seconds
    // Never remove dead birds - they pile up on the floor
    // Only remove flying birds that are definitely off-screen (60+ seconds)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setSeagulls((prev) =>
        prev.filter((seagull) => {
          const age = now - seagull.createdAt;
          if (seagull.state === 'dead') {
            return true; // Never remove dead birds - they stay on the floor
          }
          // Keep flying birds much longer - only remove if they're definitely off-screen
          // A bird at 400px/s can cross a 2000px screen in ~5 seconds, so 60 seconds is very safe
          return age < 60000; // 60 seconds for flying birds (very conservative)
        })
      );
    }, 3000); // Check every 3 seconds instead of 2

    return () => {
      clearTimeout(initialTimer);
      if (scheduleTimeout) {
        clearTimeout(scheduleTimeout);
      }
      clearInterval(cleanupInterval);
    };
  }, []); // Empty dependency array - run once on mount

  const handleSeagullShot = (id: number) => {
    setSeagulls((prev) =>
      prev.map((seagull) => {
        if (seagull.id === id && seagull.state === 'flying') {
          // Calculate current position based on elapsed time
          const elapsed = (Date.now() - seagull.createdAt) / 1000;
          const directionMultiplier = seagull.direction === 'left' ? -1 : 1;
          const currentX = seagull.startX + directionMultiplier * seagull.speed * elapsed;
          const currentY = (window.innerHeight * seagull.altitude) / 100;
          
          return {
            ...seagull,
            state: 'falling' as const,
            shotAtX: currentX,
            shotAtY: currentY,
          };
        }
        return seagull;
      })
    );
  };

  // Update seagull state to dead when it hits ground
  const handleSeagullDead = (id: number) => {
    setSeagulls((prev) =>
      prev.map((seagull) => {
        if (seagull.id === id && seagull.state === 'falling') {
          return {
            ...seagull,
            state: 'dead' as const,
          };
        }
        return seagull;
      })
    );
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 5, pointerEvents: 'none' }}>
      {seagulls.map((seagull) => (
        <SeagullSprite
          key={seagull.id}
          flight={seagull}
          onShot={() => handleSeagullShot(seagull.id)}
          onDead={() => handleSeagullDead(seagull.id)}
        />
      ))}
    </div>
  );
}

function SeagullSprite({ flight, onShot, onDead }: { flight: SeagullFlight; onShot: () => void; onDead: () => void }) {
  const [position, setPosition] = useState(flight.startX);
  const [yPosition, setYPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      return (window.innerHeight * flight.altitude) / 100;
    }
    return flight.altitude;
  });
  const [frame, setFrame] = useState<'flap_1' | 'flap_2' | 'flap_3' | 'glide' | 'falling' | 'death'>(() => {
    return flight.speed > 800 ? 'flap_1' : 'glide';
  });

  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(0);
  const fallStartTimeRef = useRef<number | null>(null);
  const stateRef = useRef<'flying' | 'falling' | 'dead'>(flight.state || 'flying');
  const shotPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize start time on mount
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [flight.id]);

  // Track flight state - will be checked in animation loop

  // Main animation loop - runs continuously
  useEffect(() => {
    const directionMultiplier = flight.direction === 'left' ? -1 : 1;
    const startTime = startTimeRef.current;

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const currentState = flight.state || 'flying';

      // Check for state transitions
      if (currentState === 'falling' && stateRef.current === 'flying') {
        // Just transitioned to falling
        stateRef.current = 'falling';
        if (flight.shotAtX !== undefined && flight.shotAtY !== undefined) {
          shotPositionRef.current = { x: flight.shotAtX, y: flight.shotAtY };
          setPosition(flight.shotAtX);
          setYPosition(flight.shotAtY);
          setFrame('falling');
          fallStartTimeRef.current = Date.now();
        }
      } else if (currentState === 'dead' && stateRef.current !== 'dead') {
        stateRef.current = 'dead';
        setFrame('death');
      }

      if (currentState === 'flying') {
        // Normal flying animation
        const newPosition = flight.startX + directionMultiplier * flight.speed * elapsed;
        setPosition(newPosition);
        const yPos = typeof window !== 'undefined' ? (window.innerHeight * flight.altitude) / 100 : flight.altitude;
        setYPosition(yPos);

        // Continue animation
        animationRef.current = requestAnimationFrame(animate);
      } else if (currentState === 'falling' && stateRef.current === 'falling') {
        // Falling animation
        if (shotPositionRef.current && fallStartTimeRef.current) {
          const fallElapsed = (Date.now() - fallStartTimeRef.current) / 1000;
          const gravity = 800; // pixels per second squared
          const fallDistance = 0.5 * gravity * fallElapsed * fallElapsed;
          const newY = shotPositionRef.current.y + fallDistance;
          const maxY = typeof window !== 'undefined' ? window.innerHeight - 80 : 800;

          if (newY >= maxY) {
            // Hit the ground
            stateRef.current = 'dead';
            setFrame('death');
            setYPosition(maxY);
            onDead();
          } else {
            setYPosition(newY);
            animationRef.current = requestAnimationFrame(animate);
          }
        } else {
          // Continue animation loop even if falling hasn't started yet
          animationRef.current = requestAnimationFrame(animate);
        }
      } else if (currentState === 'dead') {
        // Dead - stay in place, no animation
      } else {
        // Continue animation loop
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight.id, flight.startX, flight.direction, flight.speed, flight.altitude, onDead]);

  // Flapping animation (only when flying)
  useEffect(() => {
    if (stateRef.current !== 'flying') return;

    const flapSpeed = Math.max(100, Math.min(200, 250 - (flight.speed / 15)));
    let frameIndex = 0;
    const frames: Array<'flap_1' | 'flap_2' | 'flap_3' | 'glide'> = flight.speed > 800
      ? ['flap_1', 'flap_2', 'flap_3', 'flap_2']
      : ['glide', 'flap_1', 'glide', 'flap_1'];

    const flapInterval = setInterval(() => {
      if (stateRef.current === 'flying') {
        frameIndex = (frameIndex + 1) % frames.length;
        setFrame(frames[frameIndex]);
      }
    }, flapSpeed);

    return () => clearInterval(flapInterval);
  }, [flight.id, flight.speed]);

  const isLudicrous = flight.speed > 1500;
  const currentState = flight.state || 'flying';

  // Sprite sheet frame coordinates from atlas
  const frameData: Record<string, {x: number, y: number, w: number, h: number}> = {
    'flap_1': { x: 5, y: 31, w: 375, h: 248 },
    'flap_2': { x: 386, y: 34, w: 386, h: 241 },
    'flap_3': { x: 775, y: 34, w: 380, h: 242 },
    'glide': { x: 12, y: 347, w: 361, h: 235 },
    'falling': { x: 404, y: 310, w: 350, h: 310 },
    'death': { x: 795, y: 339, w: 340, h: 251 },
  };

  const currentFrame = frameData[frame];
  const scale = 0.3;
  const displayWidth = currentFrame.w * scale;
  const displayHeight = currentFrame.h * scale;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (currentState === 'flying') {
      onShot();
    }
  };

  return (
    <div
      className="absolute"
      style={{
        left: `${position}px`,
        top: `${yPosition}px`,
        transform: `scale(${flight.size * (isLudicrous ? 1.3 : 1)}) ${flight.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'}`,
        filter: isLudicrous ? 'blur(2px) brightness(1.2)' : 'drop-shadow(3px 3px 6px rgba(0,0,0,0.4))',
        opacity: isLudicrous ? 0.9 : 1,
        transition: 'none',
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
        pointerEvents: currentState === 'flying' ? 'auto' : 'none',
        cursor: currentState === 'flying' ? 'crosshair' : 'default',
        zIndex: currentState === 'dead' ? 1 : 10,
      }}
      onClick={handleClick}
      onMouseDown={handleClick}
      title={currentState === 'flying' ? 'Click to shoot!' : undefined}
    >
      <div
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          backgroundImage: 'url(/assets/sprites/seagull_sprite_sheet.png)',
          backgroundPosition: `-${currentFrame.x * scale}px -${currentFrame.y * scale}px`,
          backgroundSize: `${1158 * scale}px ${620 * scale}px`,
          imageRendering: 'pixelated',
          pointerEvents: 'none', // Make the inner div non-interactive
        }}
      />
      {isLudicrous && (
        <div
          className="absolute -right-8 top-1/2 -translate-y-1/2 text-3xl"
          style={{ animation: 'pulse 0.2s ease-in-out infinite', pointerEvents: 'none' }}
        >
          💨💨
        </div>
      )}
    </div>
  );
}
