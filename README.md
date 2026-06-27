# bridge-to-layer-frontend

Front-end for bridging TRB to Tellor.

## Local development

Requires [Node.js 22+](https://nodejs.org/) and pnpm 11 (via Corepack).

```bash
corepack enable
corepack prepare pnpm@11.4.0 --activate
pnpm install
pnpm dev
```

- App: http://localhost:8000/
- Test suite: http://localhost:8000/tests/test-suite.html

This project uses pnpm with a 30-day `minimumReleaseAge` policy (see `pnpm-workspace.yaml`). Use pnpm only; `npm install` / `yarn` are blocked by `preinstall`.
