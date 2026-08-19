# Software Engineer Portfolio

Phase 0 of a desktop-first, spatially inspired portfolio. This phase establishes the route contract, centralized content map, persistent DOM shell, and automated validation. The WebGL graph is intentionally deferred until Phase 1 receives separate approval.

## Routes

- `/`
- `/about`
- `/experience`
- `/projects`
- `/education`
- `/skills`
- `/contact`

All route and subsection metadata lives in `src/lib/portfolio-map.ts`.

## Local development

Use Node 24, matching `.nvmrc`.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

The Playwright suite starts the application on port `3100` and validates direct routing, client navigation, browser history, and the custom 404 page.

## Deployment preparation

The project uses a standard Next.js build and is ready to import into Vercel. No Vercel project, remote repository, domain, analytics, or production deployment is created in Phase 0.

## Phase boundary

Not included yet:

- Three.js or React Three Fiber
- WebGL canvas or node graph
- Camera choreography
- Routed HUD panels
- Visual-effects and adaptive-quality systems
