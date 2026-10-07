import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { useStore, useHydrated, type Task } from "@/lib/store";
import { SCHOOLS, SHIFTS, STATUS_LABEL, doctorName, fmtDate, plural, shiftLabel, statusOf, today, type Shift } from "@/lib/schools";
import { buildPdf, downloadPdf, sharePdf, type PdfSection } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/StatusPill";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Listta" },
      { name: "description", content: "Relatórios de atendimento por escola, por turno e geral do dia, com PDF." },
      { property: "og:title", content: "Relatórios — Listta" },
      { property: "og:description", content: "Relatórios de atendimento por escola, por turno e geral do dia, com PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reports,
});

type Tab = "escola" | "turno" | "medico" | "geral";
type Row = Task & { school?: string };
const count = (ts: Task[]) => {
  const c = { total: ts.length, espera: 0, atendido: 0, faltou: 0 };
  ts.forEach((t) => c[statusOf(t)]++);
  return c;
};
const totalsLine = (c: ReturnType<typeof count>) =>
  `${plural(c.total - c.faltou, "aluno", "alunos")} · ${c.espera} em espera · ${plural(c.atendido, "atendido", "atendidos")} · ${plural(c.faltou, "falta", "faltas")}`;

function Reports() {
  const hydrated = useHydrated();
  const lists = useStore((s) => s.lists);
  const doctors = useStore((s) => s.doctors);
  const dn = (t: Task) => (t.done ? doctorName(doctors, t.doctor) || "Sem médico" : "");
  const [tab, setTab] = useState<Tab>("escola");
  const [date, setDate] = useState(today());
  const [school, setSchool] = useState(SCHOOLS[0]!);
  const [shift, setShift] = useState<Shift>("manha");

  const byDate = (ts: Task[], ls?: Task["shift"]) => ts.filter((t) => (t.attDate ?? "") === date).map((t) => (ls ? { ...t, shift: ls } : t));
  const schools = useMemo(
    () => lists.map((l) => ({ name: l.name, tasks: byDate(l.tasks, l.shift).map((t) => ({ ...t, school: l.name })) as Row[] })).filter((s) => s.tasks.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lists, date],
  );

  const attended = schools.flatMap((s) => s.tasks).filter((t) => t.done);
  const docSections = [...doctors.map((_, i) => i), -1]
    .map((i) => ({ name: i < 0 ? "Sem médico" : doctorName(doctors, i), doc: true, tasks: attended.filter((t) => (i < 0 ? t.doctor === undefined : t.doctor === i)) as Row[] }))
    .filter((d) => d.name !== "Sem médico" || d.tasks.length);
  const docLine = (ts: Row[]) => `${plural(ts.length, "atendimento", "atendimentos")} · Manhã: ${ts.filter((t) => t.shift === "manha").length} · Tarde: ${ts.filter((t) => t.shift === "tarde").length}`;
  let sections: { name: string; tasks: Row[]; doc?: boolean }[] = [];
  let title = "";
  if (tab === "escola") {
    const l = lists.find((x) => x.name === school);
    sections = [{ name: school, tasks: l ? byDate(l.tasks, l.shift) : [] }];
    title = "Relatório por escola";
  } else if (tab === "turno") {
    sections = schools.map((s) => ({ ...s, tasks: s.tasks.filter((t) => t.shift === shift) })).filter((s) => s.tasks.length);
    title = `Relatório por turno — ${shiftLabel(shift)}`;
  } else if (tab === "medico") {
    sections = docSections;
    title = "Relatório por médico";
  } else {
    sections = [...schools, ...docSections];
    title = "Relatório geral do dia";
  }
  const all = count(sections.filter((s) => !s.doc).flatMap((s) => s.tasks));

  const makePdf = () => {
    const pdfSections: PdfSection[] = sections.map((s) => s.doc ? ({
      title: `Médico: ${s.name}`,
      head: ["#", "Aluno", "Escola", "Turno"],
      rows: s.tasks.map((t, i) => [String(i + 1), t.title, t.school ?? "", shiftLabel(t.shift)]),
      totals: docLine(s.tasks),
    }) : ({
      title: s.name,
      head: ["#", "Aluno", "Turno", "Status", "Médico"],
      rows: s.tasks.map((t, i) => [String(i + 1), t.title, shiftLabel(t.shift), STATUS_LABEL[statusOf(t)], dn(t)]),
      totals: totalsLine(count(s.tasks)),
    }));
    const info = `Data: ${fmtDate(date)}${tab === "turno" ? `   Turno: ${shiftLabel(shift)}` : ""}${tab === "escola" ? `   Escola: ${school}` : ""}`;
    const footer = tab === "escola" ? undefined : tab === "medico" ? `TOTAL GERAL — ${plural(attended.length, "atendimento", "atendimentos")}` : `TOTAL GERAL — ${totalsLine(all)}`;
    return buildPdf(title, info, pdfSections.length ? pdfSections : [{ title: "Sem atendimentos", head: ["#", "Aluno", "Turno", "Status"], rows: [] }], footer);
  };
  const fileName = `listta-${tab}-${date}.pdf`;

  if (!hydrated) return <div className="min-h-screen bg-background" />;

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background pb-32">
      <header className="sticky top-0 z-10 bg-background/90 px-3 pt-4 pb-3 backdrop-blur">
        <div className="flex items-center gap-1">
          <Link to="/" aria-label="Voltar" className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted"><ArrowLeft className="h-6 w-6" /></Link>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {([["escola", "Por escola"], ["turno", "Por turno"], ["medico", "Por médico"], ["geral", "Geral do dia"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("h-9 shrink-0 rounded-full px-4 text-sm font-medium",
              tab === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{l}</button>
          ))}
        </div>
        <div className="mt-3 space-y-2 px-1">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || today())} className="h-11 w-full rounded-xl bg-muted px-3 text-base" />
          {tab === "escola" && (
            <select value={school} onChange={(e) => setSchool(e.target.value)} className="h-11 w-full rounded-xl bg-muted px-3 text-base">
              {SCHOOLS.map((s) => <option key={s}>{s}</option>)}
            </select>
          )}
          {tab === "turno" && (
            <div className="flex gap-2">
              {SHIFTS.map((s) => (
                <button key={s.key} onClick={() => setShift(s.key)} className={cn("h-10 flex-1 rounded-xl text-sm font-medium",
                  shift === s.key ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground")}>{s.label}</button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="space-y-4 px-3">
        {sections.length === 0 || (tab === "medico" ? attended.length === 0 : all.total === 0) ? (
          <p className="mt-10 text-center text-muted-foreground">Nenhum atendimento registrado nesta data.</p>
        ) : sections.map((s) => {
          const c = count(s.tasks);
          if (s.doc) return (
            <section key={`d-${s.name}`} className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="font-semibold">Médico: {s.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{fmtDate(date)} · {docLine(s.tasks)}</p>
              <ul className="mt-3 divide-y divide-border text-sm">
                {s.tasks.length === 0 && <li className="py-2 text-muted-foreground">Nenhum atendimento.</li>}
                {s.tasks.map((t) => (
                  <li key={t.id} className="py-2">{t.title} <span className="text-xs text-muted-foreground">· {t.school} · {shiftLabel(t.shift)}</span></li>
                ))}
              </ul>
            </section>
          );
          return (
            <section key={s.name} className="rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="font-semibold">{s.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{fmtDate(date)} · {totalsLine(c)}</p>
              <ul className="mt-3 divide-y divide-border text-sm">
                {s.tasks.map((t) => {
                  const st = statusOf(t);
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-2 py-2">
                      <span className="min-w-0 truncate">{t.title} <span className="text-xs text-muted-foreground">· {shiftLabel(t.shift)}{t.done ? ` · ${dn(t)}` : ""}</span></span>
                      <StatusPill s={st} />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        {tab !== "escola" && (tab === "medico" ? attended.length > 0 : all.total > 0) && (
          <section className="rounded-2xl bg-accent p-4 text-accent-foreground">
            <h2 className="font-bold">Total geral</h2>
            <p className="mt-1 text-sm">{tab === "medico" ? plural(attended.length, "atendimento", "atendimentos") : totalsLine(all)}</p>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-xl gap-2 bg-background px-3 py-4">
        <button onClick={() => downloadPdf(makePdf(), fileName)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-medium text-primary-foreground">
          <Download className="h-5 w-5" /> Baixar PDF
        </button>
        <button onClick={() => sharePdf(makePdf(), fileName)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-secondary font-medium text-secondary-foreground">
          <Share2 className="h-5 w-5" /> Compartilhar PDF
        </button>
      </div>
    </div>
  );
}
