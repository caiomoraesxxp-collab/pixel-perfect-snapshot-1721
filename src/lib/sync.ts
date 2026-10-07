import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useStore } from "./store";
import { pushShare } from "./share.functions";

// Share link credentials live in their own persisted store (admin device only).
type ShareState = { viewToken?: string; adminToken?: string; dirty: boolean; set: (p: Partial<ShareState>) => void };
export const useShare = create<ShareState>()(
  persist((set) => ({ dirty: false, set: (p) => set(p) }), { name: "listta-share-v1", skipHydration: true }),
);

export type SyncStatus = "off" | "offline" | "syncing" | "synced";
export const useSyncStatus = create<{ s: SyncStatus }>(() => ({ s: "off" }));

let timer: ReturnType<typeof setTimeout> | undefined;
let running = false;

async function flush() {
  const { viewToken, adminToken, dirty } = useShare.getState();
  if (!useStore.persist.hasHydrated()) { schedule(500); return; }
  if (!viewToken || !adminToken) return useSyncStatus.setState({ s: "off" });
  if (!navigator.onLine) return useSyncStatus.setState({ s: "offline" });
  if (!dirty) return useSyncStatus.setState({ s: "synced" });
  if (running) return;
  running = true;
  useSyncStatus.setState({ s: "syncing" });
  try {
    const { lists, groups, doctors } = useStore.getState();
    useShare.getState().set({ dirty: false });
    await pushShare({ data: { viewToken, adminToken, data: { lists, groups, doctors } } });
    useSyncStatus.setState({ s: useShare.getState().dirty ? "syncing" : "synced" });
  } catch {
    useShare.getState().set({ dirty: true });
    useSyncStatus.setState({ s: navigator.onLine ? "syncing" : "offline" });
    setTimeout(schedule, 5000);
  } finally {
    running = false;
    if (useShare.getState().dirty && navigator.onLine) schedule();
  }
}

export function schedule(delay = 700) {
  clearTimeout(timer);
  timer = setTimeout(() => void flush(), delay);
}

export function markDirtyAndSync() {
  useShare.getState().set({ dirty: true });
  schedule(0);
}

export function startSync() {
  void Promise.resolve(useShare.persist.rehydrate()).then(() => schedule(0));
  const unsub = useStore.subscribe((s, p) => {
    if (s.lists === p.lists && s.groups === p.groups && s.doctors === p.doctors) return;
    if (!useShare.getState().viewToken) return;
    useShare.getState().set({ dirty: true });
    schedule();
  });
  const on = () => schedule(0);
  const off = () => useSyncStatus.setState({ s: useShare.getState().viewToken ? "offline" : "off" });
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  return () => { unsub(); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
}
