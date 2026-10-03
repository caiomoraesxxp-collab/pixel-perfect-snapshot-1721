import { Moon, Sun } from "lucide-react";
import { useStore } from "@/lib/store";

export function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const toggle = useStore((s) => s.toggleTheme);
  return (
    <button onClick={toggle} aria-label="Alternar tema" className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground hover:bg-muted">
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
