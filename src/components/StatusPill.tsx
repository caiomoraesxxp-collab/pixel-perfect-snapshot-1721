import { STATUS_LABEL, type Status } from "@/lib/schools";
import { cn } from "@/lib/utils";

export function StatusPill({ s, onClick }: { s: Status; onClick?: () => void }) {
  const cls = cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
    s === "atendido" && "bg-success text-primary-foreground",
    s === "faltou" && "bg-destructive text-destructive-foreground",
    s === "espera" && "bg-muted text-foreground ring-1 ring-primary/40");
  return onClick
    ? <button onClick={onClick} className={cn(cls, "h-9 px-3")}>{STATUS_LABEL[s]}</button>
    : <span className={cls}>{STATUS_LABEL[s]}</span>;
}
