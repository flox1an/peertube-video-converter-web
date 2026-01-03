export interface PeerTubeVideo {
  id: number;
  uuid: string;
  shortUUID: string;
  name: string;
  category: LabeledValue | null;
  licence: LabeledValue | null;
  language: LabeledValue | null;
  privacy: LabeledValue;
  nsfw: boolean;
  description: string | null;
  isLocal: boolean;
  duration: number;
  views: number;
  likes: number;
  dislikes: number;
  thumbnailPath: string;
  previewPath: string;
  embedPath: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  originallyPublishedAt: string | null;
  isLive: boolean;
  account: PeerTubeAccount;
  channel: PeerTubeChannel;
  blacklisted: boolean;
  blacklistedReason: string | null;
  support: string | null;
  descriptionPath: string;
  tags: string[];
  commentsEnabled: boolean;
  downloadEnabled: boolean;
  waitTranscoding: boolean;
  state: LabeledValue;
  trackerUrls: string[];
  files: PeerTubeFile[];
  streamingPlaylists: StreamingPlaylist[];
}

export interface LabeledValue {
  id: number | null;
  label: string;
}

export interface Avatar {
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface PeerTubeAccount {
  url: string;
  name: string;
  host: string;
  avatar: Avatar | null;
  id: number;
  hostRedundancyAllowed: boolean;
  followingCount: number;
  followersCount: number;
  banner: string | null;
  createdAt: string;
  displayName: string;
  description: string;
  updatedAt: string;
  userId: number;
}

export interface PeerTubeChannel {
  url: string;
  name: string;
  host: string;
  avatar: Avatar | null;
  id: number;
  hostRedundancyAllowed: boolean;
  followingCount: number;
  followersCount: number;
  banner: string | null;
  createdAt: string;
  displayName: string;
  description: string;
  support: string | null;
  isLocal: boolean;
  updatedAt: string;
  ownerAccount: PeerTubeAccount;
}

export interface PeerTubeFile {
  resolution: LabeledValue;
  magnetUri: string;
  size: number;
  fps: number;
  torrentUrl: string;
  torrentDownloadUrl: string;
  fileUrl: string;
  fileDownloadUrl: string;
  metadataUrl: string;
}

export interface StreamingPlaylist {
  id: number;
  type: number;
  playlistUrl: string;
  segmentsSha256Url: string;
  redundancies: unknown[];
  files: PeerTubeFile[];
}

/**
 * Convert any PeerTube URL to an API URL
 * Supports:
 * - /w/{id} (short watch URL)
 * - /videos/watch/{id} (long watch URL)
 * - /api/v1/videos/{id} (already API URL)
 */
export function toApiUrl(inputUrl: string): string {
  const url = new URL(inputUrl);
  const baseUrl = `${url.protocol}//${url.host}`;
  const path = url.pathname;

  // Already an API URL
  if (path.startsWith('/api/v1/videos/')) {
    return inputUrl;
  }

  // Short watch URL: /w/{videoId}
  const shortMatch = path.match(/^\/w\/([^/]+)/);
  if (shortMatch) {
    return `${baseUrl}/api/v1/videos/${shortMatch[1]}`;
  }

  // Long watch URL: /videos/watch/{videoId}
  const longMatch = path.match(/^\/videos\/watch\/([^/]+)/);
  if (longMatch) {
    return `${baseUrl}/api/v1/videos/${longMatch[1]}`;
  }

  // Return as-is if no pattern matched
  return inputUrl;
}

export async function fetchPeerTubeVideo(inputUrl: string): Promise<PeerTubeVideo> {
  const apiUrl = toApiUrl(inputUrl);
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function getBaseUrl(inputUrl: string): string {
  const url = new URL(inputUrl);
  return `${url.protocol}//${url.host}`;
}
