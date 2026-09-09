import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  serverExternalPackages: ["pdf-parse", "epub2", "bcryptjs", "stripe", "@aws-sdk/client-s3"],
};

export default nextConfig;
