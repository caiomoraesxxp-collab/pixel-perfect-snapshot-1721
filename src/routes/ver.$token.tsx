import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, Eye, Folder } from "lucide-react";
import { getShare } from "@/lib/share.functions";
import { shiftLabel, statusOf } from "@/lib/schools";
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
  const parsed = (q.data?.found ? JSON.parse(q.data.json) : {}) as { lists?: TaskList[]; groups?: Group[] };
  const lists = parsed.lists ?? [];
  const groups = parsed.groups ?? [];
  const gname = (id?: string) => groups.find((g) => g.id === id)?.name;

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background pb-16">
      <header className="flex items-center justify-between px-5 pt-7 pb-2">
        <Logo />
        <span className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"><Eye className="h-4 w-4" /> Somente visualização</span>
      </header>
      <p className="px-5 pb-4 text-xs text-muted-foreground">
        {q.isError ? "Sem conexão — tentando novamente..." : q.data?.found ? `Atualizado às ${new Date(q.data.updatedAt).toLocaleTimeString("pt-BR")}` : ""}
      </p>
      <main className="space-y-3 px-4">
        {q.isLoading && <p className="text-center text-muted-foreground">Carregando...</p>}
        {q.data && !q.data.found && <p className="text-center text-muted-foreground">Link inválido ou removido.</p>}
        {q.data?.found && lists.length === 0 && <p className="text-center text-muted-foreground">Nenhuma escola ainda.</p>}
        {lists.map((l) => <SchoolView key={l.id} list={l} group={gname(l.groupId)} />)}
      </main>
    </div>
  );
}

function SchoolView({ list, group }: { list: TaskList; group?: string | undefined }) {
  const [open, setOpen] = useState(false);
  const done = list.tasks.filter((t) => t.done).length;
  return (
    <div className="rounded-2xl bg-card shadow-soft">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 p-4 text-left">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{list.name}</p>
          <p className="text-xs text-muted-foreground">
            {group && <><Folder className="mr-1 inline h-3 w-3" />{group} · </>}
            {shiftLabel(list.shift)} · {list.tasks.length} alunos · {done} atendidos
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
              <span className={`flex-1 text-sm ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
              <StatusPill s={statusOf(t)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
