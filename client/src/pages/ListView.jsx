import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Globe, Lock, Trash2, X, Star } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const ListView = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [listData, setListData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isOwner = user && listData?.owner?._id === user._id;

  const fetchList = async () => {
    try {
      const { data } = await api.get(`/lists/${id}`);
      setListData(data.data);
    } catch (err) {
      console.error("Failed to fetch list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteList = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this collection?")) return;
    try {
      await api.delete(`/lists/${id}`);
      navigate('/list?tab=custom');
    } catch (err) {
      console.error("Failed to delete list", err);
    }
  };

  const handleRemoveAnime = async (e, animeId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.post('/lists/remove', { listId: id, animeId });
      fetchList(); // Refresh
    } catch (err) {
      console.error("Failed to remove anime", err);
    }
  };

  if (loading) return <div className="p-20 text-center text-white font-black tracking-widest animate-pulse">DECODING COLLECTION...</div>;
  if (!listData) return <div className="p-20 text-center text-white">Collection not found or private.</div>;

  return (
    <div className="py-12 px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <Link to="/list?tab=custom" className="inline-flex items-center gap-2 text-satori-muted hover:text-white transition-all">
          <ArrowLeft size={18} />
          <span className="text-sm font-bold uppercase tracking-widest">Back to Intelligence Center</span>
        </Link>
        
        {isOwner && (
          <button 
            onClick={handleDeleteList}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
          >
            <Trash2 size={14} />
            Purge Collection
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-satori-accent/10 border border-satori-accent/20 rounded-lg text-satori-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              {listData.isPublic ? <Globe size={12} /> : <Lock size={12} />}
              {listData.isPublic ? 'Public Collection' : 'Private Collection'}
            </span>
            <span className="text-satori-muted text-xs font-bold">Curated by <span className="text-white">{listData.owner.username}</span></span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase mb-4">{listData.name}</h1>
          <p className="text-xl text-satori-muted max-w-2xl font-medium">{listData.description || 'No description provided.'}</p>
        </div>

        <button 
          onClick={handleShare}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
        >
          <Share2 size={18} />
          {copied ? 'Link Copied!' : 'Share Collection'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {listData.anime.map((anime, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={anime._id}
            className="relative group"
          >
            {isOwner && (
              <button 
                onClick={(e) => handleRemoveAnime(e, anime._id)}
                className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white/40 hover:text-red-500 border border-white/5 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
              >
                <X size={14} />
              </button>
            )}
            <Link 
              to={`/anime/${anime._id}`}
              className="block bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden hover:border-satori-accent/50 transition-all shadow-lg h-full"
            >
              <div className="aspect-[2/3] overflow-hidden">
                <img 
                  src={anime.coverImage} 
                  alt={anime.title.romaji}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <h3 className="text-white font-bold text-xs leading-tight line-clamp-2 group-hover:text-satori-accent transition-colors">
                  {anime.title.english || anime.title.romaji}
                </h3>
                <div className="mt-3 pt-2 border-t border-white/[0.05] flex justify-between items-center">
                  <div className="flex flex-wrap gap-1">
                    {anime.genres?.slice(0, 1).map(g => (
                      <span key={g} className="text-[7px] font-black uppercase tracking-tighter px-1 bg-white/5 rounded text-satori-muted">{g}</span>
                    ))}
                  </div>
                  {anime.userScore > 0 && (
                    <span className="flex items-center gap-1 text-yellow-500 text-[10px] font-black">
                      <Star size={10} className="fill-current" /> {anime.userScore}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {listData.anime.length === 0 && (
        <div className="text-center py-32 border-2 border-dashed border-white/5 rounded-[3rem]">
          <p className="text-satori-muted font-bold uppercase tracking-widest">This collection is currently empty.</p>
        </div>
      )}
    </div>
  );
};

export default ListView;
