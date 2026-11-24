import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: frontendDir,
  // On Vercel: plain static site (every page is static, the data comes from the API on Render).
  // Elsewhere (Docker): standalone Node server.
  output: process.env.VERCEL ? "export" : "standalone",
  trailingSlash: true,
};

export default nextConfig;