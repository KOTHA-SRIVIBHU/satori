import { useState, useEffect } from 'react';
import { getSeasonalTrends } from '../services/api';
import { TrendingUp, BarChart2, Star, PlayCircle } from 'lucide-react';
import AnimeCard from '../components/AnimeCard';

const TrendPredictor = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await getSeasonalTrends();
        setTrends(response.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load trend predictions");
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-satori-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 mt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            <TrendingUp size={36} className="text-satori-accent" /> Most Anticipated
          </h1>
          <p className="text-satori-muted text-sm max-w-2xl">
            Satori pulls the upcoming season's most hyped anime and analyzes their source material and prequels to identify guaranteed smash hits.
          </p>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {trends.map((anime, index) => (
            <div key={anime.anime_id} className="relative group">
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-satori-accent text-white font-black rounded-full flex items-center justify-center z-20 shadow-lg shadow-satori-accent/40 border-2 border-satori-dark">
                #{index + 1}
              </div>
              
              <AnimeCard 
                anime={{
                  id: anime.anime_id,
                  title: anime.title,
                  image: anime.image,
                  xai_reason: anime.xai_reason,
                }} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendPredictor;
