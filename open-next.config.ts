/**
 * OpenNext → Cloudflare Workers adapter config.
 * Incremental cache (R2) is optional — enable later when an R2 bucket is created.
 * Do not deploy from this milestone; config only.
 */
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
