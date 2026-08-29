// The stepped form over src/wizard.js. Rendering and local answer state only — every
// decision about what a plan looks like lives in the pure module beside it, and the plan it
// produces is handed straight to the app's own applyPlan.
//
// The basename differs from wizard.js on purpose: this file compiles to wizard-form.js, and
// a .jsx sharing a stem with a hand-written .js would compile straight over it.
import { NumField, Seg } from "./components.js";
import { Check, Plus, Trash2 } from "./icons.js";
import { RECUR, CATEGORIES, fmtMoney, fmtDate } from "./format.js";
import { FILING } from "./tax.js";
import { STEPS, DEBT_KINDS, emptyAnswers, emptyDebt, stepReady, buildPlan, summarize } from "./wizard.js";

const { useState, useMemo } = React;

/* the frequencies a paycheck actually arrives on — quarterly and yearly are for bills */
const PAY_RECUR = RECUR.filter((r) => ["weekly", "biweekly", "semimonthly", "monthly"].includes(r.v));

/**
 * @param {object} props
 * @param {(plan:object) => void} props.onApply - called with the built plan, once, on confirm
 * @param {() => void} props.onCancel
 * @param {(plan:object) => object|null} props.preview - runs the projection on a candidate
 *   plan so the review step can show the dates it produces. Injected rather than imported,
 *   because that's the app's worker-or-fallback decision, not this component's.
 * @param {Date} props.start - week zero, for turning the result's week numbers into dates
 */
