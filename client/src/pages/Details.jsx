import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Star, Users, Tv, Zap, Calendar, Info, Layout } from 'lucide-react';
import { motion } from 'framer-motion';

const Details = () => {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetails = async () => {
      try {
        const { data } = await api.get(`/anime/${id}`);
        setAnime(data.data);
      } catch (err) {
        console.error("Failed to fetch details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

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
        <img src={anime.coverImage} className="w-full h-full object-cover blur-3xl opacity-20 scale-110" alt="" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050507]/80 to-[#050507]" />
      </div>

      <div className="max-w-7xl mx-auto px-8 pt-12">
        <Link to="/" className="inline-flex items-center gap-2 text-satori-muted hover:text-white mb-12 transition-all group">
          <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-satori-accent/30">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-bold uppercase tracking-widest">Back to Map</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left: Poster & Tags */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="sticky top-32"
            >
              <div className="relative group max-w-[320px] mx-auto lg:mx-0">
                <img 
                  src={anime.coverImage} 
                  alt="" 
                  className="w-full h-auto rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10" 
                />
                <div className="absolute -inset-4 bg-satori-accent/20 blur-3xl rounded-full -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {anime.genres?.map(g => (
                  <span key={g} className="px-4 py-1.5 bg-white/[0.03] border border-white/[0.08] text-white/80 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-satori-accent/50 transition-colors">
                    {g}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Detailed Intelligence */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-10">
                <div className="flex items-center gap-3 text-satori-accent font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                  <Layout size={14} /> Entry #{anime._id}
                </div>
                <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9]">
                  {anime.title?.english || anime.title?.romaji}
                </h1>
                <p className="text-2xl text-white/40 font-light uppercase tracking-[0.2em]">{anime.format}</p>
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
                        <p className="font-bold text-lg">{anime.studios?.[0] || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-satori-muted uppercase mb-1">Episodes / Duration</p>
                        <p className="font-bold text-lg">{anime.episodes || '?'} ep • {anime.duration || '?'}m</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-satori-muted uppercase mb-1">Original Creator</p>
                        <p className="font-bold text-lg">{anime.staff?.find(s => s.role.includes('Original Creator'))?.name || 'Unknown'}</p>
                      </div>
                    </div>
                 </div>

                 <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/[0.05]">
                    <h3 className="text-xs font-black text-satori-accent uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Zap size={14} /> DNA Markers
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {anime.tags?.slice(0, 8).map(tag => (
                        <div key={tag.name} className="px-3 py-1.5 bg-satori-accent/5 border border-satori-accent/10 rounded-lg">
                          <p className="text-[9px] font-black text-satori-accent uppercase tracking-wider">{tag.name}</p>
                          <div className="w-full h-1 bg-satori-accent/10 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-satori-accent" style={{ width: `${tag.rank}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>

              <h2 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-satori-accent rounded-full" />
                Synopsis
              </h2>
              <div 
                className="text-lg text-satori-muted leading-relaxed font-medium space-y-4"
                dangerouslySetInnerHTML={{ __html: anime.description }}
              />
            </motion.div>
          </div>
        </div>
      </div>
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
