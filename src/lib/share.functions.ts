import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tok = z.string().regex(/^[a-f0-9]{32,128}$/);

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const rand = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n))).map((b) => b.toString(16).padStart(2, "0")).join("");

export const createShare = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const viewToken = rand(24);
  const adminToken = rand(32);
  const { error } = await supabaseAdmin.from("shares").insert({ view_token: viewToken, admin_token_hash: await sha256(adminToken) });
  if (error) throw new Error("Não foi possível criar o link");
  return { viewToken, adminToken };
});

export const pushShare = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ viewToken: tok, adminToken: tok, data: z.any() }).parse(d))
  .handler(async ({ data }) => {
    const size = JSON.stringify(data.data ?? {}).length;
    if (size > 2_000_000) throw new Error("Dados grandes demais");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("shares").select("admin_token_hash").eq("view_token", data.viewToken).maybeSingle();
    if (!row || row.admin_token_hash !== (await sha256(data.adminToken))) throw new Error("Sem permissão");
    const { error } = await supabaseAdmin.from("shares").update({ data: data.data, updated_at: new Date().toISOString() }).eq("view_token", data.viewToken);
    if (error) throw new Error("Falha ao sincronizar");
    return { ok: true };
  });

export const getShare = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ viewToken: tok }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("shares").select("data, updated_at").eq("view_token", data.viewToken).maybeSingle();
    if (!row) return { found: false as const };
    return { found: true as const, json: JSON.stringify(row.data ?? {}), updatedAt: row.updated_at };
  });
