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

  it("renders project content, HUD navigation, and addressable records", () => {
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
    expect(
      screen.getByRole("navigation", { name: "HUD section navigator" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Projects contents" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Relay Mesh" }),
    ).toBeInTheDocument();
    expect(screen.getByText("11M")).toBeInTheDocument();
    expect(screen.getByText("SAMPLE_DATA")).toBeInTheDocument();

    const localNavigation = screen.getByRole("navigation", {
      name: "Projects contents",
    });
    for (const subsection of projects.subsections) {
      expect(container.querySelector(`#${subsection.id}`)).toBeInTheDocument();
      expect(
        localNavigation.querySelector(`a[href="/projects#${subsection.id}"]`),
      ).toHaveAttribute("href", `/projects#${subsection.id}`);
    }

    fireEvent.keyDown(window, { key: "Escape" });
    expect(navigation.push).toHaveBeenCalledWith("/", { scroll: false });
  });

  it("renders the production-quality experience template", () => {
    const experience = getPortfolioSection("experience");

    expect(experience).toBeDefined();
    if (!experience) return;

    render(<SectionPage section={experience} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Senior Software Engineer",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Northstar Systems")).toHaveLength(2);
    expect(screen.getByText("31%")).toBeInTheDocument();
  });
});
