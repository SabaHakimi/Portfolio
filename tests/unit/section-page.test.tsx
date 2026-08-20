import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SectionPage } from "@/components/section-page";
import { getPortfolioSection } from "@/lib/portfolio-map";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

describe("section page", () => {
  beforeEach(() => {
    navigation.push.mockClear();
  });

  it("renders route metadata and addressable subsection nodes", () => {
    const projects = getPortfolioSection("projects");

    expect(projects).toBeDefined();
    if (!projects) return;

    const { container } = render(<SectionPage section={projects} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Projects" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(projects.systemPath)).toHaveLength(2);
    expect(container.querySelector('[data-route-panel="projects"]'))
      .toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Close Projects and return to root",
      }),
    ).toHaveAttribute("href", "/");

    for (const subsection of projects.subsections) {
      expect(container.querySelector(`#${subsection.id}`)).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: `#${subsection.id}` }),
      ).toHaveAttribute("href", `/projects#${subsection.id}`);
    }

    fireEvent.keyDown(window, { key: "Escape" });
    expect(navigation.push).toHaveBeenCalledWith("/", { scroll: false });
  });
});
