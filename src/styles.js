// The app's entire stylesheet, scoped under .fin. Pure data — injected via a <style>
// tag by FinancialSimulator so this stays a single-file drop-in, no separate CSS load.
/* The light palette, written once and interpolated into the three places that need it:
   an explicit choice, the OS preference while the choice is "auto", and print — which is
   always on paper and so is always light. Dark stays on `.fin` itself as the base, so
   `data-theme="dark"` needs no block of its own and the default look is untouched.

   Light is not the dark palette on a white card. #F5A623 on white is a contrast failure,
   so every series hue is darkened here — which is the whole reason the chart palettes had
   to stop being hex literals in format.js and become tokens. */
const LIGHT = `
  --bg:#F6F8FB; --panel:#FFFFFF; --panel2:#F1F5F9; --panel3:#EAF0F6;
  --line:rgba(43,66,88,0.13); --line2:rgba(43,66,88,0.26);
  --text:#16222F; --muted:#4B5F73; --faint:#63768A;
  --dots:rgba(43,66,88,0.055);
  --amber:#A26709; --amber-soft:rgba(162,103,9,0.12); --amber-deep:#6E4405; --on-amber:#FFF6E6;
  --cyan:#0E7C8C; --green:#1B8150; --red:#C0392B; --violet:#7A4FB0;
  --gold:#8F7110; --blue:#2E6DA8; --teal:#0F7F72; --pink:#A64A76; --slate:#5A6B7C;
  --clay:#A65531; --sky:#3D74B8; --lilac:#8B5FA8;
  --red2:#B24A3E; --red3:#9E4033; --red4:#C25443;
  --bar-pos:rgba(122,79,176,0.34); --bar-neg:rgba(192,57,43,0.34);
  --cursor-fill:rgba(43,66,88,0.07);
  --band-edge:rgba(27,129,80,0.12); --band-core:rgba(27,129,80,0.26);
  --donut-empty:#DCE4EC;
  --amber-line:rgba(162,103,9,.36); --green-soft:rgba(27,129,80,.11); --green-line:rgba(27,129,80,.34);
  --red-soft:rgba(192,57,43,.08); --red-line:rgba(192,57,43,.32);
  --violet-soft:rgba(122,79,176,.11); --violet-line:rgba(122,79,176,.30);
  --cyan-soft:rgba(14,124,140,.10); --cyan-line:rgba(14,124,140,.28);
  --slate-soft:rgba(43,66,88,.07); --scrim:rgba(22,34,47,.40);
  --shadow:rgba(22,34,47,.13); --shadow-lg:rgba(22,34,47,.17);
  color-scheme:light;
`;

