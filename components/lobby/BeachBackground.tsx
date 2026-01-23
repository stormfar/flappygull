'use client';

export default function BeachBackground() {

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Sky gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-400 to-amber-200"></div>

      {/* Sky texture layer */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'url(/assets/backgrounds/sky.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Animated clouds - multiple layers for depth */}
      <div className="absolute inset-0">
        {/* Cloud layer 1 - slowest, furthest back */}
        <div
          className="absolute top-10 left-0 w-48 h-24 opacity-60"
          style={{
            backgroundImage: 'url(/assets/backgrounds/cloud1.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            animation: 'floatCloud 40s linear infinite',
          }}
        />
        <div
          className="absolute top-20 right-10 w-56 h-28 opacity-50"
          style={{
            backgroundImage: 'url(/assets/backgrounds/cloud2.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            animation: 'floatCloud 50s linear infinite reverse',
          }}
        />
        <div
          className="absolute top-32 left-1/4 w-40 h-20 opacity-55"
          style={{
            backgroundImage: 'url(/assets/backgrounds/cloud3.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            animation: 'floatCloud 45s linear infinite',
          }}
        />

        {/* Cloud layer 2 - medium speed */}
        <div
          className="absolute top-16 left-1/3 w-44 h-22 opacity-65"
          style={{
            backgroundImage: 'url(/assets/backgrounds/cloud2.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            animation: 'floatCloud 35s linear infinite reverse',
          }}
        />
        <div
          className="absolute top-24 right-1/4 w-52 h-26 opacity-60"
          style={{
            backgroundImage: 'url(/assets/backgrounds/cloud1.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            animation: 'floatCloud 42s linear infinite',
          }}
        />
      </div>

      {/* Water layer with waves */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 opacity-40"
        style={{
          backgroundImage: 'url(/assets/backgrounds/water.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'bottom',
          backgroundRepeat: 'repeat-x',
          animation: 'waveMove 20s linear infinite',
        }}
      />

      {/* Beach sand gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-amber-600 via-amber-400 to-amber-200 opacity-60"></div>

      {/* Hills in the background */}
      <div
        className="absolute bottom-32 left-0 w-64 h-32 opacity-50"
        style={{
          backgroundImage: 'url(/assets/backgrounds/hill.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div
        className="absolute bottom-28 right-0 w-56 h-28 opacity-45"
        style={{
          backgroundImage: 'url(/assets/backgrounds/hill.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          transform: 'scaleX(-1)',
        }}
      />

      {/* Beach plants and bushes - scattered along the bottom */}
      <div
        className="absolute bottom-20 left-10 w-24 h-32 opacity-70"
        style={{
          backgroundImage: 'url(/assets/backgrounds/plant.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom',
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
        }}
      />
      <div
        className="absolute bottom-18 right-20 w-32 h-40 opacity-65"
        style={{
          backgroundImage: 'url(/assets/backgrounds/bush.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom',
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
        }}
      />
      <div
        className="absolute bottom-22 left-1/3 w-20 h-28 opacity-60"
        style={{
          backgroundImage: 'url(/assets/backgrounds/plant.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom',
          transform: 'scaleX(-1)',
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
        }}
      />
      <div
        className="absolute bottom-20 right-1/3 w-28 h-36 opacity-68"
        style={{
          backgroundImage: 'url(/assets/backgrounds/bush.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom',
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
        }}
      />
      <div
        className="absolute bottom-22 left-3/4 w-22 h-30 opacity-65"
        style={{
          backgroundImage: 'url(/assets/backgrounds/plant.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom',
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
        }}
      />

      {/* Beach umbrellas - decorative elements */}
      <div
        className="absolute bottom-24 left-1/4 w-16 h-20 opacity-80"
        style={{
          backgroundImage: 'url(/assets/platformer-art-deluxe/Request pack/Tiles/umbrellaOpen.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom',
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
        }}
      />
      <div
        className="absolute bottom-26 right-1/4 w-14 h-18 opacity-75"
        style={{
          backgroundImage: 'url(/assets/platformer-art-deluxe/Request pack/Tiles/umbrellaOpen.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom',
          transform: 'scaleX(-1)',
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
        }}
      />
      <div
        className="absolute bottom-28 left-2/3 w-12 h-16 opacity-70"
        style={{
          backgroundImage: 'url(/assets/platformer-art-deluxe/Request pack/Tiles/umbrellaOpen.png)',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'bottom',
          filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
        }}
      />

    </div>
  );
}
