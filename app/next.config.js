/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_ACTIONS === "true";
const nextConfig = {
  output: "export",
  basePath: isGhPages ? "/mev-shield-initia" : "",
  assetPrefix: isGhPages ? "/mev-shield-initia/" : "",
  images: { unoptimized: true },
};
module.exports = nextConfig;
