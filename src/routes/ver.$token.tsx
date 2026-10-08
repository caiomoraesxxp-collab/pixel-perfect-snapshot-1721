import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, Eye, Folder } from "lucide-react";
import { getShare } from "@/lib/share.functions";
import { doctorName, plural, shiftLabel, statusOf } from "@/lib/schools";
import type { TaskList, Group } from "@/lib/store";
import { Logo } from "@/components/Logo";
import { StatusPill } from "@/components/StatusPill";

export const Route = createFileRoute("/ver/$token")({
  head: () => ({
    meta: [
      { title: "Listta — visualização compartilhada" },
      { name: "description", content: "Acompanhe em tempo real as escolas e alunos compartilhados no Listta." },
      { property: "og:title", content: "Listta — visualização compartilhada" },
      { property: "og:description", content: "Acompanhe em tempo real as escolas e alunos compartilhados no Listta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Viewer,
});

function Viewer() {
  const { token } = Route.useParams();
  const q = useQuery({
    queryKey: ["share", token],
    queryFn: () => getShare({ data: { viewToken: token } }),
    refetchInterval: 3000,
    refetchIntervalInBackground: false,
    retry: false,
  });
  const parsed = (q.data?.found ? JSON.parse(q.data.json) : {}) as { lists?: TaskList[]; groups?: Group[]; doctors?: string[] };
  const lists = parsed.lists ?? [];
  const groups = parsed.groups ?? [];
  const doctors = parsed.doctors ?? [];
  const waiting = lists.reduce((n, l) => n + l.tasks.filter((t) => statusOf(t) === "espera").length, 0);
  const byShift = [
    { k: "manha", label: "Manhã", ls: lists.filter((l) => l.shift === "manha") },
    { k: "tarde", label: "Tarde", ls: lists.filter((l) => l.shift === "tarde") },
    { k: "x", label: "Sem turno", ls: lists.filter((l) => l.shift !== "manha" && l.shift !== "tarde") },
  ].filter((g) => g.k !== "x" || g.ls.length);
  const gname = (id?: string) => groups.find((g) => g.id === id)?.name;

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background pb-16">
      <header className="flex items-center justify-between px-5 pt-7 pb-2">
        <Logo />
        <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"><Eye className="h-4 w-4" /> Somente visualização</span>
      </header>
      {q.data?.found && (
        <div className="mx-4 mb-2 rounded-2xl bg-primary px-4 py-3 text-center text-xl font-bold uppercase tracking-wide text-primary-foreground">
          Faltam ser atendidos: {waiting}
        </div>
      )}
      <p className="px-5 pb-4 text-xs text-muted-foreground">
        {q.isError ? "Sem conexão — tentando novamente..." : q.data?.found ? `Atualizado às ${new Date(q.data.updatedAt).toLocaleTimeString("pt-BR")}` : ""}
      </p>
      <main className="space-y-3 px-4">
        {q.isLoading && <p className="text-center text-muted-foreground">Carregando...</p>}
        {q.data && !q.data.found && <p className="text-center text-muted-foreground">Link inválido ou removido.</p>}
        {q.data?.found && lists.length === 0 && <p className="text-center text-muted-foreground">Nenhuma escola ainda.</p>}
        {q.data?.found && lists.length > 0 && byShift.map((g) => (
          <section key={g.k} className="space-y-3">
            <h2 className="px-1 pt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{g.label} · {plural(g.ls.length, "escola", "escolas")}</h2>
            {g.ls.length === 0 && <p className="px-1 text-sm text-muted-foreground">Nenhuma escola neste turno.</p>}
            {g.ls.map((l) => <SchoolView key={l.id} list={l} group={gname(l.groupId)} doctors={doctors} />)}
          </section>
        ))}
      </main>
    </div>
  );
}

function SchoolView({ list, group, doctors }: { list: TaskList; group?: string | undefined; doctors: string[] }) {
  const [open, setOpen] = useState(false);
  const done = list.tasks.filter((t) => t.done).length;
  const total = list.tasks.filter((t) => t.done || !t.absent).length;
  const absent = list.tasks.length - total;
  return (
    <div className="rounded-2xl bg-card shadow-soft">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{list.name}</p>
          <p className="text-xs text-muted-foreground">
            {group && <><Folder className="mr-1 inline h-3 w-3" />{group} · </>}
            {shiftLabel(list.shift)} · {plural(total, "aluno", "alunos")} · {plural(done, "atendido", "atendidos")}{absent ? ` · ${plural(absent, "falta", "faltas")}` : ""}
          </p>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="border-t border-border px-4 py-2">
          {list.tasks.length === 0 && <li className="py-2 text-sm text-muted-foreground">Nenhum aluno.</li>}
          {list.tasks.map((t, i) => (
            <li key={t.id} className="flex items-center gap-3 py-2">
              <span className="w-6 text-sm text-muted-foreground">{i + 1}.</span>
              <span className={`min-w-0 flex-1 text-sm ${t.done ? "text-muted-foreground" : ""}`}>
                <span className={t.done ? "line-through" : ""}>{t.title}</span>
                {t.done && t.doctor !== undefined && <span className="block text-xs">{doctorName(doctors, t.doctor)}</span>}
              </span>
              <StatusPill s={statusOf(t)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
