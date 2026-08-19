import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionPage } from "@/components/section-page";
import { getPortfolioSection } from "@/lib/portfolio-map";

describe("section page", () => {
  it("renders route metadata and addressable subsection nodes", () => {
    const projects = getPortfolioSection("projects");

    expect(projects).toBeDefined();
    if (!projects) return;

    const { container } = render(<SectionPage section={projects} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
    expect(screen.getByText(projects.systemPath)).toBeInTheDocument();

    for (const subsection of projects.subsections) {
      expect(container.querySelector(`#${subsection.id}`)).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: `#${subsection.id}` }),
      ).toHaveAttribute("href", `/projects#${subsection.id}`);
    }
  });
});
