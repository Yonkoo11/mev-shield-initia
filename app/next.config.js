/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_ACTIONS === "true";
const nextConfig = {
  output: "export",
  basePath: isGhPages ? "/mev-shield-initia" : "",
  assetPrefix: isGhPages ? "/mev-shield-initia/" : "",
  images: { unoptimized: true },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false, os: false };
    return config;
  },
};
module.exports = nextConfig;
