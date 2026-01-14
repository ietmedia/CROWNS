import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="card">
      <div className="cardInner hero">
        <div className="row">
          <span className="pill">
            <span className="pillDot" aria-hidden="true" /> Modern starter
          </span>
          <span className="pill">Vite • React • TypeScript</span>
          <span className="pill">Light/Dark theme</span>
        </div>

        <h1 className="heroTitle">Build something sharp.</h1>
        <p className="heroSubtitle">
          CROWNS is a clean, modern web app foundation with routing, a polished UI, and a small real feature (notes with local
          storage). It’s ready for you to extend.
        </p>

        <div className="row">
          <Link to="/notes" className="btn btnPrimary">
            Open Notes <span aria-hidden="true">→</span>
          </Link>
          <a className="btn" href="https://vite.dev" target="_blank" rel="noreferrer">
            Vite docs <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="kpiRow">
          <div className="kpi">
            <div className="kpiLabel">Theme</div>
            <div className="kpiValue">Instant toggle</div>
          </div>
          <div className="kpi">
            <div className="kpiLabel">Storage</div>
            <div className="kpiValue">Local-first</div>
          </div>
          <div className="kpi">
            <div className="kpiLabel">UX</div>
            <div className="kpiValue">Responsive UI</div>
          </div>
        </div>

        <div className="grid3">
          <Feature title="Clean layout" body="Sticky top bar, subtle gradients, and a fast, minimal stack." />
          <Feature title="Notes demo" body="Create, persist, and delete notes — a good baseline for CRUD flows." />
          <Feature title="Ready to ship" body="Production build + preview scripts included from day one." />
        </div>
      </div>
    </div>
  );
}

function Feature(props: { title: string; body: string }) {
  return (
    <div className="card" style={{ boxShadow: "none" }}>
      <div className="cardInner">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>{props.title}</div>
        <div className="muted" style={{ fontSize: 13 }}>
          {props.body}
        </div>
      </div>
    </div>
  );
}

