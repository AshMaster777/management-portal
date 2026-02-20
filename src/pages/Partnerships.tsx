import { useState, useEffect } from 'react';
import { Check, X, Settings, MessageCircle } from 'lucide-react';
import { api } from '../api/client';

const MEDIA_BASE = import.meta.env.VITE_PRODUCT_RESOURCES_URL || '/productresources';

/** Returns true if URL is likely an image (extension or Discord CDN) */
function isImageUrl(url: string): boolean {
  const u = url.split('?')[0].toLowerCase();
  if (u.includes('cdn.discordapp.com/attachments')) return true;
  return /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(u);
}

/** Extract image URLs from text (standalone URLs or in parentheses/backticks) */
function extractImageUrls(content: string): string[] {
  const urlRegex = /https?:\/\/[^\s\]\)\`'"]+/g;
  const found = new Set<string>();
  let m;
  while ((m = urlRegex.exec(content)) !== null) {
    const url = m[0].replace(/[)\]`]+$/, ''); // trim trailing delimiters
    if (isImageUrl(url)) found.add(url);
  }
  return Array.from(found);
}

/** Image with fallback when Discord CDN returns 404 (expired/deleted attachments) */
function BrokenImagePlaceholder({ src, className = 'max-h-48' }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`${className} max-w-full min-w-[120px] min-h-[80px] rounded flex items-center justify-center bg-[#1e1f22] border border-[#3f4147] text-[#6b7280] text-xs px-3 py-2 text-center`}>
        Image unavailable
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className={`${className} max-w-full rounded object-contain bg-[#1e1f22] border border-[#3f4147]`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

/** Renders text with Discord-style formatting and renders any image URLs in the content as actual images */
function DiscordPreviewContent({ content }: { content: string }) {
  const imageUrls = extractImageUrls(content);
  const lines = content.split(/\n/);
  return (
    <>
      <div className="discord-preview__content text-[15px] leading-[1.375rem] whitespace-pre-wrap">
        {lines.map((line, i) => {
          const trimmed = line.trimStart();
          const isHeading = /^#+\s/.test(trimmed) || /^\*\*#/.test(trimmed);
          const formatted = formatDiscordInline(line);
          return (
            <div key={i} className={i > 0 ? 'mt-1' : ''}>
              {isHeading ? <span className="font-bold text-base block mt-2 first:mt-0">{formatted}</span> : formatted}
            </div>
          );
        })}
      </div>
      {imageUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {imageUrls.map((url, i) => (
            <BrokenImagePlaceholder key={i} src={url} />
          ))}
        </div>
      )}
    </>
  );
}

function formatDiscordInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let rest = text;
  const replacers: { regex: RegExp; render: (inner: string) => React.ReactNode }[] = [
    { regex: /\*\*(.+?)\*\*/g, render: (inner) => <strong>{inner}</strong> },
    { regex: /__(.+?)__/g, render: (inner) => <u>{inner}</u> },
    { regex: /~~(.+?)~~/g, render: (inner) => <s>{inner}</s> },
    { regex: /\*(.+?)\*/g, render: (inner) => <em>{inner}</em> },
    { regex: /`(.+?)`/g, render: (inner) => <code className="bg-[#2b2d31] px-1 py-0.5 rounded text-sm font-mono">{inner}</code> },
  ];
  let key = 0;
  function runOne(): boolean {
    let best: { index: number; len: number; render: (s: string) => React.ReactNode; m: RegExpExecArray } | null = null;
    for (const { regex, render } of replacers) {
      regex.lastIndex = 0;
      const m = regex.exec(rest);
      if (m && (best === null || m.index < best.index)) best = { index: m.index, len: m[0].length, render, m };
    }
    if (!best) return false;
    parts.push(rest.slice(0, best.index));
    parts.push(<span key={key++}>{best.render(best.m[1])}</span>);
    rest = rest.slice(best.index + best.len);
    return true;
  }
  while (runOne()) {}
  if (rest) parts.push(rest);
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

type PartnershipRequest = {
  id: number;
  staff_id: number;
  user_id: number;
  content: string;
  image_url: string | null;
  ping_type: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
};

