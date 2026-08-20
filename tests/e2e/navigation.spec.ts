import { expect, test } from "@playwright/test";

const routes = [
  ["about", "About"],
  ["experience", "Experience"],
  ["projects", "Projects"],
  ["education", "Education"],
  ["skills", "Skills"],
  ["contact", "Contact"],
] as const;

test("home exposes the spatial graph and complete route foundation", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /orbital filesystem/i }),
  ).toBeVisible();
  await expect(page.locator('[data-phase="navigation-choreography"]')).toBeVisible();
  await expect(page.locator('[data-spatial-scene="orbital-filesystem"]')).toHaveAttribute(
    "data-mode",
    "explore",
  );
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Portfolio sections" }),
  ).toBeVisible();
  await expect(page.getByText("CAMERA + ROUTE LINK: ACTIVE")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Projects node" }))
    .toBeVisible();
});

test("development stress mode renders the clamped 50-node fixture", async ({
  page,
}) => {
  await page.goto("/?debugNodes=50");

  const metrics = page.getByLabel("Spatial scene metrics");
  await expect(metrics).toContainText("50");
  await expect(metrics).toContainText("NODES");
});

for (const [slug, title] of routes) {
  test(`/${slug} loads directly`, async ({ page }) => {
    await page.goto(`/${slug}`);

    await expect(page).toHaveURL(new RegExp(`/${slug}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    await expect(
      page.locator('[data-spatial-scene="orbital-filesystem"]'),
    ).toHaveAttribute("data-mode", "panel");
    await expect(page.locator(`[data-route-panel="${slug}"]`)).toBeVisible();
    await expect(
      page.locator('[data-spatial-scene="orbital-filesystem"]'),
    ).toHaveAttribute("data-focused-node", `section:${slug}`);
    const navigation = page.getByRole("navigation", {
      name: "Portfolio sections",
    });
    await expect(
      navigation.getByRole("link", { name: new RegExp(title, "i") }),
    ).toHaveAttribute("aria-current", "page");
  });
}

test("graph node activation travels before opening a routed HUD panel", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Open Projects node" }).click();
  await expect(
    page.locator('[data-spatial-scene="orbital-filesystem"]'),
  ).toHaveAttribute("data-mode", "transition");
  await expect(page.locator(".scene-transition-status")).toContainText("PROJECTS");

  await expect(page).toHaveURL(/\/projects$/, { timeout: 5_000 });
  await expect(page.locator('[data-route-panel="projects"]')).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Close Projects and return to root" }),
  ).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.locator('[data-spatial-scene="orbital-filesystem"]'),
  ).toHaveAttribute("data-mode", "explore");
});

test("reduced motion preserves node navigation without a travel delay", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await page.getByRole("button", { name: "Open Skills node" }).click();
  await expect(page).toHaveURL(/\/skills$/, { timeout: 5_000 });
  await expect(page.locator('[data-route-panel="skills"]')).toBeVisible();
});

test("Escape closes a routed HUD panel", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator('[data-route-panel-controls-ready="true"]')).toBeAttached();
  await page.keyboard.press("Escape");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.locator('[data-spatial-scene="orbital-filesystem"]'),
  ).toHaveAttribute("data-mode", "explore");
});

test("client navigation preserves browser history", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore projects" }).click();

  await expect(page).toHaveURL(/\/projects$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Projects" }),
  ).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);

  await page.goForward();
  await expect(page).toHaveURL(/\/projects$/);
});

test("unknown section renders the portfolio 404", async ({ page }) => {
  await page.goto("/not-a-section");

  await expect(
    page.getByRole("heading", { level: 1, name: "Node not found" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to root" })).toBeVisible();
});
