import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, ListChecks, Folder, FolderPlus, ChevronRight, Search, FileText, School, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SCHOOLS, norm } from "@/lib/schools";
import { useStore, useHydrated, type TaskList } from "@/lib/store";
import { NameDialog } from "@/components/NameDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { ListCard } from "@/components/ListCard";
import { ShareButton, SyncBadge } from "@/components/ShareDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Listta — listas de tarefas simples e offline" },
      { name: "description", content: "Crie listas, agrupe em pastas e marque tarefas no Listta, mesmo sem internet." },
      { property: "og:title", content: "Listta" },
      { property: "og:description", content: "Crie listas, agrupe em pastas e marque tarefas no Listta, mesmo sem internet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
  const [sq, setSq] = useState("");
  const navigate = useNavigate();
  const openSchool = (name: string) => {
    const ex = useStore.getState().lists.find((l) => l.name === name);
    const id = ex ? ex.id : addList(name);
    setCreating(false); setSq("");
    navigate({ to: "/lista/$id", params: { id } });
  };
  const [editing, setEditing] = useState<TaskList | null>(null);
  const [deleting, setDeleting] = useState<TaskList | null>(null);
  const loose = lists.filter((l) => !l.groupId || !groups.some((g) => g.id === l.groupId));

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background pb-28">
      <header className="flex items-center justify-between px-5 pt-7 pb-4">
        <Logo />
        <div className="flex items-center gap-1">
          <Link to="/relatorios" aria-label="Relatórios" className="flex h-11 items-center gap-1.5 rounded-full bg-secondary px-3 text-sm font-medium text-secondary-foreground"><FileText className="h-4 w-4" /> Relatórios</Link>
          {hydrated && <ShareButton />}
          <Link to="/configuracoes" aria-label="Configurações" className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-secondary-foreground"><Settings className="h-5 w-5" /></Link>
          <ThemeToggle />
        </div>
      </header>
      {hydrated && <SyncBadge />}

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
              {groups.length ? "Escolas sem grupo" : "Minhas escolas"}
            </h2>
            {lists.length === 0 ? (
              <div className="mt-8 flex flex-col items-center text-center text-muted-foreground animate-rise">
                <div className="grid h-20 w-20 place-items-center rounded-3xl bg-accent text-accent-foreground"><ListChecks className="h-10 w-10" /></div>
                <p className="mt-5 text-lg font-medium text-foreground">Nenhuma escola ainda</p>
                <p className="mt-1">Toque em + para adicionar uma escola.</p>
              </div>
            ) : loose.length === 0 ? (
              <p className="px-1 text-sm text-muted-foreground">Todas as escolas estão em grupos.</p>
            ) : (
              <div className="space-y-3">
                {loose.map((l, i) => <ListCard key={l.id} list={l} index={i} siblings={loose.map((x) => x.id)} onEdit={() => setEditing(l)} onDelete={() => setDeleting(l)} />)}
              </div>
            )}
          </section>
        </main>
      )}

      <button onClick={() => setCreating(true)} aria-label="Nova escola"
        className="fixed bottom-6 right-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-fab transition-transform active:scale-95">
        <Plus className="h-8 w-8" />
      </button>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="flex max-h-[85vh] flex-col rounded-2xl">
          <DialogHeader><DialogTitle>Nova escola</DialogTitle></DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input autoFocus value={sq} onChange={(e) => setSq(e.target.value)} placeholder="Pesquisar escola"
              className="h-12 w-full rounded-xl bg-muted pl-10 pr-3 text-base outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <ul className="-mx-2 min-h-0 flex-1 overflow-y-auto">
            {SCHOOLS.filter((n) => norm(n).includes(norm(sq.trim()))).map((n) => (
              <li key={n}><button onClick={() => openSchool(n)} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted">
                <School className="h-5 w-5 shrink-0 text-primary" /><span className="text-sm font-medium">{n}</span>
              </button></li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
      <NameDialog open={creatingGroup} onOpenChange={setCreatingGroup} title="Novo grupo" confirmLabel="Criar" placeholder="Nome do grupo" onSubmit={(n) => addGroup(n)} />
      <NameDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Editar escola" initial={editing?.name} onSubmit={(n) => editing && renameList(editing.id, n)} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title={`Excluir "${deleting?.name}"?`} description="Todas as tarefas desta lista serão apagadas."
        onConfirm={() => deleting && deleteList(deleting.id)} />
    </div>
  );
}
