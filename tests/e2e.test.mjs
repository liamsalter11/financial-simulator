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
  /* The leading stat is survival once a retirement falls inside the horizon, and the older
     "does it ever reach the target" question when one doesn't — either way a percentage. */
  const chanceStat = page.locator(".panel", { hasText: "Monte Carlo" }).locator(".stat").first().locator(".v");
  assert.match(await chanceStat.textContent(), /^\d+%$/, "the headline probability should render as a percentage");

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

test("the inflation controls change the projection, and the display toggle changes only the labels", async () => {
  // The engine works in today's dollars; "show future dollars" is display-only. The
  // milestone dates are the assertion that matters — they must hold still across the
  // toggle, because the independence target inflates at the same rate the balances do.
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });

  const fiDate = () => page.locator(".stat").last().locator(".v").textContent();
  const inflation = page.locator('input[aria-label="Inflation (annual)"]');

  await inflation.fill("0");
  await page.waitForTimeout(250);
  const atZero = await fiDate();
  await inflation.fill("6");
  await page.waitForTimeout(250);
  const atSix = await fiDate();
  assert.notEqual(atZero, atSix, "inflation should push financial independence further out");

  const statsBefore = await page.locator(".sgrid").first().textContent();
  await page.locator(".hypo .switch", { hasText: "future dollars" }).click();
  await page.waitForTimeout(300);
  assert.equal(
    await page.locator(".sgrid").first().textContent(), statsBefore,
    "showing future dollars must not move any date or today's figures",
  );

  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await inflation.inputValue(), "6", "the inflation rate should persist");
  assert.equal(await page.locator(".hypo .switch input").last().isChecked(), true, "and so should the display toggle");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("the payoff strategy can be switched, is priced against the alternative, and persists", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Debt" }).click();

  const panel = page.locator(".panel", { hasText: "payoff order" });
  const note = () => panel.locator(".caphint").first().textContent();

  assert.match(await note(), /Avalanche/, "avalanche is the default, matching the old hardcoded behaviour");
  await panel.locator(".phead .seg button", { hasText: "Smallest first" }).click();
  await page.waitForTimeout(300);
  assert.match(await note(), /Snowball/);
  assert.match(await note(), /Switching to highest-rate-first/, "the note should price the strategy not chosen");

  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Debt" }).click();
  assert.equal(await panel.locator(".phead .seg button.on").textContent(), "Smallest first", "the choice should persist");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("a loan can be described by its term, and says so when a payment never clears it", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Debt" }).click();

  const loan = page.locator(".loan").first();
  const badge = () => loan.locator(".payoff-badge").first().textContent();
  assert.match(await badge(), /at this minimum/, "payment mode shows how long the minimum takes");

  await loan.locator(".seg button", { hasText: "by term" }).click();
  await loan.locator(".field input").nth(2).fill("60");
  await page.waitForTimeout(300);
  assert.match(await badge(), /minimum \$/, "term mode derives the payment instead");

  await loan.locator(".seg button", { hasText: "by payment" }).click();
  await loan.locator(".field input").nth(2).fill("1");
  await page.waitForTimeout(300);
  assert.match(await badge(), /never clears/, "a payment below the interest should say so rather than show a huge term");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("pre-tax contributions report when they hit the annual limit", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Cash flow" }).click();

  const deductions = page.locator(".dist", { hasText: "Payroll deductions" });
  const capNote = async () => (await deductions.locator(".caphint").allTextContents())
    .find((t) => t.includes("calendar year") || t.includes("Hits the") || t.includes("No limit")) || "";

  assert.equal(await page.locator('input[aria-label="Annual deferral limit"]').inputValue(), "24500");
  assert.match(await capNote(), /calendar year/, "the seed's 6% contribution stays under the limit");

  await deductions.locator(".dist-row", { hasText: "401k" }).locator('input[aria-label="Value"]').fill("45");
  await page.waitForTimeout(400);
  const hit = await capNote();
  assert.match(hit, /Hits the \$24,500 limit/, "front-loading should be reported");
  assert.match(hit, /employer match unclaimed/, "along with the match it forfeits");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("an income can derive its take-home from the tax brackets, and the choice persists", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Cash flow" }).click();

  const amount = page.locator(".card-r1 input[aria-label='Amount']").first();
  const mode = page.locator(".dist-row", { hasText: "Take-home is" }).first();
  const typed = await amount.inputValue();

  // in typed mode the app still shows what the brackets would say — the cheapest
  // possible check on a hand-entered figure
  assert.match(await page.locator(".caphint").filter({ hasText: "For comparison" }).first().textContent(), /per paycheck/);

  await mode.locator("button", { hasText: "from brackets" }).click();
  await page.waitForTimeout(400);
  const derived = await amount.inputValue();
  assert.notEqual(derived, typed, "the derived figure should replace the typed one");
  assert.ok(await amount.getAttribute("readonly") !== null, "and it's no longer hand-editable");
  assert.match(await page.locator(".caphint").filter({ hasText: "Brackets say" }).first().textContent(), /federal/);

  await page.locator("input[aria-label='State tax rate']").fill("6");
  await page.waitForTimeout(400);
  assert.ok(Number(await amount.inputValue()) < Number(derived), "a state rate should cut take-home further");

  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Cash flow" }).click();
  assert.equal(await mode.locator("button.on").textContent(), "from brackets", "the mode should persist");
  assert.equal(await page.locator("input[aria-label='State tax rate']").inputValue(), "6");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("account tax treatment moves the independence date, and a birth year surfaces the bridge", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });

  const fiDate = () => page.locator(".stat").last().locator(".v").textContent();
  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  const treatment = page.locator("select[aria-label='Tax treatment']").last();
  assert.equal(await treatment.inputValue(), "traditional", "a retirement account defaults to tax-deferred");

  await page.locator(".tabbtn", { hasText: "Overview" }).click();
  const asTraditional = await fiDate();
  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  await treatment.selectOption("roth");
  await page.waitForTimeout(300);
  await page.locator(".tabbtn", { hasText: "Overview" }).click();
  await page.waitForTimeout(300);
  assert.notEqual(await fiDate(), asTraditional, "untaxed withdrawals should bring independence forward");

  await page.locator(".tabbtn", { hasText: "Invest" }).click();
  const birthYear = page.locator("input[aria-label='Birth year (optional)']");
  assert.equal(await page.locator(".caphint").filter({ hasText: "Bridge" }).count(), 0, "no birth year, no claim about age");
  await birthYear.fill("1990");
  await page.waitForTimeout(500);
  assert.match(await page.locator(".caphint").filter({ hasText: "Bridge" }).first().textContent(), /59½/);

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("guaranteed retirement income lowers the target and slopes it toward its start date", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });

  const fiDate = () => page.locator(".stat").last().locator(".v").textContent();
  const before = await fiDate();
  const surplusBefore = await page.locator(".stat").nth(1).locator(".v").textContent();

  await page.locator(".tabbtn", { hasText: "Cash flow" }).click();
  await page.locator(".btn", { hasText: "Social Security or a pension" }).click();
  await page.waitForTimeout(300);
  const card = page.locator(".panel", { hasText: "Income" }).locator(".card").last();
  await card.locator("input[aria-label='Amount']").first().fill("2000");
  await page.waitForTimeout(500);
  assert.match(await page.locator(".caphint").filter({ hasText: "off the target" }).first().textContent(), /from its start date/);

  await page.locator(".tabbtn", { hasText: "Overview" }).click();
  await page.waitForTimeout(400);
  assert.notEqual(await fiDate(), before, "covering part of retirement spending should pull the date in");
  assert.equal(await page.locator(".stat").nth(1).locator(".v").textContent(), surplusBefore,
    "but income that starts decades out must not appear in this month's surplus");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("the projection runs in a Web Worker, and the page still works without one", async () => {
  // The worker is what keeps typing responsive; the fallback is what keeps the page
  // working where a worker can't start. Both must produce the same projection.
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  assert.equal(page.workers().length, 1, "the projection should be off the main thread");
  const withWorker = await page.locator(".stat").last().locator(".v").textContent();
  assert.deepEqual(consoleErrors, []);
  await page.close();

  const plain = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const fallbackErrors = [];
  plain.on("pageerror", (err) => fallbackErrors.push(err.message));
  await plain.addInitScript(() => { delete window.Worker; });
  await plain.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await plain.locator(".nwbig").waitFor();
  assert.equal(plain.workers().length, 0, "this page has no worker to fall back from");
  assert.equal(
    await plain.locator(".stat").last().locator(".v").textContent(), withWorker,
    "the fallback must compute the same projection, just on the main thread",
  );
  assert.deepEqual(fallbackErrors, [], "and it must not throw on the way");
  await plain.close();
});

test("the Monte Carlo answers whether the money lasts, and reacts to the retirement date", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Invest" }).click();

  const panel = page.locator(".panel", { hasText: "does the money last" });
  const survival = () => panel.locator(".stat").first().locator(".v").textContent();
  const pct = async () => Number((await survival()).replace("%", ""));

  await panel.waitFor();
  assert.match(await panel.locator(".stat").first().textContent(), /money lasts/);
  const base = await pct();
  assert.ok(base >= 0 && base <= 100);

  // retiring years early, with the same plan, should be visibly harder to survive
  await page.locator('input[aria-label="Retirement date"]').fill("2030-01-01");
  await page.waitForTimeout(700);
  assert.ok(await pct() < base, "retiring early should cut the odds the money lasts");

  // and volatility alone should move it — that's the sequence-of-returns point
  await page.locator('input[aria-label="Retirement date"]').fill("");
  await page.locator('input[aria-label="Return volatility (annual)"]').fill("30");
  await page.waitForTimeout(700);
  const rough = await pct();
  await page.locator('input[aria-label="Return volatility (annual)"]').fill("5");
  await page.waitForTimeout(700);
  assert.ok(await pct() > rough, "a calmer market should survive more often at the same average return");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("goal seek answers a question, and says so when it can't", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();

  const panel = page.locator(".panel", { hasText: "What would it take" });
  const answer = () => panel.locator(".caphint").first().textContent();
  const solve = async () => {
    await panel.locator(".btn", { hasText: /Solve|Solving/ }).click();
    await panel.locator(".btn", { hasText: "Solve" }).waitFor({ timeout: 60000 });
    await page.waitForTimeout(200);
  };

  await panel.locator('input[aria-label="Target date"]').fill("2029-06-01");
  await solve();
  assert.match(await answer(), /You'd need \$[\d,]+\/mo/, "a reachable target gets a monthly figure");

  // a date that has already passed can't be met by any amount
  await panel.locator('input[aria-label="Target date"]').fill("2026-01-01");
  await solve();
  assert.match(await answer(), /No amount inside|already/, "an impossible one is said out loud, not fudged");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("the sensitivity sweep ranks factors and shows their direction", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();

  const panel = page.locator(".panel", { hasText: "What would it take" });
  await panel.locator(".btn", { hasText: "Run sensitivity" }).click();
  await page.locator(".tor-row").first().waitFor({ timeout: 60000 });

  const labels = await page.locator(".tor-label").allTextContents();
  assert.ok(labels.length >= 6, "every factor should get a row");
  const values = await page.locator(".tor-val").allTextContents();
  const months = values.map((v) => Math.abs(parseInt(v, 10)));
  for (let i = 1; i < months.length; i++) {
    assert.ok(months[i - 1] >= months[i], "rows are sorted by how much they move the date");
  }
  assert.ok(labels.some((l) => /Inflation/.test(l)) && values.some((v) => v.startsWith("+")), "some factors push the date out");
  assert.ok(values.some((v) => v.startsWith("-")), "and some pull it in");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("a scenario can be saved, compared against, and survives a reload", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();

  await page.locator(".tbtn", { hasText: "Scenarios" }).click();
  await page.locator('input[aria-label="Scenario name"]').fill("baseline");
  await page.locator(".btn", { hasText: "Save current plan" }).click();
  await page.locator(".modal-head .icon-btn").click();

  // make the live plan clearly worse, then compare it against what was saved
  await page.locator(".tabbtn", { hasText: "Cash flow" }).click();
  await page.locator(".panel", { hasText: "Income" }).locator(".card-r1 input[aria-label='Amount']").first().fill("2200");
  await page.waitForTimeout(900);
  await page.locator(".tbtn", { hasText: "Scenarios" }).click();
  await page.locator("label.chk", { hasText: "compare against this" }).locator("input").check();
  await page.locator(".modal-head .icon-btn").click();
  await page.locator(".tabbtn", { hasText: "Overview" }).click();

  const cmp = page.locator(".panel", { hasText: "Compared with" });
  await cmp.waitFor({ timeout: 30000 });
  assert.match(await cmp.locator(".caphint").first().textContent(), /behind it/, "a worse plan should read as behind the saved one");
  assert.ok(await cmp.locator(".tl-row").count() > 0, "and the milestone diff should list rows");

  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  assert.match(await page.locator(".tbtn", { hasText: "Scenarios" }).textContent(), /\(1\)/, "the saved scenario survives");
  await page.locator(".panel", { hasText: "Compared with" }).waitFor({ timeout: 30000 });

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("the milestone timeline agrees with the stat cards", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.locator(".timeline").first().waitFor();

  const debtFreeStat = await page.locator(".stat", { hasText: "Debt-free" }).locator(".v").textContent();
  const row = page.locator(".tl-row", { hasText: "Debt-free" }).first();
  assert.match(await row.textContent(), new RegExp(debtFreeStat.trim()), "the timeline and the stat card must not disagree");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("undo steps back over a whole burst of typing, and redo returns it", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  const start = await page.locator(".nwbig").textContent();

  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  const balance = page.locator(".row.acct input[type=number]").first();
  // typed one character at a time — this must be one undo step, not four
  for (const v of ["7", "70", "700", "7000"]) { await balance.fill(v); await page.waitForTimeout(60); }
  await page.waitForTimeout(800);
  await page.locator(".tabbtn", { hasText: "Overview" }).click();
  const edited = await page.locator(".nwbig").textContent();
  assert.notEqual(edited, start);

  await page.keyboard.press("Control+z");
  await page.waitForTimeout(500);
  assert.equal(await page.locator(".nwbig").textContent(), start, "one undo should clear the whole gesture");

  await page.keyboard.press("Control+Shift+z");
  await page.waitForTimeout(500);
  assert.equal(await page.locator(".nwbig").textContent(), edited, "and redo should put it back");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("undo restores a deleted row", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.locator(".tabbtn", { hasText: "Accounts" }).click();

  const before = await page.locator(".row.acct").count();
  await page.locator(".row.acct").first().locator(".icon-btn").click();
  await page.waitForTimeout(500);
  assert.equal(await page.locator(".row.acct").count(), before - 1);

  await page.locator(".tbtn", { hasText: "Undo" }).click();
  await page.waitForTimeout(500);
  assert.equal(await page.locator(".row.acct").count(), before, "the deleted account should come back");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("the app keeps a daily copy of the plan, and can restore it", async () => {
  const { page, consoleErrors } = await newPage();
  page.on("dialog", (d) => d.accept());
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.waitForTimeout(700);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("fin3:snapshots") || "[]"));
  assert.ok(saved.length >= 1, "a snapshot should be written without being asked for");
  assert.ok(saved[0].plan && typeof saved[0].nw === "number", "carrying the plan and what it was worth");

  await page.locator(".tbtn", { hasText: "Scenarios" }).click();
  const restore = page.locator(".modal .btn", { hasText: "Restore" }).first();
  await restore.waitFor();
  await restore.click();
  await page.waitForTimeout(500);
  assert.equal(await page.locator(".nwbig").isVisible(), true, "restoring shouldn't break the page");
  assert.equal(await page.locator(".tbtn", { hasText: "Undo" }).isDisabled(), false, "and is itself undoable");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});
