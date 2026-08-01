import { Trash2, Plus } from "../icons.js";
import { Stat, NumField, Seg, Donut } from "../components.js";
import { fmtMoney, fmtBig, n0, ACCT_TYPES } from "../format.js";
export function AccountsTab({
  D,
  accounts,
  settings,
  defaultOverflow,
  upAcct,
  upAcctType,
  addAcct,
  rmAcct
}) {
  return React.createElement(React.Fragment, null, React.createElement("div", {
    className: "sgrid rise",
    style: {
      marginBottom: 16
    }
  }, React.createElement(Stat, {
    k: "Total<br/>assets",
    v: fmtBig(D.totalAssets),
    accent: "green"
  }), React.createElement(Stat, {
    k: "Total<br/>debt",
    v: fmtBig(D.totalDebt),
    accent: "red"
  }), React.createElement(Stat, {
    k: "Net<br/>worth",
    v: fmtBig(D.netWorth),
    accent: D.netWorth >= 0 ? "" : "red"
  }), React.createElement(Stat, {
    k: "Invested<br/>share",
    v: D.totalAssets > 0 ? Math.round(D.bInv / D.totalAssets * 100) + "%" : "0%",
    accent: "cyan"
  })), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Accounts"), React.createElement("div", {
    className: "psub"
  }, "balance + expected annual return")), accounts.map(a => {
    const capOn = a.cap != null && a.cap !== "";
    const need = D.worstMonthOut(a.id);
    const tight = capOn && n0(a.cap) < need;
    const dest = a.spillTo ? D.names[a.spillTo] || "—" : null;
    return React.createElement("div", {
      className: "row acct",
      key: a.id
    }, React.createElement("div", {
      className: "acct-top"
    }, React.createElement("input", {
      className: "rname",
      value: a.name,
      onChange: e => upAcct(a.id, "name", e.target.value),
      "aria-label": "Account name"
    }), React.createElement("button", {
      className: "icon-btn",
      onClick: () => rmAcct(a.id),
      "aria-label": "Remove"
    }, React.createElement(Trash2, {
      size: 16
    }))), React.createElement("div", {
      className: "acct-fields"
    }, React.createElement("select", {
      value: a.type,
      onChange: e => upAcctType(a.id, e.target.value),
      "aria-label": "Type"
    }, ACCT_TYPES.map(t => React.createElement("option", {
      key: t.v,
      value: t.v
    }, t.label))), React.createElement(NumField, {
      cls: "ramt",
      label: "Balance",
      prefix: "$",
      value: a.balance,
      onChange: v => upAcct(a.id, "balance", v)
    }), React.createElement(NumField, {
      cls: "rrate",
      label: "Return",
      suffix: "%",
      value: a.rate,
      onChange: v => upAcct(a.id, "rate", v)
    }), React.createElement("div", {
      className: "field"
    }, React.createElement("label", null, "Tax treatment"), React.createElement("select", {
      value: a.taxTreatment || "taxable",
      onChange: e => upAcct(a.id, "taxTreatment", e.target.value),
      "aria-label": "Tax treatment"
    }, React.createElement("option", {
      value: "taxable"
    }, "Taxable"), React.createElement("option", {
      value: "traditional"
    }, "Tax-deferred (traditional)"), React.createElement("option", {
      value: "roth"
    }, "Tax-free (Roth)"))), React.createElement("div", {
      className: "field"
    }, React.createElement("label", null, "Balance as of"), React.createElement("input", {
      type: "date",
      value: a.asOf || "",
      onChange: e => upAcct(a.id, "asOf", e.target.value),
      "aria-label": "Balance as of",
      title: "The date this balance was true. Leave blank for today."
    })), React.createElement("div", {
      className: "caphint"
    }, "Leave blank if this is today's balance. A future date freezes the account until then; a past date catches it up to today using your normal income, expenses and payments."), React.createElement("div", {
      className: "caphint"
    }, a.taxTreatment === "traditional" ? `Tax-deferred: a withdrawal is taxed, so ${fmtMoney(n0(a.balance))} here is worth about ${fmtMoney(n0(a.balance) * (1 - n0(settings.retireTaxRate) / 100))} to spend, and it's locked until 59½.` : a.taxTreatment === "roth" ? "Tax-free: growth and withdrawals are untaxed, but it's still locked until 59½ for the independence bridge." : `Taxable: reachable at any age, and its investment growth is docked ${n0(settings.taxDrag)}%/yr for tax on distributions.`, " ", "Defaulted from the account type \u2014 a \"Roth + 401k\" account holding both is worth splitting in two so each half is counted properly.")), React.createElement("div", {
      className: "capline"
    }, React.createElement(NumField, {
      cls: "ramt",
      label: "Cap at",
      prefix: "$",
      value: a.cap == null ? "" : a.cap,
      onChange: v => upAcct(a.id, "cap", v)
    }), capOn && React.createElement(React.Fragment, null, React.createElement("div", {
      className: "field",
      style: {
        flex: 1,
        minWidth: 130
      }
    }, React.createElement("label", null, "Sweep the excess to"), React.createElement("select", {
      value: a.spillTo || "",
      onChange: e => upAcct(a.id, "spillTo", e.target.value),
      "aria-label": "Sweep destination"
    }, React.createElement("option", {
      value: ""
    }, "\u2014 nowhere (just piles up) \u2014"), D.loans.length > 0 && React.createElement("optgroup", {
      label: "Loans"
    }, D.loans.map(l => React.createElement("option", {
      key: l.id,
      value: l.id
    }, l.name))), D.cards.length > 0 && React.createElement("optgroup", {
      label: "Credit cards"
    }, D.cards.map(c => React.createElement("option", {
      key: c.id,
      value: c.id
    }, c.name))), React.createElement("optgroup", {
      label: "Accounts"
    }, accounts.filter(x => x.id !== a.id).map(x => React.createElement("option", {
      key: x.id,
      value: x.id
    }, x.name))))), React.createElement(Seg, {
      value: a.spillEvery === "weekly" ? "weekly" : "monthly",
      options: [{
        v: "monthly",
        label: "Monthly"
      }, {
        v: "weekly",
        label: "Weekly"
      }],
      onChange: v => upAcct(a.id, "spillEvery", v)
    })), capOn && a.spillTo ? React.createElement("div", {
      className: "caphint" + (tight ? " warn-txt" : "")
    }, "Anything over ", fmtMoney(n0(a.cap)), " moves to ", dest, " at each ", a.spillEvery === "weekly" ? "week" : "month", " end.", D.loans.some(l => l.id === a.spillTo) ? ` Once ${dest} is paid off it rolls to your highest-rate remaining loan, then to ${(accounts.find(x => x.id === settings.overflowTo) || defaultOverflow || {}).name || "investments"} when every loan is clear.` : "", tight ? ` A heavy month draws about ${fmtMoney(need)} from here — a cap below that will overdraw it.` : ` Its heaviest month draws about ${fmtMoney(need)}, so the buffer holds.`) : capOn ? React.createElement("div", {
      className: "caphint"
    }, "Pick a destination or the cap does nothing.") : React.createElement("div", {
      className: "caphint"
    }, "Leave blank for no cap. Set one to stop cash idling here \u2014 the excess gets swept somewhere it earns or saves you more.")));
  }), React.createElement("button", {
    className: "btn btn-add",
    onClick: addAcct
  }, React.createElement(Plus, {
    size: 15
  }), "Add an account"), React.createElement("div", {
    className: "assume"
  }, "Debts are accounts too \u2014 they live in the Debt tab. All money movement between them is set up in Cash flow.", D.capped.length > 0 && D.avgSweep > 0 && React.createElement(React.Fragment, null, " Your caps are moving about ", React.createElement("b", {
    style: {
      color: "var(--amber)"
    }
  }, fmtMoney(D.avgSweep), "/mo"), " out of idle cash on average over the next three years."))), React.createElement("div", {
    className: "panel rise"
  }, React.createElement("div", {
    className: "phead"
  }, React.createElement("div", {
    className: "ptitle"
  }, "Asset mix")), React.createElement(Donut, {
    data: D.alloc,
    center: fmtBig(D.totalAssets),
    sub: "assets"
  })));
}