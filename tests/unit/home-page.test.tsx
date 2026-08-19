import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { portfolioSections } from "@/lib/portfolio-map";

describe("home page", () => {
  it("renders the root content and every section route", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /engineering systems/i,
      }),
    ).toBeInTheDocument();

    for (const section of portfolioSections) {
      expect(
        screen.getByRole("link", { name: section.title }),
      ).toHaveAttribute("href", section.href);
    }
  });

  it("marks the spatial renderer as deferred", () => {
    render(<Home />);

    expect(
      screen.getByText(/spatial renderer and graph interaction/i),
    ).toBeInTheDocument();
  });
});
