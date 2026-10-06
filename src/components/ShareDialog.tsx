import { useState } from "react";
import { Share2, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createShare } from "@/lib/share.functions";
import { useShare, useSyncStatus, markDirtyAndSync } from "@/lib/sync";
import { cn } from "@/lib/utils";

export function SyncBadge() {
  const s = useSyncStatus((x) => x.s);
  if (s === "off") return null;
  const label = s === "synced" ? "Online — sincronizado" : s === "syncing" ? "Sincronizando..." : "Offline — dados salvos no dispositivo";
  return (
    <div className="flex items-center gap-2 px-5 pb-2 text-xs font-medium text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", s === "synced" && "bg-success", s === "syncing" && "animate-pulse bg-primary", s === "offline" && "bg-muted-foreground")} />
      {label}
    </div>
  );
}

export function ShareButton() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const viewToken = useShare((s) => s.viewToken);
  const link = viewToken ? `${window.location.origin}/ver/${viewToken}` : "";

  const generate = async () => {
    if (!navigator.onLine) { toast.error("Conecte-se à internet para gerar o link."); return; }
    setBusy(true);
    try {
      const r = await createShare();
      useShare.getState().set({ viewToken: r.viewToken, adminToken: r.adminToken });
      markDirtyAndSync();
    } catch { toast.error("Não foi possível gerar o link."); }
    setBusy(false);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast.success("Link copiado!"); }
    catch { toast.error("Não foi possível copiar."); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Compartilhar visualização" className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-secondary-foreground">
        <Share2 className="h-5 w-5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Compartilhar visualização</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Quem abrir o link só pode ver os dados, sem alterar nada. As mudanças aparecem automaticamente quando você estiver com internet.</p>
          {!viewToken ? (
            <button onClick={generate} disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />} Compartilhar visualização
            </button>
          ) : (
            <>
              <div className="break-all rounded-xl bg-muted p-3 text-sm">{link}</div>
              <button onClick={copy} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground">
                <Copy className="h-5 w-5" /> Copiar link
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
