import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
// GitHub Pages serve em /bstrainer; em dev fica na raiz.
const basePath = isProd ? "/bstrainer" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["@bstrainer/domain", "@bstrainer/engine"],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
