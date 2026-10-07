export const SCHOOLS = [
  "EM AGOSTINHO MOREIRA E SILVA", "EM ALBA FROTA", "EM ALDEIDES REGIS", "EM ANTONIO CORREIA LIMA", "EM ANTONIO MENDES",
  "EM CASIMIRO JOSÉ DE LIMA FILHO", "EM CASTELO DE CASTRO", "EM CRISTO REDENTOR", "EMTI ALDEMIR MARTINS",
  "EMTI DEPUTADO ROBERTO MESQUITA", "EMTI NOSSA SENHORA DE FÁTIMA", "EM DOIS DE DEZEMBRO", "EM DOM ANTONIO BATISTA DE FRAGOSO",
  "EM DOM HELDER CÂMARA", "EM FRANCISCO DOMINGOS DA SILVA", "EM FRANCISCO EDILSON PINHEIRO", "EM FRANCISCO SILVA CAVALCANTE",
  "EM HERONDINA LIMA CAVALCANTE", "EM HILBERTO SILVA", "EM JADER DE FIGUEIREDO CORREIA", "EM JESUS CRISTO", "EM JOSÉ DE ALENCAR",
  "EM LORHAN MARQUES MEDEIROS", "EM MANOEL RODRIGUES", "EM MARIA DALVA SEVERINO MARREIRO", "EM MARIA MARIZA",
  "EM MARIA ROSELI LIMA MESQUITA", "EM MOURA BRASIL", "EM NOSSA SENHORA APARECIDA", "EM NOSSA SENHORA DO PERPÉTUO SOCORRO",
  "EM PATATIVA DO ASSARÉ", "EM PROFESSOR JOSÉ PARSIFAL BARROSO", "EM PROFESSOR JOSÉ REBOUÇAS MACAMBIRA", "EM QUINTINO CUNHA",
  "EM RACHEL DE QUEIROZ", "EM RAIMUNDO DE SOUSA MANGUEIRA", "EM REITOR PEDRO TEIXEIRA BARROSO", "EM SANTA TEREZA",
  "EM SÃO CURA DARS", "EM SÃO RAFAEL", "EM SEBASTIANA ALDIGUERI", "EM SECRETÁRIO PAULO PETROLA", "EM TERTULIANO CAMBRAIA",
  "EM VIRGÍLIO TÁVORA", "EM 11 DE AGOSTO",
];

export const norm = (s: string) => s.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{Diacritic}/gu, "");

export type Shift = "manha" | "tarde" | "noite";
export const SHIFTS: { key: Shift; label: string }[] = [
  { key: "manha", label: "Manhã" }, { key: "tarde", label: "Tarde" },
];
export const shiftLabel = (s?: string) => SHIFTS.find((x) => x.key === s)?.label ?? "—";

export type Status = "espera" | "atendido" | "faltou";
export const STATUS_LABEL: Record<Status, string> = { espera: "Em espera", atendido: "Atendidos", faltou: "Faltou" };
export const statusOf = (t: { done: boolean; absent?: boolean | undefined }): Status => (t.done ? "atendido" : t.absent ? "faltou" : "espera");
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const fmtDate = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString("pt-BR");

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
export const doctorName = (doctors: string[], i?: number) =>
  i === undefined ? "" : doctors[i]?.trim() || `Médico ${i + 1}`;
