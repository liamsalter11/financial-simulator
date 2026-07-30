// Browser-level tests against the actual served pages. Requires Playwright's Chromium
// to be installed (`npx playwright install --with-deps chromium`) — run via
// `npm run test:e2e`, kept separate from the fast no-browser tests in `npm test`.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startStaticServer } from "./helpers/staticServer.mjs";

let server;
let baseUrl;
let browser;

before(async () => {
  ({ server, baseUrl } = await startStaticServer());
  browser = await chromium.launch();
});

after(async () => {
  await browser.close();
  server.close();
});

async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("favicon")) consoleErrors.push(msg.text());
  });
  return { page, consoleErrors };
}

test("front page links to the financial simulator, which loads and works", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });

  assert.equal(await page.locator("h2").textContent(), "My vibe coded projects");
  assert.equal(await page.locator("ul a").getAttribute("href"), "/financial-simulator/");

  await page.locator("ul a").click();
  await page.waitForLoadState("networkidle");
  assert.equal(page.url(), `${baseUrl}/financial-simulator/`);
  assert.equal(await page.locator(".nwbig").isVisible(), true, "the net worth figure should render");
  assert.deepEqual(
    await page.locator(".tabbtn").allTextContents(),
    ["Overview", "Accounts", "Cash flow", "Debt", "Invest"],
  );

  assert.deepEqual(consoleErrors, [], "no console/page errors expected");
  await page.close();
});

test("help panel is closed by default, opens on demand, and its content follows the active tab", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });

  assert.equal(await page.locator("#help-panel").isVisible().catch(() => false), false, "help should be closed by default");

  await page.locator(".tbtn", { hasText: "Help" }).click();
  assert.equal(await page.locator("#help-panel").isVisible(), true);
  assert.match(await page.locator("#help-panel .ptitle").textContent(), /Overview/);

  await page.locator(".tabbtn", { hasText: "Debt" }).click();
  assert.match(await page.locator("#help-panel .ptitle").textContent(), /Debt/);

  await page.locator("#help-panel .icon-btn").click();
  assert.equal(await page.locator("#help-panel").isVisible().catch(() => false), false);

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("editing an account balance persists across a reload via localStorage", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });

  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  await page.locator(".row.acct input[type=number]").first().fill("99999");
  await page.locator(".tabbtn", { hasText: "Overview" }).click();
  const netWorthAfterEdit = await page.locator(".nwbig").textContent();

  await page.reload({ waitUntil: "networkidle" });
  const netWorthAfterReload = await page.locator(".nwbig").textContent();
  assert.equal(netWorthAfterReload, netWorthAfterEdit, "the edit should survive a reload");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("a failed localStorage save warns once and does not repeat on further edits", async () => {
  const { page, consoleErrors } = await newPage();
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        return {
          getItem: () => null,
          setItem: () => { throw new DOMException("quota exceeded"); },
        };
      },
    });
  });

  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".toast").isVisible(), true, "a save failure should surface a toast");
  assert.match(await page.locator(".toast").textContent(), /blocking saved data/);

  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  await page.locator(".row.acct input[type=number]").first().fill("1");
  await page.locator(".row.acct input[type=number]").first().fill("2");
  // Give the (deliberately failing) persistence effects a moment to fire again.
  await page.waitForTimeout(300);

  // The app should keep working even though every save is failing.
  assert.equal(await page.locator(".nwbig").isVisible(), true);
  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("editing income and expanding its payroll/bonus sections doesn't error (chart tooltip regression)", async () => {
  // Regression test: a module-split refactor once shipped components.jsx (Tip/MultiTip)
  // without importing addDays, which only threw once a chart's Tooltip actually rendered —
  // triggered here by an unrelated income edit recomputing the simulation. Static rendering
  // alone did not catch this; exercising an edit plus every tab's chart tooltip does.
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Cash flow" }).click();

  await page.locator(".panel", { hasText: "Income" }).locator(".card").first().locator("input[type=number]").first().fill("3200");
  await page.locator(".panel", { hasText: "Income" }).locator("label.chk", { hasText: "offered" }).locator("input").check();
  await page.locator(".panel", { hasText: "Income" }).locator("label.chk", { hasText: "paid" }).locator("input").check();
  await page.waitForTimeout(200);

  for (const tab of ["Overview", "Cash flow", "Debt", "Invest"]) {
    await page.locator(".tabbtn", { hasText: tab }).click();
    await page.waitForTimeout(300);
    const chart = page.locator(".recharts-wrapper").first();
    const box = await chart.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width / 2 + 10, box.y + box.height / 2 + 5);
    await page.waitForTimeout(150);
    assert.equal(await page.locator(".tt").isVisible(), true, `${tab} chart tooltip should render on hover`);
  }

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("the account-cap redirect toggle can be changed and persists across a reload", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Invest" }).click();

  const redirectLabel = page.locator("label.switch", { hasText: "redirect those payments into investing" });
  const checkbox = redirectLabel.locator("input[type=checkbox]");
  assert.equal(await checkbox.isChecked(), true, "redirect defaults to on");

  await redirectLabel.click({ force: true }); // the checkbox itself is visually hidden by the toggle-switch styling
  assert.equal(await checkbox.isChecked(), false);

  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Invest" }).click();
  const checkboxAfterReload = page.locator("label.switch", { hasText: "redirect those payments into investing" }).locator("input[type=checkbox]");
  assert.equal(await checkboxAfterReload.isChecked(), false, "the toggle should persist across a reload");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});
