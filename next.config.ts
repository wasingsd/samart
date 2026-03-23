import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Firebase Admin + tRPC use edge-incompatible APIs
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
