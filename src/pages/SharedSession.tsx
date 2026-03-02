import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { TB303 } from '@/components/tb303/TB303';
import { useCloudSessions, type CloudSession } from '@/hooks/use-cloud-sessions';
import { Loader2, User, Play, ArrowLeft, GitFork } from 'lucide-react';

export default function SharedSession() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { loadBySlug, incrementPlayCount } = useCloudSessions();
  const [session, setSession] = useState<CloudSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    loadBySlug(slug).then((s) => {
      if (s) {
        setSession(s);
        incrementPlayCount(s.id);
      } else {
        setError('Session not found or is private');
      }
      setLoading(false);
    });
  }, [slug, loadBySlug, incrementPlayCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-orange-500 animate-spin" />
          <p className="text-zinc-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md text-center">
          <p className="text-lg font-bold text-white">Session Not Found</p>
          <p className="text-sm text-zinc-400">{error || 'This session may have been deleted or made private.'}</p>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 rounded-xl text-black font-bold transition-all"
          >
            <ArrowLeft size={18} />
            Go to VIBE3
          </button>
        </div>
      </div>
    );
  }

  const authorName = session.profiles?.display_name || 'Anonymous';

  return (
    <div>
      {/* Author Banner */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {session.profiles?.avatar_url ? (
              <img
                src={session.profiles.avatar_url}
                alt={authorName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                <User size={16} className="text-zinc-400" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-white">{session.name}</p>
              <p className="text-xs text-zinc-500">by {authorName}</p>
            </div>
            <div className="flex items-center gap-1 ml-3 text-xs text-zinc-600">
              <Play size={10} />
              {session.play_count} plays
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 font-medium transition-colors"
            >
              <GitFork size={14} />
              Fork & Remix
            </button>
          </div>
        </div>
      </div>

      {/* TB303 with pre-loaded session data */}
      <TB303 initialSession={session.data} initialDrumData={session.drum_data} />
    </div>
  );
}