export function Partnerships() {
  const [requests, setRequests] = useState<PartnershipRequest[]>([]);
  const [staff, setStaff] = useState<Record<number, { email?: string; username?: string }>>({});
  const [settings, setSettings] = useState<{ payment_rate_per_partnership: number; discord_channel_webhook: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');
  const [showSettings, setShowSettings] = useState(false);
  const [rate, setRate] = useState(5);
  const [webhook, setWebhook] = useState('');

  function load() {
    setLoading(true);
    const status = filter === 'all' ? undefined : filter;
    Promise.all([
      api.partnershipRequests.list({ status }),
      api.staff.list(),
      api.partnershipRequests.getSettings(),
    ])
      .then(([reqs, staffList, s]) => {
        setRequests(reqs);
        const map: Record<number, { email?: string; username?: string }> = {};
        staffList.forEach((st) => (map[st.id] = { email: st.email, username: st.username }));
        setStaff(map);
        setSettings(s);
        setRate(s.payment_rate_per_partnership ?? 5);
        setWebhook(s.discord_channel_webhook ?? '');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), [filter]);

  function handleAccept(id: number) {
    setError('');
    api.partnershipRequests
      .accept(id)
      .then(() => load())
      .catch((e) => setError(e.message));
  }

  function handleReject(id: number) {
    setError('');
    api.partnershipRequests
      .reject(id)
      .then(() => load())
      .catch((e) => setError(e.message));
  }

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    api.partnershipRequests
      .updateSettings({ payment_rate_per_partnership: rate, discord_channel_webhook: webhook })
      .then(() => {
        setShowSettings(false);
        load();
      })
      .catch((e) => setError(e.message));
  }

  function getImageUrl(url: string | null) {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${MEDIA_BASE}/${url.replace(/^\//, '')}`;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold font-display">Partnership Requests</h1>
        <div className="flex gap-2 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="bg-bg-card border border-border-primary rounded-lg py-2 px-4 text-text-primary"
          >
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-primary hover:bg-bg-hover"
          >
            <Settings size={18} />
            Settings
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-red-400 text-sm">{error}</p>}

      {showSettings && settings && (
        <form onSubmit={handleSaveSettings} className="mb-6 p-4 bg-bg-card rounded-xl border border-border-primary">
          <h3 className="font-semibold mb-4">Partnership Settings</h3>
          <div className="space-y-3 mb-4">
            <label className="block">
              <span className="text-text-secondary text-sm">Payment per accepted partnership ($)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className="w-full max-w-xs mt-1 bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
              />
            </label>
            <label className="block">
              <span className="text-text-secondary text-sm">Discord channel webhook URL</span>
              <input
                type="url"
                value={webhook}
                onChange={(e) => setWebhook(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full max-w-xl mt-1 bg-bg-tertiary border border-border-primary rounded-lg py-2 px-4 text-text-primary"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-accent text-bg-primary px-4 py-2 rounded-full font-medium">
              Save
            </button>
            <button type="button" onClick={() => setShowSettings(false)} className="border border-border-primary px-4 py-2 rounded-full">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-bg-card rounded-xl border border-border-primary overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No {filter !== 'all' ? filter : ''} partnership requests.
          </div>
        ) : (
          <div className="divide-y divide-border-primary">
            {requests.map((r) => (
              <div key={r.id} className="p-6 hover:bg-bg-hover/50 transition-colors">
                <div className="flex flex-wrap gap-4 items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-text-muted text-sm">
                        by {staff[r.staff_id]?.email || 'Staff'} · {new Date(r.created_at).toLocaleString()}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          r.status === 'pending'
                            ? 'bg-yellow-900/30 text-yellow-500'
                            : r.status === 'accepted'
                              ? 'bg-green-900/30 text-green-500'
                              : 'bg-red-900/30 text-red-500'
                        }`}
                      >
                        {r.status}
                      </span>
                      <span className="text-text-muted text-xs">Ping: {r.ping_type}</span>
                    </div>

                    <div className="mt-4 p-4 rounded-lg bg-[#313338] border border-[#3f4147] max-w-2xl">
                      <div className="flex items-center gap-2 text-text-muted text-xs mb-2">
                        <MessageCircle size={14} />
                        <span>Discord preview</span>
                      </div>
                      <div className="bg-[#2b2d31] rounded p-3 border-l-2 border-[#5865f2]">
                        {(r.ping_type === 'everyone' || r.ping_type === 'here') && (
                          <p className="text-[#5865f2] font-medium mb-2">
                            @{r.ping_type}
                          </p>
                        )}
                        <DiscordPreviewContent content={r.content} />
                        {r.image_url && (
                          <div className="mt-3 rounded overflow-hidden max-w-md">
                            <BrokenImagePlaceholder src={getImageUrl(r.image_url)!} className="max-h-64" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(r.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white"
                      >
                        <Check size={18} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-500 text-white"
                      >
                        <X size={18} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
