import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnimeDNA } from '../services/api';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Info, Minimize2, List, Search } from 'lucide-react';

const GENRE_COLORS = {
  Action: '#ff4b2b',
  Adventure: '#ff9068',
  Comedy: '#f9d423',
  Drama: '#a445b2',
  Fantasy: '#2193b0',
  Horror: '#200122',
  Mecha: '#243b55',
  Music: '#eecda3',
  Mystery: '#0f2027',
  Psychological: '#6a11cb',
  Romance: '#ff0844',
  'Sci-Fi': '#00d2ff',
  'Slice of Life': '#d4fc79',
  Sports: '#11998e',
  Supernatural: '#8e2de2',
  Thriller: '#654ea3',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const title = typeof data.title === 'object' ? (data.title.english || data.title.romaji) : data.title;
    return (
      <div className="bg-[#0d0d12]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl max-w-[200px]">
        <p className="font-black text-xs text-white uppercase tracking-wider mb-2">{title}</p>
        <div className="flex flex-wrap gap-1">
          {data.genres?.slice(0, 3).map(g => (
            <span 
              key={g} 
              className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/10 border border-white/5 text-white/60"
              style={{ borderColor: GENRE_COLORS[g] || 'rgba(255,255,255,0.1)' }}
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const Galaxy = () => {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusedCluster, setFocusedCluster] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [highlightedIds, setHighlightedIds] = useState([]);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchDNA = async () => {
      try {
        const response = await getAnimeDNA();
        if (response.success) {
          // Normalize titles for search
          const data = response.data.map(a => ({
            ...a,
            searchTitle: (typeof a.title === 'object' ? (a.title.english || a.title.romaji) : a.title).toLowerCase()
          }));
          setAllData(data);
        }
      } catch (err) {
        console.error("Failed to fetch Galaxy data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDNA();
  }, []);

  const handlePointClick = (node) => {
    const primaryGenre = node.genres?.[0];
    if (primaryGenre) {
      setFocusedCluster({
        name: primaryGenre,
        anime: allData.filter(a => a.genres?.[0] === primaryGenre),
        x: node.x,
        y: node.y
      });
      setHighlightedIds([]);
      setSearchQuery("");
    }
  };

  const resetFocus = () => {
    setFocusedCluster(null);
    setHighlightedIds([]);
    setSearchQuery("");
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    
    if (q.length > 2) {
      const filtered = allData.filter(a => a.searchTitle.includes(q.toLowerCase()));
      setSuggestions(filtered.slice(0, 10));
      setHighlightedIds(filtered.map(a => a.id));
    } else {
      setSuggestions([]);
      setHighlightedIds([]);
    }
  };

  const selectSuggestion = (anime) => {
    setHighlightedIds([anime.id]);
    setSearchQuery(typeof anime.title === 'object' ? (anime.title.english || anime.title.romaji) : anime.title);
    setSuggestions([]);
    // Optionally focus the cluster of the selected anime
    handlePointClick(anime);
  };

  const getPointOpacity = (entry) => {
    if (highlightedIds.length === 0) return 0.8;
    return highlightedIds.includes(entry.id) ? 1.0 : 0.1;
  };

  const getPointSize = (entry) => {
    if (highlightedIds.length === 0) return 50;
    return highlightedIds.includes(entry.id) ? 400 : 30;
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-8 relative overflow-hidden bg-[#050507]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-satori-accent/5 blur-[150px] rounded-full -z-0" />
      
      <div className="max-w-7xl mx-auto flex flex-col relative z-10 min-h-[80vh]">
        <header className="mb-8 flex items-end justify-between border-b border-white/[0.05] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="text-satori-accent" size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Neural Map Visualization</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white">
              The Anime <span className="text-satori-accent">Galaxy</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Smart Galaxy Search */}
            <div className="relative group hidden md:block" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Find in Galaxy..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="bg-white/[0.03] border border-white/10 rounded-xl py-2 px-4 pl-10 text-sm focus:outline-none focus:border-satori-accent/50 w-64 transition-all"
                />
                <Search className="absolute left-3 top-2.5 text-white/20 group-focus-within:text-satori-accent transition-colors" size={16} />
              </div>

              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute mt-2 w-full bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[100]"
                  >
                    {suggestions.map((anime) => (
                      <button
                        key={anime.id}
                        onClick={() => selectSuggestion(anime)}
                        className="w-full text-left p-3 hover:bg-white/5 transition-colors border-b border-white/[0.05] last:border-0"
                      >
                        <p className="font-bold text-xs text-white truncate">
                          {typeof anime.title === 'object' ? (anime.title.english || anime.title.romaji) : anime.title}
                        </p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                  {focusedCluster ? 'Cluster Density' : 'Total Stars'}
                </span>
                <span className="text-xl font-black text-white">{focusedCluster ? focusedCluster.anime.length : allData.length}</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-[10px] font-medium text-white/60 max-w-[200px] leading-relaxed">
                {focusedCluster 
                  ? `Focusing on the ${focusedCluster.name} neighborhood.` 
                  : "Mapped by UMAP on 71 dimensions including Genres and Weighted Tags."}
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex-grow flex flex-col items-center justify-center gap-6 min-h-[400px]">
            <Loader2 className="animate-spin text-satori-accent" size={48} />
            <p className="text-sm font-black uppercase tracking-widest text-white/40 animate-pulse">Calculating Cluster Densities...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
            {/* The Map */}
            <motion.div 
              layout
              className={`lg:col-span-${focusedCluster ? '2' : '3'} bg-white/[0.02] border border-white/[0.05] rounded-[2rem] overflow-hidden relative min-h-[500px] shadow-2xl`}
            >
              <div className="absolute top-6 left-6 z-20 flex gap-2">
                {focusedCluster && (
                  <button 
                    onClick={resetFocus}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/10 text-white text-[10px] font-bold uppercase transition-all"
                  >
                    <Minimize2 size={14} /> Reset Galaxy View
                  </button>
                )}
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                  <XAxis type="number" dataKey="x" hide domain={[0, 100]} />
                  <YAxis type="number" dataKey="y" hide domain={[0, 100]} />
                  <ZAxis type="number" range={[50, 400]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
                  <Scatter 
                    name="Anime" 
                    data={focusedCluster ? focusedCluster.anime : allData} 
                    onClick={handlePointClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {(focusedCluster ? focusedCluster.anime : allData).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={GENRE_COLORS[entry.genres?.[0]] || '#ffffff'} 
                        opacity={getPointOpacity(entry)}
                        className="filter drop-shadow-[0_0_8px_currentColor] transition-all duration-300"
                        // Increase size if highlighted
                        r={highlightedIds.includes(entry.id) ? 10 : 3}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              
              {!focusedCluster && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 pointer-events-none shadow-xl">
                  <Info size={14} className="text-satori-accent" />
                  <span className="text-[10px] font-bold text-white/40">Click a star to focus its cluster. Highlights show search matches.</span>
                </div>
              )}
            </motion.div>

            {/* Cluster List Sidebar */}
            <AnimatePresence>
              {focusedCluster && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 flex flex-col h-[600px]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${GENRE_COLORS[focusedCluster.name]}20`, color: GENRE_COLORS[focusedCluster.name] }}>
                        <List size={18} />
                      </div>
                      <h2 className="font-black text-lg tracking-tight">{focusedCluster.name} Cluster</h2>
                    </div>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {focusedCluster.anime.map((anime) => (
                      <button 
                        key={anime.id}
                        onClick={() => navigate(`/anime/${anime.id}`)}
                        className={`w-full flex items-center gap-4 p-3 rounded-2xl border transition-all group text-left ${
                          highlightedIds.includes(anime.id) 
                            ? 'bg-satori-accent/20 border-satori-accent/50' 
                            : 'bg-white/5 border-white/[0.05] hover:bg-white/10'
                        }`}
                      >
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white/20">
                            ID: {anime.id}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white group-hover:text-satori-accent transition-colors line-clamp-1">
                            {typeof anime.title === 'object' ? (anime.title.english || anime.title.romaji) : anime.title}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {anime.genres?.slice(0, 2).map(g => (
                              <span key={g} className="text-[8px] font-black text-white/20 uppercase">{g}</span>
                            ))}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Galaxy;
