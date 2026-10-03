import { Link } from "@tanstack/react-router";
import { MoreVertical, Pencil, Trash2, FolderInput, FolderMinus, Folder } from "lucide-react";
import { useStore, type TaskList } from "@/lib/store";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ListCard({ list: l, index, onEdit, onDelete }: {
  list: TaskList; index: number; onEdit: () => void; onDelete: () => void;
}) {
  const groups = useStore((s) => s.groups);
  const setListGroup = useStore((s) => s.setListGroup);
  const done = l.tasks.filter((t) => t.done).length;
  const pct = l.tasks.length ? (done / l.tasks.length) * 100 : 0;
  const others = groups.filter((g) => g.id !== l.groupId);
  return (
    <div className="animate-rise flex items-center rounded-2xl bg-card shadow-soft" style={{ animationDelay: `${index * 30}ms` }}>
      <Link to="/lista/$id" params={{ id: l.id }} className="min-w-0 flex-1 p-4">
        <h3 className="truncate text-lg font-semibold">{l.name}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {l.tasks.length} {l.tasks.length === 1 ? "tarefa" : "tarefas"} · {done} concluída{done === 1 ? "" : "s"}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Opções" className="mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted">
          <MoreVertical className="h-5 w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="h-11" onClick={onEdit}><Pencil className="h-4 w-4" /> Editar nome</DropdownMenuItem>
          {others.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="h-11 gap-2"><FolderInput className="h-4 w-4" /> {l.groupId ? "Mover para grupo" : "Adicionar a grupo"}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {others.map((g) => (
                  <DropdownMenuItem key={g.id} className="h-11" onClick={() => setListGroup(l.id, g.id)}>
                    <Folder className="h-4 w-4" /> {g.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          {l.groupId && (
            <DropdownMenuItem className="h-11" onClick={() => setListGroup(l.id, undefined)}><FolderMinus className="h-4 w-4" /> Retirar do grupo</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="h-11 text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /> Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
