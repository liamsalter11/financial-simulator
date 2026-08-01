// The app's entire stylesheet, scoped under .fin. Pure data — injected via a <style>
// tag by FinancialSimulator so this stays a single-file drop-in, no separate CSS load.
export const CSS = `
.fin{
  --bg:#0C131C; --panel:#111B27; --panel2:#16222F; --panel3:#0A121B;
  --line:rgba(126,148,171,0.14); --line2:rgba(126,148,171,0.26);
  --text:#E9EFF5; --muted:#8496A8; --faint:#5E7183;
  --amber:#F5A623; --amber-soft:rgba(245,166,35,0.13);
  --cyan:#38BDD0; --green:#5CCB8B; --red:#E8695B; --violet:#B98CE8;
  --mono:ui-monospace,'SF Mono','JetBrains Mono','Cascadia Code',Menlo,Consolas,monospace;
  --sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  font-family:var(--sans); color:var(--text); background:var(--bg);
  background-image:radial-gradient(rgba(126,148,171,0.05) 1px,transparent 1px);
  background-size:22px 22px; min-height:100vh; padding:22px 16px 64px; box-sizing:border-box; -webkit-font-smoothing:antialiased;
}
.fin *{box-sizing:border-box;}
/* every control is dark by default — :where() keeps this a zero-specificity safety net */
.fin :where(input:not([type=range]):not([type=checkbox]), select, textarea){
  background:var(--bg); color:var(--text); font-family:var(--mono); color-scheme:dark;}
.fin .wrap{max-width:1060px;margin:0 auto;}
.fin .mono{font-family:var(--mono);font-variant-numeric:tabular-nums;}
.fin .eyebrow{font-family:var(--mono);text-transform:uppercase;letter-spacing:.16em;font-size:11px;color:var(--faint);}
.fin .topbar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px;}
.fin .nwbig{font-family:var(--mono);font-variant-numeric:tabular-nums;font-size:clamp(34px,9vw,52px);line-height:.96;font-weight:600;letter-spacing:-0.03em;margin-top:5px;}
.fin .nwsub{font-family:var(--mono);font-size:12px;color:var(--faint);margin-top:8px;}
.fin .nwsub b{color:var(--muted);font-weight:600;}
.fin .toolbar{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end;}
.fin .tbtn{display:inline-flex;align-items:center;gap:6px;font-family:var(--sans);font-size:12px;font-weight:600;color:var(--muted);background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px 11px;cursor:pointer;transition:color .15s,border-color .15s;}
.fin .tbtn:hover{color:var(--text);border-color:var(--faint);}
.fin .tabs{display:flex;gap:6px;overflow-x:auto;margin-bottom:18px;padding-bottom:4px;scrollbar-width:none;-ms-overflow-style:none;}
.fin .tabs::-webkit-scrollbar{display:none;}
.fin .tabbtn{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;flex:none;font-family:var(--sans);font-size:13px;font-weight:600;color:var(--muted);background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:9px 14px;cursor:pointer;transition:color .15s,border-color .15s,background .15s;}
.fin .tabbtn:hover{color:var(--text);}
.fin .tabbtn.active{color:#1A1206;background:var(--amber);border-color:var(--amber);}
.fin .panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px;margin-bottom:16px;}
.fin .phead{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px;flex-wrap:wrap;}
.fin .ptitle{font-size:12.5px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:600;}
.fin .psub{font-family:var(--mono);font-size:11px;color:var(--faint);}
.fin .sgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
@media(min-width:680px){.fin .sgrid{grid-template-columns:repeat(4,1fr);}}
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
.fin .tt{background:var(--panel3);border:1px solid var(--line2);border-radius:10px;padding:10px 12px;font-family:var(--mono);box-shadow:0 8px 24px rgba(0,0,0,.45);max-width:230px;}
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
.fin .icon-btn:hover{color:var(--red);background:rgba(232,105,91,.1);}
.fin .loan{background:var(--panel2);border:1px solid var(--line);border-radius:13px;padding:14px;margin-bottom:12px;}
.fin .loan.done{opacity:.6;}
.fin .loan-top{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;}
.fin .rank{font-family:var(--mono);font-size:11px;font-weight:700;color:var(--amber);background:var(--amber-soft);border:1px solid rgba(245,166,35,.3);border-radius:7px;padding:3px 8px;flex:none;}
.fin .rank.paid{color:var(--green);background:rgba(92,203,139,.12);border-color:rgba(92,203,139,.32);}
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
.fin .fill{height:100%;background:linear-gradient(90deg,#B5760F,var(--amber));border-radius:20px;transition:width .5s ease;}
.fin .btn{display:inline-flex;align-items:center;gap:7px;font-family:var(--sans);font-size:13px;font-weight:600;border-radius:10px;padding:9px 14px;cursor:pointer;border:1px solid transparent;transition:filter .15s,background .15s;}
.fin .btn-amber{background:var(--amber);color:#1A1206;} .fin .btn-amber:hover{filter:brightness(1.08);}
.fin .btn-ghost{background:transparent;border-color:var(--line2);color:var(--muted);} .fin .btn-ghost:hover{color:var(--text);border-color:var(--faint);}
.fin .btn-add{width:100%;justify-content:center;background:transparent;border:1px dashed var(--line2);color:var(--muted);padding:11px;}
.fin .btn-add:hover{border-color:var(--amber);color:var(--amber);}
.fin .empty{font-family:var(--mono);font-size:12px;color:var(--faint);text-align:center;padding:18px 0;line-height:1.6;}
.fin .warn{display:flex;gap:12px;align-items:flex-start;background:rgba(232,105,91,.08);border:1px solid rgba(232,105,91,.3);border-radius:12px;padding:14px 16px;margin-bottom:16px;}
.fin .warn .wt{font-size:13px;font-weight:600;color:var(--red);margin-bottom:3px;}
.fin .warn .wb{font-size:12.5px;color:var(--muted);line-height:1.5;}
.fin .tbtn.on{color:var(--amber);border-color:rgba(245,166,35,.45);background:var(--amber-soft);}
.fin .panel.help{border-color:rgba(245,166,35,.28);}
.fin .help .phead{margin-bottom:10px;}
.fin .help .ptitle{color:var(--amber);text-transform:none;letter-spacing:.02em;font-size:13px;}
.fin .help-intro{font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:14px;}
.fin .help-list{margin:0;display:grid;grid-template-columns:1fr;gap:11px;}
@media(min-width:780px){.fin .help-list{grid-template-columns:1fr 1fr;gap:11px 18px;}}
.fin .help-item{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:11px 13px;}
.fin .help-item dt{font-size:12.5px;font-weight:600;color:var(--text);margin-bottom:4px;}
.fin .help-item dd{margin:0;font-size:12.5px;color:var(--muted);line-height:1.6;}
.fin .help-foot{font-family:var(--mono);font-size:10.5px;color:var(--faint);margin-top:12px;}
.fin .notice{display:flex;align-items:center;gap:10px;font-family:var(--mono);font-size:11.5px;color:var(--faint);margin-bottom:14px;background:var(--amber-soft);border:1px solid rgba(245,166,35,.22);border-radius:10px;padding:9px 12px;}
.fin .notice button{margin-left:auto;background:none;border:none;color:var(--faint);cursor:pointer;font-size:15px;line-height:1;padding:2px 6px;}
.fin .notice button:hover{color:var(--text);}
.fin .modal{position:fixed;inset:0;background:rgba(6,10,16,.74);display:flex;align-items:center;justify-content:center;z-index:60;padding:18px;}
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
.fin .seg button.on{color:#1A1206;background:var(--amber);}
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
  background:rgba(185,140,232,.13);border:1px solid rgba(185,140,232,.32);border-radius:6px;padding:2px 6px;flex:none;}
.fin .toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:90;display:flex;align-items:center;gap:9px;
  background:var(--panel3);border:1px solid var(--line2);border-radius:11px;padding:11px 16px;font-family:var(--mono);font-size:12.5px;
  color:var(--text);box-shadow:0 10px 30px rgba(0,0,0,.5);animation:toastIn .22s cubic-bezier(.2,.7,.3,1) both;max-width:88vw;}
.fin .toast.err{border-color:rgba(232,105,91,.5);}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
@media(prefers-reduced-motion:reduce){.fin .toast{animation:none;}}
.fin .rise{animation:rise .45s cubic-bezier(.2,.7,.3,1) both;}
@keyframes rise{from{opacity:0;transform:translateY(9px);}to{opacity:1;transform:none;}}
.fin :focus-visible{outline:2px solid var(--amber);outline-offset:2px;}
@media(prefers-reduced-motion:reduce){.fin .rise{animation:none;}.fin .fill,.fin .catfill{transition:none;}}
`;
