import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (supabaseUrl && supabaseAnonKey) {
  console.log('✓ Supabase configurado:', supabaseUrl);
} else {
  console.warn('⚠ Supabase não configurado. Usando localStorage como fallback.');
  console.warn('Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para verificar se Supabase está configurado
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Health-check rápido: executa uma query de teste no momento da importação
// e mostra status/erro detalhado para facilitar debug (401, CORS, PGRST errors).
if (isSupabaseConfigured()) {
  (async () => {
    try {
      const res = await supabase.from('services').select('id').limit(1);
      console.log('Supabase health-check:', {
        url: supabaseUrl,
        status: (res as any)?.status ?? 'unknown',
        error: (res as any)?.error ?? null,
        dataSample: Array.isArray((res as any)?.data) ? ((res as any).data.length ? (res as any).data[0] : null) : null,
      });
    } catch (err) {
      console.warn('Supabase health-check failed:', err);
    }
  })();
}

