# Software Engineer Portfolio

Phase 4 of a desktop-first spatial portfolio. The current foundation includes a persistent React Three Fiber graph, camera-to-route choreography, near-fullscreen routed HUD panels, conventional fallback navigation, production-quality sample templates, and a performance-aware cyberpunk visual-effects system.

## Routes

- `/`
- `/about`
- `/experience`
- `/projects`
- `/education`
- `/skills`
- `/contact`

Route and subsection metadata lives in `src/lib/portfolio-map.ts`. Fictional template records live in `src/lib/portfolio-content.ts` and must be replaced with verified personal information before deployment.

## Local development

Use Node 24, matching `.nvmrc`.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Performance diagnostics

The home scene exposes compact controls for isolating render costs. They are visible by default in development, can be hidden with `debugPerformance=0`, and are opt-in for production previews with `debugPerformance=1`:

- `debugPerformance=1|0` explicitly shows or hides the diagnostics. Use `?debugPerformance=1` with `npm start` to profile the optimized production bundle.
- `debugQuality=high|balanced|economy` locks a quality tier; omit it to use hardware selection and FPS-based adaptation.
- `debugVfx=full|bloom|environment|off` isolates the post-processing and environmental effect groups.
- `debugNodes=25..50` retains the Phase 2 graph stress fixture.

Diagnostics report average FPS, maximum frame time, the percentage of frames slower than 25 ms, renderer DPR, draw calls, triangle count, and the actual WebGL MSAA context state. The additional frame-time signals distinguish sustained load from intermittent jank that an FPS average can hide.

Quality tiers vary device pixel ratio, deterministic particle and data-pulse counts, bloom resolution, and bloom intensity. Economy mode removes the bloom post-processing pass and pauses the most expensive decorative CSS motion. Automatic mode starts from browser hardware signals, ignores shader warm-up, hidden tabs, and long resume gaps, downgrades after three sustained low-FPS samples, and requires eight healthy samples before upgrading.

The active home scene uses React Three Fiber's native continuous render loop. Routed panels switch the persistent canvas to on-demand rendering. Development metric updates are isolated from the memoized WebGL tree so the diagnostic HUD does not periodically reconcile the scene.

For meaningful performance checks, compare `npm run dev` with a production server (`npm run build` followed by `npm start`). React and Next.js development instrumentation can materially affect frame pacing, particularly in Firefox.

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

The Playwright suite starts the application on port `3100` and validates direct routing, graph navigation, browser history, reduced motion, VFX isolation controls, independent panel scrolling, HUD navigation, long-form templates, supported desktop sizes, and the custom 404 page. Set `PLAYWRIGHT_BASE_URL` to test an already-running local server instead.

## Deployment preparation

The project uses a standard Next.js build and is ready to import into Vercel. No Vercel project, remote repository, domain, analytics, or production deployment is created in Phase 0.

## Phase boundary

Phase 4 includes emissive node materials, animated edge pulses, luminance-selected bloom, a procedural environment grid, deterministic particles, HUD scan/noise treatments, traversal wipes, adaptive quality tiers, and development isolation controls. Deployment, content replacement, production analytics, and any subsequent hardening phase remain excluded.
