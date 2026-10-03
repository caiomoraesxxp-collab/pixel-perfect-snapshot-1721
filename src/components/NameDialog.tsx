import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NameDialog({
  open, onOpenChange, title, initial = "", confirmLabel = "Salvar", onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  initial?: string;
  confirmLabel?: string;
  onSubmit: (name: string) => void;
}) {
  const [value, setValue] = useState(initial);
  useEffect(() => { if (open) setValue(initial); }, [open, initial]);
  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <Input
          autoFocus value={value} onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nome da lista" className="h-12 text-base"
        />
        <DialogFooter className="gap-2">
          <Button variant="ghost" className="h-11" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="h-11" onClick={submit} disabled={!value.trim()}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
