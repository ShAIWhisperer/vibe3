import { useState, useEffect } from 'react';
import { CLASSIC_PATTERNS, type SavedPattern, generatePatternId, createEmptyPattern } from './patterns';
import type { Step } from '@/hooks/use-tb303-engine';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityPatterns, type CommunityPattern } from '@/hooks/use-community-patterns';
import { Save, FolderOpen, Trash2, Plus, Music, Tag, Zap, X, Heart, User, Globe, Loader2, Upload } from 'lucide-react';

interface PatternLibraryProps {
  currentPattern: Step[];
  currentTempo: number;
  onLoadPattern: (pattern: Step[], tempo: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const STYLE_OPTIONS = ['Acid House', 'Chicago Acid', 'German Acid', 'UK Acid', 'Acid Techno', 'Rave', 'Minimal', 'Deep', 'Custom'];
const TAG_OPTIONS = ['uplifting', 'dark', 'hypnotic', 'energetic', 'squelchy', 'driving', 'euphoric', 'deep', 'bleepy', 'classic'];

export function PatternLibrary({ currentPattern, currentTempo, onLoadPattern, isOpen, onClose }: PatternLibraryProps) {
  const { user, requireAuth } = useAuth();
  const community = useCommunityPatterns();

  const [userPatterns, setUserPatterns] = useState<SavedPattern[]>(() => {
    const saved = localStorage.getItem('tb303-patterns');
    return saved ? JSON.parse(saved) : [];
  });

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveStyle, setSaveStyle] = useState('Custom');
  const [saveTags, setSaveTags] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | 'classic' | 'user' | 'community'>('all');
  const [searchTag, setSearchTag] = useState('');

  // Community state
  const [communityPatterns, setCommunityPatterns] = useState<CommunityPattern[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // Load community patterns
  useEffect(() => {
    if (isOpen && filter === 'community') {
      setCommunityLoading(true);
      community.listPatterns({ sort: 'popular' }).then(({ patterns }) => {
        setCommunityPatterns(patterns);
        setCommunityLoading(false);
      });
      if (user) {
        community.getUserLikes(user.id).then(setUserLikes);
      }
    }
  }, [isOpen, filter, user, community.listPatterns, community.getUserLikes]);

  const allPatterns = [...CLASSIC_PATTERNS, ...userPatterns];
  const filteredPatterns = allPatterns.filter((p) => {
    if (filter === 'classic' && p.type !== 'classic') return false;
    if (filter === 'user' && p.type !== 'user') return false;
    if (filter === 'community') return false; // Community has its own list
    if (searchTag && !p.tags.some((t) => t.toLowerCase().includes(searchTag.toLowerCase()))) return false;
    return true;
  });

  const savePattern = () => {
    if (!saveName.trim()) return;

    const newPattern: SavedPattern = {
      id: generatePatternId(),
      name: saveName,
      type: 'user',
      style: saveStyle,
      tags: saveTags,
      tempo: currentTempo,
      steps: [...currentPattern]
    };

    const updated = [...userPatterns, newPattern];
    setUserPatterns(updated);
    localStorage.setItem('tb303-patterns', JSON.stringify(updated));

    setSaveName('');
    setSaveTags([]);
    setShowSaveDialog(false);
  };

  const publishToCommunity = async () => {
    if (!saveName.trim()) return;

    const authed = await requireAuth('publish a pattern to the community');
    if (!authed || !user) return;

    const published = await community.publishPattern(user.id, {
      name: saveName,
      style: saveStyle,
      tags: saveTags,
      tempo: currentTempo,
      steps: [...currentPattern],
    });

    if (published) {
      setCommunityPatterns((prev) => [published, ...prev]);
      setSaveName('');
      setSaveTags([]);
      setShowSaveDialog(false);
    }
  };

  const deletePattern = (id: string) => {
    const updated = userPatterns.filter((p) => p.id !== id);
    setUserPatterns(updated);
    localStorage.setItem('tb303-patterns', JSON.stringify(updated));
  };

  const clearPattern = () => {
    onLoadPattern(createEmptyPattern(), currentTempo);
  };

  const toggleTag = (tag: string) => {
    setSaveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleLike = async (patternId: string) => {
    const authed = await requireAuth('like a pattern');
    if (!authed || !user) return;

    const isLiked = userLikes.has(patternId);

    if (isLiked) {
      const ok = await community.unlikePattern(patternId, user.id);
      if (ok) {
        setUserLikes((prev) => {
          const next = new Set(prev);
          next.delete(patternId);
          return next;
        });
        setCommunityPatterns((prev) =>
          prev.map((p) => (p.id === patternId ? { ...p, likes: p.likes - 1 } : p))
        );
      }
    } else {
      const ok = await community.likePattern(patternId, user.id);
      if (ok) {
        setUserLikes((prev) => new Set(prev).add(patternId));
        setCommunityPatterns((prev) =>
          prev.map((p) => (p.id === patternId ? { ...p, likes: p.likes + 1 } : p))
        );
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <FolderOpen className="text-orange-500" size={24} />
            <h2 className="text-xl font-bold text-white">Pattern Library</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-700 rounded-lg transition-colors">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg transition-colors"
          >
            <Save size={16} />
            Save Current
          </button>
          <button
            onClick={clearPattern}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Pattern
          </button>

          <div className="flex-1" />

          {/* Filters */}
          <div className="flex bg-zinc-800 rounded-lg p-1">
            {(['all', 'classic', 'user', 'community'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize ${
                  filter === f ? 'bg-orange-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {f === 'community' ? (
                  <span className="flex items-center gap-1">
                    <Globe size={12} />
                    Community
                  </span>
                ) : (
                  f
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-zinc-800">
          <input
            type="text"
            placeholder="Search by tag..."
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Pattern List */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: '400px' }}>
          {filter === 'community' ? (
            // Community patterns
            <div className="flex flex-col gap-2">
              {communityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="text-zinc-500 animate-spin" />
                </div>
              ) : communityPatterns.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  No community patterns yet. Be the first to publish!
                </div>
              ) : (
                communityPatterns
                  .filter((p) => !searchTag || p.tags.some((t) => t.toLowerCase().includes(searchTag.toLowerCase())))
                  .map((pattern) => (
                    <div
                      key={pattern.id}
                      className="flex items-center gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700 transition-all group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Music size={16} className="text-orange-500" />
                          <span className="font-bold text-white">{pattern.name}</span>
                          <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full font-medium">
                            COMMUNITY
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Zap size={12} />
                            {pattern.tempo} BPM
                          </span>
                          {pattern.style && <span>{pattern.style}</span>}
                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {pattern.profiles?.display_name || 'Anonymous'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pattern.tags.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 text-xs bg-zinc-700 text-zinc-300 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 items-center">
                        {/* Like button */}
                        <button
                          onClick={() => handleLike(pattern.id)}
                          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                            userLikes.has(pattern.id)
                              ? 'text-pink-400 bg-pink-500/20'
                              : 'text-zinc-500 hover:text-pink-400 hover:bg-pink-500/10'
                          }`}
                        >
                          <Heart size={14} fill={userLikes.has(pattern.id) ? 'currentColor' : 'none'} />
                          {pattern.likes}
                        </button>

                        <button
                          onClick={() => {
                            onLoadPattern(pattern.steps as Step[], pattern.tempo);
                            onClose();
                          }}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg transition-colors"
                        >
                          Load
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          ) : (
            // Local patterns (all/classic/user)
            <div className="flex flex-col gap-2">
              {filteredPatterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="flex items-center gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl border border-zinc-700 transition-all group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Music size={16} className="text-orange-500" />
                      <span className="font-bold text-white">{pattern.name}</span>
                      {pattern.type === 'classic' && (
                        <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full font-medium">
                          CLASSIC
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Zap size={12} />
                        {pattern.tempo} BPM
                      </span>
                      <span>{pattern.style}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pattern.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-xs bg-zinc-700 text-zinc-300 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onLoadPattern(pattern.steps, pattern.tempo);
                        onClose();
                      }}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg transition-colors"
                    >
                      Load
                    </button>
                    {pattern.type === 'user' && (
                      <button
                        onClick={() => deletePattern(pattern.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredPatterns.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  No patterns found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md m-4 p-6 bg-zinc-900 rounded-2xl border border-zinc-700">
              <h3 className="text-lg font-bold text-white mb-4">Save Pattern</h3>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="My Acid Line"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Style</label>
                  <select
                    value={saveStyle}
                    onChange={(e) => setSaveStyle(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    {STYLE_OPTIONS.map((style) => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          saveTags.includes(tag)
                            ? 'bg-orange-500 text-black font-medium'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSaveDialog(false)}
                      className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={savePattern}
                      disabled={!saveName.trim()}
                      className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-600 disabled:text-zinc-400 text-black font-bold rounded-lg transition-colors"
                    >
                      Save Local
                    </button>
                  </div>
                  <button
                    onClick={publishToCommunity}
                    disabled={!saveName.trim()}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-purple-500 hover:bg-purple-400 disabled:bg-zinc-600 disabled:text-zinc-400 text-white font-bold rounded-lg transition-colors"
                  >
                    <Upload size={16} />
                    Publish to Community
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
