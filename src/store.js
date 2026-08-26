// Thin wrapper over localStorage. set() reports success/failure so callers can warn
// the user when a save is silently dropped (private browsing, full quota).
export const store = {
  async get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  /* Synchronous, for the one value that has to be right on the very first render: the theme.
     Reading it a microtask later would paint one dark frame before flipping to light. */
  getNow(k) { try { return localStorage.getItem(k); } catch { return null; } },
  async set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
};
