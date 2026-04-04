/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_ACTIONS === "true";
const nextConfig = {
  output: "export",
  basePath: isGhPages ? "/batchfi" : "",
  assetPrefix: isGhPages ? "/batchfi/" : "",
  images: { unoptimized: true },
};
module.exports = nextConfig;
