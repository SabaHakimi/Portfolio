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
  await expect(page.locator('[data-phase="spatial-foundation"]')).toBeVisible();
  await expect(page.locator('[data-spatial-scene="orbital-filesystem"]')).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Portfolio sections" }),
  ).toBeVisible();
  await expect(page.getByText("WEBGL MODULE: ACTIVE")).toBeVisible();
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
    ).toHaveAttribute("data-active", "false");
    const navigation = page.getByRole("navigation", {
      name: "Portfolio sections",
    });
    await expect(
      navigation.getByRole("link", { name: new RegExp(title, "i") }),
    ).toHaveAttribute("aria-current", "page");
  });
}

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
