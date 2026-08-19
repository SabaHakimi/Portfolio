import Link from "next/link";

export default function NotFound() {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <p className="eyebrow">Routing fault / unknown directory</p>
      <p className="not-found__code" aria-hidden="true">
        404
      </p>
      <h1 id="not-found-title">Node not found</h1>
      <p>
        The requested path is not registered in the portfolio filesystem.
      </p>
      <Link className="primary-action" href="/">
        Return to root
      </Link>
    </section>
  );
}
