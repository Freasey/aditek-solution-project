/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare/types.d.ts" />

declare namespace App {
  interface Locals {
    /** Email dari JWT Cloudflare Access, hanya terisi di /admin dan /api/admin. */
    user?: { email: string };
  }
}
