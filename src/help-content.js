// Per-tab instructional copy shown in the simulator's Help panel. Pure data.
export const HELP = {
  overview: {
    title: "Overview",
    intro: "A read-only summary. Nothing here is editable — every number is driven by what you enter on the other tabs.",
    points: [
      ["The four stat cards", "Net worth is assets minus debts today. Monthly surplus is income minus living costs, before debt payments and investing. The debt-free and independence dates come from the projection below."],
      ["Net worth projection", "Simulates your accounts, debts, income and spending forward week by week for up to 40 years. Amber is net worth, green is investments, red is total debt."],
      ["Reading the chart", "Scroll or pinch to zoom, drag to pan, or use the 1Y / 5Y / Max buttons. Hover any point for exact figures on that date."],
      ["Every account & debt over time", "The same simulation, but with one line per account and a dashed line per debt, so you can see which account is doing the work — or running dry."],
      ["Warnings", "A red banner appears if you're spending more than you earn, or if any single account goes negative at some point in the projection."],
    ],
  },
  accounts: {
    title: "Accounts",
    intro: "Your balance sheet — everything you own. This is where you set starting balances and expected returns.",
    points: [
      ["Add your accounts", "Give each one a name, a type, today's balance, and an expected annual return. Picking a type fills in a sensible default rate, which you can then override."],
      ["Balance as of (optional)", "Leave blank if the balance is accurate today. Set a future date to freeze the account until then — useful for one you haven't opened yet. Set a past date (a recent statement balance, say) and it's caught up to today using your normal income, expenses and payments in the meantime."],
      ["Types matter", "Brokerage and Retirement count as 'invested' for the asset mix and the independence target. Savings, Checking, Cash and Other asset don't."],
      ["Returns are nominal and constant", "The projection applies the rate you set every week, forever. It does not model volatility, crashes, inflation or tax on gains."],
      ["Caps and sweeping (optional)", "Set a cap to stop cash idling in an account. Anything above the cap is swept to the destination you pick — another account, or a debt to pay down."],
      ["Watch the cap warning", "The hint under each cap tells you what that account's heaviest month costs. A cap below that number will overdraw the account, and it turns red to say so."],
    ],
  },
  cashflow: {
    title: "Cash flow",
    intro: "Everything that moves money, with dates. This tab drives almost the entire projection, so it's worth getting right.",
    points: [
      ["Income", "Enter take-home pay per paycheck and how often it arrives. Enter gross separately — as an annual salary or per paycheck — since percentage-based deductions are calculated off gross."],
      ["Pre-tax deductions and match", "401k contributions never reach take-home, so they're added on top and sent straight to the account you choose. An employer match of '100% up to 3%' means every dollar matched, capped at the first 3% of gross."],
      ["Raises, promotions and bonuses", "A raise compounds annually. A promotion is a step change to a new salary on a date — enter the new gross and a tax rate (prefilled from today's rate) and take-home is worked out for you. A bonus lands once a year on its own date and can be a flat amount or a percentage of salary."],
      ["Splitting a paycheck", "Route a percentage or fixed amount to other accounts. The first row in the list receives whatever is left over."],
      ["Expenses", "Set an amount, how often, and which account or credit card it comes from. Add an end date for anything temporary — tuition, a lease — so it doesn't inflate your long-run independence target."],
      ["Payments and transfers", "Payments reduce debt; transfers move money between your own accounts. A card payment can be set to 'pay in full' so it clears whatever was charged that month."],
    ],
  },
  debt: {
    title: "Debt",
    intro: "Loans and cards, and how fast your plan clears them. Balances are edited here; the payments that clear them live on the Cash flow tab.",
    points: [
      ["Balance decay", "Amber is your actual plan. Cyan is what would happen paying only the minimums. The gap between them is what your extra payments are buying you."],
      ["Interest saved and time saved", "Both stat cards compare your plan against that minimums-only path."],
      ["Payoff order", "Loans are ranked highest rate first. When a payment more than clears its target, the surplus rolls to your highest-rate remaining loan automatically."],
      ["Interest start date", "Interest accrues from this date. Push it into the future for a subsidised loan sitting in deferment, and it won't accrue until then."],
      ["Credit cards behave differently", "A card only charges interest on a balance you carry. Pay it in full each month and it costs nothing — so cards are excluded from the debt-free date calculation."],
      ["Changing the plan", "To pay debt down faster, edit or add a payment on the Cash flow tab. This tab shows the result."],
    ],
  },
  invest: {
    title: "Invest",
    intro: "Long-run growth and what it would take to stop needing a salary.",
    points: [
      ["Portfolio growth", "Splits your projected investment balance into money you contributed versus returns earned on top of it."],
      ["Independence target", "Your annual recurring spending divided by your withdrawal rate. At the default 4%, that's 25× your yearly costs."],
      ["Expenses that end don't count", "Anything with an end date inside the next ten years is treated as temporary and left out of the target, since it isn't a forever cost."],
      ["Adjust the withdrawal rate", "Lower it for a more conservative target that needs a bigger portfolio; raise it for the opposite."],
      ["Monte Carlo: range of outcomes", "Runs the same contribution schedule hundreds of times with randomized annual returns, instead of one constant rate — the shaded band shows where returns could land instead of just where they're expected to land on average."],
      ["Volatility, not a market forecast", "Higher volatility widens the band without moving the median much. It's a measure of how much a real market could disagree with the average return, not a prediction of which path you'll actually get."],
      ["A projection, not advice", "The chart above this one holds returns constant — today's dollars, no inflation, tax, or volatility. The Monte Carlo chart relaxes the volatility assumption only, as one blended portfolio; neither models sequence-of-returns risk in retirement or fees. Treat the dates as a direction of travel, not a promise."],
    ],
  },
};

