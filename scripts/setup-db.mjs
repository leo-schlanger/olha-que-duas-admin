import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jjifjbdfpvgeseqbjpkg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqaWZqYmRmcHZnZXNlcWJqcGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMjMwNjYsImV4cCI6MjA4Njg5OTA2Nn0.NPrKofAD8FucGrVvfnlVFJSxIaCpTn1IFW7WB5UC948';

const supabase = createClient(supabaseUrl, supabaseKey);

// Imagem padrão placeholder (1x1 pixel transparente em base64 como fallback)
const DEFAULT_ICON = 'https://placehold.co/128x128/8B5CF6/white?text=';

// Eventos do cronograma existente
const events = [
  { name: 'Nutrição', description: 'Programa sobre alimentação saudável' },
  { name: 'Motivar', description: 'Motivação e desenvolvimento pessoal' },
  { name: 'Prazer Feminino', description: 'Programa sobre sexualidade feminina' },
  { name: 'Companheiros de Caminhada', description: 'Histórias e companheirismo' },
  { name: 'Dizem que...', description: 'Conversas e curiosidades' },
  { name: 'Olha que Duas!', description: 'O programa principal' },
];

// Programação semanal (day_of_week: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab)
const schedule = [
  { event: 'Nutrição', day: 1, times: ['12:00', '19:00'] },
  { event: 'Motivar', day: 2, times: ['12:00', '19:00'] },
  { event: 'Prazer Feminino', day: 3, times: ['21:00', '00:00'] },
  { event: 'Companheiros de Caminhada', day: 4, times: ['12:00', '19:00'] },
  { event: 'Dizem que...', day: 5, times: ['12:00', '19:00'] },
  { event: 'Olha que Duas!', day: 6, times: ['11:00', '19:00', '00:00'] },
];

async function checkTablesExist() {
  console.log('Verificando se as tabelas existem...');

  const { data, error } = await supabase.from('events').select('id').limit(1);

  if (error && error.code === '42P01') {
    console.log('❌ Tabelas não existem. Execute o SQL no Supabase Dashboard primeiro.');
    console.log('\nSQL para executar:');
    console.log(`
-- Criar tabela events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela schedule
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, day_of_week, time)
);

-- Habilitar RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Allow all on events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on schedule" ON schedule FOR ALL USING (true) WITH CHECK (true);
    `);
    return false;
  }

  if (error) {
    console.log('Erro:', error.message);
    return false;
  }

  console.log('✅ Tabelas existem!');
  return true;
}

async function insertEvents() {
  console.log('\nInserindo eventos...');

  const eventMap = {};

  for (const event of events) {
    // Verifica se já existe
    const { data: existing } = await supabase
      .from('events')
      .select('id')
      .eq('name', event.name)
      .single();

    if (existing) {
      console.log(`  ⏭️  ${event.name} já existe`);
      eventMap[event.name] = existing.id;
      continue;
    }

    // Cria o evento com imagem placeholder
    const iconUrl = DEFAULT_ICON + encodeURIComponent(event.name.charAt(0));

    const { data, error } = await supabase
      .from('events')
      .insert({
        name: event.name,
        description: event.description,
        icon_url: iconUrl,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.log(`  ❌ Erro ao criar ${event.name}:`, error.message);
    } else {
      console.log(`  ✅ ${event.name} criado`);
      eventMap[event.name] = data.id;
    }
  }

  return eventMap;
}

async function insertSchedule(eventMap) {
  console.log('\nInserindo programação...');

  for (const item of schedule) {
    const eventId = eventMap[item.event];
    if (!eventId) {
      console.log(`  ⚠️  Evento ${item.event} não encontrado`);
      continue;
    }

    for (const time of item.times) {
      // Verifica se já existe
      const { data: existing } = await supabase
        .from('schedule')
        .select('id')
        .eq('event_id', eventId)
        .eq('day_of_week', item.day)
        .eq('time', time)
        .single();

      if (existing) {
        console.log(`  ⏭️  ${item.event} - Dia ${item.day} ${time} já existe`);
        continue;
      }

      const { error } = await supabase
        .from('schedule')
        .insert({
          event_id: eventId,
          day_of_week: item.day,
          time: time,
          is_active: true,
        });

      if (error) {
        console.log(`  ❌ Erro ao criar ${item.event} ${time}:`, error.message);
      } else {
        console.log(`  ✅ ${item.event} - Dia ${item.day} ${time}`);
      }
    }
  }
}

async function main() {
  console.log('🚀 Setup do banco de dados Olha que Duas Admin\n');

  const tablesExist = await checkTablesExist();

  if (!tablesExist) {
    console.log('\n⚠️  Execute o SQL acima no Supabase Dashboard e rode este script novamente.');
    process.exit(1);
  }

  const eventMap = await insertEvents();
  await insertSchedule(eventMap);

  console.log('\n✅ Setup concluído!');
}

main().catch(console.error);
