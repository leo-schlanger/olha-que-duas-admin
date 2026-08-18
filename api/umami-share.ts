const ALLOWED_ENDPOINTS = new Set(['stats', 'pageviews', 'metrics']);
const SHARE_TOKEN_TTL_MS = 50 * 60 * 1000;
const UA =
  'Mozilla/5.0 (compatible; OlhaQueDuasAdmin/1.0; +https://olhaqueduas.com)';

type ShareSession = {
  websiteId: string;
  token: string;
  expiresAt: number;
};

const sessionCache = new Map<string, ShareSession>();

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function cloudApiBase(region: string): string {
  return `https://cloud.umami.is/analytics/${region}/api`;
}

async function getShareSession(shareId: string, region: string): Promise<ShareSession> {
  const cacheKey = `${region}:${shareId}`;
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const response = await fetch(`${cloudApiBase(region)}/share/${shareId}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Umami share error: ${response.status} ${text.slice(0, 180)}`);
  }

  const payload = (await response.json()) as { websiteId?: string; token?: string };
  if (!payload.websiteId || !payload.token) {
    throw new Error('Umami share response missing websiteId/token');
  }

  const session = {
    websiteId: payload.websiteId,
    token: payload.token,
    expiresAt: Date.now() + SHARE_TOKEN_TTL_MS,
  };
  sessionCache.set(cacheKey, session);
  return session;
}

async function fetchShareEndpoint(
  session: ShareSession,
  region: string,
  endpoint: string,
  params: URLSearchParams,
): Promise<Response> {
  const umamiUrl = `${cloudApiBase(region)}/websites/${session.websiteId}/${endpoint}?${params.toString()}`;
  return fetch(umamiUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': UA,
      'x-umami-share-token': session.token,
      'x-umami-share-context': '1',
    },
  });
}

export async function handleUmamiProxy(requestUrl: string): Promise<Response> {
  const url = new URL(requestUrl);
  const endpoint = url.searchParams.get('endpoint');

  if (!endpoint || !ALLOWED_ENDPOINTS.has(endpoint)) {
    return json({ error: 'Invalid endpoint' }, 400);
  }

  const shareId = url.searchParams.get('shareId') || '';
  const region = (url.searchParams.get('region') || 'eu').toLowerCase();
  if (!shareId) {
    return json({ error: 'Missing shareId' }, 400);
  }

  const umamiParams = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (['endpoint', 'shareId', 'region'].includes(key)) return;
    umamiParams.set(key, key === 'type' && value === 'url' ? 'path' : value);
  });

  try {
    let session = await getShareSession(shareId, region);
    let response = await fetchShareEndpoint(session, region, endpoint, umamiParams);
    if (response.status === 401) {
      sessionCache.delete(`${region}:${shareId}`);
      session = await getShareSession(shareId, region);
      response = await fetchShareEndpoint(session, region, endpoint, umamiParams);
    }

    if (!response.ok) {
      const errorText = await response.text();
      return json({ error: `Umami API error: ${response.status}`, detail: errorText.slice(0, 200) }, 502);
    }

    return json(await response.json());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return json({ error: message }, 500);
  }
}
