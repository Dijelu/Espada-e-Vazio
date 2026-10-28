import { supabase } from "./supabase";
import { normalizar, type Ficha } from "../regras/ficha";

export interface FichaSalva {
  id: string;
  nome: string;
  data: Ficha;
  atualizado: string;
}

interface Linha {
  id: string;
  name: string;
  data: Partial<Ficha>;
  updated_at: string;
}

const paraFicha = (l: Linha): FichaSalva => ({ id: l.id, nome: l.name, data: normalizar(l.data), atualizado: l.updated_at });

export async function listarFichas(): Promise<FichaSalva[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("characters").select("id,name,data,updated_at").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as Linha[]).map(paraFicha);
}

export async function lerFicha(id: string): Promise<FichaSalva | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("characters").select("id,name,data,updated_at").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? paraFicha(data as Linha) : null;
}

export async function criarFicha(ficha: Ficha, donoId: string): Promise<string> {
  if (!supabase) throw new Error("Sem conexão com o banco.");
  const { data, error } = await supabase
    .from("characters")
    .insert({ owner_id: donoId, name: ficha.nome || "Sem nome", data: ficha })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function salvarFicha(id: string, ficha: Ficha): Promise<void> {
  if (!supabase) throw new Error("Sem conexão com o banco.");
  const { error } = await supabase
    .from("characters")
    .update({ name: ficha.nome || "Sem nome", data: ficha, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function apagarFicha(id: string): Promise<void> {
  if (!supabase) throw new Error("Sem conexão com o banco.");
  const { error } = await supabase.from("characters").delete().eq("id", id);
  if (error) throw error;
}
