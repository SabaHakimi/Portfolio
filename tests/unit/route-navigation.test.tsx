import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RouteNavigation } from "@/components/route-navigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects",
}));

describe("route navigation", () => {
  it("marks the current route without removing other destinations", () => {
    render(<RouteNavigation />);

    expect(screen.getByRole("link", { name: /projects/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /about/i })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getAllByRole("link")).toHaveLength(6);
  });
});
