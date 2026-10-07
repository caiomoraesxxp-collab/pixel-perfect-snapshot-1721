import { useEffect, useState, type ReactNode } from "react";
import { Star, Bell } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Task, TaskInput } from "@/lib/store";
import { askNotificationPermission } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export function TaskSheet({
  open, onOpenChange, task, onSave, onDelete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task?: Task | null;
  onSave: (input: TaskInput) => void;
  onDelete?: (() => void) | undefined;
  extra?: ReactNode;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [important, setImportant] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDate(task?.date ?? "");
    setTime(task?.time ?? "");
    setNote(task?.note ?? "");
    setImportant(task?.important ?? false);
  }, [open, task]);

  const save = async () => {
    const t = title.trim();
    if (!t) return;
    if (date && time) await askNotificationPermission();
    onSave({ title: t, date: date || undefined, time: time || undefined, note: note.trim() || undefined, important });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 max-h-[90vh] overflow-y-auto">
        <SheetHeader className="px-0">
          <SheetTitle className="text-xl">{task ? "Editar tarefa" : "Nova tarefa"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4">
          <Input
            autoFocus value={title} onChange={(e) => setTitle(e.target.value.toLocaleUpperCase("pt-BR"))}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Nome da tarefa" className="h-12 text-base"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d">Data</Label>
              <Input id="d" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h">Horário</Label>
              <Input id="h" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-12" />
            </div>
          </div>
          {date && time && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Bell className="h-4 w-4" /> Você receberá um lembrete neste horário.</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="n">Observação</Label>
            <Textarea id="n" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="text-base" />
          </div>
          <button
            type="button" onClick={() => setImportant((v) => !v)}
            className={cn("flex h-12 w-full items-center gap-3 rounded-xl border px-4 text-left transition-colors", important && "border-star bg-star/10")}
          >
            <Star className={cn("h-5 w-5", important ? "fill-star text-star" : "text-muted-foreground")} />
            <span className="font-medium">Importante</span>
          </button>
          {extra}
          <div className="flex gap-2 pt-2">
            {onDelete && (
              <Button variant="ghost" className="h-12 text-destructive" onClick={() => { onDelete(); onOpenChange(false); }}>Excluir</Button>
            )}
            <Button className="h-12 flex-1 text-base" onClick={save} disabled={!title.trim()}>Salvar</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
