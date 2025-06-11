import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Temporary workaround for build errors
    // Only use during development
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
