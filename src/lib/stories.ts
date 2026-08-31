/**
 * Utilitários das histórias em episódios.
 * Slug, tempo de leitura e geração do post para o Facebook.
 */

const SITE_URL = 'https://www.olhaqueduas.com';

/** Converte um título em slug: minúsculas, sem acentos, hífens. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/** Remove as tags de um HTML, devolvendo o texto corrido. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function countWords(html: string): number {
  const text = htmlToText(html);
  if (!text) return 0;
  return text.split(/\s+/).length;
}

/** Tempo de leitura a 200 palavras por minuto, mínimo 1. */
export function readingMinutes(html: string): number {
  return Math.max(1, Math.round(countWords(html) / 200));
}

export function episodeUrl(storySlug: string, number: number): string {
  return `${SITE_URL}/historias/${storySlug}/${number}`;
}

export function storyUrl(storySlug: string): string {
  return `${SITE_URL}/historias/${storySlug}`;
}

/**
 * Corta o texto num limite, recuando até ao fim de frase mais próximo
 * para o teaser não terminar a meio de uma palavra.
 */
export function cutAtSentence(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const slice = text.slice(0, limit);
  const lastStop = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('.\n'),
    slice.lastIndexOf('\n\n')
  );
  if (lastStop > limit * 0.5) return slice.slice(0, lastStop + 1).trim();
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : limit).trim()}…`;
}

export interface FacebookPostInput {
  storyTitle: string;
  storySlug: string;
  episodeNumber: number;
  episodeTitle: string;
  content: string;
  cliffhanger: string;
  /** Onde o link vai ficar — muda o texto da chamada e o UTM. */
  linkPlacement: 'comentario' | 'post';
  /** Quantos caracteres do episódio entram no post. */
  teaserLength?: number;
}

export interface FacebookPost {
  /** Texto para colar no post. */
  body: string;
  /** Texto para colar no primeiro comentário (vazio se o link vai no post). */
  comment: string;
  /** URL com UTM, isolada para quem quiser copiar só o link. */
  url: string;
}

/**
 * Monta o post do Facebook a partir do episódio.
 *
 * O Facebook penaliza posts que mandam a pessoa para fora, por isso a
 * variante recomendada põe o texto todo no post e o link só no primeiro
 * comentário. O UTM vai sempre preenchido para o Umami conseguir
 * comparar as duas variantes.
 */
export function buildFacebookPost({
  storyTitle,
  storySlug,
  episodeNumber,
  episodeTitle,
  content,
  cliffhanger,
  linkPlacement,
  teaserLength = 900,
}: FacebookPostInput): FacebookPost {
  const url = `${episodeUrl(storySlug, episodeNumber + 1)}?utm_source=facebook&utm_medium=social&utm_campaign=${storySlug}&utm_content=${linkPlacement}`;

  const teaser = cutAtSentence(htmlToText(content), teaserLength);
  const hook = cliffhanger.trim();

  const header = `📖 ${storyTitle.toUpperCase()} — Episódio ${episodeNumber}${
    episodeTitle ? `: ${episodeTitle}` : ''
  }`;

  const cta =
    linkPlacement === 'comentario'
      ? '👉 O episódio seguinte já está no site. Link no primeiro comentário.'
      : `👉 Continua aqui: ${url}`;

  const body = [header, '', teaser, hook ? `\n${hook}` : '', '', cta]
    .filter((line) => line !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const comment =
    linkPlacement === 'comentario'
      ? `Episódio ${episodeNumber + 1} 👇\n${url}`
      : '';

  return { body, comment, url };
}
