import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Build paths start at /frontend (the repo folder name has spaces, which Vercel does not allow)
  outputFileTracingRoot: frontendDir,
  // "standalone" is only needed for the Docker image; Vercel builds its own way
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};

export default nextConfig;