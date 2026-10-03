import { useStore } from "./store";

export async function askNotificationPermission() {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

/** Checks every 30s for tasks whose date+time has arrived and shows a local notification. */
export function startReminderLoop() {
  const check = () => {
    const { lists, updateTask } = useStore.getState();
    const now = Date.now();
    for (const l of lists) {
      for (const t of l.tasks) {
        if (t.done || t.notified || !t.date || !t.time) continue;
        const due = new Date(`${t.date}T${t.time}`).getTime();
        if (due <= now) {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(t.title, { body: `${l.name}${t.note ? " · " + t.note : ""}` });
          }
          updateTask(l.id, t.id, { notified: true });
        }
      }
    }
  };
  check();
  const id = window.setInterval(check, 30000);
  return () => window.clearInterval(id);
}
