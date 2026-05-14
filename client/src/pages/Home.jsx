import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AnimeCard from '../components/AnimeCard';
import { Search as SearchIcon, Loader2, Zap } from 'lucide-react';

const Home = () => {
  const [query, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();

  // Debounced Autocomplete Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 2) {
        setIsTyping(true);
        try {
          const { data } = await api.get(`/anime/search?q=${query}`);
          setSuggestions(data.data.slice(0, 5)); // Show top 5 suggestions
        } catch (err) {
          console.error("Autocomplete failed", err);
        } finally {
          setIsTyping(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 400); // 400ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    setLoading(true);
    setSuggestions([]); // Close suggestions on full search
    try {
      const { data } = await api.get(`/anime/search?q=${query}`);
      setResults(data.data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (anime) => {
    setQ(anime.title);
    setSuggestions([]);
    navigate(`/anime/${anime.id}`);
  };

  return (
    <div className="p-8">
      {/* Hero Section */}
      <div className="max-w-2xl mx-auto text-center mb-12 mt-10">
        <h1 className="text-5xl font-extrabold mb-4">Discover your next <span className="text-satori-accent text-shadow-glow">obsession</span>.</h1>
        <p className="text-satori-muted text-lg mb-8 tracking-wide">AI-powered insights for every anime in the universe.</p>

        <div className="relative group z-50">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search anime (e.g., 'One Piece')..."
              className="w-full bg-satori-card border border-white/10 rounded-2xl py-4 px-6 pl-14 text-lg focus:outline-none focus:border-satori-accent transition-all shadow-2xl"
              value={query}
              onChange={(e) => setQ(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestions([]), 200)} // Delay to allow clicks
            />
            <SearchIcon className="absolute left-5 top-5 text-satori-muted group-focus-within:text-satori-accent transition-colors" />
            
            {isTyping && (
              <div className="absolute right-32 top-5">
                <Loader2 className="animate-spin text-satori-accent" size={20} />
              </div>
            )}

            <button className="absolute right-3 top-2.5 bg-satori-accent hover:bg-satori-accent/80 text-white px-6 py-2 rounded-xl transition-all font-bold">
              Search
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute mt-2 w-full bg-satori-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              {suggestions.map((anime) => (
                <div
                  key={anime.id}
                  onClick={() => selectSuggestion(anime)}
                  className="flex items-center gap-4 p-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                >
                  <img src={anime.image} className="w-10 h-14 object-cover rounded-lg" alt={anime.title} />
                  <div className="text-left">
                    <p className="font-bold text-sm text-satori-text">{anime.title}</p>
                    <p className="text-xs text-satori-muted flex items-center gap-2">
                      <Zap size={12} className="text-satori-accent" /> {anime.year} • {anime.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex justify-center mt-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-satori-accent" size={48} />
            <p className="text-satori-muted animate-pulse">Consulting Satori Brain...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {results.map(anime => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="text-center mt-20">
          <p className="text-satori-muted text-xl">No results found for "{query}". Try checking the spelling!</p>
        </div>
      )}
    </div>
  );
};

export default Home;
