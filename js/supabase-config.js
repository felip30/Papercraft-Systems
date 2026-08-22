/**
 * SUPABASE CONFIG - PaperCraft Systems
 *
 * Inicializa el cliente de Supabase para todo el sitio.
 * Requiere que el CDN de Supabase esté cargado ANTES que este archivo:
 *
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="js/supabase-config.js"></script>   <!-- o ../js/ dentro de /pages -->
 *
 * La "Publishable Key" (anon key) está pensada para vivir en el cliente:
 * no es un secreto — el acceso real a los datos se controla con las
 * políticas de Row Level Security (RLS) definidas en /sql.
 */

const SUPABASE_URL = 'https://gkfhvswmxjqzsbfmhzph.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ih22pgpCe5JeSImMjE7hWQ_M7yb4Odo';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Disponible globalmente para el resto de scripts del sitio.
window.supabaseClient = supabaseClient;
