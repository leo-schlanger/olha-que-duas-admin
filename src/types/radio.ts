// AzuraCast Radio Types

export interface Song {
  id: string;
  text: string;
  artist: string;
  title: string;
  album: string;
  genre: string;
  lyrics: string;
  art: string;
  custom_fields: Record<string, string>;
}

export interface SongHistory {
  sh_id: number;
  played_at: number;
  duration: number;
  playlist: string;
  streamer: string;
  is_request: boolean;
  song: Song;
}

export interface StationMount {
  id: number;
  name: string;
  url: string;
  bitrate: number;
  format: string;
  listeners: {
    total: number;
    unique: number;
    current: number;
  };
}

export interface LiveInfo {
  is_live: boolean;
  streamer_name: string;
  broadcast_start: number | null;
  art: string | null;
}

export interface ListenersInfo {
  total: number;
  unique: number;
  current: number;
}

export interface NowPlayingInfo {
  sh_id: number;
  played_at: number;
  duration: number;
  playlist: string;
  streamer: string;
  is_request: boolean;
  song: Song;
  elapsed: number;
  remaining: number;
}

export interface Station {
  id: number;
  name: string;
  shortcode: string;
  description: string;
  frontend: string;
  backend: string;
  listen_url: string;
  url: string;
  public_player_url: string;
  playlist_pls_url: string;
  playlist_m3u_url: string;
  is_public: boolean;
  mounts: StationMount[];
  hls_enabled: boolean;
  hls_url: string | null;
  hls_listeners: number;
}

export interface RadioNowPlaying {
  station: Station;
  listeners: ListenersInfo;
  live: LiveInfo;
  now_playing: NowPlayingInfo;
  playing_next: NowPlayingInfo | null;
  song_history: SongHistory[];
  is_online: boolean;
  cache: string | null;
}

export interface ListenerInfo {
  ip: string;
  user_agent: string;
  hash: string;
  mount_is_local: boolean;
  mount_name: string;
  connected_on: number;
  connected_until: number;
  connected_time: number;
  device: {
    client: string;
    is_browser: boolean;
    is_mobile: boolean;
    is_bot: boolean;
  };
  location: {
    description: string;
    region: string;
    city: string;
    country: string;
    lat: number;
    lon: number;
  };
}

export interface ServerStats {
  cpu: {
    total: {
      name: string;
      usage: string;
    };
    cores: Array<{
      name: string;
      usage: string;
    }>;
    load: number[];
  };
  memory: {
    bytes: {
      total: number;
      used: number;
      cached: number;
    };
    readable: {
      total: string;
      used: string;
      cached: string;
    };
  };
  disk: {
    bytes: {
      total: number;
      used: number;
    };
    readable: {
      total: string;
      used: string;
    };
  };
  network: {
    received: {
      speed: {
        bytes: number;
        readable: string;
      };
      total: {
        bytes: number;
        readable: string;
      };
    };
    transmitted: {
      speed: {
        bytes: number;
        readable: string;
      };
      total: {
        bytes: number;
        readable: string;
      };
    };
  };
}

// Aggregated listener stats by country
export interface ListenersByCountry {
  country: string;
  count: number;
}

// Radio data state
export interface RadioData {
  nowPlaying: RadioNowPlaying | null;
  history: SongHistory[];
  listeners: ListenerInfo[];
  listenersByCountry: ListenersByCountry[];
}
