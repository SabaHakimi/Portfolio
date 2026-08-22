import { RouteNavigation } from "@/components/route-navigation";

export default function Home() {
  return (
    <div className="home-spatial-hud">
      <section
        className="home-hud-panel home-hud-intro"
        aria-labelledby="home-title"
      >
        <p className="eyebrow">Software Engineering Portfolio</p>
        <h1 id="home-title" aria-label="Sabawoon Hakimi">
          Sabawoon
          <span>Hakimi</span>
        </h1>
        <p>A spatial index of my work and experience.</p>
      </section>

      <RouteNavigation />

      <details className="home-hud-inspection">
        <summary aria-label="Inspection controls" title="Inspection controls">
          <span aria-hidden="true">i</span>
        </summary>
        <aside
          className="home-hud-panel home-hud-guide"
          aria-label="Scene controls"
        >
          <span>INSPECTION CONTROLS</span>
          <dl>
            <div>
              <dt>Drag</dt>
              <dd>Rotate graph</dd>
            </div>
            <div>
              <dt>Move</dt>
              <dd>Shift camera</dd>
            </div>
            <div>
              <dt>Hover</dt>
              <dd>Trace branch</dd>
            </div>
          </dl>
          <p>Select a section label or node to initiate camera traversal.</p>
        </aside>
      </details>

      <div className="home-hud-coordinate" aria-hidden="true">
        <span>ROOT / 00.000</span>
        <span>25 VISIBLE NODES</span>
      </div>
    </div>
  );
}
