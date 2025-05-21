import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
  },
};

export default nextConfig;
