import { NumField, Seg } from "./components.js";
import { Check, Plus, Trash2 } from "./icons.js";
import { RECUR, CATEGORIES, fmtMoney, fmtDate } from "./format.js";
import { FILING } from "./tax.js";
import { STEPS, DEBT_KINDS, emptyAnswers, emptyDebt, stepReady, buildPlan, summarize } from "./wizard.js";
const {
  useState,
  useMemo
} = React;
const PAY_RECUR = RECUR.filter(r => ["weekly", "biweekly", "semimonthly", "monthly"].includes(r.v));
export function Wizard({
  onApply,
  onCancel,
  preview,
  start
}) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState(emptyAnswers);
  const up = (k, v) => setA(prev => ({
    ...prev,
    [k]: v
  }));
  const upCat = (k, v) => setA(prev => ({
    ...prev,
    categories: {
      ...prev.categories,
      [k]: v
    }
  }));
  const upDebt = (id, k, v) => setA(prev => ({
    ...prev,
    debts: prev.debts.map(d => d.id === id ? {
      ...d,
      [k]: v
    } : d)
  }));
  const addDebt = () => setA(prev => ({
    ...prev,
    debts: [...prev.debts, emptyDebt()]
  }));
  const rmDebt = id => setA(prev => ({
    ...prev,
    debts: prev.debts.filter(d => d.id !== id)
  }));
  const here = STEPS[step];
  const ready = stepReady(here.v, a);
  const last = step === STEPS.length - 1;
  const built = useMemo(() => last ? buildPlan(a) : null, [last, a]);
  const result = useMemo(() => built && preview ? preview(built) : null, [built, preview]);
  const w2date = w => new Date(start.getTime() + w * 7 * 86400000);
  return React.createElement("div", {
    className: "wiz",
    "data-testid": "wizard"
  }, React.createElement("ol", {
    className: "wizsteps",
    "aria-label": "Setup steps"
  }, STEPS.map((s, i) => React.createElement("li", {
    key: s.v,
    className: i === step ? "on" : i < step ? "done" : "",
    "aria-current": i === step ? "step" : undefined
  }, React.createElement("span", {
    className: "wn"
  }, i < step ? "✓" : i + 1), s.title))), React.createElement("div", {
    className: "mnote"
  }, here.sub), here.v === "you" && React.createElement(React.Fragment, null, React.createElement(Seg, {
    value: a.payMode,
    options: [{
      v: "gross",
      label: "I know my salary"
    }, {
      v: "take",
      label: "I know my take-home"
    }],
    onChange: v => up("payMode", v)
  }), React.createElement("div", {
    className: "mnote"
  }, a.payMode === "gross" ? "Gross, before tax and before anything comes out of it. Take-home is worked out from the brackets, which is also the only way a raise gets priced properly — part of an increase lands in a higher band." : "What actually arrives in your account each payday. Nothing is derived, and a raise scales what you type."), React.createElement("div", {
    className: "modal-row"
  }, a.payMode === "gross" ? React.createElement(NumField, {
    cls: "ramt",
    label: "Salary / year",
    prefix: "$",
    value: a.gross,
    onChange: v => up("gross", v)
  }) : React.createElement(NumField, {
    cls: "ramt",
    label: "Take-home / paycheck",
    prefix: "$",
    value: a.takeHome,
    onChange: v => up("takeHome", v)
  }), React.createElement("div", {
    className: "field"
  }, React.createElement("label", null, "Paid"), React.createElement("select", {
    value: a.recur,
    onChange: e => up("recur", e.target.value),
    "aria-label": "Paid"
  }, PAY_RECUR.map(r => React.createElement("option", {
    key: r.v,
    value: r.v
  }, r.label))))), React.createElement("div", {
    className: "modal-row"
  }, React.createElement("div", {
    className: "field",
    style: {
      flex: 1,
      minWidth: 150
    }
  }, React.createElement("label", null, "Filing status"), React.createElement("select", {
    value: a.filing,
    onChange: e => up("filing", e.target.value),
    "aria-label": "Filing status"
  }, FILING.map(f => React.createElement("option", {
    key: f.v,
    value: f.v
  }, f.label)))), React.createElement(NumField, {
    cls: "rrate",
    label: "State tax",
    suffix: "%",
    value: a.stateRate,
    onChange: v => up("stateRate", v)
  }), React.createElement(NumField, {
    cls: "rrate",
    label: "Born",
    value: a.birthYear,
    onChange: v => up("birthYear", v)
  })), React.createElement("div", {
    className: "mnote"
  }, "A birth year is optional. With one, the app knows when retirement accounts open without a penalty, and can tell you whether enough is reachable before then."), React.createElement("div", {
    className: "modal-row"
  }, React.createElement(NumField, {
    cls: "rrate",
    label: "401k / paycheck",
    suffix: "%",
    value: a.retirePct,
    onChange: v => up("retirePct", v)
  }), React.createElement(NumField, {
    cls: "rrate",
    label: "Employer matches up to",
    suffix: "%",
    value: a.matchPct,
    onChange: v => up("matchPct", v)
  })), React.createElement("div", {
    className: "mnote"
  }, "Both as a percentage of gross. Leave the match at zero if there isn't one; a typical one is \"100% up to 3%\".")), here.v === "have" && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "modal-row"
  }, React.createElement(NumField, {
    cls: "ramt",
    label: "Checking",
    prefix: "$",
    value: a.checking,
    onChange: v => up("checking", v)
  }), React.createElement(NumField, {
    cls: "ramt",
    label: "Savings",
    prefix: "$",
    value: a.savings,
    onChange: v => up("savings", v)
  })), React.createElement("div", {
    className: "modal-row"
  }, React.createElement(NumField, {
    cls: "ramt",
    label: "Brokerage",
    prefix: "$",
    value: a.brokerage,
    onChange: v => up("brokerage", v)
  }), React.createElement(NumField, {
    cls: "ramt",
    label: "Retirement",
    prefix: "$",
    value: a.retirement,
    onChange: v => up("retirement", v)
  })), React.createElement("div", {
    className: "mnote"
  }, "Leave anything you don't have at zero and no account is created for it. You can add more, split one in two, or change the expected returns afterwards."), React.createElement("div", {
    className: "modal-row"
  }, React.createElement(NumField, {
    cls: "ramt",
    label: "Home value",
    prefix: "$",
    value: a.home,
    onChange: v => up("home", v)
  }), React.createElement(NumField, {
    cls: "ramt",
    label: "Vehicle value",
    prefix: "$",
    value: a.vehicle,
    onChange: v => up("vehicle", v)
  })), React.createElement("div", {
    className: "mnote"
  }, "What they'd sell for today. Both count toward net worth, and neither counts toward your cash runway or your independence date \u2014 it's worth something, but it isn't money you can spend next month. A vehicle depreciates by default.")), here.v === "owe" && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "mnote"
  }, "Owing nothing is a complete answer \u2014 leave this empty and carry on. A mortgage or a car loan is linked to what you entered on the last step, and sits outside your debt-free date."), (a.debts || []).map(d => React.createElement("div", {
    className: "wizdebt",
    key: d.id
  }, React.createElement("div", {
    className: "modal-row"
  }, React.createElement("input", {
    className: "rname",
    value: d.name,
    placeholder: "What is it?",
    onChange: e => upDebt(d.id, "name", e.target.value),
    "aria-label": "Debt name"
  }), React.createElement("select", {
    value: d.type,
    onChange: e => upDebt(d.id, "type", e.target.value),
    "aria-label": "Debt kind"
  }, DEBT_KINDS.map(k => React.createElement("option", {
    key: k.v,
    value: k.v
  }, k.label))), React.createElement("button", {
    className: "icon-btn",
    onClick: () => rmDebt(d.id),
    "aria-label": "Remove"
  }, React.createElement(Trash2, {
    size: 15
  }))), React.createElement("div", {
    className: "modal-row"
  }, React.createElement(NumField, {
    cls: "ramt",
    label: "Balance",
    prefix: "$",
    value: d.balance,
    onChange: v => upDebt(d.id, "balance", v)
  }), React.createElement(NumField, {
    cls: "rrate",
    label: "Rate",
    suffix: "%",
    value: d.apr,
    onChange: v => upDebt(d.id, "apr", v)
  }), d.type !== "card" && React.createElement(NumField, {
    cls: "ramt",
    label: "Min / mo",
    prefix: "$",
    value: d.minPayment,
    onChange: v => upDebt(d.id, "minPayment", v)
  })), d.type === "card" && React.createElement("div", {
    className: "mnote"
  }, "Cards are set to pay in full each month, which is the only way one costs nothing. Change it on the Cash flow tab if you carry a balance."))), React.createElement("button", {
    className: "btn btn-add",
    onClick: addDebt
  }, React.createElement(Plus, {
    size: 15
  }), "Add another")), here.v === "spend" && React.createElement(React.Fragment, null, React.createElement(Seg, {
    value: a.spendMode,
    options: [{
      v: "total",
      label: "One monthly figure"
    }, {
      v: "categories",
      label: "By category"
    }],
    onChange: v => up("spendMode", v)
  }), React.createElement("div", {
    className: "mnote"
  }, "Everything that isn't a debt payment or investing. One figure is enough to get a projection; splitting it up is what makes the spending chart worth looking at, and you can do that later from a bank statement under Import."), a.spendMode === "total" ? React.createElement("div", {
    className: "modal-row"
  }, React.createElement(NumField, {
    cls: "ramt",
    label: "Living costs / mo",
    prefix: "$",
    value: a.monthlySpend,
    onChange: v => up("monthlySpend", v)
  })) : React.createElement("div", {
    className: "wizcats"
  }, CATEGORIES.map(c => React.createElement(NumField, {
    key: c.v,
    cls: "ramt",
    label: c.label,
    prefix: "$",
    value: (a.categories || {})[c.v] || "",
    onChange: v => upCat(c.v, v)
  }))), React.createElement("div", {
    className: "modal-row",
    style: {
      marginTop: 12
    }
  }, React.createElement(NumField, {
    cls: "ramt",
    label: "Invested / mo",
    prefix: "$",
    value: a.investMonthly,
    onChange: v => up("investMonthly", v)
  })), React.createElement("div", {
    className: "mnote"
  }, "On top of anything coming out of your paycheck \u2014 a standing transfer into a brokerage, say.")), here.v === "review" && built && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "mnote"
  }, "Nothing has been replaced yet. This is what confirming would create, and the figures are the real projection running on it."), React.createElement("div", {
    className: "wizsum",
    "data-testid": "wizard-summary"
  }, summarize(built).join(" · ") || "an empty plan"), result && result.sim && React.createElement("div", {
    className: "sgrid",
    style: {
      marginBottom: 4
    }
  }, React.createElement("div", {
    className: "stat"
  }, React.createElement("div", {
    className: "k"
  }, "Net worth", React.createElement("br", null), "today"), React.createElement("div", {
    className: "v mono green"
  }, fmtMoney(result.sim.series[0].nw))), React.createElement("div", {
    className: "stat"
  }, React.createElement("div", {
    className: "k"
  }, "Debt-free", React.createElement("br", null), "date"), React.createElement("div", {
    className: "v mono amber"
  }, result.sim.debtFree != null ? fmtDate(w2date(result.sim.debtFree)) : result.sim.series[0].unsecuredDebt > 0 ? "40y+" : "Clear")), React.createElement("div", {
    className: "stat"
  }, React.createElement("div", {
    className: "k"
  }, "Financial", React.createElement("br", null), "indep."), React.createElement("div", {
    className: "v mono green"
  }, result.sim.fire != null ? fmtDate(w2date(result.sim.fire)) : "40y+"))), React.createElement("div", {
    className: "mnote"
  }, "Confirming replaces the plan that's on screen now. It's a single undo away if you change your mind \u2014 \u2318Z, or the toolbar button.")), React.createElement("div", {
    className: "modal-row",
    style: {
      marginTop: 14
    }
  }, step > 0 && React.createElement("button", {
    className: "btn btn-ghost",
    onClick: () => setStep(step - 1)
  }, "Back"), last ? React.createElement("button", {
    className: "btn btn-amber",
    onClick: () => onApply(built),
    "data-testid": "wizard-confirm"
  }, React.createElement(Check, {
    size: 15
  }), "Replace my plan with this") : React.createElement("button", {
    className: "btn btn-amber",
    onClick: () => setStep(step + 1),
    disabled: !ready,
    "data-testid": "wizard-next"
  }, "Next"), React.createElement("button", {
    className: "btn btn-ghost",
    onClick: onCancel,
    style: {
      marginLeft: "auto"
    }
  }, "Cancel")), !ready && !last && React.createElement("div", {
    className: "mnote"
  }, here.v === "have" ? "Enter at least one balance to carry on." : here.v === "spend" ? "Enter what you spend in a month to carry on." : "Enter what you earn to carry on."));
}