export function Wizard({ onApply, onCancel, preview, start }) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState(emptyAnswers);
  const up = (k, v) => setA((prev) => ({ ...prev, [k]: v }));
  const upCat = (k, v) => setA((prev) => ({ ...prev, categories: { ...prev.categories, [k]: v } }));
  const upDebt = (id, k, v) => setA((prev) => ({ ...prev, debts: prev.debts.map((d) => (d.id === id ? { ...d, [k]: v } : d)) }));
  const addDebt = () => setA((prev) => ({ ...prev, debts: [...prev.debts, emptyDebt()] }));
  const rmDebt = (id) => setA((prev) => ({ ...prev, debts: prev.debts.filter((d) => d.id !== id) }));

  const here = STEPS[step];
  const ready = stepReady(here.v, a);
  const last = step === STEPS.length - 1;

  /* Only built on the review step: the answers are enough to run a projection, and the
     honest way to show what a plan does is to run it rather than describe it. */
  const built = useMemo(() => (last ? buildPlan(a) : null), [last, a]);
  const result = useMemo(() => (built && preview ? preview(built) : null), [built, preview]);
  const w2date = (w) => new Date(start.getTime() + w * 7 * 86400000);

  return (
    <div className="wiz" data-testid="wizard">
      <ol className="wizsteps" aria-label="Setup steps">
        {STEPS.map((s, i) => (
          <li key={s.v} className={i === step ? "on" : i < step ? "done" : ""} aria-current={i === step ? "step" : undefined}>
            <span className="wn">{i < step ? "✓" : i + 1}</span>{s.title}
          </li>
        ))}
      </ol>
      <div className="mnote">{here.sub}</div>

      {here.v === "you" && (<>
        <Seg value={a.payMode} options={[{ v: "gross", label: "I know my salary" }, { v: "take", label: "I know my take-home" }]}
          onChange={(v) => up("payMode", v)} />
        <div className="mnote">
          {a.payMode === "gross"
            ? "Gross, before tax and before anything comes out of it. Take-home is worked out from the brackets, which is also the only way a raise gets priced properly — part of an increase lands in a higher band."
            : "What actually arrives in your account each payday. Nothing is derived, and a raise scales what you type."}
        </div>
        <div className="modal-row">
          {a.payMode === "gross"
            ? <NumField cls="ramt" label="Salary / year" prefix="$" value={a.gross} onChange={(v) => up("gross", v)} />
            : <NumField cls="ramt" label="Take-home / paycheck" prefix="$" value={a.takeHome} onChange={(v) => up("takeHome", v)} />}
          <div className="field">
            <label>Paid</label>
            <select value={a.recur} onChange={(e) => up("recur", e.target.value)} aria-label="Paid">
              {PAY_RECUR.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-row">
          <div className="field" style={{ flex: 1, minWidth: 150 }}>
            <label>Filing status</label>
            <select value={a.filing} onChange={(e) => up("filing", e.target.value)} aria-label="Filing status">
              {FILING.map((f) => <option key={f.v} value={f.v}>{f.label}</option>)}
            </select>
          </div>
          <NumField cls="rrate" label="State tax" suffix="%" value={a.stateRate} onChange={(v) => up("stateRate", v)} />
          <NumField cls="rrate" label="Born" value={a.birthYear} onChange={(v) => up("birthYear", v)} />
        </div>
        <div className="mnote">A birth year is optional. With one, the app knows when retirement accounts open without a penalty, and can tell you whether enough is reachable before then.</div>
        <div className="modal-row">
          <NumField cls="rrate" label="401k / paycheck" suffix="%" value={a.retirePct} onChange={(v) => up("retirePct", v)} />
          <NumField cls="rrate" label="Employer matches up to" suffix="%" value={a.matchPct} onChange={(v) => up("matchPct", v)} />
        </div>
        <div className="mnote">Both as a percentage of gross. Leave the match at zero if there isn't one; a typical one is "100% up to 3%".</div>
      </>)}

      {here.v === "have" && (<>
        <div className="modal-row">
          <NumField cls="ramt" label="Checking" prefix="$" value={a.checking} onChange={(v) => up("checking", v)} />
          <NumField cls="ramt" label="Savings" prefix="$" value={a.savings} onChange={(v) => up("savings", v)} />
        </div>
        <div className="modal-row">
          <NumField cls="ramt" label="Brokerage" prefix="$" value={a.brokerage} onChange={(v) => up("brokerage", v)} />
          <NumField cls="ramt" label="Retirement" prefix="$" value={a.retirement} onChange={(v) => up("retirement", v)} />
        </div>
        <div className="mnote">Leave anything you don't have at zero and no account is created for it. You can add more, split one in two, or change the expected returns afterwards.</div>
        <div className="modal-row">
          <NumField cls="ramt" label="Home value" prefix="$" value={a.home} onChange={(v) => up("home", v)} />
          <NumField cls="ramt" label="Vehicle value" prefix="$" value={a.vehicle} onChange={(v) => up("vehicle", v)} />
        </div>
        <div className="mnote">What they'd sell for today. Both count toward net worth, and neither counts toward your cash runway or your independence date — it's worth something, but it isn't money you can spend next month. A vehicle depreciates by default.</div>
      </>)}

      {here.v === "owe" && (<>
        <div className="mnote">Owing nothing is a complete answer — leave this empty and carry on. A mortgage or a car loan is linked to what you entered on the last step, and sits outside your debt-free date.</div>
        {(a.debts || []).map((d) => (
          <div className="wizdebt" key={d.id}>
            <div className="modal-row">
              <input className="rname" value={d.name} placeholder="What is it?" onChange={(e) => upDebt(d.id, "name", e.target.value)} aria-label="Debt name" />
              <select value={d.type} onChange={(e) => upDebt(d.id, "type", e.target.value)} aria-label="Debt kind">
                {DEBT_KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}
              </select>
              <button className="icon-btn" onClick={() => rmDebt(d.id)} aria-label="Remove"><Trash2 size={15} /></button>
            </div>
            <div className="modal-row">
              <NumField cls="ramt" label="Balance" prefix="$" value={d.balance} onChange={(v) => upDebt(d.id, "balance", v)} />
              <NumField cls="rrate" label="Rate" suffix="%" value={d.apr} onChange={(v) => upDebt(d.id, "apr", v)} />
              {d.type !== "card" && <NumField cls="ramt" label="Min / mo" prefix="$" value={d.minPayment} onChange={(v) => upDebt(d.id, "minPayment", v)} />}
            </div>
            {d.type === "card" && <div className="mnote">Cards are set to pay in full each month, which is the only way one costs nothing. Change it on the Cash flow tab if you carry a balance.</div>}
          </div>
        ))}
        <button className="btn btn-add" onClick={addDebt}><Plus size={15} />Add another</button>
      </>)}

      {here.v === "spend" && (<>
        <Seg value={a.spendMode} options={[{ v: "total", label: "One monthly figure" }, { v: "categories", label: "By category" }]}
          onChange={(v) => up("spendMode", v)} />
        <div className="mnote">Everything that isn't a debt payment or investing. One figure is enough to get a projection; splitting it up is what makes the spending chart worth looking at, and you can do that later from a bank statement under Import.</div>
        {a.spendMode === "total"
          ? <div className="modal-row"><NumField cls="ramt" label="Living costs / mo" prefix="$" value={a.monthlySpend} onChange={(v) => up("monthlySpend", v)} /></div>
          : <div className="wizcats">
            {CATEGORIES.map((c) => (
              <NumField key={c.v} cls="ramt" label={c.label} prefix="$" value={(a.categories || {})[c.v] || ""} onChange={(v) => upCat(c.v, v)} />
            ))}
          </div>}
        <div className="modal-row" style={{ marginTop: 12 }}>
          <NumField cls="ramt" label="Invested / mo" prefix="$" value={a.investMonthly} onChange={(v) => up("investMonthly", v)} />
        </div>
        <div className="mnote">On top of anything coming out of your paycheck — a standing transfer into a brokerage, say.</div>
      </>)}

      {here.v === "review" && built && (<>
        <div className="mnote">Nothing has been replaced yet. This is what confirming would create, and the figures are the real projection running on it.</div>
        <div className="wizsum" data-testid="wizard-summary">{summarize(built).join(" · ") || "an empty plan"}</div>
        {result && result.sim && (
          <div className="sgrid" style={{ marginBottom: 4 }}>
            <div className="stat"><div className="k">Net worth<br />today</div><div className="v mono green">{fmtMoney(result.sim.series[0].nw)}</div></div>
            {/* "—" would read as "unknown"; owing no consumer debt is a different answer,
                and it's the one a plan whose only debt is a mortgage gets */}
            <div className="stat"><div className="k">Debt-free<br />date</div><div className="v mono amber">
              {result.sim.debtFree != null ? fmtDate(w2date(result.sim.debtFree))
                : result.sim.series[0].unsecuredDebt > 0 ? "40y+" : "Clear"}
            </div></div>
            <div className="stat"><div className="k">Financial<br />indep.</div><div className="v mono green">{result.sim.fire != null ? fmtDate(w2date(result.sim.fire)) : "40y+"}</div></div>
          </div>
        )}
        <div className="mnote">Confirming replaces the plan that's on screen now. It's a single undo away if you change your mind — ⌘Z, or the toolbar button.</div>
      </>)}

      <div className="modal-row" style={{ marginTop: 14 }}>
        {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>}
        {last
          ? <button className="btn btn-amber" onClick={() => onApply(built)} data-testid="wizard-confirm"><Check size={15} />Replace my plan with this</button>
          : <button className="btn btn-amber" onClick={() => setStep(step + 1)} disabled={!ready} data-testid="wizard-next">Next</button>}
        <button className="btn btn-ghost" onClick={onCancel} style={{ marginLeft: "auto" }}>Cancel</button>
      </div>
      {!ready && !last && (
        <div className="mnote">
          {here.v === "have" ? "Enter at least one balance to carry on."
            : here.v === "spend" ? "Enter what you spend in a month to carry on."
              : "Enter what you earn to carry on."}
        </div>
      )}
    </div>
  );
}
