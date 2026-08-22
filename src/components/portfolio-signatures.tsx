import Link from "next/link";

export function PortfolioBrand() {
  return (
    <Link className="brand" href="/" aria-label="Portfolio home">
      <span aria-hidden="true" className="brand__mark">
        P/
      </span>
      <span>
        <strong>PORTFOLIO</strong>
        <small>ROOT DIRECTORY</small>
      </span>
    </Link>
  );
}

export function ExploreProjectsAction() {
  return (
    <Link className="primary-action" href="/projects">
      Explore projects <span aria-hidden="true">↗</span>
    </Link>
  );
}
