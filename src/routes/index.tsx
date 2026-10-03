import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, MoreVertical, Pencil, Trash2, ListChecks } from "lucide-react";
import { useStore, useHydrated, type TaskList } from "@/lib/store";
import { NameDialog } from "@/components/NameDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minhas Listas — tarefas simples e offline" },
      { name: "description", content: "Crie listas, marque tarefas e organize seu dia, mesmo sem internet." },
      { property: "og:title", content: "Minhas Listas" },
      { property: "og:description", content: "Crie listas, marque tarefas e organize seu dia, mesmo sem internet." },
    ],
  }),
  component: Home,
});

function Home() {
  const hydrated = useHydrated();
  const lists = useStore((s) => s.lists);
  const addList = useStore((s) => s.addList);
  const renameList = useStore((s) => s.renameList);
  const deleteList = useStore((s) => s.deleteList);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TaskList | null>(null);
  const [deleting, setDeleting] = useState<TaskList | null>(null);

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background pb-28">
      <header className="flex items-center justify-between px-5 pt-8 pb-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Olá 👋</p>
          <h1 className="truncate text-3xl font-bold tracking-tight">Minhas listas</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="space-y-3 px-4">
        {hydrated && lists.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center text-muted-foreground animate-rise">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-secondary text-secondary-foreground">
              <ListChecks className="h-10 w-10" />
            </div>
            <p className="mt-5 text-lg font-medium text-foreground">Nenhuma lista ainda</p>
            <p className="mt-1">Toque em + para criar sua primeira lista.</p>
          </div>
        )}
        {hydrated && lists.map((l, i) => {
          const done = l.tasks.filter((t) => t.done).length;
          const pct = l.tasks.length ? (done / l.tasks.length) * 100 : 0;
          return (
            <div key={l.id} className="animate-rise flex items-center rounded-2xl bg-card shadow-soft" style={{ animationDelay: `${i * 30}ms` }}>
              <Link to="/lista/$id" params={{ id: l.id }} className="min-w-0 flex-1 p-4">
                <h2 className="truncate text-lg font-semibold">{l.name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {l.tasks.length} {l.tasks.length === 1 ? "tarefa" : "tarefas"} · {done} concluída{done === 1 ? "" : "s"}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger aria-label="Opções" className="mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted">
                  <MoreVertical className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="h-11" onClick={() => setEditing(l)}><Pencil className="h-4 w-4" /> Editar nome</DropdownMenuItem>
                  <DropdownMenuItem className="h-11 text-destructive" onClick={() => setDeleting(l)}><Trash2 className="h-4 w-4" /> Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </main>

      <button
        onClick={() => setCreating(true)} aria-label="Nova lista"
        className="fixed bottom-6 right-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-fab transition-transform active:scale-95"
      >
        <Plus className="h-8 w-8" />
      </button>

      <NameDialog open={creating} onOpenChange={setCreating} title="Nova lista" confirmLabel="Criar" onSubmit={(n) => addList(n)} />
      <NameDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Editar lista" initial={editing?.name} onSubmit={(n) => editing && renameList(editing.id, n)} />
      <ConfirmDialog
        open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title={`Excluir "${deleting?.name}"?`} description="Todas as tarefas desta lista serão apagadas."
        onConfirm={() => deleting && deleteList(deleting.id)}
      />
    </div>
  );
}
