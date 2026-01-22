import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence the warning
  turbopack: {},
  // Phaser uses webpack under the hood and needs these configurations
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
  // Disable image optimization for game assets
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
