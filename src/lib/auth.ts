import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Login com Supabase Auth. Só entra quem tiver sessão válida E constar da
// tabela admin_users (verificado no servidor por is_admin()).
export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    return error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message;
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
  if (adminError || isAdmin !== true) {
    await supabase.auth.signOut();
    return 'Esta conta não tem acesso ao painel';
  }

  return null;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Headers para as edge functions que exigem sessão de administrador.
export async function authHeaders(json = false): Promise<Record<string, string>> {
  const session = await getSession();
  if (!session) {
    throw new Error('Sessão expirada. Entre novamente.');
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}
