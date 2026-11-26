-- 14. Vault Gamer: pasa de localStorage a Supabase, así los cambios del
-- admin se ven en cualquier dispositivo. Ejecutar después de 01-usuarios.sql.

CREATE TABLE IF NOT EXISTS vault_games (
  id BIGSERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  estudio TEXT,
  categoria TEXT,
  icon TEXT DEFAULT 'gamepad',
  color TEXT DEFAULT '#00D9FF',
  imagen TEXT,
  resumen TEXT,
  descripcion_detallada TEXT,
  tutorial JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE vault_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vault Gamer visible para todos" ON vault_games;
CREATE POLICY "Vault Gamer visible para todos" ON vault_games
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Solo admin gestiona Vault Gamer" ON vault_games;
CREATE POLICY "Solo admin gestiona Vault Gamer" ON vault_games
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Semilla: los mismos 5 juegos que ya tenías cargados, para no perder el
-- contenido que ya existía en localStorage.
INSERT INTO vault_games (titulo, estudio, categoria, icon, color, resumen, descripcion_detallada, tutorial) VALUES
(
  'Minecraft', 'Mojang Studios', 'Sandbox / Supervivencia', 'dice', '#39FF14',
  'Juego de construcción y exploración en un mundo generado por bloques, donde reúnes recursos para crear herramientas, refugios y estructuras.',
  'Minecraft coloca al jugador en un mundo generado proceduralmente hecho de bloques, sin un objetivo obligatorio: se puede jugar en modo Supervivencia (gestionando salud, hambre y recursos) o Creativo (construcción libre sin límites). El ciclo día/noche introduce peligro real, ya que de noche aparecen criaturas hostiles. A medida que se progresa, se puede minar minerales cada vez más raros, explorar cuevas, y eventualmente viajar al Nether o al End para enfrentar al Ender Dragon, el "jefe final" no obligatorio del juego base.',
  '["Las primeras noches son las más peligrosas: prioriza construir un refugio cerrado antes de que oscurezca.", "Consigue madera y piedra primero; con piedra puedes fabricar herramientas mucho más resistentes que las de madera.", "Explora cuevas con antorchas para iluminar el camino y evitar que aparezcan enemigos a tus espaldas.", "Para vencer al Ender Dragon necesitas primero conseguir Ender Pearls y Blaze Powder para fabricar Eyes of Ender y localizar el portal al End."]'::jsonb
),
(
  'The Legend of Zelda: Breath of the Wild', 'Nintendo', 'Aventura / Mundo abierto', 'target', '#00D9FF',
  'Explora el reino de Hyrule con total libertad, resolviendo santuarios, escalando cualquier superficie y enfrentando enemigos con física dinámica.',
  'Link despierta sin memoria tras cien años de sueño, en un Hyrule dominado por Calamity Ganon. El juego se distingue por su libertad casi total: se puede escalar prácticamente cualquier superficie, usar el parapente para planear, y resolver los más de 100 Santuarios en el orden que se prefiera. El objetivo principal es rescatar a las cuatro Bestias Divinas y debilitar a Ganon antes del enfrentamiento final en el Castillo de Hyrule, aunque técnicamente se puede ir directo al jefe final desde el inicio del juego.',
  '["Cocina alimentos combinando ingredientes: mejoran mucho más la salud que comerlos crudos.", "La resistencia (stamina) determina cuánto puedes escalar o planear; súbela completando santuarios.", "Las armas se rompen con el uso, así que no dudes en usarlas antes de que se desgasten del todo.", "Antes de enfrentar a Calamity Ganon, completar las cuatro Bestias Divinas te da apoyo extra durante la pelea final."]'::jsonb
),
(
  'Dark Souls III', 'FromSoftware', 'RPG de acción', 'brain', '#FF006E',
  'RPG de acción conocido por su dificultad exigente, donde aprender el patrón de cada enemigo es la clave para avanzar.',
  'Ambientado en el reino en decadencia de Lothric, el jugador encarna a un No-Muerto que debe volver a sentar en el trono a los Señores de la Ceniza para posponer el fin del mundo. El combate es lento y táctico: gestionar la barra de resistencia, aprender los tiempos de ataque de cada enemigo y usar el entorno a favor son más importantes que la repetición de botones. El juego no tiene dificultad ajustable; en cambio, ofrece herrería, magia y builds muy variadas para adaptar el estilo de juego.',
  '["Observa el patrón de ataque de cada enemigo antes de atacar; casi todos los jefes son vencibles memorizando sus movimientos.", "Administra tu resistencia (stamina): atacar o esquivar sin control te deja vulnerable.", "Vuelve seguido a recoger tus almas si mueres cerca de donde las perdiste, o las perderás para siempre.", "Sube primero Vitalidad y Resistencia antes de invertir mucho en daño; sobrevivir es más importante al inicio que pegar fuerte."]'::jsonb
),
(
  'Stardew Valley', 'ConcernedApe', 'Simulador de granja', 'palette', '#39FF14',
  'Hereda una granja abandonada y decide cómo cultivarla: agricultura, ganadería, pesca y relaciones con el pueblo.',
  'El jugador hereda la granja de su abuelo en Stardew Valley, huyendo de un trabajo corporativo sin sentido. No hay un final obligatorio: se puede cultivar, criar animales, pescar, minar, o dedicarse por completo a socializar con los habitantes del pueblo, e incluso casarse con uno de ellos. El "Community Center" ofrece una meta de largo plazo: restaurarlo cumpliendo paquetes temáticos (Bundles) para desbloquear mejoras y recompensas en toda la comunidad.',
  '["Planta cultivos según la temporada; cada uno solo crece en primavera, verano u otoño.", "Riega tus cultivos todos los días — un día sin agua puede retrasar la cosecha.", "Habla con los aldeanos y regálales objetos que les gusten para subir su amistad y desbloquear recompensas.", "Explora las minas apenas puedas: dan minerales para mejorar herramientas y acceso a nuevas zonas del valle."]'::jsonb
),
(
  'Hollow Knight', 'Team Cherry', 'Metroidvania', 'drama', '#00D9FF',
  'Explora el reino subterráneo de Hallownest, ganando nuevas habilidades que abren rutas antes inaccesibles del mapa.',
  'Un pequeño caballero insecto desciende al reino en ruinas de Hallownest para descubrir el origen de una plaga que consumió a sus habitantes. El mapa es un gran laberinto interconectado: nuevas habilidades (como el doble salto o el dash) abren constantemente rutas que antes eran inaccesibles, incentivando volver sobre zonas ya visitadas. El combate combina precisión de plataformas con jefes desafiantes, y el juego recompensa la exploración minuciosa con mejoras opcionales de vida, magia y equipo (Charms).',
  '["Usa los bancos para guardar progreso y marca el mapa con el cartógrafo Cornifer cuando lo encuentres.", "El \"geo\" (moneda del juego) se pierde al morir, pero puedes recuperarlo si llegas de nuevo al lugar donde caíste.", "Vuelve a zonas ya visitadas después de conseguir una habilidad nueva: casi siempre hay caminos que antes estaban bloqueados.", "Equipa Charms según la situación: unos ayudan en combate contra jefes y otros facilitan la exploración y el farmeo de geo."]'::jsonb
)
ON CONFLICT DO NOTHING;
