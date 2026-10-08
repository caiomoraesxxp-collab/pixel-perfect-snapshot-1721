import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Pencil, Search, X, GripVertical, Plus, Calendar, StickyNote, Check } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useStore, useHydrated, type Task } from "@/lib/store";
import { NameDialog } from "@/components/NameDialog";
import { TaskSheet } from "@/components/TaskSheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SHIFTS, STATUS_LIST, STATUS_LABEL, doctorName, listTitle, plural, statusOf, today, type Shift, type Status } from "@/lib/schools";
import { StatusPill } from "@/components/StatusPill";
import { askDoctor, DoctorChips } from "@/components/DoctorPicker";

export const Route = createFileRoute("/lista/$id")({
  head: () => ({
    meta: [
      { title: "Lista — Listta" },
      { name: "description", content: "Veja, marque e organize as tarefas desta lista." },
      { property: "og:title", content: "Lista — Listta" },
      { property: "og:description", content: "Veja, marque e organize as tarefas desta lista." },
    ],
  }),
  component: ListPage,
});

type Filter = "all" | Status | "important";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "espera", label: "Em espera" },
  { key: "atendido", label: "Atendidos" },
  { key: "faltou", label: "Faltou" },
  { key: "important", label: "Importantes" },
];

function ListPage() {
  const { id } = Route.useParams();
  const hydrated = useHydrated();
  const list = useStore((s) => s.lists.find((l) => l.id === id));
  const { renameList, addTask, updateTask, deleteTask, moveTask } = useStore.getState();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [quick, setQuick] = useState("");
  const [autoShift] = useState<Shift>(() => (new Date().getHours() < 12 ? "manha" : "tarde"));
  const [renaming, setRenaming] = useState(false);
  const [sheet, setSheet] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const shift: Shift = list?.shift === "manha" || list?.shift === "tarde" ? list.shift : autoShift;
  const navigate = useNavigate();
  // Each school+shift is its own list: switching shift opens the other list, never mixes data.
  const setShift = (s: Shift) => {
    if (!list || s === shift) return;
    if (list.shift !== "manha" && list.shift !== "tarde") { useStore.getState().setListShift(list.id, s as "manha" | "tarde"); return; }
    const nid = useStore.getState().openSchool(list.name, s as "manha" | "tarde");
    navigate({ to: "/lista/$id", params: { id: nid } });
  };
  const visible = useMemo(() => {
    if (!list) return [];
    const q = query.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return list.tasks.filter((t) => {
      if ((filter === "espera" || filter === "atendido" || filter === "faltou") && statusOf(t) !== filter) return false;
      if (filter === "important" && !t.important) return false;
      if (q && !t.title.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(q)) return false;
      return true;
    });
  }, [list, query, filter]);

  if (!hydrated) return <div className="min-h-screen bg-background" />;
  if (!list) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg">Lista não encontrada.</p>
        <Link to="/" className="text-primary underline">Voltar</Link>
      </div>
    );
  }

  const onDragEnd = (e: DragEndEvent) => {
    if (e.over && e.active.id !== e.over.id) moveTask(list.id, String(e.active.id), String(e.over.id));
  };

  const submitQuick = () => {
    const t = quick.trim();
    if (!t) return;
    addTask(list.id, { title: t.toLocaleUpperCase("pt-BR"), important: filter === "important", shift, attDate: today() });
    setQuick("");
  };

  const setSt = (t: Task, next: Status) => {
    useStore.getState().setStatus(list.id, t.id, next);
    if (next === "atendido") askDoctor(list.id, t.id, t.title);
  };
  const toggle = (t: Task) => setSt(t, t.done ? "espera" : "atendido");

  const cycle = (t: Task) => {
    const next: Status = ({ espera: "atendido", atendido: "faltou", faltou: "espera" } as Record<string, Status>)[statusOf(t)] ?? "espera";
    setSt(t, next);
  };
  const c = { total: 0, espera: 0, atendido: 0, faltou: 0, naochegou: 0, foiembora: 0 };
  list.tasks.forEach((t) => c[statusOf(t)]++);
  c.total = list.tasks.length - c.faltou;
  const canDrag = !query && filter === "all";

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background pb-32">
      <header className="sticky top-0 z-10 bg-background/90 px-3 pt-4 pb-3 backdrop-blur">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-1">
          <Link to="/" aria-label="Voltar" className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted"><ArrowLeft className="h-6 w-6" /></Link>
          <div className="min-w-0 px-1">
            <h1 className="truncate text-2xl font-bold tracking-tight">{listTitle(list)}</h1>
            <p className="text-sm text-muted-foreground">{c.atendido} de {plural(c.total, "aluno", "alunos")} {c.atendido === 1 ? "atendido" : "atendidos"}</p>
          </div>
          <button aria-label="Editar nome" onClick={() => setRenaming(true)} className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-muted"><Pencil className="h-5 w-5" /></button>
          <ThemeToggle />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 px-1 text-center">
          {([[c.total === 1 ? "Aluno" : "Alunos", c.total, "bg-muted"], ["Em espera", c.espera, "bg-accent text-accent-foreground"], [c.atendido === 1 ? "Atendido" : "Atendidos", c.atendido, "bg-success text-primary-foreground"], ["Faltou", c.faltou, "bg-destructive text-destructive-foreground"]] as const).map(([l, n, k]) => (
            <div key={l} className={cn("rounded-xl py-1.5", k)}><p className="text-lg font-bold leading-tight">{n}</p><p className="text-[11px]">{l}</p></div>
          ))}
        </div>
        <div className="mt-3 flex gap-2 px-1">
          {SHIFTS.map((x) => (
            <button key={x.key} onClick={() => setShift(x.key)} className={cn("h-9 flex-1 rounded-xl text-sm font-medium",
              shift === x.key ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground")}>{x.label}</button>
          ))}
        </div>
        <div className="relative mt-3 px-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar aluno..."
            className="h-12 w-full rounded-xl bg-muted pl-11 pr-4 text-base outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key} onClick={() => setFilter(f.key)}
              className={cn("h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
                filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
            >{f.label}</button>
          ))}
        </div>
      </header>

      <main className="px-3">
        {visible.length === 0 && (
          <p className="mt-16 text-center text-muted-foreground">
            {query ? "Nenhum resultado encontrado." : list.tasks.length ? "Nada por aqui neste filtro." : "Adicione o primeiro aluno abaixo."}
          </p>
        )}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visible.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {visible.map((t) => (
                <TaskRow
                  key={t.id} task={t} canDrag={canDrag}
                  onToggle={() => toggle(t)}
                  onCycle={() => cycle(t)}
                  onPick={(st) => setSt(t, st)}
                  onOpen={() => setSheet({ open: true, task: t })}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-xl bg-gradient-to-t from-background via-background to-transparent px-3 pt-6 pb-4">
        <div className="flex items-center gap-2 rounded-2xl bg-card p-1.5 shadow-soft">
          <button aria-label="Adicionar com detalhes" onClick={() => setSheet({ open: true, task: null })} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Plus className="h-6 w-6" />
          </button>
          <input
            value={quick} onChange={(e) => setQuick(e.target.value.toLocaleUpperCase("pt-BR"))} onKeyDown={(e) => e.key === "Enter" && submitQuick()}
            placeholder="+ Adicionar aluno" enterKeyHint="done"
            className="h-11 min-w-0 flex-1 bg-transparent px-2 text-base outline-none"
          />
          {quick.trim() && (
            <button onClick={submitQuick} className="h-11 shrink-0 rounded-xl px-4 font-medium text-primary">Adicionar</button>
          )}
        </div>
      </div>

      <NameDialog open={renaming} onOpenChange={setRenaming} title="Editar escola" initial={list.name} onSubmit={(n) => renameList(list.id, n)} />
      <TaskSheet
        open={sheet.open} task={sheet.task}
        onOpenChange={(o) => setSheet((s) => ({ ...s, open: o }))}
        onSave={(input) => {
          const up = { ...input, title: input.title.toLocaleUpperCase("pt-BR") };
          if (sheet.task) updateTask(list.id, sheet.task.id, { ...up, notified: false });
          else addTask(list.id, { ...up, shift, attDate: today() });
        }}
        onDelete={sheet.task ? () => deleteTask(list.id, sheet.task!.id) : undefined}
        extra={sheet.task && list.tasks.find((x) => x.id === sheet.task!.id)?.done ? (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Médico do atendimento</p>
            <DoctorChips value={list.tasks.find((x) => x.id === sheet.task!.id)?.doctor} onPick={(i) => useStore.getState().setDoctor(list.id, sheet.task!.id, i)} />
          </div>
        ) : undefined}
      />
    </div>
  );
}

function formatDue(t: Task) {
  if (!t.date) return null;
  const d = new Date(`${t.date}T00:00`);
  const s = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return t.time ? `${s}, ${t.time}` : s;
}

function TaskRow({ task, canDrag, onToggle, onCycle, onPick, onOpen }: {
  task: Task; canDrag: boolean; onToggle: () => void; onCycle: () => void; onPick: (s: Status) => void; onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled: !canDrag });
  const due = formatDue(task);
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-1 rounded-2xl bg-card pr-1 shadow-soft transition-opacity", isDragging && "z-20 opacity-80 ring-2 ring-primary", task.done && "opacity-70", task.absent && !task.done && "border-l-4 border-destructive")}
    >
      {canDrag && (
        <button aria-label="Arrastar" {...attributes} {...listeners} className="grid h-14 w-8 shrink-0 touch-none place-items-center text-muted-foreground/60">
          <GripVertical className="h-5 w-5" />
        </button>
      )}
      <button
        aria-label={task.done ? "Desmarcar" : "Concluir"} onClick={onToggle}
        className={cn("grid h-12 w-12 shrink-0 place-items-center", !canDrag && "ml-1")}
      >
        <span className={cn("grid h-7 w-7 place-items-center rounded-full border-2 transition-colors",
          task.done ? "animate-pop border-success bg-success text-primary-foreground" : "border-muted-foreground/50")}>
          {task.done && <Check className="h-4 w-4" strokeWidth={3} />}
        </span>
      </button>
      <button onClick={onOpen} className="min-w-0 flex-1 py-3 text-left">
        <p className={cn("truncate text-base font-medium transition-colors", task.done && "text-muted-foreground line-through")}>{task.title}</p>
        {task.done && task.doctor !== undefined && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{doctorName(useStore.getState().doctors, task.doctor)}</p>
        )}
        {(due || task.note) && (
          <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            {due && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{due}</span>}
            {task.note && <StickyNote className="h-3.5 w-3.5" />}
          </p>
        )}
      </button>
      <StatusPill s={statusOf(task)} onClick={onCycle} />
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Alterar status" className="grid h-12 w-12 shrink-0 place-items-center text-muted-foreground">
          <X className="h-6 w-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {STATUS_LIST.map((st) => (
            <DropdownMenuItem key={st} className="h-11" onClick={() => onPick(st)}>
              <StatusPill s={st} /> {statusOf(task) === st && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
