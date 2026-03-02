import { useState, useEffect } from 'react';
import type { MultiModuleSessionData, ModuleId } from '@/hooks/use-multi-synth-engine';
import { MULTI_SESSION_VERSION, MODULE_CONFIGS } from '@/hooks/use-multi-synth-engine';
import type { DrumState } from '@/hooks/use-drum-engine';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudSessions, type CloudSession } from '@/hooks/use-cloud-sessions';
import { Save, FolderOpen, Download, Upload, Trash2, X, Check, Music, Waves, Zap, Cloud, HardDrive, Globe, Lock, Link2, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'vibe3-sessions-v2';
const LEGACY_STORAGE_KEY = 'vibe3-sessions';

interface SessionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => MultiModuleSessionData;
  onLoad: (session: MultiModuleSessionData) => void;
  drumState?: DrumState;
  onLoadDrumState?: (ds: DrumState) => void;
}

interface StoredSession {
  id: string;
  name: string;
  createdAt: string;
  data: MultiModuleSessionData;
}

const MODULE_ICONS: Record<ModuleId, typeof Music> = {
  bass: Waves,
  lead: Music,
  arp: Zap
};

const APP_URL = 'https://vibe3.app';

export function SessionManager({ isOpen, onClose, onSave, onLoad, drumState, onLoadDrumState }: SessionManagerProps) {
  const { user, requireAuth } = useAuth();
  const cloudSessions = useCloudSessions();

  const [mode, setMode] = useState<'save' | 'load'>('save');
  const [tab, setTab] = useState<'browser' | 'cloud'>('browser');
  const [sessionName, setSessionName] = useState('');
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [cloudSessionList, setCloudSessionList] = useState<CloudSession[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Load browser sessions
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setSessions(JSON.parse(stored));
        } catch {
          setSessions([]);
        }
      }
    }
  }, [isOpen]);

  // Load cloud sessions when on cloud tab
  useEffect(() => {
    if (isOpen && tab === 'cloud' && user) {
      setCloudLoading(true);
      cloudSessions.listSessions(user.id).then((list) => {
        setCloudSessionList(list);
        setCloudLoading(false);
      });
    }
  }, [isOpen, tab, user, cloudSessions.listSessions]);

  const saveToBrowser = () => {
    if (!sessionName.trim()) return;

    const sessionData = onSave(sessionName);
    const newSession: StoredSession = {
      id: Date.now().toString(),
      name: sessionName,
      createdAt: new Date().toISOString(),
      data: sessionData
    };

    const updated = [...sessions, newSession];
    setSessions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setSessionName('');
    }, 1500);
  };

  const saveToCloud = async () => {
    if (!sessionName.trim()) return;

    const authed = await requireAuth('save your session to the cloud');
    if (!authed || !user) return;

    const sessionData = onSave(sessionName);
    const saved = await cloudSessions.saveToCloud(
      sessionName,
      sessionData,
      drumState ?? null,
      user.id
    );

    if (saved) {
      setSaveSuccess(true);
      setCloudSessionList((prev) => [saved, ...prev]);
      setTimeout(() => {
        setSaveSuccess(false);
        setSessionName('');
      }, 1500);
    }
  };

  const downloadSession = () => {
    const name = sessionName.trim() || 'vibe3-session';
    const sessionData = onSave(name);

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.vibe3.json`;
    a.click();
    URL.revokeObjectURL(url);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  const loadFromBrowser = (session: StoredSession) => {
    onLoad(session.data);
    onClose();
  };

  const loadFromCloud = (cs: CloudSession) => {
    onLoad(cs.data);
    if (cs.drum_data && onLoadDrumState) {
      onLoadDrumState(cs.drum_data);
    }
    onClose();
  };

  const loadFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as MultiModuleSessionData;
        if (data.version && data.modules && data.mixer) {
          onLoad(data);
          onClose();
        } else {
          alert('Invalid session file format');
        }
      } catch {
        alert('Could not read session file');
      }
    };
    reader.readAsText(file);
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteCloudSession = async (id: string) => {
    if (!user) return;
    const ok = await cloudSessions.deleteFromCloud(id, user.id);
    if (ok) {
      setCloudSessionList((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleTogglePublic = async (cs: CloudSession) => {
    if (!user) return;
    const newVal = !cs.is_public;
    const ok = await cloudSessions.togglePublic(cs.id, user.id, newVal);
    if (ok) {
      setCloudSessionList((prev) =>
        prev.map((s) => (s.id === cs.id ? { ...s, is_public: newVal } : s))
      );
    }
  };

  const copyShareLink = (slug: string) => {
    navigator.clipboard.writeText(`${APP_URL}/s/${slug}`).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Session Manager</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 p-2 bg-zinc-800/50">
          <button
            onClick={() => setMode('save')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              mode === 'save' ? 'bg-orange-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Save size={16} />
            Save
          </button>
          <button
            onClick={() => setMode('load')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              mode === 'load' ? 'bg-orange-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FolderOpen size={16} />
            Load
          </button>
        </div>

        {/* Storage Tab (Browser vs Cloud) */}
        <div className="flex gap-1 px-2 py-1 bg-zinc-800/30">
          <button
            onClick={() => setTab('browser')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === 'browser' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <HardDrive size={12} />
            Browser
          </button>
          <button
            onClick={() => setTab('cloud')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === 'cloud' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Cloud size={12} />
            Cloud
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'save' ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2">SESSION NAME</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="My Acid Session"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Preview what will be saved */}
              <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                <p className="text-xs font-bold text-zinc-400 mb-2">SESSION INCLUDES</p>
                <div className="flex gap-2">
                  {(['bass', 'lead', 'arp'] as ModuleId[]).map((id) => {
                    const Icon = MODULE_ICONS[id];
                    const config = MODULE_CONFIGS[id];
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                        style={{ backgroundColor: `${config.color}20`, color: config.color }}
                      >
                        <Icon size={12} />
                        {config.name}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">+ Patterns, automation, mixer settings{drumState ? ', drums' : ''}</p>
              </div>

              <div className="flex flex-col gap-2">
                {tab === 'browser' ? (
                  <>
                    <button
                      onClick={saveToBrowser}
                      disabled={!sessionName.trim()}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-bold transition-all"
                    >
                      {saveSuccess ? <Check size={18} className="text-green-500" /> : <Save size={18} />}
                      {saveSuccess ? 'Saved!' : 'Save to Browser'}
                    </button>
                    <button
                      onClick={downloadSession}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-400 rounded-lg text-black font-bold transition-all"
                    >
                      <Download size={18} />
                      Download File
                    </button>
                  </>
                ) : (
                  <button
                    onClick={saveToCloud}
                    disabled={!sessionName.trim() || cloudSessions.loading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-black font-bold transition-all"
                  >
                    {cloudSessions.loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : saveSuccess ? (
                      <Check size={18} />
                    ) : (
                      <Cloud size={18} />
                    )}
                    {saveSuccess ? 'Saved to Cloud!' : 'Save to Cloud'}
                  </button>
                )}
              </div>

              <p className="text-xs text-zinc-500 text-center">
                {tab === 'browser'
                  ? 'Browser saves are stored locally. Download to share or backup.'
                  : 'Cloud saves sync across devices. Make public to share.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {tab === 'browser' ? (
                <>
                  {/* Upload file */}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-400 rounded-lg text-black font-bold transition-all cursor-pointer">
                    <Upload size={18} />
                    Upload Session File
                    <input
                      type="file"
                      accept=".json,.vibe3.json"
                      onChange={loadFromFile}
                      className="hidden"
                    />
                  </label>

                  {/* Browser sessions */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-2">BROWSER SESSIONS</label>
                    {sessions.length === 0 ? (
                      <p className="text-sm text-zinc-500 text-center py-8">No saved sessions yet</p>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg group"
                          >
                            <button
                              onClick={() => loadFromBrowser(session)}
                              className="flex-1 text-left"
                            >
                              <div className="font-medium text-white">{session.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-zinc-500">
                                  {new Date(session.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex gap-1">
                                  {(['bass', 'lead', 'arp'] as ModuleId[]).map((id) => {
                                    const config = MODULE_CONFIGS[id];
                                    return (
                                      <div
                                        key={id}
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: config.color }}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={() => deleteSession(session.id)}
                              className="p-2 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2">CLOUD SESSIONS</label>
                  {cloudLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={24} className="text-zinc-500 animate-spin" />
                    </div>
                  ) : !user ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-zinc-500 mb-3">Sign in to access cloud sessions</p>
                      <button
                        onClick={() => requireAuth('access cloud sessions')}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-400 rounded-lg text-black font-bold text-sm transition-all"
                      >
                        Sign In
                      </button>
                    </div>
                  ) : cloudSessionList.length === 0 ? (
                    <p className="text-sm text-zinc-500 text-center py-8">No cloud sessions yet</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                      {cloudSessionList.map((cs) => (
                        <div
                          key={cs.id}
                          className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg group"
                        >
                          <button
                            onClick={() => loadFromCloud(cs)}
                            className="flex-1 text-left"
                          >
                            <div className="font-medium text-white">{cs.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-zinc-500">
                                {new Date(cs.updated_at).toLocaleDateString()}
                              </span>
                              <div className="flex gap-1">
                                {(['bass', 'lead', 'arp'] as ModuleId[]).map((id) => {
                                  const config = MODULE_CONFIGS[id];
                                  return (
                                    <div
                                      key={id}
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: config.color }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </button>

                          {/* Public/Private toggle */}
                          <button
                            onClick={() => handleTogglePublic(cs)}
                            className={`p-1.5 rounded transition-colors ${
                              cs.is_public
                                ? 'text-green-400 hover:text-green-300'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                            title={cs.is_public ? 'Public - click to make private' : 'Private - click to make public'}
                          >
                            {cs.is_public ? <Globe size={14} /> : <Lock size={14} />}
                          </button>

                          {/* Copy share link */}
                          {cs.is_public && (
                            <button
                              onClick={() => copyShareLink(cs.slug)}
                              className="p-1.5 text-zinc-500 hover:text-orange-400 transition-colors"
                              title="Copy share link"
                            >
                              {copySuccess ? <Check size={14} className="text-green-400" /> : <Link2 size={14} />}
                            </button>
                          )}

                          <button
                            onClick={() => deleteCloudSession(cs.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
