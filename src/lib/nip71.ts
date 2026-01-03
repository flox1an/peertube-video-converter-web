import type { PeerTubeVideo } from './peertube';
import { getBaseUrl } from './peertube';

export interface NostrEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
  pubkey: string;
  id: string;
  sig: string;
}

export interface UnsignedNostrEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
}

type PeerTubeFile = PeerTubeVideo['files'][number];

// Calculate width from height assuming 16:9 aspect ratio
function getWidthFromHeight(height: number): number {
  return Math.round(height * 16 / 9);
}

function buildImetaTag(file: PeerTubeFile, baseUrl: string, duration?: number): string[] {
  const parts = ['imeta'];

  const url = file.fileUrl.startsWith('http') ? file.fileUrl : `${baseUrl}${file.fileUrl}`;
  parts.push(`url ${url}`);

  // Determine mime type from URL
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogv': 'video/ogg',
    'mov': 'video/quicktime',
    'm3u8': 'application/x-mpegURL',
  };
  if (ext && mimeTypes[ext]) {
    parts.push(`m ${mimeTypes[ext]}`);
  }

  if (file.size) {
    parts.push(`size ${file.size}`);
  }

  // dim should be WIDTHxHEIGHT - calculate width assuming 16:9
  if (file.resolution?.id && typeof file.resolution.id === 'number') {
    const height = file.resolution.id;
    const width = getWidthFromHeight(height);
    parts.push(`dim ${width}x${height}`);
  }

  // Calculate bitrate from size and duration (in bits per second)
  if (file.size && duration && duration > 0) {
    const bitrate = Math.round((file.size * 8) / duration);
    parts.push(`bitrate ${bitrate}`);
  }

  // Add magnet URI for torrent fallback
  if (file.magnetUri) {
    parts.push(`fallback ${file.magnetUri}`);
  }

  return parts;
}

export function convertToNip71(video: PeerTubeVideo, apiUrl: string): UnsignedNostrEvent {
  const baseUrl = getBaseUrl(apiUrl);
  const tags: string[][] = [];

  // d tag (identifier) - use video UUID
  tags.push(['d', video.uuid]);

  // title
  tags.push(['title', video.name]);

  // summary/description
  if (video.description) {
    tags.push(['summary', video.description]);
  }

  // published_at
  if (video.publishedAt) {
    const publishedTimestamp = Math.floor(new Date(video.publishedAt).getTime() / 1000);
    tags.push(['published_at', publishedTimestamp.toString()]);
  }

  // thumbnail
  if (video.thumbnailPath) {
    const thumbUrl = video.thumbnailPath.startsWith('http')
      ? video.thumbnailPath
      : `${baseUrl}${video.thumbnailPath}`;
    tags.push(['thumb', thumbUrl]);
  }

  // preview/image
  if (video.previewPath) {
    const previewUrl = video.previewPath.startsWith('http')
      ? video.previewPath
      : `${baseUrl}${video.previewPath}`;
    tags.push(['image', previewUrl]);
  }

  // duration in seconds
  if (video.duration) {
    tags.push(['duration', video.duration.toString()]);
  }

  // Collect all video files from streaming playlists
  video.streamingPlaylists?.forEach(playlist => {
    playlist.files.forEach(file => {
      tags.push(buildImetaTag(file, baseUrl, video.duration));
    });
  });

  // Also add direct files if available
  video.files?.forEach(file => {
    tags.push(buildImetaTag(file, baseUrl, video.duration));
  });

  // Add tags from PeerTube
  video.tags?.forEach(tag => {
    tags.push(['t', tag.toLowerCase()]);
  });

  // alt text for accessibility
  tags.push(['alt', `Video: ${video.name}`]);

  // Add source reference
  tags.push(['r', apiUrl]);

  // Add channel info
  if (video.channel?.displayName) {
    tags.push(['c', video.channel.displayName]);
  }

  // License info
  if (video.licence?.label && video.licence.label !== 'Unknown') {
    tags.push(['license', video.licence.label]);
  }

  // NSFW content warning (NIP-36)
  if (video.nsfw) {
    tags.push(['content-warning', 'nsfw']);
  }

  // Language (NIP-32 labeling with ISO-639-1)
  if (video.language?.id && video.language.label !== 'Unknown') {
    tags.push(['L', 'ISO-639-1']);
    tags.push(['l', video.language.id.toString(), 'ISO-639-1']);
  }

  // created_at - use originallyPublishedAt or publishedAt or createdAt
  const dateStr = video.originallyPublishedAt || video.publishedAt || video.createdAt;
  const createdAt = Math.floor(new Date(dateStr).getTime() / 1000);

  return {
    kind: 34235, // NIP-71 horizontal video
    created_at: createdAt,
    tags,
    content: video.description || '',
  };
}
