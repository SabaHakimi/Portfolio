import { expect, test } from "@playwright/test";

const routes = [
  ["about", "About"],
  ["experience", "Experience"],
  ["projects", "Projects"],
  ["education", "Education"],
  ["skills", "Skills"],
  ["contact", "Contact"],
] as const;

test("home exposes the complete route foundation", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /engineering systems/i }),
  ).toBeVisible();
  await expect(page.locator('[data-phase="route-foundation"]')).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Portfolio sections" }),
  ).toBeVisible();
  await expect(page.getByText("WEBGL MODULE: NOT LOADED")).toBeVisible();
});

for (const [slug, title] of routes) {
  test(`/${slug} loads directly`, async ({ page }) => {
    await page.goto(`/${slug}`);

    await expect(page).toHaveURL(new RegExp(`/${slug}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
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
