import { supabase } from "./supabase";
import { normalizar, type Ficha } from "../regras/ficha";
import { ameacaPadrao, normalizarAmeaca, type Ameaca } from "../regras/ameacas";

export interface Campanha {
  id: string;
  nome: string;
  codigo: string;
  dono: string;
}

export interface DadosNpc {
  ameaca: Ameaca;
  /** PV e PR de agora; null quer dizer cheio */
  pvAtual: number | null;
  prAtual: number | null;
  notas: string;
  /** os jogadores da mesa veem este NPC */
  revelado: boolean;
}

export interface Npc {
  id: string;
  nome: string;
  dados: DadosNpc;
}

export interface FichaDaMesa {
  id: string;
  nome: string;
  dono: string;
  ficha: Ficha;
}

const banco = () => {
  if (!supabase) throw new Error("Sem conexão com o banco.");
  return supabase;
};

export const npcVazio = (): DadosNpc => ({ ameaca: ameacaPadrao(), pvAtual: null, prAtual: null, notas: "", revelado: false });

export function normalizarNpc(d: Partial<DadosNpc> | null): DadosNpc {
  const o = d ?? {};
  const val = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : null);
  return {
    ameaca: normalizarAmeaca(o.ameaca),
    pvAtual: val(o.pvAtual),
    prAtual: val(o.prAtual),
    notas: typeof o.notas === "string" ? o.notas : "",
    revelado: o.revelado === true,
  };
}

interface LinhaCamp { id: string; name: string; join_code: string; owner_id: string }
const paraCamp = (l: LinhaCamp): Campanha => ({ id: l.id, nome: l.name, codigo: l.join_code, dono: l.owner_id });

export async function listarCampanhas(): Promise<Campanha[]> {
  const { data, error } = await banco().from("campaigns").select("id,name,join_code,owner_id").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as LinhaCamp[]).map(paraCamp);
}

export async function lerCampanha(id: string): Promise<Campanha | null> {
  const { data, error } = await banco().from("campaigns").select("id,name,join_code,owner_id").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? paraCamp(data as LinhaCamp) : null;
}

export async function criarCampanha(nome: string, donoId: string): Promise<string> {
  const { data, error } = await banco().from("campaigns").insert({ owner_id: donoId, name: nome }).select("id").single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function entrarNaCampanha(codigo: string): Promise<string> {
  const { data, error } = await banco().rpc("join_campaign", { code: codigo.trim() });
  if (error) throw error;
  return data as string;
}

export async function sairDaCampanha(id: string): Promise<void> {
  const { error } = await banco().rpc("leave_campaign", { cid: id });
  if (error) throw error;
}

export async function apagarCampanha(id: string): Promise<void> {
  const { error } = await banco().from("campaigns").delete().eq("id", id);
  if (error) throw error;
}

/** Fichas ligadas à mesa. O Mestre vê as de todos; cada jogador só as próprias. */
export async function fichasDaMesa(id: string): Promise<FichaDaMesa[]> {
  const { data, error } = await banco().from("characters").select("id,name,owner_id,data").eq("campaign_id", id).order("name");
  if (error) throw error;
  return (data as { id: string; name: string; owner_id: string; data: Partial<Ficha> }[]).map((l) => ({ id: l.id, nome: l.name, dono: l.owner_id, ficha: normalizar(l.data) }));
}

export async function ligarFicha(fichaId: string, campanhaId: string | null): Promise<void> {
  const { error } = await banco().from("characters").update({ campaign_id: campanhaId }).eq("id", fichaId);
  if (error) throw error;
}

export async function minhasFichasSemMesa(): Promise<{ id: string; nome: string }[]> {
  const { data, error } = await banco().from("characters").select("id,name").is("campaign_id", null).order("name");
  if (error) throw error;
  return (data as { id: string; name: string }[]).map((l) => ({ id: l.id, nome: l.name }));
}

export async function listarNpcs(id: string): Promise<Npc[]> {
  const { data, error } = await banco().from("npcs").select("id,name,data").eq("campaign_id", id).order("created_at");
  if (error) throw error;
  return (data as { id: string; name: string; data: Partial<DadosNpc> }[]).map((l) => ({ id: l.id, nome: l.name, dados: normalizarNpc(l.data) }));
}

export async function criarNpc(campanhaId: string, nome: string, ameaca?: Ameaca): Promise<Npc> {
  const dados = { ...npcVazio(), ...(ameaca ? { ameaca } : {}) };
  const { data, error } = await banco().from("npcs").insert({ campaign_id: campanhaId, name: nome || "NPC sem nome", data: dados }).select("id,name,data").single();
  if (error) throw error;
  const l = data as { id: string; name: string; data: Partial<DadosNpc> };
  return { id: l.id, nome: l.name, dados: normalizarNpc(l.data) };
}

export async function salvarNpc(n: Npc): Promise<void> {
  const { error } = await banco().from("npcs").update({ name: n.nome || "NPC sem nome", data: n.dados }).eq("id", n.id);
  if (error) throw error;
}

export async function apagarNpc(id: string): Promise<void> {
  const { error } = await banco().from("npcs").delete().eq("id", id);
  if (error) throw error;
}
