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

test("a shared link offers its plan and never overwrites what's already saved", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();

  /* build a link from a plan that isn't the one this profile has */
  const link = await page.evaluate(async (base) => {
    const { encodePlan, shareUrl } = await import("./src/share.js");
    const plan = {
      accounts: [{ id: "shared", name: "Shared checking", type: "checking", balance: 777777, rate: 0 }],
      debts: [], income: [], expenses: [], transfers: [], debtPayments: [], payments: [], settings: {},
    };
    return shareUrl(base, await encodePlan(plan));
  }, `${baseUrl}/financial-simulator/`);

  /* mark this profile's own data so we can tell whether it survived */
  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  await page.getByLabel("Balance").first().fill("4242");
  await page.waitForTimeout(700);

  await page.goto(link, { waitUntil: "networkidle" });
  const offer = page.locator('[data-testid="share-offer"]');
  await offer.waitFor();
  assert.match(await offer.textContent(), /still here and untouched/);
  assert.equal(await page.evaluate(() => window.location.hash), "", "the fragment is cleared once it's been read");

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("fin3:accounts") || "[]"));
  assert.ok(!stored.some((a) => a.id === "shared"), "the link must not have written anything while it was only an offer");

  await page.locator(".btn", { hasText: "Keep mine" }).click();
  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  assert.equal(await page.getByLabel("Balance").first().inputValue(), "4242", "declining leaves the visitor's own plan in place");

  /* and accepting does load it, undoably */
  await page.goto(link, { waitUntil: "networkidle" });
  await page.locator(".btn", { hasText: "Load the shared plan" }).click();
  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  await page.waitForTimeout(500);
  assert.equal(await page.getByLabel("Balance").first().inputValue(), "777777");
  await page.locator(".tbtn", { hasText: "Undo" }).click();
  await page.waitForTimeout(500);
  assert.equal(await page.getByLabel("Balance").first().inputValue(), "4242", "loading a link is undoable");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("the bare URL still loads the saved plan, exactly as before", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  await page.getByLabel("Balance").first().fill("31337");
  await page.waitForTimeout(700);

  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  assert.equal(await page.getByLabel("Balance").first().inputValue(), "31337");
  assert.equal(await page.locator('[data-testid="share-offer"]').count(), 0, "no banner without a link");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("a CSV statement becomes a review table, and only ticked rows are created", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".tabbtn", { hasText: "Cash flow" }).click();
  const before = await page.getByLabel("Expense name").count();

  const rows = ["Date,Description,Amount"];
  for (let m = 1; m <= 5; m++) rows.push(`2026-0${m}-01,RENT PAYMENT LANDLORD LLC,-1500.00`);
  let d = new Date("2026-01-06T00:00:00");
  for (let i = 0; i < 12; i++) {
    rows.push(`${d.toISOString().slice(0, 10)},SQ *BLUE BOTTLE COFFEE #${1000 + i} SEATTLE WA,-6.25`);
    d = new Date(d.getTime() + 7 * 86400000);
  }
  rows.push("2026-02-14,DELTA AIR LINES 0067788221,-412.80");
  rows.push("2026-01-20,PAYROLL DEPOSIT ACME CORP,3000.00");

  await page.locator(".tbtn", { hasText: "Import from a statement" }).click();
  await page.locator('[data-testid="csv-paste"]').fill(rows.join("\n"));
  await page.waitForTimeout(400);

  const labels = await page.locator(".csvrow .csvname").allTextContents();
  assert.equal(labels.length, 3, "three merchants — the deposit isn't spending");
  assert.ok(!labels.some((l) => /payroll/i.test(l)));
  assert.equal(await page.locator(".csvrow.on").count(), 2, "the two recurring merchants are pre-ticked, the one-off isn't");
  assert.equal(await page.getByLabel(/Frequency for Rent/).inputValue(), "monthly");
  assert.equal(await page.getByLabel(/Frequency for Blue Bottle/).inputValue(), "weekly");
  assert.equal(await page.getByLabel(/Category for Rent/).inputValue(), "housing");

  await page.locator(".modal .btn-amber").click();
  await page.waitForTimeout(600);
  const after = await page.getByLabel("Expense name").count();
  assert.equal(after, before + 2, "only the ticked rows became expenses");
  const names = await page.getByLabel("Expense name").evaluateAll((els) => els.map((e) => e.value));
  assert.ok(!names.some((n) => /delta/i.test(n)), "the one-off was left alone");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

/* Contrast, computed from what the browser actually paints — the palettes are two lists of
   hex values, and nothing but arithmetic will tell you one of them stopped being readable. */
const CONTRAST_SRC = `(fg, bg) => {
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const L = (s) => { const [r, g, b] = s.match(/[\\d.]+/g).map(Number); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
  const a = L(fg), b = L(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}`;
const TOKENS = ["--text", "--muted", "--faint", "--amber", "--cyan", "--green", "--red", "--violet",
  "--gold", "--blue", "--teal", "--pink", "--slate", "--clay", "--sky", "--lilac"];

async function contrasts(page) {
  return page.evaluate(([src, tokens]) => {
    const contrast = eval("(" + src + ")");
    const fin = document.querySelector(".fin");
    const panel = document.querySelector(".panel") || fin;
    const panelBg = getComputedStyle(panel).backgroundColor;
    const out = {};
    for (const t of tokens) {
      const d = document.createElement("div");
      d.style.color = `var(${t})`;
      panel.appendChild(d);
      out[t] = contrast(getComputedStyle(d).color, panelBg);
      d.remove();
    }
    return out;
  }, [CONTRAST_SRC, TOKENS]);
}

test("the theme follows the system, can be pinned, and survives a reload", async () => {
  const ctx = await browser.newContext({ colorScheme: "light", viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("favicon")) consoleErrors.push(m.text()); });
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();

  const fin = page.locator(".fin");
  const bg = () => page.evaluate(() => getComputedStyle(document.querySelector(".fin")).backgroundColor);
  assert.equal(await fin.getAttribute("data-theme"), "auto", "auto by default");
  const lightBg = await bg();

  await page.emulateMedia({ colorScheme: "dark" });
  assert.notEqual(await bg(), lightBg, "on auto, the OS decides");

  /* pin it light and the OS should stop mattering */
  const themeBtn = page.locator(".tbtn.icon-only");
  await themeBtn.click();
  assert.equal(await fin.getAttribute("data-theme"), "light");
  assert.equal(await bg(), lightBg, "pinned light stays light on a dark system");

  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.waitForTimeout(400);
  assert.equal(await fin.getAttribute("data-theme"), "light", "the choice survives a reload");

  /* and it is not part of the plan — a share link must not carry someone's reading preference */
  const shared = await page.evaluate(async () => {
    const { encodePlan, decodePlan } = await import("./src/share.js");
    const plan = JSON.parse(localStorage.getItem("fin3:settings") || "{}");
    return await decodePlan(await encodePlan({ accounts: [{ id: "a" }], settings: plan }));
  });
  assert.ok(!("theme" in (shared.settings || {})), "theme must not live in settings");

  assert.deepEqual(consoleErrors, []);
  await ctx.close();
});

