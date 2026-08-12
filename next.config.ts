import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* Production target: Cloudflare Workers via @opennextjs/cloudflare (OpenNext). */
};

export default nextConfig;

// Enables Cloudflare bindings during `next dev` (no-op for local Canvas/UI work).
initOpenNextCloudflareForDev();
