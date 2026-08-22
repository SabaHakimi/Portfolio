import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ExploreProjectsAction,
  PortfolioBrand,
} from "@/components/portfolio-signatures";

describe("retained portfolio signature elements", () => {
  it("preserves the logo and projects action for future composition", () => {
    render(
      <>
        <PortfolioBrand />
        <ExploreProjectsAction />
      </>,
    );

    expect(screen.getByRole("link", { name: "Portfolio home" }))
      .toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Explore projects" }))
      .toHaveAttribute("href", "/projects");
  });
});
