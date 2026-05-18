import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import { Zap, Globe, Share2, TrendingUp, BarChart3 } from 'lucide-react';

const PublicProfile = () => {
  const { username } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState('ANI-SYNC');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/user/public/${username}`);
        if (data.success) {
          setProfileData(data.data);
        } else {
          setError(data.message || "Failed to load profile.");
        }
      } catch (err) {
        console.error("Failed to fetch public profile", err);
        setError(err.response?.data?.message || "Profile intelligence entry not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white font-black tracking-[0.2em] animate-pulse">DECODING INTELLIGENCE...</div>;
  
  if (error || !profileData) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-8">
      <h1 className="text-4xl font-black mb-4 tracking-tighter">SIGNAL LOST</h1>
      <p className="text-satori-muted text-lg mb-8">{error || "Intelligence Profile Not Found."}</p>
      <Link to="/" className="px-6 py-3 bg-satori-accent text-white rounded-xl font-bold hover:bg-purple-600 transition-all uppercase tracking-widest text-xs">Return to Explorer</Link>
    </div>
  );

  const statuses = ['ALL', 'CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED', 'PAUSED', 'REPEATING'];
  const filteredMainList = filter === 'ALL' 
    ? profileData.mainList 
    : profileData.mainList.filter(item => item.status === filter);

  return (
    <div className="min-h-screen pb-20 px-8">
      {/* Profile Hero */}
      <section className="py-16 text-center max-w-4xl mx-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block p-5 bg-satori-accent/10 rounded-full text-satori-accent mb-6 shadow-[0_0_40px_rgba(139,92,246,0.2)]"
        >
          <Zap size={48} className="fill-current" />
        </motion.div>
        <h1 className="text-6xl font-black text-white tracking-tighter uppercase mb-2">{profileData.username}</h1>
        <div className="flex items-center justify-center gap-2 text-satori-muted uppercase tracking-[0.3em] font-bold text-[10px]">
          <Globe size={12} className="text-satori-accent" /> Verified Intelligence Profile
        </div>
      </section>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-12 flex justify-center">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          <button 
            onClick={() => setActiveTab('ANI-SYNC')}
            className={`px-8 py-3 rounded-xl text-xs font-black tracking-widest transition-all ${activeTab === 'ANI-SYNC' ? 'bg-satori-accent text-white shadow-xl' : 'text-satori-muted hover:text-white'}`}
          >
            COLLECTION
          </button>
          <button 
            onClick={() => setActiveTab('CUSTOM')}
            className={`px-8 py-3 rounded-xl text-xs font-black tracking-widest transition-all ${activeTab === 'CUSTOM' ? 'bg-satori-accent text-white shadow-xl' : 'text-satori-muted hover:text-white'}`}
          >
            SET LISTS
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'ANI-SYNC' ? (
          <>
            <div className="flex gap-2 mb-10 overflow-x-auto pb-2 justify-center">
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-5 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all ${
                    filter === s 
                      ? 'bg-white text-black' 
                      : 'bg-white/5 text-satori-muted hover:bg-white/10'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredMainList.map((item, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.4) }}
                  key={item.animeId}
                >
                  <Link 
                    to={`/anime/${item.animeId}`}
                    className="group block bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden hover:border-satori-accent/50 transition-all h-full shadow-lg"
                  >
                    <div className="aspect-[2/3] overflow-hidden relative">
                      <img 
                        src={item.anime?.coverImage || 'https://via.placeholder.com/100x150'} 
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] font-black text-satori-accent border border-white/5 uppercase tracking-widest">
                        {item.status}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-white font-bold text-xs leading-tight line-clamp-2 group-hover:text-satori-accent transition-colors">
                        {item.anime?.title?.english || item.anime?.title?.romaji || 'Unknown'}
                      </h3>
                      <div className="mt-2 pt-2 border-t border-white/[0.05] flex justify-between items-center">
                        <span className="text-[8px] font-black text-satori-muted uppercase tracking-tighter">SCORE</span>
                        {item.score > 0 ? (
                          <span className="flex items-center gap-1 text-yellow-500 text-[10px] font-black">
                            <Star size={10} className="fill-current" /> {item.score}/10
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-white/20">--</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profileData.customLists.map((list) => (
              <Link to={`/lists/${list._id}`} key={list._id} className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 hover:border-satori-accent transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-satori-accent/10 rounded-2xl text-satori-accent group-hover:bg-satori-accent group-hover:text-white transition-all">
                    <BarChart3 size={24} />
                  </div>
                  <span className="text-[10px] font-black text-satori-muted uppercase tracking-[0.2em]">{list.animeIds.length} Entries</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">{list.name}</h3>
                <p className="text-sm text-satori-muted line-clamp-2 font-medium">{list.description || 'No description provided.'}</p>
              </Link>
            ))}
            {profileData.customLists.length === 0 && (
              <div className="col-span-full py-20 text-center text-satori-muted uppercase tracking-[0.2em] font-bold border-2 border-dashed border-white/5 rounded-[3rem]">
                No public set lists found for this profile.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
