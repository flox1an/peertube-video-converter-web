import { useState } from 'react';
import { fetchPeerTubeVideo, toApiUrl } from './lib/peertube';
import { convertToNip71 } from './lib/nip71';
import type { UnsignedNostrEvent } from './lib/nip71';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<UnsignedNostrEvent | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = async () => {
    if (!url.trim()) {
      setError('Please enter a PeerTube video URL');
      return;
    }

    setLoading(true);
    setError(null);
    setEvent(null);

    try {
      const apiUrl = toApiUrl(url);
      const video = await fetchPeerTubeVideo(url);
      const nip71Event = convertToNip71(video, apiUrl);
      setEvent(nip71Event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!event) return;
    await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConvert();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">PeerTube to NIP-71 Converter</h1>
        <p className="text-gray-400 mb-8">
          Convert PeerTube video metadata to a Nostr NIP-71 video event
        </p>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://bitcointv.com/w/gVhn2LkD6ssFQZuEVZr8xC"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <button
            onClick={handleConvert}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Loading...' : 'Convert'}
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {event && (
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <span className="text-sm text-gray-400">NIP-71 Event (kind {event.kind})</span>
              <button
                onClick={handleCopy}
                className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {JSON.stringify(event, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <p>
            Note: SHA256 file hashes (x tag) are not available from PeerTube's API.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
