import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Calendar, Zap } from 'lucide-react';

const AnimeCard = ({ anime, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link 
        to={`/anime/${anime.id}`} 
        className="group relative flex flex-col bg-white/[0.03] rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/20 transition-all duration-500 h-full shadow-lg"
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          <img 
            src={anime.image} 
            alt={anime.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent opacity-80" />
          
          {/* Top Info Tags */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {anime.userScore > 0 ? (
              <div className="bg-yellow-500/90 backdrop-blur-md px-2 py-1 rounded-lg text-black text-[10px] font-black flex items-center gap-1 border border-white/20">
                <Star size={10} fill="currentColor" /> {anime.userScore}/10
              </div>
            ) : (
              <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-yellow-500 text-[10px] font-black flex items-center gap-1 border border-white/10">
                <Star size={10} fill="currentColor" /> {anime.averageScore || '??'}%
              </div>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3">
             <div className="flex flex-wrap gap-1.5">
              {anime.genres?.slice(0, 2).map(g => (
                <span key={g} className="text-[9px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-md text-white/60">{g}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 flex-grow flex flex-col justify-between bg-gradient-to-b from-transparent to-white/[0.02]">
          <div>
            <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-satori-accent transition-colors mb-2">
              {anime.title}
            </h3>
            <div className="flex flex-wrap gap-1 mb-3">
              {anime.genres?.slice(0, 2).map(g => (
                <span key={g} className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">{g}</span>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-satori-muted border-t border-white/[0.05] pt-3">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} className="text-satori-accent" />
              {anime.year || '????'}
            </span>
            <span className={`px-2 py-0.5 rounded-md border ${
              anime.status === 'FINISHED' 
                ? 'bg-green-500/5 border-green-500/20 text-green-400' 
                : 'bg-satori-accent/5 border-satori-accent/20 text-satori-accent'
            }`}>
              {anime.status?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default AnimeCard;
