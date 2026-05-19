import { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Star, Users, Tv, Zap, Calendar, Info, Layout, Plus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const Details = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customLists, setCustomLists] = useState([]);
  const [showListModal, setShowListModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState({}); // { listId: 'idle' | 'loading' | 'success' }
  const [userStatus, setUserStatus] = useState("NOT_IN_LIST");

  const [userScore, setUserScore] = useState(0);

  const statuses = ['CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED', 'PAUSED', 'REPEATING'];

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetails = async () => {
      try {
        const { data } = await api.get(`/anime/${id}`);
        setAnime(data.data);
        
        // Check user status for this anime
        if (user) {
          const userListRes = await api.get('/user/list');
          const match = userListRes.data.data.find(item => item.animeId === Number(id));
          if (match) {
            setUserStatus(match.status);
            setUserScore(match.score || 0);
          }
        }
      } catch (err) {
        console.error("Failed to fetch details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, user]);

  const updateStatus = async (newStatus) => {
    setUserStatus('updating...');
    try {
      await api.post('/user/status-update', { animeId: id, status: newStatus });
      setUserStatus(newStatus);
    } catch (err) {
      console.error("Failed to update status", err);
      setUserStatus('error');
    }
  };

  const updateScore = async (newScore) => {
    const scoreVal = Number(newScore);
    setUserScore(scoreVal);
    try {
      await api.post('/user/status-update', { animeId: id, score: scoreVal });
    } catch (err) {
      console.error("Failed to update score", err);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    if (user && showListModal) {
      const fetchLists = async () => {
        try {
          const { data } = await api.get('/lists/my');
          setCustomLists(data.data);
        } catch (err) {
          console.error("Failed to fetch custom lists", err);
        }
      };
      fetchLists();
    }
  }, [user, showListModal]);

  const addToList = async (listId, isAlreadyIn) => {
    setSyncStatus({ ...syncStatus, [listId]: 'loading' });
    try {
      const endpoint = isAlreadyIn ? '/lists/remove' : '/lists/add';
      await api.post(endpoint, { listId, animeId: Number(id) });
      
      // Update local state
      setCustomLists(prev => prev.map(l => {
        if (l._id === listId) {
          const newIds = isAlreadyIn 
            ? l.animeIds.filter(aid => aid !== Number(id))
            : [...l.animeIds, Number(id)];
          return { ...l, animeIds: newIds };
        }
        return l;
      }));

      setSyncStatus({ ...syncStatus, [listId]: 'success' });
      setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, [listId]: 'idle' }));
      }, 2000);
    } catch (err) {
      console.error("Failed to update list", err);
      setSyncStatus({ ...syncStatus, [listId]: 'idle' });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-satori-accent" size={48} />
      <p className="text-satori-muted font-bold animate-pulse uppercase tracking-[0.2em]">Assembling Intelligence...</p>
    </div>
  );
  
  if (!anime) return <div className="p-20 text-center">Intelligence Entry Not Found.</div>;

  const stats = [
    { 
      label: 'Released', 
      value: anime.startDate?.year 
        ? [anime.startDate.day, anime.startDate.month, anime.startDate.year].filter(Boolean).join('/')
        : '?', 
      icon: Calendar, 
      color: 'text-satori-accent' 
    },
    { label: 'Status', value: anime.status, icon: Tv, color: 'text-green-400' },
    { label: 'Score', value: `${anime.averageScore}%`, icon: Star, color: 'text-yellow-500' },
    { label: 'Popularity', value: anime.popularity?.toLocaleString(), icon: Users, color: 'text-blue-400' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-20 relative"
    >
      {/* Cinematic Backdrop */}
      <div className="absolute top-0 left-0 w-full h-[70vh] -z-10 overflow-hidden">
        <img src={anime.coverImage} className="w-full h-full object-cover blur-3xl opacity-10 scale-110" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050507]/80 to-[#050507]" />
      </div>

      <div className="max-w-7xl mx-auto px-8 pt-12">
        <div className="flex justify-between items-start mb-12">
          <button 
            onClick={handleBack} 
            className="inline-flex items-center gap-2 text-satori-muted hover:text-white transition-all group"
          >
            <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-satori-accent/30">
              <ArrowLeft size={18} />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest">Back to Map</span>
          </button>

          {user && (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 overflow-hidden">
                {['CURRENT', 'PLANNING', 'COMPLETED'].map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={userStatus === 'updating...'}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${
                      userStatus === s 
                        ? 'bg-satori-accent text-white shadow-lg shadow-satori-accent/20' 
                        : 'text-satori-muted hover:text-white'
                    }`}
                  >
                    {s === 'CURRENT' ? 'WATCHING' : s}
                  </button>
                ))}
                <div className="relative group/select">
                  <select 
                    onChange={(e) => updateStatus(e.target.value)}
                    value={statuses.includes(userStatus) && !['CURRENT', 'PLANNING', 'COMPLETED'].includes(userStatus) ? userStatus : ""}
                    className="bg-transparent text-satori-muted text-[10px] font-black tracking-widest pl-4 pr-8 h-full focus:outline-none appearance-none cursor-pointer hover:text-white transition-colors"
                  >
                    <option value="" disabled className="bg-[#0a0a0c]">MORE</option>
                    <option value="PAUSED" className="bg-[#0a0a0c]">PAUSED</option>
                    <option value="DROPPED" className="bg-[#0a0a0c]">DROPPED</option>
                    <option value="REPEATING" className="bg-[#0a0a0c]">REPEATING</option>
                    {userStatus !== 'NOT_IN_LIST' && <option value="REMOVE" className="bg-red-900/20 text-red-400">REMOVE</option>}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-satori-muted group-hover/select:text-white transition-colors">
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Personal Rating */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 px-3 gap-2">
                <span className="text-[10px] font-black text-satori-accent tracking-widest uppercase">Rating</span>
                <select 
                  value={userScore}
                  onChange={(e) => updateScore(e.target.value)}
                  className="bg-transparent text-white text-xs font-black focus:outline-none cursor-pointer"
                >
                  <option value="0" className="bg-[#0a0a0c]">--</option>
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => (
                    <option key={n} value={n} className="bg-[#0a0a0c]">{n}</option>
                  ))}
                </select>
                <Star size={12} className="text-yellow-500 fill-current" />
              </div>

              <button 
                onClick={() => setShowListModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:border-satori-accent transition-all shadow-xl"
              >
                <Plus size={18} />
                <span>Collections</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left: Poster & Tags */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="sticky top-32"
            >
              <div className="relative group max-w-[240px] mx-auto lg:mx-0">
                <img 
                  src={anime.coverImage} 
                  alt="" 
                  className="w-full h-auto rounded-2xl shadow-2xl border border-white/10" 
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {anime.genres?.map(g => (
                  <span key={g} className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] text-white/80 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-satori-accent/50 transition-colors">
                    {g}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Detailed Intelligence */}
          <div className="lg:col-span-9">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-8">
                <div className="flex items-center gap-3 text-satori-accent font-black text-[9px] uppercase tracking-[0.3em] mb-3">
                  <Layout size={12} /> Entry #{anime._id}
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-tight">
                  {anime.title?.english || anime.title?.romaji}
                </h1>
                <p className="text-lg text-white/40 font-light uppercase tracking-[0.2em]">{anime.format}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white/[0.03] p-5 rounded-2xl border border-white/[0.05] hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <stat.icon size={14} className={stat.color} />
                      <span className="text-[10px] font-black text-satori-muted uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <p className="text-xl font-black">{stat.value || '?'}</p>
                  </div>
                ))}
              </div>

              {/* Deep Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                 <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/[0.05]">
                    <h3 className="text-xs font-black text-satori-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Info size={14} /> Production Intelligence
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-satori-muted uppercase mb-1">Main Studio</p>
                        <p className="font-bold text-lg text-white">{anime.studios?.[0] || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-satori-muted uppercase mb-1">Episodes / Duration</p>
                        <p className="font-bold text-lg text-white">{anime.episodes || '?'} ep • {anime.duration || '?'}m</p>
                      </div>
                    </div>
                 </div>

                 <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/[0.05]">
                    <h3 className="text-xs font-black text-satori-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Zap size={14} /> DNA Markers
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {anime.tags?.slice(0, 8).map(tag => (
                        <div key={tag.name} className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                          <p className="text-[9px] font-bold text-white uppercase tracking-wider">{tag.name}</p>
                          <div className="w-full h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-white/40" style={{ width: `${tag.rank}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              <h2 className="text-xl font-black tracking-tight mb-4 flex items-center gap-3">
                <div className="w-1 h-5 bg-satori-accent rounded-full" />
                Synopsis
              </h2>
              <div 
                className="text-base text-satori-muted leading-relaxed font-medium space-y-4"
                dangerouslySetInnerHTML={{ __html: anime.description }}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* List Modal */}
      <AnimatePresence>
        {showListModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowListModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
            >
              <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Add to Custom List</h2>
              <p className="text-satori-muted mb-8 text-sm">Select a list to store this intelligence entry.</p>
              
              <div className="space-y-3 max-h-[40vh] overflow-y-auto mb-8 pr-2">
                {customLists.map(list => {
                  const isAlreadyIn = list.animeIds.includes(Number(id));
                  return (
                    <button
                      key={list._id}
                      onClick={() => addToList(list._id, isAlreadyIn)}
                      disabled={syncStatus[list._id] === 'loading'}
                      className={`w-full flex items-center justify-between p-5 bg-white/5 border rounded-2xl transition-all group ${
                        isAlreadyIn ? 'border-satori-accent/50 bg-satori-accent/5' : 'border-white/5 hover:border-satori-accent/50'
                      }`}
                    >
                      <div className="text-left">
                        <p className={`font-bold transition-colors ${isAlreadyIn ? 'text-satori-accent' : 'text-white group-hover:text-satori-accent'}`}>
                          {list.name}
                        </p>
                        <p className="text-[10px] text-satori-muted uppercase tracking-widest mt-1">{list.animeIds.length} ENTRIES</p>
                      </div>
                      {syncStatus[list._id] === 'success' ? (
                        <CheckCircle2 className="text-green-400" size={20} />
                      ) : syncStatus[list._id] === 'loading' ? (
                        <div className="w-5 h-5 border-2 border-satori-accent border-t-transparent rounded-full animate-spin" />
                      ) : isAlreadyIn ? (
                        <CheckCircle2 className="text-satori-accent" size={20} />
                      ) : (
                        <Plus className="text-white/20 group-hover:text-satori-accent" size={20} />
                      )}
                    </button>
                  );
                })}
                
                {customLists.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-satori-muted italic">No custom lists found.</p>
                    <Link to="/list?tab=custom" className="text-satori-accent text-sm font-bold mt-2 block hover:underline">Create one in Intelligence Center</Link>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowListModal(false)}
                className="w-full py-4 text-sm font-black text-satori-muted uppercase tracking-[0.2em] hover:text-white transition-colors"
              >
                Close Portal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Loader2 = ({ className, size }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default Details;
