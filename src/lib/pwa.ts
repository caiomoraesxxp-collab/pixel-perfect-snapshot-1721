// Single place that registers the offline service worker. Never in dev/preview/iframe.
export async function setupServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const h = location.hostname;
  const blocked =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    h.startsWith("id-preview--") || h.startsWith("preview--") ||
    h === "lovableproject.com" || h.endsWith(".lovableproject.com") ||
    h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com") ||
    h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev") ||
    new URLSearchParams(location.search).get("sw") === "off";
  if (blocked) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.filter((r) => r.active?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()));
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    // Cache the current page shell + the other main pages for offline use.
    reg.active && ["/", "/relatorios"].forEach((p) => fetch(p).catch(() => {}));
  } catch { /* ignore */ }
}
