import { useState, useContext, useEffect } from 'react';
import api, { analyzeDNA } from '../services/api';
import { RefreshCw, CheckCircle2, AlertCircle, User as UserIcon, Share2, Zap } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anilistUser, setAnilistUser] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [dnaResult, setDnaResult] = useState(null);
  const [dnaLoading, setDnaLoading] = useState(false);

  const handleAnalyzeDNA = async () => {
    setDnaLoading(true);
    try {
      const result = await analyzeDNA();
      setDnaResult(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDnaLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.anilistId) {
      setAnilistUser(user.anilistId);
    } else if (!user) {
      const localSync = localStorage.getItem('localAniListId');
      if (localSync) setAnilistUser(localSync);
    }
  }, [user]);

  const handleShareProfile = () => {
    const url = `${window.location.origin}/profile/${user.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOfflineSync = async (username) => {
    const query = `
      query ($userName: String) {
        MediaListCollection(userName: $userName, type: ANIME) {
          lists { 
            entries { 
              mediaId status score(format: POINT_10) 
              media { title { english romaji } coverImage { large } }
            } 
          }
        }
      }
    `;
    const response = await axios.post("https://graphql.anilist.co", { query, variables: { userName: username } });
    const allEntries = response.data.data.MediaListCollection.lists.flatMap(
      (list) => list.entries.map(entry => ({
        animeId: entry.mediaId, 
        status: entry.status, 
        score: entry.score,
        anime: entry.media // Store the full media object locally
      }))
    );
    localStorage.setItem('localSyncList', JSON.stringify(allEntries));
    localStorage.setItem('localAniListId', username);
    return allEntries.length;
  };

  const handleSync = async (e) => {
    e.preventDefault();
    if (!anilistUser) return;

    setStatus("loading");
    try {
      if (user) {
        // Online Sync
        const { data } = await api.post('/user/sync-anilist', {
          anilistUsername: anilistUser
        });
        setMessage(`Successfully synced ${data.count} anime from your AniList to your online profile!`);
      } else {
        // Offline Sync
        const count = await handleOfflineSync(anilistUser);
        setMessage(`Successfully synced ${count} anime from your AniList locally! Register to save them online.`);
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Sync failed. Make sure your AniList profile is public.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 mt-4">
      <div className="bg-satori-card rounded-3xl border border-white/5 p-6 text-center">
        <div className="inline-block p-3 bg-satori-accent/10 rounded-full text-satori-accent mb-4">
          <UserIcon size={32} />
        </div>
        
        {user ? (
          <>
            <h1 className="text-3xl font-bold mb-1">{user.username}</h1>
            <p className="text-satori-muted mb-4 text-sm">{user.email}</p>
            <button 
              onClick={handleShareProfile}
              className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
            >
              <Share2 size={14} />
              {copied ? 'Profile Link Copied!' : 'Share Public Profile'}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-1 text-white">Local Explorer</h1>
            <p className="text-satori-muted mb-6 text-sm">You are currently offline. Your sync data will be saved locally.</p>
          </>
        )}

        <div className="max-w-md mx-auto bg-satori-dark/50 p-6 rounded-2xl border border-white/5 text-left">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <RefreshCw size={18} className="text-satori-accent" /> AniList Sync
          </h2>
          <p className="text-[11px] text-satori-muted mb-4 leading-relaxed">
            Enter your AniList username to import your watched history, scores, and status.
          </p>

          <form onSubmit={handleSync} className="space-y-3">
            <input
              type="text"
              placeholder={anilistUser || "AniList Username"}
              className="w-full bg-satori-card border border-white/10 rounded-xl py-2.5 px-4 focus:outline-none focus:border-satori-accent transition-all text-white text-sm"
              value={anilistUser}
              onChange={(e) => setAnilistUser(e.target.value)}
            />
            <button
              disabled={status === "loading"}
              className="w-full bg-satori-accent hover:bg-satori-accent/80 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
            >
              {status === "loading" ? <RefreshCw className="animate-spin" size={18} /> : "Start Intelligence Sync"}
            </button>
          </form>

          {status === "success" && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-3">
              <CheckCircle2 size={20} /> <span className="text-sm font-medium">{message}</span>
            </div>
          )}

          {status === "error" && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} /> <span className="text-sm font-medium">{message}</span>
            </div>
          )}
        </div>
        {user && (
          <div className="max-w-md mx-auto mt-8 bg-satori-dark/50 p-6 rounded-2xl border border-white/5 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF2A55]/10 rounded-full blur-[50px] pointer-events-none" />
            <h2 className="text-xl font-black mb-1 flex items-center gap-2 tracking-tight text-white">
              <Zap size={20} className="text-[#FF2A55]" /> Anime DNA Analyzer
            </h2>
            <p className="text-[11px] text-satori-muted mb-6 leading-relaxed">
              Run Satori's neural clustering engine on your watch history to discover your core anime archetype.
            </p>

            {dnaResult ? (
              <div className="space-y-4">
                <div className="bg-white/[0.03] border border-[#FF2A55]/20 p-5 rounded-xl shadow-lg shadow-[#FF2A55]/5">
                  <div className="inline-block px-2 py-1 bg-[#FF2A55]/10 text-[#FF2A55] text-[9px] font-black uppercase tracking-widest rounded mb-3">
                    Primary Archetype
                  </div>
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2 leading-tight">
                    {dnaResult.persona}
                  </h3>
                  <p className="text-sm font-medium text-white/70 leading-relaxed mb-3">
                    "{dnaResult.description}"
                  </p>

                  {dnaResult.secondary_persona && (
                    <div className="bg-white/[0.03] border border-white/10 p-3 rounded-lg mt-3">
                      <span className="text-[9px] font-black text-satori-accent uppercase tracking-widest">Secondary Archetype</span>
                      <p className="text-sm font-bold text-white/80 mt-1">{dnaResult.secondary_persona.name}</p>
                      <p className="text-xs text-white/50 mt-0.5">{dnaResult.secondary_persona.description}</p>
                    </div>
                  )}
                </div>

                {/* Genre Breakdown */}
                {dnaResult.genre_breakdown && dnaResult.genre_breakdown.length > 0 && (
                  <div className="bg-white/[0.03] border border-white/5 p-5 rounded-xl">
                    <h4 className="text-[10px] font-black text-satori-muted uppercase tracking-widest mb-3">Genre Affinity</h4>
                    <div className="space-y-2">
                      {dnaResult.genre_breakdown.slice(0, 6).map((g, i) => (
                        <div key={g.genre} className="flex items-center gap-3">
                          <span className="text-xs text-white/70 w-24 truncate">{g.genre}</span>
                          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#FF2A55] to-[#B82E8A] transition-all duration-700"
                              style={{ width: `${Math.min(g.strength, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-white/40 font-mono w-10 text-right">{g.strength}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top DNA Tags */}
                {dnaResult.top_tags && dnaResult.top_tags.length > 0 && (
                  <div className="bg-white/[0.03] border border-white/5 p-5 rounded-xl">
                    <h4 className="text-[10px] font-black text-satori-muted uppercase tracking-widest mb-3">DNA Markers</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {dnaResult.top_tags.slice(0, 12).map((t) => (
                        <span key={t.tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-white/70 font-medium">
                          {t.tag} <span className="text-[#FF2A55] ml-0.5">{t.strength}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Analyzed {dnaResult.total_watched} Neural Nodes
                  </div>
                  <button
                    onClick={handleAnalyzeDNA}
                    disabled={dnaLoading}
                    className="text-[10px] font-bold text-[#FF2A55] hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                    {dnaLoading ? <RefreshCw className="animate-spin" size={12} /> : "Re-Analyze"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleAnalyzeDNA}
                disabled={dnaLoading}
                className="w-full bg-gradient-to-r from-[#FF2A55] to-[#B82E8A] hover:opacity-90 text-white font-black py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(255,42,85,0.3)] flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                {dnaLoading ? <RefreshCw className="animate-spin" size={18} /> : "Extract Persona"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
