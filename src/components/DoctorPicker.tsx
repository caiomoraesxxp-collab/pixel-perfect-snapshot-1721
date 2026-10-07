import { toast } from "sonner";
import { Stethoscope } from "lucide-react";
import { useStore } from "@/lib/store";
import { doctorName } from "@/lib/schools";
import { cn } from "@/lib/utils";

export function DoctorChips({ value, onPick }: { value?: number | undefined; onPick: (i: number) => void }) {
  const doctors = useStore((s) => s.doctors);
  return (
    <div className="flex flex-wrap gap-2">
      {doctors.map((_, i) => (
        <button key={i} type="button" onClick={() => onPick(i)}
          className={cn("h-10 rounded-xl px-3 text-sm font-medium", value === i ? "bg-success text-primary-foreground" : "bg-muted text-foreground")}>
          {doctorName(doctors, i)}
        </button>
      ))}
    </div>
  );
}

// Non-blocking doctor choice: a toast with quick buttons, the queue stays usable.
export function askDoctor(listId: string, taskId: string, title: string) {
  const id = toast(
    <div className="w-full space-y-2">
      <p className="flex items-center gap-2 text-sm font-semibold"><Stethoscope className="h-4 w-4" /> Médico que atendeu {title}</p>
      <DoctorChips onPick={(i) => { useStore.getState().setDoctor(listId, taskId, i); toast.dismiss(id); }} />
    </div>,
    { duration: 10000 },
  );
}
