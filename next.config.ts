import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Ensure WebSocket support
  experimental: {
    serverComponentsExternalPackages: ["socket.io"],
  },
};

export default nextConfig;
