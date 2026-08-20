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
        name: /orbital filesystem/i,
      }),
    ).toBeInTheDocument();

    for (const section of portfolioSections) {
      expect(
        screen.getByRole("link", { name: section.title }),
      ).toHaveAttribute("href", section.href);
    }
  });

  it("describes the Phase 2 inspection and activation controls", () => {
    render(<Home />);

    expect(screen.getByText(/drag/i)).toBeInTheDocument();
    expect(screen.getByText(/select a section label or node/i))
      .toBeInTheDocument();
  });
});
