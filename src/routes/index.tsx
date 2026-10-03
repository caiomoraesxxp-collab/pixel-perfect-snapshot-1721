import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ListChecks, Folder, FolderPlus, ChevronRight } from "lucide-react";
import { useStore, useHydrated, type TaskList } from "@/lib/store";
import { NameDialog } from "@/components/NameDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { ListCard } from "@/components/ListCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Listta — listas de tarefas simples e offline" },
      { name: "description", content: "Crie listas, agrupe em pastas e marque tarefas no Listta, mesmo sem internet." },
      { property: "og:title", content: "Listta" },
      { property: "og:description", content: "Crie listas, agrupe em pastas e marque tarefas no Listta, mesmo sem internet." },
    ],
  }),
  component: Home,
});

function Home() {
  const hydrated = useHydrated();
  const lists = useStore((s) => s.lists);
  const groups = useStore((s) => s.groups);
  const { addList, renameList, deleteList, addGroup } = useStore.getState();
  const [creating, setCreating] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [editing, setEditing] = useState<TaskList | null>(null);
  const [deleting, setDeleting] = useState<TaskList | null>(null);
  const loose = lists.filter((l) => !l.groupId || !groups.some((g) => g.id === l.groupId));

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background pb-28">
      <header className="flex items-center justify-between px-5 pt-7 pb-4">
        <Logo />
        <ThemeToggle />
      </header>

      {hydrated && (
        <main className="space-y-7 px-4">
          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Meus grupos</h2>
              <button onClick={() => setCreatingGroup(true)} className="flex h-9 items-center gap-1.5 rounded-full bg-secondary px-3 text-sm font-medium text-secondary-foreground">
                <FolderPlus className="h-4 w-4" /> Novo grupo
              </button>
            </div>
            {groups.length === 0 ? (
              <p className="px-1 text-sm text-muted-foreground">Agrupe listas em pastas, como “Trabalho” ou “Casa”.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {groups.map((g) => {
                  const n = lists.filter((l) => l.groupId === g.id).length;
                  return (
                    <Link key={g.id} to="/grupo/$id" params={{ id: g.id }} className="animate-rise flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-soft">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Folder className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{n} {n === 1 ? "lista" : "listas"}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {groups.length ? "Listas sem grupo" : "Minhas listas"}
            </h2>
            {lists.length === 0 ? (
              <div className="mt-8 flex flex-col items-center text-center text-muted-foreground animate-rise">
                <div className="grid h-20 w-20 place-items-center rounded-3xl bg-accent text-accent-foreground"><ListChecks className="h-10 w-10" /></div>
                <p className="mt-5 text-lg font-medium text-foreground">Nenhuma lista ainda</p>
                <p className="mt-1">Toque em + para criar sua primeira lista.</p>
              </div>
            ) : loose.length === 0 ? (
              <p className="px-1 text-sm text-muted-foreground">Todas as listas estão em grupos.</p>
            ) : (
              <div className="space-y-3">
                {loose.map((l, i) => <ListCard key={l.id} list={l} index={i} onEdit={() => setEditing(l)} onDelete={() => setDeleting(l)} />)}
              </div>
            )}
          </section>
        </main>
      )}

      <button onClick={() => setCreating(true)} aria-label="Nova lista"
        className="fixed bottom-6 right-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-fab transition-transform active:scale-95">
        <Plus className="h-8 w-8" />
      </button>

      <NameDialog open={creating} onOpenChange={setCreating} title="Nova lista" confirmLabel="Criar" onSubmit={(n) => addList(n)} />
      <NameDialog open={creatingGroup} onOpenChange={setCreatingGroup} title="Novo grupo" confirmLabel="Criar" placeholder="Nome do grupo" onSubmit={(n) => addGroup(n)} />
      <NameDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Editar lista" initial={editing?.name} onSubmit={(n) => editing && renameList(editing.id, n)} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title={`Excluir "${deleting?.name}"?`} description="Todas as tarefas desta lista serão apagadas."
        onConfirm={() => deleting && deleteList(deleting.id)} />
    </div>
  );
}
