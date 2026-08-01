// Accounts tab: balances, expected returns, and per-account caps/sweeps.
import { Trash2, Plus } from "../icons.js";
import { Stat, NumField, Seg, Donut } from "../components.js";
import { fmtMoney, fmtBig, n0, ACCT_TYPES } from "../format.js";

export function AccountsTab({ D, accounts, settings, defaultOverflow, upAcct, upAcctType, addAcct, rmAcct }) {
  return (
            <>
              <div className="sgrid rise" style={{ marginBottom: 16 }}>
                <Stat k="Total<br/>assets" v={fmtBig(D.totalAssets)} accent="green" />
                <Stat k="Total<br/>debt" v={fmtBig(D.totalDebt)} accent="red" />
                <Stat k="Net<br/>worth" v={fmtBig(D.netWorth)} accent={D.netWorth >= 0 ? "" : "red"} />
                <Stat k="Invested<br/>share" v={D.totalAssets > 0 ? Math.round(D.bInv / D.totalAssets * 100) + "%" : "0%"} accent="cyan" />
              </div>
              <div className="panel rise">
                <div className="phead"><div className="ptitle">Accounts</div><div className="psub">balance + expected annual return</div></div>
                {accounts.map((a) => {
                  const capOn = a.cap != null && a.cap !== "";
                  const need = D.worstMonthOut(a.id);
                  const tight = capOn && n0(a.cap) < need;
                  const dest = a.spillTo ? (D.names[a.spillTo] || "—") : null;
                  return (
                    <div className="row acct" key={a.id}>
                      <div className="acct-top">
                        <input className="rname" value={a.name} onChange={(e) => upAcct(a.id, "name", e.target.value)} aria-label="Account name" />
                        <button className="icon-btn" onClick={() => rmAcct(a.id)} aria-label="Remove"><Trash2 size={16} /></button>
                      </div>
                      <div className="acct-fields">
                        <select value={a.type} onChange={(e) => upAcctType(a.id, e.target.value)} aria-label="Type">{ACCT_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}</select>
                        <NumField cls="ramt" label="Balance" prefix="$" value={a.balance} onChange={(v) => upAcct(a.id, "balance", v)} />
                        <NumField cls="rrate" label="Return" suffix="%" value={a.rate} onChange={(v) => upAcct(a.id, "rate", v)} />
                        <div className="field">
                          <label>Tax treatment</label>
                          <select value={a.taxTreatment || "taxable"} onChange={(e) => upAcct(a.id, "taxTreatment", e.target.value)} aria-label="Tax treatment">
                            <option value="taxable">Taxable</option>
                            <option value="traditional">Tax-deferred (traditional)</option>
                            <option value="roth">Tax-free (Roth)</option>
                          </select>
                        </div>
                        <div className="field">
                          <label>Balance as of</label>
                          <input type="date" value={a.asOf || ""} onChange={(e) => upAcct(a.id, "asOf", e.target.value)}
                            aria-label="Balance as of" title="The date this balance was true. Leave blank for today." />
                        </div>
                        <div className="caphint">Leave blank if this is today's balance. A future date freezes the account until then; a past date catches it up to today using your normal income, expenses and payments.</div>
                        <div className="caphint">
                          {a.taxTreatment === "traditional"
                            ? `Tax-deferred: a withdrawal is taxed, so ${fmtMoney(n0(a.balance))} here is worth about ${fmtMoney(n0(a.balance) * (1 - n0(settings.retireTaxRate) / 100))} to spend, and it's locked until 59½.`
                            : a.taxTreatment === "roth"
                              ? "Tax-free: growth and withdrawals are untaxed, but it's still locked until 59½ for the independence bridge."
                              : `Taxable: reachable at any age, and its investment growth is docked ${n0(settings.taxDrag)}%/yr for tax on distributions.`}
                          {" "}Defaulted from the account type — a "Roth + 401k" account holding both is worth splitting in two so each half is counted properly.
                        </div>
                      </div>
                      <div className="capline">
                        <NumField cls="ramt" label="Cap at" prefix="$" value={a.cap == null ? "" : a.cap} onChange={(v) => upAcct(a.id, "cap", v)} />
                        {capOn && (<>
                          <div className="field" style={{ flex: 1, minWidth: 130 }}>
                            <label>Sweep the excess to</label>
                            <select value={a.spillTo || ""} onChange={(e) => upAcct(a.id, "spillTo", e.target.value)} aria-label="Sweep destination">
                              <option value="">— nowhere (just piles up) —</option>
                              {D.loans.length > 0 && <optgroup label="Loans">{D.loans.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</optgroup>}
                              {D.cards.length > 0 && <optgroup label="Credit cards">{D.cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>}
                              <optgroup label="Accounts">{accounts.filter((x) => x.id !== a.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>
                            </select>
                          </div>
                          <Seg value={a.spillEvery === "weekly" ? "weekly" : "monthly"} options={[{ v: "monthly", label: "Monthly" }, { v: "weekly", label: "Weekly" }]} onChange={(v) => upAcct(a.id, "spillEvery", v)} />
                        </>)}
                        {capOn && a.spillTo
                          ? <div className={"caphint" + (tight ? " warn-txt" : "")}>
                            Anything over {fmtMoney(n0(a.cap))} moves to {dest} at each {a.spillEvery === "weekly" ? "week" : "month"} end.
                            {D.loans.some((l) => l.id === a.spillTo) ? ` Once ${dest} is paid off it rolls to your highest-rate remaining loan, then to ${(accounts.find((x) => x.id === settings.overflowTo) || defaultOverflow || {}).name || "investments"} when every loan is clear.` : ""}
                            {tight ? ` A heavy month draws about ${fmtMoney(need)} from here — a cap below that will overdraw it.` : ` Its heaviest month draws about ${fmtMoney(need)}, so the buffer holds.`}
                          </div>
                          : capOn ? <div className="caphint">Pick a destination or the cap does nothing.</div>
                            : <div className="caphint">Leave blank for no cap. Set one to stop cash idling here — the excess gets swept somewhere it earns or saves you more.</div>}
                      </div>
                    </div>
                  );
                })}
                <button className="btn btn-add" onClick={addAcct}><Plus size={15} />Add an account</button>
                <div className="assume">Debts are accounts too — they live in the Debt tab. All money movement between them is set up in Cash flow.
                  {D.capped.length > 0 && D.avgSweep > 0 && <> Your caps are moving about <b style={{ color: "var(--amber)" }}>{fmtMoney(D.avgSweep)}/mo</b> out of idle cash on average over the next three years.</>}
                </div>
              </div>
              <div className="panel rise"><div className="phead"><div className="ptitle">Asset mix</div></div><Donut data={D.alloc} center={fmtBig(D.totalAssets)} sub="assets" /></div>
            </>
  );
}
