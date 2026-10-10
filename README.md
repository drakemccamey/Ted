# Ted

## Ted’s Top Dogs leaderboard

The Flappy Ted page is static on GitHub Pages. Its shared top-five leaderboard uses a Cloudflare Worker API and a Cloudflare D1 database; the browser never receives database credentials. Both services have free tiers, subject to Cloudflare’s current usage limits.

### Set up the API

The existing database is `teds-leaderboard`; its ID is configured in `leaderboard/wrangler.toml`. Do not create another database. The allowed browser origin is set to `https://tedskitchen.com`. The existing migration has been applied and the Worker deployed at `https://teds-top-dogs-api.drakemccamey.workers.dev`.

1. Authenticate Wrangler with `npx wrangler login` if not already logged in.
2. To apply any pending schema migration and deploy an updated API from the repository root:

   ```sh
   npx wrangler d1 migrations apply teds-leaderboard --remote --config leaderboard/wrangler.toml
   npx wrangler deploy --config leaderboard/wrangler.toml
   ```

3. The game’s `leaderboard-api-url` in `play/index.html` should contain the deployed Worker base URL; the API endpoint is that URL followed by `/scores`.
4. Publish the website through the existing GitHub Pages setup when ready. The deployed Worker is live now; this local website URL change will only be visible to players after the site itself is published.

Use Wrangler’s interactive login for deployment. Do not put Cloudflare API tokens, D1 credentials, or other secrets in this repository or in the GitHub Pages files. The Worker’s D1 binding is server-side; `ALLOWED_ORIGIN` and the public Worker URL are configuration, not secrets.

The Worker validates request format, nickname length, score bounds, and whether the score qualifies for a top-five slot. It also keeps only the current five scores. Since Flappy Ted runs entirely in the browser and players do not log in, a determined user can still forge a score; preventing that requires making game runs verifiable server-side and is outside this lightweight leaderboard.