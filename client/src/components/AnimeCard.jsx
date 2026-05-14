import { Link } from 'react-router-dom';

const AnimeCard = ({ anime }) => {
  return (
    <Link to={`/anime/${anime.id}`} className="group bg-satori-card rounded-xl overflow-hidden border border-white/5 hover:border-satori-accent/50 transition-all cursor-pointer block">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img src={anime.image} alt={anime.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-yellow-500 text-xs font-bold flex items-center gap-1">
          ★ {anime.averageScore || '??'}%
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-sm line-clamp-1 group-hover:text-satori-accent transition-colors mb-2">{anime.title}</h3>
        <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-satori-muted">
          <span>{anime.year || '????'}</span>
          <span className={`px-2 py-0.5 rounded ${anime.status === 'FINISHED' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
            {anime.status}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default AnimeCard;
