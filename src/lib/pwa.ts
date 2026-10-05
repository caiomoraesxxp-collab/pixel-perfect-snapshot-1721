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
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    // Warm the page cache so main screens and saved schools open without internet.
    const { useStore } = await import("./store");
    const paths = ["/", "/relatorios", ...useStore.getState().lists.map((l) => `/lista/${l.id}`)];
    paths.forEach((p) => fetch(p, { mode: "same-origin", headers: { accept: "text/html" } }).catch(() => {}));
  } catch { /* ignore */ }
}
