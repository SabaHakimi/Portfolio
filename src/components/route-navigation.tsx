"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { portfolioSections } from "@/lib/portfolio-map";

export function RouteNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Portfolio sections" className="route-nav">
      <p className="route-nav__label">Directory index</p>
      <ol className="route-nav__list">
        {portfolioSections.map((section) => {
          const isActive = pathname === section.href;

          return (
            <li key={section.slug}>
              <Link
                className="route-nav__link"
                data-accent={section.accent}
                data-active={isActive || undefined}
                href={section.href}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="route-nav__index">{section.index}</span>
                <span>{section.title}</span>
                <span aria-hidden="true" className="route-nav__signal">
                  {isActive ? "●" : "○"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
