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
    page.getByRole("heading", { level: 1, name: /sabawoon hakimi/i }),
  ).toBeVisible();
  await expect(page.locator('[data-phase="cyberpunk-vfx"]')).toBeVisible();
  await expect(page.locator('[data-spatial-scene="orbital-filesystem"]')).toHaveAttribute(
    "data-mode",
    "explore",
  );
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator(".system-vfx")).toBeAttached();
  await expect(
    page.locator('[data-spatial-scene="orbital-filesystem"]'),
  ).toHaveAttribute("data-quality", /economy|balanced|high/);
  await expect(
    page.locator('[data-spatial-scene="orbital-filesystem"]'),
  ).toHaveAttribute("data-vfx", "full");
  await expect(
    page.getByRole("navigation", { name: "Portfolio sections" }),
  ).toBeVisible();
  await expect(page.locator(".route-nav__list > li")).toHaveCount(6);
  await expect(
    page.getByRole("heading", { level: 2, name: "Directories" }),
  ).toHaveCount(0);
  await expect(page.getByText("HUD + VISUAL EFFECTS SYSTEM: ACTIVE")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Projects node" }))
    .toBeVisible();
});

test("development controls isolate quality and visual effect groups", async ({
  page,
}) => {
  await page.goto("/?debugQuality=economy&debugVfx=environment");

  const scene = page.locator('[data-spatial-scene="orbital-filesystem"]');
  await expect(scene).toHaveAttribute("data-quality", "economy");
  await expect(scene).toHaveAttribute("data-vfx", "environment");
  await expect(scene).toHaveAttribute("data-bloom", "false");
  await expect(scene).toHaveAttribute("data-render-loop", "continuous");

  const controls = page.getByLabel("Visual effects controls");
  await expect(controls).toContainText("QUALITY ECONOMY");
  await expect(controls).toContainText("EFFECTS ENVIRONMENT");

  await controls.getByRole("button", { name: /quality/i }).click();
  await expect(page).not.toHaveURL(/debugQuality/);
  await controls.getByRole("button", { name: /effects/i }).click();
  await expect(page).toHaveURL(/debugVfx=off/);
  await expect(scene).toHaveAttribute("data-vfx", "off");

  await controls
    .getByRole("button", { name: "Hide performance diagnostics" })
    .click();
  await expect(controls).toHaveCount(0);
  await expect(scene).toHaveAttribute("data-debug-performance", "false");
  await expect(page).toHaveURL(/debugPerformance=0/);
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
    await expect(
      page.locator('[data-spatial-scene="orbital-filesystem"]'),
    ).toHaveAttribute("data-render-loop", "demand");
    await expect(page.locator(`[data-route-panel="${slug}"]`)).toBeVisible();
    await expect(
      page.locator('[data-spatial-scene="orbital-filesystem"]'),
    ).toHaveAttribute("data-focused-node", `section:${slug}`);
    const navigation = page.getByRole("navigation", {
      name: "HUD section navigator",
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
  await expect(page.locator(".scene-transition-wipe")).toBeAttached();

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
  await page
    .getByRole("navigation", { name: "Portfolio sections" })
    .getByRole("link", { name: "Projects" })
    .click();

  await expect(page).toHaveURL(/\/projects$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Projects" }),
  ).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);

  await page.goForward();
  await expect(page).toHaveURL(/\/projects$/);
});

test("projects and experience expose realistic long-form templates", async ({ page }) => {
  await page.goto("/projects");

  await expect(page.locator('[data-content-template="projects"]')).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Relay Mesh" }),
  ).toBeVisible();
  await expect(page.getByText("11M")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Projects contents" }),
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "HUD section navigator" })
    .getByRole("link", { name: /experience/i })
    .click();

  await expect(page).toHaveURL(/\/experience$/);
  await expect(page.locator('[data-content-template="experience"]')).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Senior Software Engineer" }),
  ).toBeVisible();
});

test("routed content scrolls independently and blocks graph interaction", async ({ page }) => {
  await page.goto("/projects");

  const viewport = page.locator(".route-panel__viewport");
  const dimensions = await viewport.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);
  await viewport.evaluate((element) => element.scrollTo({ top: 900 }));
  await expect(page.locator("#relay-mesh")).toBeVisible();
  await expect(
    page.locator('[data-spatial-scene="orbital-filesystem"]'),
  ).toHaveAttribute("aria-hidden", "true");
});

test("HUD composition remains readable at supported desktop sizes", async ({ page }) => {
  const desktopSizes = [
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ];

  for (const size of desktopSizes) {
    await page.setViewportSize(size);
    await page.goto("/projects");
    await expect(page.getByRole("heading", { level: 1, name: "Projects" }))
      .toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "HUD section navigator" }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Projects contents" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Close Projects and return to root" }),
    ).toBeVisible();
  }
});

test("unknown section renders the portfolio 404", async ({ page }) => {
  await page.goto("/not-a-section");

  await expect(
    page.getByRole("heading", { level: 1, name: "Node not found" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to root" })).toBeVisible();
});
