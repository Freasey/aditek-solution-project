// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://worksell.id',
  output: 'server',
  trailingSlash: 'never',
  // Sessions are not used, so no KV namespace is provisioned.
  session: false,
  // Photos are served from R2 through the <Img> component, not astro:assets.
  adapter: cloudflare({ imageService: 'passthrough' }),
  build: { inlineStylesheets: 'never', format: 'file' },
  security: { checkOrigin: true },
  devToolbar: { enabled: false },
  // Script selalu jadi file terpisah supaya CSP tidak butuh 'unsafe-inline'.
  vite: {
    build: { assetsInlineLimit: 0 },
    environments: { client: { build: { assetsInlineLimit: 0 } } },
  },
});
