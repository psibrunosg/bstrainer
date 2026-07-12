import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bstrainer/domain", "@bstrainer/engine"],
};

export default nextConfig;
