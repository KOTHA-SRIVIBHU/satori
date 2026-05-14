import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';

const MyList = () => {
  const { user } = useContext(AuthContext);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchList = async () => {
      try {
        const { data } = await api.get('/user/list');
        setList(data.data);
      } catch (err) {
        console.error('Failed to fetch list', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchList();
    }
  }, [user]);

  const statuses = ['ALL', 'CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED', 'PAUSED'];

  const filteredList = filter === 'ALL' 
    ? list 
    : list.filter(item => item.status === filter);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white">
        <p className="text-xl">Please login to view your list.</p>
      </div>
    );
  }

  return (
    <div className="py-10 px-8">
      <h1 className="text-4xl font-black text-white mb-8 tracking-tighter">MY ANIME LIST</h1>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              filter === s 
                ? 'bg-satori-accent text-white' 
                : 'bg-white/5 text-satori-muted hover:bg-white/10'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white">Loading your journey...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={item.animeId}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex gap-4 p-4 hover:border-satori-accent/50 transition-all"
            >
              <img 
                src={item.anime.coverImage || 'https://via.placeholder.com/100x150'} 
                alt={item.anime.title.romaji}
                className="w-24 h-36 object-cover rounded-lg shadow-lg"
              />
              <div className="flex flex-col justify-between py-1">
                <div>
                  <h3 className="text-white font-bold leading-tight line-clamp-2">
                    {item.anime.title.english || item.anime.title.romaji}
                  </h3>
                  <span className="text-xs font-bold text-satori-accent uppercase tracking-widest mt-2 block">
                    {item.status}
                  </span>
                </div>
                <div className="text-satori-muted text-sm">
                  Score: <span className="text-white font-mono">{item.score || 'N/A'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredList.length === 0 && (
        <div className="text-center py-20 text-satori-muted">
          No anime found in this category.
        </div>
      )}
    </div>
  );
};

export default MyList;
