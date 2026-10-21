# SBW Skunkworks Deployment Rules

1. Collect every change requested in the conversation before modifying production.
2. Inspect the current main branch, recent release history, and active hosting provider. Never guess the next version. The next release number must exceed the highest existing SBW Skunkworks V# release.
3. Work on one non-production feature branch or GitHub tree. Do not update main for individual fixes. Preserve all working features.
4. Verify every external API endpoint, HTTP method, parameters, payload shape, and free-tier permissions against official documentation. Never invent an API route or response field. Keep secrets server-side.
5. Implement all requested changes together. Validate TypeScript, data mappings, calculations, caching, error states, and production build before merging.
6. Use one release commit/merge to main for the entire conversation. No intermediate main commits or separate deploys.
7. Deploy exclusively to Render while Render is active. Do not trigger Vercel, Netlify, or other builds.
8. The release title and Render deployment label must be exactly `SBW Skunkworks V#` with no suffix. Increment from the highest actual release number, not from memory.
9. Verify the Render deployment succeeded and that affected pages and APIs work in production. If the deployment fails, correct it and retry the SAME release number.
10. Respond only after production verification, reporting the release number, changes, and any genuine remaining limitations. Do not announce GitHub-only changes as completed deployments.
11. If required build or Render verification access is unavailable, disclose that limitation once; do not claim completion, invent verification, or keep creating production commits.
12. Stay within free API quotas; cache and deduplicate, and never fabricate financial figures.
