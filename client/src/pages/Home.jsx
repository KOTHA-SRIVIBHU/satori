import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AnimeCard from '../components/AnimeCard';
import { Search as SearchIcon, Loader2, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
  const [query, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();

  // Debounced Autocomplete
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 2) {
        setIsTyping(true);
        try {
          const { data } = await api.get(`/anime/search?q=${query}`);
          setSuggestions(data.data.slice(0, 6));
        } catch (err) {
          console.error("Autocomplete failed", err);
        } finally {
          setIsTyping(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true);
    setSuggestions([]);
    try {
      const { data } = await api.get(`/anime/search?q=${query}`);
      setResults(data.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Cinematic Hero */}
      <section className="relative pt-20 pb-16 px-6 z-[60]">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-satori-accent/10 border border-satori-accent/20 text-satori-accent text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-[0_0_20px_rgba(139,92,246,0.15)]"
          >
            <Zap size={12} className="fill-current" /> Next-Gen Anime Intelligence
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-7xl font-[900] tracking-tight mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
          >
            Decode Your <br />
            <span className="text-satori-accent neon-glow">Anime DNA</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-satori-muted text-lg md:text-xl max-w-xl mx-auto mb-12 font-medium leading-relaxed"
          >
            The world's first AI-native engine built to map, analyze, and discover your next obsession.
          </motion.p>

          {/* Search Box */}
        <div className="relative z-[100] max-w-2xl mx-auto group">
          <form onSubmit={handleSearch} className="relative z-[110]">
            <input
              type="text"
              placeholder="Search across 10,000+ series..."
              className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl py-5 px-8 pl-14 text-lg focus:outline-none focus:border-satori-accent/50 focus:bg-white/[0.05] transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] placeholder:text-white/20"
              value={query}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestions([]), 200)}
            />
            <SearchIcon className="absolute left-6 top-6 text-white/20 group-focus-within:text-satori-accent transition-colors" size={24} />
            
            <div className="absolute right-4 top-3 flex items-center gap-3">
              {isTyping && <Loader2 className="animate-spin text-satori-accent" size={20} />}
              <button className="bg-satori-accent hover:bg-satori-accent/80 text-white px-8 py-2.5 rounded-xl transition-all font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                Analyze
              </button>
            </div>
          </form>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute mt-3 w-full bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-[120]"
              >
                  {suggestions.map((anime) => (
                    <button
                      key={anime.id}
                      onClick={() => navigate(`/anime/${anime.id}`)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-white/[0.05] last:border-0 group/item"
                    >
                      <img src={anime.image} className="w-10 h-14 object-cover rounded-lg shadow-lg group-hover/item:scale-105 transition-transform" alt="" />
                      <div className="text-left">
                        <p className="font-bold text-sm text-white group-hover/item:text-satori-accent transition-colors">{anime.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black text-satori-accent uppercase tracking-widest">{anime.year}</span>
                          <span className="w-1 h-1 bg-white/20 rounded-full" />
                          <span className="text-[10px] font-bold text-satori-muted uppercase tracking-widest">{anime.status}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-satori-accent/10 blur-[120px] rounded-full -z-10" />
      </section>

      {/* Main Content */}
      <div className="px-8 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8 border-b border-white/[0.05] pb-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-satori-accent rounded-full" />
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <TrendingUp className="text-satori-accent" size={24} /> 
              {results.length > 0 ? 'Discovery Results' : 'Trending Map'}
            </h2>
          </div>
          <p className="text-xs font-bold text-satori-muted uppercase tracking-[0.2em]">
            Showing {results.length || 'Top'} Entries
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <Loader2 className="animate-spin text-satori-accent" size={64} />
              <div className="absolute inset-0 bg-satori-accent/20 blur-2xl rounded-full" />
            </div>
            <p className="text-lg font-bold text-satori-muted animate-pulse">Syncing with Satori Intelligence...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {(results.length > 0 ? results : []).map((anime, i) => (
              <AnimeCard key={anime.id} anime={anime} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
