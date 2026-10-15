# Cloudflare branch previews

SBW Skunkworks uses `main` for production and non-main branches for preview builds.

Cloudflare Workers Builds configuration:

- Production branch: `main`
- Production deploy command: `npm run deploy`
- Enable Preview Builds under Settings > Build > Branch control
- Preview command: `npm run deploy:preview`

The preview script runs the OpenNext Cloudflare build and then `wrangler preview`. Each development branch gets a preview URL, while individual deployments can have immutable deployment URLs. Preview builds do not replace production.

**Note:** Preview environments do not automatically inherit production variables or secrets. Configure preview bindings and variables separately in Cloudflare as needed. Preview URLs are public by default; protect internal deployments with Cloudflare Access.
