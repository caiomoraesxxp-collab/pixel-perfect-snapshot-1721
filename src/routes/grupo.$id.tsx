import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, MoreVertical, Pencil, Trash2, ListPlus, Folder } from "lucide-react";
import { useStore, useHydrated, type TaskList } from "@/lib/store";
import { NameDialog } from "@/components/NameDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListCard } from "@/components/ListCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/grupo/$id")({
  head: () => ({
    meta: [
      { title: "Grupo — Listta" },
      { name: "description", content: "Veja e organize as listas deste grupo no Listta." },
      { property: "og:title", content: "Grupo — Listta" },
      { property: "og:description", content: "Veja e organize as listas deste grupo no Listta." },
    ],
  }),
  component: GroupPage,
});

function GroupPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const allLists = useStore((s) => s.lists);
  const { addList, renameList, deleteList, renameGroup, deleteGroup, setListGroup } = useStore.getState();
  const lists = allLists.filter((l) => l.groupId === id);
  const outside = allLists.filter((l) => l.groupId !== id);
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [removingGroup, setRemovingGroup] = useState(false);
  const [editing, setEditing] = useState<TaskList | null>(null);
  const [deleting, setDeleting] = useState<TaskList | null>(null);

  if (!hydrated) return null;
  if (!group) return (
    <div className="p-8 text-center">
      <p>Grupo não encontrado.</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">Voltar</Link>
    </div>
  );

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background pb-28">
      <header className="flex items-center gap-2 px-3 pt-6 pb-4">
        <Link to="/" aria-label="Voltar" className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Link>
        <Folder className="h-6 w-6 shrink-0 text-success" />
        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold tracking-tight">{group.name}</h1>
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Opções do grupo" className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-muted"><MoreVertical className="h-5 w-5" /></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="h-11" onClick={() => setRenaming(true)}><Pencil className="h-4 w-4" /> Editar nome</DropdownMenuItem>
            <DropdownMenuItem className="h-11 text-destructive" onClick={() => setRemovingGroup(true)}><Trash2 className="h-4 w-4" /> Excluir grupo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main className="space-y-3 px-4">
        {outside.length > 0 && (
          <button onClick={() => setAdding(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed text-sm font-medium text-muted-foreground hover:bg-muted">
            <ListPlus className="h-4 w-4" /> Adicionar listas existentes
          </button>
        )}
        {lists.length === 0 && <p className="pt-10 text-center text-muted-foreground">Nenhuma lista neste grupo. Toque em + para criar.</p>}
        {lists.map((l, i) => <ListCard key={l.id} list={l} index={i} onEdit={() => setEditing(l)} onDelete={() => setDeleting(l)} />)}
      </main>

      <button onClick={() => setCreating(true)} aria-label="Nova lista no grupo"
        className="fixed bottom-6 right-6 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-fab transition-transform active:scale-95">
        <Plus className="h-8 w-8" />
      </button>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Adicionar a “{group.name}”</DialogTitle></DialogHeader>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {outside.map((l) => (
              <button key={l.id} onClick={() => setListGroup(l.id, id)} className="flex h-12 w-full items-center justify-between rounded-xl bg-muted px-4 text-left">
                <span className="truncate font-medium">{l.name}</span>
                <Plus className="h-4 w-4 text-primary" />
              </button>
            ))}
            {outside.length === 0 && <p className="text-sm text-muted-foreground">Todas as listas já estão aqui.</p>}
          </div>
        </DialogContent>
      </Dialog>

      <NameDialog open={creating} onOpenChange={setCreating} title="Nova lista" confirmLabel="Criar" onSubmit={(n) => addList(n, id)} />
      <NameDialog open={renaming} onOpenChange={setRenaming} title="Editar grupo" placeholder="Nome do grupo" initial={group.name} onSubmit={(n) => renameGroup(id, n)} />
      <NameDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Editar lista" initial={editing?.name} onSubmit={(n) => editing && renameList(editing.id, n)} />
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}
        title={`Excluir "${deleting?.name}"?`} description="Todas as tarefas desta lista serão apagadas."
        onConfirm={() => deleting && deleteList(deleting.id)} />
      <ConfirmDialog open={removingGroup} onOpenChange={setRemovingGroup}
        title={`Excluir grupo "${group.name}"?`} description="As listas não serão apagadas — elas voltam para “Listas sem grupo”."
        onConfirm={() => { deleteGroup(id); navigate({ to: "/" }); }} />
    </div>
  );
}
