import { useState, useEffect } from 'react';
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
    return (
      <div className="bg-[#0d0d12]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl max-w-[200px]">
        <p className="font-black text-xs text-white uppercase tracking-wider mb-2">{data.title}</p>
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
  const [displayData, setDisplayData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focusedCluster, setFocusedCluster] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDNA = async () => {
      try {
        const response = await getAnimeDNA();
        if (response.success) {
          setAllData(response.data);
          setDisplayData(response.data);
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
    // Determine the "Cluster" based on the primary genre
    const primaryGenre = node.genres?.[0];
    if (primaryGenre) {
      const cluster = allData.filter(a => a.genres?.[0] === primaryGenre);
      setFocusedCluster({
        name: primaryGenre,
        anime: cluster,
        x: node.x,
        y: node.y
      });
      setDisplayData(cluster);
    }
  };

  const resetFocus = () => {
    setFocusedCluster(null);
    setDisplayData(allData);
    setSearchQuery("");
  };

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length > 2) {
      const filtered = allData.filter(a => 
        a.title.toLowerCase().includes(q.toLowerCase())
      );
      setDisplayData(filtered);
    } else if (q.length === 0) {
      setDisplayData(focusedCluster ? focusedCluster.anime : allData);
    }
  };

  const getPointColor = (genres) => {
    if (!genres || genres.length === 0) return '#ffffff';
    return GENRE_COLORS[genres[0]] || '#ffffff';
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
            {/* Galaxy Search */}
            <div className="relative group hidden md:block">
              <input
                type="text"
                placeholder="Find in Galaxy..."
                value={searchQuery}
                onChange={handleSearch}
                className="bg-white/[0.03] border border-white/10 rounded-xl py-2 px-4 pl-10 text-sm focus:outline-none focus:border-satori-accent/50 w-64 transition-all"
              />
              <Search className="absolute left-3 top-2.5 text-white/20 group-focus-within:text-satori-accent transition-colors" size={16} />
            </div>
            
            <div className="flex items-center gap-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                  {focusedCluster ? 'Cluster Density' : 'Total Stars'}
                </span>
                <span className="text-xl font-black text-white">{displayData.length}</span>
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
                  <XAxis type="number" dataKey="x" hide domain={focusedCluster ? ['dataMin - 5', 'dataMax + 5'] : [0, 100]} />
                  <YAxis type="number" dataKey="y" hide domain={focusedCluster ? ['dataMin - 5', 'dataMax + 5'] : [0, 100]} />
                  <ZAxis type="number" range={[50, 400]} />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
                  <Scatter 
                    name="Anime" 
                    data={displayData} 
                    onClick={handlePointClick}
                    style={{ cursor: 'pointer' }}
                  >
                    {displayData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getPointColor(entry.genres)} 
                        className="filter drop-shadow-[0_0_8px_currentColor] opacity-80 hover:opacity-100 transition-opacity"
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              
              {!focusedCluster && (
                <div className="absolute bottom-8 right-8 flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 pointer-events-none">
                  <Info size={14} className="text-satori-accent" />
                  <span className="text-[10px] font-bold text-white/40">Click a star to focus its cluster.</span>
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
                        className="w-full flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/[0.05] transition-all group text-left"
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