export const CSS = `
.fin{
  --bg:#0C131C; --panel:#111B27; --panel2:#16222F; --panel3:#0A121B;
  --line:rgba(126,148,171,0.14); --line2:rgba(126,148,171,0.26);
  --text:#E9EFF5; --muted:#8496A8; --faint:#73879B;
  --dots:rgba(126,148,171,0.05);
  --amber:#F5A623; --amber-soft:rgba(245,166,35,0.13); --amber-deep:#B5760F; --on-amber:#1A1206;
  --cyan:#38BDD0; --green:#5CCB8B; --red:#E8695B; --violet:#B98CE8;
  /* the rest of the series palette — named hues, not roles, because a chart line's colour
     means nothing beyond "not the one next to it" */
  --gold:#E8B84B; --blue:#5B9BD5; --teal:#4FC3B0; --pink:#D98BB0; --slate:#8A9AAB;
  --clay:#E0885B; --sky:#7FB2E8; --lilac:#C9A0DC;
  --red2:#D9776B; --red3:#C86A5E; --red4:#E88070;
  --bar-pos:rgba(185,140,232,0.42); --bar-neg:rgba(232,105,91,0.5);
  --cursor-fill:rgba(126,148,171,0.06);
  --band-edge:rgba(92,203,139,0.10); --band-core:rgba(92,203,139,0.22);
  --donut-empty:#1B2735;
  /* tints of the hues above, used as soft backgrounds and hairline borders. They're tokens
     rather than inline rgba() because an rgba built from the dark hue is the wrong colour
     once the palette moves — a 45%-opacity bright amber border is invisible on white. */
  --amber-line:rgba(245,166,35,.34); --green-soft:rgba(92,203,139,.13); --green-line:rgba(92,203,139,.32);
  --red-soft:rgba(232,105,91,.09); --red-line:rgba(232,105,91,.32);
  --violet-soft:rgba(185,140,232,.13); --violet-line:rgba(185,140,232,.32);
  --cyan-soft:rgba(56,189,208,.10); --cyan-line:rgba(56,189,208,.28);
  --slate-soft:rgba(126,148,171,.10); --scrim:rgba(6,10,16,.74);
  --shadow:rgba(0,0,0,.45); --shadow-lg:rgba(0,0,0,.5);
  --mono:ui-monospace,'SF Mono','JetBrains Mono','Cascadia Code',Menlo,Consolas,monospace;
  --sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  color-scheme:dark;
  font-family:var(--sans); color:var(--text); background:var(--bg);
  background-image:radial-gradient(var(--dots) 1px,transparent 1px);
  background-size:22px 22px; min-height:100vh; padding:22px 16px 64px; box-sizing:border-box; -webkit-font-smoothing:antialiased;
}
.fin[data-theme="light"]{${LIGHT}}
@media(prefers-color-scheme:light){.fin[data-theme="auto"]{${LIGHT}}}
.fin *{box-sizing:border-box;}
/* controls inherit the theme rather than being pinned dark — :where() keeps this a
   zero-specificity safety net */
.fin :where(input:not([type=range]):not([type=checkbox]), select, textarea){
  background:var(--bg); color:var(--text); font-family:var(--mono);}
.fin .wrap{max-width:1060px;margin:0 auto;}
.fin .mono{font-family:var(--mono);font-variant-numeric:tabular-nums;}
.fin .eyebrow{font-family:var(--mono);text-transform:uppercase;letter-spacing:.16em;font-size:11px;color:var(--faint);}
/* Stacked on a phone, side by side from tablet up. As a row at every width the toolbar
   competes with the headline for a ~390px line, and the figure gets squeezed until it wraps
   — which it can only do in one place, after the minus sign, leaving a lone dash above the
   number. WebKit takes that break opportunity and Blink doesn't, which is why it only shows
   up on a phone. Stacking gives the figure the full width; nwbig then refuses to break at
   all, so no browser can find somewhere else to try. */
.fin .topbar{display:flex;flex-direction:column;align-items:stretch;gap:12px;margin-bottom:16px;}
@media(min-width:680px){.fin .topbar{flex-direction:row;align-items:flex-start;justify-content:space-between;gap:16px;}}
.fin .nwbig{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:clamp(34px,9vw,52px);line-height:.96;font-weight:600;letter-spacing:-0.03em;margin-top:5px;white-space:nowrap;}
.fin .nwsub{font-family:var(--mono);font-size:12px;color:var(--faint);margin-top:8px;}
.fin .nwsub b{color:var(--muted);font-weight:600;}
.fin .toolbar{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-start;}
@media(min-width:680px){.fin .toolbar{justify-content:flex-end;}}
/* Below the breakpoint the buttons are their icons alone. The label isn't removed — it's
   visually hidden, so it still names the button for a screen reader, still answers a
   getByRole locator, and still shows in the tooltip. Twelve labelled buttons take six rows
   and most of a phone screen before any of your money is visible; twelve icons take two.
   The checks badge keeps its count, which is the one number that has to stay readable. */
.fin .tbtn .tl{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}
.fin .tbtn{position:relative;}
@media(min-width:680px){.fin .tbtn .tl{position:static;width:auto;height:auto;margin:0;overflow:visible;clip:auto;}}
.fin .tbtn{display:inline-flex;align-items:center;gap:6px;font-family:var(--sans);font-size:12px;font-weight:600;color:var(--muted);background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px 11px;cursor:pointer;transition:color .15s,border-color .15s;}
.fin .tbtn:hover{color:var(--text);border-color:var(--faint);}
.fin .tbtn.icon-only{padding:8px 9px;}
.fin .tabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:18px;padding-bottom:4px;scrollbar-width:none;-ms-overflow-style:none;}
.fin .tabs::-webkit-scrollbar{display:none;}
.fin .tabbtn{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;flex:none;font-family:var(--sans);font-size:13px;font-weight:600;color:var(--muted);background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:9px 14px;cursor:pointer;transition:color .15s,border-color .15s,background .15s;}
.fin .tabbtn:hover{color:var(--text);}
.fin .tabbtn.active{color:var(--on-amber);background:var(--amber);border-color:var(--amber);}
.fin .panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px;margin-bottom:16px;}
.fin .phead{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px;flex-wrap:wrap;}
.fin .ptitle{font-size:12.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:600;}
.fin .psub{font-family:var(--mono);font-size:11px;color:var(--faint);}
.fin .sgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
@media(min-width:680px){.fin .sgrid{grid-template-columns:repeat(4,1fr);}}
.fin .askrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.fin .timeline{display:flex;flex-direction:column;}
.fin .tl-row{display:flex;align-items:flex-start;gap:10px;padding:7px 0;font-size:12.5px;}
.fin .tl-date{color:var(--faint);font-size:11px;width:74px;flex:none;padding-top:1px;}
.fin .tl-dot{width:7px;height:7px;border-radius:50%;background:var(--line2);flex:none;margin-top:5px;position:relative;}
.fin .tl-dot::after{content:"";position:absolute;left:3px;top:12px;width:1px;height:22px;background:var(--line);}
.fin .tl-row:last-child .tl-dot::after{display:none;}
.fin .tl-body{color:var(--text);line-height:1.5;}
.fin .tl-detail{color:var(--faint);}
.fin .tl-debtFree .tl-dot,.fin .tl-fi .tl-dot{background:var(--amber);}
.fin .tl-networth .tl-dot{background:var(--green);}
.fin .tl-cap .tl-dot{background:var(--red);}
.fin .tornado{display:flex;flex-direction:column;gap:6px;margin:10px 0;}
.fin .tor-row{display:flex;align-items:center;gap:10px;font-size:12px;}
.fin .tor-label{flex:1;min-width:130px;color:var(--muted);}
.fin .tor-track{flex:2;min-width:120px;height:12px;background:var(--bg);border-radius:3px;position:relative;display:flex;}
.fin .tor-track::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:1px;background:var(--line2);}
.fin .tor-bar{height:100%;border-radius:2px;}
.fin .tor-val{width:58px;text-align:right;color:var(--faint);font-size:11px;flex:none;}
.fin .recalc{color:var(--faint);opacity:.85;animation:pulse 1.1s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:.35;}50%{opacity:.9;}}
@media(prefers-reduced-motion:reduce){.fin .recalc{animation:none;}}
@media(min-width:680px){.fin .sgrid.wide5{grid-template-columns:repeat(3,1fr);}}
@media(min-width:900px){.fin .sgrid.wide5{grid-template-columns:repeat(5,1fr);}}
.fin .stat{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:13px 15px;}
.fin .stat .k{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--faint);margin-bottom:8px;line-height:1.35;min-height:26px;}
.fin .stat .v{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:20px;font-weight:600;letter-spacing:-0.01em;}
.fin .v.green{color:var(--green);} .fin .v.amber{color:var(--amber);} .fin .v.red{color:var(--red);} .fin .v.cyan{color:var(--cyan);}
.fin .legend{display:flex;gap:12px;align-items:center;flex-wrap:wrap;}
.fin .lg{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;}
.fin .swatch{width:14px;height:0;border-top-width:2px;border-top-style:solid;border-radius:2px;}
.fin .dot{width:9px;height:9px;border-radius:50%;flex:none;}
.fin .scope-wrap{margin:2px -4px 0;touch-action:pan-y;cursor:grab;user-select:none;}
.fin .scope-wrap:active{cursor:grabbing;}
.fin .zhint{font-family:var(--mono);font-size:10px;color:var(--faint);text-align:right;margin-top:6px;opacity:.75;}
.fin .tt{background:var(--panel3);border:1px solid var(--line2);border-radius:10px;padding:10px 12px;font-family:var(--mono);box-shadow:0 8px 24px var(--shadow);max-width:230px;}
.fin .tt .tt-m{font-size:10px;color:var(--faint);text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;}
.fin .tt-row{display:flex;align-items:center;gap:8px;font-size:12px;margin-top:3px;color:var(--text);}
.fin .tt-row b{margin-left:auto;font-weight:600;}
.fin .field label{display:block;font-family:var(--mono);font-size:9.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--faint);margin-bottom:5px;}
.fin .inp{display:flex;align-items:center;background:var(--bg);border:1px solid var(--line2);border-radius:9px;padding:7px 9px;transition:border-color .15s;}
.fin .inp:focus-within{border-color:var(--amber);}
.fin .inp .u{color:var(--faint);font-family:var(--mono);font-size:13px;}
.fin .inp input{width:100%;background:transparent;border:none;color:var(--text);font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:14.5px;outline:none;min-width:0;-moz-appearance:textfield;}
.fin input[type=number]::-webkit-outer-spin-button,.fin input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.fin .row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:11px 13px;margin-bottom:9px;}
.fin .rname{flex:1;background:transparent;border:none;border-bottom:1px solid transparent;color:var(--text);font-size:14.5px;font-weight:600;font-family:var(--sans);padding:2px 0;outline:none;min-width:0;}
.fin .rname:focus{border-bottom-color:var(--line2);}
.fin .ramt{width:104px;flex:none;}
.fin .rrate{width:70px;flex:none;}
.fin .row.acct{flex-direction:column;align-items:stretch;gap:11px;}
.fin .acct-top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.fin .acct-fields{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;}
.fin select{border:1px solid var(--line2);border-radius:8px;color:var(--muted);font-size:11.5px;padding:7px 8px;outline:none;max-width:100%;}
.fin select:focus{border-color:var(--amber);}
.fin .acct-fields select{flex:1;height:34px;align-self:flex-end;}
.fin .capline{display:flex;align-items:flex-end;gap:9px;flex-wrap:wrap;padding-top:11px;border-top:1px solid var(--line);}
.fin .capline .field{flex:none;}
.fin .capline select{flex:1;min-width:130px;height:34px;align-self:flex-end;}
.fin .caphint{font-family:var(--mono);font-size:10.5px;color:var(--faint);width:100%;line-height:1.55;overflow-wrap:anywhere;}
.fin .caphint.warn-txt{color:var(--red);}
.fin .icon-btn{background:transparent;border:none;color:var(--faint);cursor:pointer;padding:5px;border-radius:7px;display:inline-flex;transition:color .15s,background .15s;flex:none;}
.fin .icon-btn:hover{color:var(--red);background:var(--red-soft);}
.fin .loan{background:var(--panel2);border:1px solid var(--line);border-radius:13px;padding:14px;margin-bottom:12px;}
.fin .loan.done{opacity:.6;}
.fin .loan-top{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;}
.fin .rank{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--amber);background:var(--amber-soft);border:1px solid var(--amber-line);border-radius:7px;padding:3px 8px;flex:none;}
.fin .rank.paid{color:var(--green);background:var(--green-soft);border-color:var(--green-line);}
.fin .fields3{display:grid;grid-template-columns:1fr;gap:10px;}
@media(min-width:560px){.fin .fields3{grid-template-columns:1.3fr .8fr 1fr;}}
.fin .loan-foot{display:flex;align-items:center;justify-content:space-between;margin-top:12px;font-family:var(--mono);font-size:11.5px;color:var(--faint);gap:10px;flex-wrap:wrap;}
.fin .payoff-badge b{color:var(--amber);font-weight:600;} .fin .payoff-badge.paid b{color:var(--green);}
.fin .num-box{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0;background:var(--panel2);border:1px solid var(--line2);border-radius:10px;padding:8px 12px;}
.fin .num-box.sm{padding:6px 10px;}
.fin .num-box .pfx{color:var(--faint);font-family:var(--mono);font-size:13px;}
.fin .num-input{width:92px;background:transparent;border:none;color:var(--amber);font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:19px;font-weight:600;outline:none;}
.fin .num-box.sm .num-input{font-size:15px;width:66px;}
.fin .budget{font-family:var(--mono);font-size:12px;color:var(--faint);margin-top:12px;}
.fin .budget b{color:var(--text);font-weight:600;}
.fin .donut-wrap{position:relative;}
.fin .donut-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;}
.fin .dc-v{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:19px;font-weight:600;color:var(--text);}
.fin .dc-s{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);margin-top:3px;}
.fin .dlegend{display:flex;flex-direction:column;gap:8px;}
.fin .dl-row{display:flex;align-items:center;gap:9px;font-family:var(--mono);font-size:12.5px;}
.fin .dl-row .nm{color:var(--muted);flex:1;}
.fin .dl-row .vl{color:var(--text);font-weight:600;} .fin .dl-row .pc{color:var(--faint);width:42px;text-align:right;}
.fin .split{display:grid;grid-template-columns:1fr;gap:16px;align-items:center;}
@media(min-width:620px){.fin .split{grid-template-columns:200px 1fr;}}
.fin .catrow{margin-bottom:11px;}
.fin .cattop{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;font-family:var(--mono);font-size:12.5px;}
.fin .cattop .cn{color:var(--muted);} .fin .cattop .cv{color:var(--text);font-weight:600;} .fin .cattop .cp{color:var(--faint);font-size:11px;margin-left:8px;}
.fin .catbar{height:8px;background:var(--bg);border-radius:20px;overflow:hidden;}
.fin .catfill{height:100%;border-radius:20px;transition:width .4s ease;}
.fin .flowbar{display:flex;height:26px;border-radius:8px;overflow:hidden;margin:4px 0 12px;border:1px solid var(--line);}
.fin .flowseg{height:100%;}
.fin .flowkey{display:flex;flex-wrap:wrap;gap:14px;}
.fin .fk{display:flex;align-items:center;gap:7px;font-family:var(--mono);font-size:12px;color:var(--muted);}
.fin .fk b{color:var(--text);font-weight:600;}
.fin .prog-nums{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;}
.fin .prog-pct{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:30px;font-weight:600;color:var(--amber);letter-spacing:-0.02em;}
.fin .prog-rem{font-family:var(--mono);font-size:12px;color:var(--faint);text-align:right;}
.fin .prog-rem b{color:var(--text);font-weight:600;}
.fin .track{height:10px;background:var(--bg);border:1px solid var(--line);border-radius:20px;overflow:hidden;}
.fin .fill{height:100%;background:linear-gradient(90deg,var(--amber-deep),var(--amber));border-radius:20px;transition:width .5s ease;}
.fin .btn{display:inline-flex;align-items:center;gap:7px;font-family:var(--sans);font-size:13px;font-weight:600;border-radius:10px;padding:9px 14px;cursor:pointer;border:1px solid transparent;transition:filter .15s,background .15s;}
.fin .btn-amber{background:var(--amber);color:var(--on-amber);} .fin .btn-amber:hover{filter:brightness(1.08);}
.fin .btn-ghost{background:transparent;border-color:var(--line2);color:var(--muted);} .fin .btn-ghost:hover{color:var(--text);border-color:var(--faint);}
.fin .btn-add{width:100%;justify-content:center;background:transparent;border:1px dashed var(--line2);color:var(--muted);padding:11px;}
.fin .btn-add:hover{border-color:var(--amber);color:var(--amber);}
.fin .empty{font-family:var(--mono);font-size:12px;color:var(--faint);text-align:center;padding:18px 0;line-height:1.6;}
.fin .warn{display:flex;gap:12px;align-items:flex-start;background:var(--red-soft);border:1px solid var(--red-line);border-radius:12px;padding:14px 16px;margin-bottom:16px;}
.fin .warn .wt{font-size:13px;font-weight:600;color:var(--red);margin-bottom:3px;}
.fin .warn .wb{font-size:12.5px;color:var(--muted);line-height:1.5;}
.fin .tbtn.on{color:var(--amber);border-color:var(--amber-line);background:var(--amber-soft);}
.fin .panel.help{border-color:var(--amber-line);}
.fin .help .phead{margin-bottom:10px;}
.fin .help .ptitle{color:var(--amber);text-transform:none;letter-spacing:.02em;font-size:13px;}
.fin .help-intro{font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:14px;}
.fin .help-list{margin:0;display:grid;grid-template-columns:1fr;gap:11px;}
@media(min-width:780px){.fin .help-list{grid-template-columns:1fr 1fr;gap:11px 18px;}}
.fin .help-item{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:11px 13px;}
.fin .help-item dt{font-size:12.5px;font-weight:600;color:var(--text);margin-bottom:4px;}
.fin .help-item dd{margin:0;font-size:12.5px;color:var(--muted);line-height:1.6;}
.fin .help-foot{font-family:var(--mono);font-size:10.5px;color:var(--faint);margin-top:12px;}
.fin .notice{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:11.5px;color:var(--faint);margin-bottom:14px;background:var(--amber-soft);border:1px solid var(--amber-line);border-radius:10px;padding:9px 12px;}
.fin .notice button{margin-left:auto;background:none;border:none;color:var(--faint);cursor:pointer;font-size:15px;line-height:1;padding:2px 6px;}
.fin .notice button:hover{color:var(--text);}
.fin .notice.offer{background:var(--cyan-soft);border-color:var(--cyan-line);color:var(--muted);flex-wrap:wrap;}
.fin .notice.offer span{flex:1;min-width:200px;}
.fin .notice.offer .btn{margin-left:0;padding:7px 12px;font-size:12px;}
.fin .csvlist{display:flex;flex-direction:column;gap:6px;max-height:300px;overflow:auto;margin-top:10px;padding-right:2px;}
.fin .csvrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:8px 10px;opacity:.55;}
.fin .csvrow.on{opacity:1;border-color:var(--line2);}
.fin .csvrow .csvname{font-size:12.5px;font-weight:600;color:var(--text);max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.fin .csvrow select{max-width:132px;}
.fin .csvrow .num-box{flex:none;}
.fin .badge.lvl-high{color:var(--green);background:var(--green-soft);border-color:var(--green-line);}
.fin .badge.lvl-medium{color:var(--amber);background:var(--amber-soft);border-color:var(--amber-line);}
.fin .badge.lvl-low{color:var(--faint);background:var(--slate-soft);border-color:var(--line2);}
/* visually hidden, but read aloud — captions and chart summaries live here */
.fin .scope-wrap:focus-visible{outline:2px solid var(--amber);outline-offset:4px;border-radius:10px;}
.fin .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}
.fin .datawrap{max-height:52vh;overflow:auto;margin-top:12px;border:1px solid var(--line);border-radius:10px;}
.fin .datatable{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:11.5px;}
.fin .datatable th,.fin .datatable td{padding:6px 10px;border-bottom:1px solid var(--line);text-align:left;font-weight:400;}
.fin .datatable thead th{position:sticky;top:0;background:var(--panel);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);font-weight:600;border-bottom:1px solid var(--line2);}
.fin .datatable tbody th{color:var(--muted);white-space:nowrap;}
.fin .datatable .num{text-align:right;font-variant-numeric:tabular-nums;}
.fin .datatable tbody tr:hover{background:var(--panel2);}
.fin .warn.soft{background:var(--amber-soft);border-color:var(--amber-line);}
.fin .warn .btn{margin-left:auto;flex:none;align-self:center;padding:6px 11px;font-size:11.5px;}
.fin .linkish{background:none;border:none;padding:0;font-family:var(--mono);font-size:11px;color:var(--amber);cursor:pointer;text-decoration:underline;text-underline-offset:3px;}
.fin .linkish:hover{color:var(--text);}
.fin .rowchecks{display:flex;flex-direction:column;gap:5px;margin-top:9px;width:100%;}
.fin .rowcheck{display:flex;gap:7px;align-items:flex-start;font-family:var(--mono);font-size:10.5px;line-height:1.6;color:var(--amber);background:var(--amber-soft);border:1px solid var(--amber-line);border-radius:8px;padding:6px 9px;}
.fin .rowcheck.error{color:var(--red);background:var(--red-soft);border-color:var(--red-line);}
.fin .rowcheck svg{flex:none;margin-top:2px;}
.fin .rowcheck b{font-weight:600;}
.fin .rowcheck i{font-style:normal;color:var(--faint);}
.fin .tbtn.checks{color:var(--amber);border-color:var(--amber-line);background:var(--amber-soft);font-variant-numeric:tabular-nums;}
.fin .tbtn.checks.bad{color:var(--red);border-color:var(--red-line);background:var(--red-soft);}
.fin .checklist{display:flex;flex-direction:column;gap:9px;margin-top:12px;}
.fin .checkrow{border:1px solid var(--line);border-left:3px solid var(--amber);border-radius:10px;padding:11px 13px;background:var(--panel2);}
.fin .checkrow.error{border-left-color:var(--red);}
.fin .checkrow .ct{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.fin .checkrow .clevel{font-family:var(--mono);font-size:9px;letter-spacing:.11em;text-transform:uppercase;color:var(--amber);flex:none;}
.fin .checkrow.error .clevel{color:var(--red);}
.fin .checkrow .ctitle{font-size:13px;font-weight:600;flex:1;min-width:180px;}
.fin .checkrow .ct .btn{padding:5px 10px;font-size:11.5px;flex:none;}
.fin .checkrow .cd{font-size:12.5px;color:var(--muted);line-height:1.6;margin-top:6px;}
.fin .checkrow .cf{font-family:var(--mono);font-size:11px;color:var(--faint);margin-top:6px;}
/* the row a finding pointed at, once "take me there" has landed on its tab */
.fin [data-row].flagged{outline:2px solid var(--amber);outline-offset:3px;border-radius:12px;}
.fin [data-row].flagged.bad{outline-color:var(--red);}

/* ---- the print summary sheet ---------------------------------------------------- */
/* It lives on screen inside the preview modal and on paper as the only thing on the page,
   so it's sized in a fixed 720px column either way rather than filling its container. */
.fin .printsheet{width:720px;max-width:100%;margin:0 auto;color:var(--text);font-size:12px;}
.fin .pr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:2px solid var(--line2);padding-bottom:8px;margin-bottom:11px;}
.fin .pr-title{font-size:19px;font-weight:700;letter-spacing:-0.01em;}
.fin .pr-sub{font-family:var(--mono);font-size:10.5px;color:var(--faint);margin-top:4px;}
.fin .pr-nw{text-align:right;font-family:var(--mono);}
.fin .pr-nw span{display:block;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint);}
.fin .pr-nw b{font-size:24px;font-variant-numeric:tabular-nums;letter-spacing:-0.02em;}
.fin .pr-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;margin-bottom:13px;}
.fin .pr-stats div{border:1px solid var(--line);border-radius:8px;padding:6px 8px;}
.fin .pr-stats span{display:block;font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);margin-bottom:3px;}
.fin .pr-stats b{font-family:var(--mono);font-size:13px;font-variant-numeric:tabular-nums;}
.fin .pr-block{margin-bottom:12px;break-inside:avoid;page-break-inside:avoid;}
.fin .pr-block h3{font-size:10px;font-family:var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--faint);margin:0 0 8px;font-weight:600;}
.fin .pr-cols{display:grid;grid-template-columns:1fr 1fr;gap:22px;}
.fin .pr-row{display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px solid var(--line);font-family:var(--mono);font-size:11.5px;}
.fin .pr-k{color:var(--muted);} .fin .pr-v{font-variant-numeric:tabular-nums;} .fin .pr-v em{color:var(--faint);font-style:normal;font-size:10px;}
.fin .pr-table{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:11px;}
.fin .pr-table th{text-align:left;font-weight:600;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);border-bottom:1px solid var(--line2);padding:0 8px 4px 0;}
.fin .pr-table td{padding:3px 8px 3px 0;border-bottom:1px solid var(--line);vertical-align:top;}
.fin .pr-table td.num,.fin .pr-table th.num{text-align:right;font-variant-numeric:tabular-nums;}
.fin .pr-table em{color:var(--faint);font-style:normal;}
.fin .pr-table .when{width:84px;white-space:nowrap;color:var(--muted);}
.fin .pr-legend{display:flex;gap:14px;flex-wrap:wrap;font-family:var(--mono);font-size:9.5px;color:var(--faint);margin-top:6px;}
.fin .pr-legend i{display:inline-block;width:14px;height:0;border-top:2px solid var(--faint);vertical-align:3px;margin-right:5px;}
.fin .pr-legend i.s-nw{border-color:var(--amber);} .fin .pr-legend i.s-inv{border-top-style:dashed;border-color:var(--green);}
.fin .pr-legend i.s-debt{border-top-style:dotted;border-color:var(--red);} .fin .pr-legend i.s-fi{border-top-style:dashed;border-color:var(--amber);}
.fin .pr-more{font-family:var(--mono);font-size:9.5px;color:var(--faint);padding-top:4px;}
.fin .pr-foot{font-family:var(--mono);font-size:9.5px;line-height:1.7;color:var(--faint);border-top:1px solid var(--line2);padding-top:9px;margin-top:4px;}
.fin .modal-card.wide{width:min(820px,96vw);}

.fin .modal{position:fixed;inset:0;background:var(--scrim);display:flex;align-items:center;justify-content:center;z-index:60;padding:18px;}
.fin .modal-card{background:var(--panel);border:1px solid var(--line2);border-radius:16px;padding:20px;width:min(580px,94vw);max-height:88vh;overflow:auto;}
.fin .modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.fin .modal-head span{font-size:14px;font-weight:600;}
.fin .jsonbox{width:100%;height:180px;background:var(--panel3);border:1px solid var(--line2);border-radius:10px;color:var(--muted);font-size:11px;padding:11px;outline:none;resize:vertical;line-height:1.5;}
.fin .modal-row{display:flex;gap:9px;margin-top:12px;flex-wrap:wrap;align-items:center;}
.fin .filebtn{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--muted);background:transparent;border:1px dashed var(--line2);border-radius:10px;padding:10px 14px;cursor:pointer;}
.fin .filebtn:hover{border-color:var(--amber);color:var(--amber);}
.fin .mnote{font-family:var(--mono);font-size:11px;color:var(--faint);line-height:1.6;margin:6px 0 2px;}
.fin input[type=date],.fin input[type=text],.fin input[type=number]{border:1px solid var(--line2);border-radius:9px;font-size:12.5px;padding:8px 9px;outline:none;}
.fin input[type=date]:focus,.fin input[type=text]:focus,.fin input[type=number]:focus{border-color:var(--amber);}
.fin .inp input[type=number],.fin .num-box .num-input,.fin .pctbox input[type=number]{border:none;padding:0;background:transparent;}
.fin .seg{display:inline-flex;background:var(--bg);border:1px solid var(--line2);border-radius:9px;overflow:hidden;flex:none;}
.fin .seg button{background:transparent;border:none;color:var(--faint);font-family:var(--mono);font-size:11.5px;padding:7px 11px;cursor:pointer;transition:background .15s,color .15s;}
.fin .seg button.on{color:var(--on-amber);background:var(--amber);}
.fin .card{background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px;}
.fin .card-r1{display:flex;align-items:center;gap:9px;margin-bottom:10px;flex-wrap:wrap;}
.fin .card-r2{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
.fin .cap{font-family:var(--mono);font-size:11px;color:var(--faint);min-width:0;overflow-wrap:anywhere;}
.fin .dist{margin-top:11px;padding-top:11px;border-top:1px solid var(--line);}
.fin .dist-lbl{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--faint);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;}
.fin .dist-row{display:flex;align-items:center;gap:7px;margin-bottom:7px;flex-wrap:wrap;}
.fin .dist-row select{flex:1;min-width:0;}
.fin .pctbox{display:flex;align-items:center;background:var(--bg);border:1px solid var(--line2);border-radius:8px;padding:5px 8px;width:74px;flex:none;}
.fin .pctbox input{width:100%;background:transparent;color:var(--text);font-size:13px;outline:none;text-align:right;-moz-appearance:textfield;}
.fin .pctbox .u{color:var(--faint);font-family:var(--mono);font-size:12px;margin-left:3px;}
.fin .remain{font-family:var(--mono);font-size:12px;color:var(--green);font-weight:600;flex:none;width:74px;text-align:right;}
.fin .dist-add{background:transparent;border:1px dashed var(--line2);color:var(--muted);border-radius:8px;padding:7px;font-size:12px;cursor:pointer;width:100%;font-family:var(--sans);font-weight:600;}
.fin .dist-add:hover{border-color:var(--amber);color:var(--amber);}
.fin .arrow{color:var(--faint);display:inline-flex;padding:0 1px;}
.fin .chk{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;cursor:pointer;user-select:none;font-family:var(--mono);font-size:11px;color:var(--muted);}
.fin .chk input{width:15px;height:15px;accent-color:var(--amber);cursor:pointer;}
.fin .switch{display:flex;align-items:center;gap:11px;cursor:pointer;user-select:none;margin-top:14px;}
.fin .switch input{position:absolute;opacity:0;width:0;height:0;}
.fin .swtrack{width:40px;height:22px;background:var(--panel2);border:1px solid var(--line2);border-radius:20px;position:relative;transition:background .15s,border-color .15s;flex:none;}
.fin .swknob{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--faint);transition:transform .15s,background .15s;}
.fin .switch input:checked+.swtrack{background:var(--amber-soft);border-color:var(--amber);}
.fin .switch input:checked+.swtrack .swknob{transform:translateX(18px);background:var(--amber);}
.fin .sw-label{font-size:13px;color:var(--muted);}
.fin .assume{font-family:var(--mono);font-size:10.5px;color:var(--faint);line-height:1.6;margin-top:8px;}
.fin .hypo{margin-top:12px;padding-top:12px;border-top:1px solid var(--line);}
.fin .hypo .switch{margin-top:0;}
.fin .endwrap{display:inline-flex;align-items:center;gap:6px;}
.fin .endwrap .cap{white-space:nowrap;}
.fin .endwrap input[type=date]{font-size:11.5px;padding:6px 8px;}
.fin .endwrap.off input[type=date]{opacity:.45;}
.fin .cardrow{display:flex;align-items:center;gap:9px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:11px 13px;margin-bottom:9px;flex-wrap:wrap;}
.fin .cardbal{font-family:var(--mono);font-size:12px;color:var(--faint);width:100%;display:flex;justify-content:space-between;gap:10px;padding-top:4px;border-top:1px solid var(--line);margin-top:2px;}
.fin .cardbal b{color:var(--violet);font-weight:600;}
.fin .badge{font-family:var(--mono);font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--violet);
  background:var(--violet-soft);border:1px solid var(--violet-line);border-radius:6px;padding:2px 6px;flex:none;}
.fin .toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:90;display:flex;align-items:center;gap:9px;
  background:var(--panel3);border:1px solid var(--line2);border-radius:11px;padding:11px 16px;font-family:var(--mono);font-size:12.5px;
  color:var(--text);box-shadow:0 10px 30px var(--shadow-lg);animation:toastIn .22s cubic-bezier(.2,.7,.3,1) both;max-width:88vw;}
.fin .toast.err{border-color:var(--red-line);}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
@media(prefers-reduced-motion:reduce){.fin .toast{animation:none;}}
.fin .rise{animation:rise .45s cubic-bezier(.2,.7,.3,1) both;}
@keyframes rise{from{opacity:0;transform:translateY(9px);}to{opacity:1;transform:none;}}
.fin :focus-visible{outline:2px solid var(--amber);outline-offset:2px;}
@media(prefers-reduced-motion:reduce){.fin .rise{animation:none;}.fin .fill,.fin .catfill{transition:none;}}

/* ---- printing ------------------------------------------------------------------- */
/* Paper is always light, so print borrows the light palette outright rather than asking
   anyone to burn a cartridge on the dark one. Everything except the sheet is hidden — the
   toolbar, the tabs, the modal chrome the sheet is previewed inside, the toast. */
@media print{
  /* paper is the --panel token, which the light palette makes white — one fewer literal */
  .fin{${LIGHT} background:var(--panel); background-image:none; padding:0; min-height:0;}
  .fin .topbar, .fin .tabs, .fin .notice, .fin .toast, .fin .zhint{display:none !important;}
  .fin .rise{animation:none;}
  .fin *{box-shadow:none !important;}
  .fin .panel{break-inside:avoid;page-break-inside:avoid;}
  /* With the preview open, the sheet is the whole page: hide everything the tab was
     showing behind it, and strip the modal down to bare paper. Without it, a bare Cmd+P
     still prints the tab you're looking at, minus the chrome. */
  .fin[data-printing] .wrap > *:not(.modal){display:none !important;}
  .fin[data-printing] .modal{position:static;inset:auto;background:none;padding:0;display:block;z-index:auto;}
  .fin[data-printing] .modal-card{width:auto;max-width:none;max-height:none;overflow:visible;border:none;border-radius:0;padding:0;background:var(--panel);}
  .fin[data-printing] .modal-head, .fin[data-printing] .modal-row, .fin[data-printing] .mnote{display:none !important;}
  @page{margin:11mm;}
}
`;
