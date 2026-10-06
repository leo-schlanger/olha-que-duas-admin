-- ============================================================
-- Exclusivo Olha que Duas — coluna do Eduardo Vinagre
-- O site lê só o que está publicado e cuja data já chegou.
-- Escrita: administradores (is_admin()).
-- ============================================================

CREATE TABLE IF NOT EXISTS vinagre_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(140) NOT NULL UNIQUE,
  title VARCHAR(240) NOT NULL,
  excerpt VARCHAR(400) NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vinagre_posts_published
  ON vinagre_posts (is_published, published_at DESC);

CREATE OR REPLACE FUNCTION set_vinagre_post_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vinagre_posts_updated_at ON vinagre_posts;
CREATE TRIGGER trg_vinagre_posts_updated_at
  BEFORE UPDATE ON vinagre_posts
  FOR EACH ROW EXECUTE FUNCTION set_vinagre_post_updated_at();

ALTER TABLE vinagre_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published vinagre posts" ON vinagre_posts;
CREATE POLICY "Public read published vinagre posts" ON vinagre_posts
  FOR SELECT USING (
    is_published = true
    AND (published_at IS NULL OR published_at <= NOW())
  );

DROP POLICY IF EXISTS "Admin read vinagre posts" ON vinagre_posts;
CREATE POLICY "Admin read vinagre posts" ON vinagre_posts
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "Admin write vinagre posts" ON vinagre_posts;
CREATE POLICY "Admin write vinagre posts" ON vinagre_posts
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

GRANT SELECT ON vinagre_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON vinagre_posts TO authenticated;
GRANT ALL ON vinagre_posts TO service_role;

INSERT INTO vinagre_posts (slug, title, excerpt, content, cover_url, is_published, published_at)
VALUES (
  'abel-dias-o-ze-nunca-bateu-na-betty',
  'Abel Dias diz em tribunal que "o Zé nunca bateu na Betty"',
  'Desmentido oficial: "Na casa de Nova Iorque, no aniversário de Betty? Jamais!"',
  $html$<p>Decorreu esta terça-feira, 6 de Outubro, uma nova sessão do julgamento de José Castelo Branco no Tribunal de Cascais. O socialite está acusado de violência doméstica contra a mulher, Betty Grafstein.</p>
<blockquote><p>Desmentido oficial: "Na casa de Nova Iorque, no aniversário de Betty? Jamais!"</p></blockquote>
<p>A frase é de Abel Dias. Pelo que recolhi, em exclusivo, junto do socialite, ele "nunca esteve quinze dias na casa de Nova Iorque em nenhum aniversário da Betty. É totalmente falso. Foi mais uma mentira."</p>
<h2>O que Abel Dias disse à juíza</h2>
<p>Abel Dias é amigo de Betty, colunista social, pai de Miguel Dias e irmão de Fernanda Dias, icónica publisher da revista Caras. No tribunal, contou a sua verdade.</p>
<blockquote><p>"O José era bruto a falar, mas nunca o vi a bater fisicamente."</p></blockquote>
<p>"Assisti várias vezes a episódios de violência verbal. Uma das vezes chamei-o à atenção. Estava a ser demais. A Betty era uma boneca nas mãos dele."</p>
<p>Ainda em depoimento, Abel disse à juíza que o Zé escondia comida.</p>
<blockquote><p>"Tens de fazer dieta, estás gorda. Põe-te direita, pareces corcunda."</p></blockquote>
<p>Castelo Branco assistia por videoconferência e ficou chocado "com estas barbaridades".</p>
<p>Uma amiga de Betty Grafstein deu-me outra leitura do mesmo episódio. A questão da comida e da postura era algo que Betty até agradecia, por causa da fraqueza nos joelhos, e era também conselho dos médicos.</p>
<h2>David Motta muda o discurso</h2>
<p>Depois de almoço, chegou a vez de David Motta, "o amigo que chegou a viver com o casal tanto em Nova Iorque como em Sintra". Foi assim que o Correio da Manhã o apresentou.</p>
<p>No início do processo de violência doméstica, o comentador do programa "Passadeira Vermelha", dirigido por Hugo Mendes na SIC Caras e à noite na SIC, mostrou-se ao lado de Castelo Branco. Promoveu a inocência dele e chegou a fazer vídeos a apregoar isso. Está tudo na internet. É só procurar.</p>
<p>Hoje, a conversa é outra.</p>
<p>O filho de Maria das Dores diz que, até 2019, terá assistido a discussões, abanões e a um soco de mãos fechadas nas costas da mãe de Roger Basile.</p>
<p>Há um pormenor de calendário. No dia 1 de Janeiro de 2017, David viajou de madrugada para Portugal, logo depois da festa de passagem de ano. Confirmei-o nas redes sociais do Conde.</p>
<p>Não esteve, portanto, em Nova Iorque até 2019, nem desde a primavera de 2017. Esteve em Outubro de 2016 e regressou a 1 de Janeiro de 2017, dentro dos noventa dias do limite legal.</p>
<p>Em 2018 viveu com José no palacete de Sintra e esteve na produção da capa da revista de Cristina Ferreira, com entrevista a Castelo Branco. A apresentadora da TVI recorda essa capa. Foi uma das mais vendidas.</p>
<h2>Quem mais falou na sala</h2>
<p>Deborah Barton, a maquilhadora, diz ter visto "uma relação normal, com pequenas discussões". Assistiu também a atos que considera inaceitáveis. Betty, conta, "era uma sombra da mulher" que ela conhecera.</p>
<p>Maria da Luz, a empregada, jurou que comprava doces com o seu próprio dinheiro para dar à Lady.</p>
<p>Falou-se ainda do acidente do dedo, quando Luz ficou sem a falange, numa altura em que mantinha romances. Tórridos e internacionais.</p>
<h2>As contas que ficaram por pagar</h2>
<p>No fim da sessão, uma funcionária do departamento de cobranças da CUF revelou que Betty tem ainda faturas por pagar, no valor de cerca de 52 mil euros.</p>
<p>Roger tem "power of attorney". É uma procuração: o documento que dá a uma pessoa o poder de decidir em nome de outra. Cabe-lhe pagar as contas e cuidar de tudo.</p>
<p>Marcella Fernandes, que já tinha testemunhado, passou o dia inteiro no Tribunal de Cascais. A presença dela não era necessária.</p>
<p>Um ex-funcionário disse-me, a mim, em exclusivo, que Roger pagou a Marcella quando ela chegou a Portugal.</p>$html$,
  '/exclusivo/abel-dias-betty.jpg',
  true,
  '2026-10-06 20:06:00+01'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content;
