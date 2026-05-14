import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Star, Users, Calendar, Tv } from 'lucide-react';

const Details = () => {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) return <div className="p-20 text-center animate-pulse text-satori-accent">Loading Intelligence...</div>;
  if (!anime) return <div className="p-20 text-center">Anime not found.</div>;

  return (
    <div className="max-w-6xl mx-auto p-8 animate-in fade-in duration-700">
      <Link to="/" className="flex items-center gap-2 text-satori-muted hover:text-satori-accent mb-8 transition-colors">
        <ArrowLeft size={20} /> Back to Explorer
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Left: Poster */}
        <div className="md:col-span-1">
          <img src={anime.coverImage} alt={anime.title?.english} className="w-full rounded-3xl shadow-2xl border border-white/5" />

          <div className="mt-6 flex flex-wrap gap-2">
            {anime.genres?.map(g => (
              <span key={g} className="px-3 py-1 bg-satori-accent/10 border border-satori-accent/20 text-satori-accent rounded-full text-xs font-medium">
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="md:col-span-2">
          <h1 className="text-5xl font-black mb-2">{anime.title?.english || anime.title?.romaji}</h1>
          <p className="text-2xl text-satori-muted font-light mb-6 uppercase tracking-widest">{anime.format}</p>

          <div className="flex gap-8 mb-8 bg-satori-card p-6 rounded-2xl border border-white/5">
            <div className="text-center">
              <p className="text-satori-muted text-xs uppercase mb-1">Score</p>
              <div className="flex items-center gap-1 text-xl font-bold text-yellow-500">
                <Star size={18} fill="currentColor" /> {anime.averageScore}%
              </div>
            </div>
            <div className="text-center border-l border-white/10 pl-8">
              <p className="text-satori-muted text-xs uppercase mb-1">Popularity</p>
              <div className="flex items-center gap-1 text-xl font-bold text-blue-400">
                <Users size={18} /> {anime.popularity?.toLocaleString()}
              </div>
            </div>
            <div className="text-center border-l border-white/10 pl-8">
              <p className="text-satori-muted text-xs uppercase mb-1">Status</p>
              <div className="flex items-center gap-1 text-xl font-bold text-green-400">
                <Tv size={18} /> {anime.status}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-satori-card p-4 rounded-xl border border-white/5">
              <p className="text-satori-muted text-[10px] uppercase tracking-wider mb-1">Released</p>
              <p className="font-bold">
                {anime.startDate?.year ? (
                  <>
                    {anime.startDate.day && `${anime.startDate.day}/`}
                    {anime.startDate.month && `${anime.startDate.month}/`}
                    {anime.startDate.year}
                  </>
                ) : '?'}
              </p>
            </div>
            <div className="bg-satori-card p-4 rounded-xl border border-white/5">
              <p className="text-satori-muted text-[10px] uppercase tracking-wider mb-1">Status</p>
              <p className={`font-bold ${anime.status === 'FINISHED' ? 'text-green-400' : 'text-blue-400'}`}>
                {anime.status || '?'}
              </p>
            </div>
            <div className="bg-satori-card p-4 rounded-xl border border-white/5">
              <p className="text-satori-muted text-[10px] uppercase tracking-wider mb-1">Episodes</p>
              <p className="font-bold">{anime.episodes || '?'}</p>
            </div>
            <div className="bg-satori-card p-4 rounded-xl border border-white/5">
              <p className="text-satori-muted text-[10px] uppercase tracking-wider mb-1">Studios</p>
              <p className="font-bold truncate" title={anime.studios?.join(', ')}>
                {anime.studios?.length > 0 ? anime.studios[0] : '?'}
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Synopsis</h2>
          <div
            className="text-satori-muted leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ __html: anime.description }}
          />
        </div>
      </div>
    </div>
  );
};

export default Details;
