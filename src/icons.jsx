// Inline lucide-compatible icon components (avoids an extra CDN dependency).

/* ================================================================== */
/*  Icons (inline, lucide-compatible paths — avoids an extra CDN dep)  */
/* ================================================================== */
export function IconBase({ size, color, style, children }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24"
      fill="none" stroke={color || "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={style}>
      {children}
    </svg>
  );
}
export const Plus = (p) => (<IconBase {...p}><path d="M5 12h14" /><path d="M12 5v14" /></IconBase>);
export const Trash2 = (p) => (<IconBase {...p}>
  <path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
  <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></IconBase>);
export const RotateCcw = (p) => (<IconBase {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></IconBase>);
export const RotateCw = (p) => (<IconBase {...p}><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></IconBase>);
export const LayoutGrid = (p) => (<IconBase {...p}>
  <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" />
  <rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></IconBase>);
export const Wallet = (p) => (<IconBase {...p}>
  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></IconBase>);
export const Receipt = (p) => (<IconBase {...p}>
  <path d="M12 17V7" /><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" />
  <path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z" />
</IconBase>);
export const TrendingDown = (p) => (<IconBase {...p}><path d="M16 17h6v-6" /><path d="m22 17-8.5-8.5-5 5L2 7" /></IconBase>);
export const InvestIcon = (p) => (<IconBase {...p}><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="m19 9-5 5-4-4-3 3" /></IconBase>);
export const AlertTriangle = (p) => (<IconBase {...p}>
  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
  <path d="M12 9v4" /><path d="M12 17h.01" /></IconBase>);
export const Check = (p) => (<IconBase {...p}><path d="M20 6 9 17l-5-5" /></IconBase>);
export const Zap = (p) => (<IconBase {...p}><path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" /></IconBase>);
export const Upload = (p) => (<IconBase {...p}><path d="M12 3v12" /><path d="m17 8-5-5-5 5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /></IconBase>);
export const Download = (p) => (<IconBase {...p}><path d="M12 15V3" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /></IconBase>);
export const X = (p) => (<IconBase {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></IconBase>);
export const ArrowRight = (p) => (<IconBase {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></IconBase>);
export const HelpCircle = (p) => (<IconBase {...p}>
  <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></IconBase>);
