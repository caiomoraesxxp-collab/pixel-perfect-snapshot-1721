import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

export type PdfSection = { title: string; subtitle?: string; head: string[]; rows: string[][]; totals?: string };

export function buildPdf(title: string, info: string, sections: PdfSection[], footer?: string) {
  const doc = new jsPDF();
  doc.setFillColor(234, 106, 25);
  doc.rect(0, 0, 210, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20); doc.setFont("helvetica", "bold");
  doc.text("Listta", 14, 15);
  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.text(title, 196, 15, { align: "right" });
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.text(info, 14, 32);
  let y = 40;
  for (const s of sections) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text(s.title, 14, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    if (s.subtitle) { doc.text(s.subtitle, 14, y + 5); y += 5; }
    autoTable(doc, {
      startY: y + 3, head: [s.head], body: s.rows.length ? s.rows : [[ "Sem registros", ...s.head.slice(1).map(() => "") ]],
      headStyles: { fillColor: [46, 143, 90] }, styles: { fontSize: 9 }, margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    if (s.totals) { doc.setFontSize(9); doc.text(s.totals, 14, y); y += 10; }
  }
  if (footer) {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text(footer, 14, y);
  }
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(120);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 290);
  return doc;
}

export function downloadPdf(doc: jsPDF, name: string) {
  doc.save(name);
}

export async function sharePdf(doc: jsPDF, name: string) {
  const file = new File([doc.output("blob")], name, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); } catch { /* cancelado */ }
  } else {
    doc.save(name);
    toast("Compartilhamento não suportado aqui — o PDF foi baixado.");
  }
}
