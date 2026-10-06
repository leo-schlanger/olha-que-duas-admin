export const PUBLIC_SITE = 'https://www.olhaqueduas.com';

/** Caminhos do site (`/exclusivo/foto.jpg`) não abrem em admin.olhaqueduas.com. */
export function publicMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;
  return `${PUBLIC_SITE}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Capa 1200×630 para WhatsApp e Facebook, com a foto inteira e barras pretas. */
export function renderShareImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const fail = (message: string) => {
      URL.revokeObjectURL(url);
      reject(new Error(message));
    };
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const context = canvas.getContext('2d');
      if (!context) {
        fail('Não foi possível preparar a imagem de partilha.');
        return;
      }
      context.fillStyle = '#000000';
      context.fillRect(0, 0, 1200, 630);
      const scale = Math.min(1200 / image.width, 630 / image.height);
      const width = Math.round(image.width * scale);
      const height = Math.round(image.height * scale);
      context.drawImage(image, (1200 - width) / 2, (630 - height) / 2, width, height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) {
          reject(new Error('Não foi possível preparar a imagem de partilha.'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.9);
    };
    image.onerror = () => fail('Não foi possível ler a foto.');
    image.src = url;
  });
}

export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
