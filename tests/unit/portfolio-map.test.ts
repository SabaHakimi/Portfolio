import { describe, expect, it } from "vitest";
import {
  getPortfolioSection,
  getSectionHref,
  portfolioSections,
} from "@/lib/portfolio-map";

describe("portfolio map", () => {
  it("defines the six approved top-level routes", () => {
    expect(portfolioSections.map(({ href }) => href)).toEqual([
      "/about",
      "/experience",
      "/projects",
      "/education",
      "/skills",
      "/contact",
    ]);
  });

  it("keeps route, index, and subsection identifiers unique", () => {
    const routes = portfolioSections.map(({ href }) => href);
    const indexes = portfolioSections.map(({ index }) => index);
    const subsectionRoutes = portfolioSections.flatMap((section) =>
      section.subsections.map((subsection) =>
        getSectionHref(section, subsection),
      ),
    );

    expect(new Set(routes).size).toBe(routes.length);
    expect(new Set(indexes).size).toBe(indexes.length);
    expect(new Set(subsectionRoutes).size).toBe(subsectionRoutes.length);
  });

  it("resolves known sections and rejects unknown slugs", () => {
    expect(getPortfolioSection("projects")?.title).toBe("Projects");
    expect(getPortfolioSection("not-a-section")).toBeUndefined();
  });
});
