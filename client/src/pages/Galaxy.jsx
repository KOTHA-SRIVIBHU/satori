import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnimeDNA } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, X, Navigation, Sparkles, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const GENRE_COLORS = {
  Action: '#FF3366',
  Adventure: '#FF9933',
  Comedy: '#FFD700',
  Drama: '#B82E8A',
  Fantasy: '#00C2FF',
  Horror: '#FF1E1E',
  Mecha: '#4B6584',
  Music: '#FF9FF3',
  Mystery: '#341F97',
  Psychological: '#5F27CD',
  Romance: '#FF5285',
  'Sci-Fi': '#0ABDE3',
  'Slice of Life': '#1DD1A1',
  Sports: '#FECA57',
  Supernatural: '#54A0FF',
  Thriller: '#576574',
};

const MAP_SIZE = 4000;

export default function Galaxy() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [hoveredAnime, setHoveredAnime] = useState(null);
  const [searchIndex, setSearchIndex] = useState(0);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Mouse drag to scroll refs
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const scrollLeft = useRef(0);
  const scrollTop = useRef(0);

  useEffect(() => {
    const fetchDNA = async () => {
      try {
        const response = await getAnimeDNA();
        if (response.success) {
          const data = response.data.map(a => {
            // Add a small deterministic jitter so identical coordinates form a small cluster instead of perfectly overlapping
            const jitterX = Math.sin(a.id * 12.345) * 0.6; 
            const jitterY = Math.cos(a.id * 67.890) * 0.6;
            
            return {
              ...a,
              x: a.x + jitterX,
              y: a.y + jitterY,
              searchTitle: (typeof a.title === 'object' ? (a.title.english || a.title.romaji) : a.title).toLowerCase()
            };
          });
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

  // Initial centering logic (Runs only once on load)
  useEffect(() => {
    if (!loading && allData.length > 0 && containerRef.current) {
      const avgX = allData.reduce((sum, a) => sum + a.x, 0) / allData.length;
      const avgY = allData.reduce((sum, a) => sum + a.y, 0) / allData.length;
      
      const targetX = (avgX / 100) * MAP_SIZE;
      const targetY = (avgY / 100) * MAP_SIZE;
      
      containerRef.current.scrollTo({
        left: targetX - containerRef.current.clientWidth / 2,
        top: targetY - containerRef.current.clientHeight / 2,
        behavior: 'smooth'
      });
    }
  }, [loading, allData]);

  const searchedIds = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return allData
      .filter(a => a.searchTitle.includes(searchQuery.toLowerCase()))
      .map(a => a.id);
  }, [searchQuery, allData]);

  // Reset search index when query changes
  useEffect(() => {
    setSearchIndex(0);
  }, [searchQuery]);

  const centerOnAnime = (anime) => {
    if (!anime || !containerRef.current) return;
    setSelectedAnime(anime);
    const targetX = (anime.x / 100) * MAP_SIZE;
    const targetY = (anime.y / 100) * MAP_SIZE;
    containerRef.current.scrollTo({
      left: targetX - containerRef.current.clientWidth / 2,
      top: targetY - containerRef.current.clientHeight / 2,
      behavior: 'smooth'
    });
  };

  const handleNextSearch = () => {
    if (searchedIds.length === 0) return;
    const nextIndex = (searchIndex + 1) % searchedIds.length;
    setSearchIndex(nextIndex);
    const target = allData.find(a => a.id === searchedIds[nextIndex]);
    centerOnAnime(target);
  };

  const handlePrevSearch = () => {
    if (searchedIds.length === 0) return;
    const prevIndex = (searchIndex - 1 + searchedIds.length) % searchedIds.length;
    setSearchIndex(prevIndex);
    const target = allData.find(a => a.id === searchedIds[prevIndex]);
    centerOnAnime(target);
  };

  const handlePointClick = (e, anime) => {
    // Prevent drag from triggering click
    if (isDragging.current && (Math.abs(e.pageX - startPos.current.x) > 5)) return;
    
    setSelectedAnime(anime);
    const targetX = (anime.x / 100) * MAP_SIZE;
    const targetY = (anime.y / 100) * MAP_SIZE;
    containerRef.current.scrollTo({
      left: targetX - containerRef.current.clientWidth / 2,
      top: targetY - containerRef.current.clientHeight / 2,
      behavior: 'smooth'
    });
  };

  // Mouse Drag Handlers
  const handleMouseDown = (e) => {
    isDragging.current = true;
    startPos.current = { x: e.pageX, y: e.pageY };
    scrollLeft.current = containerRef.current.scrollLeft;
    scrollTop.current = containerRef.current.scrollTop;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - startPos.current.x;
    const y = e.pageY - startPos.current.y;
    containerRef.current.scrollLeft = scrollLeft.current - x;
    containerRef.current.scrollTop = scrollTop.current - y;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030305] flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-[#00C2FF]" size={48} />
        <p className="text-sm font-black uppercase tracking-widest text-white/40 animate-pulse">
          Initializing Neural Space...
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#030305] overflow-hidden font-sans text-white">
      {/* Deep Space Background Nebulas & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#030305_100%)] z-10 pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#341F97]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#00C2FF]/10 blur-[150px] pointer-events-none" />
      
      {/* UI Overlay: Header & Search (Pushed down to pt-24 to avoid global navbar) */}
      <div className="absolute top-24 left-8 z-40 pointer-events-none flex items-start gap-8">
        <div className="pointer-events-auto bg-[#030305]/40 backdrop-blur-md p-4 rounded-3xl border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-[#00C2FF]" size={16} />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#00C2FF]/70">Satori Engine</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter">
            Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C2FF] to-[#5F27CD]">Galaxy</span>
          </h1>
        </div>

        <div className="pointer-events-auto relative group mt-2">
          <input
            type="text"
            placeholder="Search the cosmos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-96 bg-[#050507]/60 hover:bg-[#050507]/80 focus:bg-[#050507]/90 backdrop-blur-3xl border border-white/10 rounded-2xl py-3 px-5 pl-12 pr-32 text-sm focus:outline-none focus:border-[#00C2FF]/50 transition-all shadow-2xl placeholder:text-white/30"
          />
          <Search className="absolute left-4 top-3.5 text-white/30 group-focus-within:text-[#00C2FF] transition-colors" size={18} />
          
          {searchQuery.length > 0 && (
            <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
              {searchedIds.length > 0 && (
                <>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00C2FF] mr-2">
                    {searchIndex + 1} of {searchedIds.length}
                  </span>
                  <button 
                    onClick={handlePrevSearch} 
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors pointer-events-auto"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleNextSearch} 
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors pointer-events-auto"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
              <button 
                onClick={() => setSearchQuery('')}
                className="w-7 h-7 ml-1 rounded-lg hover:bg-red-500/20 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors pointer-events-auto"
                title="Clear Search"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* The Infinite Canvas */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className="absolute inset-0 overflow-auto select-none"
        style={{ cursor: 'grab', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          ::-webkit-scrollbar { display: none; }
        `}</style>
        
        <div 
          className="relative" 
          style={{ width: `${MAP_SIZE}px`, height: `${MAP_SIZE}px` }}
        >
          {/* Constellation Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{ 
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', 
              backgroundSize: '120px 120px' 
            }}
          />

          {/* Stars */}
          {allData.map((anime) => {
            const isSearched = searchedIds.includes(anime.id);
            const isSearching = searchQuery.length >= 2;
            const isSelected = selectedAnime?.id === anime.id;
            const isHovered = hoveredAnime === anime.id;
            
            const color = GENRE_COLORS[anime.genres?.[0]] || '#ffffff';
            
            let size = 10; 
            let opacity = 0.6;
            let zIndex = 10;
            let glow = 'none';

            if (isSearching) {
              if (isSearched) {
                size = 18;
                opacity = 1;
                zIndex = 30;
                glow = `0 0 25px ${color}, 0 0 50px ${color}`;
              } else {
                opacity = 0.5; // Do not hide unsearched points
                zIndex = 0;
              }
            } else if (isSelected || isHovered) {
              size = 20;
              opacity = 1;
              zIndex = 40;
              glow = `0 0 35px ${color}, 0 0 70px ${color}`;
            }

            return (
              <div
                key={anime.id}
                onMouseEnter={() => setHoveredAnime(anime.id)}
                onMouseLeave={() => setHoveredAnime(null)}
                onClick={(e) => handlePointClick(e, anime)}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(anime.x / 100) * MAP_SIZE}px`,
                  top: `${(anime.y / 100) * MAP_SIZE}px`,
                  zIndex,
                  width: size * 2,
                  height: size * 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* The actual visible star */}
                <motion.div
                  className="rounded-full"
                  animate={{
                    width: size,
                    height: size,
                    opacity: opacity,
                    boxShadow: glow,
                    backgroundColor: color,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />

                {/* Tooltip on hover/select */}
                <AnimatePresence>
                  {(isHovered || isSelected || (isSearching && isSearched)) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.9 }}
                      className="absolute top-full mt-3 px-4 py-2 bg-[#050507]/95 backdrop-blur-xl border border-white/10 rounded-xl whitespace-nowrap pointer-events-none shadow-2xl z-50 flex flex-col items-center"
                    >
                      <p className="text-sm font-black text-white">
                        {typeof anime.title === 'object' ? (anime.title.english || anime.title.romaji) : anime.title}
                      </p>
                      <p className="text-[10px] font-bold mt-1 tracking-widest" style={{ color }}>
                        {anime.genres?.[0]}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Compass / Controls */}
      <div className="absolute bottom-8 left-8 z-40 pointer-events-none">
        <div className="flex items-center gap-3 bg-[#030305]/40 backdrop-blur-md border border-white/10 rounded-3xl p-4 shadow-2xl">
          <div className="w-10 h-10 rounded-full bg-[#00C2FF]/10 flex items-center justify-center text-[#00C2FF] animate-pulse">
            <Navigation size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Navigation</p>
            <p className="text-sm font-bold text-white">Drag to Pan Cosmos</p>
          </div>
        </div>
      </div>

      {/* Glassy Side Panel for Selected Anime */}
      <AnimatePresence>
        {selectedAnime && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-[450px] bg-[#050507]/60 backdrop-blur-3xl border-l border-white/5 z-50 flex flex-col shadow-2xl pt-20"
          >
            <div className="p-8 flex-grow overflow-auto custom-scrollbar relative">
              <button 
                onClick={() => setSelectedAnime(null)}
                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest mb-6" style={{ color: GENRE_COLORS[selectedAnime.genres?.[0]] }}>
                {selectedAnime.genres?.[0] || 'Unknown Origin'}
              </div>

              <h2 className="text-4xl font-black leading-tight mb-3">
                {typeof selectedAnime.title === 'object' ? (selectedAnime.title.english || selectedAnime.title.romaji) : selectedAnime.title}
              </h2>
              <p className="text-xs text-white/40 font-black uppercase tracking-widest mb-10">Neural Node ID // {selectedAnime.id}</p>

              <div className="space-y-8">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00C2FF] mb-4">Primary Classifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAnime.genres?.map(g => (
                      <span key={g} className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-xs font-bold text-white/80">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedAnime.tags && selectedAnime.tags.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00C2FF] mb-4">Neural Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedAnime.tags.slice(0, 15).map(t => (
                        <span key={t.name} className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.02] text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                          {t.name} <span className="opacity-50 ml-1">{t.rank}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-black/20">
              <button 
                onClick={() => navigate(`/anime/${selectedAnime.id}`)}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-white text-black hover:bg-white/90 transition-all font-black uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                Access Neural Link <ExternalLink size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
