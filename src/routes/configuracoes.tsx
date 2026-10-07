import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { useStore, useHydrated } from "@/lib/store";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Listta" },
      { name: "description", content: "Cadastre e edite os médicos que realizam os atendimentos no Listta." },
      { property: "og:title", content: "Configurações — Listta" },
      { property: "og:description", content: "Cadastre e edite os médicos que realizam os atendimentos no Listta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const hydrated = useHydrated();
  const doctors = useStore((s) => s.doctors);
  const [names, setNames] = useState<string[]>(["", "", ""]);
  useEffect(() => { if (hydrated) setNames([0, 1, 2].map((i) => doctors[i] ?? "")); }, [hydrated, doctors]);
  const save = () => {
    useStore.getState().setDoctors(names.map((n) => n.trim().toLocaleUpperCase("pt-BR")));
    toast.success("Médicos salvos");
  };
  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background pb-16">
      <header className="flex items-center gap-1 px-3 pt-4 pb-3">
        <Link to="/" aria-label="Voltar" className="grid h-11 w-11 place-items-center rounded-full hover:bg-muted"><ArrowLeft className="h-6 w-6" /></Link>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
      </header>
      {hydrated && (
        <main className="px-4">
          <section className="rounded-2xl bg-card p-4 shadow-soft">
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Stethoscope className="h-5 w-5 text-primary" /> Médicos</h2>
            <div className="space-y-2">
              {names.map((n, i) => (
                <input key={i} value={n} onChange={(e) => setNames(names.map((x, k) => (k === i ? e.target.value.toLocaleUpperCase("pt-BR") : x)))}
                  placeholder={`Nome do médico ${i + 1}`} className="h-12 w-full rounded-xl bg-muted px-3 text-base outline-none focus:ring-2 focus:ring-ring" />
              ))}
            </div>
            <button onClick={save} className="mt-4 h-12 w-full rounded-xl bg-primary font-semibold text-primary-foreground">Salvar</button>
          </section>
        </main>
      )}
    </div>
  );
}
