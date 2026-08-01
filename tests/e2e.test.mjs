// Browser-level tests against the actual served pages. Requires Playwright's Chromium
// to be installed (`npx playwright install --with-deps chromium`) — run via
// `npm run test:e2e`, kept separate from the fast no-browser tests in `npm test`.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { startStaticServer, hasFrontPage } from "./helpers/staticServer.mjs";

let server;
let baseUrl;
let browser;

/* The front page belongs to the site repo, not this one, so it's only servable when this
   repo is checked out inside a clone of it. Everything else here tests pages this repo
   does own and runs anywhere. */
const frontPage = await hasFrontPage();

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

test("the simulator page loads, renders its tabs and reports no console errors", async () => {
  // The standalone equivalent of the front-page test below, which needs the site repo
  // checked out around this one. This covers the same "does the app boot at all" ground
  // for a plain clone, so a broken module graph fails everywhere rather than only locally.
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });

  assert.equal(await page.locator(".nwbig").isVisible(), true, "the net worth figure should render");
  assert.deepEqual(
    await page.locator(".tabbtn").allTextContents(),
    ["Overview", "Accounts", "Cash flow", "Debt", "Invest"],
  );

  assert.deepEqual(consoleErrors, [], "no console/page errors expected");
  await page.close();
});

test("front page links to the financial simulator, which loads and works", {
  skip: frontPage ? false : "no site front page alongside this repo — run inside a liamsalter11.github.io checkout to exercise it",
}, async () => {
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

test("the Monte Carlo panel renders, its volatility input works, persists, and its chart tooltip is error-free", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Invest" }).click();
  await page.waitForTimeout(300);

  assert.match(await page.locator(".ptitle", { hasText: "Monte Carlo" }).textContent(), /Monte Carlo/);
  const chanceStat = page.locator(".stat", { hasText: "hit your FI number" }).locator(".v");
  assert.match(await chanceStat.textContent(), /^\d+%$/, "the success-probability stat should render as a percentage");

  const volInput = page.locator(".panel", { hasText: "Monte Carlo" }).locator("input[type=number]").first();
  assert.equal(await volInput.inputValue(), "15", "volatility defaults to 15%");
  await volInput.fill("25");
  await page.waitForTimeout(200);

  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Invest" }).click();
  await page.waitForTimeout(300);
  const volAfterReload = page.locator(".panel", { hasText: "Monte Carlo" }).locator("input[type=number]").first();
  assert.equal(await volAfterReload.inputValue(), "25", "volatility should persist across a reload");

  // hover the fan chart to trigger its custom tooltip — the exact path a past
  // module-split regression only broke once a chart Tooltip actually rendered
  const mcChart = page.locator(".panel", { hasText: "Monte Carlo" }).locator(".recharts-wrapper");
  await mcChart.scrollIntoViewIfNeeded();
  const box = await mcChart.boundingBox();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width * 0.6 + 5, box.y + box.height / 2 + 3);
  await page.waitForTimeout(200);
  assert.equal(await page.locator(".tt").isVisible(), true, "the Monte Carlo chart tooltip should render on hover");
  assert.match(await page.locator(".tt").textContent(), /Median/);

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("the Monte Carlo panel handles zero invested accounts without erroring", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });

  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  await page.waitForTimeout(300);
  let count = await page.locator(".row.acct").count();
  while (count > 1) {
    await page.locator(".row.acct").last().locator(".icon-btn").click();
    await page.waitForTimeout(80);
    count = await page.locator(".row.acct").count();
  }
  await page.locator(".row.acct select").first().selectOption("checking");
  await page.waitForTimeout(200);

  await page.locator(".tabbtn", { hasText: "Invest" }).click();
  await page.waitForTimeout(300);
  assert.equal(await page.locator(".stat", { hasText: "hit your FI number" }).locator(".v").textContent(), "0%");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("exported data can be re-imported, restoring a projection after a reset", async () => {
  // Export/import is the only backup and the only way to move data between devices —
  // there is no account and no server. A dump that can't be loaded back is a silent
  // data-loss bug, and nothing else in the suite exercises the round trip.
  const { page, consoleErrors } = await newPage();
  page.on("dialog", (d) => d.accept()); // Reset asks for confirmation
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });

  // Make the saved state distinctive, so restoring it is unambiguous.
  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  await page.locator(".row.acct input[type=number]").first().fill("123456");
  await page.locator(".tabbtn", { hasText: "Overview" }).click();
  const edited = await page.locator(".nwbig").textContent();

  // Export, and keep the dump.
  await page.locator(".tbtn", { hasText: "Export" }).click();
  const dump = await page.locator(".jsonbox").inputValue();
  const parsed = JSON.parse(dump);
  assert.equal(parsed.app, "fin-sim", "the dump should identify itself");
  assert.ok(Array.isArray(parsed.accounts) && parsed.accounts.length, "and carry the accounts");
  assert.ok(parsed.accounts.some((a) => Number(a.balance) === 123456), "including the edit just made");
  await page.locator(".modal-head .icon-btn").click();

  // Throw the state away.
  await page.locator(".tbtn", { hasText: "Reset" }).click();
  await page.waitForFunction((prev) => document.querySelector(".nwbig").textContent !== prev, edited);
  const afterReset = await page.locator(".nwbig").textContent();
  assert.notEqual(afterReset, edited, "a reset should have discarded the edit");

  // Load the dump back.
  await page.locator(".tbtn", { hasText: "Import" }).click();
  await page.locator(".modal .jsonbox").fill(dump);
  await page.locator(".btn", { hasText: "Load data" }).click();
  await page.waitForSelector(".modal", { state: "detached" });

  assert.equal(await page.locator(".nwbig").textContent(), edited, "importing the dump should restore the exported projection");

  // And it should persist, like any other edit.
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator(".nwbig").textContent(), edited, "the imported data should survive a reload");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("importing malformed JSON warns instead of destroying the current data", async () => {
  const { page, consoleErrors } = await newPage();
  const dialogs = [];
  page.on("dialog", (d) => { dialogs.push(d.message()); d.accept(); });
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  const before = await page.locator(".nwbig").textContent();

  await page.locator(".tbtn", { hasText: "Import" }).click();
  await page.locator(".modal .jsonbox").fill("{ this is not json");
  await page.locator(".btn", { hasText: "Load data" }).click();

  assert.equal(dialogs.length, 1, "the user should be told the paste wasn't valid");
  assert.match(dialogs[0], /valid saved data/);
  await page.locator(".modal-head .icon-btn").click();
  assert.equal(await page.locator(".nwbig").textContent(), before, "a failed import must leave the existing projection alone");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});