test("both palettes clear the contrast bar for text", async () => {
  for (const [scheme, clicks] of [["dark", 0], ["light", 0]]) {
    const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
    await page.locator(".nwbig").waitFor();
    for (let i = 0; i < clicks; i++) await page.locator(".tbtn.icon-only").click();
    await page.waitForTimeout(300);
    const c = await contrasts(page);
    for (const [token, ratio] of Object.entries(c)) {
      assert.ok(ratio >= 4.5, `${token} is ${ratio.toFixed(2)}:1 on the panel in ${scheme} — under the 4.5:1 bar`);
    }
    await ctx.close();
  }
});

test("chart colours actually resolve — a mistyped token would paint nothing", async () => {
  for (const scheme of ["dark", "light"]) {
    const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
    await page.locator(".recharts-line-curve").first().waitFor();
    await page.waitForTimeout(400);
    const strokes = await page.locator(".recharts-line-curve").evaluateAll((els) => els.map((e) => getComputedStyle(e).stroke));
    assert.ok(strokes.length > 0, "expected chart lines");
    for (const s of strokes) {
      assert.match(s, /^rgba?\(/, `a chart line resolved to "${s}" — the token doesn't exist`);
      assert.ok(!/rgba\(0, 0, 0, 0\)/.test(s), "a chart line is fully transparent");
    }
    await ctx.close();
  }
});

test("the print summary renders a real chart and takes over the page", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.waitForTimeout(600);

  await page.locator(".tbtn", { hasText: "Print" }).click();
  const sheet = page.locator("#printsheet");
  await sheet.waitFor();

  /* the reason the sheet is previewed rather than living only inside @media print: a chart
     in a hidden container measures nothing and prints nothing */
  const box = await sheet.locator("svg.recharts-surface").first().boundingBox();
  assert.ok(box && box.width > 400 && box.height > 100, `expected a rendered chart, got ${JSON.stringify(box)}`);

  /* the headline figures must agree with the app they summarise */
  const nw = await page.locator(".pr-nw b").textContent();
  assert.equal(nw, await page.locator(".nwbig").textContent());

  await page.emulateMedia({ media: "print" });
  const printed = await page.evaluate(() => ({
    tabs: getComputedStyle(document.querySelector(".tabs")).display,
    topbar: getComputedStyle(document.querySelector(".topbar")).display,
    /* the toolbar's own `display` stays `flex` — it's the topbar around it that's hidden,
       so ask for a layout box rather than a computed style */
    toolbarBoxes: document.querySelector(".toolbar").getClientRects().length,
    modal: getComputedStyle(document.querySelector(".modal")).position,
    bg: getComputedStyle(document.querySelector(".fin")).backgroundColor,
    sheet: getComputedStyle(document.querySelector("#printsheet")).display,
  }));
  assert.equal(printed.tabs, "none");
  assert.equal(printed.topbar, "none");
  assert.equal(printed.toolbarBoxes, 0, "the toolbar must not lay out on paper");
  assert.equal(printed.modal, "static", "the modal becomes the page rather than floating over it");
  assert.equal(printed.bg, "rgb(255, 255, 255)", "paper is white whatever theme is on screen");
  assert.notEqual(printed.sheet, "none");
  await page.emulateMedia({ media: "screen" });

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("deleting an account raises every row that pointed at it, and undo clears them", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.waitForTimeout(700);

  const badge = page.locator(".tbtn.checks");
  const before = Number((await badge.textContent().catch(() => "0")).trim()) || 0;

  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  await page.locator(".row.acct").first().locator('button[aria-label="Remove"]').click();
  await page.waitForTimeout(1200);

  const after = Number((await badge.textContent()).trim());
  assert.ok(after > before + 5, `expected the orphaned rows to be reported, badge went ${before} → ${after}`);

  await badge.click();
  const titles = await page.locator(".checkrow .ctitle").allTextContents();
  assert.ok(titles.some((t) => /Rent.*no longer exists/.test(t)), `expected the rent expense named: ${titles[0]}`);
  assert.ok(titles.some((t) => /split into an account that no longer exists/.test(t)), "and the paycheck split");

  /* "take me there" lands on the right tab with the row marked */
  const row = page.locator(".checkrow").filter({ hasText: "Rent" }).first();
  await row.locator(".btn", { hasText: "Take me there" }).click();
  await page.waitForTimeout(700);
  assert.equal((await page.locator(".tabbtn.active").textContent()).trim(), "Cash flow");
  assert.ok(await page.locator("[data-row].flagged").count() >= 1, "the offending row should be marked");
  assert.ok(await page.locator(".rowcheck").count() >= 1, "and carry the finding inline");

  await page.locator(".tbtn", { hasText: "Undo" }).click();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator(".rowcheck").count(), 0, "undoing the delete clears the findings");
  const back = Number((await badge.textContent().catch(() => "0")).trim()) || 0;
  assert.equal(back, before, "and the badge returns to what it was");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("a card with no payment is reported, and adding one clears it", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.waitForTimeout(700);
  const badge = page.locator(".tbtn.checks");
  const before = Number((await badge.textContent().catch(() => "0")).trim()) || 0;

  /* a card created by hand, with a balance and nothing paying it */
  await page.evaluate(() => {
    const debts = JSON.parse(localStorage.getItem("fin3:debts") || "[]");
    debts.push({ id: "cctest", name: "Test card", kind: "card", balance: 900, originalBalance: 900, apr: 22.99, minPayment: 0, interestFrom: new Date().toISOString().slice(0, 10) });
    localStorage.setItem("fin3:debts", JSON.stringify(debts));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.waitForTimeout(900);

  await badge.click();
  const titles = await page.locator(".checkrow .ctitle").allTextContents();
  assert.ok(titles.some((t) => /Test card.*no payment/.test(t)), `expected the card reported: ${titles.join(" | ")}`);
  await page.locator(".modal-head .icon-btn").click();

  /* give it one, and the finding goes */
  await page.locator(".tabbtn", { hasText: "Cash flow" }).click();
  await page.evaluate(() => {
    const pays = JSON.parse(localStorage.getItem("fin3:debtPayments") || "[]");
    const acct = JSON.parse(localStorage.getItem("fin3:accounts") || "[]")[0];
    pays.push({ id: "ptest", name: "Card payment", amount: 0, payFull: true, date: new Date().toISOString().slice(0, 10), recur: "monthly", fromAcct: acct.id, toDebt: "cctest" });
    localStorage.setItem("fin3:debtPayments", JSON.stringify(pays));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.waitForTimeout(900);
  const after = Number((await badge.textContent().catch(() => "0")).trim()) || 0;
  assert.equal(after, before, `the finding should be gone, badge is ${after}`);

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("the numbers behind the charts are readable as a table, and match the app", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.waitForTimeout(900);
  const headline = await page.locator(".nwbig").textContent();

  await page.locator(".tbtn", { hasText: "Numbers" }).click();
  const table = page.locator('[data-testid="data-table"]');
  await table.waitFor();

  /* a real table: caption, column headers, a row header per row */
  assert.ok((await table.locator("caption").textContent()).length > 20);
  assert.deepEqual(await table.locator("thead th").allTextContents(),
    ["Date", "Net worth", "Invested", "Debt", "Independence target"]);
  assert.ok(await table.locator("tbody tr th[scope=row]").count() > 5);

  /* and it agrees with the figure on screen */
  const firstRow = await table.locator("tbody tr").first().locator("td").first().textContent();
  assert.equal(firstRow, headline, "the first row is today, and must match the headline");

  /* the granularity control changes the row count, and the series control the columns */
  const yearly = await table.locator("tbody tr").count();
  await page.getByLabel("How often").selectOption("monthly");
  await page.waitForTimeout(300);
  assert.ok(await table.locator("tbody tr").count() > yearly, "monthly gives more rows than yearly");
  await page.getByLabel("Which numbers").selectOption("debt");
  await page.waitForTimeout(300);
  assert.deepEqual(await table.locator("thead th").allTextContents(), ["Date", "Your plan", "Minimums only"]);

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("every chart carries a text alternative, and can be panned and zoomed from the keyboard", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.waitForTimeout(900);

  const groups = page.locator('.scope-wrap[role="group"]');
  assert.ok(await groups.count() >= 2, "each chart is a labelled group");
  const alt = await page.locator(".scope-wrap .sr-only").first().textContent();
  assert.match(alt, /Net worth from \$/, "the alternative states the figures, not just the shape");
  assert.match(alt, /arrow keys pan/, "and says how to drive it without a mouse");

  /* the picture is decorative where a text legend already carries the meaning */
  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('.donut-wrap[aria-hidden="true"]').count(), 1);
  assert.match(await page.locator(".dlegend").getAttribute("aria-label"), /assets/);

  /* keyboard windowing — the whole zoom feature used to need a pointing device */
  await page.locator(".tabbtn", { hasText: "Overview" }).click();
  await page.waitForTimeout(700);
  const domain = () => page.evaluate(() => {
    const t = [...document.querySelectorAll(".recharts-xAxis .recharts-cartesian-axis-tick-value")];
    return t.length ? t[0].textContent : null;
  });
  const wrap = page.locator(".scope-wrap").first();
  await wrap.focus();
  assert.equal(await page.evaluate(() => document.activeElement.className), "scope-wrap");
  const start0 = await domain();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(400);
  assert.notEqual(await domain(), start0, "arrow keys should pan the window");
  await page.keyboard.press("Home");
  await page.waitForTimeout(400);
  assert.equal(await domain(), start0, "Home should return to the start");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("no chart series is distinguished by colour alone", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".recharts-line-curve").first().waitFor();
  await page.waitForTimeout(700);

  /* the main projection: net worth, invested and debt used to be three identical strokes */
  const main = await page.locator(".recharts-surface").first().locator(".recharts-line-curve")
    .evaluateAll((els) => els.map((e) => e.getAttribute("stroke-dasharray") || "solid"));
  assert.ok(main.length >= 2);
  assert.equal(new Set(main).size, main.length, `each series needs its own dash: ${main.join(" / ")}`);

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("the topbar survives a phone: the headline doesn't break and the toolbar doesn't eat the screen", async () => {
  /* The toolbar grew from four buttons to twelve across these batches. As a flex row at
     every width it squeezed the headline until it wrapped — and a money figure can only
     wrap in one place, after the minus sign, which put a lone dash above the number on
     iOS. (WebKit takes that break opportunity; Blink doesn't, so it can't be reproduced
     here — the fix is to make the break impossible rather than to rely on either.) */
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("pageerror", (e) => consoleErrors.push(e.message));
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();

  /* a plan deep enough in the red that the headline carries a minus sign */
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("fin3:debts") || "[]");
    d.push({ id: "mortgage", name: "Mortgage", kind: "loan", balance: 400000, originalBalance: 400000, apr: 6, minPayment: 2400, interestFrom: new Date().toISOString().slice(0, 10) });
    localStorage.setItem("fin3:debts", JSON.stringify(d));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.waitForTimeout(900);

  const m = await page.evaluate(() => {
    const nw = document.querySelector(".nwbig");
    const cs = getComputedStyle(nw);
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
    return {
      text: nw.textContent,
      lines: Math.round(nw.getBoundingClientRect().height / lh),
      whiteSpace: cs.whiteSpace,
      stacked: getComputedStyle(document.querySelector(".topbar")).flexDirection,
      topbarH: Math.round(document.querySelector(".topbar").getBoundingClientRect().height),
      buttons: document.querySelectorAll(".toolbar .tbtn").length,
      pageScrollsSideways: (window.scrollTo(500, 0), window.scrollX > 0),
    };
  });

  assert.match(m.text, /^-\$/, "the fixture should put net worth in the red");
  assert.equal(m.lines, 1, `the headline must stay on one line, got ${m.lines} for "${m.text}"`);
  assert.equal(m.whiteSpace, "nowrap", "and must be unbreakable, so no browser can split the minus off");
  assert.equal(m.stacked, "column", "the topbar stacks on a phone rather than competing for the line");
  assert.ok(m.buttons >= 10, `expected the full toolbar, got ${m.buttons}`);
  assert.ok(m.topbarH < 200, `${m.buttons} buttons should fit in a couple of rows, not ${m.topbarH}px of screen`);
  assert.equal(m.pageScrollsSideways, false, "and nothing may push the page sideways");

  /* icons only, but every button keeps the name it is found and announced by */
  for (const name of ["Help", "Undo", "Export", "Numbers", "Print"]) {
    assert.equal(await page.getByRole("button", { name, exact: false }).count(), 1,
      `"${name}" must still be reachable by name with its label visually hidden`);
  }

  assert.deepEqual(consoleErrors, []);
  await ctx.close();
});

test("a house counts toward net worth without pretending it's money", async () => {
  /* The defect this feature exists to fix. Before it, an "Other asset" typed for a house
     landed in the cash bucket — so the runway said you could live for years off a building,
     and the independence date came forward on money nobody can spend. */
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.waitForTimeout(900);

  const stat = (label) => page.locator(".stat", { has: page.locator(`.k:text-matches("${label}")`) }).locator(".v").first();
  const read = async () => ({
    nw: (await page.locator(".nwbig").textContent()).trim(),
    runway: (await stat("Cash runway").textContent()).trim(),
    fi: (await stat("Financial indep").textContent()).trim(),
    free: (await stat("Debt-free").textContent()).trim(),
  });
  const before = await read();

  const addAccount = (acct) => page.evaluate((a) => {
    const list = JSON.parse(localStorage.getItem("fin3:accounts") || "[]");
    localStorage.setItem("fin3:accounts", JSON.stringify([...list, a]));
  }, acct);
  const settle = async () => {
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".nwbig").waitFor();
    await page.waitForTimeout(1200);
  };

  await addAccount({ id: "housetest", name: "House", type: "home", balance: 400000, rate: 3 });
  await settle();
  const withHouse = await read();

  assert.notEqual(withHouse.nw, before.nw, "the house is part of what you're worth");
  assert.equal(withHouse.runway, before.runway, "but it doesn't feed you for a single extra month");
  assert.equal(withHouse.fi, before.fi, "and it doesn't buy you a day of independence");

  /* it does get its own slice of the asset mix rather than hiding inside "Cash" */
  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  await page.waitForTimeout(400);
  assert.ok((await page.locator(".dl-row .nm").allTextContents()).includes("Property"),
    "property should be its own slice of the asset mix");

  /* ticking "count its equity toward independence" is what moves the date. The row is
     found by position rather than by name: an account's name lives in an input's *value*,
     which has-text can't see. */
  const houseRow = page.locator(".row.acct").last();
  assert.equal(await houseRow.locator("input.rname").inputValue(), "House");
  await houseRow.locator(".chk input").check();
  await page.waitForTimeout(1400);
  await page.locator(".tabbtn", { hasText: "Overview" }).click();
  await page.waitForTimeout(900);
  assert.notEqual((await read()).fi, before.fi, "opting in should bring independence forward");
  await page.locator(".tabbtn", { hasText: "Accounts" }).click();
  await page.locator(".row.acct").last().locator(".chk input").uncheck();
  await page.waitForTimeout(1400);

  /* and a mortgage against it doesn't move the debt-free date, but does show up as its own
     timeline entry with its own payoff */
  await page.evaluate(() => {
    const debts = JSON.parse(localStorage.getItem("fin3:debts") || "[]");
    debts.push({ id: "mtgtest", name: "Mortgage", kind: "loan", balance: 300000, originalBalance: 300000, apr: 6, minPayment: 1800, securedBy: "housetest", interestFrom: new Date().toISOString().slice(0, 10) });
    localStorage.setItem("fin3:debts", JSON.stringify(debts));
    const pays = JSON.parse(localStorage.getItem("fin3:debtPayments") || "[]");
    const acct = JSON.parse(localStorage.getItem("fin3:accounts") || "[]")[0];
    pays.push({ id: "mtgpaytest", name: "Mortgage payment", amount: 1800, date: new Date().toISOString().slice(0, 10), recur: "monthly", fromAcct: acct.id, toDebt: "mtgtest" });
    localStorage.setItem("fin3:debtPayments", JSON.stringify(pays));
  });
  await settle();
  assert.equal((await read()).free, withHouse.free, "a mortgage is not what 'debt-free' is about");

  await page.locator(".tabbtn", { hasText: "Debt" }).click();
  await page.waitForTimeout(600);
  assert.equal(await page.locator('.panel:has-text("Secured on an asset") .loan').count(), 1,
    "the mortgage belongs apart from the consumer loans it was conflated with");
  assert.equal(await page.locator('.panel:has-text("Secured on an asset") select[aria-label="Secured by"]').inputValue(), "housetest");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});

test("the wizard is offered beside the example, and replaces it only when confirmed", async () => {
  const { page, consoleErrors } = await newPage();
  await page.goto(`${baseUrl}/financial-simulator/`, { waitUntil: "networkidle" });
  await page.locator(".nwbig").waitFor();
  await page.waitForTimeout(900);

  /* the seed data still loads, so nothing about a first visit changes — the wizard is an
     offer beside it, not a gate in front of it */
  const seeded = (await page.locator(".nwbig").textContent()).trim();
  const savedBefore = await page.evaluate(() => localStorage.getItem("fin3:accounts"));
  assert.ok(savedBefore, "the example is on screen and saved, as it always was");

  const walk = async () => {
    await page.locator('[data-testid="wizard"]').waitFor();
    await page.getByLabel("Salary / year").fill("110000");
    await page.getByLabel("401k / paycheck").fill("6");
    await page.locator('[data-testid="wizard-next"]').click();
    await page.getByLabel("Checking").fill("6000");
    await page.getByLabel("Brokerage").fill("40000");
    await page.getByLabel("Home value").fill("480000");
    await page.locator('[data-testid="wizard-next"]').click();
    await page.getByLabel("Debt name").fill("Mortgage");
    await page.getByLabel("Debt kind").selectOption("mortgage");
    await page.getByLabel("Balance").fill("355000");
    await page.getByLabel("Rate").fill("6.25");
    await page.getByLabel("Min / mo").fill("2300");
    await page.locator('[data-testid="wizard-next"]').click();
    await page.getByLabel("Living costs / mo").fill("4200");
    await page.getByLabel("Invested / mo").fill("800");
    await page.locator('[data-testid="wizard-next"]').click();
    await page.locator('[data-testid="wizard-summary"]').waitFor();
    await page.waitForTimeout(700);
  };

  /* walked all the way to review and then cancelled: nothing is touched */
  await page.getByRole("button", { name: "Set mine up instead" }).click();
  await walk();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.waitForTimeout(700);
  assert.equal((await page.locator(".nwbig").textContent()).trim(), seeded, "cancelling changes nothing on screen");
  assert.equal(await page.evaluate(() => localStorage.getItem("fin3:accounts")), savedBefore,
    "and nothing in storage — a wizard you backed out of never happened");

  /* and again, confirmed this time */
  await page.getByRole("button", { name: "Set mine up instead" }).click();
  await walk();
  const promised = await page.locator('[data-testid="wizard-summary"]').textContent();
  const reviewNw = (await page.locator('[data-testid="wizard"] .stat .v').first().textContent()).trim();
  await page.locator('[data-testid="wizard-confirm"]').click();
  await page.waitForTimeout(1600);

  assert.equal(await page.locator('[data-testid="wizard"]').count(), 0, "it closes on confirm");
  assert.equal(await page.locator(".tabbtn.active").textContent(), "Overview", "and lands on the Overview");
  assert.equal(await page.locator(".notice.rise").count(), 0, "the example notice is gone with the example");
  const built = (await page.locator(".nwbig").textContent()).trim();
  assert.notEqual(built, seeded);
  /* the review screen's figure is the projection, so it has to be the one that appears */
  assert.equal(built.replace(/[$,]/g, ""), reviewNw.replace(/[$,]/g, ""),
    `review promised ${reviewNw}, Overview shows ${built}`);
  /* checking, brokerage and the home — nothing was created for what wasn't entered */
  assert.match(promised, /^3 accounts · 1 debt · 1 expense · 1 transfer$/);

  /* it's an ordinary edit, so undo puts the example back */
  await page.getByRole("button", { name: "Undo" }).click();
  await page.waitForTimeout(1400);
  assert.equal((await page.locator(".nwbig").textContent()).trim(), seeded, "⌘Z restores what was replaced");

  assert.deepEqual(consoleErrors, []);
  await page.close();
});
